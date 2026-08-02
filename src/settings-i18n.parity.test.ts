import { describe, expect, it } from 'vitest';
import { settingsMessageKeys, settingsT } from './settings-i18n';

describe('settings-i18n parity', () => {
  it('zh-TW and en expose the same message keys', () => {
    const zh = settingsMessageKeys('zh-TW');
    const en = settingsMessageKeys('en');
    expect(zh).toEqual(en);
  });

  it('covers every native helper error and hint key in both locales', () => {
    const codes = [
      'native_helper_missing',
      'native_helper_spawn_failed',
      'native_helper_com_error',
      'native_helper_wasapi_error',
      'native_helper_device_error',
      'native_helper_usage',
      'native_helper_permission',
      'native_helper_exit_nonzero',
      'native_helper_unknown',
    ];
    for (const locale of ['zh-TW', 'en'] as const) {
      for (const code of codes) {
        const errorKey = `helper.error.${code}`;
        const hintKey = `helper.hint.${code}`;
        expect(settingsT(locale, errorKey)).not.toBe(errorKey);
        expect(settingsT(locale, hintKey)).not.toBe(hintKey);
      }
      for (const code of [
        'voice_target_missing',
        'voice_listening',
        'voice_no_output',
        'voice_ready',
      ]) {
        const key = `setup.code.${code}`;
        expect(settingsT(locale, key)).not.toBe(key);
      }
    }
  });
});
