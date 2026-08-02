"use strict";

const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");
const {
  NativeProcessAudioListener,
  createNdjsonParser,
  resolveNativeHelperPath,
} = require("./native-process-audio-listener.cjs");

function fakeChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => child.emit("exit", 0, "SIGTERM");
  return child;
}

test("NDJSON parser buffers partial messages and rejects malformed lines", () => {
  const messages = [];
  const invalid = [];
  const parse = createNdjsonParser(
    (message) => messages.push(message),
    (line) => invalid.push(line),
  );
  parse('{"type":"rea');
  parse('dy"}\nnot-json\n{"type":"level","level":0.2}\n');
  assert.deepEqual(messages, [
    { type: "ready" },
    { type: "level", level: 0.2 },
  ]);
  assert.deepEqual(invalid, ["not-json"]);
});

test("resolves development and packaged Windows helper locations", () => {
  assert.equal(
    resolveNativeHelperPath({
      platform: "win32",
      projectRoot: "C:\\project",
      isPackaged: true,
      resourcesPath: "C:\\resources",
    }),
    "C:\\resources\\native\\win32\\voxavatar-audio-listener.exe",
  );
  assert.equal(
    resolveNativeHelperPath({
      platform: "win32",
      projectRoot: "C:\\project",
      isPackaged: false,
    }),
    "C:\\project\\native\\bin\\win32\\voxavatar-audio-listener.exe",
  );
  assert.equal(resolveNativeHelperPath({ platform: "darwin" }), null);
});

test("native listener activates on audio, smooths speech, and never hides the window", async () => {
  const activities = [];
  const sessions = [];
  const statuses = [];
  const child = fakeChild();
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    processDiscovery: async () => ({ pids: [10, 11], rootPids: [10] }),
    spawnProcess: () => child,
    onActivity: (activity) => activities.push(activity),
    onSession: (active) => sessions.push(active),
    onStatus: (status) => statuses.push(status),
    sessionIdleMs: 35,
    speechReleaseMs: 15,
  });

  await listener.start();
  child.stdout.emit("data", '{"type":"ready","source":"Codex"}\n');
  child.stdout.emit("data", '{"type":"level","level":0.3}\n');
  child.stdout.emit("data", '{"type":"level","level":0}\n');
  await new Promise((resolve) => setTimeout(resolve, 22));

  assert.deepEqual(sessions, [true]);
  assert.deepEqual(activities, ["listening", "speaking", "listening"]);
  assert.equal(statuses.at(-1).capturing, true);

  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.deepEqual(sessions, [true, false]);
  listener.stop();
});

test("native listener cannot attach after it is stopped during discovery", async () => {
  let finishDiscovery;
  let spawnCount = 0;
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    processDiscovery: () =>
      new Promise((resolve) => {
        finishDiscovery = resolve;
      }),
    spawnProcess: () => {
      spawnCount += 1;
      return fakeChild();
    },
  });

  const starting = listener.start();
  listener.stop();
  finishDiscovery({ pids: [10], rootPids: [10] });
  await starting;

  assert.equal(spawnCount, 0);
});

test("native listener skips full discovery on sticky alive PID", async () => {
  let discoveryCount = 0;
  const child = fakeChild();
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    minPollIntervalMs: 20,
    maxPollIntervalMs: 40,
    fullDiscoveryMaxAgeMs: 10_000,
    processDiscovery: async () => {
      discoveryCount += 1;
      return { pids: [10], rootPids: [10] };
    },
    pidAlive: () => true,
    spawnProcess: () => child,
  });

  await listener.start();
  assert.equal(discoveryCount, 1);
  await listener.poll();
  assert.equal(discoveryCount, 1);
  listener.stop();
});

test("native listener prefers a sticky root when multiple roots appear", async () => {
  const spawned = [];
  const first = fakeChild();
  const second = fakeChild();
  let round = 0;
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    fullDiscoveryMaxAgeMs: 0,
    processDiscovery: async () => {
      round += 1;
      return round === 1
        ? { pids: [20, 10], rootPids: [20, 10] }
        : { pids: [10, 20], rootPids: [10, 20] };
    },
    pidAlive: () => false,
    spawnProcess: () => {
      const child = spawned.length === 0 ? first : second;
      spawned.push(child);
      return child;
    },
  });

  await listener.start();
  assert.equal(listener.captureKey, "10");
  await listener.poll();
  assert.equal(listener.captureKey, "10");
  assert.equal(spawned.length, 1);
  listener.stop();
});

test("native listener maps typed exit codes to helper_error", async () => {
  const cases = [
    { exit: 10, helper: "native_helper_com_error", state: "launch_failed" },
    { exit: 11, helper: "native_helper_wasapi_error", state: "launch_failed" },
    { exit: 12, helper: "native_helper_device_error", state: "no_output" },
    { exit: 13, helper: "native_helper_wasapi_error", state: "launch_failed" },
  ];
  for (const entry of cases) {
    const statuses = [];
    const child = fakeChild();
    const listener = new NativeProcessAudioListener({
      platform: "win32",
      helperPath: __filename,
      processDiscovery: async () => ({ pids: [10], rootPids: [10] }),
      spawnProcess: () => child,
      onStatus: (status) => statuses.push(status),
    });

    await listener.start();
    child.emit("exit", entry.exit, null);
    await new Promise((resolve) => setTimeout(resolve, 5));

    const last = statuses.at(-1);
    assert.equal(last.helper_error, entry.helper, `exit ${entry.exit}`);
    assert.equal(last.state, entry.state, `exit ${entry.exit} state`);
    listener.stop();
  }
});

test("native listener maps NDJSON typed error codes to helper_error", async () => {
  const cases = [
    { code: 10, helper: "native_helper_com_error" },
    { code: 11, helper: "native_helper_wasapi_error" },
    { code: 12, helper: "native_helper_device_error" },
    { code: 13, helper: "native_helper_wasapi_error" },
  ];
  for (const entry of cases) {
    const statuses = [];
    const child = fakeChild();
    const listener = new NativeProcessAudioListener({
      platform: "win32",
      helperPath: __filename,
      processDiscovery: async () => ({ pids: [10], rootPids: [10] }),
      spawnProcess: () => child,
      onStatus: (status) => statuses.push(status),
    });

    await listener.start();
    child.stdout.emit(
      "data",
      `{"type":"error","code":${entry.code},"message":"typed failure ${entry.code}"}\n`,
    );
    await new Promise((resolve) => setTimeout(resolve, 5));

    const last = statuses.at(-1);
    assert.equal(last.helper_error, entry.helper, `ndjson code ${entry.code}`);
    listener.stop();
  }
});
