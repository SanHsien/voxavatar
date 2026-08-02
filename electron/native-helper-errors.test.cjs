"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  NATIVE_HELPER_ERROR,
  classifyNativeHelperFailure,
} = require("./native-helper-errors.cjs");
const { LISTENER_STATE } = require("./listener-status.cjs");

test("classifyNativeHelperFailure maps missing binary and permission errors", () => {
  const missing = classifyNativeHelperFailure({
    message: "helper EXE not found (ENOENT)",
  });
  assert.equal(missing.code, NATIVE_HELPER_ERROR.MISSING_BINARY);
  assert.equal(missing.listenerState, LISTENER_STATE.MISSING);

  const permission = classifyNativeHelperFailure({
    message: "Access denied opening capture",
  });
  assert.equal(permission.code, NATIVE_HELPER_ERROR.PERMISSION);
  assert.equal(permission.listenerState, LISTENER_STATE.LAUNCH_FAILED);
});

test("classifyNativeHelperFailure maps WASAPI／COM／device messages", () => {
  assert.equal(
    classifyNativeHelperFailure({ message: "WASAPI audio client failed" }).code,
    NATIVE_HELPER_ERROR.WASAPI_ERROR,
  );
  assert.equal(
    classifyNativeHelperFailure({ message: "CoInitialize HRESULT 0x800" }).code,
    NATIVE_HELPER_ERROR.COM_ERROR,
  );
  assert.equal(
    classifyNativeHelperFailure({ message: "no playback device" }).listenerState,
    LISTENER_STATE.NO_OUTPUT,
  );
});

test("classifyNativeHelperFailure prefers typed helper exit codes", () => {
  assert.equal(
    classifyNativeHelperFailure({ exitCode: 10 }).code,
    NATIVE_HELPER_ERROR.COM_ERROR,
  );
  assert.equal(
    classifyNativeHelperFailure({ exitCode: 11 }).code,
    NATIVE_HELPER_ERROR.WASAPI_ERROR,
  );
  assert.equal(
    classifyNativeHelperFailure({ exitCode: 13 }).code,
    NATIVE_HELPER_ERROR.WASAPI_ERROR,
  );
  assert.equal(
    classifyNativeHelperFailure({ exitCode: 12 }).listenerState,
    LISTENER_STATE.NO_OUTPUT,
  );
  assert.equal(
    classifyNativeHelperFailure({ code: 2, message: "usage" }).code,
    NATIVE_HELPER_ERROR.USAGE,
  );
});

test("classifyNativeHelperFailure maps generic nonzero exit to EXIT_NONZERO", () => {
  const result = classifyNativeHelperFailure({ exitCode: 1 });
  assert.equal(result.code, NATIVE_HELPER_ERROR.EXIT_NONZERO);
  assert.equal(result.listenerState, LISTENER_STATE.LAUNCH_FAILED);
});
