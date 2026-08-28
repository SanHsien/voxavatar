"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadPreload(fileName) {
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
  const source = fs.readFileSync(path.join(__dirname, fileName), "utf8");
  vm.runInNewContext(source, {
    require(id) {
      assert.equal(id, "electron");
      return electron;
    },
  });
  return { exposed, invocations, listeners, sent };
}

test("avatar preload exposes bridge and read-only settings only", async () => {
  const { exposed, invocations, sent, listeners } = loadPreload(
    "preload-avatar.cjs",
  );
  assert.deepEqual([...exposed.keys()].sort(), [
    "voxavatarBridge",
    "voxavatarSettings",
  ]);
  const bridge = exposed.get("voxavatarBridge");
  const settings = exposed.get("voxavatarSettings");
  assert.equal(typeof settings.importModel, "undefined");
  assert.equal(typeof settings.deleteModel, "undefined");
  assert.equal(typeof settings.getMcpStatus, "undefined");

  await bridge.getSnapshot();
  bridge.hide();
  bridge.setIgnoreMouse(true);
  await bridge.getWindowBounds();
  bridge.moveWindow(12, 34);
  bridge.showContextMenu();
  const resetEvents = [];
  const bridgeEvents = [];
  const settingsEvents = [];
  const unsubReset = bridge.subscribeResetView(() => resetEvents.push(1));
  const unsubBridge = bridge.subscribe((payload) => bridgeEvents.push(payload));
  const unsubSettings = settings.subscribe((snapshot) =>
    settingsEvents.push(snapshot),
  );
  for (const handler of listeners.get("voxavatar:reset-view") ?? []) {
    handler();
  }
  for (const handler of listeners.get("voxavatar:event") ?? []) {
    handler({}, { type: "state" });
  }
  for (const handler of listeners.get("voxavatar:settings-updated") ?? []) {
    handler({}, { schema_version: 11 });
  }
  unsubReset();
  unsubBridge();
  unsubSettings();
  await settings.get();
  assert.deepEqual(
    invocations.map((row) => row[0]),
    [
      "voxavatar:get-snapshot",
      "voxavatar:get-window-bounds",
      "voxavatar:settings-get",
    ],
  );
  assert.equal(sent.length, 4);
  assert.equal(sent[0][0], "voxavatar:hide");
  assert.deepEqual(sent[1], ["voxavatar:set-ignore-mouse", true]);
  assert.equal(sent[2][0], "voxavatar:move-window");
  assert.equal(sent[2][1].x, 12);
  assert.equal(sent[2][1].y, 34);
  assert.equal(sent[3][0], "voxavatar:avatar-context-menu");
  assert.deepEqual(resetEvents, [1]);
  assert.deepEqual(bridgeEvents, [{ type: "state" }]);
  assert.deepEqual(settingsEvents, [{ schema_version: 11 }]);
});

