import { describe, expect, it } from 'vitest';
import { resolveSetupCodeLabel } from './setup-code-label';
import { settingsT } from './settings-i18n';

describe('resolveSetupCodeLabel', () => {
  it('localizes known voice and mcp codes', () => {
    const t = (key: string) => settingsT('zh-TW', key);
    expect(resolveSetupCodeLabel('voice_target_missing', t)).toBe(
      settingsT('zh-TW', 'setup.code.voice_target_missing'),
    );
    expect(resolveSetupCodeLabel('voice_listening', t)).toBe(
      settingsT('zh-TW', 'setup.code.voice_listening'),
    );
    expect(resolveSetupCodeLabel('mcp_online', t)).toBe(
      settingsT('zh-TW', 'setup.code.mcp_online'),
    );
  });

  it('falls back to raw code when missing', () => {
    expect(resolveSetupCodeLabel('totally_unknown_code', (key) => key)).toBe(
      'totally_unknown_code',
    );
    expect(resolveSetupCodeLabel('', (key) => key)).toBe('');
  });
});
