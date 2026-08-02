/// <reference types="vite/client" />

type VoicePhase = 'inactive' | 'starting' | 'active' | 'stopping';
type VoiceActivity = 'idle' | 'listening' | 'speaking';

interface VoiceState {
  activity: VoiceActivity;
  locator?: { conversationId?: string; hostId?: string } | null;
  microphoneMuted: boolean;
  outputMuted: boolean;
  phase: VoicePhase;
  preferredPresentationSurface?: string | null;
  sessionId?: string | null;
}

interface AudioListenerStatus {
  available: boolean;
  capturing: boolean;
  error?: string;
  monitoring: boolean;
  source: string | null;
  state?:
    | 'inactive'
    | 'external'
    | 'missing'
    | 'launch_failed'
    | 'target_missing'
    | 'no_output'
    | 'listening';
}

interface VoxAvatarReadinessStep {
  id: 'model' | 'animations' | 'voice' | 'mcp' | string;
  ready: boolean;
  optional: boolean;
  code: string;
  next_action: string | null;
}

interface VoxAvatarAppReadiness {
  schema_version: number;
  platform: string;
  complete: boolean;
  window_visible: boolean;
  voice_activity: string | null;
  listener_state: string;
  mcp_health: 'starting' | 'online' | 'unavailable' | string;
  playable_actions: number;
  steps: VoxAvatarReadinessStep[];
  next_step: {
    id: string;
    code: string;
    next_action: string | null;
  } | null;
}

interface VoxAvatarLightingSettings {
  tone_mapping: 'none' | 'aces';
  exposure: number;
  environment_enabled: boolean;
  environment_intensity: number;
  key_light_intensity: number;
  ambient_intensity: number;
}

type VoxAvatarAnimationType =
  | 'IDLE'
  | 'GREETING'
  | 'TALK'
  | 'HAPPY'
  | 'FINGER_GUN'
  | 'DANCE';

interface VoxAvatarModelSettings {
  id: string;
  model_name: string;
  origin: 'packaged' | 'user';
  removable: boolean;
  asset_url: string;
}

interface VoxAvatarAnimationSettings {
  id: string;
  animation_name: string;
  animation_description: string;
  animation_trigger_scenario: string;
  animation_type: VoxAvatarAnimationType | null;
  origin: 'packaged' | 'user';
  system: boolean;
  editable: boolean;
  modified: boolean;
  removable: boolean;
  clips: VoxAvatarAnimationClipSettings[];
  asset_urls: string[];
}

interface VoxAvatarAnimationClipSettings {
  id: string;
  animation_name: string;
  origin: 'packaged' | 'user';
  removable: boolean;
  purpose: 'loop' | 'one-shot' | 'pose';
  asset_url: string;
}

interface VoxAvatarVoiceSourceSettings {
  mode: 'default' | 'application' | 'custom' | 'external' | 'output';
  process_pattern: string | null;
  source_id: string | null;
  source_name: string | null;
}

interface VoxAvatarVoiceSourceCatalogEntry {
  id: string;
  name: string;
  detail: string;
  platform: string;
}

interface VoxAvatarVoiceSourceCatalog {
  platform: string;
  sources: VoxAvatarVoiceSourceCatalogEntry[];
  error?: string | null;
  events_url?: string;
  listener?: AudioListenerStatus | null;
}

type VoxAvatarCharacterState =
  | 'idle'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'reviewing'
  | 'success'
  | 'failed';

type VoxAvatarStateSlotBindings = Partial<
  Record<VoxAvatarCharacterState, string | null>
>;

