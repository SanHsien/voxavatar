"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  ANIMATION_NAME_PATTERN,
  SYSTEM_ANIMATION_IDS,
  readPackagedLibrary,
} = require("./library-catalog.cjs");
const {
  normalizeVoiceSource,
  sanitizeVoiceSource,
} = require("./voice-source.cjs");
const { normalizeUiLocale } = require("./i18n.cjs");
const {
  normalizeQualityGate,
  normalizeReportDir,
} = require("./vrma-quality.cjs");
const {
  DEFAULT_IDLE_REST_MS,
  MAX_IDLE_REST_MS,
  MIN_IDLE_REST_MS,
  SETTINGS_SCHEMA_VERSION,
  migrateLegacyAnimations,
  normalizeIdleRestMs,
  safeReadState,
} = require("./settings-migration.cjs");
const {
  DEFAULT_MODEL_LIGHTING,
  MODEL_LIGHTING_RANGES,
  completeModelLighting,
  defaultPurposeForAnimationType,
  normalizeAnimationPurpose,
  roundedLightingNumber,
  sanitizeModelLighting,
  validateAnimationMetadata,
} = require("./settings-sanitize.cjs");
const { validateGlbFile } = require("./settings-asset-validation.cjs");
const { createCatalogMutations } = require("./settings-store-catalog.cjs");
const DEFAULT_PACKAGED_LIBRARY_PATH = path.join(
  __dirname,
  "..",
  "public",
  "assets",
  "library.json",
);
const MIN_CHARACTER_SIZE = 0.3;
const MAX_CHARACTER_SIZE = 1.6;
const MAX_CUSTOM_MODELS = 50;
const MAX_CUSTOM_ANIMATIONS = 100;
const MAX_CUSTOM_ANIMATION_CLIPS = 300;

