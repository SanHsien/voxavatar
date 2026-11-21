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

test("environment target overrides output and external modes before helper launch", async (t) => {
  const { createAudioListener } = require("./audio-listener.cjs");
  const { discoverVoiceProcesses } = require("./process-discovery.cjs");
  for (const mode of ["default", "custom", "application", "output", "external"]) {
    await t.test(mode, async () => {
      const launches = [];
      const statuses = [];
      const activities = [];
      const child = fakeChild();
      let processes = [];
      const listener = createAudioListener({
        platform: "win32", helperPath: __filename,
        voiceSource: mode === "application"
          ? { mode, source_id: "process:win32:dm9pY2UuZXhl", source_name: "Voice" }
          : { mode, process_pattern: "settings-player" },
        environment: { VOXAVATAR_TARGET_PROCESS_PATTERN: "unique-player" },
        processDiscovery: (options) => discoverVoiceProcesses({
          ...options, run: async () => ({ stdout: JSON.stringify(processes) }),
        }),
        spawnProcess: (file, args, options) => {
          launches.push({ file, args, options });
          return child;
        },
        onStatus: (status) => statuses.push(status),
        onActivity: (activity) => activities.push(activity),
      });
      assert.ok(listener, "env target must enable process capture even in external mode");
      t.after(() => listener.stop());
      await listener.start();
      assert.equal(statuses.at(-1).state, "target_missing");
      assert.equal(launches.length, 0);
      processes = [{ ProcessId: 20, ParentProcessId: 1, Name: "unique-player.exe" }];
      await listener.poll();
      assert.equal(launches[0].file, __filename);
      assert.deepEqual(launches[0].args, ["--pid", "20"]);
      assert.equal(launches[0].options.windowsHide, true);
      child.stdout.emit("data", '{"type":"ready","source":"Windows process audio"}\r\n{"type":"lev');
      assert.equal(statuses.at(-1).state, "no_output");
      child.stdout.emit("data", 'el","level":0.800000}\r\n');
      assert.equal(statuses.at(-1).state, "listening");
      assert.equal(activities.at(-1), "speaking");
      listener.endSession();
      assert.equal(statuses.at(-1).state, "no_output");
    });
  }
});

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
    { exit: 13, helper: "native_helper_event_error", state: "launch_failed" },
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
    { code: 13, helper: "native_helper_event_error" },
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

function discoveryTimeout() {
  // What execFile throws on timeout: the message carries the command line.
  const error = new Error(
    "Command failed: powershell.exe -NoLogo -NoProfile -NonInteractive -Command Get-CimInstance Win32_Process",
  );
  error.killed = true;
  error.signal = "SIGTERM";
  return error;
}

function discoveryHarness({ results }) {
  const statuses = [];
  const launches = [];
  const children = [];
  let calls = 0;
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    voiceSource: { mode: "custom", process_pattern: "unique-player" },
    environment: {},
    pidAlive: () => true,
    // Force a full discovery on every poll so each step hits the query.
    fullDiscoveryMaxAgeMs: 0,
    processDiscovery: async () => {
      const next = results[Math.min(calls, results.length - 1)];
      calls += 1;
      if (next instanceof Error) throw next;
      return next;
    },
    spawnProcess: (file, args) => {
      const child = fakeChild();
      children.push(child);
      launches.push(args);
      return child;
    },
    onStatus: (status) => statuses.push(status),
  });
  return { listener, statuses, launches, children, calls: () => calls };
}

test("a discovery timeout keeps a running capture and its status, then carries on", async (t) => {
  const found = { pids: [20], rootPids: [20] };
  const harness = discoveryHarness({
    results: [found, discoveryTimeout(), discoveryTimeout(), found],
  });
  const { listener, statuses, launches, children } = harness;
  t.after(() => listener.stop());
  await listener.start();
  children[0].stdout.emit("data", '{"type":"ready","source":"Windows process audio"}\n');
  assert.equal(statuses.at(-1).state, "no_output");
  assert.equal(statuses.at(-1).capturing, true);

  let killed = 0;
  const kill = children[0].kill;
  children[0].kill = () => {
    killed += 1;
    kill();
  };
  await listener.poll();
  await listener.poll();
  assert.equal(
    statuses.at(-1).state,
    "no_output",
    "a failed query must not replace a healthy status",
  );
  assert.equal(statuses.some((status) => status.state === "launch_failed"), false);
  assert.equal(killed, 0, "the helper keeps capturing while discovery is unavailable");

  await listener.poll();
  assert.equal(harness.calls(), 4);
  assert.equal(launches.length, 1, "the same target must not be relaunched after recovery");
  assert.equal(statuses.at(-1).state, "no_output");
  children[0].stdout.emit("data", '{"type":"level","level":0.5}\n');
  assert.equal(statuses.at(-1).state, "listening");
});

test("without a capture, a discovery timeout reports a short error, backs off, and recovers", async (t) => {
  const harness = discoveryHarness({
    results: [
      discoveryTimeout(),
      discoveryTimeout(),
      { pids: [], rootPids: [] },
      { pids: [20], rootPids: [20] },
    ],
  });
  const { listener, statuses, launches, children } = harness;
  t.after(() => listener.stop());
  await listener.start();
  assert.equal(statuses.at(-1).state, "launch_failed");
  assert.equal(statuses.at(-1).error, "Process discovery failed.");
  assert.equal(statuses.at(-1).monitoring, true);
  const firstBackoff = listener.pollIntervalMs;
  assert.ok(
    firstBackoff > listener.minPollIntervalMs,
    "a failed query must slow the next attempt",
  );
  assert.ok(listener.pollTimer, "a retry stays scheduled after a failure");

  await listener.poll();
  assert.ok(listener.pollIntervalMs > firstBackoff, "repeated failures keep backing off");
  assert.ok(listener.pollIntervalMs <= listener.maxPollIntervalMs);
  for (const status of statuses) {
    assert.doesNotMatch(status.error ?? "", /powershell|Get-CimInstance|Command failed/i);
  }

  await listener.poll();
  assert.equal(
    statuses.at(-1).state,
    "target_missing",
    "the next successful query clears the error",
  );
  assert.equal(statuses.at(-1).error, undefined);
  assert.equal(listener.pollIntervalMs, listener.minPollIntervalMs);

  await listener.poll();
  assert.deepEqual(launches, [["--pid", "20"]]);
  children[0].stdout.emit("data", '{"type":"ready","source":"Windows process audio"}\n');
  assert.equal(statuses.at(-1).state, "no_output");
});

test("a timed-out real query surfaces the classified short message in listener status", async (t) => {
  const { discoverVoiceProcesses } = require("./process-discovery.cjs");
  const statuses = [];
  const listener = new NativeProcessAudioListener({
    platform: "win32",
    helperPath: __filename,
    voiceSource: { mode: "custom", process_pattern: "unique-player" },
    environment: {},
    processDiscovery: (options) =>
      discoverVoiceProcesses({
        ...options,
        run: async () => {
          throw discoveryTimeout();
        },
      }),
    onStatus: (status) => statuses.push(status),
  });
  t.after(() => listener.stop());
  await listener.start();
  assert.equal(statuses.at(-1).state, "launch_failed");
  assert.equal(statuses.at(-1).error, "Process discovery timed out.");
});
