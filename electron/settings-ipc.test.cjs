"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { registerSettingsIpc } = require("./settings-ipc.cjs");

test("registerSettingsIpc registers the bulk of settings channels", () => {
  const registered = [];
  const handleTrustedIpc = (channel, handler) => {
    registered.push({ channel, handler, trusted: "any" });
  };
  const handleTrustedSettingsIpc = (channel, handler) => {
    registered.push({ channel, handler, trusted: "settings" });
  };

  registerSettingsIpc({
    app: { getVersion: () => "0.5.0" },
    path: require("node:path"),
    shell: { showItemInFolder: () => {} },
    handleTrustedIpc,
    handleTrustedSettingsIpc,
    settingsStore: {
      getSnapshot: () => ({}),
      importModel: () => ({}),
      importModelsFromPaths: () => ({ snapshot: {}, results: [] }),
      createAnimation: () => ({}),
      addAnimationClips: () => ({}),
      addAnimationClipsBestEffort: () => ({ snapshot: {}, results: [] }),
      setVrmaQualityGate: () => ({}),
      setVrmaReportDir: () => ({}),
      updateAnimation: () => ({}),
      deleteAnimation: () => ({}),
      deleteAnimationClip: () => ({}),
      reorderAnimationClip: () => ({}),
      resetPackagedAnimations: () => ({}),
      deleteModel: () => ({}),
      deleteAllUserModels: () => ({}),
      deleteAllUserAnimationClips: () => ({}),
      setDefaultModel: () => ({}),
      setCharacterSize: () => ({}),
      setIdleRestMs: () => ({}),
      setUiLocale: () => ({}),
      setVoiceSource: () => ({}),
      setModelLighting: () => ({}),
      resetModelLighting: () => ({}),
    },
    publishSettings: (snapshot) => snapshot,
    selectAssetFile: async () => null,
    selectAssetDirectory: async () => null,
    confirmDirectoryImport: async () => false,
    showAboutDialog: () => {},
    restartAudioListener: () => {},
    createMcpSettingsStatus: () => ({}),
    getAppReadinessSnapshot: () => ({}),
    getDiagnosticSummaryText: () => "summary",
    listVoiceSources: async () => ({ platform: "win32", sources: [] }),
    mcpServerPort: 47831,
    latestListenerStatus: null,
    mcpServerError: null,
    mcpServerHealth: "online",
    collectAssetFiles: () => ({ files: [], truncated: false }),
    normalizeQualityGate: (value) => value,
    analyzeVrmFiles: () => [],
    summarizeVrmReports: () => ({}),
    writeVrmMarkdownReport: () => null,
    analyzeVrmaFiles: () => [],
    summarizeReports: () => ({}),
    writeMarkdownReport: () => null,
    buildDirectoryImportSummary: () => ({}),
    evaluateDirectoryImport: () => ({
      quality: null,
      reportPath: null,
      reportError: null,
      importCandidates: [],
      skippedQuality: 0,
    }),
  });

  const channels = registered.map((entry) => entry.channel).sort();
  assert.ok(channels.includes("voxavatar:settings-get"));
  assert.ok(channels.includes("voxavatar:settings-import-model"));
  assert.ok(channels.includes("voxavatar:settings-get-mcp-status"));
  assert.equal(
    registered.filter((entry) => entry.trusted === "settings").length,
    channels.length - 1,
  );
});

test("registerSettingsIpc exports a function", () => {
  assert.equal(typeof registerSettingsIpc, "function");
});
