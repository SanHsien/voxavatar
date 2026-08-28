import {
  THEME_OPTIONS,
  type ThemePreference,
} from '../../theme';

type SettingsBridge = NonNullable<Window['voxavatarSettings']>;

type SettingsTranslate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export type LightingNumberField =
  | 'exposure'
  | 'environment_intensity'
  | 'key_light_intensity'
  | 'ambient_intensity';

export interface SettingsAppearanceSectionProps {
  bridge: SettingsBridge | undefined;
  busy: boolean;
  chooseTheme: (next: ThemePreference) => void;
  previewCharacterSize: (size: number) => void;
  previewIdleRestMs: (ms: number) => void;
  previewLighting: VoxAvatarLightingSettings;
  previewLightingField: <
    Field extends keyof VoxAvatarLightingSettings,
  >(
    field: Field,
    value: VoxAvatarLightingSettings[Field],
  ) => void;
  previewLightingNumber: (
    field: LightingNumberField,
    input: HTMLInputElement,
  ) => void;
  resetLighting: () => Promise<void>;
  saveCharacterSize: (size: number) => Promise<void>;
  saveIdleRestMs: (ms: number) => Promise<void>;
  saveLightingField: <
    Field extends keyof VoxAvatarLightingSettings,
  >(
    field: Field,
    value: VoxAvatarLightingSettings[Field],
  ) => Promise<void>;
  saveLightingNumber: (
    field: LightingNumberField,
    input: HTMLInputElement,
  ) => void;
  saveUiLocale: (locale: 'zh-TW' | 'en') => Promise<void>;
  selectedModel: VoxAvatarModelSettings | undefined;
  settings: VoxAvatarSettingsSnapshot;
  t: SettingsTranslate;
  themePreference: ThemePreference;
}

