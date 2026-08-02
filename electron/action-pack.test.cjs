"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  ACTION_PACK_SCHEMA_VERSION,
  resolveActionNameForState,
  validateActionPack,
} = require("./action-pack.cjs");

const validPack = {
  schema_version: ACTION_PACK_SCHEMA_VERSION,
  name: "demo-pack",
  description: "Synthetic pack for tests",
  actions: [
    {
      animation_name: "idle-breathe",
      purpose: "loop",
      state_slot: "idle",
      files: ["idle.vrma"],
    },
    {
      animation_name: "work-nod",
      purpose: "one-shot",
      state_slot: "working",
      files: ["work.vrma"],
    },
    {
      animation_name: "success-pose",
      purpose: "pose",
      state_slot: "success",
      files: ["success.vrma"],
    },
  ],
};

test("validateActionPack accepts a thin valid pack", () => {
  const result = validateActionPack(validPack);
  assert.equal(result.ok, true);
  assert.equal(result.pack.actions.length, 3);
  assert.equal(result.pack.actions[0].purpose, "loop");
});

test("validateActionPack rejects path traversal and bad purpose", () => {
  const badPath = validateActionPack({
    ...validPack,
    actions: [
      {
        animation_name: "evil",
        purpose: "loop",
        files: ["../secret.vrma"],
      },
    ],
  });
  assert.equal(badPath.ok, false);
  assert.ok(badPath.errors.some((code) => code.includes("file")));

  const badPurpose = validateActionPack({
    ...validPack,
    actions: [
      {
        animation_name: "evil",
        purpose: "dance-forever",
        files: ["a.vrma"],
      },
    ],
  });
  assert.equal(badPurpose.ok, false);
});

test("validateActionPack rejects duplicate names and absolute-looking files", () => {
  const dup = validateActionPack({
    ...validPack,
    actions: [
      { animation_name: "wave", purpose: "one-shot", files: ["a.vrma"] },
      { animation_name: "wave", purpose: "one-shot", files: ["b.vrma"] },
    ],
  });
  assert.equal(dup.ok, false);
  assert.ok(dup.errors.some((code) => code.includes("duplicate")));
});

test("resolveActionNameForState maps slots and falls back to null", () => {
  const { pack } = validateActionPack(validPack);
  assert.equal(resolveActionNameForState(pack, "working"), "work-nod");
  assert.equal(resolveActionNameForState(pack, "failed"), null);
});
