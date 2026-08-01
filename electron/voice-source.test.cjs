"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  DEFAULT_VOICE_APP_PATTERN,
  DEFAULT_VOICE_SOURCE,
  compileVoiceSourcePattern,
  configuredPattern,
  normalizeVoiceSource,
  processMatchesSource,
  resolveVoiceSourcePattern,
  sanitizeVoiceSource,
  sanitizeVoiceSourcePattern,
  settingsPatternFromVoiceSource,
  sourceFromProcess,
} = require("./voice-source.cjs");

test("compiles the shared default ChatGPT and Codex pattern", () => {
  assert.equal(DEFAULT_VOICE_APP_PATTERN.test("Codex"), true);
  assert.equal(DEFAULT_VOICE_APP_PATTERN.test("ChatGPT.exe"), true);
  assert.equal(DEFAULT_VOICE_APP_PATTERN.test("openai-codex"), true);
  assert.equal(DEFAULT_VOICE_APP_PATTERN.test("notepad"), false);
  assert.equal(
    compileVoiceSourcePattern("[").source,
    DEFAULT_VOICE_APP_PATTERN.source,
  );
});

test("prefers the environment override, then settings, then the default", () => {
  const fromEnv = resolveVoiceSourcePattern({
    environment: { VOXAVATAR_TARGET_PROCESS_PATTERN: "local-tts" },
    settingsPattern: "settings-app",
  });
  assert.equal(fromEnv.test("local-tts"), true);
  assert.equal(fromEnv.test("settings-app"), false);

  const fromSettings = resolveVoiceSourcePattern({
    environment: {},
    settingsPattern: "settings-app",
  });
  assert.equal(fromSettings.test("settings-app"), true);
  assert.equal(fromSettings.test("Codex"), false);

  const fromDefault = resolveVoiceSourcePattern({
    environment: {},
    settingsPattern: null,
  });
  assert.equal(fromDefault.test("Codex"), true);
  assert.equal(configuredPattern({}).test("ChatGPT"), true);
});

test("sanitizes and normalizes persisted voice source values", () => {
  assert.equal(sanitizeVoiceSourcePattern("  my-voice-app  "), "my-voice-app");
  assert.throws(() => sanitizeVoiceSourcePattern(""), /required/);
  assert.throws(() => sanitizeVoiceSourcePattern("["), /valid regular expression/);
  assert.deepEqual(normalizeVoiceSource(null), DEFAULT_VOICE_SOURCE);
  assert.deepEqual(
    normalizeVoiceSource({ mode: "custom", process_pattern: "local-tts" }),
    {
      mode: "custom",
      process_pattern: "local-tts",
      source_id: null,
      source_name: null,
    },
  );
  assert.deepEqual(
    normalizeVoiceSource({ mode: "custom", process_pattern: "[" }),
    DEFAULT_VOICE_SOURCE,
  );
  assert.equal(
    settingsPatternFromVoiceSource({
      mode: "custom",
      process_pattern: "local-tts",
    }),
    "local-tts",
  );
  assert.equal(settingsPatternFromVoiceSource(DEFAULT_VOICE_SOURCE), null);
});

test("normalizes all voice modes and rejects arbitrary application IDs", () => {
  assert.deepEqual(
    sanitizeVoiceSource({
      mode: "external",
      process_pattern: "ignored",
      source_id: "ignored",
      source_name: "Ignored",
    }),
    {
      mode: "external",
      process_pattern: null,
      source_id: null,
      source_name: null,
    },
  );
  assert.deepEqual(
    sanitizeVoiceSource({
      mode: "output",
      process_pattern: "ignored",
      source_id: "ignored",
      source_name: "Ignored",
    }),
    {
      mode: "output",
      process_pattern: null,
      source_id: null,
      source_name: null,
    },
  );
  assert.deepEqual(
    normalizeVoiceSource({
      mode: "application",
      source_id: "arbitrary",
      source_name: "Voice",
    }),
    DEFAULT_VOICE_SOURCE,
  );
  assert.throws(
    () =>
      sanitizeVoiceSource({
        mode: "application",
        source_id: "arbitrary",
        source_name: "Voice",
      }),
    /valid application/,
  );
  for (const source_id of [
    "process:darwin:Zm9v",
    "pipewire:application:Zm9v",
    "pipewire:stream:Zm9v",
  ]) {
    assert.throws(
      () =>
        sanitizeVoiceSource({
          mode: "application",
          source_id,
          source_name: "Legacy source",
        }),
      /valid application/,
    );
  }
});

test("creates stable native process sources and matches Windows paths case-insensitively", () => {
  const source = sourceFromProcess("win32", {
    name: "Voice.exe",
    executable: "C:\\Apps\\Voice\\Voice.exe",
  });
  assert.equal(source.name, "Voice");
  assert.equal(
    processMatchesSource(
      {
        name: "voice.exe",
        executable: "c:\\apps\\voice\\voice.exe",
      },
      "win32",
      source.id,
    ),
    true,
  );
  assert.equal(sourceFromProcess("darwin", { name: "Voice" }), null);
  assert.equal(sourceFromProcess("linux", { name: "Voice" }), null);
});
