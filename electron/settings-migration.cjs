"use strict";

const fs = require("node:fs");
const {
  SYSTEM_ANIMATION_IDS,
  inferAnimationType,
} = require("./library-catalog.cjs");
const {
  DEFAULT_VOICE_SOURCE,
  normalizeVoiceSource,
} = require("./voice-source.cjs");
const { normalizeUiLocale } = require("./i18n.cjs");
const {
  QUALITY_GATE,
  normalizeQualityGate,
  normalizeReportDir,
} = require("./vrma-quality.cjs");
const {
  sanitizeAnimationClips,
  sanitizeModelLighting,
  sanitizeModels,
  sanitizeUserAnimations,
  validateAnimationMetadata,
  validStoredAsset,
  nextClipName,
  defaultPurposeForAnimationType,
} = require("./settings-sanitize.cjs");

const SETTINGS_SCHEMA_VERSION = 7;
const DEFAULT_IDLE_REST_MS = 8000;
const MIN_IDLE_REST_MS = 2000;
const MAX_IDLE_REST_MS = 60000;

function normalizeIdleRestMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return DEFAULT_IDLE_REST_MS;
  return Math.round(
    Math.max(MIN_IDLE_REST_MS, Math.min(MAX_IDLE_REST_MS, ms)),
  );
}

function defaultState(packagedLibrary) {
  return {
    schema_version: SETTINGS_SCHEMA_VERSION,
    default_model_id: packagedLibrary.default_model_id,
    character_size: 1,
    ui_locale: "zh-TW",
    model_lighting: {},
    models: [],
    animations: [],
    animation_clips: {},
    packaged_animation_overrides: {},
    hidden_packaged_animation_ids: [],
    voice_source: { ...DEFAULT_VOICE_SOURCE },
    vrma_quality_gate: QUALITY_GATE.STRICT,
    vrma_report_dir: null,
    idle_rest_ms: DEFAULT_IDLE_REST_MS,
  };
}

function packagedUserLayers(parsed, packagedLibrary) {
  const packagedIds = new Set(
    packagedLibrary.animations.map((animation) => animation.id),
  );
  const overrides = {};
  if (
    parsed.packaged_animation_overrides != null &&
    typeof parsed.packaged_animation_overrides === "object"
  ) {
    for (const [id, metadata] of Object.entries(
      parsed.packaged_animation_overrides,
    )) {
      if (!packagedIds.has(id) || SYSTEM_ANIMATION_IDS.has(id)) continue;
      try {
        overrides[id] = validateAnimationMetadata(metadata);
      } catch {
        // Ignore an invalid user override and retain the packaged metadata.
      }
    }
  }

  const hidden = Array.isArray(parsed.hidden_packaged_animation_ids)
    ? [
        ...new Set(
          parsed.hidden_packaged_animation_ids.filter(
            (id) => packagedIds.has(id) && !SYSTEM_ANIMATION_IDS.has(id),
          ),
        ),
      ]
    : [];
  return { hidden, overrides };
}

function migrateLegacyAnimations(animations, packagedLibrary) {
  const userAnimations = [];
  const animationClips = {};
  const systemByType = new Map(
    packagedLibrary.animations
      .filter((animation) => SYSTEM_ANIMATION_IDS.has(animation.id))
      .map((animation) => [animation.animation_type, animation]),
  );
  const usedClipNames = new Map();

  for (const animation of Array.isArray(animations) ? animations : []) {
    if (!validStoredAsset(animation, ".vrma")) continue;
    let metadata;
    try {
      metadata = validateAnimationMetadata(animation);
    } catch {
      continue;
    }

    const inferredType = inferAnimationType(metadata.animation_name);
    const systemAnimation =
      inferredType === "IDLE" || inferredType === "TALK"
        ? systemByType.get(inferredType)
        : null;
    const animationId = systemAnimation?.id ?? animation.id;
    const animationName =
      systemAnimation?.animation_name ?? metadata.animation_name;
    if (
      !systemAnimation &&
      !userAnimations.some((candidate) => candidate.id === animationId)
    ) {
      userAnimations.push({ id: animationId, ...metadata });
    }

    const names = usedClipNames.get(animationId) ?? new Set();
    usedClipNames.set(animationId, names);
    const clips = animationClips[animationId] ?? [];
    clips.push({
      id: animation.id,
      stored_filename: animation.stored_filename,
      clip_name: nextClipName(animationName, names),
      purpose: defaultPurposeForAnimationType(
        systemAnimation?.animation_type ?? inferredType,
      ),
    });
    animationClips[animationId] = clips;
  }

  return { animationClips, userAnimations };
}

