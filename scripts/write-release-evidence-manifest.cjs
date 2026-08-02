"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_OUTPUT_DIR = path.join("docs", "release-evidence");
const WINDOWS_VALIDATION_DOC = "docs/RELEASING.md";

/**
 * Build a release-evidence manifest template. Does not claim smoke was executed.
 */
function buildReleaseEvidenceManifest({
  version = null,
  tag = null,
  commitSha = null,
  releaseUrl = null,
  generatedAt = new Date().toISOString(),
} = {}) {
  const resolvedTag = tag ?? (version ? `v${version}` : null);
  return {
    schemaVersion: 1,
    purpose:
      "Template for future Windows smoke evidence; fields are placeholders until a human run completes.",
    smokeExecuted: false,
    generatedAt,
    release: {
      version,
      tag: resolvedTag,
      commitSha,
      releaseUrl,
      githubActionsRunUrl: null,
    },
    assets: {
      installerFilename: null,
      installerSha256: null,
      installerSizeBytes: null,
      checksumsFile: "SHA256SUMS.txt",
      unsigned: true,
      authenticodeStatus: "NotSigned",
    },
    environment: {
      windowsEdition: null,
      windowsVersion: null,
      windowsBuild: null,
      architecture: "x64",
      displayScalingPercent: null,
      gpu: null,
    },
    smokeChecklist: {
      validationDoc: WINDOWS_VALIDATION_DOC,
      sections: [
        "自動化前置 gate",
        "安裝與生命週期",
        "核心桌面流程",
        "語音與 MCP",
      ],
      items: [],
      notes:
        "Populate per-item pass/fail/未驗 after a real Windows smoke; do not pre-check.",
    },
    mediaReferences: [],
    issues: [],
    reviewer: null,
    reviewedAt: null,
  };
}

function defaultManifestPath(outputDir = DEFAULT_OUTPUT_DIR, version = null) {
  const folder = version ? `v${version}` : "_template";
  return path.join(outputDir, folder, "manifest.json");
}

function writeReleaseEvidenceManifest(options = {}) {
  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    outputPath = null,
    version = null,
    tag = null,
    commitSha = null,
    releaseUrl = null,
    generatedAt = new Date().toISOString(),
  } = options;

  const manifest = buildReleaseEvidenceManifest({
    version,
    tag,
    commitSha,
    releaseUrl,
    generatedAt,
  });

  const targetPath = path.resolve(outputPath ?? defaultManifestPath(outputDir, version));
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return targetPath;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const readFlag = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    return args[index + 1] ?? null;
  };

  try {
    const version = readFlag("--version");
    const tag = readFlag("--tag");
    const commitSha = readFlag("--sha");
    const releaseUrl = readFlag("--release-url");
    const outputPath = readFlag("--out");
    const outputDir = readFlag("--dir") ?? DEFAULT_OUTPUT_DIR;

    const written = writeReleaseEvidenceManifest({
      version,
      tag,
      commitSha,
      releaseUrl,
      outputDir,
      outputPath,
    });
    console.log(`Wrote ${written}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_OUTPUT_DIR,
  WINDOWS_VALIDATION_DOC,
  buildReleaseEvidenceManifest,
  defaultManifestPath,
  writeReleaseEvidenceManifest,
};
