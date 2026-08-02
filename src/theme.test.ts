/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  storeTheme,
} from './theme';

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.themeSwitching;
  delete window.voxavatarSettings;
});

describe('theme', () => {
  it('defaults to system and migrates legacy persona key', () => {
    expect(readStoredTheme()).toBe('system');
    window.localStorage.setItem('persona.settings.theme', 'dark');
    expect(readStoredTheme()).toBe('dark');
    expect(window.localStorage.getItem('voxavatar.settings.theme')).toBe('dark');
    expect(window.localStorage.getItem('persona.settings.theme')).toBeNull();
  });

  it('stores preference and clears legacy key', () => {
    window.localStorage.setItem('persona.settings.theme', 'light');
    storeTheme('dark');
    expect(window.localStorage.getItem('voxavatar.settings.theme')).toBe('dark');
    expect(window.localStorage.getItem('persona.settings.theme')).toBeNull();
  });

  it('resolves system preference from matchMedia', () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
    expect(resolveTheme('system')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('applies theme dataset and notifies settings bridge', () => {
    const setWindowTheme = vi.fn();
    window.voxavatarSettings = {
      setWindowTheme,
    } as unknown as NonNullable<Window['voxavatarSettings']>;
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(setWindowTheme).toHaveBeenCalledWith('light');
  });
});
