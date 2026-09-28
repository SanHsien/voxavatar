"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  normalizeDigest,
  parseSha256Sums,
  verifyReleaseEvidenceConsistency,
} = require("./verify-release-evidence.cjs");

test("parseSha256Sums and normalizeDigest handle GitHub digest form", () => {
  const map = parseSha256Sums(
    "e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d  VoxAvatar-0.16.14-windows-x64-setup.exe\n",
  );
  assert.equal(
    map.get("VoxAvatar-0.16.14-windows-x64-setup.exe"),
    "e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d",
  );
  assert.equal(
    normalizeDigest(
      "sha256:e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d",
    ),
    "e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d",
  );
});

test("verifyReleaseEvidenceConsistency accepts matching installer release metadata", () => {
  const sha =
    "e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d";
  const result = verifyReleaseEvidenceConsistency({
    manifest: {
      smokeExecuted: false,
      release: { tag: "v0.16.14", hasInstaller: true },
      assets: {
        installerFilename: "VoxAvatar-0.16.14-windows-x64-setup.exe",
        installerSha256: sha,
        authenticodeStatus: "NotSigned",
      },
      smokeChecklist: {
        items: [{ id: "signing", result: "未驗" }],
      },
    },
    release: {
      tag_name: "v0.16.14",
      draft: false,
      prerelease: false,
      body: "NotSigned / 未簽署；GUI smoke 未驗",
      assets: [
        {
          name: "VoxAvatar-0.16.14-windows-x64-setup.exe",
          digest: `sha256:${sha}`,
        },
        { name: "SHA256SUMS.txt", url: "https://example.invalid/sums" },
      ],
    },
    sha256SumsText: `${sha}  VoxAvatar-0.16.14-windows-x64-setup.exe\n`,
  });
  assert.equal(result.ok, true);
  assert.ok(result.notes.some((note) => /digest matches/i.test(note)));
});

test("verifyReleaseEvidenceConsistency rejects tip claiming installer or smoke", () => {
  const tip = verifyReleaseEvidenceConsistency({
    manifest: {
      smokeExecuted: true,
      release: { tag: null, hasInstaller: false },
      assets: {
        installerFilename: "nope.exe",
        installerSha256: "abc",
      },
    },
  });
  assert.equal(tip.ok, false);
  assert.ok(tip.errors.some((error) => /smokeExecuted/i.test(error)));
  assert.ok(tip.errors.some((error) => /installer assets/i.test(error)));
});
