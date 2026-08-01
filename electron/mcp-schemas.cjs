"use strict";

const STATUS_SCHEMA_VERSION = 1;
const TOOLS_SCHEMA_VERSION = 1;

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
  const listenerState = status.readiness?.listener_state ?? status.listener?.state ?? null;
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
  };
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

module.exports = {
  STATUS_SCHEMA_VERSION,
  TOOLS_SCHEMA_VERSION,
  serializeToolResult,
  formatAnimationRecord,
  formatListAnimations,
  formatGetStatus,
  formatPlayAnimation,
  formatControlWindow,
};
