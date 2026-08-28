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

describe("menuStrings locale parity", () => {
  it("zh-TW and en expose the same keys", () => {
    const { LOCALES } = require("./i18n.cjs");
    assert.deepEqual(
      Object.keys(LOCALES["zh-TW"]).sort(),
      Object.keys(LOCALES.en).sort(),
    );
  });

  it("keeps About signing placeholders and non-empty labels", () => {
    for (const locale of ["zh-TW", "en"]) {
      const strings = menuStrings(locale);
      assert.match(strings.aboutDetail, /\{version\}/);
      assert.match(strings.aboutDetail, /\{signingStatus\}/);
      assert.ok(String(strings.signingNotSigned).length > 0);
      assert.ok(String(strings.about).length > 0);
    }
  });
});
