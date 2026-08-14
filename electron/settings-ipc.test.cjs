"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { registerSettingsIpc } = require("./settings-ipc.cjs");

function createIpcHarness(overrides = {}) {
  const registered = new Map();
  const calls = [];
  const snapshot = overrides.snapshot ?? {
    animations: [
      {
        id: "anim-idle",
        animation_name: "idle",
        animation_type: "IDLE",
        clips: [{ id: "c1" }],
      },
    ],
  };
  const restOverrides = { ...overrides };
  const storeOverrides = restOverrides.settingsStore;
  delete restOverrides.snapshot;
  delete restOverrides.settingsStore;
  const deps = {
    app: { getVersion: () => "0.16.12" },
    path: require("node:path"),
    shell: { showItemInFolder: () => {} },
    handleTrustedIpc: (channel, handler) => {
      registered.set(channel, handler);
    },
    handleTrustedSettingsIpc: (channel, handler) => {
      registered.set(channel, handler);
    },
    settingsStore: {
      getSnapshot: () => snapshot,
      importModel: () => snapshot,
      importModelsFromPaths: () => ({ snapshot, results: [] }),
      createAnimation: () => snapshot,
      addAnimationClips: () => snapshot,
      addAnimationClipsBestEffort: (animationId, paths) => {
        calls.push(["addAnimationClipsBestEffort", animationId, paths]);
        return {
          snapshot,
          results: paths.map((filePath) => ({
            filePath,
            ok: true,
            error: null,
          })),
        };
      },
      setVrmaQualityGate: () => snapshot,
      setVrmaReportDir: () => snapshot,
      updateAnimation: () => snapshot,
      updateAnimationClip: () => snapshot,
      moveAnimationClip: () => snapshot,
      deleteAnimation: () => snapshot,
      deleteAnimationClip: () => snapshot,
      reorderAnimationClip: () => snapshot,
      addUnassignedClips: () => snapshot,
      updateUnassignedClip: () => snapshot,
      deleteUnassignedClip: () => snapshot,
      assignUnassignedClip: () => snapshot,
      moveAnimationClipToUnassigned: () => snapshot,
      updateClipsPurpose: () => snapshot,
      resetPackagedAnimations: () => snapshot,
      deleteModel: () => snapshot,
      deleteAllUserModels: () => snapshot,
      deleteAllUserAnimationClips: () => snapshot,
      setDefaultModel: () => snapshot,
      setCharacterSize: () => snapshot,
      setIdleRestMs: () => snapshot,
      setUiLocale: () => snapshot,
      setVoiceSource: () => snapshot,
      setModelLighting: () => snapshot,
      resetModelLighting: () => snapshot,
      ...storeOverrides,
    },
    publishSettings: (value) => {
      calls.push(["publish", value]);
      return value;
    },
    selectAssetFile: async () => [],
    selectAssetDirectory: async () => null,
    selectActionPackFile: async () => null,
    importActionPackFromPath: () => ({ snapshot, imported: 0 }),
    confirmDirectoryImport: async () => false,
    confirmAssignByFilename: async () => false,
    showAboutDialog: () => {},
    restartAudioListener: () => {},
    createMcpSettingsStatus: () => ({}),
    getAppReadinessSnapshot: () => ({}),
    getDiagnosticSummaryText: () => "summary",
    listVoiceSources: async () => ({ platform: "win32", sources: [] }),
    getIntegrationRuntimeState: () => ({
      mcpServerPort: 47831,
      latestListenerStatus: null,
      mcpServerError: null,
      mcpServerHealth: "online",
    }),
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
    suggestVrmaAssignments: () => [],
    assignableVrmaSuggestions: (items) =>
      items.filter((item) => item.animationId),
    ...restOverrides,
  };
  registerSettingsIpc(deps);
  return { registered, calls, snapshot, deps };
}

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
      updateAnimationClip: () => ({}),
      moveAnimationClip: () => ({}),
      deleteAnimation: () => ({}),
      deleteAnimationClip: () => ({}),
      reorderAnimationClip: () => ({}),
      addUnassignedClips: () => ({}),
      updateUnassignedClip: () => ({}),
      deleteUnassignedClip: () => ({}),
      assignUnassignedClip: () => ({}),
      moveAnimationClipToUnassigned: () => ({}),
      updateClipsPurpose: () => ({}),
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
    getIntegrationRuntimeState: () => ({
      mcpServerPort: 47831,
      latestListenerStatus: null,
      mcpServerError: null,
      mcpServerHealth: "online",
    }),
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
  const expectedChannels = [
    "voxavatar:settings-add-animation-clips",
    "voxavatar:settings-add-animation-clips-from-directory",
    "voxavatar:settings-add-unassigned-clips",
    "voxavatar:settings-assign-unassigned-clip",
    "voxavatar:settings-assign-vrma-by-filename",
    "voxavatar:settings-choose-vrma-report-dir",
    "voxavatar:settings-clear-vrma-report-dir",
    "voxavatar:settings-create-animation",
    "voxavatar:settings-delete-all-user-animation-clips",
    "voxavatar:settings-delete-all-user-models",
    "voxavatar:settings-delete-animation",
    "voxavatar:settings-delete-animation-clip",
    "voxavatar:settings-delete-model",
    "voxavatar:settings-delete-unassigned-clip",
    "voxavatar:settings-get",
    "voxavatar:settings-get-app-info",
    "voxavatar:settings-get-diagnostic-summary",
    "voxavatar:settings-get-mcp-status",
    "voxavatar:settings-get-readiness",
    "voxavatar:settings-import-action-pack",
    "voxavatar:settings-import-model",
    "voxavatar:settings-import-models-from-directory",
    "voxavatar:settings-list-voice-sources",
    "voxavatar:settings-move-animation-clip",
    "voxavatar:settings-move-animation-clip-to-unassigned",
    "voxavatar:settings-reorder-animation-clip",
    "voxavatar:settings-reset-model-lighting",
    "voxavatar:settings-reset-packaged-animations",
    "voxavatar:settings-reveal-path",
    "voxavatar:settings-set-character-size",
    "voxavatar:settings-set-default-model",
    "voxavatar:settings-set-idle-rest-ms",
    "voxavatar:settings-set-mcp-show-message-enabled",
    "voxavatar:settings-set-model-lighting",
    "voxavatar:settings-set-state-slot-binding",
    "voxavatar:settings-set-state-slot-bindings",
    "voxavatar:settings-set-ui-locale",
    "voxavatar:settings-set-voice-source",
    "voxavatar:settings-set-vrma-quality-gate",
    "voxavatar:settings-set-vrma-quality-score-thresholds",
    "voxavatar:settings-show-about",
    "voxavatar:settings-update-animation",
    "voxavatar:settings-update-animation-clip",
    "voxavatar:settings-update-clips-purpose",
    "voxavatar:settings-update-unassigned-clip",
  ];
  assert.deepEqual(channels, expectedChannels);
  assert.equal(
    registered.filter((entry) => entry.trusted === "settings").length,
    channels.length - 1,
  );
});

