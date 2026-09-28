"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MAX_ASSET_BYTES,
  validateGlbFile,
} = require("./settings-asset-validation.cjs");

test("settings-asset-validation exports GLB helpers", () => {
  assert.equal(typeof validateGlbFile, "function");
  assert.equal(MAX_ASSET_BYTES, 200 * 1024 * 1024);
});