function createSettingsStore({
  userDataPath,
  packagedLibraryPath = DEFAULT_PACKAGED_LIBRARY_PATH,
}) {
  const packagedLibrary = readPackagedLibrary(packagedLibraryPath);
  const settingsPath = path.join(userDataPath, "settings.json");
  const modelDirectory = path.join(userDataPath, "assets", "models");
  const animationDirectory = path.join(userDataPath, "assets", "animations");
  fs.mkdirSync(modelDirectory, { recursive: true });
  fs.mkdirSync(animationDirectory, { recursive: true });
  const initial = safeReadState(settingsPath, packagedLibrary);
  let state = initial.state;

  function writeState() {
    state.schema_version = SETTINGS_SCHEMA_VERSION;
    fs.mkdirSync(userDataPath, { recursive: true });
    const temporaryPath = `${settingsPath}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, settingsPath);
  }

  if (initial.migrated) writeState();

  function userAssetUrl(kind, record) {
    const extension = kind === "model" ? ".vrm" : ".vrma";
    return `voxavatar-asset://${kind}/${record.id}${extension}`;
  }

  function packagedAssetUrl(relativePath) {
    return `./assets/${relativePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/")}`;
  }

  function availableModels() {
    const packagedModels = packagedLibrary.models.map((model) => ({
      id: model.id,
      model_name: model.model_name,
      origin: "packaged",
      removable: false,
      asset_url: packagedAssetUrl(model.asset_path),
    }));
    const userModels = state.models
      .filter((model) =>
        fs.existsSync(path.join(modelDirectory, model.stored_filename)),
      )
      .map((model) => ({
        id: model.id,
        model_name: model.model_name,
        origin: "user",
        removable: true,
        asset_url: userAssetUrl("model", model),
      }));
    return [...packagedModels, ...userModels];
  }

  function packagedAnimationMetadata(animation) {
    return state.packaged_animation_overrides[animation.id] ?? animation;
  }

  function userClips(animationId) {
    return (state.animation_clips[animationId] ?? []).filter((clip) =>
      fs.existsSync(path.join(animationDirectory, clip.stored_filename)),
    );
  }

  function animationClips(animation, animationName = animation.animation_name) {
    const defaultPurpose = defaultPurposeForAnimationType(
      animation.animation_type,
    );
    const packagedClips = (animation.asset_paths ?? []).map(
      (assetPath, index) => ({
        id: `${animation.id}:packaged:${index + 1}`,
        animation_name: `${animationName}${index + 1}`,
        origin: "packaged",
        removable: false,
        purpose: defaultPurpose,
        asset_url: packagedAssetUrl(assetPath),
      }),
    );
    const uploadedClips = userClips(animation.id).map((clip) => ({
      id: clip.id,
      animation_name: clip.clip_name,
      origin: "user",
      removable: true,
      purpose: normalizeAnimationPurpose(clip.purpose ?? defaultPurpose),
      asset_url: userAssetUrl("animation", clip),
    }));
    return [...packagedClips, ...uploadedClips];
  }

  function availableAnimations() {
    const hidden = new Set(state.hidden_packaged_animation_ids);
    const packagedAnimations = packagedLibrary.animations
      .filter((animation) => !hidden.has(animation.id))
      .map((animation) => {
        const metadata = packagedAnimationMetadata(animation);
        const clips = animationClips(animation, metadata.animation_name);
        const system = SYSTEM_ANIMATION_IDS.has(animation.id);
        return {
          id: animation.id,
          animation_name: metadata.animation_name,
          animation_description: metadata.animation_description,
          animation_trigger_scenario: metadata.animation_trigger_scenario,
          animation_type: animation.animation_type,
          origin: "packaged",
          system,
          editable: !system,
          modified: state.packaged_animation_overrides[animation.id] != null,
          removable: !system,
          clips,
          asset_urls: clips.map((clip) => clip.asset_url),
        };
      });
    const userAnimations = state.animations.map((animation) => {
      const clips = animationClips({ ...animation, asset_paths: [] });
      return {
        id: animation.id,
        animation_name: animation.animation_name,
        animation_description: animation.animation_description,
        animation_trigger_scenario: animation.animation_trigger_scenario,
        animation_type: null,
        origin: "user",
        system: false,
        editable: true,
        modified: false,
        removable: true,
        clips,
        asset_urls: clips.map((clip) => clip.asset_url),
      };
    });
    return [...packagedAnimations, ...userAnimations];
  }

  function getSnapshot() {
    const models = availableModels();
    const modelIds = new Set(models.map((model) => model.id));
    const defaultModel = models.some(
      (model) => model.id === state.default_model_id,
    )
      ? state.default_model_id
      : packagedLibrary.default_model_id;
    const characterSize = Number(state.character_size);
    const changedPackagedIds = new Set([
      ...Object.keys(state.packaged_animation_overrides),
      ...state.hidden_packaged_animation_ids,
    ]);
    return {
      schema_version: SETTINGS_SCHEMA_VERSION,
      default_model_id: defaultModel,
      character_size:
        Number.isFinite(characterSize) &&
        characterSize >= MIN_CHARACTER_SIZE &&
        characterSize <= MAX_CHARACTER_SIZE
          ? characterSize
          : 1,
      ui_locale: normalizeUiLocale(state.ui_locale),
      packaged_animation_change_count: changedPackagedIds.size,
      models,
      animations: availableAnimations(),
      model_lighting: sanitizeModelLighting(
        state.model_lighting,
        modelIds,
      ),
      voice_source: normalizeVoiceSource(state.voice_source),
      vrma_quality_gate: normalizeQualityGate(state.vrma_quality_gate),
      vrma_report_dir: normalizeReportDir(state.vrma_report_dir),
      idle_rest_ms: normalizeIdleRestMs(state.idle_rest_ms),
      mcp_show_message_enabled: state.mcp_show_message_enabled === true,
    };
  }

  const {
    addAnimationClips,
    addAnimationClipsBestEffort,
    createAnimation,
    deleteAnimation,
    deleteAnimationClip,
    deleteAllUserAnimationClips,
    deleteAllUserModels,
    deleteModel,
    importModel,
    importModelsFromPaths,
    resetPackagedAnimations,
    reorderAnimationClip,
    setDefaultModel,
    updateAnimation,
  } = createCatalogMutations({
    getState: () => state,
    writeState,
    getSnapshot,
    availableModels,
    availableAnimations,
    modelDirectory,
    animationDirectory,
    packagedLibrary,
    maxCustomModels: MAX_CUSTOM_MODELS,
    maxCustomAnimations: MAX_CUSTOM_ANIMATIONS,
    maxCustomAnimationClips: MAX_CUSTOM_ANIMATION_CLIPS,
  });

  function setVrmaQualityGate(value) {
    state.vrma_quality_gate = normalizeQualityGate(value);
    writeState();
    return getSnapshot();
  }

  function setVrmaReportDir(value) {
    state.vrma_report_dir = normalizeReportDir(value);
    writeState();
    return getSnapshot();
  }

  function setCharacterSize(value) {
    const size = Number(value);
    if (
      !Number.isFinite(size) ||
      size < MIN_CHARACTER_SIZE ||
      size > MAX_CHARACTER_SIZE
    ) {
      throw new Error(
        `Character size must be between ${MIN_CHARACTER_SIZE} and ${MAX_CHARACTER_SIZE}.`,
      );
    }
    state.character_size = Math.round(size * 100) / 100;
    writeState();
    return getSnapshot();
  }

  function setUiLocale(value) {
    state.ui_locale = normalizeUiLocale(value);
    writeState();
    return getSnapshot();
  }

  function setIdleRestMs(value) {
    state.idle_rest_ms = normalizeIdleRestMs(value);
    writeState();
    return getSnapshot();
  }

  function setMcpShowMessageEnabled(value) {
    state.mcp_show_message_enabled = value === true;
    writeState();
    return getSnapshot();
  }

  function setVoiceSource(value) {
    state.voice_source = sanitizeVoiceSource(value);
    writeState();
    return getSnapshot();
  }

  function setModelLighting(modelId, lighting) {
    if (!availableModels().some((model) => model.id === modelId)) {
      throw new Error("Selected model is not installed.");
    }
    if (
      !lighting ||
      typeof lighting !== "object" ||
      Array.isArray(lighting)
    ) {
      throw new Error("lighting must be an object.");
    }
    const merged = completeModelLighting(state.model_lighting[modelId]);
    if (lighting.tone_mapping !== undefined) {
      if (lighting.tone_mapping !== "none" && lighting.tone_mapping !== "aces") {
        throw new Error("tone_mapping must be 'none' or 'aces'.");
      }
      merged.tone_mapping = lighting.tone_mapping;
    }
    if (lighting.exposure !== undefined) {
      const value = roundedLightingNumber(
        lighting.exposure,
        MODEL_LIGHTING_RANGES.exposure,
        DEFAULT_MODEL_LIGHTING.exposure,
      );
      if (value == null) {
        throw new Error("exposure must be between 0.1 and 3.");
      }
      merged.exposure = value;
    }
    if (lighting.environment_enabled !== undefined) {
      if (typeof lighting.environment_enabled !== "boolean") {
        throw new Error("environment_enabled must be a boolean.");
      }
      merged.environment_enabled = lighting.environment_enabled;
    }
    if (lighting.environment_intensity !== undefined) {
      const value = roundedLightingNumber(
        lighting.environment_intensity,
        MODEL_LIGHTING_RANGES.environment_intensity,
        DEFAULT_MODEL_LIGHTING.environment_intensity,
      );
      if (value == null) {
        throw new Error("environment_intensity must be between 0 and 2.");
      }
      merged.environment_intensity = value;
    }
    if (lighting.key_light_intensity !== undefined) {
      const value = roundedLightingNumber(
        lighting.key_light_intensity,
        MODEL_LIGHTING_RANGES.key_light_intensity,
        DEFAULT_MODEL_LIGHTING.key_light_intensity,
      );
      if (value == null) {
        throw new Error("key_light_intensity must be between 0 and 4.");
      }
      merged.key_light_intensity = value;
    }
    if (lighting.ambient_intensity !== undefined) {
      const value = roundedLightingNumber(
        lighting.ambient_intensity,
        MODEL_LIGHTING_RANGES.ambient_intensity,
        DEFAULT_MODEL_LIGHTING.ambient_intensity,
      );
      if (value == null) {
        throw new Error("ambient_intensity must be between 0 and 4.");
      }
      merged.ambient_intensity = value;
    }
    state.model_lighting[modelId] = merged;
    writeState();
    return getSnapshot();
  }

  function resetModelLighting(modelId) {
    if (!availableModels().some((model) => model.id === modelId)) {
      throw new Error("Selected model is not installed.");
    }
    delete state.model_lighting[modelId];
    writeState();
    return getSnapshot();
  }

  function getAnimation(animationName) {
    return (
      availableAnimations().find(
        (animation) => animation.animation_name === animationName,
      ) ?? null
    );
  }

  function resolveAssetRequest(rawUrl) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      return null;
    }
    if (url.protocol !== "voxavatar-asset:" || url.search || url.hash) return null;
    const kind = url.hostname;
    const requestedFilename = url.pathname.replace(/^\/+/, "");
    if (kind === "model") {
      const record = state.models.find(
        (model) => `${model.id}.vrm` === requestedFilename,
      );
      if (!record) return null;
      const resolved = path.join(modelDirectory, record.stored_filename);
      return fs.existsSync(resolved) ? resolved : null;
    }
    if (kind === "animation") {
      const record = Object.values(state.animation_clips)
        .flat()
        .find((clip) => `${clip.id}.vrma` === requestedFilename);
      if (!record) return null;
      const resolved = path.join(animationDirectory, record.stored_filename);
      return fs.existsSync(resolved) ? resolved : null;
    }
    return null;
  }

  return {
    addAnimationClips,
    addAnimationClipsBestEffort,
    createAnimation,
    deleteAnimation,
    deleteAnimationClip,
    deleteAllUserAnimationClips,
    deleteAllUserModels,
    deleteModel,
    getAnimation,
    getSnapshot,
    importModel,
    importModelsFromPaths,
    resetPackagedAnimations,
    resolveAssetRequest,
    setCharacterSize,
    setIdleRestMs,
    setMcpShowMessageEnabled,
    setUiLocale,
    setVoiceSource,
    setVrmaQualityGate,
    setVrmaReportDir,
    setDefaultModel,
    setModelLighting,
    resetModelLighting,
    reorderAnimationClip,
    updateAnimation,
  };
}

module.exports = {
  ANIMATION_NAME_PATTERN,
  DEFAULT_MODEL_LIGHTING,
  DEFAULT_PACKAGED_LIBRARY_PATH,
  MAX_CHARACTER_SIZE,
  DEFAULT_IDLE_REST_MS,
  MAX_IDLE_REST_MS,
  MIN_CHARACTER_SIZE,
  MIN_IDLE_REST_MS,
  SETTINGS_SCHEMA_VERSION,
  normalizeIdleRestMs,
  createSettingsStore,
  migrateLegacyAnimations,
  safeReadState,
  validateAnimationMetadata,
  validateGlbFile,
};
