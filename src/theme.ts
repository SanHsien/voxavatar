export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = Exclude<ThemePreference, 'system'>;

export const THEME_OPTIONS: Array<{ id: ThemePreference; label: string }> = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export const LIGHT_QUERY = '(prefers-color-scheme: light)';

const STORAGE_KEY = 'voxavatar.settings.theme';
/** 舊版 localStorage key；讀取後遷移到 STORAGE_KEY。 */
const LEGACY_STORAGE_KEY = 'persona.settings.theme';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) return stored;

    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (isThemePreference(legacy)) {
      window.localStorage.setItem(STORAGE_KEY, legacy);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
  } catch {
    // Storage can be unavailable; fall back to following the desktop.
  }
  return 'system';
}

export function storeTheme(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Preference stays for this session only.
  }
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return window.matchMedia(LIGHT_QUERY).matches ? 'light' : 'dark';
}

/**
 * Reflects the resolved theme on <html data-theme>, which every light token is
 * scoped to. Transitions are suppressed for the swap: colour transitions that
 * straddle a custom-property change leave stale computed values behind, and a
 * staggered 130ms cross-fade of the whole window looks unintentional anyway.
 */
export function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  if (root.dataset.theme === resolved) return;

  root.dataset.themeSwitching = '';
  root.dataset.theme = resolved;
  // Flush the suppressed style so the swap itself is never interpolated.
  void root.offsetHeight;
  window.requestAnimationFrame(() => {
    delete root.dataset.themeSwitching;
  });

  // Keeps the native window background in step, so a resize never exposes
  // bands of the opposite theme. Absent outside the desktop app.
  window.voxavatarSettings?.setWindowTheme?.(resolved);
}
