"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildAppReadiness } = require("./app-readiness.cjs");
const { LISTENER_STATE } = require("./listener-status.cjs");

const emptySnapshot = {
  default_model_id: null,
  models: [],
  animations: [],
  voice_source: { mode: "default" },
};

test("incomplete setup lists model as next required step", () => {
  const readiness = buildAppReadiness({
    settingsSnapshot: emptySnapshot,
    listenerStatus: {
      available: false,
      capturing: false,
      monitoring: false,
      state: LISTENER_STATE.MISSING,
    },
    mcpHealth: "unavailable",
  });
  assert.equal(readiness.complete, false);
  assert.equal(readiness.next_step.id, "model");
  assert.equal(readiness.next_step.next_action, "import_model");
  assert.equal(readiness.steps.find((s) => s.id === "animations").optional, true);
});

test("configured model + listening helper + online mcp is complete", () => {
  const readiness = buildAppReadiness({
    settingsSnapshot: {
      default_model_id: "m1",
      models: [{ id: "m1" }],
      animations: [
        {
          animation_name: "wave",
          asset_urls: ["voxavatar-asset://x.vrma"],
        },
      ],
      voice_source: { mode: "default" },
    },
    listenerStatus: {
      available: true,
      capturing: true,
      monitoring: true,
      state: LISTENER_STATE.LISTENING,
    },
    mcpHealth: "online",
    windowVisible: true,
  });
  assert.equal(readiness.complete, true);
  assert.equal(readiness.next_step, null);
  assert.equal(readiness.playable_actions, 1);
  assert.equal(readiness.listener_state, LISTENER_STATE.LISTENING);
});

test("external voice mode does not require native helper", () => {
  const readiness = buildAppReadiness({
    settingsSnapshot: {
      default_model_id: "m1",
      models: [{ id: "m1" }],
      animations: [],
      voice_source: { mode: "external" },
    },
    listenerStatus: null,
    mcpHealth: "online",
  });
  assert.equal(readiness.steps.find((s) => s.id === "voice").ready, true);
  assert.equal(readiness.complete, true);
});

test("voice step codes distinguish target_missing / listening / no_output / ready", () => {
  const base = {
    settingsSnapshot: {
      default_model_id: "m1",
      models: [{ id: "m1" }],
      animations: [],
      voice_source: { mode: "default" },
    },
    mcpHealth: "unavailable",
  };
  const cases = [
    [LISTENER_STATE.TARGET_MISSING, "voice_target_missing", true, "start_voice_app"],
    [LISTENER_STATE.LISTENING, "voice_listening", true, null],
    [LISTENER_STATE.NO_OUTPUT, "voice_no_output", true, null],
    [LISTENER_STATE.INACTIVE, "listener_inactive", false, "configure_voice_source"],
  ];
  for (const [state, code, ready, nextAction] of cases) {
    const readiness = buildAppReadiness({
      ...base,
      listenerStatus: {
        available: ready,
        capturing: state === LISTENER_STATE.LISTENING,
        monitoring: ready,
        state,
      },
    });
    const voice = readiness.steps.find((s) => s.id === "voice");
    assert.equal(voice.code, code, state);
    assert.equal(voice.ready, ready, state);
    assert.equal(voice.next_action, nextAction, state);
  }
  // 非 external 模式下若 state 為 EXTERNAL（或其他未列舉碼），歸 voice_ready
  const readyStatus = buildAppReadiness({
    ...base,
    listenerStatus: {
      available: true,
      capturing: false,
      monitoring: true,
      state: LISTENER_STATE.EXTERNAL,
    },
  });
  const voiceReady = readyStatus.steps.find((s) => s.id === "voice");
  assert.equal(voiceReady.code, "voice_ready");
  assert.equal(voiceReady.ready, true);
});

test("mcp step codes cover online / starting / unavailable", () => {
  const base = {
    settingsSnapshot: {
      default_model_id: "m1",
      models: [{ id: "m1" }],
      animations: [],
      voice_source: { mode: "external" },
    },
    listenerStatus: null,
  };
  assert.equal(
    buildAppReadiness({ ...base, mcpHealth: "online" }).steps.find(
      (s) => s.id === "mcp",
    ).code,
    "mcp_online",
  );
  assert.equal(
    buildAppReadiness({ ...base, mcpHealth: "starting" }).steps.find(
      (s) => s.id === "mcp",
    ).code,
    "mcp_starting",
  );
  assert.equal(
    buildAppReadiness({ ...base, mcpHealth: "unavailable" }).steps.find(
      (s) => s.id === "mcp",
    ).code,
    "mcp_unavailable",
  );
});
