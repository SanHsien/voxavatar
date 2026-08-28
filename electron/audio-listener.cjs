"use strict";

const { NativeProcessAudioListener } = require("./native-process-audio-listener.cjs");
const { normalizeVoiceSource } = require("./voice-source.cjs");

function createAudioListener({ platform = process.platform, ...options } = {}) {
  if (normalizeVoiceSource(options.voiceSource).mode === "external") return null;
  if (platform !== "win32") return null;
  return new NativeProcessAudioListener({ platform, ...options });
}

module.exports = { createAudioListener };
