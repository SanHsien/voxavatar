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
  await settings.getMcpStatus();
  await settings.getReadiness();
  await settings.getDiagnosticSummary();
  settings.setWindowTheme("light");

  assert.ok(
    invocations.some((row) => row[0] === "voxavatar:settings-import-model"),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-delete-all-user-models",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-add-unassigned-clips",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-update-clips-purpose",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-assign-vrma-by-filename",
    ),
  );
  assert.ok(
    invocations.some(
      (row) => row[0] === "voxavatar:settings-import-action-pack",
    ),
  );
  assert.deepEqual(sent, [["voxavatar:settings-set-window-theme", "light"]]);
});
