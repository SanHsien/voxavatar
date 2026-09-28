"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const DEFAULT_ASSETS_DIR = path.join(ROOT, "dist", "assets");
const DEFAULT_OUTPUT = path.join(ROOT, "release", "bundle-baseline.json");
const DEFAULT_COMPARE = path.join(ROOT, "release", "bundle-baseline.prev.json");
const CHUNK_EXTENSIONS = new Set([".js", ".css"]);

/**
 * Suggested review thresholds (documented guidance, not enforced failures):
 * - mainChunk: warn when JS grows >10% vs previous baseline without a matching
 *   SettingsPage chunk shrink (lazy-split regression signal).
 * - settingsPageChunk: note when chunk grows >15% (settings UI bloat).
 * - totals.allBytes: note when total bundle grows >8% (overall regression).
 */
const GUIDANCE_THRESHOLDS = {
  mainChunkGrowthWarnRatio: 0.1,
  settingsPageShrinkExpectedRatio: -0.05,
  settingsPageGrowthNoteRatio: 0.15,
  totalGrowthNoteRatio: 0.08,
};

function parseArgs(argv) {
  const options = {
    outputPath: DEFAULT_OUTPUT,
    assetsDir: DEFAULT_ASSETS_DIR,
    skipBuild: false,
    comparePath: null,
    autoCompare: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--output") {
      const outputPath = argv[index + 1];
      if (!outputPath) {
        throw new Error("--output requires a file path.");
      }
      options.outputPath = path.resolve(outputPath);
      index += 1;
      continue;
    }
    if (arg === "--assets-dir") {
      const assetsDir = argv[index + 1];
      if (!assetsDir) {
        throw new Error("--assets-dir requires a directory path.");
      }
      options.assetsDir = path.resolve(assetsDir);
      index += 1;
      continue;
    }
    if (arg === "--compare") {
      const comparePath = argv[index + 1];
      if (!comparePath) {
        throw new Error("--compare requires a file path.");
      }
      options.comparePath = path.resolve(comparePath);
      options.autoCompare = false;
      index += 1;
      continue;
    }
    if (arg === "--no-auto-compare") {
      options.autoCompare = false;
      continue;
    }
    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.autoCompare && options.comparePath == null) {
    options.comparePath = DEFAULT_COMPARE;
  }

  return options;
}

function hasBundleChunks(assetsDir) {
  if (!fs.existsSync(assetsDir)) return false;
  return fs
    .readdirSync(assetsDir, { withFileTypes: true })
    .some(
      (entry) =>
        entry.isFile() && CHUNK_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    );
}

