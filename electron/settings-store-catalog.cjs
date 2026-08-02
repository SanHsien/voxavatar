"use strict";

/**
 * Settings catalog 變更（模型／動作／clip CRUD）。
 * 與偏好設定（locale、voice、lighting）分離，降低 settings-store 體積。
 */

const nodeCrypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { SYSTEM_ANIMATION_IDS } = require("./library-catalog.cjs");
const {
  defaultPurposeForAnimationType,
  nextClipName,
  singleLine,
  validateAnimationMetadata,
} = require("./settings-sanitize.cjs");
const {
  copyValidatedGlbFile,
  validateGlbFile,
} = require("./settings-asset-validation.cjs");

function removeStoredFile(directory, filename) {
  const target = path.join(directory, filename);
  if (fs.existsSync(target)) fs.unlinkSync(target);
}

function createCatalogMutations({
  getState,
  writeState,
  getSnapshot,
  availableModels,
  availableAnimations,
  modelDirectory,
  animationDirectory,
  packagedLibrary,
  maxCustomModels,
  maxCustomAnimations,
  maxCustomAnimationClips,
}) {
  function animationNameTaken(animationName, excludingId = null) {
    return availableAnimations().some(
      (animation) =>
        animation.id !== excludingId &&
        animation.animation_name === animationName,
    );
  }

  function uniqueModelName(desiredName) {
    const base = singleLine(desiredName, "Model name", 80);
    const existing = new Set(
      availableModels().map((model) => model.model_name.toLowerCase()),
    );
    if (!existing.has(base.toLowerCase())) return base;
    for (let index = 2; index < 10000; index += 1) {
      const suffix = `-${index}`;
      const truncated = base.slice(0, Math.max(1, 80 - suffix.length));
      const candidate = `${truncated}${suffix}`;
      if (!existing.has(candidate.toLowerCase())) return candidate;
    }
    throw new Error("Unable to allocate a unique model name.");
  }

  function importModel({ filePath, model_name, allowRename = false }) {
    const state = getState();
    if (state.models.length >= maxCustomModels) {
      throw new Error("VoxAvatar supports up to 50 custom models.");
    }
    const trimmedName =
      typeof model_name === "string" ? model_name.trim() : "";
    const fallbackName =
      path.basename(filePath, path.extname(filePath)) || "Model";
    let normalizedName = singleLine(
      trimmedName || fallbackName,
      "Model name",
      80,
    );
    const nameTaken = availableModels().some(
      (model) =>
        model.model_name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (nameTaken) {
      if (!allowRename) {
        throw new Error("A model with this name already exists.");
      }
      normalizedName = uniqueModelName(normalizedName);
    }
    const id = nodeCrypto.randomUUID();
    const stored_filename = `${id}.vrm`;
    copyValidatedGlbFile(
      filePath,
      path.join(modelDirectory, stored_filename),
      ".vrm",
    );
    state.models.push({ id, model_name: normalizedName, stored_filename });
    if (
      !availableModels().some(
        (model) => model.id === state.default_model_id,
      )
    ) {
      state.default_model_id = id;
    }
    writeState();
    return getSnapshot();
  }

  function importModelsFromPaths(filePaths, { model_name } = {}) {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error("No VRM files were selected.");
    }
    const results = [];
    let snapshot = getSnapshot();
    for (const filePath of filePaths) {
      try {
        const state = getState();
        if (state.models.length >= maxCustomModels) {
          results.push({
            filePath,
            ok: false,
            error: `VoxAvatar supports up to ${maxCustomModels} custom models.`,
            reason: "limit",
          });
          continue;
        }
        const useSharedName =
          typeof model_name === "string" &&
          model_name.trim() &&
          filePaths.length === 1;
        snapshot = importModel({
          filePath,
          model_name: useSharedName ? model_name.trim() : "",
          allowRename: true,
        });
        results.push({ filePath, ok: true, error: null, reason: null });
      } catch (error) {
        results.push({
          filePath,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          reason: "error",
        });
      }
    }
    return { snapshot, results };
  }

  function createAnimation(metadata) {
    const state = getState();
    if (state.animations.length >= maxCustomAnimations) {
      throw new Error("VoxAvatar supports up to 100 custom animation actions.");
    }
    const normalized = validateAnimationMetadata(metadata);
    if (animationNameTaken(normalized.animation_name)) {
      throw new Error("An animation action with this name already exists.");
    }
    state.animations.push({ id: nodeCrypto.randomUUID(), ...normalized });
    writeState();
    return getSnapshot();
  }

  function addAnimationClips(animationId, filePaths) {
    const state = getState();
    const animation = availableAnimations().find(
      (candidate) => candidate.id === animationId,
    );
    if (!animation) throw new Error("Animation action is not installed.");
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error("No VRMA files were selected.");
    }
    const clipCount = Object.values(state.animation_clips).reduce(
      (count, clips) => count + clips.length,
      0,
    );
    if (clipCount + filePaths.length > maxCustomAnimationClips) {
      throw new Error(
        `VoxAvatar supports up to ${maxCustomAnimationClips} uploaded animation clips.`,
      );
    }
    const existingNames = new Set(
      animation.clips.map((clip) => clip.animation_name),
    );
    const added = [];
    try {
      for (const filePath of filePaths) {
        const id = nodeCrypto.randomUUID();
        const stored_filename = `${id}.vrma`;
        copyValidatedGlbFile(
          filePath,
          path.join(animationDirectory, stored_filename),
          ".vrma",
        );
        added.push({
          id,
          stored_filename,
          clip_name: nextClipName(animation.animation_name, existingNames),
          purpose: defaultPurposeForAnimationType(animation.animation_type),
        });
      }
    } catch (error) {
      for (const clip of added) {
        removeStoredFile(animationDirectory, clip.stored_filename);
      }
      throw error;
    }
    state.animation_clips[animationId] = [
      ...(state.animation_clips[animationId] ?? []),
      ...added,
    ];
    writeState();
    return getSnapshot();
  }

  function addAnimationClipsBestEffort(animationId, filePaths) {
    const animation = availableAnimations().find(
      (candidate) => candidate.id === animationId,
    );
    if (!animation) throw new Error("Animation action is not installed.");
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      throw new Error("No VRMA files were selected.");
    }

    const results = [];
    const accepted = [];
    for (const filePath of filePaths) {
      const state = getState();
      const clipCount = Object.values(state.animation_clips).reduce(
        (count, clips) => count + clips.length,
        0,
      );
      if (clipCount + accepted.length >= maxCustomAnimationClips) {
        results.push({
          filePath,
          ok: false,
          error: `VoxAvatar supports up to ${maxCustomAnimationClips} uploaded animation clips.`,
          reason: "limit",
        });
        continue;
      }
      try {
        validateGlbFile(filePath, ".vrma");
        accepted.push(filePath);
        results.push({ filePath, ok: true, error: null, reason: null });
      } catch (error) {
        results.push({
          filePath,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          reason: "invalid",
        });
      }
    }

    let snapshot = getSnapshot();
    if (accepted.length > 0) {
      snapshot = addAnimationClips(animationId, accepted);
    }
    return { snapshot, results };
  }

  function updateAnimation(animationId, metadata) {
    const state = getState();
    const normalized = validateAnimationMetadata(metadata);
    if (animationNameTaken(normalized.animation_name, animationId)) {
      throw new Error("An animation action with this name already exists.");
    }

    const packaged = packagedLibrary.animations.find(
      (animation) => animation.id === animationId,
    );
    if (packaged) {
      if (SYSTEM_ANIMATION_IDS.has(animationId)) {
        throw new Error("Idle and Speaking are permanent system actions.");
      }
      if (state.hidden_packaged_animation_ids.includes(animationId)) {
        throw new Error("This packaged animation action is currently removed.");
      }
      const unchanged =
        normalized.animation_name === packaged.animation_name &&
        normalized.animation_description ===
          packaged.animation_description &&
        normalized.animation_trigger_scenario ===
          packaged.animation_trigger_scenario;
      if (unchanged) {
        delete state.packaged_animation_overrides[animationId];
      } else {
        state.packaged_animation_overrides[animationId] = normalized;
      }
      (state.animation_clips[animationId] ?? []).forEach((clip, index) => {
        clip.clip_name = `${normalized.animation_name}${
          packaged.asset_paths.length + index + 1
        }`;
      });
      writeState();
      return getSnapshot();
    }

    const userAnimation = state.animations.find(
      (animation) => animation.id === animationId,
    );
    if (!userAnimation) throw new Error("Animation action is not installed.");
    Object.assign(userAnimation, normalized);
    (state.animation_clips[animationId] ?? []).forEach((clip, index) => {
      clip.clip_name = `${normalized.animation_name}${index + 1}`;
    });
    writeState();
    return getSnapshot();
  }

  function deleteAnimationClip(animationId, clipId) {
    const state = getState();
    const clips = state.animation_clips[animationId] ?? [];
    const index = clips.findIndex((clip) => clip.id === clipId);
    if (index === -1) throw new Error("Uploaded animation clip was not found.");
    const [removed] = clips.splice(index, 1);
    removeStoredFile(animationDirectory, removed.stored_filename);
    if (clips.length === 0) delete state.animation_clips[animationId];
    writeState();
    return getSnapshot();
  }

  function reorderAnimationClip(animationId, clipId, direction) {
    const state = getState();
    if (direction !== "up" && direction !== "down") {
      throw new Error("Clip reorder direction must be 'up' or 'down'.");
    }
    const clips = state.animation_clips[animationId];
    if (!clips || clips.length === 0) {
      throw new Error("Uploaded animation clip was not found.");
    }
    const index = clips.findIndex((clip) => clip.id === clipId);
    if (index === -1) throw new Error("Uploaded animation clip was not found.");
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clips.length) {
      return getSnapshot();
    }
    const [moved] = clips.splice(index, 1);
    clips.splice(targetIndex, 0, moved);
    writeState();
    return getSnapshot();
  }

  function deleteAnimation(animationId) {
    const state = getState();
    if (SYSTEM_ANIMATION_IDS.has(animationId)) {
      throw new Error("Idle and Speaking cannot be removed.");
    }
    const packaged = packagedLibrary.animations.find(
      (animation) => animation.id === animationId,
    );
    if (packaged) {
      if (!state.hidden_packaged_animation_ids.includes(animationId)) {
        state.hidden_packaged_animation_ids.push(animationId);
      }
      delete state.packaged_animation_overrides[animationId];
      writeState();
      return getSnapshot();
    }

    const index = state.animations.findIndex(
      (animation) => animation.id === animationId,
    );
    if (index === -1) throw new Error("Animation action is not installed.");
    state.animations.splice(index, 1);
    for (const clip of state.animation_clips[animationId] ?? []) {
      removeStoredFile(animationDirectory, clip.stored_filename);
    }
    delete state.animation_clips[animationId];
    writeState();
    return getSnapshot();
  }

  function resetPackagedAnimations() {
    const state = getState();
    state.packaged_animation_overrides = {};
    state.hidden_packaged_animation_ids = [];
    for (const animation of packagedLibrary.animations) {
      (state.animation_clips[animation.id] ?? []).forEach((clip, index) => {
        clip.clip_name = `${animation.animation_name}${
          animation.asset_paths.length + index + 1
        }`;
      });
    }
    writeState();
    return getSnapshot();
  }

  function deleteModel(modelId) {
    const state = getState();
    const index = state.models.findIndex((model) => model.id === modelId);
    if (index === -1) {
      throw new Error("Packaged models cannot be deleted.");
    }
    const [removed] = state.models.splice(index, 1);
    removeStoredFile(modelDirectory, removed.stored_filename);
    if (state.default_model_id === modelId) {
      state.default_model_id =
        packagedLibrary.default_model_id ?? state.models[0]?.id ?? null;
    }
    delete state.model_lighting[modelId];
    writeState();
    return getSnapshot();
  }

  function deleteAllUserModels() {
    const state = getState();
    const removed = [...state.models];
    for (const model of removed) {
      removeStoredFile(modelDirectory, model.stored_filename);
      delete state.model_lighting[model.id];
    }
    state.models = [];
    state.default_model_id =
      packagedLibrary.default_model_id ??
      packagedLibrary.models[0]?.id ??
      null;
    writeState();
    return getSnapshot();
  }

  function deleteAllUserAnimationClips() {
    const state = getState();
    for (const clips of Object.values(state.animation_clips)) {
      for (const clip of clips) {
        removeStoredFile(animationDirectory, clip.stored_filename);
      }
    }
    state.animation_clips = {};
    writeState();
    return getSnapshot();
  }

  function setDefaultModel(modelId) {
    const state = getState();
    if (!availableModels().some((model) => model.id === modelId)) {
      throw new Error("Selected model is not installed.");
    }
    state.default_model_id = modelId;
    writeState();
    return getSnapshot();
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
    importModel,
    importModelsFromPaths,
    resetPackagedAnimations,
    reorderAnimationClip,
    setDefaultModel,
    updateAnimation,
  };
}

module.exports = {
  createCatalogMutations,
  removeStoredFile,
};
