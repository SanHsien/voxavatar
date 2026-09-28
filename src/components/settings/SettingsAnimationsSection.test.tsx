import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsAnimationsSection } from './SettingsAnimationsSection';
import { SETTINGS_FALLBACK } from '../../settings-defaults';
import { settingsT } from '../../settings-i18n';

const emptyMetadata: CustomAnimationMetadata = {
  animation_name: '',
  animation_description: '',
  animation_trigger_scenario: '',
};

function noopProps(
  overrides: Partial<
    React.ComponentProps<typeof SettingsAnimationsSection>
  > = {},
): React.ComponentProps<typeof SettingsAnimationsSection> {
  return {
    addAnimationClips: vi.fn(),
    addAnimationClipsFromDirectory: vi.fn(),
    addUnassignedClips: vi.fn(),
    assignUnassignedClip: vi.fn(),
    assignVrmaByFilename: vi.fn(),
    animationMetadata: emptyMetadata,
    applyActionPreset: vi.fn(),
    applyAndCreateActionPreset: vi.fn(),
    beginEditingAnimation: vi.fn(),
    bridge: undefined,
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
    playUnassignedClip: vi.fn(),
    previewClipId: null,
    reorderAnimationClip: vi.fn(),
    resetPackagedAnimations: vi.fn(),
    saveAnimation: vi.fn(),
    setIdlePoolAnimationEnabled: vi.fn(),
    selectedActionPresetId: null,
    setAnimationMetadata: vi.fn(),
    setEditingAnimationId: vi.fn(),
    setEditingAnimationMetadata: vi.fn(),
    setSelectedActionPresetId: vi.fn(),
    setVrmaQualityGate: vi.fn(),
    setVrmaQualityScoreThresholds: vi.fn(),
    settings: SETTINGS_FALLBACK,
    t: (key, vars) => settingsT('zh-TW', key, vars),
    updateAnimationClip: vi.fn(),
    updateClipsPurpose: vi.fn(),
    updateUnassignedClip: vi.fn(),
    ...overrides,
  };
}

describe('SettingsAnimationsSection', () => {
  it('renders unassigned pool empty state and assign-by-filename control', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const html = renderToStaticMarkup(
      <SettingsAnimationsSection {...noopProps({ t })} />,
    );

    expect(html).toContain(t('actions.poolTitle'));
    expect(html).toContain(t('actions.poolEmpty'));
    expect(html).toContain(t('actions.addPoolClips'));
    expect(html).toContain(t('actions.assignByFilename'));
    expect(html).toContain(t('actions.assignByFilenameHint'));
    expect(html).toContain('disabled');
  });

  it('lists action types in an explicit ambient idle pool', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const custom: VoxAvatarAnimationSettings = {
      id: 'custom-context',
      animation_name: 'context-only',
      animation_description: 'Only for an explicit context.',
      animation_trigger_scenario: 'When explicitly requested.',
      animation_type: null,
      origin: 'user',
      system: false,
      editable: true,
      modified: false,
      removable: true,
      clips: [],
      asset_urls: [],
    };
    const settings: VoxAvatarSettingsSnapshot = {
      ...SETTINGS_FALLBACK,
      animations: [...SETTINGS_FALLBACK.animations, custom],
    };
    const html = renderToStaticMarkup(
      <SettingsAnimationsSection
        {...noopProps({
          settings,
          t,
        })}
      />,
    );

    expect(html).toContain(t('actions.idlePoolTitle'));
    expect(html).toContain(t('actions.idlePoolDesc'));
    expect(html).toContain('context-only');
    expect(html).toContain(t('actions.idlePoolSpeakingExcluded'));
  });

  it('lists pool clips and batch purpose toolbar when clips exist', () => {
    const t = (key: string, vars?: Record<string, string | number>) =>
      settingsT('zh-TW', key, vars);
    const settings: VoxAvatarSettingsSnapshot = {
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
    };
    const html = renderToStaticMarkup(
      <SettingsAnimationsSection {...noopProps({ settings, t })} />,
    );

    expect(html).toContain('wave-a');
    expect(html).toContain(t('actions.previewButton'));
    expect(html).toContain(t('actions.previewClip', { name: 'wave-a' }));
    expect(html).not.toContain(t('actions.poolEmpty'));
  });
});
