"use strict";

/**
 * Native helper 失敗分類（純邏輯）。
 * 優先使用 helper 分型 exit code／NDJSON `code`；再退回訊息啟發式。
 */

const { LISTENER_STATE } = require("./listener-status.cjs");

const NATIVE_HELPER_ERROR = Object.freeze({
  UNKNOWN: "native_helper_unknown",
  MISSING_BINARY: "native_helper_missing",
  SPAWN_FAILED: "native_helper_spawn_failed",
  EXIT_NONZERO: "native_helper_exit_nonzero",
  USAGE: "native_helper_usage",
  DEVICE_ERROR: "native_helper_device_error",
  COM_ERROR: "native_helper_com_error",
  WASAPI_ERROR: "native_helper_wasapi_error",
  EVENT_ERROR: "native_helper_event_error",
  PERMISSION: "native_helper_permission",
});

/** 與 native/windows/VoxAvatarAudioListener.cpp HelperExit 對齊。 */
const NATIVE_HELPER_EXIT_CODE = Object.freeze({
  OK: 0,
  GENERIC: 1,
  USAGE: 2,
  COM: 10,
  WASAPI: 11,
  DEVICE: 12,
  EVENT: 13,
});

/**
 * @param {number|null} exitCode
 * @returns {{ code: string, listenerState: string, detail: string } | null}
 */
function classifyByTypedExitCode(exitCode) {
  if (exitCode == null) return null;
  switch (exitCode) {
    case NATIVE_HELPER_EXIT_CODE.USAGE:
      return {
        code: NATIVE_HELPER_ERROR.USAGE,
        listenerState: LISTENER_STATE.LAUNCH_FAILED,
        detail: `exit:${exitCode}`,
      };
    case NATIVE_HELPER_EXIT_CODE.COM:
      return {
        code: NATIVE_HELPER_ERROR.COM_ERROR,
        listenerState: LISTENER_STATE.LAUNCH_FAILED,
        detail: `exit:${exitCode}`,
      };
    case NATIVE_HELPER_EXIT_CODE.WASAPI:
      return {
        code: NATIVE_HELPER_ERROR.WASAPI_ERROR,
        listenerState: LISTENER_STATE.LAUNCH_FAILED,
        detail: `exit:${exitCode}`,
      };
    case NATIVE_HELPER_EXIT_CODE.EVENT:
      return {
        code: NATIVE_HELPER_ERROR.EVENT_ERROR,
        listenerState: LISTENER_STATE.LAUNCH_FAILED,
        detail: `exit:${exitCode}`,
      };
    case NATIVE_HELPER_EXIT_CODE.DEVICE:
      return {
        code: NATIVE_HELPER_ERROR.DEVICE_ERROR,
        listenerState: LISTENER_STATE.NO_OUTPUT,
        detail: `exit:${exitCode}`,
      };
    default:
      return null;
  }
}

/**
 * @param {{
 *   exitCode?: number|null,
 *   signal?: string|null,
 *   message?: string|null,
 *   code?: number|null,
 * }} input
 * @returns {{ code: string, listenerState: string, detail: string }}
 */
function classifyNativeHelperFailure(input = {}) {
  const message = String(input.message ?? "").trim();
  const detail = message || (input.signal ? `signal:${input.signal}` : "");
  const typedCodeRaw = input.code ?? input.exitCode;
  const typedCode =
    typedCodeRaw == null || !Number.isFinite(Number(typedCodeRaw))
      ? null
      : Math.trunc(Number(typedCodeRaw));
  const fromTyped = classifyByTypedExitCode(typedCode);
  if (fromTyped) {
    return {
      ...fromTyped,
      detail: message || fromTyped.detail,
    };
  }

  if (/ENOENT|not found|missing helper|cannot find/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.MISSING_BINARY,
      listenerState: LISTENER_STATE.MISSING,
      detail: message || NATIVE_HELPER_ERROR.MISSING_BINARY,
    };
  }
  if (/EACCES|access denied|permission/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.PERMISSION,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.PERMISSION,
    };
  }
  if (/WASAPI|audio client|endpoint|loopback audio/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.WASAPI_ERROR,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.WASAPI_ERROR,
    };
  }
  if (/COM|CoInitialize|HRESULT/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.COM_ERROR,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.COM_ERROR,
    };
  }
  if (/device|no playback|no output/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.DEVICE_ERROR,
      listenerState: LISTENER_STATE.NO_OUTPUT,
      detail: message || NATIVE_HELPER_ERROR.DEVICE_ERROR,
    };
  }
  if (/spawn|EPERM|EINVAL|--pid|--output/i.test(message)) {
    return {
      code: /--pid|--output|required/i.test(message)
        ? NATIVE_HELPER_ERROR.USAGE
        : NATIVE_HELPER_ERROR.SPAWN_FAILED,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.SPAWN_FAILED,
    };
  }
  if (typedCode != null && typedCode !== 0) {
    return {
      code: NATIVE_HELPER_ERROR.EXIT_NONZERO,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: detail || `exit:${typedCode}`,
    };
  }
  if (/spawn|EPERM|EINVAL/i.test(String(input.signal ?? ""))) {
    return {
      code: NATIVE_HELPER_ERROR.SPAWN_FAILED,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: detail || NATIVE_HELPER_ERROR.SPAWN_FAILED,
    };
  }
  return {
    code: NATIVE_HELPER_ERROR.UNKNOWN,
    listenerState: LISTENER_STATE.LAUNCH_FAILED,
    detail: detail || NATIVE_HELPER_ERROR.UNKNOWN,
  };
}

module.exports = {
  NATIVE_HELPER_ERROR,
  NATIVE_HELPER_EXIT_CODE,
  classifyByTypedExitCode,
  classifyNativeHelperFailure,
};
