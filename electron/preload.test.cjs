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
  const { exposed, invocations, sent } = loadPreload("preload-avatar.cjs");
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
  await settings.get();
  assert.deepEqual(invocations, [
    ["voxavatar:get-snapshot"],
    ["voxavatar:settings-get"],
  ]);
  assert.deepEqual(sent, [["voxavatar:hide"]]);
});

test("settings preload exposes management APIs without avatar bridge", async () => {
  const { exposed, invocations, sent } = loadPreload("preload-settings.cjs");
  assert.deepEqual([...exposed.keys()], ["voxavatarSettings"]);
  assert.equal(exposed.has("voxavatarBridge"), false);
  const settings = exposed.get("voxavatarSettings");

  await settings.get();
  await settings.importModel({ model_name: "Studio Assistant" });
  await settings.deleteAllUserModels();
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
  assert.deepEqual(sent, [["voxavatar:settings-set-window-theme", "light"]]);
});
