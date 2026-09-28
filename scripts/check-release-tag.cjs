"use strict";

const path = require("node:path");

const packageVersion = require(path.join(__dirname, "..", "package.json")).version;

function expectedReleaseTag(version = packageVersion) {
  return `v${version}`;
}

function validateReleaseTag(tag, version = packageVersion) {
  const expected = expectedReleaseTag(version);
  if (tag !== expected) {
    throw new Error(`Release tag ${JSON.stringify(tag)} must match ${expected}.`);
  }
  return expected;
}

if (require.main === module) {
  try {
    validateReleaseTag(process.argv[2]);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = { expectedReleaseTag, validateReleaseTag };
