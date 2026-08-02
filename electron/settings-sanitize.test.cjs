"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CHARACTER_STATE_KEYS,
  DEFAULT_MODEL_LIGHTING,
  normalizeClipNameCandidate,
  sanitizeAnimationClips,
  sanitizeModels,
  sanitizeModelLighting,
  sanitizeStateSlotBindings,
  sanitizeUnassignedClips,
  sanitizeUserAnimations,
  validStoredAsset,
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

test("sanitizeModels drops invalid stored assets", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const models = sanitizeModels([
    { id, stored_filename: `${id}.vrm`, model_name: "Ok" },
    { id: "bad", stored_filename: "bad.vrm", model_name: "Nope" },
    { id, stored_filename: `${id}.vrma`, model_name: "WrongExt" },
  ]);
  assert.equal(models.length, 1);
  assert.equal(models[0].model_name, "Ok");
});

test("sanitizeUserAnimations keeps valid metadata only", () => {
  const id = "22222222-2222-4222-8222-222222222222";
  const animations = sanitizeUserAnimations([
    {
      id,
      animation_name: "wave-hello",
      animation_description: "Wave",
      animation_trigger_scenario: "Greeting",
    },
    {
      id: "nope",
      animation_name: "Bad Name",
      animation_description: "x",
      animation_trigger_scenario: "y",
    },
  ]);
  assert.equal(animations.length, 1);
  assert.equal(animations[0].animation_name, "wave-hello");
});

test("sanitizeAnimationClips and unassigned clips filter invalid records", () => {
  const animId = "33333333-3333-4333-8333-333333333333";
  const clipId = "44444444-4444-4444-8444-444444444444";
  const known = new Set([animId]);
  const clips = sanitizeAnimationClips(
    {
      [animId]: [
        {
          id: clipId,
          clip_name: "wave1",
          stored_filename: "wave1--44444444.vrma",
          source_basename: "wave.vrma",
          purpose: "loop",
        },
        { id: "bad", clip_name: "x", stored_filename: "x.vrma" },
      ],
      unknown: [{ id: clipId }],
    },
    known,
  );
  assert.equal(clips[animId].length, 1);
  assert.equal(clips.unknown, undefined);

  const pool = sanitizeUnassignedClips([
    {
      id: clipId,
      clip_name: "pool1",
      stored_filename: "pool1--44444444.vrma",
      source_basename: "pool.vrma",
      purpose: "one-shot",
    },
    null,
  ]);
  assert.equal(pool.length, 1);
  assert.equal(pool[0].purpose, "one-shot");
});

test("sanitizeModelLighting keeps known models and defaults", () => {
  const modelId = "55555555-5555-4555-8555-555555555555";
  const lighting = sanitizeModelLighting(
    {
      [modelId]: { exposure: 1.25, tone_mapping: "aces" },
      "missing-model": { exposure: 2 },
    },
    new Set([modelId]),
  );
  assert.equal(Object.keys(lighting).length, 1);
  assert.equal(lighting[modelId].exposure, 1.25);
  assert.equal(lighting[modelId].tone_mapping, "aces");
  assert.equal(
    lighting[modelId].environment_enabled,
    DEFAULT_MODEL_LIGHTING.environment_enabled,
  );
});

test("normalizeClipNameCandidate rejects illegal names", () => {
  assert.equal(normalizeClipNameCandidate("Wave Hello"), "wave-hello");
  assert.throws(() => normalizeClipNameCandidate("!!!"), /Clip names/);
});

test("validStoredAsset enforces id/filename pairing", () => {
  const id = "66666666-6666-4666-8666-666666666666";
  assert.equal(
    validStoredAsset({ id, stored_filename: `${id}.vrm` }, ".vrm"),
    true,
  );
  assert.equal(
    validStoredAsset({ id, stored_filename: `${id}.vrma` }, ".vrm"),
    false,
  );
});
