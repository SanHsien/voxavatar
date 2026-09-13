"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { releaseFiles, writeChecksums } = require("./write-checksums.cjs");

test("writes stable SHA-256 entries for Windows installers and ignores unpacked files", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-checksums-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.writeFileSync(
    path.join(directory, "VoxAvatar-0.1.0-beta.0-windows-x64-setup.exe"),
    "voxavatar",
  );
  fs.writeFileSync(path.join(directory, "builder-debug.yml"), "internal");

  assert.deepEqual(releaseFiles(directory), [
    "VoxAvatar-0.1.0-beta.0-windows-x64-setup.exe",
  ]);
  const output = writeChecksums(directory);
  assert.match(
    fs.readFileSync(output, "utf8"),
    /^[a-f0-9]{64} {2}VoxAvatar-0\.1\.0-beta\.0-windows-x64-setup\.exe\n$/,
  );
});
