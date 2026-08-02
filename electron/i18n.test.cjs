"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { formatAboutDetail, menuStrings } = require("./i18n.cjs");

describe("formatAboutDetail", () => {
  it("includes version and NotSigned for zh-TW", () => {
    const detail = formatAboutDetail("zh-TW", "0.16.14");
    assert.match(detail, /0\.16\.14/);
    assert.match(detail, /NotSigned|未簽署/);
    assert.match(detail, /SHA256SUMS/);
  });

  it("includes version and NotSigned for en", () => {
    const detail = formatAboutDetail("en", "0.16.14");
    assert.match(detail, /Version 0\.16\.14/);
    assert.match(detail, /NotSigned/);
    assert.doesNotMatch(detail, /\{version\}|\{signingStatus\}/);
  });

  it("accepts pre-resolved menu strings", () => {
    const detail = formatAboutDetail(menuStrings("en"), "1.2.3");
    assert.match(detail, /1\.2\.3/);
  });
});
