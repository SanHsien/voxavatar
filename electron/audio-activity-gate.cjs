"use strict";

const DEFAULT_SPEECH_RELEASE_MS = 900;
const DEFAULT_SPEECH_THRESHOLD = 0.018;

class AudioActivityGate {
  constructor({
    onActivity = () => {},
    onLevel = () => {},
    shouldReturnToListening = () => true,
    speechReleaseMs = DEFAULT_SPEECH_RELEASE_MS,
    speechThreshold = DEFAULT_SPEECH_THRESHOLD,
  } = {}) {
    this.onActivity = onActivity;
    this.onLevel = onLevel;
    this.shouldReturnToListening = shouldReturnToListening;
    this.speechReleaseMs = speechReleaseMs;
    this.speechThreshold = speechThreshold;
    this.silenceTimer = null;
    this.speaking = false;
  }

  handleLevel(level) {
    const normalized = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
    this.onLevel(normalized);
    if (normalized > this.speechThreshold) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
      if (!this.speaking) {
        this.speaking = true;
        this.onActivity("speaking");
      }
      return;
    }

    if (this.speaking && this.silenceTimer == null) {
      this.silenceTimer = setTimeout(() => {
        this.silenceTimer = null;
        this.speaking = false;
        this.onLevel(0);
        if (this.shouldReturnToListening()) this.onActivity("listening");
      }, this.speechReleaseMs);
      this.silenceTimer.unref?.();
    }
  }

  reset({ emitLevel = true } = {}) {
    clearTimeout(this.silenceTimer);
    this.silenceTimer = null;
    this.speaking = false;
    if (emitLevel) this.onLevel(0);
  }
}

module.exports = {
  AudioActivityGate,
  DEFAULT_SPEECH_RELEASE_MS,
  DEFAULT_SPEECH_THRESHOLD,
};
