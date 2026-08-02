"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CHARACTER_STATE_KEYS,
  sanitizeStateSlotBindings,
} = require("./settings-sanitize.cjs");

test("sanitizeStateSlotBindings returns empty object for non-objects", () => {
  assert.deepEqual(sanitizeStateSlotBindings(null), {});
  assert.deepEqual(sanitizeStateSlotBindings(undefined), {});
  assert.deepEqual(sanitizeStateSlotBindings([]), {});
  assert.deepEqual(sanitizeStateSlotBindings("idle"), {});
});

test("sanitizeStateSlotBindings keeps null and valid animation names", () => {
  const sanitized = sanitizeStateSlotBindings({
    idle: "idle-loop",
    listening: null,
    speaking: "",
    working: "Working-Task",
    reviewing: "bad name!",
    success: 12,
    failed: "ok-fail",
    unknown: "ignored",
  });
  assert.deepEqual(Object.keys(sanitized).sort(), [
    "failed",
    "idle",
    "listening",
    "speaking",
    "working",
  ]);
  assert.equal(sanitized.idle, "idle-loop");
  assert.equal(sanitized.listening, null);
  assert.equal(sanitized.speaking, null);
  assert.equal(sanitized.working, "working-task");
  assert.equal(sanitized.failed, "ok-fail");
  assert.equal(sanitized.reviewing, undefined);
  assert.equal(sanitized.success, undefined);
});

test("CHARACTER_STATE_KEYS lists the seven presentation states", () => {
  assert.deepEqual([...CHARACTER_STATE_KEYS], [
    "idle",
    "listening",
    "speaking",
    "working",
    "reviewing",
    "success",
    "failed",
  ]);
});
