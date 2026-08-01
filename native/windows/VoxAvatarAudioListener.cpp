#define WIN32_LEAN_AND_MEAN
#include <windows.h>

#include <audioclient.h>
#include <audioclientactivationparams.h>
#include <mmdeviceapi.h>
#include <propidl.h>
#include <wrl/client.h>
#include <wrl/implements.h>

#include <algorithm>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>

#pragma comment(lib, "Mmdevapi.lib")
#pragma comment(lib, "Ole32.lib")

using Microsoft::WRL::ComPtr;
using Microsoft::WRL::FtmBase;
using Microsoft::WRL::RuntimeClass;
using Microsoft::WRL::RuntimeClassFlags;
using Microsoft::WRL::ClassicCom;

namespace {

std::atomic<bool> running{true};

std::string jsonEscape(const std::string& input) {
  std::ostringstream result;
  for (const unsigned char character : input) {
    switch (character) {
      case '"': result << "\\\""; break;
      case '\\': result << "\\\\"; break;
      case '\n': result << "\\n"; break;
      case '\r': result << "\\r"; break;
      case '\t': result << "\\t"; break;
      default:
        if (character < 0x20) {
          result << "\\u" << std::hex << std::setw(4) << std::setfill('0')
                 << static_cast<int>(character);
        } else {
          result << character;
        }
    }
  }
  return result.str();
}

void emitReady(const char* source) {
  std::cout << "{\"type\":\"ready\",\"source\":\"" << jsonEscape(source)
            << "\"}" << std::endl;
}

int fail(const char* message, HRESULT result = S_OK) {
  std::ostringstream detail;
  detail << message;
  if (FAILED(result)) {
    detail << " (HRESULT 0x" << std::hex << static_cast<unsigned long>(result) << ")";
  }
  std::cout << "{\"type\":\"error\",\"message\":\""
            << jsonEscape(detail.str()) << "\"}" << std::endl;
  return 1;
}

BOOL WINAPI handleConsoleSignal(DWORD signal) {
  if (signal == CTRL_C_EVENT || signal == CTRL_BREAK_EVENT || signal == CTRL_CLOSE_EVENT) {
    running.store(false, std::memory_order_relaxed);
    return TRUE;
  }
  return FALSE;
}

class ActivationHandler final
    : public RuntimeClass<
          RuntimeClassFlags<ClassicCom>,
          FtmBase,
          IActivateAudioInterfaceCompletionHandler> {
 public:
  ActivationHandler() : completed(CreateEventW(nullptr, FALSE, FALSE, nullptr)) {}
  ~ActivationHandler() {
    if (completed != nullptr) CloseHandle(completed);
  }

  STDMETHODIMP ActivateCompleted(
      IActivateAudioInterfaceAsyncOperation* operation) override {
    ComPtr<IUnknown> audioInterface;
    HRESULT activationResult = E_UNEXPECTED;
    result = operation->GetActivateResult(&activationResult, &audioInterface);
    if (SUCCEEDED(result)) result = activationResult;
    if (SUCCEEDED(result)) result = audioInterface.As(&client);
    SetEvent(completed);
    return S_OK;
  }

  HANDLE completed = nullptr;
  HRESULT result = E_UNEXPECTED;
  ComPtr<IAudioClient> client;
};

HRESULT activateProcessLoopback(DWORD processId, ComPtr<IAudioClient>& audioClient) {
  AUDIOCLIENT_ACTIVATION_PARAMS activationParameters{};
  activationParameters.ActivationType = AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
  activationParameters.ProcessLoopbackParams.TargetProcessId = processId;
  activationParameters.ProcessLoopbackParams.ProcessLoopbackMode =
      PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE;

  PROPVARIANT parameters{};
  parameters.vt = VT_BLOB;
  parameters.blob.cbSize = sizeof(activationParameters);
  parameters.blob.pBlobData = reinterpret_cast<BYTE*>(&activationParameters);

  auto handler = Microsoft::WRL::Make<ActivationHandler>();
  if (!handler || handler->completed == nullptr) return E_OUTOFMEMORY;

  ComPtr<IActivateAudioInterfaceAsyncOperation> operation;
  HRESULT result = ActivateAudioInterfaceAsync(
      VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK,
      __uuidof(IAudioClient),
      &parameters,
      handler.Get(),
      &operation);
  if (FAILED(result)) return result;
  if (WaitForSingleObject(handler->completed, 10'000) != WAIT_OBJECT_0) {
    return HRESULT_FROM_WIN32(ERROR_TIMEOUT);
  }
  if (FAILED(handler->result)) return handler->result;
  audioClient = handler->client;
  return S_OK;
}

double packetSquareSum(
    const BYTE* data,
    UINT32 frames,
    UINT32 channels,
    DWORD flags,
    std::size_t& sampleCount) {
  sampleCount = static_cast<std::size_t>(frames) * channels;
  if ((flags & AUDCLNT_BUFFERFLAGS_SILENT) != 0 || data == nullptr) return 0.0;
  const auto* samples = reinterpret_cast<const std::int16_t*>(data);
  double squareSum = 0.0;
  for (std::size_t index = 0; index < sampleCount; ++index) {
    const double sample = static_cast<double>(samples[index]) / 32768.0;
    squareSum += sample * sample;
  }
  return squareSum;
}

}  // namespace

int wmain(int argc, wchar_t* argv[]) {
  DWORD processId = 0;
  for (int index = 1; index < argc; ++index) {
    if (wcscmp(argv[index], L"--self-test") == 0) {
      emitReady("Windows self-test");
      return 0;
    }
    if (wcscmp(argv[index], L"--pid") == 0 && index + 1 < argc) {
      processId = wcstoul(argv[++index], nullptr, 10);
    }
  }
  if (processId == 0) return fail("A valid --pid is required.");

  SetConsoleOutputCP(CP_UTF8);
  SetConsoleCtrlHandler(handleConsoleSignal, TRUE);
  HRESULT result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
  if (FAILED(result)) return fail("Unable to initialize COM.", result);

  ComPtr<IAudioClient> audioClient;
  result = activateProcessLoopback(processId, audioClient);
  if (FAILED(result)) {
    CoUninitialize();
    return fail("Unable to activate Windows process-loopback audio.", result);
  }

  WAVEFORMATEX format{};
  format.wFormatTag = WAVE_FORMAT_PCM;
  format.nChannels = 2;
  format.nSamplesPerSec = 48'000;
  format.wBitsPerSample = 16;
  format.nBlockAlign = format.nChannels * format.wBitsPerSample / 8;
  format.nAvgBytesPerSec = format.nSamplesPerSec * format.nBlockAlign;

  result = audioClient->Initialize(
      AUDCLNT_SHAREMODE_SHARED,
      AUDCLNT_STREAMFLAGS_LOOPBACK |
          AUDCLNT_STREAMFLAGS_EVENTCALLBACK |
          AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM |
          AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY,
      0,
      0,
      &format,
      nullptr);
  if (FAILED(result)) {
    audioClient.Reset();
    CoUninitialize();
    return fail("Unable to initialize Windows process-loopback audio.", result);
  }

  HANDLE sampleReady = CreateEventW(nullptr, FALSE, FALSE, nullptr);
  if (sampleReady == nullptr) {
    audioClient.Reset();
    CoUninitialize();
    return fail("Unable to create the Windows audio event.", HRESULT_FROM_WIN32(GetLastError()));
  }
  result = audioClient->SetEventHandle(sampleReady);
  ComPtr<IAudioCaptureClient> captureClient;
  if (SUCCEEDED(result)) result = audioClient->GetService(IID_PPV_ARGS(&captureClient));
  if (SUCCEEDED(result)) result = audioClient->Start();
  if (FAILED(result)) {
    CloseHandle(sampleReady);
    captureClient.Reset();
    audioClient.Reset();
    CoUninitialize();
    return fail("Unable to start Windows process-loopback audio.", result);
  }

  emitReady("Windows process audio");
  while (running.load(std::memory_order_relaxed)) {
    const DWORD wait = WaitForSingleObject(sampleReady, 250);
    if (wait != WAIT_OBJECT_0 && wait != WAIT_TIMEOUT) break;

    double squareSum = 0.0;
    std::size_t sampleCount = 0;
    UINT32 nextFrames = 0;
    while (SUCCEEDED(captureClient->GetNextPacketSize(&nextFrames)) && nextFrames > 0) {
      BYTE* data = nullptr;
      UINT32 frames = 0;
      DWORD flags = 0;
      result = captureClient->GetBuffer(&data, &frames, &flags, nullptr, nullptr);
      if (FAILED(result)) break;
      std::size_t packetSamples = 0;
      squareSum += packetSquareSum(data, frames, format.nChannels, flags, packetSamples);
      sampleCount += packetSamples;
      captureClient->ReleaseBuffer(frames);
    }
    const double rms =
        sampleCount == 0 ? 0.0 : std::sqrt(squareSum / static_cast<double>(sampleCount));
    const double level = std::clamp((rms - 0.0025) * 7.5, 0.0, 1.0);
    std::cout << "{\"type\":\"level\",\"level\":" << std::fixed
              << std::setprecision(6) << level << "}" << std::endl;
  }

  audioClient->Stop();
  CloseHandle(sampleReady);
  captureClient.Reset();
  audioClient.Reset();
  CoUninitialize();
  return 0;
}