test("registerSettingsIpc exports a function", () => {
  assert.equal(typeof registerSettingsIpc, "function");
});

test("registerSettingsIpc forwards unassigned pool and purpose handlers", async () => {
  const registered = new Map();
  const calls = [];
  const snapshot = { ok: true };
  registerSettingsIpc({
    app: { getVersion: () => "0.16.11" },
    path: require("node:path"),
    shell: { showItemInFolder: () => {} },
    handleTrustedIpc: (channel, handler) => {
      registered.set(channel, handler);
    },
    handleTrustedSettingsIpc: (channel, handler) => {
      registered.set(channel, handler);
    },
    settingsStore: {
      getSnapshot: () => snapshot,
      importModel: () => snapshot,
      importModelsFromPaths: () => ({ snapshot, results: [] }),
      createAnimation: () => snapshot,
      addAnimationClips: () => snapshot,
      addAnimationClipsBestEffort: () => ({ snapshot, results: [] }),
      setVrmaQualityGate: () => snapshot,
      setVrmaReportDir: () => snapshot,
      updateAnimation: () => snapshot,
      updateAnimationClip: (...args) => {
        calls.push(["updateAnimationClip", ...args]);
        return snapshot;
      },
      moveAnimationClip: () => snapshot,
      deleteAnimation: () => snapshot,
      deleteAnimationClip: () => snapshot,
      reorderAnimationClip: () => snapshot,
      addUnassignedClips: (paths) => {
        calls.push(["addUnassignedClips", paths]);
        return snapshot;
      },
      updateUnassignedClip: (...args) => {
        calls.push(["updateUnassignedClip", ...args]);
        return snapshot;
      },
      deleteUnassignedClip: (...args) => {
        calls.push(["deleteUnassignedClip", ...args]);
        return snapshot;
      },
      assignUnassignedClip: (...args) => {
        calls.push(["assignUnassignedClip", ...args]);
        return snapshot;
      },
      moveAnimationClipToUnassigned: (...args) => {
        calls.push(["moveAnimationClipToUnassigned", ...args]);
        return snapshot;
      },
      updateClipsPurpose: (...args) => {
        calls.push(["updateClipsPurpose", ...args]);
        return snapshot;
      },
      resetPackagedAnimations: () => snapshot,
      deleteModel: () => snapshot,
      deleteAllUserModels: () => snapshot,
      deleteAllUserAnimationClips: () => snapshot,
      setDefaultModel: () => snapshot,
      setCharacterSize: () => snapshot,
      setIdleRestMs: () => snapshot,
      setUiLocale: () => snapshot,
      setVoiceSource: () => snapshot,
      setModelLighting: () => snapshot,
      resetModelLighting: () => snapshot,
    },
    publishSettings: (value) => {
      calls.push(["publish", value]);
      return value;
    },
    selectAssetFile: async () => ["C:\\clips\\a.vrma"],
    selectAssetDirectory: async () => null,
    confirmDirectoryImport: async () => false,
    showAboutDialog: () => {},
    restartAudioListener: () => {},
    createMcpSettingsStatus: () => ({}),
    getAppReadinessSnapshot: () => ({}),
    getDiagnosticSummaryText: () => "summary",
    listVoiceSources: async () => ({ platform: "win32", sources: [] }),
    getIntegrationRuntimeState: () => ({
      mcpServerPort: 47831,
      latestListenerStatus: null,
      mcpServerError: null,
      mcpServerHealth: "online",
    }),
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

  const event = {};
  assert.equal(
    await registered.get("voxavatar:settings-add-unassigned-clips")(event),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-update-unassigned-clip")(
      event,
      "clip-1",
      { purpose: "pose" },
    ),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-delete-unassigned-clip")(
      event,
      "clip-1",
    ),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-assign-unassigned-clip")(
      event,
      "clip-1",
      "anim-1",
    ),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-move-animation-clip-to-unassigned")(
      event,
      "anim-1",
      "clip-1",
    ),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-update-clips-purpose")(
      event,
      [{ clipId: "clip-1", pool: true }],
      "loop",
    ),
    snapshot,
  );
  assert.equal(
    await registered.get("voxavatar:settings-update-animation-clip")(
      event,
      "anim-1",
      "clip-1",
      { clip_name: "renamed" },
    ),
    snapshot,
  );

  assert.deepEqual(calls, [
    ["addUnassignedClips", ["C:\\clips\\a.vrma"]],
    ["publish", snapshot],
    ["updateUnassignedClip", "clip-1", { purpose: "pose" }],
    ["publish", snapshot],
    ["deleteUnassignedClip", "clip-1"],
    ["publish", snapshot],
    ["assignUnassignedClip", "clip-1", "anim-1"],
    ["publish", snapshot],
    ["moveAnimationClipToUnassigned", "anim-1", "clip-1"],
    ["publish", snapshot],
    ["updateClipsPurpose", [{ clipId: "clip-1", pool: true }], "loop"],
    ["publish", snapshot],
    ["updateAnimationClip", "anim-1", "clip-1", { clip_name: "renamed" }],
    ["publish", snapshot],
  ]);
});

