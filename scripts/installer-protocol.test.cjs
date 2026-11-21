"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const readHook = () => fs.readFileSync(path.join(root, "build/installer.nsh"), "utf8");
const macro = (name) => {
  const match = readHook().match(new RegExp("!macro " + name + "\\s*\\n([\\s\\S]*?)!macroend", "u"));
  assert.ok(match, "missing " + name);
  return match[1].split("\n").map((line) => line.trim())
    .filter((line) => line && !line.startsWith(";"));
};

test("NSIS includes the protocol cleanup hook in the shipped installer", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.build.nsis.include, "build/installer.nsh");
});

test("uninstall deletes only the exact installed command and preserves registrations during upgrade", () => {
  // Pin the whole block: prefix matching could delete another installation.
  assert.deepEqual(macro("customUnInstall"), [
  "Push $0",
  "${IfNot} ${isUpdated}",
  "ReadRegStr $0 HKCU \"Software\\Classes\\voxavatar\\shell\\open\\command\" \"\"",
  "${If} $0 == '$\\\"$INSTDIR\\${APP_EXECUTABLE_FILENAME}$\\\" $\\\"%1$\\\"'",
  "DeleteRegKey HKCU \"Software\\Classes\\voxavatar\"",
  "${EndIf}",
  "${EndIf}",
  "Pop $0"
]);
  assert.equal((readHook().match(/DeleteRegKey/gu) || []).length, 1);
});

test("silent upgrade restores protocol registration without launching the app", () => {
  assert.deepEqual(macro("customInstall"), [
  "WriteRegStr HKCU \"Software\\Classes\\voxavatar\" \"\" \"URL:VoxAvatar Protocol\"",
  "WriteRegStr HKCU \"Software\\Classes\\voxavatar\" \"URL Protocol\" \"\"",
  "WriteRegStr HKCU \"Software\\Classes\\voxavatar\\shell\\open\\command\" \"\" '$\\\"$INSTDIR\\${APP_EXECUTABLE_FILENAME}$\\\" $\\\"%1$\\\"'"
]);
  const main = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");
  assert.ok(main.includes("if (app.isPackaged) app.setAsDefaultProtocolClient(protocolScheme);"));
});

test("a running app is asked to quit, then waited for, before files are touched", () => {
  // 2026-11-21: the stock check gave up after two short rounds while the
  // killed processes were still listed, so `/S` removed nothing. Pin the whole
  // block: the order (ask, wait, force, keep waiting, fail loudly) is the fix.
  assert.deepEqual(macro("customCheckAppRunning"), [
    "Push $R0",
    "Push $R1",
    "Push $R2",
    "!insertmacro voxFindRunningApp $R0",
    "${If} $R0 == 0",
    "${If} ${isUpdated}",
    "Sleep 1300",
    "${ElseIf} ${Cmd} `MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \"$(appRunning)\" /SD IDOK IDCANCEL`",
    "Quit",
    "${EndIf}",
    "DetailPrint \"$(appClosing)\"",
    "${If} ${FileExists} \"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\"",
    "Exec '\"$INSTDIR\\${APP_EXECUTABLE_FILENAME}\" --quit'",
    "${EndIf}",
    "StrCpy $R1 0",
    "${Do}",
    "Sleep 500",
    "!insertmacro voxFindRunningApp $R0",
    "${If} $R0 != 0",
    "${ExitDo}",
    "${EndIf}",
    "IntOp $R1 $R1 + 1",
    "IntOp $R2 $R1 % ${VOX_FORCE_CLOSE_EVERY_STEPS}",
    "${If} $R2 == 0",
    "${nsProcess::KillProcess} \"${APP_EXECUTABLE_FILENAME}\" $R2",
    "${nsProcess::KillProcess} \"${VOX_HELPER_FILENAME}\" $R2",
    "${EndIf}",
    "${If} $R1 >= ${VOX_CLOSE_WAIT_STEPS}",
    "${If} ${Cmd} `MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION \"$(appCannotBeClosed)\" /SD IDCANCEL IDRETRY`",
    "StrCpy $R1 0",
    "${Else}",
    "SetErrorLevel 2",
    "Quit",
    "${EndIf}",
    "${EndIf}",
    "${Loop}",
    "${EndIf}",
    "${nsProcess::Unload}",
    "Pop $R2",
    "Pop $R1",
    "Pop $R0",
  ]);
});

test("the close check also waits for the native helper, which locks its own file", () => {
  assert.deepEqual(macro("voxFindRunningApp _RESULT"), [
    "${nsProcess::FindProcess} \"${APP_EXECUTABLE_FILENAME}\" ${_RESULT}",
    "${If} ${_RESULT} != 0",
    "${nsProcess::FindProcess} \"${VOX_HELPER_FILENAME}\" ${_RESULT}",
    "${EndIf}",
  ]);
  const hook = readHook();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const helper = path.basename(pkg.build.win.extraResources[0].to);
  assert.ok(hook.includes(`!define VOX_HELPER_FILENAME "${helper}"`));
});

test("the close wait outlasts the slowest process exit seen after a forced kill", () => {
  // 2026-11-21: killed processes stayed listed for 104.5 s on the busy host.
  const define = (name) => Number(readHook().match(new RegExp(`!define ${name} (\\d+)`, "u"))?.[1]);
  const stepMs = 500;
  assert.ok(define("VOX_CLOSE_WAIT_STEPS") * stepMs >= 150_000);
  const forceAfterMs = define("VOX_FORCE_CLOSE_EVERY_STEPS") * stepMs;
  assert.ok(forceAfterMs >= 5_000, "give a clean quit time before forcing");
  assert.ok(forceAfterMs <= 30_000);
});

test("the quit argument the installer sends is the one the app understands", () => {
  const { QUIT_ARGUMENT } = require("../electron/quit-request.cjs");
  assert.ok(readHook().includes(`\${APP_EXECUTABLE_FILENAME}" ${QUIT_ARGUMENT}'`));
});
