"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildDiagnosticSummary,
  redactSensitive,
} = require("./diagnostic-summary.cjs");

test("redactSensitive strips home, username, paths, and asset names", () => {
  const input =
    "err C:\\Users\\SanHsien\\OneDrive\\人物\\Daily_Miku.vrm home=/Users/SanHsien/proj";
  const out = redactSensitive(input, {
    homeDir: "C:\\Users\\SanHsien",
    username: "SanHsien",
  });
  assert.doesNotMatch(out, /SanHsien/i);
  assert.doesNotMatch(out, /Daily_Miku\.vrm/i);
  assert.match(out, /<home>|<path>|<asset>/);
});

test("buildDiagnosticSummary never embeds absolute paths or asset names", () => {
  const text = buildDiagnosticSummary({
    readiness: {
      schema_version: 1,
      complete: false,
      window_visible: false,
      listener_state: "missing",
      mcp_health: "unavailable",
      playable_actions: 0,
      voice_activity: null,
      steps: [
        {
          id: "model",
          ready: false,
          optional: false,
          code: "model_missing",
          next_action: "import_model",
        },
      ],
      next_step: {
        id: "model",
        code: "model_missing",
        next_action: "import_model",
      },
    },
    appVersion: "0.2.7",
    platform: "win32",
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(text, /VoxAvatar diagnostic summary/);
  assert.match(text, /setup_complete: no/);
  assert.match(text, /next: model/);
  assert.doesNotMatch(text, /\.vrm/i);
  assert.doesNotMatch(text, /C:\\/i);
});

test("buildDiagnosticSummary reports setup complete with no next step", () => {
  const text = buildDiagnosticSummary({
    readiness: {
      schema_version: 1,
      complete: true,
      window_visible: true,
      listener_state: "running",
      mcp_health: "online",
      playable_actions: 2,
      voice_activity: null,
      steps: [
        {
          id: "model",
          ready: true,
          optional: false,
          code: "model_ready",
          next_action: null,
        },
      ],
      next_step: null,
    },
    appVersion: "0.16.11",
    platform: "win32",
    generatedAt: "2026-08-02T00:00:00.000Z",
  });
  assert.match(text, /setup_complete: yes/);
  assert.match(text, /next: none/);
});
