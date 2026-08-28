"use strict";

/**
 * 依檔名白名單建議 VRMA → 既有動作（CJS；與 src/vrma-assignment-suggest.ts 對齊）。
 * 不推斷情緒／聊天／音訊；不明確回 null，須確認後才寫入。
 */

const STATE_SLOT_HINTS = Object.freeze([
  {
    slot: "idle",
    patterns: [
      /^idle([\W_]|$)/i,
      /^wait([\W_]|$)/i,
      /^rest([\W_]|$)/i,
      /^breath/i,
      /(^|[\W_])idle([\W_]|$)/i,
    ],
    preferredNames: Object.freeze(["idle"]),
    preferredTypes: Object.freeze(["IDLE"]),
  },
  {
    slot: "speaking",
    patterns: [
      /^speak/i,
      /^talk/i,
      /^lip/i,
      /(^|[\W_])(speak|talk|speaking)([\W_]|$)/i,
    ],
    preferredNames: Object.freeze(["speaking", "talk"]),
    preferredTypes: Object.freeze(["TALK"]),
  },
  {
    slot: "working",
    patterns: [/^work/i, /(^|[\W_])work(ing)?([\W_]|$)/i, /^nod/i],
    preferredNames: Object.freeze(["working", "work-nod"]),
    preferredTypes: Object.freeze([]),
  },
  {
    slot: "reviewing",
    patterns: [/^review/i, /(^|[\W_])review(ing)?([\W_]|$)/i],
    preferredNames: Object.freeze(["reviewing"]),
    preferredTypes: Object.freeze([]),
  },
  {
    slot: "success",
    patterns: [/^success/i, /^cheer/i, /(^|[\W_])success([\W_]|$)/i],
    preferredNames: Object.freeze(["success"]),
    preferredTypes: Object.freeze([]),
  },
  {
    slot: "failed",
    patterns: [/^fail/i, /^error/i, /(^|[\W_])(fail|failed|error)([\W_]|$)/i],
    preferredNames: Object.freeze(["failed", "fail"]),
    preferredTypes: Object.freeze([]),
  },
]);

function stripExtension(filename) {
  const base = String(filename ?? "")
    .replace(/^.*[/\\]/, "")
    .trim();
  return base.replace(/\.vrma$/i, "");
}

function normalizeStem(stem) {
  return String(stem ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function findByName(animations, name) {
  const needle = String(name ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return null;
  const list = Array.isArray(animations) ? animations : [];
  return (
    list.find(
      (entry) =>
        typeof entry?.animation_name === "string" &&
        entry.animation_name.trim().toLowerCase() === needle,
    ) ?? null
  );
}

function findByType(animations, type) {
  const list = Array.isArray(animations) ? animations : [];
  return list.find((entry) => entry?.animation_type === type) ?? null;
}

function matchNamePrefix(stem, animations) {
  const normalized = normalizeStem(stem);
  const list = Array.isArray(animations) ? animations : [];
  let best = null;
  let bestLen = 0;
  for (const animation of list) {
    if (typeof animation?.animation_name !== "string") continue;
    const name = animation.animation_name.trim().toLowerCase();
    if (!name || name.length < 2) continue;
    if (
      normalized === name ||
      normalized.startsWith(`${name}-`) ||
      normalized.startsWith(`${name}_`)
    ) {
      if (name.length > bestLen) {
        best = animation;
        bestLen = name.length;
      }
    }
  }
  return best;
}

function suggestVrmaAssignment(filename, animations) {
  const basename =
    String(filename ?? "")
      .replace(/^.*[/\\]/, "")
      .trim() || String(filename ?? "");
  const stem = stripExtension(basename);
  const normalized = normalizeStem(stem);

  if (!normalized) {
    return {
      basename,
      stem,
      matchKind: "none",
      animationId: null,
      animationName: null,
      stateSlotHint: null,
      reason: "empty_stem",
    };
  }

  const exact = findByName(animations, normalized);
  if (exact) {
    return {
      basename,
      stem,
      matchKind: "exact_name",
      animationId: exact.id,
      animationName: exact.animation_name,
      stateSlotHint: null,
      reason: "exact_animation_name",
    };
  }

  const prefix = matchNamePrefix(stem, animations);
  if (prefix) {
    return {
      basename,
      stem,
      matchKind: "name_prefix",
      animationId: prefix.id,
      animationName: prefix.animation_name,
      stateSlotHint: null,
      reason: "animation_name_prefix",
    };
  }

  for (const rule of STATE_SLOT_HINTS) {
    if (!rule.patterns.some((pattern) => pattern.test(normalized))) continue;
    let target = null;
    for (const preferred of rule.preferredNames) {
      target = findByName(animations, preferred);
      if (target) break;
    }
    if (!target) {
      for (const type of rule.preferredTypes) {
        target = findByType(animations, type);
        if (target) break;
      }
    }
    if (!target) {
      return {
        basename,
        stem,
        matchKind: "none",
        animationId: null,
        animationName: null,
        stateSlotHint: rule.slot,
        reason: `whitelist_${rule.slot}_no_target`,
      };
    }
    return {
      basename,
      stem,
      matchKind: "whitelist_slot",
      animationId: target.id,
      animationName: target.animation_name,
      stateSlotHint: rule.slot,
      reason: `whitelist_${rule.slot}`,
    };
  }

  return {
    basename,
    stem,
    matchKind: "none",
    animationId: null,
    animationName: null,
    stateSlotHint: null,
    reason: "no_whitelist_match",
  };
}

function suggestVrmaAssignments(filenames, animations) {
  return (Array.isArray(filenames) ? filenames : []).map((filename) =>
    suggestVrmaAssignment(filename, animations),
  );
}

function assignableVrmaSuggestions(suggestions) {
  return (Array.isArray(suggestions) ? suggestions : []).filter(
    (item) =>
      typeof item?.animationId === "string" && item.animationId.length > 0,
  );
}

module.exports = {
  suggestVrmaAssignment,
  suggestVrmaAssignments,
  assignableVrmaSuggestions,
};
