"use strict";

/**
 * 薄 action-pack.json 契約驗證。
 * 只描述名稱、用途、狀態槽與相對檔名；不能繞過匯入／授權／路徑 gate。
 */

const {
  ANIMATION_PURPOSE,
  normalizeAnimationPurpose,
} = require("./vrma-quality.cjs");

const ACTION_PACK_SCHEMA_VERSION = 1;
const ACTION_NAME_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RELATIVE_VRMA_PATTERN = /^[a-zA-Z0-9._-]+\.vrma$/i;
const CHARACTER_STATES = Object.freeze([
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
]);

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function validateActionPack(raw) {
  const errors = [];
  if (!isPlainObject(raw)) {
    return {
      ok: false,
      errors: ["action_pack_must_be_object"],
      pack: null,
    };
  }
  if (raw.schema_version !== ACTION_PACK_SCHEMA_VERSION) {
    errors.push("unsupported_schema_version");
  }
  if (typeof raw.name !== "string" || !raw.name.trim()) {
    errors.push("name_required");
  } else if (raw.name.trim().length > 64) {
    errors.push("name_too_long");
  }
  if (raw.description != null) {
    if (typeof raw.description !== "string") {
      errors.push("description_invalid");
    } else if (raw.description.length > 240) {
      errors.push("description_too_long");
    }
  }
  if (!Array.isArray(raw.actions)) {
    errors.push("actions_required");
    return { ok: false, errors, pack: null };
  }
  if (raw.actions.length === 0) {
    errors.push("actions_empty");
  }
  if (raw.actions.length > 64) {
    errors.push("actions_too_many");
  }

  const seenNames = new Set();
  const actions = [];
  for (const [index, action] of raw.actions.entries()) {
    if (!isPlainObject(action)) {
      errors.push(`action_${index}_invalid`);
      continue;
    }
    const animationName =
      typeof action.animation_name === "string"
        ? action.animation_name.trim().toLowerCase()
        : "";
    if (!ACTION_NAME_PATTERN.test(animationName)) {
      errors.push(`action_${index}_animation_name_invalid`);
      continue;
    }
    if (seenNames.has(animationName)) {
      errors.push(`action_${index}_animation_name_duplicate`);
      continue;
    }
    seenNames.add(animationName);

    const purposeRaw = action.purpose;
    if (
      purposeRaw != null &&
      purposeRaw !== ANIMATION_PURPOSE.LOOP &&
      purposeRaw !== ANIMATION_PURPOSE.ONE_SHOT &&
      purposeRaw !== ANIMATION_PURPOSE.POSE
    ) {
      errors.push(`action_${index}_purpose_invalid`);
      continue;
    }
    const purpose = normalizeAnimationPurpose(purposeRaw);

    let stateSlot = null;
    if (action.state_slot != null) {
      if (!CHARACTER_STATES.includes(action.state_slot)) {
        errors.push(`action_${index}_state_slot_invalid`);
      } else {
        stateSlot = action.state_slot;
      }
    }

    const files = [];
    if (action.files != null) {
      if (!Array.isArray(action.files)) {
        errors.push(`action_${index}_files_invalid`);
      } else {
        for (const file of action.files) {
          if (typeof file !== "string" || !RELATIVE_VRMA_PATTERN.test(file)) {
            errors.push(`action_${index}_file_invalid`);
            continue;
          }
          if (file.includes("/") || file.includes("\\") || file.includes("..")) {
            errors.push(`action_${index}_file_path_not_allowed`);
            continue;
          }
          files.push(file);
        }
      }
    }

    actions.push({
      animation_name: animationName,
      purpose,
      state_slot: stateSlot,
      files,
      animation_description:
        typeof action.animation_description === "string"
          ? action.animation_description.trim().slice(0, 240)
          : "",
      animation_trigger_scenario:
        typeof action.animation_trigger_scenario === "string"
          ? action.animation_trigger_scenario.trim().slice(0, 240)
          : "",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors, pack: null };
  }

  return {
    ok: true,
    errors: [],
    pack: {
      schema_version: ACTION_PACK_SCHEMA_VERSION,
      name: String(raw.name).trim().slice(0, 64),
      description:
        typeof raw.description === "string"
          ? raw.description.trim().slice(0, 240)
          : "",
      actions,
    },
  };
}

/**
 * 依狀態槽挑選 action-pack 動作名稱；缺槽時回傳 null（呼叫端 fallback Idle）。
 */
function resolveActionNameForState(pack, state) {
  if (!pack || !Array.isArray(pack.actions)) return null;
  const match = pack.actions.find((action) => action.state_slot === state);
  return match?.animation_name ?? null;
}

module.exports = {
  ACTION_NAME_PATTERN,
  ACTION_PACK_SCHEMA_VERSION,
  CHARACTER_STATES,
  RELATIVE_VRMA_PATTERN,
  resolveActionNameForState,
  validateActionPack,
};
