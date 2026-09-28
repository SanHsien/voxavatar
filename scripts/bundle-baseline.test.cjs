"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
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
} = require("./bundle-baseline.cjs");

function createAssetsFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-bundle-baseline-"));
  const assetsDir = path.join(root, "dist", "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, assetsDir };
}

function sampleReport(overrides = {}) {
  return {
    format: "VoxAvatar-Bundle-Baseline",
    generatedAt: "2026-01-01T00:00:00.000Z",
    appVersion: "0.5.0",
    highlights: {
      mainChunk: { name: "index-main.js", kind: "js", bytes: 1000 },
      settingsPageChunk: { name: "SettingsPage-abc.js", kind: "js", bytes: 200 },
    },
    totals: { jsBytes: 1200, cssBytes: 50, allBytes: 1250 },
    ...overrides,
  };
}

test("hasBundleChunks detects JS/CSS output and ignores unrelated files", (context) => {
  const { assetsDir } = createAssetsFixture(context);
  assert.equal(hasBundleChunks(assetsDir), false);

  fs.writeFileSync(path.join(assetsDir, "index-abc123.js"), "main");
  assert.equal(hasBundleChunks(assetsDir), true);

  fs.rmSync(path.join(assetsDir, "index-abc123.js"));
  fs.writeFileSync(path.join(assetsDir, "index-abc123.css"), "styles");
  assert.equal(hasBundleChunks(assetsDir), true);
});

test("listAssetChunks returns sorted JS/CSS sizes", (context) => {
  const { assetsDir } = createAssetsFixture(context);
  fs.writeFileSync(path.join(assetsDir, "SettingsPage-xyz.js"), "settings-page");
  fs.writeFileSync(path.join(assetsDir, "index-main.js"), "main-chunk");
  fs.writeFileSync(path.join(assetsDir, "index-main.css"), "css");
  fs.writeFileSync(path.join(assetsDir, "README.txt"), "ignored");

  assert.deepEqual(listAssetChunks(assetsDir), [
    { name: "index-main.css", kind: "css", bytes: 3 },
    { name: "index-main.js", kind: "js", bytes: 10 },
    { name: "SettingsPage-xyz.js", kind: "js", bytes: 13 },
  ]);
});

test("findMainChunk and findSettingsPageChunk pick expected entry chunks", () => {
  const chunks = [
    { name: "index-small.js", kind: "js", bytes: 10 },
    { name: "index-main.js", kind: "js", bytes: 1000 },
    { name: "SettingsPage-abc.js", kind: "js", bytes: 200 },
    { name: "index-main.css", kind: "css", bytes: 50 },
  ];

  assert.deepEqual(findMainChunk(chunks), {
    name: "index-main.js",
    kind: "js",
    bytes: 1000,
  });
  assert.deepEqual(findSettingsPageChunk(chunks), {
    name: "SettingsPage-abc.js",
    kind: "js",
    bytes: 200,
  });
  assert.equal(findMainChunk([{ name: "vendor.js", kind: "js", bytes: 1 }]), null);
  assert.equal(findSettingsPageChunk([]), null);
});

test("buildBaselineReport records totals and highlight chunks", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-baseline-"));
  const assetsDir = path.join(root, "dist", "assets");
  const chunks = [
    { name: "index-main.js", kind: "js", bytes: 1000 },
    { name: "SettingsPage-abc.js", kind: "js", bytes: 200 },
    { name: "index-main.css", kind: "css", bytes: 50 },
  ];
  const report = buildBaselineReport({
    assetsDir,
    appVersion: "0.5.0",
    chunks,
    root,
  });

  assert.equal(report.format, "VoxAvatar-Bundle-Baseline");
  assert.equal(report.appVersion, "0.5.0");
  assert.equal(report.assetsDir, path.join("dist", "assets"));
  assert.deepEqual(report.totals, { jsBytes: 1200, cssBytes: 50, allBytes: 1250 });
  assert.deepEqual(report.highlights.mainChunk?.name, "index-main.js");
  assert.deepEqual(report.highlights.settingsPageChunk?.name, "SettingsPage-abc.js");
  assert.match(report.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.ok(report.guidance);
  assert.ok(Array.isArray(report.guidance.notes));
});

