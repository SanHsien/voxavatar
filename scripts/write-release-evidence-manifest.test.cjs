"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  DEFAULT_SMOKE_ITEMS,
  WINDOWS_VALIDATION_DOC,
  buildReleaseEvidenceManifest,
  buildWindowsSmokeMarkdown,
  defaultManifestPath,
  writeReleaseEvidenceManifest,
} = require("./write-release-evidence-manifest.cjs");

test("buildReleaseEvidenceManifest is a non-executed smoke template", () => {
  const manifest = buildReleaseEvidenceManifest({
    version: "0.4.0",
    commitSha: "abc123",
    generatedAt: "2026-08-01T12:00:00.000Z",
  });

  assert.equal(manifest.smokeExecuted, false);
  assert.equal(manifest.release.version, "0.4.0");
  assert.equal(manifest.release.tag, "v0.4.0");
  assert.equal(manifest.release.commitSha, "abc123");
  assert.equal(manifest.assets.unsigned, true);
  assert.equal(manifest.assets.authenticodeStatus, "NotSigned");
  assert.equal(manifest.smokeChecklist.validationDoc, WINDOWS_VALIDATION_DOC);
  assert.equal(manifest.smokeChecklist.items.length, DEFAULT_SMOKE_ITEMS.length);
  assert.ok(
    manifest.smokeChecklist.items.every((item) => item.result === "未驗"),
  );
});

test("buildReleaseEvidenceManifest records installer metadata when provided", () => {
  const manifest = buildReleaseEvidenceManifest({
    version: "0.16.12",
    installerFilename: "VoxAvatar-0.16.12-windows-x64-setup.exe",
    installerSha256: "abc",
    installerSizeBytes: 10,
  });
  assert.equal(manifest.release.hasInstaller, true);
  assert.equal(
    manifest.assets.installerFilename,
    "VoxAvatar-0.16.12-windows-x64-setup.exe",
  );
  assert.equal(manifest.assets.installerSha256, "abc");
  assert.equal(manifest.assets.installerSizeBytes, 10);
});

test("defaultManifestPath nests versioned folders under docs/release-evidence", () => {
  assert.equal(
    defaultManifestPath("docs/release-evidence", "0.4.0"),
    path.join("docs", "release-evidence", "v0.4.0", "manifest.json"),
  );
  assert.equal(
    defaultManifestPath("docs/release-evidence"),
    path.join("docs", "release-evidence", "_template", "manifest.json"),
  );
});

test("writeReleaseEvidenceManifest writes JSON and optional smoke markdown", (context) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "voxavatar-evidence-manifest-"),
  );
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const written = writeReleaseEvidenceManifest({
    outputPath: path.join(directory, "manifest.json"),
    version: "0.4.0",
    tag: "v0.4.0",
    commitSha: "deadbeef",
    generatedAt: "2026-08-01T12:00:00.000Z",
    writeSmokeMarkdown: true,
  });

  assert.equal(written.manifestPath, path.join(directory, "manifest.json"));
  assert.equal(written.smokePath, path.join(directory, "windows-smoke.md"));
  const raw = fs.readFileSync(written.manifestPath, "utf8");
  assert.ok(raw.endsWith("\n"));
  const parsed = JSON.parse(raw);
  assert.equal(parsed.smokeExecuted, false);
  assert.equal(parsed.release.tag, "v0.4.0");
  const smoke = fs.readFileSync(written.smokePath, "utf8");
  assert.match(smoke, /NotSigned/);
  assert.match(smoke, /未驗/);
  assert.match(buildWindowsSmokeMarkdown(parsed), /Windows smoke evidence/);
});
