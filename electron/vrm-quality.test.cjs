"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  KEEP_SCORE_AT_LEAST,
  QUALITY_GATE,
  VERDICT,
  analyzeVrmFile,
  formatMarkdownReport,
  writeMarkdownReport,
} = require("./vrm-quality.cjs");
const { buildVrmGlb } = require("./fixtures/vrm-vrma/builders.cjs");

function writeTempVrm(context, bytes, name = "sample.vrm") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrm-q-"));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, bytes);
  return { dir, filePath };
}

test("complete VRM scores as keep or mild review", (context) => {
  const { filePath } = writeTempVrm(context, buildVrmGlb());
  const report = analyzeVrmFile(filePath);
  assert.ok(report.score >= 70);
  assert.notEqual(report.verdict, VERDICT.REJECT);
  assert.ok(report.metrics.meshCount >= 1);
  assert.ok(report.metrics.humanoidBoneCount >= 7);
});

test("VRM0 array humanBones is parsed for coverage (not false low_bone_coverage)", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ vrm0ArrayHumanoid: true }),
    "vrm0.vrm",
  );
  const report = analyzeVrmFile(filePath);
  assert.equal(report.metrics.humanoidBoneCount, 13);
  assert.equal(report.metrics.coveredCoreBones.length, 13);
  assert.ok(
    !report.issues.some((issue) => issue.code === "low_bone_coverage"),
    "must not mark full VRM0 humanoid as 0/13 coverage",
  );
  assert.ok(report.score > KEEP_SCORE_AT_LEAST);
  assert.equal(report.verdict, VERDICT.KEEP);
});

test("a VRM score equal to the keep threshold remains review", (context) => {
  const { filePath } = writeTempVrm(context, buildVrmGlb());
  const baseline = analyzeVrmFile(filePath);
  const atBoundary = analyzeVrmFile(filePath, {
    rejectBelow: 0,
    keepAtLeast: baseline.score,
  });
  const aboveBoundary = analyzeVrmFile(filePath, {
    rejectBelow: 0,
    keepAtLeast: baseline.score - 1,
  });

  assert.equal(atBoundary.verdict, VERDICT.REVIEW);
  assert.equal(aboveBoundary.verdict, VERDICT.KEEP);
});

test("missing VRM extension is rejected", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeExtension: false }),
  );
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(
    report.issues.some((issue) => issue.code === "missing_vrm_extension"),
  );
});

test("missing humanoid is review or reject", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeHumanoid: false }),
  );
  const report = analyzeVrmFile(filePath);
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
  assert.ok(report.issues.some((issue) => issue.code === "missing_humanoid"));
});

test("VRM without meshes is rejected", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeMesh: false }),
    "no-mesh.vrm",
  );
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "no_meshes"));
  assert.equal(report.metrics.meshCount, 0);
});

test("sparse humanoid bone coverage is marked review", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ sparseHumanoidBones: true }),
    "sparse-humanoid.vrm",
  );
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REVIEW);
  assert.ok(
    report.issues.some((issue) => issue.code === "low_bone_coverage"),
  );
  assert.ok(report.metrics.humanoidBoneCount <= 4);
});

test("VRM without textures is flagged", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeTextures: false }),
    "no-textures.vrm",
  );
  const report = analyzeVrmFile(filePath);
  assert.ok(
    report.verdict === VERDICT.KEEP || report.verdict === VERDICT.REVIEW,
  );
  assert.ok(report.issues.some((issue) => issue.code === "no_textures"));
  assert.equal(report.metrics.textureCount, 0);
});

test("VRM without expressions is flagged", (context) => {
  const { filePath } = writeTempVrm(
    context,
    buildVrmGlb({ includeExpressions: false }),
    "no-expressions.vrm",
  );
  const report = analyzeVrmFile(filePath);
  assert.ok(
    report.verdict === VERDICT.KEEP || report.verdict === VERDICT.REVIEW,
  );
  assert.ok(
    report.issues.some((issue) => issue.code === "missing_expressions"),
  );
  assert.equal(report.metrics.hasExpressions, false);
});

test("broken file is rejected", (context) => {
  const { filePath } = writeTempVrm(context, Buffer.from("not-a-glb"), "bad.vrm");
  const report = analyzeVrmFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "parse_error"));
});

test("markdown report lists reject details and can be written", (context) => {
  const good = writeTempVrm(context, buildVrmGlb(), "good.vrm");
  const bad = writeTempVrm(
    context,
    buildVrmGlb({ includeExtension: false }),
    "bad.vrm",
  );
  const reports = [analyzeVrmFile(good.filePath), analyzeVrmFile(bad.filePath)];
  const markdown = formatMarkdownReport(reports, {
    sourceDir: good.dir,
    gate: QUALITY_GATE.REPORT,
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(markdown, /VoxAvatar VRM 品質報告/);
  assert.match(markdown, /判定門檻/);
  assert.match(markdown, /觀察／淘汰明細/);

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrm-report-"));
  context.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const { reportPath } = writeMarkdownReport(reports, {
    reportDir: outDir,
    sourceDir: good.dir,
    gate: QUALITY_GATE.STRICT,
  });
  assert.equal(path.basename(reportPath), "voxavatar-vrm-report.md");
  assert.ok(fs.existsSync(reportPath));
  assert.match(fs.readFileSync(reportPath, "utf8"), /把關模式：`strict`/);
});
