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
  formatSetCharacterState,
  serializeToolResult,
} = require("./mcp-schemas.cjs");

const sampleAnimation = {
  animation_name: "wave-hello",
  animation_description: "A friendly wave.",
  animation_trigger_scenario: "Use when greeting the user.",
};

test("MCP schema helpers expose stable version constants", () => {
  assert.equal(STATUS_SCHEMA_VERSION, 2);
  assert.equal(TOOLS_SCHEMA_VERSION, 3);
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

test("formatGetStatus redacts absolute paths in listener.error", () => {
  const payload = formatGetStatus({
    modelConfigured: false,
    windowVisible: false,
    listener: {
      state: "missing",
      helper_error: "native_helper_missing",
      error: "ENOENT C:\\Users\\SanHsien\\AppData\\voxavatar-audio-listener.exe",
      source: "C:\\Users\\SanHsien\\AppData\\Local\\ChatGPT\\app.exe",
    },
  });
  assert.equal(payload.listener.helper_error, "native_helper_missing");
  assert.equal(payload.listener.state, "missing");
  assert.doesNotMatch(payload.listener.error, /SanHsien|AppData/i);
  assert.match(payload.listener.error, /<home>|<path>|<user>|<asset>/);
  assert.doesNotMatch(payload.listener.source, /SanHsien|ChatGPT/i);
  assert.match(payload.listener.source, /<home>|<path>|<user>|<asset>/);
});

test("sanitizeVoiceSourcesCatalog redacts catalog error and listener", () => {
  const { sanitizeVoiceSourcesCatalog } = require("./mcp-schemas.cjs");
  const catalog = sanitizeVoiceSourcesCatalog({
    platform: "win32",
    sources: [],
    error: "fail C:\\Users\\SanHsien\\helper.exe",
    listener: {
      state: "launch_failed",
      error: "C:\\Users\\SanHsien\\x.exe",
      source: "D:\\Apps\\foo.exe",
    },
  });
  assert.doesNotMatch(catalog.error, /SanHsien/i);
  assert.doesNotMatch(catalog.listener.error, /SanHsien/i);
  assert.doesNotMatch(catalog.listener.source, /Apps|foo/i);
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

  for (const [error, pattern] of [
    ["invalid_message", /empty|too long|unsupported/i],
    ["rate_limited", /rate limit/i],
    ["avatar_unavailable", /model is configured/i],
    ["unknown_code", /Unable to display/i],
  ]) {
    const payload = formatShowMessage({ displayed: false, error });
    assert.equal(payload.error, error);
    assert.match(payload.message, pattern);
  }
});

test("formatSetCharacterState covers success and validation errors", () => {
  const ok = formatSetCharacterState({
    applied: true,
    state: "working",
    expiresAt: "2026-08-02T00:00:00.000Z",
  });
  assert.equal(ok.schema_version, TOOLS_SCHEMA_VERSION);
  assert.equal(ok.applied, true);
  assert.equal(ok.state, "working");
  assert.equal(ok.expires_at, "2026-08-02T00:00:00.000Z");
  assert.match(ok.message, /working/);

  const invalid = formatSetCharacterState({
    applied: false,
    error: "invalid_state",
  });
  assert.equal(invalid.applied, false);
  assert.equal(invalid.error, "invalid_state");
  assert.match(invalid.message, /idle, listening, speaking/);

  for (const [error, pattern] of [
    ["invalid_ttl", /ttl_ms/i],
    ["avatar_unavailable", /model is configured/i],
    ["mystery", /Unable to apply/i],
  ]) {
    const payload = formatSetCharacterState({ applied: false, error });
    assert.equal(payload.error, error);
    assert.match(payload.message, pattern);
  }
});

test("serializeToolResult emits JSON text content", () => {
  const payload = formatListAnimations([sampleAnimation]);
  const result = serializeToolResult(payload);

  assert.deepEqual(result.content, [
    { type: "text", text: JSON.stringify(payload) },
  ]);
  assert.deepEqual(JSON.parse(result.content[0].text), payload);
});