test("assign-vrma-by-filename returns null when picker cancels", async () => {
  const { registered } = createIpcHarness({
    selectAssetFile: async () => [],
  });
  const result = await registered.get(
    "voxavatar:settings-assign-vrma-by-filename",
  )({});
  assert.equal(result, null);
});

test("assign-vrma-by-filename reports skipped when nothing assignable", async () => {
  const { registered, snapshot } = createIpcHarness({
    selectAssetFile: async () => ["C:\\clips\\mystery.vrma"],
    suggestVrmaAssignments: () => [
      { animationId: null, reason: "unmatched", stem: "mystery" },
    ],
  });
  const result = await registered.get(
    "voxavatar:settings-assign-vrma-by-filename",
  )({});
  assert.deepEqual(result, {
    snapshot,
    assigned: 0,
    skipped: 1,
    cancelled: false,
    results: [],
  });
});

test("assign-vrma-by-filename marks cancelled when confirm is declined", async () => {
  const { registered, snapshot, calls } = createIpcHarness({
    selectAssetFile: async () => ["C:\\clips\\idle-01.vrma"],
    suggestVrmaAssignments: () => [
      { animationId: "anim-idle", reason: "exact_name", stem: "idle-01" },
    ],
    confirmAssignByFilename: async () => false,
  });
  const result = await registered.get(
    "voxavatar:settings-assign-vrma-by-filename",
  )({});
  assert.deepEqual(result, {
    snapshot,
    assigned: 0,
    skipped: 0,
    cancelled: true,
    results: [],
  });
  assert.equal(
    calls.some((row) => row[0] === "addAnimationClipsBestEffort"),
    false,
  );
});

