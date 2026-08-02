"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  applyDefaultStateSlotBindings,
} = require("./state-slot-defaults.cjs");

test("applyDefaultStateSlotBindings fills system idle/speaking when playable", () => {
  const result = applyDefaultStateSlotBindings({}, [
    { animation_name: "idle", animation_type: "IDLE" },
    { animation_name: "speaking", animation_type: "TALK" },
  ]);
  assert.deepEqual(result, {
    idle: "idle",
    listening: "idle",
    speaking: "speaking",
  });
});

test("applyDefaultStateSlotBindings respects explicit null clears", () => {
  const result = applyDefaultStateSlotBindings(
    { idle: null },
    [{ animation_name: "idle", animation_type: "IDLE" }],
  );
  assert.equal(result.idle, null);
  assert.equal(result.listening, "idle");
});
