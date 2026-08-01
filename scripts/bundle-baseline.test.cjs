"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  buildBaselineReport,
  findMainChunk,
  findSettingsPageChunk,
  generateBundleBaseline,
  hasBundleChunks,
  listAssetChunks,
} = require("./bundle-baseline.cjs");

function createAssetsFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-bundle-baseline-"));
  const assetsDir = path.join(root, "dist", "assets");
  fs.mkdirSync(assetsDir, { recursive: true });
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, assetsDir };
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
  });

  assert.equal(result.chunkCount, 3);
  assert.equal(fs.existsSync(outputPath), true);
  const written = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  assert.equal(written.highlights.mainChunk.bytes, 10);
  assert.equal(written.highlights.settingsPageChunk.bytes, 13);
  assert.equal(written.totals.allBytes, 26);
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
