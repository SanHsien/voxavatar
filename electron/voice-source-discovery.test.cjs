"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  listVoiceSources,
  processSources,
} = require("./voice-source-discovery.cjs");

test("lists Windows process sources and hides the VoxAvatar process tree", async () => {
  const catalog = await listVoiceSources({
    platform: "win32",
    ownProcessId: 10,
    run: async () => ({
      stdout: JSON.stringify([
        {
          ProcessId: 10,
          ParentProcessId: 1,
          Name: "VoxAvatar.exe",
          ExecutablePath: "C:\\Apps\\VoxAvatar\\VoxAvatar.exe",
          CommandLine: "VoxAvatar.exe",
        },
        {
          ProcessId: 20,
          ParentProcessId: 10,
          Name: "helper.exe",
          ExecutablePath: "C:\\Apps\\VoxAvatar\\helper.exe",
          CommandLine: "helper.exe",
        },
        {
          ProcessId: 30,
          ParentProcessId: 1,
          Name: "ChatGPT.exe",
          ExecutablePath: "C:\\Apps\\ChatGPT\\ChatGPT.exe",
          CommandLine: "ChatGPT.exe",
        },
      ]),
    }),
  });

  assert.equal(catalog.platform, "win32");
  assert.deepEqual(
    catalog.sources.map((source) => source.name),
    ["ChatGPT"],
  );
});

test("dedupes process sources by stable identity", () => {
  const sources = processSources("win32", [
    {
      pid: 1,
      parentId: 0,
      name: "Voice.exe",
      executable: "C:\\Apps\\Voice\\Voice.exe",
      command: "",
    },
    {
      pid: 2,
      parentId: 0,
      name: "Voice.exe",
      executable: "C:\\Apps\\Voice\\Voice.exe",
      command: "",
    },
  ], -1);
  assert.equal(sources.length, 1);
  assert.equal(sources[0].name, "Voice");
});
