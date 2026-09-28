"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  expectedReleaseTag,
  validateReleaseTag,
} = require("./check-release-tag.cjs");

test("release tags exactly match the package version", () => {
  assert.equal(expectedReleaseTag("2.4.1"), "v2.4.1");
  assert.equal(validateReleaseTag("v2.4.1", "2.4.1"), "v2.4.1");
  assert.throws(
    () => validateReleaseTag("v2.4.0", "2.4.1"),
    /must match v2\.4\.1/,
  );
  assert.throws(
    () => validateReleaseTag(undefined, "2.4.1"),
    /must match v2\.4\.1/,
  );
});
