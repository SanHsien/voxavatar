/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    state_slot_bindings: overrides.state_slot_bindings ?? {},
  };
}

function renderSection(
  props: Partial<{
    importActionPack: () => Promise<void>;
    setStateSlotBinding: (
      state: 'working',
      animationName: string | null,
    ) => Promise<void>;
    settings: VoxAvatarSettingsSnapshot;
  }> = {},
) {
  const setStateSlotBinding =
    props.setStateSlotBinding ?? vi.fn(async () => undefined);
  const importActionPack =
    props.importActionPack ?? vi.fn(async () => undefined);
  const bridge = {
    setStateSlotBinding,
    importActionPack: vi.fn(),
  } as unknown as NonNullable<Window['voxavatarSettings']>;

  const view = render(
    <SettingsStateSlotsSection
      bridge={bridge}
      busy={false}
      importActionPack={importActionPack}
      setStateSlotBinding={setStateSlotBinding as never}
      settings={props.settings ?? baseSettings()}
      t={(key, vars) => settingsT('zh-TW', key, vars)}
    />,
  );
  return { ...view, setStateSlotBinding, importActionPack };
}

describe('SettingsStateSlotsSection interaction', () => {
  it('selects a playable action for a state slot', async () => {
    const user = userEvent.setup();
    const { setStateSlotBinding } = renderSection();
    const workingLabel = settingsT('zh-TW', 'stateSlots.state.working');
    const field = screen.getByText(workingLabel, { selector: 'label' });
    const select = within(field).getByRole('combobox');
    await user.selectOptions(select, 'work-loop');
    expect(setStateSlotBinding).toHaveBeenCalledWith('working', 'work-loop');
  });

  it('clears a state slot binding when choosing none', async () => {
    const user = userEvent.setup();
    const { setStateSlotBinding } = renderSection({
      settings: baseSettings({
        state_slot_bindings: { working: 'work-loop' },
      }),
    });
    const workingLabel = settingsT('zh-TW', 'stateSlots.state.working');
    const field = screen.getByText(workingLabel, { selector: 'label' });
    const select = within(field).getByRole('combobox');
    await user.selectOptions(select, '');
    expect(setStateSlotBinding).toHaveBeenCalledWith('working', null);
  });

  it('imports an action pack when the button is clicked', async () => {
    const user = userEvent.setup();
    const { importActionPack, container } = renderSection();
    const button = within(container).getByRole('button', {
      name: settingsT('zh-TW', 'stateSlots.importPack'),
    });
    await user.click(button);
    expect(importActionPack).toHaveBeenCalledTimes(1);
  });
});
