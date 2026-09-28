"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildReadableStoredFilename,
  shortAssetId,
  syncSourceBasename,
  validStoredVrmaFilename,
} = require("./clip-storage.cjs");

const ID = "a1b2c3d4-e5f6-4789-a012-3456789abcde";

test("buildReadableStoredFilename embeds clip name and id prefix", () => {
  assert.equal(shortAssetId(ID), "a1b2c3d4");
  assert.equal(
    buildReadableStoredFilename(ID, "wave-soft"),
    "wave-soft--a1b2c3d4.vrma",
  );
});

test("validStoredVrmaFilename accepts legacy uuid and readable forms", () => {
  assert.equal(validStoredVrmaFilename(ID, `${ID}.vrma`), true);
  assert.equal(
    validStoredVrmaFilename(ID, "wave-soft--a1b2c3d4.vrma"),
    true,
  );
  assert.equal(validStoredVrmaFilename(ID, "../x.vrma"), false);
  assert.equal(validStoredVrmaFilename(ID, "wave-soft--deadbeef.vrma"), false);
});

test("syncSourceBasename mirrors display name for matching", () => {
  assert.equal(syncSourceBasename("idle-breathe"), "idle-breathe.vrma");
});
