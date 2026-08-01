"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createAudioListener } = require("./audio-listener.cjs");
const { NativeProcessAudioListener } = require("./native-process-audio-listener.cjs");

test("selects the native listener implementation only on Windows", () => {
  assert.ok(createAudioListener({ platform: "win32" }) instanceof NativeProcessAudioListener);
  assert.equal(createAudioListener({ platform: "linux" }), null);
  assert.equal(createAudioListener({ platform: "darwin" }), null);
  assert.equal(createAudioListener({ platform: "freebsd" }), null);
  assert.equal(
    createAudioListener({
      platform: "win32",
      voiceSource: { mode: "external" },
    }),
    null,
  );
});
