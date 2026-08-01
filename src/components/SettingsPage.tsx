import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Scene } from './Scene';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import {
  ACTION_PRESETS,
  resolveActionPreset,
  type ActionPresetDefinition,
} from '../action-presets';
import {
  animationUrlsForType,
  type PlayableAnimationType,
} from '../animation-catalog';
import {
  loadPackagedSettingsFallback,
  SETTINGS_FALLBACK,
  resolveLightingSettings,
} from '../settings-defaults';
import {
  mcpToolDescriptionKeys,
  normalizeUiLocale,
  settingsT,
} from '../settings-i18n';
import {
  applyTheme,
  LIGHT_QUERY,
  readStoredTheme,
  storeTheme,
  THEME_OPTIONS,
  type ThemePreference,
} from '../theme';

type SettingsSection = 'models' | 'animations' | 'appearance' | 'voice' | 'mcp';
type LightingNumberField =
  | 'exposure'
  | 'environment_intensity'
  | 'key_light_intensity'
  | 'ambient_intensity';

const LIGHTING_NUMBER_RANGES: Record<
  LightingNumberField,
  readonly [number, number]
> = {
  exposure: [0.1, 3],
  environment_intensity: [0, 2],
  key_light_intensity: [0, 4],
  ambient_intensity: [0, 4],
};

interface ConfirmationRequest {
  confirmLabel: string;
  detail: string;
  onConfirm: () => Promise<void>;
  title: string;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.4"
      viewBox="0 0 16 16"
    >
      {children}
    </svg>
  );
}

const SECTION_ICONS: Record<SettingsSection, ReactNode> = {
  models: (
    <Icon>
      <circle cx="8" cy="5.5" r="2.6" />
      <path d="M2.9 13.6c0-2.3 2.28-4.1 5.1-4.1s5.1 1.8 5.1 4.1" />
    </Icon>
  ),
  animations: (
    <Icon>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M6.8 5.8 10.9 8l-4.1 2.2z" />
    </Icon>
  ),
  appearance: (
    <Icon>
      <path d="M2.6 5.6v-2a1 1 0 0 1 1-1h2M10.4 2.6h2a1 1 0 0 1 1 1v2M13.4 10.4v2a1 1 0 0 1-1 1h-2M5.6 13.4h-2a1 1 0 0 1-1-1v-2" />
    </Icon>
  ),
  voice: (
    <Icon>
      <path d="M3.2 6.4v3.2M5.4 4.8v6.4M7.6 3.6v8.8M9.8 5.2v5.6M12.8 6.8v2.4" />
    </Icon>
  ),
  mcp: (
    <Icon>
      <path d="M6 2.4v2.6M10 2.4v2.6M4.6 5h6.8v2.9A3.4 3.4 0 0 1 8 11.3 3.4 3.4 0 0 1 4.6 7.9z" />
      <path d="M8 11.3v2.3" />
    </Icon>
  ),
};

