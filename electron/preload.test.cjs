"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadPreload() {
  const exposed = new Map();
  const invocations = [];
  const sent = [];
  const listeners = new Map();
  const electron = {
    contextBridge: {
      exposeInMainWorld(name, api) {
        exposed.set(name, api);
      },
    },
    ipcRenderer: {
      invoke(channel, ...args) {
        invocations.push([channel, ...args]);
        return Promise.resolve({ channel, args });
      },
      off(channel, handler) {
        listeners.get(channel)?.delete(handler);
      },
      on(channel, handler) {
        const handlers = listeners.get(channel) ?? new Set();
        handlers.add(handler);
        listeners.set(channel, handlers);
      },
      send(channel, ...args) {
        sent.push([channel, ...args]);
      },
    },
  };
  const source = fs.readFileSync(
    path.join(__dirname, "preload.cjs"),
    "utf8",
  );
  vm.runInNewContext(source, {
    require(id) {
      assert.equal(id, "electron");
      return electron;
    },
  });
  return { exposed, invocations, listeners, sent };
}

test("preload exposes only narrow VoxAvatar and settings IPC operations", async () => {
  const { exposed, invocations, listeners, sent } = loadPreload();
  const bridge = exposed.get("voxavatarBridge");
  const settings = exposed.get("voxavatarSettings");

  assert.deepEqual([...exposed.keys()], ["voxavatarBridge", "voxavatarSettings"]);
  await bridge.getSnapshot();
  bridge.hide();
  await settings.get();
  await settings.importModel({ model_name: "Studio Assistant" });
  await settings.importModelsFromDirectory({ model_name: "" });
  await settings.createAnimation({
    animation_name: "wave-hello",
    animation_description: "A friendly wave.",
    animation_trigger_scenario: "Use for greetings.",
  });
  await settings.addAnimationClips("animation-id");
  await settings.addAnimationClipsFromDirectory("animation-id");
  await settings.setVrmaQualityGate("strict");
  await settings.chooseVrmaReportDir();
  await settings.clearVrmaReportDir();
  await settings.updateAnimation("animation-id", {
    animation_name: "wave-hello",
    animation_description: "An updated friendly wave.",
    animation_trigger_scenario: "Use for greetings.",
  });
  await settings.deleteAnimation("animation-id");
  await settings.deleteAnimationClip("animation-id", "clip-id");
  await settings.resetPackagedAnimations();
  await settings.deleteModel("model-id");
  await settings.deleteAllUserModels();
  await settings.deleteAllUserAnimationClips();
  await settings.setDefaultModel("model-id");
  await settings.setCharacterSize(1.2);
  await settings.setUiLocale("en");
  await settings.setVoiceSource({
    mode: "custom",
    process_pattern: "local-tts",
  });
  await settings.listVoiceSources();
  await settings.setModelLighting("model-id", {
    exposure: 1.2,
    environment_intensity: 0.35,
  });
  await settings.resetModelLighting("model-id");
  await settings.getMcpStatus();
  settings.setWindowTheme("light");

  bridge.setIgnoreMouse(true);
  await bridge.getWindowBounds();
  bridge.moveWindow(10, 20);
  bridge.showContextMenu();
  const resetCalls = [];
  const unsubscribeReset = bridge.subscribeResetView(() => resetCalls.push(1));
  const resetHandler = [...listeners.get("voxavatar:reset-view")][0];
  resetHandler();
  unsubscribeReset();
  assert.deepEqual(resetCalls, [1]);

  assert.equal(
    JSON.stringify(invocations),
    JSON.stringify([
      ["voxavatar:get-snapshot"],
      ["voxavatar:settings-get"],
      ["voxavatar:settings-import-model", { model_name: "Studio Assistant" }],
      ["voxavatar:settings-import-models-from-directory", { model_name: "" }],
      [
        "voxavatar:settings-create-animation",
        {
          animation_name: "wave-hello",
          animation_description: "A friendly wave.",
          animation_trigger_scenario: "Use for greetings.",
        },
      ],
      ["voxavatar:settings-add-animation-clips", "animation-id"],
      ["voxavatar:settings-add-animation-clips-from-directory", "animation-id"],
      ["voxavatar:settings-set-vrma-quality-gate", "strict"],
      ["voxavatar:settings-choose-vrma-report-dir"],
      ["voxavatar:settings-clear-vrma-report-dir"],
      [
        "voxavatar:settings-update-animation",
        "animation-id",
        {
          animation_name: "wave-hello",
          animation_description: "An updated friendly wave.",
          animation_trigger_scenario: "Use for greetings.",
        },
      ],
      ["voxavatar:settings-delete-animation", "animation-id"],
      [
        "voxavatar:settings-delete-animation-clip",
        "animation-id",
        "clip-id",
      ],
      ["voxavatar:settings-reset-packaged-animations"],
      ["voxavatar:settings-delete-model", "model-id"],
      ["voxavatar:settings-delete-all-user-models"],
      ["voxavatar:settings-delete-all-user-animation-clips"],
      ["voxavatar:settings-set-default-model", "model-id"],
      ["voxavatar:settings-set-character-size", 1.2],
      ["voxavatar:settings-set-ui-locale", "en"],
      [
        "voxavatar:settings-set-voice-source",
        { mode: "custom", process_pattern: "local-tts" },
      ],
      ["voxavatar:settings-list-voice-sources"],
      [
        "voxavatar:settings-set-model-lighting",
        "model-id",
        {
          exposure: 1.2,
          environment_intensity: 0.35,
        },
      ],
      ["voxavatar:settings-reset-model-lighting", "model-id"],
      ["voxavatar:settings-get-mcp-status"],
      ["voxavatar:get-window-bounds"],
    ]),
  );
  assert.equal(
    JSON.stringify(sent),
    JSON.stringify([
      ["voxavatar:hide"],
      ["voxavatar:settings-set-window-theme", "light"],
      ["voxavatar:set-ignore-mouse", true],
      ["voxavatar:move-window", { x: 10, y: 20 }],
      ["voxavatar:avatar-context-menu"],
    ]),
  );

  const snapshots = [];
  const unsubscribe = settings.subscribe((snapshot) => snapshots.push(snapshot));
  const handler = [...listeners.get("voxavatar:settings-updated")][0];
  handler({}, { character_size: 1.3 });
  unsubscribe();
  assert.deepEqual(snapshots, [{ character_size: 1.3 }]);
  assert.equal(listeners.get("voxavatar:settings-updated").size, 0);
});
