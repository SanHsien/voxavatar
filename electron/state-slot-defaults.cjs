"use strict";

/**
 * 系統狀態動作槽預設綁定（CJS；與 src/state-slot-defaults.ts 對齊）。
 * 只填尚未出現在 bindings 的鍵；明確 null 不覆寫。
 */

const STATE_KEYS = Object.freeze([
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
]);

function playableNameSet(playable) {
  return new Set(
    (Array.isArray(playable) ? playable : [])
      .map((entry) =>
        typeof entry?.animation_name === "string"
          ? entry.animation_name.trim().toLowerCase()
          : "",
      )
      .filter(Boolean),
  );
}

function firstOfType(playable, type) {
  const match = (Array.isArray(playable) ? playable : []).find(
    (entry) =>
      entry?.animation_type === type &&
      typeof entry.animation_name === "string" &&
      entry.animation_name.trim(),
  );
  return match ? match.animation_name.trim().toLowerCase() : null;
}

function pickPreferred(names, preferred, fallback) {
  if (preferred && names.has(preferred)) return preferred;
  if (fallback && names.has(fallback)) return fallback;
  return null;
}

function applyDefaultStateSlotBindings(existing, playable) {
  const current =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...existing }
      : {};
  const names = playableNameSet(playable);
  if (names.size === 0) return current;

  const idleFallback = firstOfType(playable, "IDLE");
  const talkFallback = firstOfType(playable, "TALK");
  const suggestions = {
    idle: pickPreferred(names, "idle", idleFallback),
    listening: pickPreferred(names, "idle", idleFallback),
    speaking: pickPreferred(names, "speaking", talkFallback),
    working: names.has("working") ? "working" : null,
    reviewing: names.has("reviewing") ? "reviewing" : null,
    success: names.has("success") ? "success" : null,
    failed: names.has("failed") ? "failed" : null,
  };

  for (const state of STATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(current, state)) continue;
    const suggested = suggestions[state];
    if (suggested) current[state] = suggested;
  }
  return current;
}

module.exports = {
  applyDefaultStateSlotBindings,
};
