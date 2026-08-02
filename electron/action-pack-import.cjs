"use strict";

/**
 * 匯入 action-pack.json：驗證契約後，透過既有 catalog／GLB gate 建立動作與片段。
 * 不得直接寫入 assets 或繞過 validateGlbFile／addAnimationClips。
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  validateActionPack,
  bindingsFromActionPackActions,
} = require("./action-pack.cjs");
const { sanitizeStateSlotBindings } = require("./settings-sanitize.cjs");

/**
 * @param {object} options
 * @param {string} options.packPath absolute path to action-pack.json
 * @param {object} options.settingsStore settings store with createAnimation／addAnimationClipsBestEffort／getSnapshot／setStateSlotBindings
 * @param {boolean} [options.mergeBindings=true] merge pack state_slot into existing bindings
 */
function importActionPackFromPath({
  packPath,
  settingsStore,
  mergeBindings = true,
}) {
  if (typeof packPath !== "string" || !packPath.trim()) {
    throw new Error("action_pack_path_required");
  }
  const resolvedPack = path.resolve(packPath);
  if (!fs.existsSync(resolvedPack)) {
    throw new Error("action_pack_not_found");
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(resolvedPack, "utf8"));
  } catch {
    throw new Error("action_pack_invalid_json");
  }
  const validated = validateActionPack(raw);
  if (!validated.ok || !validated.pack) {
    const error = new Error("action_pack_invalid");
    error.details = validated.errors;
    throw error;
  }

  const packDir = path.dirname(resolvedPack);
  const pack = validated.pack;
  const results = [];
  let snapshot = settingsStore.getSnapshot();

  for (const action of pack.actions) {
    const existing = snapshot.animations.find(
      (candidate) => candidate.animation_name === action.animation_name,
    );
    let animationId = existing?.id ?? null;
    if (!animationId) {
      try {
        snapshot = settingsStore.createAnimation({
          animation_name: action.animation_name,
          animation_description:
            action.animation_description || action.animation_name,
          animation_trigger_scenario:
            action.animation_trigger_scenario ||
            `action-pack:${pack.name}`,
        });
        animationId = snapshot.animations.find(
          (candidate) => candidate.animation_name === action.animation_name,
        )?.id;
        results.push({
          animation_name: action.animation_name,
          created: true,
          clips_imported: 0,
          clip_results: [],
          error: null,
        });
      } catch (error) {
        results.push({
          animation_name: action.animation_name,
          created: false,
          clips_imported: 0,
          clip_results: [],
          error: error instanceof Error ? error.message : String(error),
        });
        continue;
      }
    } else {
      results.push({
        animation_name: action.animation_name,
        created: false,
        clips_imported: 0,
        clip_results: [],
        error: null,
      });
    }

    if (!animationId) continue;
    const filePaths = [];
    for (const fileName of action.files ?? []) {
      const absolute = path.join(packDir, fileName);
      if (!fs.existsSync(absolute)) {
        results[results.length - 1].clip_results.push({
          file: fileName,
          ok: false,
          error: "file_not_found",
        });
        continue;
      }
      filePaths.push(absolute);
    }
    if (filePaths.length === 0) continue;

    try {
      const batch = settingsStore.addAnimationClipsBestEffort(
        animationId,
        filePaths,
      );
      snapshot = batch.snapshot;
      const imported = batch.results.filter((item) => item.ok).length;
      results[results.length - 1].clips_imported = imported;
      results[results.length - 1].clip_results = batch.results.map((item) => ({
        file: path.basename(item.filePath),
        ok: item.ok,
        error: item.error,
      }));
    } catch (error) {
      results[results.length - 1].error =
        error instanceof Error ? error.message : String(error);
    }
  }

  const packBindings = sanitizeStateSlotBindings(
    bindingsFromActionPackActions(pack.actions),
  );
  if (mergeBindings && Object.keys(packBindings).length > 0) {
    const merged = {
      ...sanitizeStateSlotBindings(snapshot.state_slot_bindings),
      ...packBindings,
    };
    snapshot = settingsStore.setStateSlotBindings(merged);
  }

  return {
    snapshot,
    pack_name: pack.name,
    results,
    bindings: packBindings,
  };
}

module.exports = {
  importActionPackFromPath,
};
