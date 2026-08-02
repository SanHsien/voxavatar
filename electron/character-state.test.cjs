"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  normalizeExternalStateEvent,
  isCharacterState,
  defaultTtlForState,
} = require("./character-state.cjs");

test("normalizeExternalStateEvent accepts mcp working state", () => {
  const result = normalizeExternalStateEvent(
    {
      state: "working",
      sourceKind: "mcp",
      sourceId: "session-1",
      ttlMs: 5000,
    },
    1_000,
  );
  assert.equal(result.ok, true);
  assert.equal(result.event.state, "working");
  assert.equal(result.event.sourceKind, "mcp");
  assert.equal(result.event.sourceId, "session-1");
  assert.equal(result.event.ttlMs, 5000);
});

test("normalizeExternalStateEvent rejects voice sourceKind and unknown state", () => {
  assert.equal(
    normalizeExternalStateEvent(
      { state: "speaking", sourceKind: "voice" },
      1,
    ).ok,
    false,
  );
  assert.equal(
    normalizeExternalStateEvent(
      { state: "happy", sourceKind: "mcp" },
      1,
    ).error,
    "invalid_state",
  );
});

test("isCharacterState and default TTL cover the fixed set", () => {
  assert.equal(isCharacterState("success"), true);
  assert.equal(isCharacterState("nope"), false);
  assert.equal(defaultTtlForState("failed"), 5_000);
  assert.equal(defaultTtlForState("idle"), 0);
});
