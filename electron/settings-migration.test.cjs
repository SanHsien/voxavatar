"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  DEFAULT_IDLE_REST_MS,
  MAX_IDLE_REST_MS,
  MIN_IDLE_REST_MS,
  SETTINGS_SCHEMA_VERSION,
  migrateLegacyAnimations,
  normalizeIdleRestMs,
  safeReadState,
} = require("./settings-migration.cjs");

const packagedLibrary = {
  default_model_id: null,
  models: [],
  animations: [
    {
      id: "packaged-idle",
      animation_name: "idle",
      animation_type: "IDLE",
    },
  ],
};

test("normalizeIdleRestMs clamps and defaults", () => {
  assert.equal(normalizeIdleRestMs(undefined), DEFAULT_IDLE_REST_MS);
  assert.equal(normalizeIdleRestMs("nope"), DEFAULT_IDLE_REST_MS);
  assert.equal(normalizeIdleRestMs(100), MIN_IDLE_REST_MS);
  assert.equal(normalizeIdleRestMs(999999), MAX_IDLE_REST_MS);
  assert.equal(normalizeIdleRestMs(4500.6), 4501);
});

test("migrateLegacyAnimations returns user animations and clip map", () => {
  const clipId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const migrated = migrateLegacyAnimations(
    [
      {
        id: clipId,
        stored_filename: `${clipId}.vrma`,
        animation_name: "wave-hello",
        animation_description: "Wave",
        animation_trigger_scenario: "Greet",
      },
      {
        id: "bad",
        stored_filename: "bad.vrma",
        animation_name: "nope",
        animation_description: "x",
        animation_trigger_scenario: "y",
      },
    ],
    packagedLibrary,
  );
  assert.equal(migrated.userAnimations.length, 1);
  assert.equal(migrated.userAnimations[0].animation_name, "wave-hello");
  assert.ok(migrated.animationClips[clipId]);
  assert.equal(migrated.animationClips[clipId].length, 1);
});

test("safeReadState falls back on unsupported schema and backs up file", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-migration-"));
  const settingsPath = path.join(dir, "settings.json");
  fs.writeFileSync(
    settingsPath,
    JSON.stringify({ schema_version: 99, models: [] }),
    "utf8",
  );
  const result = safeReadState(settingsPath, packagedLibrary);
  assert.equal(result.migrated, false);
  assert.equal(result.migration_error, "unsupported_schema");
  assert.equal(result.state.schema_version, SETTINGS_SCHEMA_VERSION);
  assert.ok(fs.existsSync(`${settingsPath}.unmigratable-backup`));
  fs.rmSync(dir, { recursive: true, force: true });
});

test("safeReadState loads a current schema snapshot", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-migration-"));
  const settingsPath = path.join(dir, "settings.json");
  fs.writeFileSync(
    settingsPath,
    JSON.stringify({
      schema_version: SETTINGS_SCHEMA_VERSION,
      models: [],
      animations: [],
      animation_clips: {},
      unassigned_clips: [],
      voice_source: { mode: "external" },
      idle_rest_ms: 5000,
      state_slot_bindings: { idle: "idle" },
    }),
    "utf8",
  );
  const result = safeReadState(settingsPath, packagedLibrary);
  assert.equal(result.state.idle_rest_ms, 5000);
  assert.equal(result.state.voice_source.mode, "external");
  assert.equal(result.state.state_slot_bindings.idle, "idle");
  fs.rmSync(dir, { recursive: true, force: true });
});
