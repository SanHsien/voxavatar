"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/** Avatar overlay：視窗／事件 bridge，加上唯讀 settings 快照。 */
contextBridge.exposeInMainWorld("voxavatarBridge", {
  getSnapshot: () => ipcRenderer.invoke("voxavatar:get-snapshot"),
  hide: () => ipcRenderer.send("voxavatar:hide"),
  setIgnoreMouse: (ignore) =>
    ipcRenderer.send("voxavatar:set-ignore-mouse", ignore),
  getWindowBounds: () => ipcRenderer.invoke("voxavatar:get-window-bounds"),
  moveWindow: (x, y) => ipcRenderer.send("voxavatar:move-window", { x, y }),
  showContextMenu: () => ipcRenderer.send("voxavatar:avatar-context-menu"),
  subscribeResetView: (listener) => {
    const handler = () => listener();
    ipcRenderer.on("voxavatar:reset-view", handler);
    return () => ipcRenderer.off("voxavatar:reset-view", handler);
  },
  subscribe: (listener) => {
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("voxavatar:event", handler);
    return () => ipcRenderer.off("voxavatar:event", handler);
  },
});

contextBridge.exposeInMainWorld("voxavatarSettings", {
  get: () => ipcRenderer.invoke("voxavatar:settings-get"),
  subscribe: (listener) => {
    const handler = (_event, snapshot) => listener(snapshot);
    ipcRenderer.on("voxavatar:settings-updated", handler);
    return () => ipcRenderer.off("voxavatar:settings-updated", handler);
  },
});
