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
