"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  configuredPattern,
  isPidAlive,
  parseWindowsProcessList,
  selectStickyRootPid,
  selectVoiceProcessTree,
} = require("./process-discovery.cjs");

test("parses one or many Windows CIM process records", () => {
  const processes = parseWindowsProcessList(
    JSON.stringify([
      {
        ProcessId: 100,
        ParentProcessId: 1,
        Name: "Codex.exe",
        ExecutablePath: "C:\\Program Files\\Codex\\Codex.exe",
        CommandLine: '"C:\\\\Program Files\\\\Codex\\\\Codex.exe"',
      },
      {
        ProcessId: 101,
        ParentProcessId: 100,
        Name: "electron.exe",
        ExecutablePath: "C:\\Program Files\\Codex\\electron.exe",
        CommandLine: "electron.exe --type=utility",
      },
    ]),
  );
  assert.equal(processes[0].executable, "C:\\Program Files\\Codex\\Codex.exe");
  assert.deepEqual(selectVoiceProcessTree(processes, { ownProcessId: 999 }), {
    pids: [100, 101],
    rootPids: [100],
  });
  assert.equal(parseWindowsProcessList('{"ProcessId":7,"Name":"ChatGPT.exe"}')[0].pid, 7);
});

test("selects processes by stable application source id", () => {
  const processes = [
    {
      pid: 50,
      parentId: 1,
      name: "Voice.exe",
      executable: "C:\\Apps\\Voice\\Voice.exe",
      command: "",
    },
    {
      pid: 51,
      parentId: 1,
      name: "Codex.exe",
      executable: "C:\\Apps\\Codex\\Codex.exe",
      command: "",
    },
  ];
  const sourceId = require("./voice-source.cjs").processSourceId(
    "win32",
    processes[0],
  );
  assert.deepEqual(
    selectVoiceProcessTree(processes, {
      ownProcessId: 999,
      platform: "win32",
      sourceId,
    }),
    { pids: [50], rootPids: [50] },
  );
});

test("supports a custom target application pattern without accepting invalid regex", () => {
  assert.equal(configuredPattern({ VOXAVATAR_TARGET_PROCESS_PATTERN: "my-voice-app" }).test("my-voice-app"), true);
  assert.equal(configuredPattern({ VOXAVATAR_TARGET_PROCESS_PATTERN: "[" }).test("Codex"), true);
});

test("selects processes with an explicit pattern override", () => {
  const selected = selectVoiceProcessTree(
    [
      {
        pid: 50,
        parentId: 1,
        name: "local-tts",
        command: "/usr/bin/local-tts",
      },
      {
        pid: 51,
        parentId: 1,
        name: "Codex",
        command: "/Applications/Codex.app/Contents/MacOS/Codex",
      },
    ],
    { ownProcessId: 999, pattern: /local-tts/i },
  );
  assert.deepEqual(selected, { pids: [50], rootPids: [50] });
});

test("does not confuse VoxAvatar's project path with the Codex application", () => {
  const selected = selectVoiceProcessTree(
    [
      {
        pid: 40,
        parentId: 1,
        name: "voxavatar",
        command: "C:\\Users\\user\\Projects\\voxavatar\\release\\voxavatar.exe",
      },
    ],
    { ownProcessId: 999 },
  );
  assert.deepEqual(selected, { pids: [], rootPids: [] });
});

test("sticky root keeps the previous PID when it remains available", () => {
  assert.equal(selectStickyRootPid([30, 10, 20], 20), 20);
  assert.equal(selectStickyRootPid([30, 10, 20], 99), 10);
  assert.equal(selectStickyRootPid([], 20), null);
  assert.equal(isPidAlive(20, { killProcess: () => true }), true);
  assert.equal(
    isPidAlive(20, {
      killProcess: () => {
        throw new Error("ESRCH");
      },
    }),
    false,
  );
});