export function SettingsAppearanceSection({
  bridge,
  busy,
  chooseTheme,
  previewCharacterSize,
  previewIdleRestMs,
  previewLighting,
  previewLightingField,
  previewLightingNumber,
  resetLighting,
  saveCharacterSize,
  saveIdleRestMs,
  saveLightingField,
  saveLightingNumber,
  saveUiLocale,
  selectedModel,
  settings,
  t,
  themePreference,
}: SettingsAppearanceSectionProps) {
  return (
    <>
      <section className="settings-panel theme-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('appearance.localeTitle')}</h2>
            <p>{t('appearance.localeDesc')}</p>
          </div>
        </div>
        <div
          aria-label={t('appearance.localeAria')}
          className="theme-segmented"
          role="group"
        >
          {(
            [
              { id: 'zh-TW' as const, label: t('appearance.localeZh') },
              { id: 'en' as const, label: t('appearance.localeEn') },
            ] as const
          ).map((option) => (
            <button
              aria-pressed={(settings.ui_locale ?? 'zh-TW') === option.id}
              data-testid={`locale-${option.id}`}
              key={option.id}
              onClick={() => void saveUiLocale(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-panel theme-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('appearance.themeTitle')}</h2>
            <p>{t('appearance.themeDesc')}</p>
          </div>
        </div>
        <div
          aria-label={t('appearance.themeAria')}
          className="theme-segmented"
          role="group"
        >
          {THEME_OPTIONS.map((option) => (
            <button
              aria-pressed={themePreference === option.id}
              data-testid={`theme-${option.id}`}
              key={option.id}
              onClick={() => chooseTheme(option.id)}
              type="button"
            >
              <span
                aria-hidden="true"
                className="theme-swatch"
                data-theme-preview={option.id}
              />
              {t(`appearance.theme.${option.id}`)}
            </button>
          ))}
        </div>
        <p className="theme-note">{t('appearance.themeNote')}</p>
      </section>

      <section className="settings-panel appearance-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('appearance.sizeTitle')}</h2>
            <p>{t('appearance.sizeDesc')}</p>
          </div>
          <strong className="size-value">
            {Math.round(settings.character_size * 100)}%
          </strong>
        </div>
        <input
          aria-label={t('appearance.sizeAria')}
          className="size-slider"
          max="1.6"
          min="0.3"
          data-testid="character-size-slider"
          onBlur={(event) =>
            void saveCharacterSize(Number(event.currentTarget.value))
          }
          onChange={(event) =>
            previewCharacterSize(Number(event.currentTarget.value))
          }
          onKeyUp={(event) => {
            if (event.key.startsWith('Arrow')) {
              void saveCharacterSize(Number(event.currentTarget.value));
            }
          }}
          onPointerUp={(event) =>
            void saveCharacterSize(Number(event.currentTarget.value))
          }
          step="0.05"
          type="range"
          value={settings.character_size}
        />
        <div className="slider-labels">
          <span>{t('appearance.sizeMin')}</span>
          <span>{t('appearance.sizeDefault')}</span>
          <span>{t('appearance.sizeMax')}</span>
        </div>
      </section>

      <section className="settings-panel appearance-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('appearance.idleRestTitle')}</h2>
            <p>{t('appearance.idleRestDesc')}</p>
          </div>
          <strong className="size-value">
            {t('appearance.idleRestValue', {
              seconds: Math.round((settings.idle_rest_ms ?? 8000) / 1000),
            })}
          </strong>
        </div>
        <input
          aria-label={t('appearance.idleRestAria')}
          className="size-slider"
          max="60"
          min="2"
          data-testid="idle-rest-slider"
          onBlur={(event) =>
            void saveIdleRestMs(Number(event.currentTarget.value) * 1000)
          }
          onChange={(event) =>
            previewIdleRestMs(Number(event.currentTarget.value) * 1000)
          }
          onKeyUp={(event) => {
            if (event.key.startsWith('Arrow')) {
              void saveIdleRestMs(Number(event.currentTarget.value) * 1000);
            }
          }}
          onPointerUp={(event) =>
            void saveIdleRestMs(Number(event.currentTarget.value) * 1000)
          }
          step="1"
          type="range"
          value={Math.round((settings.idle_rest_ms ?? 8000) / 1000)}
        />
        <div className="slider-labels">
          <span>{t('appearance.idleRestMin')}</span>
          <span>{t('appearance.idleRestMax')}</span>
        </div>
      </section>

      <section className="settings-panel lighting-panel">
        <div className="panel-heading">
          <div>
            <h2>{t('appearance.lightingTitle')}</h2>
            <p>{t('appearance.lightingDesc')}</p>
          </div>
          <button
            className="lighting-reset-button"
            disabled={busy || !bridge || !selectedModel}
            onClick={() => void resetLighting()}
            type="button"
          >
            {t('appearance.lightingReset')}
          </button>
        </div>

        <div className="lighting-select-row">
          <span>{t('appearance.toneMapping')}</span>
          <select
            disabled={busy || !bridge || !selectedModel}
            onChange={(e) => {
              const value = e.currentTarget.value as 'none' | 'aces';
              previewLightingField('tone_mapping', value);
              void saveLightingField('tone_mapping', value);
            }}
            value={previewLighting.tone_mapping}
          >
            <option value="none">{t('appearance.toneNone')}</option>
            <option value="aces">{t('appearance.toneAces')}</option>
          </select>
        </div>

        <div className="lighting-toggle-row">
          <span>{t('appearance.hdrEnvironment')}</span>
          <button
            aria-checked={previewLighting.environment_enabled}
            className={`toggle-switch${previewLighting.environment_enabled ? ' active' : ''}`}
            disabled={busy || !bridge || !selectedModel}
            onClick={() => {
              const next = !previewLighting.environment_enabled;
              previewLightingField('environment_enabled', next);
              void saveLightingField('environment_enabled', next);
            }}
            role="switch"
            type="button"
          />
        </div>

        <div className="lighting-row">
          <label>
            <span>{t('appearance.envIntensity')}</span>
            <input
              disabled={busy || !bridge || !selectedModel}
              max="2"
              min="0"
              onChange={(event) =>
                previewLightingNumber(
                  'environment_intensity',
                  event.currentTarget,
                )
              }
              onKeyUp={(event) =>
                saveLightingNumber('environment_intensity', event.currentTarget)
              }
              onPointerUp={(event) =>
                saveLightingNumber('environment_intensity', event.currentTarget)
              }
              step="0.01"
              type="range"
              value={previewLighting.environment_intensity}
            />
            <div className="slider-labels">
              <span>0.00</span>
              <span>1.00</span>
              <span>2.00</span>
            </div>
          </label>
          <input
            className="lighting-value"
            disabled={busy || !bridge || !selectedModel}
            max="2"
            min="0"
            onBlur={(event) =>
              saveLightingNumber('environment_intensity', event.currentTarget)
            }
            onChange={(event) =>
              previewLightingNumber(
                'environment_intensity',
                event.currentTarget,
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            step="0.01"
            type="number"
            value={previewLighting.environment_intensity}
          />
        </div>

        <div className="lighting-row">
          <label>
            <span>{t('appearance.keyIntensity')}</span>
            <input
              disabled={busy || !bridge || !selectedModel}
              max="4"
              min="0"
              onChange={(event) =>
                previewLightingNumber('key_light_intensity', event.currentTarget)
              }
              onKeyUp={(event) =>
                saveLightingNumber('key_light_intensity', event.currentTarget)
              }
              onPointerUp={(event) =>
                saveLightingNumber('key_light_intensity', event.currentTarget)
              }
              step="0.01"
              type="range"
              value={previewLighting.key_light_intensity}
            />
            <div className="slider-labels">
              <span>0.00</span>
              <span>{Math.PI.toFixed(2)}</span>
              <span>4.00</span>
            </div>
          </label>
          <input
            className="lighting-value"
            disabled={busy || !bridge || !selectedModel}
            max="4"
            min="0"
            onBlur={(event) =>
              saveLightingNumber('key_light_intensity', event.currentTarget)
            }
            onChange={(event) =>
              previewLightingNumber('key_light_intensity', event.currentTarget)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            step="0.01"
            type="number"
            value={previewLighting.key_light_intensity}
          />
        </div>

        <div className="lighting-row">
          <label>
            <span>{t('appearance.ambientIntensity')}</span>
            <input
              disabled={busy || !bridge || !selectedModel}
              max="4"
              min="0"
              onChange={(event) =>
                previewLightingNumber('ambient_intensity', event.currentTarget)
              }
              onKeyUp={(event) =>
                saveLightingNumber('ambient_intensity', event.currentTarget)
              }
              onPointerUp={(event) =>
                saveLightingNumber('ambient_intensity', event.currentTarget)
              }
              step="0.01"
              type="range"
              value={previewLighting.ambient_intensity}
            />
            <div className="slider-labels">
              <span>0.00</span>
              <span>{Math.PI.toFixed(2)}</span>
              <span>4.00</span>
            </div>
          </label>
          <input
            className="lighting-value"
            disabled={busy || !bridge || !selectedModel}
            max="4"
            min="0"
            onBlur={(event) =>
              saveLightingNumber('ambient_intensity', event.currentTarget)
            }
            onChange={(event) =>
              previewLightingNumber('ambient_intensity', event.currentTarget)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            step="0.01"
            type="number"
            value={previewLighting.ambient_intensity}
          />
        </div>

        <div className="lighting-row">
          <label>
            <span>{t('appearance.exposure')}</span>
            <input
              disabled={busy || !bridge || !selectedModel}
              max="3"
              min="0.1"
              onChange={(event) =>
                previewLightingNumber('exposure', event.currentTarget)
              }
              onKeyUp={(event) =>
                saveLightingNumber('exposure', event.currentTarget)
              }
              onPointerUp={(event) =>
                saveLightingNumber('exposure', event.currentTarget)
              }
              step="0.01"
              type="range"
              value={previewLighting.exposure}
            />
            <div className="slider-labels">
              <span>0.10</span>
              <span>1.00</span>
              <span>3.00</span>
            </div>
          </label>
          <input
            className="lighting-value"
            disabled={busy || !bridge || !selectedModel}
            max="3"
            min="0.1"
            onBlur={(event) =>
              saveLightingNumber('exposure', event.currentTarget)
            }
            onChange={(event) =>
              previewLightingNumber('exposure', event.currentTarget)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            step="0.01"
            type="number"
            value={previewLighting.exposure}
          />
        </div>
      </section>
    </>
  );
}
