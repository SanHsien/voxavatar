"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  STATUS_SCHEMA_VERSION,
  TOOLS_SCHEMA_VERSION,
  formatAnimationRecord,
  formatControlWindow,
  formatGetStatus,
  formatListAnimations,
  formatPlayAnimation,
  formatShowMessage,
  serializeToolResult,
} = require("./mcp-schemas.cjs");

const sampleAnimation = {
  animation_name: "wave-hello",
  animation_description: "A friendly wave.",
  animation_trigger_scenario: "Use when greeting the user.",
};

test("MCP schema helpers expose stable version constants", () => {
  assert.equal(STATUS_SCHEMA_VERSION, 2);
  assert.equal(TOOLS_SCHEMA_VERSION, 2);
});

test("formatListAnimations returns structured catalog output", () => {
  const payload = formatListAnimations([sampleAnimation]);

  assert.equal(payload.schema_version, TOOLS_SCHEMA_VERSION);
  assert.match(payload.message, /1 playable action available/);
  assert.equal(payload.count, 1);
  assert.deepEqual(payload.animations, [formatAnimationRecord(sampleAnimation)]);
});

test("formatListAnimations handles an empty catalog", () => {
  const payload = formatListAnimations([]);

  assert.equal(payload.count, 0);
  assert.deepEqual(payload.animations, []);
  assert.match(payload.message, /No animation actions currently have playable clips/);
});

test("formatGetStatus wraps status with status_schema_version and message", () => {
  const payload = formatGetStatus({
    modelConfigured: true,
    windowVisible: true,
    voiceState: { activity: "listening" },
    listener: { state: "listening" },
    readiness: { listener_state: "listening", schema_version: 1 },
  });

  assert.equal(payload.status_schema_version, STATUS_SCHEMA_VERSION);
  assert.match(payload.message, /Window visible/);
  assert.match(payload.message, /Model configured/);
  assert.match(payload.message, /Listener listening/);
  assert.equal(payload.windowVisible, true);
  assert.equal(payload.modelConfigured, true);
});

test("formatPlayAnimation covers success and error shapes", () => {
  const success = formatPlayAnimation({
    animation: "wave-hello",
    played: true,
  });
  assert.equal(success.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(success.played, true);
  assert.match(success.message, /playing the wave-hello action/);
  assert.equal(success.error, undefined);

  const missing = formatPlayAnimation({
    animation: "unknown",
    played: false,
    error: "animation_not_playable",
  });
  assert.equal(missing.played, false);
  assert.equal(missing.error, "animation_not_playable");
  assert.match(missing.message, /not currently playable/);

  const notReady = formatPlayAnimation({
    animation: "user-motion",
    played: false,
    error: "model_or_clips_missing",
  });
  assert.equal(notReady.error, "model_or_clips_missing");
  assert.match(notReady.message, /model and at least one clip/);
});

test("formatControlWindow returns action and visibility fields", () => {
  const payload = formatControlWindow({ action: "show", visible: true });

  assert.equal(payload.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(payload.action, "show");
  assert.equal(payload.visible, true);
  assert.match(payload.message, /now visible/);
});

test("formatShowMessage covers success and opt-in errors", () => {
  const ok = formatShowMessage({
    displayed: true,
    messageId: "m1",
    expiresAt: "2026-08-02T00:00:00.000Z",
  });
  assert.equal(ok.displayed, true);
  assert.equal(ok.message_id, "m1");
  const disabled = formatShowMessage({
    displayed: false,
    error: "agent_messages_disabled",
  });
  assert.equal(disabled.error, "agent_messages_disabled");
  assert.match(disabled.message, /disabled/i);
});

test("serializeToolResult emits JSON text content", () => {
  const payload = formatListAnimations([sampleAnimation]);
  const result = serializeToolResult(payload);

  assert.deepEqual(result.content, [
    { type: "text", text: JSON.stringify(payload) },
  ]);
  assert.deepEqual(JSON.parse(result.content[0].text), payload);
});
