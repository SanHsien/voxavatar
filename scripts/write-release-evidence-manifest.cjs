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
    id: "install",
    section: "安裝",
    result: "未驗",
    note: "無 Windows 桌面；未執行全新安裝。",
  },
  {
    id: "upgrade",
    section: "升級",
    result: "未驗",
    note: "無 Windows 桌面；未執行舊版→新版升級。",
  },
  {
    id: "uninstall",
    section: "移除",
    result: "未驗",
    note: "無 Windows 桌面；未執行移除。",
  },
  {
    id: "tray",
    section: "系統匣",
    result: "未驗",
    note: "無 Windows 桌面；系統匣左右鍵未實測。",
  },
  {
    id: "dpi_scaling",
    section: "DPI／縮放",
    result: "未驗",
    note: "無 Windows 桌面；100%／150%／225% 未實測。",
  },
  {
    id: "size_30",
    section: "角色尺寸 30%",
    result: "未驗",
    note: "設定契約可自動測；多 DPI 實機可讀性未驗。",
  },
  {
    id: "voice_mcp",
    section: "語音與 MCP",
    result: "未驗",
    note: "無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。",
  },
  {
    id: "signing_label",
    section: "簽署標示（NotSigned）",
    result: "未驗",
    note: "可用 PE Certificate Table／evidence:verify 對照標示；≠ SmartScreen。",
  },
  {
    id: "smartscreen",
    section: "SmartScreen／publisher",
    result: "未驗",
    note: "無 WIN_CSC_* 密鑰；需人工桌面觀察。",
  },
]);

/**
 * Build a release-evidence manifest template. Does not claim smoke was executed.
 */
function buildReleaseEvidenceManifest({
  version = null,
  tag = undefined,
  commitSha = null,
  releaseUrl = null,
  generatedAt = new Date().toISOString(),
  installerFilename = null,
  installerSha256 = null,
  installerSizeBytes = null,
  unsigned = true,
  authenticodeStatus = "NotSigned",
  authenticodeEvidence = null,
  smokeExecuted = false,
  notes = null,
  hasInstaller = null,
  inventTagFromVersion = true,
  markCiGatesPass = false,
} = {}) {
  const installerPresent =
    hasInstaller == null
      ? Boolean(installerFilename || installerSha256)
      : Boolean(hasInstaller);
  let resolvedTag;
  if (tag !== undefined && tag !== null) {
    resolvedTag = tag;
  } else if (tag === null) {
    resolvedTag = null;
  } else if (inventTagFromVersion && version) {
    resolvedTag = `v${version}`;
  } else {
    // tip／無 installer：不虛構尚未存在的 GitHub tag
    resolvedTag = null;
  }
  const items = DEFAULT_SMOKE_ITEMS.map((item) => {
    if (markCiGatesPass && item.id === "ci_gates") {
      return {
        ...item,
        result: "pass",
        note: "GitHub Actions CI 綠燈（僅自動化 gate；不含 GUI smoke）。",
      };
    }
    return { ...item };
  });
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
      authenticodeEvidence,
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
        "安裝",
        "升級",
        "移除",
        "系統匣",
        "DPI／縮放",
        "角色尺寸 30%",
        "語音與 MCP",
        "簽署標示（NotSigned）",
        "SmartScreen／publisher",
      ],
      items,
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
  const tag = manifest.release?.tag ?? "(no GitHub tag)";
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
    if (hasFlag("--help") || hasFlag("-h")) {
      console.log(`Usage: node scripts/write-release-evidence-manifest.cjs --version <ver> [options]
  --version <ver>              required unless --out is set
  --tag <tag>                  default v{version} when cutting installer; tip/--no-installer defaults to null
  --sha <commit>               release commit SHA
  --release-url <url>          GitHub Release URL
  --installer-name <file>
  --installer-sha256 <hex>
  --installer-size <bytes>
  --notes <text>
  --smoke-md                   also write windows-smoke.md
  --no-installer               force hasInstaller=false; do not invent tag unless --tag is set
  --ci-pass                    mark smokeChecklist ci_gates as pass (CI only; not GUI smoke)
  --authenticode-evidence <s>  e.g. pe-certificate-table-empty
  --signed                     mark Authenticode Signed (default NotSigned)
  --dir <path>                 evidence root (default docs/release-evidence)
  --out <path>                 explicit manifest path`);
      process.exitCode = 0;
    } else {
      const version = readFlag("--version");
      const outputPath = readFlag("--out");
      if (!version && !outputPath) {
        throw new Error("Provide --version <ver> or --out <path> (see --help).");
      }
      const sizeRaw = readFlag("--installer-size");
      const explicitTag = readFlag("--tag");
      const noInstaller = hasFlag("--no-installer");
      const written = writeReleaseEvidenceManifest({
        version,
        tag: explicitTag === null ? undefined : explicitTag,
        inventTagFromVersion: !noInstaller,
        commitSha: readFlag("--sha"),
        releaseUrl: readFlag("--release-url"),
        installerFilename: readFlag("--installer-name"),
        installerSha256: readFlag("--installer-sha256"),
        installerSizeBytes:
          sizeRaw == null || sizeRaw === "" ? null : Number(sizeRaw),
        unsigned: !hasFlag("--signed"),
        authenticodeStatus: hasFlag("--signed") ? "Signed" : "NotSigned",
        authenticodeEvidence: readFlag("--authenticode-evidence"),
        markCiGatesPass: hasFlag("--ci-pass"),
        hasInstaller: noInstaller ? false : null,
        notes: readFlag("--notes"),
        outputDir: readFlag("--dir") ?? DEFAULT_OUTPUT_DIR,
        outputPath,
        writeSmokeMarkdown: hasFlag("--smoke-md"),
      });
      console.log(`Wrote ${written.manifestPath}`);
      if (written.smokePath) console.log(`Wrote ${written.smokePath}`);
    }
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
