import { describe, expect, it } from 'vitest';
import {
  redactDisplayText,
  resolveListenerStatusDetail,
} from './listener-status-copy';

describe('listener-status-copy', () => {
  it('redacts home paths and media filenames', () => {
    const redacted = redactDisplayText(
      'fail C:\\Users\\SanHsien\\Models\\Daily_Miku.vrm /Users/SanHsien/proj',
    );
    expect(redacted).toMatch(/<asset>|<home>|<path>/);
    expect(redacted).not.toMatch(/SanHsien|Daily_Miku/i);
  });

  it('prefers helper_error localization over raw error text', () => {
    const t = (key: string) =>
      key === 'helper.error.native_helper_missing'
        ? '找不到原生 listener'
        : key;
    expect(
      resolveListenerStatusDetail(
        {
          helper_error: 'native_helper_missing',
          error: 'C:\\Users\\SanHsien\\helper.exe missing',
        },
        t,
      ),
    ).toBe('找不到原生 listener');
  });

  it('falls back to redacted error then i18n default', () => {
    const t = (key: string) =>
      key === 'voice.state.noStream' ? '尚無串流' : key;
    expect(
      resolveListenerStatusDetail(
        { error: 'C:\\Users\\SanHsien\\fail.log' },
        t,
      ),
    ).toContain('<');
    expect(resolveListenerStatusDetail(null, t)).toBe('尚無串流');
  });
});
