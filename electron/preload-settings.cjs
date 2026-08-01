"use strict";

const { contextBridge, ipcRenderer } = require("electron");

/** Settings 視窗：完整設定／資產／診斷 API；不含 avatar bridge。 */
contextBridge.exposeInMainWorld("voxavatarSettings", {
  get: () => ipcRenderer.invoke("voxavatar:settings-get"),
  importModel: (metadata) =>
    ipcRenderer.invoke("voxavatar:settings-import-model", metadata),
  importModelsFromDirectory: (metadata) =>
    ipcRenderer.invoke(
      "voxavatar:settings-import-models-from-directory",
      metadata,
    ),
  createAnimation: (metadata) =>
    ipcRenderer.invoke("voxavatar:settings-create-animation", metadata),
  addAnimationClips: (animationId) =>
    ipcRenderer.invoke("voxavatar:settings-add-animation-clips", animationId),
  addAnimationClipsFromDirectory: (animationId) =>
    ipcRenderer.invoke(
      "voxavatar:settings-add-animation-clips-from-directory",
      animationId,
    ),
  setVrmaQualityGate: (value) =>
    ipcRenderer.invoke("voxavatar:settings-set-vrma-quality-gate", value),
  chooseVrmaReportDir: () =>
    ipcRenderer.invoke("voxavatar:settings-choose-vrma-report-dir"),
  clearVrmaReportDir: () =>
    ipcRenderer.invoke("voxavatar:settings-clear-vrma-report-dir"),
  updateAnimation: (animationId, metadata) =>
    ipcRenderer.invoke(
      "voxavatar:settings-update-animation",
      animationId,
      metadata,
    ),
  deleteAnimation: (animationId) =>
    ipcRenderer.invoke("voxavatar:settings-delete-animation", animationId),
  deleteAnimationClip: (animationId, clipId) =>
    ipcRenderer.invoke(
      "voxavatar:settings-delete-animation-clip",
      animationId,
      clipId,
    ),
  reorderAnimationClip: (animationId, clipId, direction) =>
    ipcRenderer.invoke(
      "voxavatar:settings-reorder-animation-clip",
      animationId,
      clipId,
      direction,
    ),
  revealPath: (targetPath) =>
    ipcRenderer.invoke("voxavatar:settings-reveal-path", targetPath),
  resetPackagedAnimations: () =>
    ipcRenderer.invoke("voxavatar:settings-reset-packaged-animations"),
  deleteModel: (modelId) =>
    ipcRenderer.invoke("voxavatar:settings-delete-model", modelId),
  deleteAllUserModels: () =>
    ipcRenderer.invoke("voxavatar:settings-delete-all-user-models"),
  deleteAllUserAnimationClips: () =>
    ipcRenderer.invoke("voxavatar:settings-delete-all-user-animation-clips"),
  setDefaultModel: (modelId) =>
    ipcRenderer.invoke("voxavatar:settings-set-default-model", modelId),
  setCharacterSize: (size) =>
    ipcRenderer.invoke("voxavatar:settings-set-character-size", size),
  setIdleRestMs: (ms) =>
    ipcRenderer.invoke("voxavatar:settings-set-idle-rest-ms", ms),
  setUiLocale: (locale) =>
    ipcRenderer.invoke("voxavatar:settings-set-ui-locale", locale),
  setVoiceSource: (voiceSource) =>
    ipcRenderer.invoke("voxavatar:settings-set-voice-source", voiceSource),
  listVoiceSources: () =>
    ipcRenderer.invoke("voxavatar:settings-list-voice-sources"),
  setModelLighting: (modelId, lighting) =>
    ipcRenderer.invoke(
      "voxavatar:settings-set-model-lighting",
      modelId,
      lighting,
    ),
  resetModelLighting: (modelId) =>
    ipcRenderer.invoke("voxavatar:settings-reset-model-lighting", modelId),
  getMcpStatus: () =>
    ipcRenderer.invoke("voxavatar:settings-get-mcp-status"),
  getReadiness: () =>
    ipcRenderer.invoke("voxavatar:settings-get-readiness"),
  getDiagnosticSummary: () =>
    ipcRenderer.invoke("voxavatar:settings-get-diagnostic-summary"),
  getAppInfo: () => ipcRenderer.invoke("voxavatar:settings-get-app-info"),
  showAbout: () => ipcRenderer.invoke("voxavatar:settings-show-about"),
  setWindowTheme: (theme) =>
    ipcRenderer.send("voxavatar:settings-set-window-theme", theme),
  subscribe: (listener) => {
    const handler = (_event, snapshot) => listener(snapshot);
    ipcRenderer.on("voxavatar:settings-updated", handler);
    return () => ipcRenderer.off("voxavatar:settings-updated", handler);
  },
});
