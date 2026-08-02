"use strict";

const { redactSensitive } = require("./diagnostic-summary.cjs");

const STATUS_SCHEMA_VERSION = 2;
const TOOLS_SCHEMA_VERSION = 3;

function serializeToolResult(object) {
  return {
    content: [{ type: "text", text: JSON.stringify(object) }],
  };
}

function formatAnimationRecord(animation) {
  return {
    animation_name: animation.animation_name,
    animation_description: animation.animation_description,
    animation_trigger_scenario: animation.animation_trigger_scenario,
  };
}

function formatListAnimations(animations) {
  const records = animations.map(formatAnimationRecord);
  const message =
    records.length === 0
      ? "No animation actions currently have playable clips."
      : `${records.length} playable action${records.length === 1 ? "" : "s"} available.`;
  return {
    schema_version: TOOLS_SCHEMA_VERSION,
    message,
    animations: records,
    count: records.length,
  };
}

function formatGetStatus(status = {}) {
  const windowVisible = Boolean(status.windowVisible);
  const modelConfigured = Boolean(status.modelConfigured);
  const listener = sanitizeListenerForMcp(status.listener);
  const listenerState =
    status.readiness?.listener_state ?? listener?.state ?? null;
  const messageParts = [
    `Window ${windowVisible ? "visible" : "hidden"}.`,
    modelConfigured ? "Model configured." : "Model not configured.",
  ];
  if (listenerState) {
    messageParts.push(`Listener ${listenerState}.`);
  }
  return {
    status_schema_version: STATUS_SCHEMA_VERSION,
    message: messageParts.join(" "),
    ...status,
    ...(listener ? { listener } : {}),
  };
}

/** MCP／Settings 出口：遮罩 listener.error／source 路徑，保留 helper_error／state。 */
function sanitizeListenerForMcp(listener) {
  if (listener == null || typeof listener !== "object") return listener;
  const next = { ...listener };
  if (typeof next.error === "string" && next.error.length > 0) {
    next.error = redactSensitive(next.error);
  }
  if (typeof next.source === "string" && next.source.length > 0) {
    next.source = redactSensitive(next.source);
  }
  return next;
}

/** Settings list-voice-sources：遮罩 catalog error 與 listener。 */
function sanitizeVoiceSourcesCatalog(catalog) {
  if (catalog == null || typeof catalog !== "object") return catalog;
  const next = { ...catalog };
  if (typeof next.error === "string" && next.error.length > 0) {
    next.error = redactSensitive(next.error);
  } else {
    next.error = next.error ?? null;
  }
  if (next.listener != null) {
    next.listener = sanitizeListenerForMcp(next.listener);
  }
  return next;
}

function formatPlayAnimation({ animation, played, error = null }) {
  let message;
  if (played) {
    message = `VoxAvatar is playing the ${animation} action.`;
  } else if (error === "animation_not_playable") {
    message = `The ${animation} action is not currently playable. Call list_animations for the latest action catalog.`;
  } else if (error === "model_or_clips_missing") {
    message =
      "VoxAvatar cannot play that action until a model and at least one clip are configured.";
  } else {
    message = `Unable to play the ${animation} action.`;
  }
  return {
    schema_version: TOOLS_SCHEMA_VERSION,
    message,
    animation,
    played: Boolean(played),
    ...(error ? { error } : {}),
  };
}

function formatControlWindow({ action, visible }) {
  return {
    schema_version: TOOLS_SCHEMA_VERSION,
    message: `VoxAvatar's window is now ${visible ? "visible" : "hidden"}.`,
    action,
    visible: Boolean(visible),
  };
}

function formatShowMessage({
  displayed,
  messageId = null,
  expiresAt = null,
  error = null,
}) {
  let message;
  if (displayed) {
    message = "Message displayed beside the avatar.";
  } else if (error === "agent_messages_disabled") {
    message =
      "Agent messages are disabled in Settings. Enable “Allow connected AI to show messages” first.";
  } else if (error === "invalid_message") {
    message = "Message text was empty, too long, or contained unsupported characters.";
  } else if (error === "rate_limited") {
    message = "Message rate limit reached. Wait briefly and try again.";
  } else if (error === "avatar_unavailable") {
    message = "VoxAvatar cannot display a message until a model is configured.";
  } else {
    message = "Unable to display the message.";
  }
  return {
    schema_version: TOOLS_SCHEMA_VERSION,
    message,
    displayed: Boolean(displayed),
    ...(messageId ? { message_id: messageId } : {}),
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    ...(error ? { error } : {}),
  };
}

function formatSetCharacterState({
  applied,
  state = null,
  expiresAt = null,
  error = null,
}) {
  let message;
  if (applied) {
    message = `Character presentation state set to ${state}.`;
  } else if (error === "invalid_state") {
    message =
      "State must be one of idle, listening, speaking, working, reviewing, success, or failed.";
  } else if (error === "invalid_ttl") {
    message = "ttl_ms must be a finite number between 0 and 600000.";
  } else if (error === "avatar_unavailable") {
    message = "VoxAvatar cannot apply state until a model is configured.";
  } else {
    message = "Unable to apply character state.";
  }
  return {
    schema_version: TOOLS_SCHEMA_VERSION,
    message,
    applied: Boolean(applied),
    ...(state ? { state } : {}),
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    ...(error ? { error } : {}),
  };
}

module.exports = {
  STATUS_SCHEMA_VERSION,
  TOOLS_SCHEMA_VERSION,
  serializeToolResult,
  formatAnimationRecord,
  formatListAnimations,
  formatGetStatus,
  formatPlayAnimation,
  formatControlWindow,
  formatShowMessage,
  formatSetCharacterState,
  sanitizeListenerForMcp,
  sanitizeVoiceSourcesCatalog,
};
