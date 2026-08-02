/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsAppearanceSection } from './SettingsAppearanceSection';
import {
  DEFAULT_LIGHTING,
  SETTINGS_FALLBACK,
} from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

function renderAppearance(
  overrides: Partial<React.ComponentProps<typeof SettingsAppearanceSection>> = {},
) {
  const saveUiLocale = vi.fn(async () => undefined);
  const chooseTheme = vi.fn();
  const props: React.ComponentProps<typeof SettingsAppearanceSection> = {
    bridge: { get: vi.fn() } as unknown as NonNullable<
      Window['voxavatarSettings']
    >,
    busy: false,
    chooseTheme,
    previewCharacterSize: vi.fn(),
    previewIdleRestMs: vi.fn(),
    previewLighting: DEFAULT_LIGHTING,
    previewLightingField: vi.fn(),
    previewLightingNumber: vi.fn(),
    resetLighting: vi.fn(),
    saveCharacterSize: vi.fn(),
    saveIdleRestMs: vi.fn(),
    saveLightingField: vi.fn(),
    saveLightingNumber: vi.fn(),
    saveUiLocale,
    selectedModel: SETTINGS_FALLBACK.models[0],
    settings: SETTINGS_FALLBACK,
    t: (key, vars) => settingsT('zh-TW', key, vars),
    themePreference: 'system',
    ...overrides,
  };
  const view = render(<SettingsAppearanceSection {...props} />);
  return { ...view, saveUiLocale, chooseTheme };
}

describe('SettingsAppearanceSection', () => {
  it('switches locale and theme preferences', async () => {
    const user = userEvent.setup();
    const { saveUiLocale, chooseTheme } = renderAppearance();

    expect(screen.getByTestId('locale-zh-TW')).toBeTruthy();
    expect(screen.getByTestId('theme-system')).toBeTruthy();

    await user.click(screen.getByTestId('locale-en'));
    expect(saveUiLocale).toHaveBeenCalledWith('en');

    await user.click(screen.getByTestId('theme-dark'));
    expect(chooseTheme).toHaveBeenCalledWith('dark');
  });
});
