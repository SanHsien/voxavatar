"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildMinimalPe32Fixture,
  inspectPeAuthenticodePresence,
} = require("./pe-authenticode-presence.cjs");

test("inspectPeAuthenticodePresence reports NotSigned when cert table empty", () => {
  const result = inspectPeAuthenticodePresence(
    buildMinimalPe32Fixture({ certificateTableSize: 0 }),
  );
  assert.equal(result.authenticodeStatus, "NotSigned");
  assert.equal(result.authenticodeEvidence, "pe-certificate-table-empty");
  assert.equal(result.certificateTableSize, 0);
});

test("inspectPeAuthenticodePresence reports Present when cert table nonempty", () => {
  const result = inspectPeAuthenticodePresence(
    buildMinimalPe32Fixture({ certificateTableSize: 2048 }),
  );
  assert.equal(result.authenticodeStatus, "Present");
  assert.equal(result.authenticodeEvidence, "pe-certificate-table-nonempty");
  assert.equal(result.certificateTableSize, 2048);
});

test("inspectPeAuthenticodePresence rejects non-PE buffers", () => {
  assert.throws(() => inspectPeAuthenticodePresence(Buffer.from("notpe")), /MZ|PE|small/i);
});
