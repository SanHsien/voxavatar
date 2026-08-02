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
