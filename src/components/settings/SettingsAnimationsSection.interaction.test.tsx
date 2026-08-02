/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsAnimationsSection } from './SettingsAnimationsSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

const emptyMetadata: CustomAnimationMetadata = {
  animation_name: '',
  animation_description: '',
  animation_trigger_scenario: '',
};

function renderSection(
  overrides: Partial<
    React.ComponentProps<typeof SettingsAnimationsSection>
  > = {},
) {
  const updateClipsPurpose = vi.fn(async () => true);
  const playUnassignedClip = vi.fn();
  const addUnassignedClips = vi.fn(async () => undefined);
  const assignVrmaByFilename = vi.fn(async () => undefined);
  const bridge = {
    addUnassignedClips: vi.fn(),
    updateClipsPurpose: vi.fn(),
    assignVrmaByFilename: vi.fn(),
  } as unknown as NonNullable<Window['voxavatarSettings']>;

  const props: React.ComponentProps<typeof SettingsAnimationsSection> = {
    addAnimationClips: vi.fn(),
    addAnimationClipsFromDirectory: vi.fn(),
    addUnassignedClips,
    assignUnassignedClip: vi.fn(),
    assignVrmaByFilename,
    animationMetadata: emptyMetadata,
    applyActionPreset: vi.fn(),
    applyAndCreateActionPreset: vi.fn(),
    beginEditingAnimation: vi.fn(),
    bridge,
    busy: false,
    chooseVrmaReportDir: vi.fn(),
    clearVrmaReportDir: vi.fn(),
    createAnimation: vi.fn(),
    deleteAllUserAnimationClips: vi.fn(),
    deleteAnimation: vi.fn(),
    deleteAnimationClip: vi.fn(),
    deleteUnassignedClip: vi.fn(),
    editingAnimationId: null,
    editingAnimationMetadata: emptyMetadata,
    highlightedAnimationId: null,
    locale: 'zh-TW',
    moveAnimationClip: vi.fn(),
    moveAnimationClipToUnassigned: vi.fn(),
    playAnimationClip: vi.fn(),
    playUnassignedClip,
    previewClipId: null,
    reorderAnimationClip: vi.fn(),
    resetPackagedAnimations: vi.fn(),
    saveAnimation: vi.fn(),
    selectedActionPresetId: null,
    setAnimationMetadata: vi.fn(),
    setEditingAnimationId: vi.fn(),
    setEditingAnimationMetadata: vi.fn(),
    setSelectedActionPresetId: vi.fn(),
    setVrmaQualityGate: vi.fn(),
    setVrmaQualityScoreThresholds: vi.fn(),
    settings: {
      ...SETTINGS_FALLBACK,
      unassigned_clips: [
        {
          id: 'pool-clip-1',
          animation_name: 'wave-a',
          origin: 'user',
          removable: true,
          purpose: 'one-shot',
          asset_url: 'voxavatar-asset://animation/pool-clip-1.vrma',
        },
      ],
    },
    t: (key, vars) => settingsT('zh-TW', key, vars),
    updateAnimationClip: vi.fn(),
    updateClipsPurpose,
    updateUnassignedClip: vi.fn(),
    ...overrides,
  };

  const view = render(<SettingsAnimationsSection {...props} />);
  return {
    ...view,
    updateClipsPurpose,
    playUnassignedClip,
    addUnassignedClips,
    assignVrmaByFilename,
  };
}

describe('SettingsAnimationsSection interaction', () => {
  it('previews pool clips and batches purpose updates', async () => {
    const user = userEvent.setup();
    const { updateClipsPurpose, playUnassignedClip } = renderSection();

    await user.click(
      screen.getByRole('button', {
        name: settingsT('zh-TW', 'actions.previewClip', { name: 'wave-a' }),
      }),
    );
    expect(playUnassignedClip).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole('checkbox', {
        name: settingsT('zh-TW', 'actions.selectClip', { name: 'wave-a' }),
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: settingsT('zh-TW', 'actions.batchPurposePose'),
      }),
    );
    expect(updateClipsPurpose).toHaveBeenCalledWith(
      [{ clipId: 'pool-clip-1', pool: true }],
      'pose',
    );
  });

  it('adds pool clips and triggers filename assignment', async () => {
    const user = userEvent.setup();
    const { addUnassignedClips, assignVrmaByFilename, container } =
      renderSection();

    const poolPanel = container.querySelector('.unassigned-pool-panel');
    expect(poolPanel).toBeTruthy();
    await user.click(
      within(poolPanel as HTMLElement).getByRole('button', {
        name: settingsT('zh-TW', 'actions.addPoolClips'),
      }),
    );
    await user.click(
      screen.getByRole('button', {
        name: settingsT('zh-TW', 'actions.assignByFilename'),
      }),
    );
    expect(addUnassignedClips).toHaveBeenCalledTimes(1);
    expect(assignVrmaByFilename).toHaveBeenCalledTimes(1);
  });
});