/** Tracks the stored preference and keeps the applied theme in sync with it. */
function useThemePreference() {
  const [preference, setPreference] =
    useState<ThemePreference>(readStoredTheme);
  const [systemPrefersLight, setSystemPrefersLight] = useState(
    () => window.matchMedia(LIGHT_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(LIGHT_QUERY);
    const sync = (event: MediaQueryListEvent) =>
      setSystemPrefersLight(event.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const resolved =
    preference === 'system' ? (systemPrefersLight ? 'light' : 'dark') : preference;

  useEffect(() => applyTheme(resolved), [resolved]);

  const chooseTheme = useCallback((next: ThemePreference) => {
    setPreference(next);
    storeTheme(next);
  }, []);

  return { chooseTheme, preference, resolved };
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^Error invoking remote method '[^']+': Error: /, '');
}

export function SettingsPage() {
  const bridge = window.voxavatarSettings;
  const { chooseTheme, preference: themePreference } = useThemePreference();
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [settings, setSettings] =
    useState<VoxAvatarSettingsSnapshot>(SETTINGS_FALLBACK);
  const [section, setSection] = useState<SettingsSection>('models');
  const [selectedModelId, setSelectedModelId] = useState(
    SETTINGS_FALLBACK.default_model_id,
  );
  const [previewAnimation, setPreviewAnimation] =
    useState<VoxAvatarAnimationSettings | null>(null);
  const [previewClipId, setPreviewClipId] = useState<string | null>(null);
  const [previewRequest, setPreviewRequest] = useState(0);
  const [modelName, setModelName] = useState('');
  const [animationMetadata, setAnimationMetadata] =
    useState<CustomAnimationMetadata>({
      animation_name: '',
      animation_description: '',
      animation_trigger_scenario: '',
    });
  const [selectedActionPresetId, setSelectedActionPresetId] = useState<
    string | null
  >(null);
  const [editingAnimationId, setEditingAnimationId] = useState<string | null>(
    null,
  );
  const [editingAnimationMetadata, setEditingAnimationMetadata] =
    useState<CustomAnimationMetadata>({
      animation_name: '',
      animation_description: '',
      animation_trigger_scenario: '',
    });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mcpStatus, setMcpStatus] = useState<VoxAvatarMcpStatus | null>(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState<
    VoxAvatarVoiceSourceSettings['mode']
  >(SETTINGS_FALLBACK.voice_source.mode);
  const [voicePattern, setVoicePattern] = useState(
    SETTINGS_FALLBACK.voice_source.process_pattern ?? '',
  );
  const [voiceCatalog, setVoiceCatalog] =
    useState<VoxAvatarVoiceSourceCatalog | null>(null);
  const [voiceSourcesLoading, setVoiceSourcesLoading] = useState(false);
  const [voiceSourceSearch, setVoiceSourceSearch] = useState('');
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [confirmation, setConfirmation] =
    useState<ConfirmationRequest | null>(null);
  const [confirming, setConfirming] = useState(false);
  const confirmationDialogRef = useRef<HTMLDivElement>(null);
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);
  const confirmationConfirmRef = useRef<HTMLButtonElement>(null);
  const settingsContentRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const locale = normalizeUiLocale(settings.ui_locale);
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) =>
      settingsT(locale, key, vars),
    [locale],
  );
  const sections = useMemo(
    () =>
      (
        [
          'models',
          'animations',
          'appearance',
          'voice',
          'mcp',
        ] as const
      ).map((id) => ({
        id,
        label: t(`sections.${id}.label`),
        description: t(`sections.${id}.description`),
      })),
    [t],
  );

  useEffect(() => {
    document.title = t('app.documentTitle');
    if (!bridge) {
      void loadPackagedSettingsFallback()
        .then((snapshot) => {
          setSettings(snapshot);
          setSelectedModelId(snapshot.default_model_id);
        })
        .catch((error: unknown) => setNotice(errorMessage(error)));
      return;
    }
    void bridge.getAppInfo?.().then((info) => {
      if (info?.version) setAppVersion(info.version);
    });
    void bridge
      .get()
      .then((snapshot) => {
        setSettings(snapshot);
        setSelectedModelId(snapshot.default_model_id);
      })
      .catch((error: unknown) => setNotice(errorMessage(error)));
    return bridge.subscribe(setSettings);
  }, [bridge, t]);

  useEffect(() => {
    setVoiceMode(settings.voice_source.mode);
    setVoicePattern(settings.voice_source.process_pattern ?? '');
  }, [settings.voice_source.mode, settings.voice_source.process_pattern]);

  useEffect(() => {
    setPreviewAnimation((current) => {
      if (!current) return null;
      return (
        settings.animations.find((animation) => animation.id === current.id) ??
        null
      );
    });
    setPreviewClipId((current) => {
      if (!current) return null;
      return settings.animations.some((animation) =>
        animation.clips.some((clip) => clip.id === current),
      )
        ? current
        : null;
    });
  }, [settings.animations]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 9000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedModel =
    settings.models.find((model) => model.id === selectedModelId) ??
    settings.models.find((model) => model.id === settings.default_model_id) ??
    settings.models[0];

  const customModelCount = settings.models.filter(
    (model) => model.origin === 'user',
  ).length;
  const customAnimationCount = settings.animations.filter(
    (animation) => animation.origin === 'user',
  ).length;

  const previewType: PlayableAnimationType =
    previewAnimation?.animation_type ??
    (previewAnimation ? 'CUSTOM' : 'IDLE');
  const idleAnimationUrls = useMemo(
    () => animationUrlsForType(settings.animations, 'IDLE'),
    [settings.animations],
  );
  const previewClip = previewAnimation?.clips.find(
    (clip) => clip.id === previewClipId,
  );
  const previewAnimationUrls = useMemo(
    () => (previewClip ? [previewClip.asset_url] : idleAnimationUrls),
    [idleAnimationUrls, previewClip],
  );

  const previewTitle = useMemo(() => {
    if (previewClip) return previewClip.animation_name;
    return t('preview.character');
  }, [previewClip, t]);

  const updateSnapshot = useCallback((snapshot: VoxAvatarSettingsSnapshot) => {
    setSettings(snapshot);
    return snapshot;
  }, []);

  const run = useCallback(
    async (
      operation: () => Promise<VoxAvatarSettingsSnapshot | null>,
      success: string,
    ) => {
      setBusy(true);
      setNotice(null);
      try {
        const snapshot = await operation();
        if (snapshot) {
          updateSnapshot(snapshot);
          setNotice(success);
        }
        return snapshot;
      } catch (error) {
        setNotice(errorMessage(error));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [updateSnapshot],
  );

  const refreshVoiceSources = useCallback(async () => {
    setVoiceSourcesLoading(true);
    try {
      if (!bridge) {
        setVoiceCatalog(null);
        return;
      }
      setVoiceCatalog(await bridge.listVoiceSources());
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setVoiceSourcesLoading(false);
    }
  }, [bridge]);

  const copyText = useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        setNotice(t('notice.copied', { label }));
      } catch {
        setNotice(t('notice.copyFailed', { label: label.toLowerCase() }));
      }
    },
    [t],
  );

  const saveVoiceSource = async (
    source: VoxAvatarVoiceSourceSettings,
    success: string,
  ) => {
    if (!bridge) return null;
    const snapshot = await run(() => bridge.setVoiceSource(source), success);
    if (!snapshot) {
      setVoiceMode(settings.voice_source.mode);
      return null;
    }
    setVoiceMode(snapshot.voice_source.mode);
    void refreshVoiceSources();
    return snapshot;
  };

  const chooseVoiceMode = (mode: VoxAvatarVoiceSourceSettings['mode']) => {
    setVoiceMode(mode);
    if (mode === 'default' || mode === 'external' || mode === 'output') {
      void saveVoiceSource(
        {
          mode,
          process_pattern: null,
          source_id: null,
          source_name: null,
        },
        mode === 'default'
          ? t('notice.voiceDefault')
          : mode === 'output'
            ? t('notice.voiceOutput')
            : t('notice.voiceExternal'),
      );
    }
  };

  const chooseApplicationSource = (source: VoxAvatarVoiceSourceCatalogEntry) => {
    void saveVoiceSource(
      {
        mode: 'application',
        process_pattern: null,
        source_id: source.id,
        source_name: source.name,
      },
      t('notice.voiceApplication', { name: source.name }),
    );
  };

  const saveCustomVoiceSource = () => {
    void saveVoiceSource(
      {
        mode: 'custom',
        process_pattern: voicePattern,
        source_id: null,
        source_name: null,
      },
      t('notice.voicePatternSaved'),
    );
  };

  const refreshMcpStatus = useCallback(async () => {
    setMcpLoading(true);
    try {
      if (!bridge) {
        setMcpStatus(null);
        return;
      }
      setMcpStatus(await bridge.getMcpStatus());
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setMcpLoading(false);
    }
  }, [bridge]);

  useEffect(() => {
    if (section !== 'mcp') return;
    void refreshMcpStatus();
  }, [refreshMcpStatus, section, settings.animations]);

  useEffect(() => {
    if (section !== 'voice') return;
    void refreshVoiceSources();
  }, [refreshVoiceSources, section]);

  const openConfirmation = useCallback((request: ConfirmationRequest) => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setConfirmation(request);
  }, []);

  const closeConfirmation = useCallback(() => {
    const previousFocus = previousFocusRef.current;
    setConfirmation(null);
    setConfirming(false);
    window.requestAnimationFrame(() => {
      if (
        previousFocus?.isConnected &&
        !previousFocus.matches(':disabled')
      ) {
        previousFocus.focus();
      } else {
        settingsContentRef.current?.focus();
      }
    });
  }, []);

  useEffect(() => {
    if (!confirmation) return;
    const frame = window.requestAnimationFrame(() =>
      confirmationCancelRef.current?.focus(),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [confirmation]);

  const confirmPendingAction = async () => {
    if (!confirmation || confirming) return;
    setConfirming(true);
    try {
      await confirmation.onConfirm();
    } finally {
      closeConfirmation();
    }
  };

  const importModel = async () => {
    if (!bridge) return;
    const existingModelIds = new Set(settings.models.map((model) => model.id));
    const snapshot = await run(
      () => bridge.importModel({ model_name: modelName.trim() }),
      t('notice.modelAdded'),
    );
    if (!snapshot) return;
    const imported = snapshot.models.find(
      (model) => !existingModelIds.has(model.id),
    );
    if (imported) setSelectedModelId(imported.id);
    setModelName('');
  };

  const importModelsFromDirectory = async () => {
    if (!bridge?.importModelsFromDirectory) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await bridge.importModelsFromDirectory({
        model_name: modelName.trim(),
      });
      if (!result) return;
      updateSnapshot(result.snapshot);
      const parts = [
        result.summary.quality
          ? t('notice.modelsImported', {
              imported: result.summary.imported,
              scanned: result.summary.scanned,
              keep: result.summary.quality.keep,
              review: result.summary.quality.review,
              reject: result.summary.quality.reject,
            })
          : t('notice.modelsImportedOff', {
              imported: result.summary.imported,
              scanned: result.summary.scanned,
            }),
      ];
      if (result.summary.report_path) {
        parts.push(t('notice.reportSaved', { path: result.summary.report_path }));
      } else if (result.summary.report_error) {
        parts.push(
          t('notice.reportFailed', { error: result.summary.report_error }),
        );
      }
      setNotice(parts.join(' '));
      setModelName('');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const addAnimationClips = async (animation: VoxAvatarAnimationSettings) => {
    if (!bridge) return;
    const snapshot = await run(
      () => bridge.addAnimationClips(animation.id),
      t('notice.clipsAdded', { name: animation.animation_name }),
    );
    if (!snapshot) return;
    const updated = snapshot.animations.find(
      (candidate) => candidate.id === animation.id,
    );
    if (previewAnimation?.id === animation.id) {
      setPreviewAnimation(updated ?? null);
    }
  };

  const addAnimationClipsFromDirectory = async (
    animation: VoxAvatarAnimationSettings,
  ) => {
    if (!bridge?.addAnimationClipsFromDirectory) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await bridge.addAnimationClipsFromDirectory(animation.id);
      if (!result) return;
      updateSnapshot(result.snapshot);
      const updated = result.snapshot.animations.find(
        (candidate) => candidate.id === animation.id,
      );
      if (previewAnimation?.id === animation.id) {
        setPreviewAnimation(updated ?? null);
      }
      const parts = [
        result.summary.quality
          ? t('notice.clipsImported', {
              name: animation.animation_name,
              imported: result.summary.imported,
              scanned: result.summary.scanned,
              keep: result.summary.quality.keep,
              review: result.summary.quality.review,
              reject: result.summary.quality.reject,
            })
          : t('notice.clipsImportedOff', {
              name: animation.animation_name,
              imported: result.summary.imported,
              scanned: result.summary.scanned,
            }),
      ];
      if (result.summary.report_path) {
        parts.push(t('notice.reportSaved', { path: result.summary.report_path }));
      } else if (result.summary.report_error) {
        parts.push(
          t('notice.reportFailed', { error: result.summary.report_error }),
        );
      }
      setNotice(parts.join(' '));
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const setVrmaQualityGate = async (
    value: VoxAvatarSettingsSnapshot['vrma_quality_gate'],
  ) => {
    const setGate = bridge?.setVrmaQualityGate;
    if (!setGate) return;
    await run(() => setGate(value), t('notice.qualityGateUpdated'));
  };

  const chooseVrmaReportDir = async () => {
    const chooseDir = bridge?.chooseVrmaReportDir;
    if (!chooseDir) return;
    await run(() => chooseDir(), t('notice.reportDirUpdated'));
  };

  const clearVrmaReportDir = async () => {
    const clearDir = bridge?.clearVrmaReportDir;
    if (!clearDir) return;
    await run(() => clearDir(), t('notice.reportDirCleared'));
  };

  const createAnimation = async () => {
    if (!bridge) return;
    const snapshot = await run(
      () => bridge.createAnimation(animationMetadata),
      t('notice.animationCreated'),
    );
    if (!snapshot) return;
    setAnimationMetadata({
      animation_name: '',
      animation_description: '',
      animation_trigger_scenario: '',
    });
    setSelectedActionPresetId(null);
  };

  const applyActionPreset = (preset: ActionPresetDefinition) => {
    const resolved = resolveActionPreset(preset, locale);
    setSelectedActionPresetId(preset.id);
    setAnimationMetadata({
      animation_name: resolved.animation_name,
      animation_description: resolved.animation_description,
      animation_trigger_scenario: resolved.animation_trigger_scenario,
    });
  };

  const applyAndCreateActionPreset = async (preset: ActionPresetDefinition) => {
    if (!bridge) return;
    if (
      settings.animations.some(
        (animation) => animation.animation_name === preset.animation_name,
      )
    ) {
      setNotice(t('notice.actionPresetExists', { name: preset.animation_name }));
      applyActionPreset(preset);
      return;
    }
    const resolved = resolveActionPreset(preset, locale);
    setSelectedActionPresetId(preset.id);
    setAnimationMetadata({
      animation_name: resolved.animation_name,
      animation_description: resolved.animation_description,
      animation_trigger_scenario: resolved.animation_trigger_scenario,
    });
    const snapshot = await run(
      () =>
        bridge.createAnimation({
          animation_name: resolved.animation_name,
          animation_description: resolved.animation_description,
          animation_trigger_scenario: resolved.animation_trigger_scenario,
        }),
      t('notice.animationCreated'),
    );
    if (!snapshot) return;
    setAnimationMetadata({
      animation_name: '',
      animation_description: '',
      animation_trigger_scenario: '',
    });
    setSelectedActionPresetId(null);
  };

  const setDefaultModel = async (modelId: string) => {
    if (!bridge) return;
    const snapshot = await run(
      () => bridge.setDefaultModel(modelId),
      t('notice.defaultModelUpdated'),
    );
    if (snapshot) setSelectedModelId(modelId);
  };

  const deleteModel = (model: VoxAvatarModelSettings) => {
    if (!bridge || !model.removable) return;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteModel.title', { name: model.model_name }),
      detail: t('confirm.deleteModel.detail'),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteModel(model.id),
          t('notice.modelDeleted'),
        );
        if (snapshot && selectedModelId === model.id) {
          setSelectedModelId(snapshot.default_model_id);
        }
      },
    });
  };

  const deleteAllUserModels = () => {
    if (!bridge?.deleteAllUserModels || customModelCount === 0) return;
    const count = customModelCount;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteAllModels.title'),
      detail: t('confirm.deleteAllModels.detail', { count }),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteAllUserModels!(),
          t('notice.modelsDeletedAll', { count }),
        );
        if (snapshot) setSelectedModelId(snapshot.default_model_id);
      },
    });
  };

  const deleteAllUserAnimationClips = () => {
    if (!bridge?.deleteAllUserAnimationClips) return;
    const count = settings.animations.reduce(
      (total, animation) =>
        total +
        animation.clips.filter((clip) => clip.removable || clip.origin === 'user')
          .length,
      0,
    );
    if (count === 0) return;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteAllClips.title'),
      detail: t('confirm.deleteAllClips.detail', { count }),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteAllUserAnimationClips!(),
          t('notice.clipsDeletedAll', { count }),
        );
        if (!snapshot) return;
        if (previewAnimation) {
          const updated = snapshot.animations.find(
            (candidate) => candidate.id === previewAnimation.id,
          );
          setPreviewAnimation(updated ?? null);
          setPreviewClipId(null);
        }
      },
    });
  };

  const beginEditingAnimation = (animation: VoxAvatarAnimationSettings) => {
    if (!animation.editable) return;
    setEditingAnimationId(animation.id);
    setEditingAnimationMetadata({
      animation_name: animation.animation_name,
      animation_description: animation.animation_description,
      animation_trigger_scenario: animation.animation_trigger_scenario,
    });
  };

  const saveAnimation = async () => {
    if (!bridge || !editingAnimationId) return;
    const snapshot = await run(
      () =>
        bridge.updateAnimation(
          editingAnimationId,
          editingAnimationMetadata,
        ),
      t('notice.animationUpdated'),
    );
    if (!snapshot) return;
    const updated = snapshot.animations.find(
      (animation) => animation.id === editingAnimationId,
    );
    if (previewAnimation?.id === editingAnimationId) {
      setPreviewAnimation(updated ?? null);
    }
    setEditingAnimationId(null);
  };

  const deleteAnimation = (animation: VoxAvatarAnimationSettings) => {
    if (!bridge || !animation.removable) return;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteAnimation.title', {
        name: animation.animation_name,
      }),
      detail:
        animation.origin === 'packaged'
          ? t('confirm.deleteAnimation.detailPackaged')
          : t('confirm.deleteAnimation.detailCustom'),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteAnimation(animation.id),
          t('notice.animationDeleted'),
        );
        if (!snapshot) return;
        if (previewAnimation?.id === animation.id) {
          setPreviewAnimation(null);
          setPreviewClipId(null);
        }
        if (editingAnimationId === animation.id) {
          setEditingAnimationId(null);
        }
      },
    });
  };

  const deleteAnimationClip = (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    if (!bridge || !clip.removable) return;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteClip.title', { name: clip.animation_name }),
      detail: t('confirm.deleteClip.detail'),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteAnimationClip(animation.id, clip.id),
          t('notice.clipDeleted', { name: clip.animation_name }),
        );
        if (!snapshot) return;
        const updated = snapshot.animations.find(
          (candidate) => candidate.id === animation.id,
        );
        if (previewAnimation?.id === animation.id) {
          setPreviewAnimation(updated ?? null);
        }
        if (previewClipId === clip.id) {
          setPreviewClipId(null);
        }
      },
    });
  };

  const resetPackagedAnimations = () => {
    if (
      !bridge ||
      settings.packaged_animation_change_count === 0
    ) {
      return;
    }
    openConfirmation({
      confirmLabel: t('common.reset'),
      title: t('confirm.resetPackaged.title'),
      detail: t('confirm.resetPackaged.detail'),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.resetPackagedAnimations(),
          t('notice.packagedRestored'),
        );
        if (!snapshot) return;
        setEditingAnimationId(null);
        setPreviewAnimation(null);
        setPreviewClipId(null);
      },
    });
  };

  const previewCharacterSize = (size: number) => {
    setSettings((current) => ({ ...current, character_size: size }));
  };

  const saveCharacterSize = async (size: number) => {
    if (!bridge) return;
    await run(
      () => bridge.setCharacterSize(size),
      t('notice.characterSizeSet', { percent: Math.round(size * 100) }),
    );
  };

  const previewIdleRestMs = (ms: number) => {
    setSettings((current) => ({ ...current, idle_rest_ms: ms }));
  };

  const saveIdleRestMs = async (ms: number) => {
    const setIdleRestMs = bridge?.setIdleRestMs;
    if (!setIdleRestMs) return;
    await run(
      () => setIdleRestMs(ms),
      t('notice.idleRestSet', {
        seconds: Math.round(ms / 1000),
      }),
    );
  };

  const showAbout = () => {
    void bridge?.showAbout?.();
  };

  const saveUiLocale = async (locale: 'zh-TW' | 'en') => {
    const setUiLocale = bridge?.setUiLocale;
    if (!setUiLocale) return;
    setSettings((current) => ({ ...current, ui_locale: locale }));
    await run(
      () => setUiLocale(locale),
      locale === 'zh-TW' ? t('notice.uiLocaleZh') : t('notice.uiLocaleEn'),
    );
  };

  const previewLighting: VoxAvatarLightingSettings = useMemo(() => {
    return resolveLightingSettings(
      selectedModel ? settings.model_lighting[selectedModel.id] : null,
    );
  }, [selectedModel, settings.model_lighting]);

  const previewLightingField = <
    Field extends keyof VoxAvatarLightingSettings,
  >(
    field: Field,
    value: VoxAvatarLightingSettings[Field],
  ) => {
    if (!selectedModel) return;
    setSettings((current) => ({
      ...current,
      model_lighting: {
        ...current.model_lighting,
        [selectedModel.id]: {
          ...previewLighting,
          [field]: value,
        },
      },
    }));
  };

  const saveLightingField = async <
    Field extends keyof VoxAvatarLightingSettings,
  >(
    field: Field,
    value: VoxAvatarLightingSettings[Field],
  ) => {
    if (!bridge || !selectedModel) return;
    const snapshot = await run(
      () =>
        bridge.setModelLighting(selectedModel.id, {
          ...previewLighting,
          [field]: value,
        }),
      t('notice.lightingUpdated'),
    );
    if (snapshot) return;
    try {
      updateSnapshot(await bridge.get());
    } catch {
      // Keep the original validation error visible.
    }
  };

  const lightingNumber = (
    field: LightingNumberField,
    input: HTMLInputElement,
  ) => {
    const value = input.valueAsNumber;
    const [minimum, maximum] = LIGHTING_NUMBER_RANGES[field];
    return Number.isFinite(value) && value >= minimum && value <= maximum
      ? value
      : null;
  };

  const previewLightingNumber = (
    field: LightingNumberField,
    input: HTMLInputElement,
  ) => {
    const value = lightingNumber(field, input);
    if (value != null) previewLightingField(field, value);
  };

  const saveLightingNumber = (
    field: LightingNumberField,
    input: HTMLInputElement,
  ) => {
    const value = lightingNumber(field, input);
    if (value == null) {
      input.value = String(previewLighting[field]);
      return;
    }
    void saveLightingField(field, value);
  };

  const resetLighting = async () => {
    if (!bridge || !selectedModel) return;
    await run(
      () => bridge.resetModelLighting(selectedModel.id),
      t('notice.lightingReset'),
    );
  };

  const playAnimationClip = (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    setPreviewAnimation(animation);
    setPreviewClipId(clip.id);
    setPreviewRequest((request) => request + 1);
  };

  const normalizedVoiceSearch = voiceSourceSearch.trim().toLowerCase();
  const visibleVoiceSources = (voiceCatalog?.sources ?? []).filter(
    (source) =>
      !normalizedVoiceSearch ||
      `${source.name} ${source.detail}`
        .toLowerCase()
        .includes(normalizedVoiceSearch),
  );
  const selectedVoiceSourceAvailable = (voiceCatalog?.sources ?? []).some(
    (source) => source.id === settings.voice_source.source_id,
  );
  const listenerStatus = voiceCatalog?.listener;
  const voiceSourceDirty =
    voiceMode !== settings.voice_source.mode ||
    (voiceMode === 'custom' &&
      voicePattern.trim() !==
        (settings.voice_source.process_pattern ?? ''));
  const voiceHeading =
    settings.voice_source.mode === 'application'
      ? (settings.voice_source.source_name ?? t('voice.heading.application'))
      : settings.voice_source.mode === 'custom'
        ? t('voice.heading.custom')
        : settings.voice_source.mode === 'external'
          ? t('voice.heading.external')
          : settings.voice_source.mode === 'output'
            ? t('voice.heading.output')
            : t('voice.heading.default');

  const headingSummary =
    section === 'mcp'
      ? mcpStatus
        ? t('summary.mcpTools', {
            tools: mcpStatus.tools.length,
            actions: mcpStatus.playable_actions.length,
          })
        : t('summary.mcpConnection')
      : section === 'voice'
        ? settings.voice_source.mode === 'custom'
          ? t('summary.voiceCustom')
          : settings.voice_source.mode === 'output'
            ? t('summary.voiceOutput')
            : settings.voice_source.mode === 'external'
              ? t('summary.voiceExternal')
              : t('summary.voiceDefault')
        : t('summary.customLibrary', {
            models: customModelCount,
            actions: customAnimationCount,
          });
  const mcpHealth = mcpStatus?.health ?? (mcpLoading ? 'starting' : 'unavailable');
  const mcpServerUrl =
    mcpStatus?.server_url ?? 'http://127.0.0.1:47831/mcp';
  const mcpSetupCommand =
    mcpStatus?.setup_command ??
    `codex mcp add voxavatar --url ${mcpServerUrl}`;

  return (
    <main
      className={`settings-app ${
        previewCollapsed ? 'preview-collapsed' : ''
      }`}
    >
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <img src="./assets/avatar.png" alt="" />
          <div className="settings-brand-copy">
            <strong>VoxAvatar</strong>
            <span>{t('app.brandSubtitle')}</span>
            <small className="settings-app-version">
              {appVersion
                ? t('app.aboutVersion', { version: appVersion })
                : t('app.versionUnknown')}
            </small>
          </div>
        </div>

        <nav aria-label={t('nav.ariaLabel')}>
          {sections.map((item) => (
            <button
              className={section === item.id ? 'active' : ''}
              data-testid={`section-${item.id}`}
              key={item.id}
              onClick={() => setSection(item.id)}
              type="button"
              title={item.label}
            >
              <span className="nav-glyph" aria-hidden="true">
                {SECTION_ICONS[item.id]}
              </span>
              <span className="settings-nav-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
            </button>
          ))}
        </nav>

        <div className="settings-sidebar-status">
          <span className="status-dot" />
          <span className="settings-status-copy">{t('app.sidebarStatus')}</span>
          <button
            className="settings-about-button"
            disabled={!bridge?.showAbout}
            onClick={showAbout}
            type="button"
          >
            {t('app.about')}
          </button>
        </div>
      </aside>

      <section
        className="settings-content"
        ref={settingsContentRef}
        tabIndex={-1}
      >
        <header className="settings-heading">
          <div>
            <span className="eyebrow">
              {section === 'mcp'
                ? t('eyebrow.localIntegration')
                : section === 'voice'
                  ? t('eyebrow.voiceListener')
                  : t('eyebrow.characterConfig')}
            </span>
            <h1>{sections.find((item) => item.id === section)?.label}</h1>
          </div>
          <span className="library-count">{headingSummary}</span>
        </header>

        {notice && (
          <div className="settings-notice" role="status">
            <span>{notice}</span>
            <button
              aria-label={t('app.dismissNotice')}
              onClick={() => setNotice(null)}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <div className="settings-scroll">
          {section === 'models' && (
            <>
              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('models.libraryTitle')}</h2>
                    <p>{t('models.libraryDesc')}</p>
                  </div>
                  <button
                    className="secondary-button danger-text-button"
                    disabled={
                      busy || !bridge?.deleteAllUserModels || customModelCount === 0
                    }
                    onClick={() => deleteAllUserModels()}
                    type="button"
                  >
                    {t('models.deleteAll')}
                  </button>
                </div>
                <div className="asset-grid">
                  {settings.models.length === 0 && (
                    <div className="empty-library first-run-guide">
                      <strong>{t('models.empty.title')}</strong>
                      <p>{t('models.empty.intro')}</p>
                      <p>{t('models.empty.sourcesHeading')}</p>
                      <ul className="settings-steps first-run-links">
                        <li>
                          <a
                            href="https://hub.vroid.com/"
                            rel="noreferrer"
                            target="_blank"
                          >
                            VRoid Hub
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkVroidHubDesc')}
                        </li>
                        <li>
                          <a
                            href="https://booth.pm/"
                            rel="noreferrer"
                            target="_blank"
                          >
                            BOOTH
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkBoothDesc')}
                        </li>
                        <li>
                          <a
                            href="https://tyc.rei-yumesaki.net/material/avatar/3d-a/"
                            rel="noreferrer"
                            target="_blank"
                          >
                            つくよみちゃん 公式 3D タイプA
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkTsukuyomiDesc')}
                        </li>
                        <li>
                          <a
                            href="https://hub.vroid.com/en/characters/3131752290308902516/models/6951337039436301724"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Angel v1.2.4
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkAngelDesc')}
                        </li>
                        <li>
                          <a
                            href="https://hub.vroid.com/en/characters/3437260818058077430/models/4604979810309943843"
                            rel="noreferrer"
                            target="_blank"
                          >
                            ポニーテルの女の子（水色2）
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkPonytailDesc')}
                        </li>
                        <li>
                          <a
                            href="https://hub.vroid.com/en/characters/5216127528712133624/models/5722719060381403696"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Ki（Free model）
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkKiDesc')}
                        </li>
                        <li>
                          <a
                            href="https://hub.vroid.com/en/characters/1248981995540129234/models/8640547963669442173"
                            rel="noreferrer"
                            target="_blank"
                          >
                            AvatarSample_C
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkSampleCDesc')}
                        </li>
                        <li>
                          <a
                            href="https://tohozunko.booth.pm/"
                            rel="noreferrer"
                            target="_blank"
                          >
                            東北ずん子・ずんだもん 官方商店
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkTohokuDesc')}
                        </li>
                        <li>
                          <a
                            href="https://vroid.com/studio"
                            rel="noreferrer"
                            target="_blank"
                          >
                            VRoid Studio
                          </a>
                          {t('common.listDescSep')}
                          {t('models.empty.linkStudioDesc')}
                        </li>
                      </ul>
                      <p>
                        {t('models.empty.afterDownloadPrefix')}{' '}
                        <a
                          href="https://booth.pm/en/items/5512385"
                          rel="noreferrer"
                          target="_blank"
                        >
                          {t('models.empty.vrmaPackLink')}
                        </a>
                        {t('models.empty.afterDownloadSuffix')}
                      </p>
                    </div>
                  )}
                  {settings.models.map((model) => {
                    const selected = model.id === selectedModel?.id;
                    const isDefault = model.id === settings.default_model_id;
                    return (
                      <article
                        className={`asset-card ${selected ? 'selected' : ''}`}
                        key={model.id}
                      >
                        <button
                          className="asset-card-main"
                          onClick={() => setSelectedModelId(model.id)}
                          type="button"
                        >
                          <span className="asset-icon">VRM</span>
                          <span>
                            <strong>{model.model_name}</strong>
                            <small>
                              {model.origin === 'packaged'
                                ? t('models.packagedModel')
                                : t('models.userModel')}
                            </small>
                          </span>
                        </button>
                        <div className="asset-card-footer">
                          {isDefault ? (
                            <span className="default-badge">{t('models.defaultBadge')}</span>
                          ) : (
                            <button
                              disabled={busy || !bridge}
                              onClick={() => void setDefaultModel(model.id)}
                              type="button"
                            >
                              {t('models.makeDefault')}
                            </button>
                          )}
                          <div className="asset-card-actions">
                            <button
                              onClick={() => setSelectedModelId(model.id)}
                              type="button"
                            >
                              {t('common.preview')}
                            </button>
                            {model.removable && (
                              <button
                                className="danger-text-button"
                                disabled={busy || !bridge}
                                onClick={() => void deleteModel(model)}
                                type="button"
                              >
                                {t('common.delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="settings-panel quality-gate-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.qualityGateTitle')}</h2>
                    <p>{t('actions.qualityGateDesc')}</p>
                  </div>
                </div>
                <label className="settings-select-field">
                  {t('actions.qualityGateTitle')}
                  <select
                    disabled={busy || !bridge?.setVrmaQualityGate}
                    onChange={(event) =>
                      void setVrmaQualityGate(
                        event.target.value as VoxAvatarSettingsSnapshot['vrma_quality_gate'],
                      )
                    }
                    value={settings.vrma_quality_gate ?? 'strict'}
                  >
                    <option value="report">
                      {t('actions.qualityGate.report')}
                    </option>
                    <option value="strict">
                      {t('actions.qualityGate.strict')}
                    </option>
                    <option value="off">{t('actions.qualityGate.off')}</option>
                  </select>
                </label>
                <div className="report-dir-row">
                  <div className="report-dir-copy">
                    <strong>{t('actions.reportDirTitle')}</strong>
                    <p>{t('actions.reportDirDesc')}</p>
                    <code>
                      {settings.vrma_report_dir?.trim()
                        ? settings.vrma_report_dir
                        : t('actions.reportDirScan')}
                    </code>
                  </div>
                  <div className="report-dir-actions">
                    <button
                      className="secondary-button"
                      disabled={busy || !bridge?.chooseVrmaReportDir}
                      onClick={() => void chooseVrmaReportDir()}
                      type="button"
                    >
                      {t('actions.reportDirChoose')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        busy ||
                        !bridge?.clearVrmaReportDir ||
                        !settings.vrma_report_dir
                      }
                      onClick={() => void clearVrmaReportDir()}
                      type="button"
                    >
                      {t('actions.reportDirClear')}
                    </button>
                  </div>
                </div>
              </section>

              <section className="settings-panel import-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('models.addTitle')}</h2>
                    <p>{t('models.addDesc')}</p>
                  </div>
                  <span className="file-pill">.vrm</span>
                </div>
                <label>
                  {t('models.nameLabel')}
                  <input
                    maxLength={80}
                    onChange={(event) => setModelName(event.target.value)}
                    placeholder={t('models.namePlaceholder')}
                    value={modelName}
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={busy || !bridge}
                  onClick={() => void importModel()}
                  type="button"
                >
                  {t('models.chooseVrm')}
                </button>
                <button
                  className="secondary-button"
                  disabled={busy || !bridge?.importModelsFromDirectory}
                  onClick={() => void importModelsFromDirectory()}
                  type="button"
                >
                  {t('models.chooseVrmFolder')}
                </button>
                <p className="desktop-note">{t('models.chooseVrmFolderHint')}</p>
                {!bridge && (
                  <p className="desktop-note">{t('models.desktopOnly')}</p>
                )}
              </section>
            </>
          )}

          {section === 'animations' && (
            <>
              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.idleGuideTitle')}</h2>
                    <p>{t('actions.idleGuideDesc')}</p>
                  </div>
                </div>
                <ol className="settings-steps">
                  <li>
                    {t('actions.idleGuideStep1Prefix')}{' '}
                    <a
                      href="https://booth.pm/en/items/5512385"
                      rel="noreferrer"
                      target="_blank"
                    >
                      BOOTH
                    </a>{' '}
                    {t('actions.idleGuideStep1Suffix')}
                  </li>
                  <li>{t('actions.idleGuideStep2')}</li>
                  <li>{t('actions.idleGuideStep3')}</li>
                </ol>
              </section>

              <section className="settings-panel quality-gate-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.qualityGateTitle')}</h2>
                    <p>{t('actions.qualityGateDesc')}</p>
                  </div>
                </div>
                <label className="settings-select-field">
                  {t('actions.qualityGateTitle')}
                  <select
                    disabled={busy || !bridge?.setVrmaQualityGate}
                    onChange={(event) =>
                      void setVrmaQualityGate(
                        event.target.value as VoxAvatarSettingsSnapshot['vrma_quality_gate'],
                      )
                    }
                    value={settings.vrma_quality_gate ?? 'strict'}
                  >
                    <option value="report">
                      {t('actions.qualityGate.report')}
                    </option>
                    <option value="strict">
                      {t('actions.qualityGate.strict')}
                    </option>
                    <option value="off">{t('actions.qualityGate.off')}</option>
                  </select>
                </label>
                <div className="report-dir-row">
                  <div className="report-dir-copy">
                    <strong>{t('actions.reportDirTitle')}</strong>
                    <p>{t('actions.reportDirDesc')}</p>
                    <code>
                      {settings.vrma_report_dir?.trim()
                        ? settings.vrma_report_dir
                        : t('actions.reportDirScan')}
                    </code>
                  </div>
                  <div className="report-dir-actions">
                    <button
                      className="secondary-button"
                      disabled={busy || !bridge?.chooseVrmaReportDir}
                      onClick={() => void chooseVrmaReportDir()}
                      type="button"
                    >
                      {t('actions.reportDirChoose')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        busy ||
                        !bridge?.clearVrmaReportDir ||
                        !settings.vrma_report_dir
                      }
                      onClick={() => void clearVrmaReportDir()}
                      type="button"
                    >
                      {t('actions.reportDirClear')}
                    </button>
                  </div>
                </div>
              </section>

              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.listTitle')}</h2>
                    <p>{t('actions.listDesc')}</p>
                  </div>
                  <div className="panel-heading-actions">
                    <button
                      className="secondary-button danger-text-button"
                      disabled={
                        busy ||
                        !bridge?.deleteAllUserAnimationClips ||
                        settings.animations.every(
                          (animation) =>
                            animation.clips.filter(
                              (clip) =>
                                clip.removable || clip.origin === 'user',
                            ).length === 0,
                        )
                      }
                      onClick={() => deleteAllUserAnimationClips()}
                      type="button"
                    >
                      {t('actions.deleteAllClips')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={
                        busy ||
                        !bridge ||
                        settings.packaged_animation_change_count === 0
                      }
                      onClick={() => void resetPackagedAnimations()}
                      type="button"
                    >
                      {t('actions.resetPackaged')}
                    </button>
                  </div>
                </div>
                <div className="animation-list">
                  {settings.animations.map((animation) => (
                    <article
                      className={`animation-card ${
                        animation.system ? 'system-action-card' : ''
                      }`}
                      key={animation.id}
                    >
                      <div className="animation-card-header">
                        <div className="animation-card-copy">
                          <div>
                            <strong>
                              {animation.system
                                ? animation.animation_type === 'IDLE'
                                  ? t('actions.idle')
                                  : t('actions.speaking')
                                : animation.animation_name}
                            </strong>
                            <span>
                              {animation.system
                                ? t('actions.systemAction')
                                : animation.origin === 'packaged'
                                  ? animation.modified
                                    ? t('actions.packagedModified')
                                    : t('common.packaged')
                                  : t('actions.customAction')}
                            </span>
                          </div>
                          <p>{animation.animation_description}</p>
                          <small>
                            <b>{t('actions.trigger')}</b>{' '}
                            {animation.animation_trigger_scenario}
                          </small>
                        </div>
                        <div className="animation-card-actions">
                          {animation.editable && (
                            <button
                              disabled={busy || !bridge}
                              onClick={() => beginEditingAnimation(animation)}
                              type="button"
                            >
                              {t('common.edit')}
                            </button>
                          )}
                          {animation.removable && (
                            <button
                              className="danger-text-button"
                              disabled={busy || !bridge}
                              onClick={() => void deleteAnimation(animation)}
                              type="button"
                            >
                              {t('common.delete')}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="animation-clips">
                        <div className="animation-clips-heading">
                          <div>
                            <strong>{t('actions.clipsTitle')}</strong>
                            <span>
                              {animation.clips.length === 0
                                ? t('actions.noClips')
                                : t(
                                    animation.clips.length === 1
                                      ? 'actions.clipCount.one'
                                      : 'actions.clipCount.other',
                                    { count: animation.clips.length },
                                  )}
                            </span>
                          </div>
                          <div className="animation-clip-actions">
                            <button
                              className="secondary-button add-clips-button"
                              disabled={busy || !bridge}
                              onClick={() => void addAnimationClips(animation)}
                              type="button"
                            >
                              {t('actions.addClips')}
                            </button>
                            <button
                              className="secondary-button add-clips-button"
                              disabled={
                                busy || !bridge?.addAnimationClipsFromDirectory
                              }
                              onClick={() =>
                                void addAnimationClipsFromDirectory(animation)
                              }
                              type="button"
                            >
                              {t('actions.addClipsFolder')}
                            </button>
                          </div>
                        </div>
                        {animation.clips.length === 0 ? (
                          <p className="empty-clips">
                            {animation.system
                              ? animation.animation_type === 'IDLE'
                                ? t('actions.emptyClipsSystemIdle')
                                : t('actions.emptyClipsSystemSpeaking')
                              : t('actions.emptyClipsCustom')}
                          </p>
                        ) : (
                          <div className="clip-list">
                            {animation.clips.map((clip) => (
                              <div
                                aria-label={t('actions.previewClip', {
                                  name: clip.animation_name,
                                })}
                                className={`clip-chip ${
                                  previewClipId === clip.id ? 'playing' : ''
                                }`}
                                key={clip.id}
                                onClick={(event) => {
                                  if (
                                    (event.target as Element).closest('button')
                                  ) {
                                    return;
                                  }
                                  playAnimationClip(animation, clip);
                                }}
                                onKeyDown={(event) => {
                                  if (
                                    event.target !== event.currentTarget ||
                                    (event.key !== 'Enter' && event.key !== ' ')
                                  ) {
                                    return;
                                  }
                                  event.preventDefault();
                                  playAnimationClip(animation, clip);
                                }}
                                tabIndex={0}
                                title={t('actions.previewClip', {
                                  name: clip.animation_name,
                                })}
                              >
                                <span className="clip-file-icon">VRMA</span>
                                <strong>{clip.animation_name}</strong>
                                <small>
                                  {clip.origin === 'packaged'
                                    ? t('common.packaged')
                                    : t('common.uploaded')}
                                </small>
                                {clip.removable && (
                                  <button
                                    aria-label={t('actions.deleteClip', {
                                      name: clip.animation_name,
                                    })}
                                    className="clip-delete"
                                    disabled={busy || !bridge}
                                    onClick={() =>
                                      void deleteAnimationClip(animation, clip)
                                    }
                                    title={t('actions.deleteClip', {
                                      name: clip.animation_name,
                                    })}
                                    type="button"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {editingAnimationId && (
                <section className="settings-panel import-panel edit-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('actions.editTitle')}</h2>
                      <p>{t('actions.editDesc')}</p>
                  </div>
                  </div>
                  <div className="form-stack">
                    <label>
                      {t('actions.nameLabel')}
                      <input
                        maxLength={48}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_name: event.target.value,
                          }))
                        }
                        value={editingAnimationMetadata.animation_name}
                      />
                    </label>
                    <label>
                      {t('actions.descriptionLabel')}
                      <textarea
                        maxLength={240}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_description: event.target.value,
                          }))
                        }
                        rows={3}
                        value={
                          editingAnimationMetadata.animation_description
                        }
                      />
                    </label>
                    <label>
                      {t('actions.triggerLabel')}
                      <textarea
                        maxLength={240}
                        onChange={(event) =>
                          setEditingAnimationMetadata((current) => ({
                            ...current,
                            animation_trigger_scenario: event.target.value,
                          }))
                        }
                        rows={3}
                        value={
                          editingAnimationMetadata.animation_trigger_scenario
                        }
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button
                      className="primary-button"
                      disabled={
                        busy ||
                        !editingAnimationMetadata.animation_name.trim() ||
                        !editingAnimationMetadata.animation_description.trim() ||
                        !editingAnimationMetadata.animation_trigger_scenario.trim()
                      }
                      onClick={() => void saveAnimation()}
                      type="button"
                    >
                      {t('common.saveChanges')}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() => setEditingAnimationId(null)}
                      type="button"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </section>
              )}

              <section className="settings-panel import-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('actions.createTitle')}</h2>
                    <p>{t('actions.createDesc')}</p>
                  </div>
                  <span className="file-pill">{t('sections.animations.label')}</span>
                </div>

                <div className="action-preset-block">
                  <div className="action-preset-heading">
                    <strong>{t('actions.presetsTitle')}</strong>
                    <p>{t('actions.presetsDesc')}</p>
                  </div>
                  <div
                    aria-label={t('actions.presetsTitle')}
                    className="action-preset-grid"
                    role="list"
                  >
                    {ACTION_PRESETS.map((preset) => {
                      const resolved = resolveActionPreset(preset, locale);
                      const alreadyExists = settings.animations.some(
                        (animation) =>
                          animation.animation_name === preset.animation_name,
                      );
                      const selected = selectedActionPresetId === preset.id;
                      return (
                        <article
                          className={`action-preset-card ${
                            selected ? 'selected' : ''
                          }`}
                          key={preset.id}
                          role="listitem"
                        >
                          <button
                            className="action-preset-main"
                            onClick={() => applyActionPreset(preset)}
                            type="button"
                          >
                            <strong>{resolved.label}</strong>
                            <code>{preset.animation_name}</code>
                            <small>{resolved.animation_description}</small>
                            <span>{resolved.animation_trigger_scenario}</span>
                          </button>
                          <div className="action-preset-actions">
                            <button
                              disabled={busy}
                              onClick={() => applyActionPreset(preset)}
                              type="button"
                            >
                              {t('actions.presetsApply')}
                            </button>
                            <button
                              className="primary-button"
                              disabled={busy || !bridge || alreadyExists}
                              onClick={() =>
                                void applyAndCreateActionPreset(preset)
                              }
                              type="button"
                            >
                              {alreadyExists
                                ? t('actions.presetsExists')
                                : t('actions.presetsApplyCreate')}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="form-stack">
                  <label>
                    {t('actions.nameLabel')}
                    <input
                      maxLength={48}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_name: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createNamePlaceholder')}
                      value={animationMetadata.animation_name}
                    />
                    <small>{t('actions.createNameHint')}</small>
                  </label>
                  <label>
                    {t('actions.descriptionLabel')}
                    <textarea
                      maxLength={240}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_description: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createDescPlaceholder')}
                      rows={3}
                      value={animationMetadata.animation_description}
                    />
                  </label>
                  <label>
                    {t('actions.triggerLabel')}
                    <textarea
                      maxLength={240}
                      onChange={(event) => {
                        setSelectedActionPresetId(null);
                        setAnimationMetadata((current) => ({
                          ...current,
                          animation_trigger_scenario: event.target.value,
                        }));
                      }}
                      placeholder={t('actions.createTriggerPlaceholder')}
                      rows={3}
                      value={animationMetadata.animation_trigger_scenario}
                    />
                  </label>
                </div>
                <button
                  className="primary-button"
                  disabled={
                    busy ||
                    !bridge ||
                    !animationMetadata.animation_name.trim() ||
                    !animationMetadata.animation_description.trim() ||
                    !animationMetadata.animation_trigger_scenario.trim()
                  }
                  onClick={() => void createAnimation()}
                  type="button"
                >
                  {t('actions.createButton')}
                </button>
              </section>
            </>
          )}

          {section === 'appearance' && (
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
                  onBlur={(event) =>
                    void saveCharacterSize(Number(event.currentTarget.value))
                  }
                  onChange={(event) =>
                    previewCharacterSize(Number(event.currentTarget.value))
                  }
                  onKeyUp={(event) => {
                    if (event.key.startsWith('Arrow')) {
                      void saveCharacterSize(
                        Number(event.currentTarget.value),
                      );
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
                  onBlur={(event) =>
                    void saveIdleRestMs(Number(event.currentTarget.value) * 1000)
                  }
                  onChange={(event) =>
                    previewIdleRestMs(Number(event.currentTarget.value) * 1000)
                  }
                  onKeyUp={(event) => {
                    if (event.key.startsWith('Arrow')) {
                      void saveIdleRestMs(
                        Number(event.currentTarget.value) * 1000,
                      );
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
                      const value = e.currentTarget.value as
                        | 'none'
                        | 'aces';
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
                        saveLightingNumber(
                          'environment_intensity',
                          event.currentTarget,
                        )
                      }
                      onPointerUp={(event) =>
                        saveLightingNumber(
                          'environment_intensity',
                          event.currentTarget,
                        )
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
                      saveLightingNumber(
                        'environment_intensity',
                        event.currentTarget,
                      )
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
                        previewLightingNumber(
                          'key_light_intensity',
                          event.currentTarget,
                        )
                      }
                      onKeyUp={(event) =>
                        saveLightingNumber(
                          'key_light_intensity',
                          event.currentTarget,
                        )
                      }
                      onPointerUp={(event) =>
                        saveLightingNumber(
                          'key_light_intensity',
                          event.currentTarget,
                        )
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
                      saveLightingNumber(
                        'key_light_intensity',
                        event.currentTarget,
                      )
                    }
                    onChange={(event) =>
                      previewLightingNumber(
                        'key_light_intensity',
                        event.currentTarget,
                      )
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
                        previewLightingNumber(
                          'ambient_intensity',
                          event.currentTarget,
                        )
                      }
                      onKeyUp={(event) =>
                        saveLightingNumber(
                          'ambient_intensity',
                          event.currentTarget,
                        )
                      }
                      onPointerUp={(event) =>
                        saveLightingNumber(
                          'ambient_intensity',
                          event.currentTarget,
                        )
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
                      saveLightingNumber(
                        'ambient_intensity',
                        event.currentTarget,
                      )
                    }
                    onChange={(event) =>
                      previewLightingNumber(
                        'ambient_intensity',
                        event.currentTarget,
                      )
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
                        previewLightingNumber(
                          'exposure',
                          event.currentTarget,
                        )
                      }
                      onKeyUp={(event) =>
                        saveLightingNumber(
                          'exposure',
                          event.currentTarget,
                        )
                      }
                      onPointerUp={(event) =>
                        saveLightingNumber(
                          'exposure',
                          event.currentTarget,
                        )
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
          )}

          {section === 'voice' && (
            <>
              <section className="settings-panel voice-source-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('voice.chooseTitle')}</h2>
                    <p>{t('voice.chooseDesc')}</p>
                  </div>
                </div>

                <div
                  aria-label={t('voice.modeAria')}
                  className="voice-mode-grid"
                  role="group"
                >
                  <button
                    aria-pressed={voiceMode === 'default'}
                    data-testid="voice-mode-default"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('default')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      A
                    </span>
                    <strong>{t('voice.mode.default.title')}</strong>
                    <small>{t('voice.mode.default.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'application'}
                    data-testid="voice-mode-application"
                    disabled={busy || !bridge}
                    onClick={() => setVoiceMode('application')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ◎
                    </span>
                    <strong>{t('voice.mode.application.title')}</strong>
                    <small>{t('voice.mode.application.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'output'}
                    data-testid="voice-mode-output"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('output')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ♪
                    </span>
                    <strong>{t('voice.mode.output.title')}</strong>
                    <small>{t('voice.mode.output.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'custom'}
                    data-testid="voice-mode-custom"
                    disabled={busy || !bridge}
                    onClick={() => setVoiceMode('custom')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      .*
                    </span>
                    <strong>{t('voice.mode.custom.title')}</strong>
                    <small>{t('voice.mode.custom.desc')}</small>
                  </button>
                  <button
                    aria-pressed={voiceMode === 'external'}
                    data-testid="voice-mode-external"
                    disabled={busy || !bridge}
                    onClick={() => chooseVoiceMode('external')}
                    type="button"
                  >
                    <span className="voice-mode-icon" aria-hidden="true">
                      ↗
                    </span>
                    <strong>{t('voice.mode.external.title')}</strong>
                    <small>{t('voice.mode.external.desc')}</small>
                  </button>
                </div>
              </section>

              {(voiceMode === 'output' ||
                settings.voice_source.mode === 'output') && (
                <section
                  className="settings-panel voice-privacy-panel"
                  data-testid="voice-output-privacy"
                  role="note"
                >
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.outputPrivacyTitle')}</h2>
                      <p>{t('voice.outputPrivacyWarn')}</p>
                    </div>
                  </div>
                </section>
              )}

              {voiceMode === 'application' && (
                <section className="settings-panel voice-application-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.applicationTitle')}</h2>
                      <p>{t('voice.applicationDesc')}</p>
                    </div>
                    <button
                      className="secondary-button"
                      disabled={voiceSourcesLoading || !bridge}
                      onClick={() => void refreshVoiceSources()}
                      type="button"
                    >
                      {voiceSourcesLoading
                        ? t('common.refreshing')
                        : t('common.refresh')}
                    </button>
                  </div>

                  <label className="voice-source-search">
                    <span>{t('voice.filterLabel')}</span>
                    <input
                      onChange={(event) =>
                        setVoiceSourceSearch(event.currentTarget.value)
                      }
                      placeholder={t('voice.filterPlaceholder')}
                      type="search"
                      value={voiceSourceSearch}
                    />
                  </label>

                  {!voiceSourcesLoading &&
                    voiceCatalog &&
                    settings.voice_source.mode === 'application' &&
                    !selectedVoiceSourceAvailable && (
                      <div className="voice-saved-source">
                        <div>
                          <strong>
                            {settings.voice_source.source_name ??
                              t('voice.savedApplication')}
                          </strong>
                          <small>{t('voice.notRunning')}</small>
                        </div>
                        <span className="source-state unavailable">
                          {t('common.unavailable')}
                        </span>
                      </div>
                    )}

                  <div className="voice-source-list">
                    {visibleVoiceSources.map((source) => {
                      const selected =
                        settings.voice_source.mode === 'application' &&
                        settings.voice_source.source_id === source.id;
                      return (
                        <button
                          aria-pressed={selected}
                          disabled={busy || !bridge}
                          key={source.id}
                          onClick={() => chooseApplicationSource(source)}
                          type="button"
                        >
                          <span className="source-app-mark" aria-hidden="true">
                            {source.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="source-copy">
                            <strong>{source.name}</strong>
                            <small>{source.detail}</small>
                          </span>
                          <span
                            className={`source-state ${
                              selected ? 'selected' : ''
                            }`}
                          >
                            {selected
                              ? t('common.selected')
                              : t('common.available')}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {voiceCatalog?.error && (
                    <p className="mcp-error-message" role="alert">
                      {voiceCatalog.error}
                    </p>
                  )}

                  {!voiceSourcesLoading &&
                    voiceCatalog &&
                    !voiceCatalog?.error &&
                    visibleVoiceSources.length === 0 && (
                      <div className="empty-library">
                        <strong>{t('voice.noMatchesTitle')}</strong>
                        <p>{t('voice.noMatchesDesc')}</p>
                      </div>
                    )}
                </section>
              )}

              {voiceMode === 'custom' && (
                <section className="settings-panel voice-pattern-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.patternTitle')}</h2>
                      <p>{t('voice.patternDesc')}</p>
                    </div>
                  </div>
                  <label className="voice-pattern-field">
                    <span>{t('voice.patternLabel')}</span>
                    <input
                      aria-label={t('voice.patternAria')}
                      data-testid="voice-process-pattern"
                      disabled={busy || !bridge}
                      onChange={(event) =>
                        setVoicePattern(event.currentTarget.value)
                      }
                      placeholder={t('voice.patternPlaceholder')}
                      spellCheck={false}
                      type="text"
                      value={voicePattern}
                    />
                  </label>
                  <p className="theme-note">{t('voice.patternNote')}</p>
                  <div className="panel-actions">
                    <button
                      className="primary-button"
                      data-testid="voice-source-save"
                      disabled={
                        busy ||
                        !bridge ||
                        !voiceSourceDirty ||
                        !voicePattern.trim()
                      }
                      onClick={saveCustomVoiceSource}
                      type="button"
                    >
                      {t('voice.savePattern')}
                    </button>
                  </div>
                </section>
              )}

              {voiceMode === 'external' && (
                <section className="settings-panel voice-external-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{t('voice.externalTitle')}</h2>
                      <p>{t('voice.externalDesc')}</p>
                    </div>
                  </div>
                  <div className="mcp-copy-field">
                    <div>
                      <span>{t('voice.eventsEndpoint')}</span>
                      <code>
                        {voiceCatalog?.events_url ??
                          'http://127.0.0.1:47831/events'}
                      </code>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        void copyText(
                          voiceCatalog?.events_url ??
                            'http://127.0.0.1:47831/events',
                          t('voice.eventsEndpoint'),
                        )
                      }
                      type="button"
                    >
                      {t('common.copy')}
                    </button>
                  </div>
                  <p className="desktop-note">{t('voice.externalNote')}</p>
                </section>
              )}

              <section className="settings-panel voice-status-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('voice.statusTitle')}</h2>
                    <p>{t('voice.statusDesc')}</p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={voiceSourcesLoading || !bridge}
                    onClick={() => void refreshVoiceSources()}
                    type="button"
                  >
                    {t('common.checkStatus')}
                  </button>
                </div>
                <div className="voice-status-grid">
                  <article>
                    <span>{t('voice.statusMode')}</span>
                    <strong>{voiceHeading}</strong>
                    <small>
                      {settings.voice_source.mode === 'custom'
                        ? settings.voice_source.process_pattern
                        : settings.voice_source.mode === 'external'
                          ? t('voice.detail.loopback')
                          : (settings.voice_source.source_name ??
                            t('voice.detail.chatgptCodex'))}
                    </small>
                  </article>
                  <article>
                    <span>{t('voice.statusState')}</span>
                    <strong>
                      {settings.voice_source.mode === 'external'
                        ? t('voice.state.waitingEvents')
                        : listenerStatus?.capturing
                          ? t('voice.state.receiving')
                          : listenerStatus?.monitoring
                            ? t('voice.state.monitoring')
                            : t('voice.state.inactive')}
                    </strong>
                    <small>
                      {listenerStatus?.error ??
                        listenerStatus?.source ??
                        t('voice.state.noStream')}
                    </small>
                  </article>
                  <article>
                    <span>{t('voice.statusAvailable')}</span>
                    <strong>{voiceCatalog?.sources.length ?? 0}</strong>
                    <small>{t('voice.statusRunningApps')}</small>
                  </article>
                </div>
              </section>
            </>
          )}

         {section === 'mcp' && (
            <>
              <section className="settings-panel mcp-overview-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('mcp.serverTitle')}</h2>
                    <p>{t('mcp.serverDesc')}</p>
                  </div>
                  <span className={`mcp-health-badge ${mcpHealth}`}>
                    <i aria-hidden="true" />
                    {mcpHealth === 'online'
                      ? t('common.online')
                      : mcpHealth === 'starting'
                        ? t('common.starting')
                        : t('common.unavailable')}
                  </span>
                </div>

                <div className="mcp-status-grid">
                  <article>
                    <span>{t('mcp.health')}</span>
                    <strong>
                      {mcpHealth === 'online'
                        ? t('common.ready')
                        : mcpHealth === 'starting'
                          ? t('common.starting')
                          : t('common.notRunning')}
                    </strong>
                    <small>
                      {mcpStatus?.checked_at
                        ? t('mcp.checkedAt', {
                            time: new Date(
                              mcpStatus.checked_at,
                            ).toLocaleTimeString(),
                          })
                        : t('mcp.waitingBridge')}
                    </small>
                  </article>
                  <article>
                    <span>{t('mcp.transport')}</span>
                    <strong>
                      {mcpStatus?.transport ?? t('mcp.transportDefault')}
                    </strong>
                    <small>{t('mcp.transportDesc')}</small>
                  </article>
                  <article>
                    <span>{t('mcp.access')}</span>
                    <strong>
                      {mcpStatus?.local_only === false
                        ? t('mcp.accessNetwork')
                        : t('mcp.accessLocal')}
                    </strong>
                    <small>{t('mcp.accessBound')}</small>
                  </article>
                  <article>
                    <span>{t('mcp.version')}</span>
                    <strong>v{mcpStatus?.version ?? '—'}</strong>
                    <small>{t('mcp.versionDesc')}</small>
                  </article>
                </div>

                {mcpStatus?.error && (
                  <p className="mcp-error-message" role="alert">
                    {mcpStatus.error}
                  </p>
                )}
              </section>

              <section className="settings-panel mcp-endpoint-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('mcp.endpointTitle')}</h2>
                    <p>{t('mcp.endpointDesc')}</p>
                  </div>
                  <button
                    className="secondary-button"
                    disabled={mcpLoading}
                    onClick={() => void refreshMcpStatus()}
                    type="button"
                  >
                    {mcpLoading ? t('common.checking') : t('mcp.checkHealth')}
                  </button>
                </div>

                <div className="mcp-copy-field">
                  <div>
                    <span>{t('mcp.serverUrl')}</span>
                    <code>{mcpServerUrl}</code>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      void copyText(mcpServerUrl, t('mcp.serverUrl'))
                    }
                    type="button"
                  >
                    {t('common.copy')}
                  </button>
                </div>

                <div className="mcp-copy-field">
                  <div>
                    <span>{t('mcp.setupCommand')}</span>
                    <code>{mcpSetupCommand}</code>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      void copyText(
                        mcpSetupCommand,
                        t('mcp.setupCommandLabel'),
                      )
                    }
                    type="button"
                  >
                    {t('common.copy')}
                  </button>
                </div>

                <p className="desktop-note">{t('mcp.portNote')}</p>
              </section>

              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('mcp.toolsTitle')}</h2>
                    <p>{t('mcp.toolsDesc')}</p>
                  </div>
                  <span className="file-pill">
                    {t('mcp.toolsCount', {
                      count: mcpStatus?.tools.length ?? 4,
                    })}
                  </span>
                </div>
                <div className="mcp-tool-list">
                  {(mcpStatus?.tools ?? mcpToolDescriptionKeys()).map(
                    (tool) => (
                      <article key={tool}>
                        <code>{tool}</code>
                        <p>
                          {(() => {
                            const key = `mcp.tools.${tool}`;
                            const text = t(key);
                            return text === key
                              ? t('mcp.tools.fallback')
                              : text;
                          })()}
                        </p>
                      </article>
                    ),
                  )}
                </div>
              </section>

              <section className="settings-panel">
                <div className="panel-heading">
                  <div>
                    <h2>{t('mcp.actionsTitle')}</h2>
                    <p>{t('mcp.actionsDesc')}</p>
                  </div>
                  <span className="file-pill">
                    {t('mcp.actionsActive', {
                      count: mcpStatus?.playable_actions.length ?? 0,
                    })}
                  </span>
                </div>
                {mcpStatus && mcpStatus.playable_actions.length > 0 ? (
                  <div className="mcp-action-list">
                    {mcpStatus.playable_actions.map((action) => (
                      <code key={action}>{action}</code>
                    ))}
                  </div>
                ) : (
                  <div className="empty-library">
                    <strong>{t('mcp.noActionsTitle')}</strong>
                    <p>{t('mcp.noActionsDesc')}</p>
                  </div>
                )}
                <p className="mcp-session-note">{t('mcp.sessionNote')}</p>
              </section>
            </>
          )}
        </div>
      </section>

      <aside className="settings-preview">
        <button
          aria-expanded={!previewCollapsed}
          aria-label={
            previewCollapsed
              ? t('preview.expandAria')
              : t('preview.collapseAria')
          }
          className="settings-preview-toggle"
          onClick={() => setPreviewCollapsed((collapsed) => !collapsed)}
          title={
            previewCollapsed ? t('preview.expand') : t('preview.collapse')
          }
          type="button"
        >
          <span aria-hidden="true">{previewCollapsed ? '‹' : '›'}</span>
        </button>

        {!previewCollapsed && (
          <>
            <div className="preview-header">
              <div>
                <span className="eyebrow">{t('preview.live')}</span>
                <strong>{selectedModel?.model_name ?? 'VoxAvatar'}</strong>
              </div>
              <span className="preview-live">
                <i />
                {t('preview.liveBadge')}
              </span>
            </div>
            <div className="preview-stage" data-testid="settings-preview">
              {selectedModel && (
                <SceneErrorBoundary
                  fallback={(
                    <div className="preview-load-error" role="alert">
                      <strong>{t('preview.loadError')}</strong>
                      <p>{t('preview.loadErrorHint')}</p>
                    </div>
                  )}
                  resetKey={selectedModel.id}
                >
                  <Scene
                    animation={previewType}
                    animationRequest={previewRequest}
                    animationUrls={previewAnimationUrls}
                    audioLevel={0}
                    characterSize={settings.character_size}
                    lighting={previewLighting}
                    enablePan={false}
                    framingMargin={1.22}
                    groundShadow
                    modelUrl={selectedModel.asset_url}
                    onAnimationComplete={() => {
                      setPreviewAnimation(null);
                      setPreviewClipId(null);
                    }}
                    playback={previewClip ? 'once' : 'loop'}
                    speaking={false}
                  />
                </SceneErrorBoundary>
              )}
              <div className="preview-hint">{t('preview.hint')}</div>
            </div>
            <div className="preview-now-playing">
              <span>{t('preview.nowPlaying')}</span>
              <strong>{previewTitle}</strong>
              {previewAnimation && (
                <small>{previewAnimation.animation_description}</small>
              )}
            </div>
          </>
        )}
      </aside>

      {confirmation && (
        <div
          className="settings-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !confirming) {
              closeConfirmation();
            }
          }}
        >
          <div
            aria-busy={confirming}
            aria-describedby="settings-confirmation-detail"
            aria-labelledby="settings-confirmation-title"
            aria-modal="true"
            className="settings-dialog"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !confirming) {
                event.preventDefault();
                closeConfirmation();
                return;
              }
              if (event.key !== 'Tab') return;
              const first = confirmationCancelRef.current;
              const last = confirmationConfirmRef.current;
              if (!first || !last) return;
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (
                !event.shiftKey &&
                document.activeElement === last
              ) {
                event.preventDefault();
                first.focus();
              }
            }}
            ref={confirmationDialogRef}
            role="dialog"
          >
            <div className="settings-dialog-icon" aria-hidden="true">
              !
            </div>
            <div className="settings-dialog-copy">
              <span className="eyebrow">{t('common.confirmChange')}</span>
              <h2 id="settings-confirmation-title">
                {confirmation.title}
              </h2>
              <p id="settings-confirmation-detail">
                {confirmation.detail}
              </p>
            </div>
            <div className="settings-dialog-actions">
              <button
                className="secondary-button"
                disabled={confirming}
                onClick={closeConfirmation}
                ref={confirmationCancelRef}
                type="button"
              >
                {t('common.cancel')}
              </button>
              <button
                className="settings-dialog-confirm"
                disabled={confirming}
                onClick={() => void confirmPendingAction()}
                ref={confirmationConfirmRef}
                type="button"
              >
                {confirming ? t('common.working') : confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
