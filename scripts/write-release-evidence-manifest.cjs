"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_OUTPUT_DIR = path.join("docs", "release-evidence");
const WINDOWS_VALIDATION_DOC = "docs/RELEASING.md";

const DEFAULT_SMOKE_ITEMS = Object.freeze([
  {
    id: "ci_gates",
    section: "自動化前置 gate",
    result: "未驗",
    note: "以 GitHub Actions CI／Release 綠燈為準；本證據不重跑。",
  },
  {
    id: "install_lifecycle",
    section: "安裝與生命週期",
    result: "未驗",
    note: "無 Windows 桌面；未執行安裝／升級／移除。",
  },
  {
    id: "desktop_core",
    section: "核心桌面流程",
    result: "未驗",
    note: "無 Windows 桌面；系統匣／DPI／30%／透明視窗未實測。",
  },
  {
    id: "voice_mcp",
    section: "語音與 MCP",
    result: "未驗",
    note: "無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。",
  },
  {
    id: "signing",
    section: "簽署／SmartScreen",
    result: "未驗",
    note: "無 WIN_CSC_* 密鑰；Authenticode 狀態為 NotSigned。",
  },
]);

/**
 * Build a release-evidence manifest template. Does not claim smoke was executed.
 */
function buildReleaseEvidenceManifest({
  version = null,
  tag = null,
  commitSha = null,
  releaseUrl = null,
  generatedAt = new Date().toISOString(),
  installerFilename = null,
  installerSha256 = null,
  installerSizeBytes = null,
  unsigned = true,
  authenticodeStatus = "NotSigned",
  smokeExecuted = false,
  notes = null,
  hasInstaller = null,
} = {}) {
  const resolvedTag = tag ?? (version ? `v${version}` : null);
  const installerPresent =
    hasInstaller == null
      ? Boolean(installerFilename || installerSha256)
      : Boolean(hasInstaller);
  return {
    schemaVersion: 1,
    purpose:
      "Windows release evidence record. smokeExecuted stays false until a human desktop run completes.",
    smokeExecuted: Boolean(smokeExecuted),
    generatedAt,
    release: {
      version,
      tag: resolvedTag,
      commitSha,
      releaseUrl,
      githubActionsRunUrl: null,
      hasInstaller: installerPresent,
    },
    assets: {
      installerFilename,
      installerSha256,
      installerSizeBytes,
      checksumsFile: installerPresent ? "SHA256SUMS.txt" : null,
      unsigned: Boolean(unsigned),
      authenticodeStatus:
        authenticodeStatus ?? (unsigned ? "NotSigned" : "Unknown"),
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
        "簽署／SmartScreen",
      ],
      items: DEFAULT_SMOKE_ITEMS.map((item) => ({ ...item })),
      notes:
        notes ??
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

function buildWindowsSmokeMarkdown(manifest) {
  const version = manifest.release?.version ?? "(unset)";
  const tag = manifest.release?.tag ?? `(v${version})`;
  const lines = [
    `# Windows smoke evidence — ${tag}`,
    "",
    `> 自動產生的誠實骨架。\`smokeExecuted=${manifest.smokeExecuted}\`；未取得桌面證據前不得改為 true 或勾選通過。`,
    "",
    "## Release",
    "",
    `- version: \`${version}\``,
    `- tag: \`${tag}\``,
    `- commit: \`${manifest.release?.commitSha ?? "null"}\``,
    `- release URL: ${manifest.release?.releaseUrl ?? "null"}`,
    `- has installer cut: \`${manifest.release?.hasInstaller ?? false}\``,
    "",
    "## Assets / signing",
    "",
    `- installer: \`${manifest.assets?.installerFilename ?? "null"}\``,
    `- size bytes: \`${manifest.assets?.installerSizeBytes ?? "null"}\``,
    `- sha256: \`${manifest.assets?.installerSha256 ?? "null"}\``,
    `- unsigned: \`${manifest.assets?.unsigned ?? true}\``,
    `- authenticode: \`${manifest.assets?.authenticodeStatus ?? "NotSigned"}\``,
    "",
    "## Environment",
    "",
    "- Windows edition / version / build: **未驗**（無桌面）",
    "- architecture: x64",
    "- display scaling / GPU: **未驗**",
    "",
    "## Checklist",
    "",
  ];
  for (const item of manifest.smokeChecklist?.items ?? []) {
    lines.push(
      `- [${item.result === "pass" ? "x" : " "}] **${item.section}** (\`${item.id}\`): ${item.result} — ${item.note}`,
    );
  }
  lines.push(
    "",
    "## Notes",
    "",
    manifest.smokeChecklist?.notes ?? "",
    "",
    "驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。",
    "",
  );
  return lines.join("\n");
}

function writeReleaseEvidenceManifest(options = {}) {
  const {
    outputDir = DEFAULT_OUTPUT_DIR,
    outputPath = null,
    writeSmokeMarkdown = false,
    ...manifestOptions
  } = options;

  const manifest = buildReleaseEvidenceManifest(manifestOptions);
  const version = manifestOptions.version;
  const targetPath = path.resolve(
    outputPath ?? defaultManifestPath(outputDir, version),
  );
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);

  let smokePath = null;
  if (writeSmokeMarkdown) {
    smokePath = path.join(path.dirname(targetPath), "windows-smoke.md");
    fs.writeFileSync(smokePath, buildWindowsSmokeMarkdown(manifest));
  }
  return { manifestPath: targetPath, smokePath, manifest };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const readFlag = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return null;
    return args[index + 1] ?? null;
  };
  const hasFlag = (name) => args.includes(name);

  try {
    const version = readFlag("--version");
    const sizeRaw = readFlag("--installer-size");
    const written = writeReleaseEvidenceManifest({
      version,
      tag: readFlag("--tag"),
      commitSha: readFlag("--sha"),
      releaseUrl: readFlag("--release-url"),
      installerFilename: readFlag("--installer-name"),
      installerSha256: readFlag("--installer-sha256"),
      installerSizeBytes:
        sizeRaw == null || sizeRaw === "" ? null : Number(sizeRaw),
      unsigned: !hasFlag("--signed"),
      authenticodeStatus: hasFlag("--signed") ? "Signed" : "NotSigned",
      hasInstaller: hasFlag("--no-installer") ? false : null,
      notes: readFlag("--notes"),
      outputDir: readFlag("--dir") ?? DEFAULT_OUTPUT_DIR,
      outputPath: readFlag("--out"),
      writeSmokeMarkdown: hasFlag("--smoke-md"),
    });
    console.log(`Wrote ${written.manifestPath}`);
    if (written.smokePath) console.log(`Wrote ${written.smokePath}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  DEFAULT_OUTPUT_DIR,
  DEFAULT_SMOKE_ITEMS,
  WINDOWS_VALIDATION_DOC,
  buildReleaseEvidenceManifest,
  buildWindowsSmokeMarkdown,
  defaultManifestPath,
  writeReleaseEvidenceManifest,
};