test("assign-vrma-by-filename assigns confirmed suggestions", async () => {
  const { registered, snapshot, calls } = createIpcHarness({
    selectAssetFile: async () => [
      "C:\\clips\\idle-01.vrma",
      "C:\\clips\\unknown.vrma",
    ],
    suggestVrmaAssignments: () => [
      { animationId: "anim-idle", reason: "name_prefix", stem: "idle-01" },
      { animationId: null, reason: "unmatched", stem: "unknown" },
    ],
    confirmAssignByFilename: async (payload) => {
      assert.equal(payload.assignable.length, 1);
      assert.equal(payload.skipped, 1);
      assert.equal(payload.total, 2);
      return true;
    },
  });
  const result = await registered.get(
    "voxavatar:settings-assign-vrma-by-filename",
  )({});
  assert.equal(result.cancelled, false);
  assert.equal(result.assigned, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.results[0].ok, true);
  assert.equal(result.results[0].animationId, "anim-idle");
  assert.ok(calls.some((row) => row[0] === "publish" && row[1] === snapshot));
  assert.deepEqual(calls.find((row) => row[0] === "addAnimationClipsBestEffort"), [
    "addAnimationClipsBestEffort",
    "anim-idle",
    ["C:\\clips\\idle-01.vrma"],
  ]);
});

test("import-action-pack cancels, imports, and publishes", async () => {
  const packResult = { snapshot: { pack: true }, imported: 2 };
  const cancelled = createIpcHarness({
    selectActionPackFile: async () => null,
  });
  assert.equal(
    await cancelled.registered.get("voxavatar:settings-import-action-pack")({}),
    null,
  );

  const { registered, calls } = createIpcHarness({
    selectActionPackFile: async () => "C:\\packs\\demo.json",
    importActionPackFromPath: ({ packPath, mergeBindings }) => {
      assert.equal(packPath, "C:\\packs\\demo.json");
      assert.equal(mergeBindings, true);
      return packResult;
    },
  });
  const result = await registered.get(
    "voxavatar:settings-import-action-pack",
  )({});
  assert.equal(result, packResult);
  assert.deepEqual(calls, [["publish", packResult.snapshot]]);
});

test("get-app-info returns version and show-about invokes dialog", async () => {
  let aboutCalls = 0;
  const { registered } = createIpcHarness({
    app: { getVersion: () => "0.16.17" },
    showAboutDialog: () => {
      aboutCalls += 1;
    },
  });
  assert.deepEqual(
    await registered.get("voxavatar:settings-get-app-info")({}),
    { version: "0.16.17" },
  );
  await registered.get("voxavatar:settings-show-about")({});
  assert.equal(aboutCalls, 1);
});

test("runtime-dependent settings IPC reads bridge and listener state at call time", async () => {
  let runtimeState = {
    mcpServerPort: 0,
    latestListenerStatus: null,
    mcpServerError: null,
    mcpServerHealth: "starting",
  };
  const { registered, snapshot } = createIpcHarness({
    createMcpSettingsStatus: (input) => input,
    getIntegrationRuntimeState: () => runtimeState,
    listVoiceSources: async () => ({ platform: "win32", sources: [] }),
  });

  assert.deepEqual(
    await registered.get("voxavatar:settings-get-mcp-status")({}),
    {
      error: null,
      health: "starting",
      port: 0,
      settingsSnapshot: snapshot,
    },
  );

  runtimeState = {
    mcpServerPort: 49152,
    latestListenerStatus: { state: "no_output" },
    mcpServerError: null,
    mcpServerHealth: "online",
  };
  const online = await registered.get("voxavatar:settings-get-mcp-status")({});
  assert.equal(online.health, "online");
  assert.equal(online.port, 49152);

  const catalog = await registered.get(
    "voxavatar:settings-list-voice-sources",
  )({});
  assert.equal(catalog.events_url, "http://127.0.0.1:49152/events");
  assert.deepEqual(catalog.listener, { state: "no_output" });
});

test("list-voice-sources redacts listener paths and catalog errors", async () => {
  const { registered } = createIpcHarness({
    listVoiceSources: async () => {
      throw new Error("boom C:\\Users\\SanHsien\\helper.exe");
    },
    getIntegrationRuntimeState: () => ({
      mcpServerPort: 47831,
      latestListenerStatus: {
        state: "missing",
        error: "C:\\Users\\SanHsien\\voxavatar-audio-listener.exe",
        source: "C:\\Users\\SanHsien\\ChatGPT.exe",
        helper_error: "native_helper_missing",
      },
      mcpServerError: null,
      mcpServerHealth: "online",
    }),
  });
  const catalog = await registered.get(
    "voxavatar:settings-list-voice-sources",
  )({});
  assert.equal(catalog.helper_error, undefined);
  assert.equal(catalog.listener.helper_error, "native_helper_missing");
  assert.doesNotMatch(catalog.error, /SanHsien/i);
  assert.doesNotMatch(catalog.listener.error, /SanHsien/i);
  assert.doesNotMatch(catalog.listener.source, /SanHsien|ChatGPT/i);
});
