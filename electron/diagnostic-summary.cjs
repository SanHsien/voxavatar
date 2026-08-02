"use strict";

const os = require("node:os");
const path = require("node:path");
const { version } = require("../package.json");

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactSensitive(text, { homeDir = os.homedir(), username } = {}) {
  let out = String(text ?? "");
  const home = homeDir || "";
  const user =
    username ||
    process.env.USERNAME ||
    process.env.USER ||
    (home ? path.basename(home) : "");

  if (home) {
    const homePosix = home.replace(/\\/g, "/");
    out = out.split(home).join("<home>");
    out = out.split(homePosix).join("<home>");
    // Windows 路徑大小寫差異
    out = out.replace(new RegExp(escapeRegExp(home), "gi"), "<home>");
    out = out.replace(new RegExp(escapeRegExp(homePosix), "gi"), "<home>");
  }

  if (user && user.length >= 2) {
    out = out.replace(new RegExp(escapeRegExp(user), "gi"), "<user>");
  }

  // 絕對路徑（剩餘）
  out = out.replace(/[A-Za-z]:\\[^\s`"'<>]+/g, "<path>");
  out = out.replace(/\/(?:Users|home|root)\/[^\s`"'<>]+/g, "<path>");

  // 素材檔名
  out = out.replace(/[^\s`"'/\\]+\.(?:vrm|vrma)\b/gi, "<asset>");

  return out;
}

function formatStepLine(step) {
  const flag = step.ready ? "ok" : step.optional ? "opt" : "todo";
  const action = step.next_action ? ` next=${step.next_action}` : "";
  return `- [${flag}] ${step.id}: ${step.code}${action}`;
}

function buildDiagnosticSummary({
  readiness,
  appVersion = version,
  platform = process.platform,
  generatedAt = new Date().toISOString(),
} = {}) {
  if (!readiness || typeof readiness !== "object") {
    throw new Error("readiness is required.");
  }

  const lines = [
    "VoxAvatar diagnostic summary",
    `generated_at: ${generatedAt}`,
    `app_version: ${appVersion}`,
    `platform: ${platform}`,
    `schema_version: ${readiness.schema_version ?? "?"}`,
    `setup_complete: ${readiness.complete ? "yes" : "no"}`,
    `window_visible: ${readiness.window_visible ? "yes" : "no"}`,
    `listener_state: ${readiness.listener_state ?? "inactive"}`,
    `mcp_health: ${readiness.mcp_health ?? "unavailable"}`,
    `playable_actions: ${readiness.playable_actions ?? 0}`,
    `voice_activity: ${readiness.voice_activity ?? "n/a"}`,
    "steps:",
    ...(Array.isArray(readiness.steps)
      ? readiness.steps.map(formatStepLine)
      : ["- (none)"]),
  ];

  if (readiness.next_step) {
    lines.push(
      `next: ${readiness.next_step.id} (${readiness.next_step.code})` +
        (readiness.next_step.next_action
          ? ` -> ${readiness.next_step.next_action}`
          : ""),
    );
  } else {
    lines.push("next: none");
  }

  lines.push(
    "",
    "Notes: paths, usernames, and asset filenames are redacted.",
    "This summary never includes audio samples or model bytes.",
  );

  return redactSensitive(lines.join("\n"));
}

module.exports = {
  buildDiagnosticSummary,
  redactSensitive,
};
