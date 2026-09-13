/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

  it('exposes 30% character size and idle rest sliders', () => {
    const saveCharacterSize = vi.fn(async () => undefined);
    const saveIdleRestMs = vi.fn(async () => undefined);
    const previewCharacterSize = vi.fn();
    const previewIdleRestMs = vi.fn();
    renderAppearance({
      saveCharacterSize,
      saveIdleRestMs,
      previewCharacterSize,
      previewIdleRestMs,
      settings: { ...SETTINGS_FALLBACK, character_size: 1, idle_rest_ms: 8000 },
    });

    const size = screen.getByTestId('character-size-slider');
    expect(size).toHaveProperty('min', '0.3');
    expect(size).toHaveProperty('max', '1.6');
    fireEvent.change(size, { target: { value: '0.3' } });
    fireEvent.pointerUp(size, { target: { value: '0.3' } });
    expect(previewCharacterSize).toHaveBeenCalledWith(0.3);
    expect(saveCharacterSize).toHaveBeenCalledWith(0.3);

    const idle = screen.getByTestId('idle-rest-slider');
    expect(idle).toHaveProperty('min', '2');
    expect(idle).toHaveProperty('max', '60');
    fireEvent.change(idle, { target: { value: '2' } });
    fireEvent.pointerUp(idle, { target: { value: '2' } });
    expect(previewIdleRestMs).toHaveBeenCalledWith(2000);
    expect(saveIdleRestMs).toHaveBeenCalledWith(2000);
  });
});
