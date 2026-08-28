"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  bindingsFromActionPackActions,
  validateActionPack,
} = require("./action-pack.cjs");
const { importActionPackFromPath } = require("./action-pack-import.cjs");

test("bindingsFromActionPackActions keeps first slot winner", () => {
  const bindings = bindingsFromActionPackActions([
    { animation_name: "a", state_slot: "success" },
    { animation_name: "b", state_slot: "success" },
    { animation_name: "c", state_slot: "working" },
  ]);
  assert.deepEqual(bindings, { success: "a", working: "c" });
});

test("importActionPackFromPath creates actions and merges bindings without files", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-pack-"));
  const packPath = path.join(root, "demo.action-pack.json");
  const pack = {
    schema_version: 1,
    name: "demo-pack",
    actions: [
      {
        animation_name: "work-nod",
        purpose: "one-shot",
        state_slot: "working",
        files: [],
        animation_description: "Work nod",
        animation_trigger_scenario: "When working",
      },
    ],
  };
  assert.equal(validateActionPack(pack).ok, true);
  fs.writeFileSync(packPath, JSON.stringify(pack));

  const animations = [];
  const store = {
    getSnapshot() {
      return {
        animations: animations.map((item) => ({ ...item, asset_urls: [] })),
        state_slot_bindings: {},
      };
    },
    createAnimation(metadata) {
      const id = `anim-${animations.length + 1}`;
      animations.push({ id, ...metadata, asset_urls: [] });
      return this.getSnapshot();
    },
    addAnimationClipsBestEffort() {
      throw new Error("should not be called without files");
    },
    setStateSlotBindings(bindings) {
      this._bindings = bindings;
      return {
        ...this.getSnapshot(),
        state_slot_bindings: bindings,
      };
    },
  };

  const result = importActionPackFromPath({
    packPath,
    settingsStore: store,
  });
  assert.equal(result.pack_name, "demo-pack");
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].created, true);
  assert.equal(result.results[0].clips_imported, 0);
  assert.deepEqual(result.bindings, { working: "work-nod" });
  assert.deepEqual(store._bindings, { working: "work-nod" });
});

test("importActionPackFromPath passes pack purpose into addAnimationClipsBestEffort", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-pack-"));
  const packPath = path.join(root, "purpose.action-pack.json");
  const clipPath = path.join(root, "work-nod.vrma");
  fs.writeFileSync(clipPath, "fake");
  fs.writeFileSync(
    packPath,
    JSON.stringify({
      schema_version: 1,
      name: "purpose-pack",
      actions: [
        {
          animation_name: "work-nod",
          purpose: "pose",
          state_slot: "working",
          files: ["work-nod.vrma"],
        },
      ],
    }),
  );

  const animations = [];
  let seenOptions = null;
  const store = {
    getSnapshot() {
      return {
        animations: animations.map((item) => ({ ...item, asset_urls: [] })),
        state_slot_bindings: {},
      };
    },
    createAnimation(metadata) {
      const id = `anim-${animations.length + 1}`;
      animations.push({ id, ...metadata, asset_urls: [] });
      return this.getSnapshot();
    },
    addAnimationClipsBestEffort(animationId, filePaths, options) {
      seenOptions = options;
      assert.equal(animationId, "anim-1");
      assert.equal(filePaths.length, 1);
      return {
        snapshot: this.getSnapshot(),
        results: filePaths.map((filePath) => ({
          filePath,
          ok: true,
          error: null,
          reason: null,
        })),
      };
    },
    setStateSlotBindings(bindings) {
      return {
        ...this.getSnapshot(),
        state_slot_bindings: bindings,
      };
    },
  };

  const result = importActionPackFromPath({
    packPath,
    settingsStore: store,
  });
  assert.equal(result.results[0].clips_imported, 1);
  assert.deepEqual(seenOptions, { purpose: "pose" });
});
