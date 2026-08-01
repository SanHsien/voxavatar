"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { windowsBuildCommand } = require("./build-native.cjs");

test("emits one complete Windows compiler invocation after the developer shell", () => {
  const command = windowsBuildCommand(
    "C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise\\Common7\\Tools\\VsDevCmd.bat",
  );
  assert.equal(
    command,
    'call "C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise\\Common7\\Tools\\VsDevCmd.bat" -no_logo -arch=x64 -host_arch=x64 && cl.exe /nologo /std:c++20 /EHsc /O2 /DUNICODE /D_UNICODE native\\windows\\VoxAvatarAudioListener.cpp /Fe:native\\bin\\win32\\voxavatar-audio-listener.exe',
  );
  assert.equal(command.split(" && ").length, 2);
});