type VoxAvatarSettingsSnapshot = {
  schema_version: number;
  default_model_id: string | null;
  character_size: number;
  ui_locale: 'zh-TW' | 'en';
  packaged_animation_change_count: number;
  models: VoxAvatarModelSettings[];
  animations: VoxAvatarAnimationSettings[];
  model_lighting: Record<string, VoxAvatarLightingSettings>;
  voice_source: VoxAvatarVoiceSourceSettings;
  vrma_quality_gate: 'report' | 'strict' | 'off';
  vrma_quality_reject_below: number;
  vrma_quality_keep_at_least: number;
  vrma_report_dir: string | null;
  idle_rest_ms: number;
  mcp_show_message_enabled: boolean;
  state_slot_bindings: VoxAvatarStateSlotBindings;
};

type VoxAvatarDirectoryImportKind = 'model' | 'animation';

interface VoxAvatarVrmaQualityCounts {
  total: number;
  keep: number;
  review: number;
  reject: number;
}

interface VoxAvatarDirectoryImportSummary {
  kind: VoxAvatarDirectoryImportKind;
  root_dir: string;
  scanned: number;
  truncated: boolean;
  imported: number;
  skipped_quality: number;
  skipped_invalid: number;
  skipped_limit: number;
  failed: Array<{ path: string; error: string | null }>;
  quality: VoxAvatarVrmaQualityCounts | null;
  report_path: string | null;
  report_error: string | null;
}

interface VoxAvatarDirectoryImportResult {
  snapshot: VoxAvatarSettingsSnapshot;
  summary: VoxAvatarDirectoryImportSummary;
}

interface VoxAvatarMcpStatus {
  checked_at: string;
  error: string | null;
  health: 'starting' | 'online' | 'unavailable';
  health_url: string;
  local_only: boolean;
  playable_actions: string[];
  server_url: string;
  setup_command: string;
  status_schema_version?: number;
  tools: string[];
  tools_schema_version?: number;
  transport: string;
  version: string;
}

interface CustomAnimationMetadata {
  animation_name: string;
  animation_description: string;
  animation_trigger_scenario: string;
}

