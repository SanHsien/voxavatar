"use strict";

/**
 * 角色狀態正規化（main／MCP 用 CJS 鏡像）。
 * 契約與 src/character-state.ts 的 normalizeExternalStateEvent 對齊。
 */

const CHARACTER_STATES = Object.freeze([
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
]);

const EXTERNAL_SOURCE_KINDS = new Set([
  "user",
  "system",
  "mcp",
  "integration",
]);

const DEFAULT_TTL_MS = Object.freeze({
  idle: 0,
  listening: 30_000,
  speaking: 8_000,
  working: 120_000,
  reviewing: 120_000,
  success: 4_000,
  failed: 5_000,
});

const MAX_SOURCE_ID_LENGTH = 64;
const MAX_TTL_MS = 600_000;

function isCharacterState(value) {
  return CHARACTER_STATES.includes(value);
}

function defaultTtlForState(state) {
  return DEFAULT_TTL_MS[state] ?? 0;
}

function normalizeExternalStateEvent(input, nowMs) {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "invalid_payload" };
  }
  if (!isCharacterState(input.state)) {
    return { ok: false, error: "invalid_state" };
  }
  if (
    typeof input.sourceKind !== "string" ||
    !EXTERNAL_SOURCE_KINDS.has(input.sourceKind)
  ) {
    return { ok: false, error: "invalid_source_kind" };
  }
  const sourceKind = input.sourceKind;
  let sourceId;
  if (input.sourceId != null) {
    if (typeof input.sourceId !== "string" || !input.sourceId.trim()) {
      return { ok: false, error: "invalid_source_id" };
    }
    sourceId = input.sourceId.trim().slice(0, MAX_SOURCE_ID_LENGTH);
  }
  let ttlMs;
  if (input.ttlMs != null) {
    const raw = Number(input.ttlMs);
    if (!Number.isFinite(raw) || raw < 0) {
      return { ok: false, error: "invalid_ttl" };
    }
    ttlMs = Math.min(MAX_TTL_MS, Math.round(raw));
  }
  const id =
    typeof input.id === "string" && input.id.trim()
      ? input.id.trim().slice(0, 64)
      : `${sourceKind}-${nowMs}`;
  const atMs =
    typeof input.atMs === "number" && Number.isFinite(input.atMs)
      ? Math.round(input.atMs)
      : nowMs;

  return {
    ok: true,
    event: {
      id,
      state: input.state,
      sourceKind,
      sourceId,
      atMs,
      ttlMs,
    },
  };
}

module.exports = {
  CHARACTER_STATES,
  DEFAULT_TTL_MS,
  defaultTtlForState,
  isCharacterState,
  normalizeExternalStateEvent,
};
