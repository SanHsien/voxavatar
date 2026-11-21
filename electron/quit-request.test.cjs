"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { QUIT_ARGUMENT, isQuitRequest } = require("./quit-request.cjs");

const exe = "C:\\Users\\user\\AppData\\Local\\Programs\\VoxAvatar\\VoxAvatar.exe";

test("the uninstaller's quit argument is recognised after the executable path", () => {
  assert.equal(QUIT_ARGUMENT, "--quit");
  assert.equal(isQuitRequest([exe, "--quit"]), true);
  // Chromium appends its own switches to the argv forwarded to the first instance.
  assert.equal(isQuitRequest([exe, "--allow-file-access-from-files", "--quit"]), true);
  assert.equal(isQuitRequest(["electron.exe", ".", "--quit"]), true);
});

test("ordinary launches are never treated as a quit request", () => {
  assert.equal(isQuitRequest([exe]), false);
  assert.equal(isQuitRequest([exe, "--settings"]), false);
  assert.equal(isQuitRequest([exe, "--background"]), false);
  assert.equal(isQuitRequest([exe, "--quit-later"]), false);
  assert.equal(isQuitRequest(["--quit"]), false, "argv[0] is the executable, not an argument");
  assert.equal(isQuitRequest(null), false);
  assert.equal(isQuitRequest([exe, 7, undefined]), false);
});

test("a protocol launch cannot smuggle a quit request", () => {
  // A crafted voxavatar:// link must not be able to close the app.
  assert.equal(isQuitRequest([exe, "voxavatar://show", "--quit"]), false);
  assert.equal(isQuitRequest([exe, "--quit", "VoxAvatar://hide"]), false);
  assert.equal(isQuitRequest([exe, 'voxavatar://show" --quit']), false);
  assert.equal(isQuitRequest([exe, "other://x", "--quit"], "voxavatar"), true);
});

test("main process honours a quit request from both the first and a second instance", () => {
  // main.cjs cannot be loaded outside Electron, so pin the wiring in source.
  const source = fs.readFileSync(path.join(__dirname, "main.cjs"), "utf8");
  assert.match(
    source,
    /const hasInstanceLock = app\.requestSingleInstanceLock\(\);\s*if \(!hasInstanceLock \|\| isQuitRequest\(process\.argv, protocolScheme\)\) \{\s*app\.quit\(\);/,
    "the lock must be requested first (that forwards --quit), and a lone --quit instance must exit before creating windows",
  );
  assert.match(
    source,
    /app\.on\("second-instance", \(_event, argv\) => \{\s*if \(isQuitRequest\(argv, protocolScheme\)\) \{\s*isQuitting = true;\s*app\.quit\(\);\s*return;/,
    "the running instance must quit when a second instance forwards --quit",
  );
});
