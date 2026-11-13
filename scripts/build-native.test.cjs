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
    'call "C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise\\Common7\\Tools\\VsDevCmd.bat" -no_logo -arch=x64 -host_arch=x64 && cl.exe /nologo /utf-8 /std:c++20 /EHsc /O2 /DUNICODE /D_UNICODE native\\windows\\VoxAvatarAudioListener.cpp /Fe:native\\bin\\win32\\voxavatar-audio-listener.exe',
  );
  assert.equal(command.split(" && ").length, 2);
});

test("compiles UTF-8 sources as UTF-8 so non-English Windows code pages do not break the native build", () => {
  // Without /utf-8, MSVC reads the source with the system ANSI code page (e.g. CP950 on
  // zh-TW Windows); the Chinese comments in VoxAvatarAudioListener.cpp then swallow
  // line breaks and the build fails with C2059/C2143.
  const command = windowsBuildCommand("C:\\VsDevCmd.bat");
  assert.match(command, /\scl\.exe\s[^&]*\/utf-8\s/);
});
