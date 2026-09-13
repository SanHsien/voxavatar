"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  LISTENER_STATE,
  deriveListenerState,
  withListenerState,
} = require("./listener-status.cjs");

test("deriveListenerState prefers explicit state", () => {
  assert.equal(
    deriveListenerState({
      available: true,
      capturing: false,
      monitoring: true,
      state: LISTENER_STATE.TARGET_MISSING,
    }),
    LISTENER_STATE.TARGET_MISSING,
  );
});

test("deriveListenerState maps missing helper errors", () => {
  assert.equal(
    deriveListenerState({
      available: false,
      capturing: false,
      monitoring: false,
      error: "Native listener is missing: C:\\Users\\SanHsien\\helper.exe",
    }),
    LISTENER_STATE.MISSING,
  );
});

test("withListenerState preserves booleans and attaches state", () => {
  const status = withListenerState(
    {
      available: true,
      capturing: true,
      monitoring: true,
      source: "app",
    },
    LISTENER_STATE.LISTENING,
  );
  assert.equal(status.state, LISTENER_STATE.LISTENING);
  assert.equal(status.capturing, true);
  assert.equal(status.source, "app");
});

test("withListenerState preserves helper_error classification codes", () => {
  const status = withListenerState(
    {
      available: true,
      capturing: false,
      monitoring: true,
      error: "Native listener exited with code 1.",
      helper_error: "native_helper_exit_nonzero",
    },
    LISTENER_STATE.LAUNCH_FAILED,
  );
  assert.equal(status.helper_error, "native_helper_exit_nonzero");
  assert.match(status.error, /exited with code 1/);
});
