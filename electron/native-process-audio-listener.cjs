"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { AudioActivityGate, DEFAULT_SPEECH_RELEASE_MS } = require("./audio-activity-gate.cjs");
const {
  discoverVoiceProcesses,
  isPidAlive,
  selectStickyRootPid,
} = require("./process-discovery.cjs");
const { normalizeVoiceSource } = require("./voice-source.cjs");
const {
  LISTENER_STATE,
  withListenerState,
} = require("./listener-status.cjs");

const SESSION_IDLE_MS = 8_000;
const MIN_POLL_INTERVAL_MS = 1_500;
const MAX_POLL_INTERVAL_MS = 10_000;
const FULL_DISCOVERY_MAX_AGE_MS = 10_000;

function helperExecutableName() {
  return "voxavatar-audio-listener.exe";
}

function resolveNativeHelperPath({
  platform = process.platform,
  isPackaged = false,
  resourcesPath = process.resourcesPath,
  projectRoot = path.join(__dirname, ".."),
} = {}) {
  const executable = helperExecutableName();
  if (platform !== "win32") return null;
  return isPackaged
    ? path.win32.join(resourcesPath, "native", "win32", executable)
    : path.win32.join(projectRoot, "native", "bin", "win32", executable);
}

function createNdjsonParser(onMessage, onInvalid = () => {}) {
  let pending = "";
  return (chunk) => {
    pending += chunk.toString("utf8");
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        onMessage(JSON.parse(line));
      } catch {
        onInvalid(line);
      }
    }
  };
}

class NativeProcessAudioListener {
  constructor({
    platform = process.platform,
    isPackaged = false,
    resourcesPath = process.resourcesPath,
    helperPath = null,
    processDiscovery = discoverVoiceProcesses,
    pidAlive = isPidAlive,
    spawnProcess = spawn,
    onActivity = () => {},
    onDebug = null,
    onLevel = () => {},
    onSession = () => {},
    onStatus = () => {},
    pollIntervalMs = MIN_POLL_INTERVAL_MS,
    minPollIntervalMs = MIN_POLL_INTERVAL_MS,
    maxPollIntervalMs = MAX_POLL_INTERVAL_MS,
    fullDiscoveryMaxAgeMs = FULL_DISCOVERY_MAX_AGE_MS,
    sessionIdleMs = SESSION_IDLE_MS,
    speechReleaseMs = DEFAULT_SPEECH_RELEASE_MS,
    processPattern = null,
    voiceSource = null,
    now = () => Date.now(),
  } = {}) {
    this.platform = platform;
    this.helperPath =
      helperPath ?? resolveNativeHelperPath({ platform, isPackaged, resourcesPath });
    this.processDiscovery = processDiscovery;
    this.pidAlive = pidAlive;
    this.processPattern = processPattern;
    this.voiceSource = normalizeVoiceSource(voiceSource);
    this.spawnProcess = spawnProcess;
    this.onActivity = onActivity;
    this.onDebug = onDebug;
    this.onSession = onSession;
    this.onStatus = onStatus;
    this.minPollIntervalMs = minPollIntervalMs;
    this.maxPollIntervalMs = Math.max(maxPollIntervalMs, minPollIntervalMs);
    this.pollIntervalMs = Math.min(
      Math.max(pollIntervalMs, this.minPollIntervalMs),
      this.maxPollIntervalMs,
    );
    this.fullDiscoveryMaxAgeMs = fullDiscoveryMaxAgeMs;
    this.sessionIdleMs = sessionIdleMs;
    this.now = now;
    this.capture = null;
    this.captureKey = null;
    this.activeRootPid = null;
    this.pollTimer = null;
    this.sessionTimer = null;
    this.sessionActive = false;
    this.stopped = true;
    this.pollInFlight = false;
    this.lastStatusKey = null;
    this.lastKnownSource = null;
    this.lastFullDiscoveryAt = 0;
    this.outputRetryTimer = null;
    this.gate = new AudioActivityGate({
      onActivity,
      onLevel,
      shouldReturnToListening: () => this.sessionActive,
      speechReleaseMs,
    });
  }

  reportStatus(status) {
    const enriched =
      status?.state != null
        ? withListenerState(status, status.state)
        : withListenerState(status);
    const key = JSON.stringify(enriched);
    if (key === this.lastStatusKey) return;
    this.lastStatusKey = key;
    this.onStatus(enriched);
  }

