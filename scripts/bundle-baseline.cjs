"use strict";

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const PACKAGE_JSON = path.join(ROOT, "package.json");
const DEFAULT_ASSETS_DIR = path.join(ROOT, "dist", "assets");
const DEFAULT_OUTPUT = path.join(ROOT, "release", "bundle-baseline.json");
const CHUNK_EXTENSIONS = new Set([".js", ".css"]);

function parseArgs(argv) {
  const options = {
    outputPath: DEFAULT_OUTPUT,
    assetsDir: DEFAULT_ASSETS_DIR,
    skipBuild: false,
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
    if (arg === "--skip-build") {
      options.skipBuild = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
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

function buildBaselineReport({ assetsDir, appVersion, chunks, root = ROOT }) {
  const mainChunk = findMainChunk(chunks);
  const settingsPageChunk = findSettingsPageChunk(chunks);
  const jsBytes = sumChunkBytes(chunks, "js");
  const cssBytes = sumChunkBytes(chunks, "css");

  return {
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
  };
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

  if (!skipBuild && !hasBundleChunks(assetsDir)) {
    console.log("dist/assets missing or has no JS/CSS chunks; running npm run build...");
    runBuild(root);
  }

  const chunks = listAssetChunks(assetsDir);
  if (chunks.length === 0) {
    throw new Error(`No JS/CSS chunks found in ${assetsDir}`);
  }

  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, "utf8"));
  const report = buildBaselineReport({
    assetsDir,
    appVersion: packageJson.version,
    chunks,
    root,
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  return { outputPath, report, chunkCount: chunks.length };
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
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

module.exports = {
  CHUNK_EXTENSIONS,
  buildBaselineReport,
  findMainChunk,
  findSettingsPageChunk,
  generateBundleBaseline,
  hasBundleChunks,
  listAssetChunks,
  runBuild,
};
