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
