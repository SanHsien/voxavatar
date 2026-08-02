"use strict";

const { version } = require("../package.json");
const {
  STATUS_SCHEMA_VERSION,
  TOOLS_SCHEMA_VERSION,
} = require("./mcp-schemas.cjs");

const MCP_TOOL_NAMES = Object.freeze([
  "play_animation",
  "list_animations",
  "control_window",
  "get_status",
  "show_message",
  "set_character_state",
]);
const MCP_TRANSPORT = "Streamable HTTP";

function createMcpSettingsStatus({
  error = null,
  health,
  port,
  settingsSnapshot,
}) {
  if (!["starting", "online", "unavailable"].includes(health)) {
    throw new Error("MCP health state is invalid.");
  }
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("MCP server port is invalid.");
  }

  const serverUrl = `http://127.0.0.1:${port}/mcp`;
  const playableActions = (settingsSnapshot?.animations ?? [])
    .filter(
      (animation) =>
        Array.isArray(animation.asset_urls) && animation.asset_urls.length > 0,
    )
    .map((animation) => animation.animation_name);

  return {
    checked_at: new Date().toISOString(),
    error: typeof error === "string" && error.length > 0 ? error : null,
    health,
    health_url: `http://127.0.0.1:${port}/health`,
    local_only: true,
    playable_actions: playableActions,
    server_url: serverUrl,
    setup_command: `codex mcp add voxavatar --url ${serverUrl}`,
    status_schema_version: STATUS_SCHEMA_VERSION,
    tools: [...MCP_TOOL_NAMES],
    tools_schema_version: TOOLS_SCHEMA_VERSION,
    transport: MCP_TRANSPORT,
    version,
  };
}

module.exports = {
  MCP_TOOL_NAMES,
  MCP_TRANSPORT,
  createMcpSettingsStatus,
};
