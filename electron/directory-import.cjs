"use strict";

const { QUALITY_GATE, VERDICT } = require("./vrma-quality.cjs");

function buildDirectoryImportSummary({
  kind,
  rootDir,
  scanned,
  truncated,
  imported,
  skippedQuality,
  skippedInvalid,
  skippedLimit,
  failed,
  quality,
  reportPath,
  reportError,
}) {
  return {
    kind,
    root_dir: rootDir,
    scanned,
    truncated: Boolean(truncated),
    imported,
    skipped_quality: skippedQuality,
    skipped_invalid: skippedInvalid,
    skipped_limit: skippedLimit,
    failed,
    quality,
    report_path: reportPath,
    report_error: reportError,
  };
}

/**
 * 分析目錄匯入候選檔並依品質閘門篩選；不寫入 catalog。
 */
function evaluateDirectoryImport({
  filePaths,
  gate,
  analyzeFn,
  summarizeFn,
  writeReportFn,
  preferredReportDir,
  sourceDir,
}) {
  let quality = null;
  let reportPath = null;
  let reportError = null;
  let importCandidates = filePaths;
  let skippedQuality = 0;
  let reports = null;

  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return {
      quality,
      reportPath,
      reportError,
      importCandidates: Array.isArray(filePaths) ? filePaths : [],
      skippedQuality,
      reports,
    };
  }

  if (gate !== QUALITY_GATE.OFF) {
    reports = analyzeFn(filePaths);
    quality = summarizeFn(reports);
    try {
      ({ reportPath } = writeReportFn(reports, {
        reportDir: preferredReportDir,
        sourceDir,
        gate,
      }));
    } catch (error) {
      reportError =
        error instanceof Error ? error.message : String(error);
    }
    if (gate === QUALITY_GATE.STRICT) {
      const rejected = new Set(
        reports
          .filter((report) => report.verdict === VERDICT.REJECT)
          .map((report) => report.filePath),
      );
      skippedQuality = rejected.size;
      importCandidates = filePaths.filter(
        (filePath) => !rejected.has(filePath),
      );
    }
  }

  return {
    quality,
    reportPath,
    reportError,
    importCandidates,
    skippedQuality,
    reports,
  };
}

module.exports = {
  buildDirectoryImportSummary,
  evaluateDirectoryImport,
};