test("byteDelta and compareBaselines report signed deltas", () => {
  assert.deepEqual(byteDelta(1100, 1000), {
    current: 1100,
    previous: 1000,
    delta: 100,
    ratio: 0.1,
  });

  const current = sampleReport({
    highlights: {
      mainChunk: { name: "index-main.js", kind: "js", bytes: 1100 },
      settingsPageChunk: { name: "SettingsPage-abc.js", kind: "js", bytes: 180 },
    },
    totals: { jsBytes: 1280, cssBytes: 50, allBytes: 1330 },
  });
  const previous = sampleReport();
  const comparison = compareBaselines(current, previous);

  assert.equal(comparison.mainChunk.delta, 100);
  assert.equal(comparison.settingsPageChunk.delta, -20);
  assert.equal(comparison.totals.allBytes.delta, 80);
});

test("buildGuidance warns when main chunk grows without SettingsPage shrink", () => {
  const comparison = compareBaselines(
    sampleReport({
      highlights: {
        mainChunk: { name: "index-main.js", kind: "js", bytes: 1200 },
        settingsPageChunk: { name: "SettingsPage-abc.js", kind: "js", bytes: 210 },
      },
      totals: { jsBytes: 1410, cssBytes: 50, allBytes: 1460 },
    }),
    sampleReport(),
  );

  const guidance = buildGuidance(comparison);
  assert.ok(
    guidance.warnings.some((entry) => entry.includes("Main chunk grew")),
  );
});

test("generateBundleBaseline writes JSON without running build when assets exist", (context) => {
  const { root, assetsDir } = createAssetsFixture(context);
  const outputPath = path.join(root, "release", "bundle-baseline.json");
  fs.writeFileSync(path.join(assetsDir, "index-main.js"), "main-chunk");
  fs.writeFileSync(path.join(assetsDir, "SettingsPage-abc.js"), "settings-page");
  fs.writeFileSync(path.join(assetsDir, "index-main.css"), "css");

  const result = generateBundleBaseline({
    root,
    assetsDir,
    outputPath,
    skipBuild: true,
    autoCompare: false,
    comparePath: null,
  });

  assert.equal(result.chunkCount, 3);
  assert.equal(fs.existsSync(outputPath), true);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(written.highlights.mainChunk.bytes, 10);
  assert.equal(written.highlights.settingsPageChunk.bytes, 13);
  assert.equal(written.totals.allBytes, 26);
  assert.ok(written.guidance);
});

test("generateBundleBaseline compares against previous JSON when present", (context) => {
  const { root, assetsDir } = createAssetsFixture(context);
  const releaseDir = path.join(root, "release");
  fs.mkdirSync(releaseDir, { recursive: true });
  const outputPath = path.join(releaseDir, "bundle-baseline.json");
  const comparePath = path.join(releaseDir, "bundle-baseline.prev.json");

  fs.writeFileSync(path.join(assetsDir, "index-main.js"), "x".repeat(1000));
  fs.writeFileSync(path.join(assetsDir, "SettingsPage-abc.js"), "y".repeat(200));
  fs.writeFileSync(
    comparePath,
    `${JSON.stringify(
      sampleReport({
        highlights: {
          mainChunk: { name: "index-main.js", kind: "js", bytes: 900 },
          settingsPageChunk: { name: "SettingsPage-abc.js", kind: "js", bytes: 220 },
        },
        totals: { jsBytes: 1120, cssBytes: 0, allBytes: 1120 },
      }),
      null,
      2,
    )}\n`,
  );

  const result = generateBundleBaseline({
    root,
    assetsDir,
    outputPath,
    skipBuild: true,
    comparePath,
    autoCompare: true,
  });

  assert.equal(result.previousFound, true);
  assert.equal(result.comparison.mainChunk.delta, 100);
  assert.equal(result.comparison.settingsPageChunk.delta, -20);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(written.comparison.mainChunk.delta, 100);
  assert.equal(written.comparison.comparedTo.appVersion, "0.5.0");
});

test("readBaselineReport rejects unknown format", (context) => {
  const { root } = createAssetsFixture(context);
  const filePath = path.join(root, "bad.json");
  fs.writeFileSync(filePath, JSON.stringify({ format: "Other" }));
  assert.throws(() => readBaselineReport(filePath), /Unsupported baseline format/);
});

test("release/ stays gitignored for bundle baseline output", () => {
  const gitignore = fs.readFileSync(path.join(__dirname, "..", ".gitignore"), "utf8");
  assert.match(gitignore, /^release\//m);
});

test("package.json exposes baseline:bundle script", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"),
  );
  assert.equal(packageJson.scripts["baseline:bundle"], "node scripts/bundle-baseline.cjs");
});
