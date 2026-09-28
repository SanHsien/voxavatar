"use strict";

const { deriveListenerState, LISTENER_STATE } = require("./listener-status.cjs");
const { snapshotHasConfiguredModel } = require("./model-readiness.cjs");

const READINESS_SCHEMA_VERSION = 1;

function countPlayableActions(snapshot) {
  return (snapshot?.animations ?? []).filter(
    (animation) =>
      Array.isArray(animation.asset_urls) && animation.asset_urls.length > 0,
  ).length;
}

function buildStep({ id, ready, optional = false, code, nextAction = null }) {
  return {
    id,
    ready: Boolean(ready),
    optional: Boolean(optional),
    code,
    next_action: nextAction,
  };
}

function listenerStep(listenerStatus, voiceMode) {
  if (voiceMode === "external") {
    return buildStep({
      id: "voice",
      ready: true,
      code: "voice_external",
      nextAction: null,
    });
  }
  const state = deriveListenerState(listenerStatus);
  if (state === LISTENER_STATE.MISSING) {
    return buildStep({
      id: "voice",
      ready: false,
      code: "helper_missing",
      nextAction: "install_or_build_helper",
    });
  }
  if (state === LISTENER_STATE.LAUNCH_FAILED) {
    return buildStep({
      id: "voice",
      ready: false,
      code: "helper_launch_failed",
      nextAction: "check_voice_source",
    });
  }
  if (state === LISTENER_STATE.INACTIVE) {
    return buildStep({
      id: "voice",
      ready: false,
      code: "listener_inactive",
      nextAction: "configure_voice_source",
    });
  }
  // monitoring／no_output／listening／target_missing：來源已設定且 helper 可用
  return buildStep({
    id: "voice",
    ready: true,
    code:
      state === LISTENER_STATE.TARGET_MISSING
        ? "voice_target_missing"
        : state === LISTENER_STATE.LISTENING
          ? "voice_listening"
          : state === LISTENER_STATE.NO_OUTPUT
            ? "voice_no_output"
            : "voice_ready",
    nextAction:
      state === LISTENER_STATE.TARGET_MISSING ? "start_voice_app" : null,
  });
}

function buildAppReadiness({
  settingsSnapshot,
  listenerStatus = null,
  mcpHealth = "unavailable",
  windowVisible = false,
  voiceState = null,
  platform = process.platform,
} = {}) {
  const modelReady = snapshotHasConfiguredModel(settingsSnapshot);
  const playable = countPlayableActions(settingsSnapshot);
  const voiceMode = settingsSnapshot?.voice_source?.mode ?? "default";

  const model = buildStep({
    id: "model",
    ready: modelReady,
    code: modelReady ? "model_configured" : "model_missing",
    nextAction: modelReady ? null : "import_model",
  });
  const animations = buildStep({
    id: "animations",
    ready: playable > 0,
    optional: true,
    code: playable > 0 ? "animations_ready" : "animations_optional_empty",
    nextAction: playable > 0 ? null : "add_animation_clips",
  });
  const voice = listenerStep(listenerStatus, voiceMode);
  const mcpOnline = mcpHealth === "online";
  const mcp = buildStep({
    id: "mcp",
    ready: mcpOnline,
    code: mcpOnline
      ? "mcp_online"
      : mcpHealth === "starting"
        ? "mcp_starting"
        : "mcp_unavailable",
    nextAction: mcpOnline ? null : "wait_or_restart_mcp",
  });

  const required = [model, voice, mcp];
  const complete = required.every((step) => step.ready);
  const nextIncomplete =
    required.find((step) => !step.ready) ??
    (animations.ready ? null : animations);

  return {
    schema_version: READINESS_SCHEMA_VERSION,
    platform,
    complete,
    window_visible: Boolean(windowVisible),
    voice_activity: voiceState?.activity ?? null,
    listener_state: deriveListenerState(listenerStatus),
    mcp_health: mcpHealth,
    playable_actions: playable,
    steps: [model, animations, voice, mcp],
    next_step: nextIncomplete
      ? {
          id: nextIncomplete.id,
          code: nextIncomplete.code,
          next_action: nextIncomplete.next_action,
        }
      : null,
  };
}

module.exports = {
  READINESS_SCHEMA_VERSION,
  buildAppReadiness,
  countPlayableActions,
};
