"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCharacterMessage,
} = require("./character-message.cjs");
const { createMessageRateLimiter } = require("./message-rate-limit.cjs");

test("normalizeCharacterMessage accepts short unicode and clamps duration", () => {
  const result = normalizeCharacterMessage({
    text: "  完成！✨  ",
    duration_ms: 99_000,
    mood: "cheerful",
  });
  assert.equal(result.ok, true);
  assert.equal(result.message.text, "完成！✨");
  assert.equal(result.message.durationMs, 15_000);
  assert.equal(result.message.mood, "cheerful");
});

test("normalizeCharacterMessage rejects empty and overlong text", () => {
  assert.equal(normalizeCharacterMessage({ text: "   " }).ok, false);
  assert.equal(normalizeCharacterMessage({ text: "字".repeat(81) }).ok, false);
});

test("message rate limiter enforces per-session and global caps", () => {
  let now = 1000;
  const limiter = createMessageRateLimiter({
    perSessionMax: 2,
    perSessionWindowMs: 10_000,
    globalMax: 3,
    globalWindowMs: 10_000,
    now: () => now,
  });
  assert.equal(limiter.allow("a").ok, true);
  assert.equal(limiter.allow("a").ok, true);
  assert.equal(limiter.allow("a").ok, false);
  assert.equal(limiter.allow("b").ok, true);
  assert.equal(limiter.allow("c").ok, false);
  now = 20_000;
  assert.equal(limiter.allow("a").ok, true);
});
