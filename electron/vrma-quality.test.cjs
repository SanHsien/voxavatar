"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  QUALITY_GATE,
  VERDICT,
  analyzeVrmaFile,
  formatMarkdownReport,
  normalizeQualityGate,
  normalizeReportDir,
  writeMarkdownReport,
} = require("./vrma-quality.cjs");
const { buildRotationVrma } = require("./fixtures/vrm-vrma/builders.cjs");

function writeTempVrma(context, bytes, name = "sample.vrma") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-vrma-q-"));
  context.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, bytes);
  return { dir, filePath };
}

test("normalizeQualityGate defaults to report", () => {
  assert.equal(normalizeQualityGate(undefined), QUALITY_GATE.REPORT);
  assert.equal(normalizeQualityGate("strict"), QUALITY_GATE.STRICT);
  assert.equal(normalizeQualityGate("off"), QUALITY_GATE.OFF);
  assert.equal(normalizeQualityGate("nope"), QUALITY_GATE.REPORT);
});

test("normalizeReportDir resolves absolute paths and blanks to null", () => {
  assert.equal(normalizeReportDir(""), null);
  assert.equal(normalizeReportDir("   "), null);
  assert.equal(normalizeReportDir(null), null);
  const resolved = normalizeReportDir(".");
  assert.equal(resolved, path.resolve("."));
});

test("smooth looping VRMA scores as keep or mild review", (context) => {
  const { filePath } = writeTempVrma(context, buildRotationVrma());
  const report = analyzeVrmaFile(filePath);
  assert.ok(report.score >= 70);
  assert.notEqual(report.verdict, VERDICT.REJECT);
  assert.ok(report.metrics.durationSec > 1);
});

test("velocity spike VRMA is marked review or reject", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ spike: true, angle: 0.15 }),
  );
  const report = analyzeVrmaFile(filePath);
  assert.ok(report.issues.some((issue) => issue.code.startsWith("velocity")));
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
});

test("too-short VRMA clip is marked review or reject", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ duration: 0.25, frames: 6 }),
    "too-short.vrma",
  );
  const report = analyzeVrmaFile(filePath);
  assert.ok(report.issues.some((issue) => issue.code === "too_short"));
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
  assert.ok(report.metrics.durationSec < 0.4);
});

test("VRMA without animation tracks is rejected", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ includeAnimation: false }),
    "no-animation.vrma",
  );
  const report = analyzeVrmaFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "no_animation"));
  assert.equal(report.metrics.animationCount, 0);
});

test("loop seam VRMA is marked review or reject", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ loopSeam: true, angle: 0.2, loopSeamDelta: 0.35 }),
    "loop-seam.vrma",
  );
  const report = analyzeVrmaFile(filePath);
  assert.ok(
    report.issues.some((issue) => issue.code.startsWith("loop_seam")),
  );
  assert.ok(
    !report.issues.some((issue) => issue.code === "velocity_spike"),
    "loop seam case must not reuse mid-clip velocity_spike failure mode",
  );
  assert.ok(
    report.verdict === VERDICT.REVIEW || report.verdict === VERDICT.REJECT,
  );
  assert.ok(report.metrics.loopSeamMaxRad > 0.25);
  assert.equal(report.purpose, "loop");
});

test("one-shot purpose does not reject for loop seam alone", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ loopSeam: true, angle: 0.2, loopSeamDelta: 0.35 }),
    "one-shot-seam.vrma",
  );
  const report = analyzeVrmaFile(filePath, { purpose: "one-shot" });
  assert.equal(report.purpose, "one-shot");
  assert.ok(
    !report.issues.some((issue) => issue.code.startsWith("loop_seam")),
    "one-shot must not apply loop seam penalties",
  );
  assert.notEqual(report.verdict, VERDICT.REJECT);
});

test("pose purpose skips dead-motion rejection for near-static clips", (context) => {
  const { filePath } = writeTempVrma(
    context,
    buildRotationVrma({ angle: 0, duration: 1.5, frames: 31 }),
    "pose.vrma",
  );
  const asLoop = analyzeVrmaFile(filePath, { purpose: "loop" });
  const asPose = analyzeVrmaFile(filePath, { purpose: "pose" });
  assert.ok(
    asLoop.issues.some((issue) => issue.code === "dead_motion"),
    "loop purpose should flag near-static motion as dead_motion",
  );
  assert.ok(
    !asPose.issues.some((issue) => issue.code === "dead_motion"),
    "pose must not flag low motion amplitude as dead_motion",
  );
  assert.equal(asPose.purpose, "pose");
});

test("broken file is rejected", (context) => {
  const { filePath } = writeTempVrma(context, Buffer.from("not-a-glb"), "bad.vrma");
  const report = analyzeVrmaFile(filePath);
  assert.equal(report.verdict, VERDICT.REJECT);
  assert.ok(report.issues.some((issue) => issue.code === "parse_error"));
});

test("markdown report lists reject details and can be written", (context) => {
  const good = writeTempVrma(context, buildRotationVrma(), "good.vrma");
  const bad = writeTempVrma(
    context,
    buildRotationVrma({ spike: true, loopSeam: true }),
    "bad.vrma",
  );
  const reports = [analyzeVrmaFile(good.filePath), analyzeVrmaFile(bad.filePath)];
  const markdown = formatMarkdownReport(reports, {
    sourceDir: good.dir,
    gate: QUALITY_GATE.REPORT,
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(markdown, /VoxAvatar VRMA 品質報告/);
  assert.match(markdown, /判定門檻/);
  assert.match(markdown, /觀察／淘汰明細/);

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-report-"));
  context.after(() => fs.rmSync(outDir, { recursive: true, force: true }));
  const { reportPath } = writeMarkdownReport(reports, {
    reportDir: outDir,
    sourceDir: good.dir,
    gate: QUALITY_GATE.STRICT,
  });
  assert.equal(path.basename(reportPath), "voxavatar-vrma-report.md");
  assert.ok(fs.existsSync(reportPath));
  assert.match(fs.readFileSync(reportPath, "utf8"), /把關模式：`strict`/);
});