  clearPollTimer() {
    clearTimeout(this.pollTimer);
    this.pollTimer = null;
  }

  scheduleNextPoll(intervalMs = this.pollIntervalMs) {
    this.clearPollTimer();
    if (this.stopped) return;
    this.pollTimer = setTimeout(() => void this.poll(), intervalMs);
    this.pollTimer.unref?.();
  }

  relaxPollInterval() {
    this.pollIntervalMs = Math.min(
      this.maxPollIntervalMs,
      Math.round(this.pollIntervalMs * 1.5),
    );
  }

  tightenPollInterval() {
    this.pollIntervalMs = this.minPollIntervalMs;
  }

  async start() {
    if (this.platform !== "win32" || !this.stopped) return;
    this.stopped = false;
    if (!fs.existsSync(this.helperPath)) {
      this.reportStatus({
        available: false,
        capturing: false,
        monitoring: false,
        source: null,
        state: LISTENER_STATE.MISSING,
        error: "Native listener helper is missing.",
      });
      return;
    }
    if (this.voiceSource.mode === "output") {
      this.reportStatus({
        available: true,
        capturing: false,
        monitoring: true,
        source: null,
        state: LISTENER_STATE.NO_OUTPUT,
      });
      this.startOutputCapture();
      return;
    }
    this.reportStatus({
      available: true,
      capturing: false,
      monitoring: true,
      source: null,
      state: LISTENER_STATE.TARGET_MISSING,
    });
    await this.poll();
  }

  async poll() {
    if (this.stopped || this.pollInFlight) return;
    this.pollInFlight = true;
    try {
      const now = this.now();
      const canUseFastPath =
        this.activeRootPid != null &&
        this.capture &&
        this.captureKey === String(this.activeRootPid) &&
        this.pidAlive(this.activeRootPid) &&
        now - this.lastFullDiscoveryAt < this.fullDiscoveryMaxAgeMs;

      if (canUseFastPath) {
        this.relaxPollInterval();
        this.scheduleNextPoll();
        return;
      }

      const processes = await this.processDiscovery({
        platform: this.platform,
        voiceSource: this.voiceSource,
        ...(this.processPattern ? { pattern: this.processPattern } : {}),
      });
      if (this.stopped) return;
      this.lastFullDiscoveryAt = this.now();
      const selectedPid = selectStickyRootPid(
        processes.rootPids,
        this.activeRootPid,
      );
      if (selectedPid == null) {
        this.activeRootPid = null;
        this.detach();
        this.reportStatus({
          available: true,
          capturing: false,
          monitoring: true,
          source: null,
          state: LISTENER_STATE.TARGET_MISSING,
        });
        this.tightenPollInterval();
        this.scheduleNextPoll();
        return;
      }
      const key = String(selectedPid);
      this.activeRootPid = selectedPid;
      if (this.capture && this.captureKey === key) {
        this.relaxPollInterval();
        this.scheduleNextPoll();
        return;
      }
      this.detach({ sessionEnded: false });
      this.startCapture([selectedPid], key);
      this.tightenPollInterval();
      this.scheduleNextPoll();
    } catch (error) {
      this.tightenPollInterval();
      this.reportStatus({
        available: true,
        capturing: false,
        monitoring: true,
        source: null,
        state: LISTENER_STATE.LAUNCH_FAILED,
        error: error instanceof Error ? error.message : String(error),
      });
      this.scheduleNextPoll();
    } finally {
      this.pollInFlight = false;
    }
  }

  startCapture(processIds, key) {
    const args = processIds.flatMap((processId) => ["--pid", String(processId)]);
    this.spawnCapture(args, key);
  }

  startOutputCapture() {
    clearTimeout(this.outputRetryTimer);
    this.outputRetryTimer = null;
    if (this.stopped) return;
    if (this.capture && this.captureKey === "output") return;
    this.detach({ sessionEnded: false });
    this.spawnCapture(["--output"], "output");
  }

  scheduleOutputRetry() {
    if (this.stopped || this.voiceSource.mode !== "output") return;
    clearTimeout(this.outputRetryTimer);
    this.outputRetryTimer = setTimeout(() => {
      this.outputRetryTimer = null;
      this.startOutputCapture();
    }, 2_000);
    this.outputRetryTimer.unref?.();
  }

