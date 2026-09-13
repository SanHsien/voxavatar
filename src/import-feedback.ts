/**
 * 匯入結果的使用者可讀回饋（純邏輯）。
 * 目錄／action-pack 採 best-effort：成功筆數與失敗／略過要同時可見。
 */

import { redactDisplayText } from './listener-status-copy';

export type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export interface DirectoryImportFeedbackSummary {
  skipped_quality: number;
  skipped_invalid: number;
  skipped_limit: number;
  failed: ReadonlyArray<{ path: string; error: string | null }>;
  report_path: string | null;
  report_error: string | null;
}

export interface ActionPackImportResultItem {
  animation_name: string;
  created: boolean;
  clips_imported: number;
  error: string | null;
}

/** 目錄匯入：略過／失敗／報告路徑附加句。 */
export function directoryImportExtraParts(
  summary: DirectoryImportFeedbackSummary,
  t: Translate,
): string[] {
  const parts: string[] = [];
  const skipped =
    (summary.skipped_quality || 0) +
    (summary.skipped_invalid || 0) +
    (summary.skipped_limit || 0);
  const failedCount = summary.failed?.length ?? 0;
  if (skipped > 0 || failedCount > 0) {
    parts.push(
      t('notice.importPartial', {
        skipped,
        failed: failedCount,
      }),
    );
  }
  if (summary.report_path) {
    parts.push(t('notice.reportSavedShort'));
  } else if (summary.report_error) {
    parts.push(
      t('notice.reportFailed', {
        error: redactDisplayText(summary.report_error),
      }),
    );
  }
  return parts;
}

/** action-pack：建立／片段數，以及失敗動作數。 */
export function formatActionPackImportNotice(
  packName: string,
  results: ReadonlyArray<ActionPackImportResultItem>,
  t: Translate,
): string {
  const created = results.filter((item) => item.created).length;
  const clips = results.reduce(
    (total, item) => total + item.clips_imported,
    0,
  );
  const failed = results.filter((item) => item.error).length;
  const base = t('notice.actionPackImported', {
    name: packName,
    created,
    clips,
  });
  if (failed <= 0) return base;
  return `${base} ${t('notice.actionPackPartial', { failed })}`;
}
