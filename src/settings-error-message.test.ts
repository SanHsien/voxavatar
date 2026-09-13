import { describe, expect, it } from 'vitest';
import { settingsErrorMessage } from './settings-error-message';

describe('settingsErrorMessage', () => {
  it('strips Electron IPC prefix and redacts paths', () => {
    const message = settingsErrorMessage(
      new Error(
        "Error invoking remote method 'voxavatar:settings-import-model': Error: fail C:\\Users\\SanHsien\\a.vrm",
      ),
    );
    expect(message).not.toMatch(/SanHsien|a\.vrm/i);
    expect(message).not.toMatch(/Error invoking remote method/);
    expect(message).toMatch(/<asset>|<home>|<path>/);
  });

  it('redacts non-Error string notices', () => {
    const message = settingsErrorMessage(
      'cannot open /Users/SanHsien/Models/hero.vrm',
    );
    expect(message).not.toMatch(/SanHsien|hero\.vrm/i);
  });
});
