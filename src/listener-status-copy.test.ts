import { describe, expect, it } from 'vitest';
import {
  redactDisplayText,
  resolveHelperNextHint,
  resolveListenerStatusDetail,
} from './listener-status-copy';
import { settingsT } from './settings-i18n';
import redactCases from '../scripts/fixtures/redact-cases.json';

const NATIVE_HELPER_CODES = [
  'native_helper_missing',
  'native_helper_spawn_failed',
  'native_helper_com_error',
  'native_helper_wasapi_error',
  'native_helper_event_error',
  'native_helper_device_error',
  'native_helper_usage',
  'native_helper_permission',
  'native_helper_exit_nonzero',
  'native_helper_unknown',
] as const;

describe('listener-status-copy', () => {
  it('redacts home paths and media filenames', () => {
    const redacted = redactDisplayText(
      'fail C:\\Users\\SanHsien\\Models\\Daily_Miku.vrm /Users/SanHsien/proj',
    );
    expect(redacted).toMatch(/<asset>|<home>|<path>/);
    expect(redacted).not.toMatch(/SanHsien|Daily_Miku/i);
  });

  it('covers shared redact fixture secrets', () => {
    for (const entry of redactCases) {
      const out = redactDisplayText(entry.input);
      for (const secret of entry.mustNotContain) {
        expect(out, entry.id).not.toMatch(
          new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
        );
      }
    }
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

  it('localizes every native helper_error via settings i18n', () => {
    const t = (key: string) => settingsT('zh-TW', key);
    for (const code of NATIVE_HELPER_CODES) {
      expect(
        resolveListenerStatusDetail(
          { helper_error: code, error: 'C:\\Users\\SanHsien\\x.exe' },
          t,
        ),
      ).toBe(settingsT('zh-TW', `helper.error.${code}`));
      expect(resolveHelperNextHint({ helper_error: code }, t)).toBe(
        settingsT('zh-TW', `helper.hint.${code}`),
      );
    }
  });

  it('returns state hints for target_missing / no_output / inactive', () => {
    const t = (key: string) => settingsT('zh-TW', key);
    expect(resolveHelperNextHint({ state: 'target_missing' }, t)).toBe(
      settingsT('zh-TW', 'helper.hint.target_missing'),
    );
    expect(resolveHelperNextHint({ state: 'no_output' }, t)).toBe(
      settingsT('zh-TW', 'helper.hint.no_output'),
    );
    expect(resolveHelperNextHint({ state: 'inactive' }, t)).toBe(
      settingsT('zh-TW', 'helper.hint.inactive'),
    );
  });
});
