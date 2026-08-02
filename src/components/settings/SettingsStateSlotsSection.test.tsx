import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsStateSlotsSection } from './SettingsStateSlotsSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

function baseSettings(
  overrides: Partial<VoxAvatarSettingsSnapshot> = {},
): VoxAvatarSettingsSnapshot {
  return {
    ...SETTINGS_FALLBACK,
    ...overrides,
    animations: overrides.animations ?? [
      ...SETTINGS_FALLBACK.animations,
      {
        id: 'user-work',
        animation_name: 'work-loop',
        animation_description: 'Working',
        animation_trigger_scenario: 'When busy',
        animation_type: null,
        origin: 'user',
        system: false,
        editable: true,
        modified: false,
        removable: true,
        clips: [
          {
            id: 'clip-1',
            animation_name: 'work-loop1',
            origin: 'user',
            removable: true,
            purpose: 'loop',
            asset_url: 'voxavatar-asset://animation/clip-1.vrma',
          },
        ],
        asset_urls: ['voxavatar-asset://animation/clip-1.vrma'],
      },
    ],
    state_slot_bindings: overrides.state_slot_bindings ?? {
      working: 'work-loop',
    },
  };
}

describe('SettingsStateSlotsSection', () => {
  it('renders all system state slots and playable action options', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const html = renderToStaticMarkup(
      <SettingsStateSlotsSection
        bridge={undefined}
        busy={false}
        importActionPack={vi.fn()}
        setStateSlotBinding={vi.fn()}
        settings={baseSettings()}
        t={t}
      />,
    );
    expect(html).toContain(t('stateSlots.title'));
    for (const state of [
      'idle',
      'listening',
      'speaking',
      'working',
      'reviewing',
      'success',
      'failed',
    ] as const) {
      expect(html).toContain(t(`stateSlots.state.${state}`));
    }
    expect(html).toContain('work-loop');
    expect(html).toContain('value="work-loop"');
  });

  it('disables import when bridge lacks importActionPack', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const html = renderToStaticMarkup(
      <SettingsStateSlotsSection
        bridge={{ get: vi.fn() } as never}
        busy={false}
        importActionPack={vi.fn()}
        setStateSlotBinding={vi.fn()}
        settings={baseSettings({
          animations: SETTINGS_FALLBACK.animations,
          state_slot_bindings: {},
        })}
        t={t}
      />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain(t('stateSlots.noPlayable'));
  });
});
