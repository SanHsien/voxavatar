"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { removeStoredFile } = require("./settings-store-catalog.cjs");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

test("removeStoredFile deletes existing files and ignores missing ones", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-catalog-"));
  const file = path.join(dir, "clip.vrma");
  fs.writeFileSync(file, "x");
  removeStoredFile(dir, "clip.vrma");
  assert.equal(fs.existsSync(file), false);
  assert.doesNotThrow(() => removeStoredFile(dir, "missing.vrma"));
  fs.rmSync(dir, { recursive: true, force: true });
});
