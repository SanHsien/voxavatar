"use strict";

/**
 * 漫畫氣泡訊息清理（main／MCP 共用）。
 * 與 src/character-message.ts 契約對齊；不解析 HTML／Markdown。
 */

const MESSAGE_MAX_GRAPHEMES = 80;
const MESSAGE_MIN_DURATION_MS = 1000;
const MESSAGE_MAX_DURATION_MS = 15_000;
const MESSAGE_DEFAULT_DURATION_MS = 4000;
const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
  "g",
);

function isMood(value) {
  return (
    value === "neutral" ||
    value === "cheerful" ||
    value === "thinking" ||
    value === "warning"
  );
}

function countGraphemes(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return [...segmenter.segment(text)].length;
  }
  return [...text].length;
}

function normalizeCharacterMessage(input = {}) {
  if (typeof input.text !== "string") {
    return { ok: false, reason: "text_required" };
  }
  const cleaned = input.text.replace(CONTROL_CHARS, "").normalize("NFC").trim();
  if (!cleaned) {
    return { ok: false, reason: "empty_text" };
  }
  if (countGraphemes(cleaned) > MESSAGE_MAX_GRAPHEMES) {
    return { ok: false, reason: "too_long" };
  }

  let durationMs = MESSAGE_DEFAULT_DURATION_MS;
  if (input.duration_ms != null || input.durationMs != null) {
    const raw = Number(input.duration_ms ?? input.durationMs);
    if (!Number.isFinite(raw)) {
      return { ok: false, reason: "invalid_duration" };
    }
    durationMs = Math.round(
      Math.max(MESSAGE_MIN_DURATION_MS, Math.min(MESSAGE_MAX_DURATION_MS, raw)),
    );
  }

  const mood = isMood(input.mood) ? input.mood : "neutral";
  return {
    ok: true,
    message: {
      text: cleaned,
      durationMs,
      mood,
    },
  };
}

module.exports = {
  MESSAGE_DEFAULT_DURATION_MS,
  MESSAGE_MAX_DURATION_MS,
  MESSAGE_MAX_GRAPHEMES,
  MESSAGE_MIN_DURATION_MS,
  countGraphemes,
  normalizeCharacterMessage,
};
