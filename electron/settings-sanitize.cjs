"use strict";

const {
  ANIMATION_NAME_PATTERN,
} = require("./library-catalog.cjs");
const {
  ANIMATION_PURPOSE,
  defaultPurposeForAnimationType,
  normalizeAnimationPurpose,
} = require("./vrma-quality.cjs");

const ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_MODEL_LIGHTING = Object.freeze({
  tone_mapping: "none",
  exposure: 1,
  environment_enabled: true,
  environment_intensity: 1,
  key_light_intensity: Math.PI,
  ambient_intensity: Math.PI,
});
const MODEL_LIGHTING_RANGES = Object.freeze({
  exposure: [0.1, 3],
  environment_intensity: [0, 2],
  key_light_intensity: [0, 4],
  ambient_intensity: [0, 4],
});

function singleLine(value, field, maxLength) {
  if (typeof value !== "string") throw new Error(`${field} is required.`);
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) throw new Error(`${field} is required.`);
  if (normalized.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

function validateAnimationMetadata(metadata) {
  const animation_name = singleLine(
    metadata?.animation_name,
    "Animation name",
    48,
  ).toLowerCase();
  if (!ANIMATION_NAME_PATTERN.test(animation_name)) {
    throw new Error(
      "Animation name must use lowercase letters, numbers, and single hyphens.",
    );
  }
  return {
    animation_name,
    animation_description: singleLine(
      metadata?.animation_description,
      "Animation description",
      240,
    ),
    animation_trigger_scenario: singleLine(
      metadata?.animation_trigger_scenario,
      "Animation trigger scenario",
      240,
    ),
  };
}

function validStoredAsset(record, extension) {
  return (
    ASSET_ID_PATTERN.test(record?.id) &&
    record.stored_filename === `${record.id}${extension}`
  );
}

function sanitizeModels(models) {
  if (!Array.isArray(models)) return [];
  return models.flatMap((model) => {
    if (!validStoredAsset(model, ".vrm")) return [];
    try {
      return [
        {
          ...model,
          model_name: singleLine(model.model_name, "Model name", 80),
        },
      ];
    } catch {
      return [];
    }
  });
}

function roundedLightingNumber(
  value,
  [minimum, maximum],
  defaultValue = null,
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    return null;
  }
  return value === defaultValue
    ? defaultValue
    : Math.round(value * 100) / 100;
}

function completeModelLighting(value) {
  const source =
    value != null && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  const lighting = { ...DEFAULT_MODEL_LIGHTING };
  if (source.tone_mapping === "none" || source.tone_mapping === "aces") {
    lighting.tone_mapping = source.tone_mapping;
  }
  if (typeof source.environment_enabled === "boolean") {
    lighting.environment_enabled = source.environment_enabled;
  }
  for (const [field, range] of Object.entries(MODEL_LIGHTING_RANGES)) {
    const normalized = roundedLightingNumber(
      source[field],
      range,
      DEFAULT_MODEL_LIGHTING[field],
    );
    if (normalized != null) lighting[field] = normalized;
  }
  return lighting;
}

function sanitizeModelLighting(modelLighting, knownModelIds) {
  if (
    modelLighting == null ||
    typeof modelLighting !== "object" ||
    Array.isArray(modelLighting)
  ) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(modelLighting)
      .filter(([modelId]) => knownModelIds.has(modelId))
      .map(([modelId, lighting]) => [
        modelId,
        completeModelLighting(lighting),
      ]),
  );
}

function sanitizeUserAnimations(animations) {
  if (!Array.isArray(animations)) return [];
  return animations.flatMap((animation) => {
    if (!ASSET_ID_PATTERN.test(animation?.id)) return [];
    try {
      return [
        {
          id: animation.id,
          ...validateAnimationMetadata(animation),
        },
      ];
    } catch {
      return [];
    }
  });
}

function sanitizeSourceBasename(value) {
  if (typeof value !== "string") return null;
  const base = value.trim();
  if (!base || base.length > 120) return null;
  if (/[/\\]/.test(base) || base === "." || base === "..") return null;
  return base;
}

function normalizeClipNameCandidate(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!ANIMATION_NAME_PATTERN.test(normalized)) {
    throw new Error(
      "Clip names must start with a letter and use lowercase letters, numbers, and hyphens.",
    );
  }
  return normalized;
}

function sanitizeAnimationClips(animationClips, knownAnimationIds, options = {}) {
  if (animationClips == null || typeof animationClips !== "object") return {};
  const purposeByAnimationId =
    options.purposeByAnimationId instanceof Map
      ? options.purposeByAnimationId
      : null;
  const sanitized = {};
  for (const [animationId, clips] of Object.entries(animationClips)) {
    if (!knownAnimationIds.has(animationId) || !Array.isArray(clips)) continue;
    const fallbackPurpose = purposeByAnimationId?.get(animationId) ?? ANIMATION_PURPOSE.LOOP;
    const valid = clips.flatMap((clip) => {
      if (!validStoredAsset(clip, ".vrma")) return [];
      try {
        const clip_name = singleLine(clip.clip_name, "Clip name", 64).toLowerCase();
        if (!ANIMATION_NAME_PATTERN.test(clip_name)) return [];
        const source_basename = sanitizeSourceBasename(clip.source_basename);
        return [
          {
            id: clip.id,
            stored_filename: clip.stored_filename,
            clip_name,
            purpose: normalizeAnimationPurpose(
              clip.purpose ?? fallbackPurpose,
            ),
            ...(source_basename ? { source_basename } : {}),
          },
        ];
      } catch {
        return [];
      }
    });
    if (valid.length > 0) sanitized[animationId] = valid;
  }
  return sanitized;
}

function nextClipName(animationName, existingNames) {
  let index = 1;
  while (existingNames.has(`${animationName}${index}`)) index += 1;
  const clipName = `${animationName}${index}`;
  existingNames.add(clipName);
  return clipName;
}

const CHARACTER_STATE_KEYS = Object.freeze([
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
]);

function sanitizeStateSlotBindings(raw) {
  const sanitized = {};
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return sanitized;
  }
  for (const state of CHARACTER_STATE_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(raw, state)) continue;
    const value = raw[state];
    if (value == null || value === "") {
      sanitized[state] = null;
      continue;
    }
    if (typeof value !== "string") continue;
    const name = value.trim().toLowerCase();
    if (!ANIMATION_NAME_PATTERN.test(name)) continue;
    sanitized[state] = name;
  }
  return sanitized;
}

module.exports = {
  ASSET_ID_PATTERN,
  CHARACTER_STATE_KEYS,
  DEFAULT_MODEL_LIGHTING,
  MODEL_LIGHTING_RANGES,
  completeModelLighting,
  defaultPurposeForAnimationType,
  nextClipName,
  normalizeAnimationPurpose,
  normalizeClipNameCandidate,
  roundedLightingNumber,
  sanitizeAnimationClips,
  sanitizeModelLighting,
  sanitizeModels,
  sanitizeSourceBasename,
  sanitizeStateSlotBindings,
  sanitizeUserAnimations,
  singleLine,
  validStoredAsset,
  validateAnimationMetadata,
};