  spawnCapture(args, key) {
    const child = this.spawnProcess(this.helperPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    this.capture = child;
    this.captureKey = key;
    const parse = createNdjsonParser(
      (message) => this.handleHelperMessage(child, message),
      (line) => this.onDebug?.("native listener emitted invalid JSON", line),
    );
    child.stdout.on("data", parse);
    child.stderr.on("data", (chunk) => this.onDebug?.("native listener stderr", chunk.toString()));
    child.once("error", (error) => {
      if (this.capture !== child) return;
      this.capture = null;
      this.captureKey = null;
      this.activeRootPid = null;
      this.tightenPollInterval();
      this.reportStatus({
        available: false,
        capturing: false,
        monitoring: true,
        source: null,
        state: LISTENER_STATE.LAUNCH_FAILED,
        error: error.message,
      });
      if (!this.stopped && this.voiceSource.mode !== "output") {
        this.scheduleNextPoll();
      }
    });
    child.once("exit", (code, signal) => {
      if (this.capture !== child) return;
      this.capture = null;
      this.captureKey = null;
      this.activeRootPid = null;
      this.gate.reset();
      this.tightenPollInterval();
      this.reportStatus({
        available: true,
        capturing: false,
        monitoring: !this.stopped,
        source: null,
        state: this.stopped
          ? LISTENER_STATE.INACTIVE
          : LISTENER_STATE.LAUNCH_FAILED,
        ...(code && !this.stopped
          ? { error: `Native listener exited with code ${code}${signal ? ` (${signal})` : ""}.` }
          : {}),
      });
      if (
        !this.stopped &&
        this.voiceSource.mode === "output" &&
        this.captureKey == null
      ) {
        this.scheduleOutputRetry();
      } else if (!this.stopped && this.voiceSource.mode !== "output") {
        this.scheduleNextPoll();
      }
    });
  }

  handleHelperMessage(child, message) {
    if (this.capture !== child || message == null || typeof message !== "object") return;
    if (message.type === "ready") {
      this.lastKnownSource = message.source || "Supported voice app";
      this.reportStatus({
        available: true,
        capturing: true,
        monitoring: true,
        source: this.lastKnownSource,
        state: LISTENER_STATE.NO_OUTPUT,
      });
      return;
    }
    if (message.type === "error") {
      this.lastKnownSource = null;
      this.reportStatus({
        available: false,
        capturing: false,
        monitoring: true,
        source: null,
        state: LISTENER_STATE.LAUNCH_FAILED,
        error: String(message.message || "Native listener failed."),
      });
      return;
    }
    if (message.type !== "level" || !Number.isFinite(message.level)) return;

    const level = Math.max(0, Math.min(1, Number(message.level)));
    if (level > 0.008) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = setTimeout(() => this.endSession(), this.sessionIdleMs);
      this.sessionTimer.unref?.();
      if (!this.sessionActive) {
        this.sessionActive = true;
        this.onSession(true);
        this.onActivity("listening");
      }
      this.reportStatus({
        available: true,
        capturing: true,
        monitoring: true,
        source: this.lastKnownSource,
        state: LISTENER_STATE.LISTENING,
      });
    }
    this.gate.handleLevel(level);
  }

  endSession() {
    clearTimeout(this.sessionTimer);
    this.sessionTimer = null;
    if (!this.sessionActive) return;
    this.sessionActive = false;
    this.gate.reset();
    this.onSession(false);
    if (this.capture && !this.stopped) {
      this.reportStatus({
        available: true,
        capturing: true,
        monitoring: true,
        source: this.lastKnownSource,
        state: LISTENER_STATE.NO_OUTPUT,
      });
    }
  }

  detach({ sessionEnded = true } = {}) {
    if (this.capture) {
      const child = this.capture;
      this.capture = null;
      this.captureKey = null;
      child.kill();
    }
    this.gate.reset();
    if (sessionEnded) this.endSession();
    this.lastKnownSource = null;
    this.reportStatus({
      available: true,
      capturing: false,
      monitoring: !this.stopped,
      source: null,
      state: this.stopped
        ? LISTENER_STATE.INACTIVE
        : LISTENER_STATE.TARGET_MISSING,
    });
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.clearPollTimer();
    clearTimeout(this.outputRetryTimer);
    this.outputRetryTimer = null;
    this.activeRootPid = null;
    this.detach();
  }
}

module.exports = {
  NativeProcessAudioListener,
  SESSION_IDLE_MS,
  LISTENER_STATE,
  MIN_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
  FULL_DISCOVERY_MAX_AGE_MS,
  createNdjsonParser,
  helperExecutableName,
  resolveNativeHelperPath,
};
