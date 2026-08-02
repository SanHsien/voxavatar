"use strict";

/**
 * Native helper 失敗分類（純邏輯）。
 * Windows COM／WASAPI 細節仍待 helper 分型 exit code；此層先穩定可測語彙。
 */

const { LISTENER_STATE } = require("./listener-status.cjs");

const NATIVE_HELPER_ERROR = Object.freeze({
  UNKNOWN: "native_helper_unknown",
  MISSING_BINARY: "native_helper_missing",
  SPAWN_FAILED: "native_helper_spawn_failed",
  EXIT_NONZERO: "native_helper_exit_nonzero",
  DEVICE_ERROR: "native_helper_device_error",
  COM_ERROR: "native_helper_com_error",
  WASAPI_ERROR: "native_helper_wasapi_error",
  PERMISSION: "native_helper_permission",
});

/**
 * @param {{ exitCode?: number|null, signal?: string|null, message?: string|null }} input
 * @returns {{ code: string, listenerState: string, detail: string }}
 */
function classifyNativeHelperFailure(input = {}) {
  const message = String(input.message ?? "").trim();
  const detail = message || (input.signal ? `signal:${input.signal}` : "");
  const exitCode =
    input.exitCode == null || !Number.isFinite(Number(input.exitCode))
      ? null
      : Math.trunc(Number(input.exitCode));

  if (/ENOENT|not found|missing helper|cannot find/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.MISSING_BINARY,
      listenerState: LISTENER_STATE.MISSING,
      detail: message || NATIVE_HELPER_ERROR.MISSING_BINARY,
    };
  }
  if (/EACCES|access denied|permission/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.PERMISSION,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.PERMISSION,
    };
  }
  if (/WASAPI|audio client|endpoint/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.WASAPI_ERROR,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.WASAPI_ERROR,
    };
  }
  if (/COM|CoInitialize|HRESULT/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.COM_ERROR,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.COM_ERROR,
    };
  }
  if (/device|no playback|no output/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.DEVICE_ERROR,
      listenerState: LISTENER_STATE.NO_OUTPUT,
      detail: message || NATIVE_HELPER_ERROR.DEVICE_ERROR,
    };
  }
  if (/spawn|EPERM|EINVAL/i.test(message)) {
    return {
      code: NATIVE_HELPER_ERROR.SPAWN_FAILED,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: message || NATIVE_HELPER_ERROR.SPAWN_FAILED,
    };
  }
  if (exitCode != null && exitCode !== 0) {
    return {
      code: NATIVE_HELPER_ERROR.EXIT_NONZERO,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: detail || `exit:${exitCode}`,
    };
  }
  if (input.signal) {
    return {
      code: NATIVE_HELPER_ERROR.SPAWN_FAILED,
      listenerState: LISTENER_STATE.LAUNCH_FAILED,
      detail: detail || `signal:${input.signal}`,
    };
  }
  return {
    code: NATIVE_HELPER_ERROR.UNKNOWN,
    listenerState: LISTENER_STATE.LAUNCH_FAILED,
    detail: detail || NATIVE_HELPER_ERROR.UNKNOWN,
  };
}

module.exports = {
  NATIVE_HELPER_ERROR,
  classifyNativeHelperFailure,
};
