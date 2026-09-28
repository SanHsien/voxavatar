import { describe, expect, it } from 'vitest';
import {
  directoryImportExtraParts,
  formatActionPackImportNotice,
} from './import-feedback';

const t = (key: string, vars?: Record<string, string | number>) => {
  if (key === 'notice.importPartial') {
    return `略過 ${vars?.skipped}、失敗 ${vars?.failed}`;
  }
  if (key === 'notice.reportSavedShort') return '已寫入品質報告。';
  if (key === 'notice.reportFailed') return `報告失敗：${vars?.error}`;
  if (key === 'notice.actionPackImported') {
    return `匯入 ${vars?.name}（${vars?.created}/${vars?.clips}）`;
  }
  if (key === 'notice.actionPackPartial') {
    return `有 ${vars?.failed} 個動作失敗。`;
  }
  return key;
};

describe('directoryImportExtraParts', () => {
  it('omits partial line when nothing was skipped or failed', () => {
    expect(
      directoryImportExtraParts(
        {
          skipped_quality: 0,
          skipped_invalid: 0,
          skipped_limit: 0,
          failed: [],
          report_path: null,
          report_error: null,
        },
        t,
      ),
    ).toEqual([]);
  });

  it('reports skips, failures, and report path', () => {
    expect(
      directoryImportExtraParts(
        {
          skipped_quality: 2,
          skipped_invalid: 1,
          skipped_limit: 0,
          failed: [{ path: 'a.vrm', error: 'bad' }],
          report_path: 'C:\\report.md',
          report_error: null,
        },
        t,
      ),
    ).toEqual(['略過 3、失敗 1', '已寫入品質報告。']);
  });

  it('redacts paths in report_error before interpolating', () => {
    expect(
      directoryImportExtraParts(
        {
          skipped_quality: 0,
          skipped_invalid: 0,
          skipped_limit: 0,
          failed: [],
          report_path: null,
          report_error: 'EACCES C:\\Users\\SanHsien\\Reports\\out.md',
        },
        t,
      ),
    ).toEqual([
      expect.stringMatching(/報告失敗：/),
    ]);
    const line = directoryImportExtraParts(
      {
        skipped_quality: 0,
        skipped_invalid: 0,
        skipped_limit: 0,
        failed: [],
        report_path: null,
        report_error: 'EACCES C:\\Users\\SanHsien\\Reports\\out.md',
      },
      t,
    )[0];
    expect(line).not.toMatch(/SanHsien/i);
    expect(line).toMatch(/<home>|<path>|<asset>/);
  });
});

describe('formatActionPackImportNotice', () => {
  it('includes partial failure count when any action errors', () => {
    expect(
      formatActionPackImportNotice(
        'demo',
        [
          {
            animation_name: 'ok',
            created: true,
            clips_imported: 2,
            error: null,
          },
          {
            animation_name: 'bad',
            created: false,
            clips_imported: 0,
            error: 'gate',
          },
        ],
        t,
      ),
    ).toBe('匯入 demo（1/2） 有 1 個動作失敗。');
  });
});