type AvatarBridgeEvent =
  | { type: 'state'; state: VoiceState }
  | { type: 'audio-level'; level: number; bands?: Record<string, number> }
  | {
      type: 'animation';
      animation: VoxAvatarAnimationType | 'CUSTOM';
      animationName?: string;
      animationUrls?: string[];
      source?: 'command';
      requestId?: number;
    }
  | {
      type: 'message';
      id: string;
      text: string;
      durationMs: number;
      mood: 'neutral' | 'cheerful' | 'thinking' | 'warning';
      sourceId?: string | null;
      atMs: number;
    }
  | { type: 'message-clear'; sourceId?: string | null; atMs: number }
  | {
      type: 'character-state';
      event: {
        id: string;
        state: VoxAvatarCharacterState;
        sourceKind: 'user' | 'system' | 'voice' | 'mcp' | 'integration';
        sourceId?: string;
        atMs: number;
        ttlMs?: number;
      };
    }
  | { type: 'character-state-clear'; sourceId?: string | null; atMs: number }
  | { type: 'listener-status'; status: AudioListenerStatus }
  | { type: 'bridge-status'; connected: boolean };

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Window {
  voxavatarBridge?: {
    getSnapshot(): Promise<AvatarBridgeEvent | null>;
    hide(): void;
    setIgnoreMouse?(ignore: boolean): void;
    getWindowBounds?(): Promise<WindowBounds | null>;
    moveWindow?(x: number, y: number): void;
    showContextMenu?(): void;
    subscribeResetView?(listener: () => void): () => void;
    subscribe(listener: (event: AvatarBridgeEvent) => void): () => void;
  };
  voxavatarSettings?: {
    get(): Promise<VoxAvatarSettingsSnapshot>;
    importModel(
      metadata: { model_name: string },
    ): Promise<VoxAvatarSettingsSnapshot | null>;
    importModelsFromDirectory?(
      metadata: { model_name: string },
    ): Promise<VoxAvatarDirectoryImportResult | null>;
    createAnimation(
      metadata: CustomAnimationMetadata,
    ): Promise<VoxAvatarSettingsSnapshot>;
    addAnimationClips(
      animationId: string,
    ): Promise<VoxAvatarSettingsSnapshot | null>;
    addAnimationClipsFromDirectory?(
      animationId: string,
    ): Promise<VoxAvatarDirectoryImportResult | null>;
    setVrmaQualityGate?(
      value: 'report' | 'strict' | 'off',
    ): Promise<VoxAvatarSettingsSnapshot>;
    setVrmaQualityScoreThresholds?(value: {
      reject_below?: number;
      keep_at_least?: number;
      rejectBelow?: number;
      keepAtLeast?: number;
    }): Promise<VoxAvatarSettingsSnapshot>;
    chooseVrmaReportDir?(): Promise<VoxAvatarSettingsSnapshot | null>;
    clearVrmaReportDir?(): Promise<VoxAvatarSettingsSnapshot>;
    updateAnimation(
      animationId: string,
      metadata: CustomAnimationMetadata,
    ): Promise<VoxAvatarSettingsSnapshot>;
    deleteAnimation(animationId: string): Promise<VoxAvatarSettingsSnapshot>;
    deleteAnimationClip(
      animationId: string,
      clipId: string,
    ): Promise<VoxAvatarSettingsSnapshot>;
    reorderAnimationClip?(
      animationId: string,
      clipId: string,
      direction: 'up' | 'down',
    ): Promise<VoxAvatarSettingsSnapshot>;
    revealPath?(targetPath: string): Promise<void>;
    resetPackagedAnimations(): Promise<VoxAvatarSettingsSnapshot>;
    deleteModel(modelId: string): Promise<VoxAvatarSettingsSnapshot>;
    deleteAllUserModels?(): Promise<VoxAvatarSettingsSnapshot>;
    deleteAllUserAnimationClips?(): Promise<VoxAvatarSettingsSnapshot>;
    setDefaultModel(modelId: string): Promise<VoxAvatarSettingsSnapshot>;
    setCharacterSize(size: number): Promise<VoxAvatarSettingsSnapshot>;
    setIdleRestMs?(ms: number): Promise<VoxAvatarSettingsSnapshot>;
    setMcpShowMessageEnabled?(
      enabled: boolean,
    ): Promise<VoxAvatarSettingsSnapshot>;
    setStateSlotBindings?(
      bindings: VoxAvatarStateSlotBindings,
    ): Promise<VoxAvatarSettingsSnapshot>;
    setStateSlotBinding?(
      state: VoxAvatarCharacterState,
      animationName: string | null,
    ): Promise<VoxAvatarSettingsSnapshot>;
    importActionPack?(): Promise<{
      snapshot: VoxAvatarSettingsSnapshot;
      pack_name: string;
      results: Array<{
        animation_name: string;
        created: boolean;
        clips_imported: number;
        error: string | null;
      }>;
      bindings: VoxAvatarStateSlotBindings;
    } | null>;
    setUiLocale?(locale: 'zh-TW' | 'en'): Promise<VoxAvatarSettingsSnapshot>;
    setVoiceSource(
      voiceSource: VoxAvatarVoiceSourceSettings,
    ): Promise<VoxAvatarSettingsSnapshot>;
    listVoiceSources(): Promise<VoxAvatarVoiceSourceCatalog>;
    setModelLighting(
      modelId: string,
      lighting: Partial<VoxAvatarLightingSettings>,
    ): Promise<VoxAvatarSettingsSnapshot>;
    resetModelLighting(modelId: string): Promise<VoxAvatarSettingsSnapshot>;
    getMcpStatus(): Promise<VoxAvatarMcpStatus>;
    getReadiness?(): Promise<VoxAvatarAppReadiness>;
    getDiagnosticSummary?(): Promise<{ text: string }>;
    getAppInfo?(): Promise<{ version: string }>;
    showAbout?(): Promise<void>;
    setWindowTheme(theme: 'light' | 'dark'): void;
    subscribe(
      listener: (snapshot: VoxAvatarSettingsSnapshot) => void,
    ): () => void;
  };
}
