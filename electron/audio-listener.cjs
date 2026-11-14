"use strict";

const { NativeProcessAudioListener } = require("./native-process-audio-listener.cjs");
const { resolveListenerVoiceSource } = require("./voice-source.cjs");

function createAudioListener({ platform = process.platform, ...options } = {}) {
  if (resolveListenerVoiceSource(options).mode === "external") return null;
  if (platform !== "win32") return null;
  return new NativeProcessAudioListener({ platform, ...options });
}

module.exports = { createAudioListener };