function purposeByAnimationIdMap(packagedLibrary, userAnimations) {
  const map = new Map();
  for (const animation of packagedLibrary.animations ?? []) {
    map.set(
      animation.id,
      defaultPurposeForAnimationType(animation.animation_type),
    );
  }
  for (const animation of userAnimations ?? []) {
    if (!map.has(animation.id)) {
      map.set(animation.id, defaultPurposeForAnimationType(null));
    }
  }
  return map;
}

function sanitizeClipsForState(parsedClips, packagedLibrary, userAnimations) {
  const knownAnimationIds = new Set([
    ...packagedLibrary.animations.map((animation) => animation.id),
    ...userAnimations.map((animation) => animation.id),
  ]);
  return sanitizeAnimationClips(parsedClips, knownAnimationIds, {
    purposeByAnimationId: purposeByAnimationIdMap(
      packagedLibrary,
      userAnimations,
    ),
  });
}

function safeReadState(settingsPath, packagedLibrary) {
  const fallback = defaultState(packagedLibrary);
  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    if (
      ![1, 2, 3, 4, 5, 6, SETTINGS_SCHEMA_VERSION].includes(
        parsed?.schema_version,
      )
    ) {
      try {
        fs.copyFileSync(
          settingsPath,
          `${settingsPath}.unmigratable-backup`,
        );
      } catch {
        // 無法備份時仍回退至預設狀態。
      }
      return {
        migrated: false,
        state: fallback,
        migration_error: "unsupported_schema",
      };
    }
    const { hidden, overrides } = packagedUserLayers(parsed, packagedLibrary);
    const models = sanitizeModels(parsed.models);
    const knownModelIds = new Set([
      ...packagedLibrary.models.map((model) => model.id),
      ...models.map((model) => model.id),
    ]);
    const voiceSource = normalizeVoiceSource(parsed.voice_source);
    const common = {
      ...fallback,
      default_model_id:
        typeof parsed.default_model_id === "string"
          ? parsed.default_model_id
          : fallback.default_model_id,
      character_size: parsed.character_size,
      ui_locale: normalizeUiLocale(parsed.ui_locale),
      model_lighting: sanitizeModelLighting(
        parsed.model_lighting,
        knownModelIds,
      ),
      models,
      packaged_animation_overrides: overrides,
      hidden_packaged_animation_ids: hidden,
      voice_source: voiceSource,
      vrma_quality_gate: normalizeQualityGate(parsed.vrma_quality_gate),
      vrma_report_dir: normalizeReportDir(parsed.vrma_report_dir),
      idle_rest_ms: normalizeIdleRestMs(parsed.idle_rest_ms),
    };

    if (parsed.schema_version !== SETTINGS_SCHEMA_VERSION) {
      if (
        parsed.schema_version === 6 ||
        parsed.schema_version === 5 ||
        parsed.schema_version === 3
      ) {
        const animations = sanitizeUserAnimations(parsed.animations);
        return {
          migrated: true,
          state: {
            ...common,
            animations,
            animation_clips: sanitizeClipsForState(
              parsed.animation_clips,
              packagedLibrary,
              animations,
            ),
          },
        };
      }
      const migrated = migrateLegacyAnimations(
        parsed.animations,
        packagedLibrary,
      );
      return {
        migrated: true,
        state: {
          ...common,
          animations: migrated.userAnimations,
          animation_clips: migrated.animationClips,
        },
      };
    }

    const animations = sanitizeUserAnimations(parsed.animations);
    return {
      migrated: false,
      state: {
        ...common,
        animations,
        animation_clips: sanitizeClipsForState(
          parsed.animation_clips,
          packagedLibrary,
          animations,
        ),
      },
    };
  } catch {
    return { migrated: false, state: fallback };
  }
}

module.exports = {
  DEFAULT_IDLE_REST_MS,
  MAX_IDLE_REST_MS,
  MIN_IDLE_REST_MS,
  SETTINGS_SCHEMA_VERSION,
  migrateLegacyAnimations,
  normalizeIdleRestMs,
  safeReadState,
};