function listAssetChunks(assetsDir) {
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`Assets directory not found: ${assetsDir}`);
  }

  return fs
    .readdirSync(assetsDir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && CHUNK_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => {
      const filePath = path.join(assetsDir, entry.name);
      const extension = path.extname(entry.name).slice(1).toLowerCase();
      return {
        name: entry.name,
        kind: extension,
        bytes: fs.statSync(filePath).size,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function findMainChunk(chunks) {
  const indexChunks = chunks.filter(
    (chunk) => chunk.kind === "js" && /^index-.*\.js$/i.test(chunk.name),
  );
  if (indexChunks.length === 0) return null;
  return indexChunks.reduce((largest, chunk) =>
    chunk.bytes > largest.bytes ? chunk : largest,
  );
}

function findSettingsPageChunk(chunks) {
  return (
    chunks.find(
      (chunk) => chunk.kind === "js" && /^SettingsPage-.*\.js$/i.test(chunk.name),
    ) ?? null
  );
}

function sumChunkBytes(chunks, kind) {
  return chunks
    .filter((chunk) => chunk.kind === kind)
    .reduce((total, chunk) => total + chunk.bytes, 0);
}

function readBaselineReport(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (parsed.format !== "VoxAvatar-Bundle-Baseline") {
    throw new Error(`Unsupported baseline format in ${filePath}`);
  }
  return parsed;
}

function byteDelta(currentBytes, previousBytes) {
  const current = currentBytes ?? 0;
  const previous = previousBytes ?? 0;
  const delta = current - previous;
  const ratio = previous > 0 ? delta / previous : null;
  return { current, previous, delta, ratio };
}

function compareBaselines(currentReport, previousReport) {
  if (!previousReport) {
    return null;
  }

  const currentMain = currentReport.highlights.mainChunk?.bytes ?? null;
  const previousMain = previousReport.highlights.mainChunk?.bytes ?? null;
  const currentSettings = currentReport.highlights.settingsPageChunk?.bytes ?? null;
  const previousSettings =
    previousReport.highlights.settingsPageChunk?.bytes ?? null;

  return {
    comparedTo: {
      generatedAt: previousReport.generatedAt ?? null,
      appVersion: previousReport.appVersion ?? null,
      path: null,
    },
    mainChunk: byteDelta(currentMain, previousMain),
    settingsPageChunk: byteDelta(currentSettings, previousSettings),
    totals: {
      jsBytes: byteDelta(
        currentReport.totals.jsBytes,
        previousReport.totals.jsBytes,
      ),
      cssBytes: byteDelta(
        currentReport.totals.cssBytes,
        previousReport.totals.cssBytes,
      ),
      allBytes: byteDelta(
        currentReport.totals.allBytes,
        previousReport.totals.allBytes,
      ),
    },
  };
}

function buildGuidance(comparison) {
  const notes = [];
  const warnings = [];

  if (!comparison) {
    return {
      thresholds: GUIDANCE_THRESHOLDS,
      notes: [
        "No previous baseline found; run again after copying release/bundle-baseline.json to release/bundle-baseline.prev.json for deltas.",
      ],
      warnings: [],
    };
  }

  const mainRatio = comparison.mainChunk.ratio;
  const settingsRatio = comparison.settingsPageChunk.ratio;
  const totalRatio = comparison.totals.allBytes.ratio;

  if (
    mainRatio != null &&
    mainRatio > GUIDANCE_THRESHOLDS.mainChunkGrowthWarnRatio &&
    (settingsRatio == null ||
      settingsRatio > GUIDANCE_THRESHOLDS.settingsPageShrinkExpectedRatio)
  ) {
    warnings.push(
      `Main chunk grew ${(mainRatio * 100).toFixed(1)}% without a matching SettingsPage shrink; review lazy-split or first-frame imports.`,
    );
  }

  if (
    settingsRatio != null &&
    settingsRatio > GUIDANCE_THRESHOLDS.settingsPageGrowthNoteRatio
  ) {
    notes.push(
      `SettingsPage chunk grew ${(settingsRatio * 100).toFixed(1)}%; check settings UI additions.`,
    );
  }

  if (
    totalRatio != null &&
    totalRatio > GUIDANCE_THRESHOLDS.totalGrowthNoteRatio
  ) {
    notes.push(
      `Total bundle grew ${(totalRatio * 100).toFixed(1)}%; compare chunk list for unexpected assets.`,
    );
  }

  if (warnings.length === 0 && notes.length === 0) {
    notes.push("Bundle size changes are within suggested review thresholds.");
  }

  return {
    thresholds: GUIDANCE_THRESHOLDS,
    notes,
    warnings,
  };
}

function formatSignedDelta(delta) {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function buildBaselineReport({
  assetsDir,
  appVersion,
  chunks,
  root = ROOT,
  comparison = null,
  guidance = null,
  comparePath = null,
}) {
  const mainChunk = findMainChunk(chunks);
  const settingsPageChunk = findSettingsPageChunk(chunks);
  const jsBytes = sumChunkBytes(chunks, "js");
  const cssBytes = sumChunkBytes(chunks, "css");

  const report = {
    format: "VoxAvatar-Bundle-Baseline",
    version: 1,
    generatedAt: new Date().toISOString(),
    appVersion: appVersion ?? null,
    assetsDir: path.relative(root, assetsDir) || ".",
    chunks,
    totals: {
      jsBytes,
      cssBytes,
      allBytes: jsBytes + cssBytes,
    },
    highlights: {
      mainChunk,
      settingsPageChunk,
    },
    guidance: guidance ?? buildGuidance(comparison),
  };

  if (comparison) {
    report.comparison = {
      ...comparison,
      comparedTo: {
        ...comparison.comparedTo,
        path: comparePath ? path.relative(root, comparePath) || comparePath : null,
      },
    };
  }

  return report;
}

function runBuild(root = ROOT) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", "build"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`npm run build exited with code ${result.status ?? "unknown"}`);
  }
}

function generateBundleBaseline(options = {}) {
  const root = options.root ?? ROOT;
  const outputPath = options.outputPath ?? DEFAULT_OUTPUT;
  const assetsDir = options.assetsDir ?? path.join(root, "dist", "assets");
  const skipBuild = options.skipBuild ?? false;
  const comparePath =
    options.comparePath === undefined
      ? DEFAULT_COMPARE
      : options.comparePath;
  const autoCompare = options.autoCompare ?? true;

  if (!skipBuild && !hasBundleChunks(assetsDir)) {
    console.log("dist/assets missing or has no JS/CSS chunks; running npm run build...");
    runBuild(root);
  }

  const chunks = listAssetChunks(assetsDir);
  if (chunks.length === 0) {
    throw new Error(`No JS/CSS chunks found in ${assetsDir}`);
  }

  const resolvedComparePath =
    autoCompare && comparePath ? comparePath : options.comparePath ?? null;
  const previousReport = resolvedComparePath
    ? readBaselineReport(resolvedComparePath)
    : null;
  const comparison = compareBaselines(
    {
      highlights: {
        mainChunk: findMainChunk(chunks),
        settingsPageChunk: findSettingsPageChunk(chunks),
      },
      totals: {
        jsBytes: sumChunkBytes(chunks, "js"),
        cssBytes: sumChunkBytes(chunks, "css"),
        allBytes:
          sumChunkBytes(chunks, "js") + sumChunkBytes(chunks, "css"),
      },
    },
    previousReport,
  );
  const guidance = buildGuidance(comparison);

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const report = buildBaselineReport({
    assetsDir,
    appVersion: packageJson.version,
    chunks,
    root,
    comparison,
    guidance,
    comparePath: resolvedComparePath,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return {
    outputPath,
    report,
    chunkCount: chunks.length,
    comparison,
    guidance,
    comparePath: resolvedComparePath,
    previousFound: previousReport != null,
  };
}

function printComparisonSummary(result) {
  if (!result.previousFound || !result.comparison) {
    console.log(
      "No previous baseline for comparison (expected release/bundle-baseline.prev.json or --compare).",
    );
    return;
  }

  const { comparison, comparePath } = result;
  const compareLabel = comparePath
    ? path.relative(ROOT, comparePath) || comparePath
    : "previous baseline";
  console.log(`Compared to ${compareLabel}:`);

  const main = comparison.mainChunk;
  console.log(
    `  Main chunk: ${main.current} bytes (${formatSignedDelta(main.delta)} vs ${main.previous})`,
  );

  const settings = comparison.settingsPageChunk;
  console.log(
    `  SettingsPage chunk: ${settings.current} bytes (${formatSignedDelta(settings.delta)} vs ${settings.previous})`,
  );

  const totals = comparison.totals;
  console.log(
    `  Totals: JS ${totals.jsBytes.current} (${formatSignedDelta(totals.jsBytes.delta)}), CSS ${totals.cssBytes.current} (${formatSignedDelta(totals.cssBytes.delta)}), all ${totals.allBytes.current} (${formatSignedDelta(totals.allBytes.delta)})`,
  );

  for (const warning of result.guidance.warnings) {
    console.warn(`  Warning: ${warning}`);
  }
  for (const note of result.guidance.notes) {
    console.log(`  Note: ${note}`);
  }
}

if (require.main === module) {
  try {
    const cliOptions = parseArgs(process.argv.slice(2));
    const result = generateBundleBaseline(cliOptions);
    console.log(
      `Wrote ${result.chunkCount} bundle chunks to ${path.relative(ROOT, result.outputPath)}`,
    );
    if (result.report.highlights.mainChunk) {
      console.log(
        `Main chunk: ${result.report.highlights.mainChunk.name} (${result.report.highlights.mainChunk.bytes} bytes)`,
      );
    }
    if (result.report.highlights.settingsPageChunk) {
      console.log(
        `SettingsPage chunk: ${result.report.highlights.settingsPageChunk.name} (${result.report.highlights.settingsPageChunk.bytes} bytes)`,
      );
    }
    printComparisonSummary(result);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  CHUNK_EXTENSIONS,
  GUIDANCE_THRESHOLDS,
  buildBaselineReport,
  buildGuidance,
  byteDelta,
  compareBaselines,
  findMainChunk,
  findSettingsPageChunk,
  generateBundleBaseline,
  hasBundleChunks,
  listAssetChunks,
  readBaselineReport,
  runBuild,
};
