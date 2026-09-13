"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { QUALITY_GATE, VERDICT } = require("./vrma-quality.cjs");
const {
  buildDirectoryImportSummary,
  evaluateDirectoryImport,
} = require("./directory-import.cjs");

test("buildDirectoryImportSummary maps fields to snake_case summary", () => {
  const summary = buildDirectoryImportSummary({
    kind: "model",
    rootDir: "C:\\assets\\models",
    scanned: 3,
    truncated: true,
    imported: 2,
    skippedQuality: 1,
    skippedInvalid: 0,
    skippedLimit: 0,
    failed: [{ path: "bad.vrm", error: "invalid" }],
    quality: { keep: 2, review: 0, reject: 1 },
    reportPath: "C:\\reports\\report.md",
    reportError: null,
  });

  assert.deepEqual(summary, {
    kind: "model",
    root_dir: "C:\\assets\\models",
    scanned: 3,
    truncated: true,
    imported: 2,
    skipped_quality: 1,
    skipped_invalid: 0,
    skipped_limit: 0,
    failed: [{ path: "bad.vrm", error: "invalid" }],
    quality: { keep: 2, review: 0, reject: 1 },
    report_path: "C:\\reports\\report.md",
    report_error: null,
  });
});

test("evaluateDirectoryImport skips analysis when gate is off", () => {
  let analyzed = false;
  const result = evaluateDirectoryImport({
    kind: "animation",
    filePaths: ["/tmp/a.vrma", "/tmp/b.vrma"],
    gate: QUALITY_GATE.OFF,
    analyzeFn: () => {
      analyzed = true;
      return [];
    },
    summarizeFn: () => null,
    writeReportFn: () => ({ reportPath: "/tmp/report.md" }),
    preferredReportDir: null,
    sourceDir: "/tmp",
  });

  assert.equal(analyzed, false);
  assert.deepEqual(result.importCandidates, ["/tmp/a.vrma", "/tmp/b.vrma"]);
  assert.equal(result.skippedQuality, 0);
  assert.equal(result.quality, null);
  assert.equal(result.reportPath, null);
});

test("evaluateDirectoryImport filters rejected files in strict mode", () => {
  const reports = [
    { filePath: "/tmp/keep.vrma", verdict: VERDICT.KEEP },
    { filePath: "/tmp/reject.vrma", verdict: VERDICT.REJECT },
  ];
  let written = null;
  const result = evaluateDirectoryImport({
    kind: "animation",
    filePaths: reports.map((report) => report.filePath),
    gate: QUALITY_GATE.STRICT,
    analyzeFn: () => reports,
    summarizeFn: () => ({ keep: 1, review: 0, reject: 1 }),
    writeReportFn: (inputReports, options) => {
      written = { inputReports, options };
      return { reportPath: "/tmp/voxavatar-vrma-report.md" };
    },
    preferredReportDir: "/tmp/reports",
    sourceDir: "/tmp/source",
  });

  assert.deepEqual(result.importCandidates, ["/tmp/keep.vrma"]);
  assert.equal(result.skippedQuality, 1);
  assert.equal(result.reportPath, "/tmp/voxavatar-vrma-report.md");
  assert.equal(result.reportError, null);
  assert.deepEqual(result.reports, reports);
  assert.deepEqual(written?.options, {
    reportDir: "/tmp/reports",
    sourceDir: "/tmp/source",
    gate: QUALITY_GATE.STRICT,
  });
});

test("evaluateDirectoryImport keeps all files in report mode", () => {
  const reports = [
    { filePath: "/tmp/reject.vrma", verdict: VERDICT.REJECT },
  ];
  const result = evaluateDirectoryImport({
    kind: "model",
    filePaths: ["/tmp/reject.vrma"],
    gate: QUALITY_GATE.REPORT,
    analyzeFn: () => reports,
    summarizeFn: () => ({ keep: 0, review: 0, reject: 1 }),
    writeReportFn: () => ({ reportPath: "/tmp/report.md" }),
    preferredReportDir: null,
    sourceDir: "/tmp",
  });

  assert.deepEqual(result.importCandidates, ["/tmp/reject.vrma"]);
  assert.equal(result.skippedQuality, 0);
});

test("evaluateDirectoryImport captures report write failures", () => {
  const result = evaluateDirectoryImport({
    kind: "animation",
    filePaths: ["/tmp/a.vrma"],
    gate: QUALITY_GATE.REPORT,
    analyzeFn: () => [{ filePath: "/tmp/a.vrma", verdict: VERDICT.KEEP }],
    summarizeFn: () => ({ keep: 1, review: 0, reject: 0 }),
    writeReportFn: () => {
      throw new Error("disk full");
    },
    preferredReportDir: null,
    sourceDir: "/tmp",
  });

  assert.equal(result.reportPath, null);
  assert.equal(result.reportError, "disk full");
  assert.deepEqual(result.importCandidates, ["/tmp/a.vrma"]);
});

test("evaluateDirectoryImport returns empty result for empty file list", () => {
  const result = evaluateDirectoryImport({
    kind: "model",
    filePaths: [],
    gate: QUALITY_GATE.STRICT,
    analyzeFn: () => {
      throw new Error("should not analyze");
    },
    summarizeFn: () => null,
    writeReportFn: () => ({ reportPath: null }),
    preferredReportDir: null,
    sourceDir: "/tmp",
  });

  assert.deepEqual(result.importCandidates, []);
  assert.equal(result.skippedQuality, 0);
  assert.equal(result.reports, null);
});
