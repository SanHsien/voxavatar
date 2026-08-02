"use strict";

/**
 * Native helper／語音 listener 狀態語彙（設定頁與 MCP get_status 共用）。
 */

const LISTENER_STATE = Object.freeze({
  INACTIVE: "inactive",
  EXTERNAL: "external",
  MISSING: "missing",
  LAUNCH_FAILED: "launch_failed",
  TARGET_MISSING: "target_missing",
  NO_OUTPUT: "no_output",
  LISTENING: "listening",
});

const LISTENER_STATE_SET = new Set(Object.values(LISTENER_STATE));

function normalizeListenerState(value) {
  return LISTENER_STATE_SET.has(value) ? value : LISTENER_STATE.INACTIVE;
}

/**
 * 由既有布林欄位推導狀態（相容舊快照；新路徑應直接寫入 state）。
 */
function deriveListenerState(status = {}) {
  if (status?.state && LISTENER_STATE_SET.has(status.state)) {
    return status.state;
  }
  if (status?.available === false) {
    const error = String(status?.error ?? "");
    if (/missing|not found|ENOENT/i.test(error)) {
      return LISTENER_STATE.MISSING;
    }
    return LISTENER_STATE.LAUNCH_FAILED;
  }
  if (status?.capturing) {
    return LISTENER_STATE.LISTENING;
  }
  if (status?.monitoring) {
    return LISTENER_STATE.NO_OUTPUT;
  }
  return LISTENER_STATE.INACTIVE;
}

function withListenerState(status, state) {
  const next = {
    available: Boolean(status?.available),
    capturing: Boolean(status?.capturing),
    monitoring: Boolean(status?.monitoring),
    source: status?.source ?? null,
    state: normalizeListenerState(state ?? deriveListenerState(status)),
  };
  if (typeof status?.error === "string" && status.error.length > 0) {
    next.error = status.error;
  }
  if (
    typeof status?.helper_error === "string" &&
    status.helper_error.length > 0
  ) {
    next.helper_error = status.helper_error;
  }
  return next;
}

module.exports = {
  LISTENER_STATE,
  deriveListenerState,
  normalizeListenerState,
  withListenerState,
};
