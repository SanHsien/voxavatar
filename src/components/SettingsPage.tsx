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
  type ActionPresetDefinition,
  resolveActionPreset,
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
import { SettingsModelsSection } from './settings/SettingsModelsSection';
import { SettingsAnimationsSection } from './settings/SettingsAnimationsSection';
import { SettingsVoiceSection } from './settings/SettingsVoiceSection';
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
  const [reportRevealPath, setReportRevealPath] = useState<string | null>(null);
  const [mcpStatus, setMcpStatus] = useState<VoxAvatarMcpStatus | null>(null);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [readiness, setReadiness] = useState<VoxAvatarAppReadiness | null>(
    null,
  );
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
    const timer = window.setTimeout(() => {
      setNotice(null);
      setReportRevealPath(null);
    }, 9000);
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
      setReportRevealPath(null);
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

  const refreshReadiness = useCallback(async () => {
    if (!bridge?.getReadiness) {
      setReadiness(null);
      return;
    }
    try {
      setReadiness(await bridge.getReadiness());
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, [bridge]);

  const copyDiagnosticSummary = useCallback(async () => {
    if (!bridge?.getDiagnosticSummary) {
      setNotice(t('notice.copyFailed', { label: t('diagnostic.label') }));
      return;
    }
    try {
      const { text } = await bridge.getDiagnosticSummary();
      await copyText(text, t('diagnostic.label'));
      setNotice(t('notice.diagnosticCopied'));
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }, [bridge, copyText, t]);

  const goToSetupAction = useCallback(
    (nextAction: string | null | undefined) => {
      if (nextAction === 'import_model') setSection('models');
      else if (nextAction === 'add_animation_clips') setSection('animations');
      else if (
        nextAction === 'configure_voice_source' ||
        nextAction === 'check_voice_source' ||
        nextAction === 'start_voice_app' ||
        nextAction === 'install_or_build_helper'
      ) {
        setSection('voice');
      } else if (nextAction === 'wait_or_restart_mcp') setSection('mcp');
    },
    [],
  );

  useEffect(() => {
    if (section !== 'mcp') return;
    void refreshMcpStatus();
  }, [refreshMcpStatus, section, settings.animations]);

  useEffect(() => {
    void refreshReadiness();
  }, [
    refreshReadiness,
    settings.default_model_id,
    settings.models,
    settings.animations,
    settings.voice_source,
    mcpStatus?.health,
    voiceCatalog?.listener,
  ]);

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
    setReportRevealPath(null);
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
        parts.push(t('notice.reportSavedShort'));
        setReportRevealPath(result.summary.report_path);
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
    setReportRevealPath(null);
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
        parts.push(t('notice.reportSavedShort'));
        setReportRevealPath(result.summary.report_path);
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

  const reorderAnimationClip = async (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    direction: 'up' | 'down',
  ) => {
    const reorder = bridge?.reorderAnimationClip;
    if (!reorder || !clip.removable) return;
    const snapshot = await run(
      () => reorder(animation.id, clip.id, direction),
      t('notice.clipReordered', { name: clip.animation_name }),
    );
    if (!snapshot) return;
    const updated = snapshot.animations.find(
      (candidate) => candidate.id === animation.id,
    );
    if (previewAnimation?.id === animation.id) {
      setPreviewAnimation(updated ?? null);
    }
  };

  const revealReportPath = async () => {
    const reveal = bridge?.revealPath;
    if (!reveal || !reportRevealPath) return;
    try {
      await reveal(reportRevealPath);
    } catch (error) {
      setNotice(errorMessage(error));
      setReportRevealPath(null);
    }
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
  const listenerStateKey =
    settings.voice_source.mode === 'external'
      ? 'helper.state.external'
      : listenerStatus?.state
        ? `helper.state.${listenerStatus.state}`
        : listenerStatus?.capturing
          ? 'helper.state.listening'
          : listenerStatus?.monitoring
            ? 'helper.state.no_output'
            : 'helper.state.inactive';
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
            <div className="settings-notice-actions">
              {reportRevealPath && bridge?.revealPath ? (
                <button
                  className="settings-notice-action"
                  onClick={() => void revealReportPath()}
                  type="button"
                >
                  {t('notice.revealReport')}
                </button>
              ) : null}
              <button
                aria-label={t('app.dismissNotice')}
                onClick={() => {
                  setNotice(null);
                  setReportRevealPath(null);
                }}
                type="button"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="settings-scroll">
          {readiness && (
            <section className="settings-panel setup-checklist-panel">
              <div className="panel-heading">
                <div>
                  <h2>{t('setup.checklistTitle')}</h2>
                  <p>{t('setup.checklistDesc')}</p>
                </div>
                <button
                  className="secondary-button"
                  disabled={!bridge?.getDiagnosticSummary}
                  onClick={() => void copyDiagnosticSummary()}
                  type="button"
                >
                  {t('setup.copyDiagnostic')}
                </button>
              </div>
              <p className="desktop-note">
                {readiness.complete
                  ? t('setup.complete')
                  : t('setup.incomplete')}
              </p>
              <ul className="setup-checklist">
                {readiness.steps.map((step) => (
                  <li
                    className={
                      step.ready
                        ? 'setup-step ready'
                        : step.optional
                          ? 'setup-step optional'
                          : 'setup-step pending'
                    }
                    key={step.id}
                  >
                    <div>
                      <strong>{t(`setup.step.${step.id}`)}</strong>
                      <small>{step.code}</small>
                    </div>
                    {step.next_action && (
                      <button
                        className="secondary-button"
                        onClick={() => goToSetupAction(step.next_action)}
                        type="button"
                      >
                        {t(`setup.action.${step.next_action}`)}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {section === 'models' && (
            <SettingsModelsSection
              bridge={bridge}
              busy={busy}
              chooseVrmaReportDir={chooseVrmaReportDir}
              clearVrmaReportDir={clearVrmaReportDir}
              customModelCount={customModelCount}
              deleteAllUserModels={deleteAllUserModels}
              deleteModel={deleteModel}
              importModel={importModel}
              importModelsFromDirectory={importModelsFromDirectory}
              modelName={modelName}
              selectedModel={selectedModel}
              setDefaultModel={setDefaultModel}
              setModelName={setModelName}
              setSelectedModelId={setSelectedModelId}
              setVrmaQualityGate={setVrmaQualityGate}
              settings={settings}
              t={t}
            />
          )}

          {section === 'animations' && (
            <SettingsAnimationsSection
              addAnimationClips={addAnimationClips}
              addAnimationClipsFromDirectory={addAnimationClipsFromDirectory}
              animationMetadata={animationMetadata}
              applyActionPreset={applyActionPreset}
              applyAndCreateActionPreset={applyAndCreateActionPreset}
              beginEditingAnimation={beginEditingAnimation}
              bridge={bridge}
              busy={busy}
              chooseVrmaReportDir={chooseVrmaReportDir}
              clearVrmaReportDir={clearVrmaReportDir}
              createAnimation={createAnimation}
              deleteAllUserAnimationClips={deleteAllUserAnimationClips}
              deleteAnimation={deleteAnimation}
              deleteAnimationClip={deleteAnimationClip}
              editingAnimationId={editingAnimationId}
              editingAnimationMetadata={editingAnimationMetadata}
              locale={locale}
              playAnimationClip={playAnimationClip}
              previewClipId={previewClipId}
              reorderAnimationClip={reorderAnimationClip}
              resetPackagedAnimations={resetPackagedAnimations}
              saveAnimation={saveAnimation}
              selectedActionPresetId={selectedActionPresetId}
              setAnimationMetadata={setAnimationMetadata}
              setEditingAnimationId={setEditingAnimationId}
              setEditingAnimationMetadata={setEditingAnimationMetadata}
              setSelectedActionPresetId={setSelectedActionPresetId}
              setVrmaQualityGate={setVrmaQualityGate}
              settings={settings}
              t={t}
            />
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
            <SettingsVoiceSection
              bridge={bridge}
              busy={busy}
              chooseApplicationSource={chooseApplicationSource}
              chooseVoiceMode={chooseVoiceMode}
              copyText={copyText}
              listenerStateKey={listenerStateKey}
              listenerStatus={listenerStatus}
              refreshVoiceSources={refreshVoiceSources}
              saveCustomVoiceSource={saveCustomVoiceSource}
              selectedVoiceSourceAvailable={selectedVoiceSourceAvailable}
              setVoiceMode={setVoiceMode}
              setVoicePattern={setVoicePattern}
              setVoiceSourceSearch={setVoiceSourceSearch}
              settings={settings}
              t={t}
              visibleVoiceSources={visibleVoiceSources}
              voiceCatalog={voiceCatalog}
              voiceHeading={voiceHeading}
              voiceMode={voiceMode}
              voicePattern={voicePattern}
              voiceSourceDirty={voiceSourceDirty}
              voiceSourceSearch={voiceSourceSearch}
              voiceSourcesLoading={voiceSourcesLoading}
            />
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