test("settings preload exposes management APIs without avatar bridge", async () => {
  const { exposed, invocations, sent } = loadPreload("preload-settings.cjs");
  assert.deepEqual([...exposed.keys()], ["voxavatarSettings"]);
  assert.equal(exposed.has("voxavatarBridge"), false);
  const settings = exposed.get("voxavatarSettings");

  await settings.get();
  await settings.importModel({ model_name: "Studio Assistant" });
  await settings.deleteAllUserModels();
  await settings.addUnassignedClips();
  await settings.updateUnassignedClip("clip-pool", { purpose: "loop" });
  await settings.assignUnassignedClip("clip-pool", "anim-1");
  await settings.moveAnimationClipToUnassigned("anim-1", "clip-1");
  await settings.updateClipsPurpose(
    [{ clipId: "clip-pool", pool: true }],
    "pose",
  );
  await settings.assignVrmaByFilename();
  await settings.importActionPack();
  await settings.importModelsFromDirectory({ model_name: "Batch" });
  await settings.setVrmaQualityGate("keep");
  await settings.chooseVrmaReportDir();
  await settings.clearVrmaReportDir();
  await settings.revealPath("C:\\Users\\example\\file.vrm");
  await settings.setModelLighting("m1", { exposure: 1 });
  await settings.resetModelLighting("m1");
  await settings.moveAnimationClip("a1", "c1", "a2");
  await settings.updateAnimationClip("a1", "c1", { purpose: "loop" });
  await settings.createAnimation({ animation_name: "idle" });
  await settings.addAnimationClips("a1");
  await settings.addAnimationClipsFromDirectory("a1");
  await settings.setVrmaQualityScoreThresholds({ keep: 80 });
  await settings.updateAnimation("a1", { animation_name: "idle2" });
  await settings.deleteAnimation("a1");
  await settings.deleteAnimationClip("a1", "c1");
  await settings.reorderAnimationClip("a1", "c1", "up");
  await settings.deleteUnassignedClip("clip-pool");
  await settings.resetPackagedAnimations();
  await settings.deleteModel("m1");
  await settings.deleteAllUserAnimationClips();
  await settings.setDefaultModel("m1");
  await settings.setCharacterSize(0.5);
  await settings.setIdlePoolAnimationEnabled("happy", false);
  await settings.setIdleRestMs(1000);
  await settings.setUiLocale("zh-TW");
  await settings.getMcpStatus();
  await settings.getReadiness();
  await settings.getDiagnosticSummary();
  settings.setWindowTheme("light");

  const expectedChannels = [
    "voxavatar:settings-get",
    "voxavatar:settings-import-model",
    "voxavatar:settings-delete-all-user-models",
    "voxavatar:settings-add-unassigned-clips",
    "voxavatar:settings-update-unassigned-clip",
    "voxavatar:settings-assign-unassigned-clip",
    "voxavatar:settings-move-animation-clip-to-unassigned",
    "voxavatar:settings-update-clips-purpose",
    "voxavatar:settings-assign-vrma-by-filename",
    "voxavatar:settings-import-action-pack",
    "voxavatar:settings-import-models-from-directory",
    "voxavatar:settings-set-vrma-quality-gate",
    "voxavatar:settings-choose-vrma-report-dir",
    "voxavatar:settings-clear-vrma-report-dir",
    "voxavatar:settings-reveal-path",
    "voxavatar:settings-set-model-lighting",
    "voxavatar:settings-reset-model-lighting",
    "voxavatar:settings-move-animation-clip",
    "voxavatar:settings-update-animation-clip",
    "voxavatar:settings-create-animation",
    "voxavatar:settings-add-animation-clips",
    "voxavatar:settings-add-animation-clips-from-directory",
    "voxavatar:settings-set-vrma-quality-score-thresholds",
    "voxavatar:settings-update-animation",
    "voxavatar:settings-delete-animation",
    "voxavatar:settings-delete-animation-clip",
    "voxavatar:settings-reorder-animation-clip",
    "voxavatar:settings-delete-unassigned-clip",
    "voxavatar:settings-reset-packaged-animations",
    "voxavatar:settings-delete-model",
    "voxavatar:settings-delete-all-user-animation-clips",
    "voxavatar:settings-set-default-model",
    "voxavatar:settings-set-character-size",
    "voxavatar:settings-set-idle-pool-animation-enabled",
    "voxavatar:settings-set-idle-rest-ms",
    "voxavatar:settings-set-ui-locale",
    "voxavatar:settings-get-mcp-status",
    "voxavatar:settings-get-readiness",
    "voxavatar:settings-get-diagnostic-summary",
  ];
  for (const channel of expectedChannels) {
    assert.ok(
      invocations.some((row) => row[0] === channel),
      `missing invoke ${channel}`,
    );
  }
  await settings.getAppInfo();
  await settings.showAbout();
  await settings.listVoiceSources();
  await settings.setVoiceSource({ mode: "external" });
  await settings.setStateSlotBinding("idle", "idle");
  await settings.setStateSlotBindings({ speaking: "speaking" });
  await settings.setMcpShowMessageEnabled(true);
  assert.ok(
    invocations.some((row) => row[0] === "voxavatar:settings-get-app-info"),
  );
  assert.ok(
    invocations.some((row) => row[0] === "voxavatar:settings-show-about"),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-list-voice-sources",
    ),
  );
  assert.ok(
    invocations.some((row) => row[0] === "voxavatar:settings-set-voice-source"),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-set-state-slot-binding",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-set-state-slot-bindings",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-set-mcp-show-message-enabled",
    ),
  );
  assert.deepEqual(sent, [["voxavatar:settings-set-window-theme", "light"]]);
});
