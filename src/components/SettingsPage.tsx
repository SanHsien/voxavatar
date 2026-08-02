import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  normalizeUiLocale,
  settingsT,
} from '../settings-i18n';
import {
  directoryImportExtraParts,
  formatActionPackImportNotice,
} from '../import-feedback';
import {
  applyTheme,
  LIGHT_QUERY,
  readStoredTheme,
  storeTheme,
  type ThemePreference,
} from '../theme';
import { SettingsModelsSection } from './settings/SettingsModelsSection';
import { SettingsAnimationsSection } from './settings/SettingsAnimationsSection';
import { SettingsStateSlotsSection } from './settings/SettingsStateSlotsSection';
import { SettingsVoiceSection } from './settings/SettingsVoiceSection';
import {
  SettingsAppearanceSection,
  type LightingNumberField,
} from './settings/SettingsAppearanceSection';
import { SettingsMcpSection } from './settings/SettingsMcpSection';
import { SettingsPreviewPanel } from './settings/SettingsPreviewPanel';
import { SettingsConfirmationDialog } from './settings/SettingsConfirmationDialog';
import type { CharacterState } from '../character-state';

type SettingsSection = 'models' | 'animations' | 'appearance' | 'voice' | 'mcp';

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
  const [highlightedAnimationId, setHighlightedAnimationId] = useState<
    string | null
  >(null);
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
  const previewClip =
    previewAnimation?.clips.find((clip) => clip.id === previewClipId) ??
    settings.unassigned_clips?.find((clip) => clip.id === previewClipId);
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
        ...directoryImportExtraParts(result.summary, t),
      ];
      if (result.summary.report_path) {
        setReportRevealPath(result.summary.report_path);
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
    if (highlightedAnimationId === animation.id) {
      setHighlightedAnimationId(null);
    }
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
      if (
        highlightedAnimationId === animation.id &&
        result.summary.imported > 0
      ) {
        setHighlightedAnimationId(null);
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
        ...directoryImportExtraParts(result.summary, t),
      ];
      if (result.summary.report_path) {
        setReportRevealPath(result.summary.report_path);
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

  const setVrmaQualityScoreThresholds = async (
    rejectBelow: number,
    keepAtLeast: number,
  ) => {
    const setThresholds = bridge?.setVrmaQualityScoreThresholds;
    if (!setThresholds) return;
    await run(
      () =>
        setThresholds({
          reject_below: rejectBelow,
          keep_at_least: keepAtLeast,
        }),
      t('notice.qualityScoreUpdated'),
    );
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
    const createdName = animationMetadata.animation_name.trim();
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
    const created = snapshot.animations.find(
      (animation) => animation.animation_name === createdName,
    );
    if (created) setHighlightedAnimationId(created.id);
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
    const created = snapshot.animations.find(
      (animation) => animation.animation_name === resolved.animation_name,
    );
    if (created) setHighlightedAnimationId(created.id);
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
    const assignedCount = settings.animations.reduce(
      (total, animation) =>
        total +
        animation.clips.filter((clip) => clip.removable || clip.origin === 'user')
          .length,
      0,
    );
    const poolCount = settings.unassigned_clips?.length ?? 0;
    const count = assignedCount + poolCount;
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
    setHighlightedAnimationId(null);
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

  const setStateSlotBinding = async (
    state: CharacterState,
    animationName: string | null,
  ) => {
    if (!bridge?.setStateSlotBinding) return;
    await run(
      () => bridge.setStateSlotBinding!(state, animationName),
      t('notice.stateSlotUpdated'),
    );
  };

  const importActionPack = async () => {
    if (!bridge?.importActionPack) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await bridge.importActionPack();
      if (!result) {
        setNotice(t('notice.actionPackCancelled'));
        return;
      }
      updateSnapshot(result.snapshot);
      setNotice(
        formatActionPackImportNotice(result.pack_name, result.results, t),
      );
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const assignVrmaByFilename = async () => {
    if (!bridge?.assignVrmaByFilename) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await bridge.assignVrmaByFilename();
      if (!result) {
        setNotice(t('notice.assignByFilenameCancelled'));
        return;
      }
      updateSnapshot(result.snapshot);
      if (result.cancelled) {
        setNotice(t('notice.assignByFilenameCancelled'));
        return;
      }
      if (result.assigned === 0) {
        setNotice(t('notice.assignByFilenameNone'));
        return;
      }
      setNotice(
        t('notice.assignByFilenameDone', {
          assigned: result.assigned,
          skipped: result.skipped,
        }),
      );
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
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

  const updateAnimationClip = async (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    patch: {
      clip_name?: string;
      purpose?: VoxAvatarAnimationClipSettings['purpose'];
    },
  ) => {
    const update = bridge?.updateAnimationClip;
    if (!update || !clip.removable) return false;
    const snapshot = await run(
      () => update(animation.id, clip.id, patch),
      t('notice.clipUpdated', { name: patch.clip_name ?? clip.animation_name }),
    );
    if (!snapshot) return false;
    const updated = snapshot.animations.find(
      (candidate) => candidate.id === animation.id,
    );
    if (previewAnimation?.id === animation.id) {
      setPreviewAnimation(updated ?? null);
    }
    return true;
  };

  const moveAnimationClip = async (
    from: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
    toAnimationId: string,
  ) => {
    const move = bridge?.moveAnimationClip;
    if (!move || !clip.removable) return false;
    const target = settings.animations.find(
      (candidate) => candidate.id === toAnimationId,
    );
    const snapshot = await run(
      () => move(from.id, clip.id, toAnimationId),
      t('notice.clipMoved', {
        name: clip.animation_name,
        action: target?.animation_name ?? toAnimationId,
      }),
    );
    if (!snapshot) return false;
    if (previewClipId === clip.id) {
      const updatedTarget = snapshot.animations.find(
        (candidate) => candidate.id === toAnimationId,
      );
      setPreviewAnimation(updatedTarget ?? null);
    } else if (previewAnimation?.id === from.id) {
      const updatedFrom = snapshot.animations.find(
        (candidate) => candidate.id === from.id,
      );
      setPreviewAnimation(updatedFrom ?? null);
    }
    return true;
  };

  const addUnassignedClips = async () => {
    if (!bridge?.addUnassignedClips) return;
    const before = settings.unassigned_clips?.length ?? 0;
    setBusy(true);
    setNotice(null);
    setReportRevealPath(null);
    try {
      const snapshot = await bridge.addUnassignedClips();
      if (!snapshot) return;
      updateSnapshot(snapshot);
      const added = (snapshot.unassigned_clips?.length ?? 0) - before;
      setNotice(t('notice.poolClipsAdded', { count: added }));
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const updateUnassignedClip = async (
    clip: VoxAvatarAnimationClipSettings,
    patch: {
      clip_name?: string;
      purpose?: VoxAvatarAnimationClipSettings['purpose'];
    },
  ) => {
    const update = bridge?.updateUnassignedClip;
    if (!update || !clip.removable) return false;
    const snapshot = await run(
      () => update(clip.id, patch),
      t('notice.clipUpdated', { name: patch.clip_name ?? clip.animation_name }),
    );
    return Boolean(snapshot);
  };

  const deleteUnassignedClip = (clip: VoxAvatarAnimationClipSettings) => {
    if (!bridge?.deleteUnassignedClip || !clip.removable) return;
    openConfirmation({
      confirmLabel: t('common.delete'),
      title: t('confirm.deleteClip.title', { name: clip.animation_name }),
      detail: t('confirm.deleteClip.detail'),
      onConfirm: async () => {
        const snapshot = await run(
          () => bridge.deleteUnassignedClip!(clip.id),
          t('notice.clipDeleted', { name: clip.animation_name }),
        );
        if (!snapshot) return;
        if (previewClipId === clip.id) {
          setPreviewClipId(null);
          setPreviewAnimation(null);
        }
      },
    });
  };

  const assignUnassignedClip = async (
    clipId: string,
    animation: VoxAvatarAnimationSettings,
  ) => {
    const assign = bridge?.assignUnassignedClip;
    if (!assign) return false;
    const clip = settings.unassigned_clips?.find(
      (candidate) => candidate.id === clipId,
    );
    const snapshot = await run(
      () => assign(clipId, animation.id),
      t('notice.poolClipAssigned', {
        name: clip?.animation_name ?? clipId,
        action: animation.animation_name,
      }),
    );
    if (!snapshot) return false;
    if (previewClipId === clipId) {
      const updated = snapshot.animations.find(
        (candidate) => candidate.id === animation.id,
      );
      setPreviewAnimation(updated ?? null);
    }
    return true;
  };

  const moveAnimationClipToUnassigned = async (
    animation: VoxAvatarAnimationSettings,
    clip: VoxAvatarAnimationClipSettings,
  ) => {
    const move = bridge?.moveAnimationClipToUnassigned;
    if (!move || !clip.removable) return false;
    const snapshot = await run(
      () => move(animation.id, clip.id),
      t('notice.clipMovedToPool', { name: clip.animation_name }),
    );
    if (!snapshot) return false;
    if (previewClipId === clip.id) {
      setPreviewAnimation(null);
    }
    if (previewAnimation?.id === animation.id) {
      const updated = snapshot.animations.find(
        (candidate) => candidate.id === animation.id,
      );
      setPreviewAnimation(updated ?? null);
    }
    return true;
  };

  const updateClipsPurpose = async (
    targets: VoxAvatarClipPurposeTarget[],
    purpose: VoxAvatarAnimationClipSettings['purpose'],
  ) => {
    const update = bridge?.updateClipsPurpose;
    if (!update || targets.length === 0) return false;
    const snapshot = await run(
      () => update(targets, purpose),
      t('notice.clipsPurposeUpdated', {
        count: targets.length,
        purpose: t(`actions.purpose.${purpose}`),
      }),
    );
    return Boolean(snapshot);
  };

  const playUnassignedClip = (clip: VoxAvatarAnimationClipSettings) => {
    setPreviewAnimation(null);
    setPreviewClipId(clip.id);
    setPreviewRequest((request) => request + 1);
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

  const toggleMcpShowMessage = (enabled: boolean) => {
    const setter = bridge?.setMcpShowMessageEnabled;
    if (!setter) return;
    setSettings((current) => ({
      ...current,
      mcp_show_message_enabled: enabled,
    }));
    void run(
      () => setter(enabled),
      enabled
        ? t('notice.mcpShowMessageEnabled')
        : t('notice.mcpShowMessageDisabled'),
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
          {readiness && !readiness.complete && (
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
              <p className="desktop-note">{t('setup.incomplete')}</p>
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
              setVrmaQualityScoreThresholds={setVrmaQualityScoreThresholds}
              settings={settings}
              t={t}
            />
          )}

          {section === 'animations' && (
            <>
              <SettingsAnimationsSection
              addAnimationClips={addAnimationClips}
              addAnimationClipsFromDirectory={addAnimationClipsFromDirectory}
              addUnassignedClips={addUnassignedClips}
              assignUnassignedClip={assignUnassignedClip}
              assignVrmaByFilename={assignVrmaByFilename}
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
              deleteUnassignedClip={deleteUnassignedClip}
              editingAnimationId={editingAnimationId}
              editingAnimationMetadata={editingAnimationMetadata}
              highlightedAnimationId={highlightedAnimationId}
              locale={locale}
              moveAnimationClip={moveAnimationClip}
              moveAnimationClipToUnassigned={moveAnimationClipToUnassigned}
              playAnimationClip={playAnimationClip}
              playUnassignedClip={playUnassignedClip}
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
              setVrmaQualityScoreThresholds={setVrmaQualityScoreThresholds}
              settings={settings}
              t={t}
              updateAnimationClip={updateAnimationClip}
              updateClipsPurpose={updateClipsPurpose}
              updateUnassignedClip={updateUnassignedClip}
            />
              <SettingsStateSlotsSection
                bridge={bridge}
                busy={busy}
                importActionPack={importActionPack}
                setStateSlotBinding={setStateSlotBinding}
                settings={settings}
                t={t}
              />
            </>
          )}

          {section === 'appearance' && (
            <SettingsAppearanceSection
              bridge={bridge}
              busy={busy}
              chooseTheme={chooseTheme}
              previewCharacterSize={previewCharacterSize}
              previewIdleRestMs={previewIdleRestMs}
              previewLighting={previewLighting}
              previewLightingField={previewLightingField}
              previewLightingNumber={previewLightingNumber}
              resetLighting={resetLighting}
              saveCharacterSize={saveCharacterSize}
              saveIdleRestMs={saveIdleRestMs}
              saveLightingField={saveLightingField}
              saveLightingNumber={saveLightingNumber}
              saveUiLocale={saveUiLocale}
              selectedModel={selectedModel}
              settings={settings}
              t={t}
              themePreference={themePreference}
            />
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
            <SettingsMcpSection
              busy={busy}
              copyDiagnosticSummary={
                bridge?.getDiagnosticSummary
                  ? () => void copyDiagnosticSummary()
                  : undefined
              }
              copyText={copyText}
              mcpHealth={mcpHealth}
              mcpLoading={mcpLoading}
              mcpServerUrl={mcpServerUrl}
              mcpSetupCommand={mcpSetupCommand}
              mcpShowMessageEnabled={settings.mcp_show_message_enabled === true}
              mcpStatus={mcpStatus}
              onToggleMcpShowMessage={toggleMcpShowMessage}
              refreshMcpStatus={refreshMcpStatus}
              t={t}
            />
          )}
        </div>
      </section>

      <SettingsPreviewPanel
        characterSize={settings.character_size}
        modelId={selectedModel?.id}
        modelName={selectedModel?.model_name ?? 'VoxAvatar'}
        modelUrl={selectedModel?.asset_url}
        onAnimationComplete={() => {
          setPreviewAnimation(null);
          setPreviewClipId(null);
        }}
        onToggleCollapsed={() =>
          setPreviewCollapsed((collapsed) => !collapsed)
        }
        playback={previewClip ? 'once' : 'loop'}
        previewAnimationUrls={previewAnimationUrls}
        previewCollapsed={previewCollapsed}
        previewDescription={previewAnimation?.animation_description ?? null}
        previewLighting={previewLighting}
        previewRequest={previewRequest}
        previewTitle={previewTitle}
        previewType={previewType}
        t={t}
      />

      {confirmation && (
        <SettingsConfirmationDialog
          cancelRef={confirmationCancelRef}
          confirmation={confirmation}
          confirming={confirming}
          confirmRef={confirmationConfirmRef}
          dialogRef={confirmationDialogRef}
          onClose={closeConfirmation}
          onConfirm={() => void confirmPendingAction()}
          t={t}
        />
      )}
    </main>
  );
}
