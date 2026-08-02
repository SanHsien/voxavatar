"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MCP_TOOL_NAMES,
  createMcpSettingsStatus,
} = require("./mcp-settings-status.cjs");

test("MCP settings status describes the live local endpoint", () => {
  const status = createMcpSettingsStatus({
    health: "online",
    port: 49152,
    settingsSnapshot: {
      animations: [
        { animation_name: "idle", asset_urls: ["idle.vrma"] },
        { animation_name: "empty", asset_urls: [] },
        { animation_name: "wave-hello", asset_urls: ["wave.vrma"] },
      ],
    },
  });

  assert.equal(status.health, "online");
  assert.equal(status.status_schema_version, 2);
  assert.equal(status.tools_schema_version, 2);
  assert.deepEqual(status.tools, [
    "play_animation",
    "list_animations",
    "control_window",
    "get_status",
    "show_message",
  ]);
  assert.equal(status.server_url, "http://127.0.0.1:49152/mcp");
  assert.equal(status.health_url, "http://127.0.0.1:49152/health");
  assert.equal(
    status.setup_command,
    "codex mcp add voxavatar --url http://127.0.0.1:49152/mcp",
  );
  assert.deepEqual(status.tools, MCP_TOOL_NAMES);
  assert.deepEqual(status.playable_actions, ["idle", "wave-hello"]);
  assert.equal(status.local_only, true);
  assert.match(status.checked_at, /^\d{4}-\d{2}-\d{2}T/);
});

test("MCP settings status retains a server startup error", () => {
  const status = createMcpSettingsStatus({
    error: "Address already in use",
    health: "unavailable",
    port: 47831,
    settingsSnapshot: { animations: [] },
  });

  assert.equal(status.health, "unavailable");
  assert.equal(status.error, "Address already in use");
  assert.deepEqual(status.playable_actions, []);
});
