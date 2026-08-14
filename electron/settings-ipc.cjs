"use strict";

const { sanitizeVoiceSourcesCatalog } = require("./mcp-schemas.cjs");

function registerSettingsIpc({
  app,
  path,
  shell,
  handleTrustedIpc,
  handleTrustedSettingsIpc,
  settingsStore,
  publishSettings,
  selectAssetFile,
  selectAssetDirectory,
  selectActionPackFile,
  importActionPackFromPath,
  confirmDirectoryImport,
  confirmAssignByFilename,
  showAboutDialog,
  restartAudioListener,
  createMcpSettingsStatus,
  getAppReadinessSnapshot,
  getDiagnosticSummaryText,
  listVoiceSources,
  getIntegrationRuntimeState,
  collectAssetFiles,
  normalizeQualityGate,
  analyzeVrmFiles,
  summarizeVrmReports,
  writeVrmMarkdownReport,
  analyzeVrmaFiles,
  summarizeReports,
  writeMarkdownReport,
  buildDirectoryImportSummary,
  evaluateDirectoryImport,
  suggestVrmaAssignments,
  assignableVrmaSuggestions,
}) {
  handleTrustedIpc("voxavatar:settings-get", () => settingsStore.getSnapshot());
  handleTrustedSettingsIpc("voxavatar:settings-import-model", async (_event, metadata) => {
    const filePath = await selectAssetFile("model");
    if (!filePath) return null;
    return publishSettings(
      settingsStore.importModel({ filePath, model_name: metadata?.model_name }),
    );
  });
  handleTrustedSettingsIpc(
    "voxavatar:settings-import-models-from-directory",
    async (_event, metadata) => {
      const rootDir = await selectAssetDirectory("選擇含 VRM 的資料夾");
      if (!rootDir) return null;
      const scan = collectAssetFiles(rootDir, { extensions: [".vrm"] });
      const settingsSnapshot = settingsStore.getSnapshot();
      const gate = normalizeQualityGate(settingsSnapshot.vrma_quality_gate);
      const preferredReportDir = settingsSnapshot.vrma_report_dir;
      const scoreOptions = {
        rejectBelow: settingsSnapshot.vrma_quality_reject_below,
        keepAtLeast: settingsSnapshot.vrma_quality_keep_at_least,
      };

      if (scan.files.length === 0) {
        return {
          snapshot: settingsStore.getSnapshot(),
          summary: buildDirectoryImportSummary({
            kind: "model",
            rootDir,
            scanned: 0,
            truncated: scan.truncated,
            imported: 0,
            skippedQuality: 0,
            skippedInvalid: 0,
            skippedLimit: 0,
            failed: [],
            quality: null,
            reportPath: null,
            reportError: null,
          }),
        };
      }

      const evaluated = evaluateDirectoryImport({
        kind: "model",
        filePaths: scan.files,
        gate,
        analyzeFn: (filePaths) => analyzeVrmFiles(filePaths, scoreOptions),
        summarizeFn: summarizeVrmReports,
        writeReportFn: (reports, options) =>
          writeVrmMarkdownReport(reports, { ...options, ...scoreOptions }),
        preferredReportDir,
        sourceDir: rootDir,
      });
      const {
        quality,
        reportPath,
        reportError,
        importCandidates,
        skippedQuality,
      } = evaluated;

      const confirmed = await confirmDirectoryImport({
        kind: "model",
        scanned: scan.files.length,
        importCount: importCandidates.length,
        quality,
        skippedQuality,
      });
      if (!confirmed) return null;

      let snapshot = settingsStore.getSnapshot();
      let results = [];
      if (importCandidates.length > 0) {
        ({ snapshot, results } = settingsStore.importModelsFromPaths(
          importCandidates,
          { model_name: metadata?.model_name },
        ));
        publishSettings(snapshot);
      }
      const imported = results.filter((item) => item.ok).length;
      const skippedInvalid = results.filter(
        (item) => item.reason === "invalid",
      ).length;
      const skippedLimit = results.filter(
        (item) => item.reason === "limit",
      ).length;
      const failed = results
        .filter((item) => !item.ok && item.reason !== "limit")
        .map((item) => ({
          path: item.filePath,
          error: item.error,
        }));
      return {
        snapshot,
        summary: buildDirectoryImportSummary({
          kind: "model",
          rootDir,
          scanned: scan.files.length,
          truncated: scan.truncated,
          imported,
          skippedQuality,
          skippedInvalid,
          skippedLimit,
          failed,
          quality,
          reportPath,
          reportError,
        }),
      };
    },
  );
  handleTrustedSettingsIpc("voxavatar:settings-create-animation", (_event, metadata) =>
    publishSettings(settingsStore.createAnimation(metadata)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-add-animation-clips",
    async (_event, animationId) => {
      const filePaths = await selectAssetFile("animation", true);
      if (filePaths.length === 0) return null;
      return publishSettings(
        settingsStore.addAnimationClips(animationId, filePaths),
      );
    },
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-add-animation-clips-from-directory",
    async (_event, animationId) => {
      const rootDir = await selectAssetDirectory("選擇含 VRMA 的資料夾");
      if (!rootDir) return null;

      const scan = collectAssetFiles(rootDir, { extensions: [".vrma"] });
      const settingsSnapshot = settingsStore.getSnapshot();
      const gate = normalizeQualityGate(settingsSnapshot.vrma_quality_gate);
      const preferredReportDir = settingsSnapshot.vrma_report_dir;
      const scoreOptions = {
        rejectBelow: settingsSnapshot.vrma_quality_reject_below,
        keepAtLeast: settingsSnapshot.vrma_quality_keep_at_least,
      };

      if (scan.files.length === 0) {
        return {
          snapshot: settingsStore.getSnapshot(),
          summary: buildDirectoryImportSummary({
            kind: "animation",
            rootDir,
            scanned: 0,
            truncated: scan.truncated,
            imported: 0,
            skippedQuality: 0,
            skippedInvalid: 0,
            skippedLimit: 0,
            failed: [],
            quality: null,
            reportPath: null,
            reportError: null,
          }),
        };
      }

      const targetAnimation = settingsSnapshot.animations.find(
        (animation) => animation.id === animationId,
      );
      const purpose =
        targetAnimation?.clips?.[0]?.purpose ??
        (targetAnimation?.animation_type === "IDLE" ||
        targetAnimation?.animation_type === "TALK"
          ? "loop"
          : "one-shot");

      const evaluated = evaluateDirectoryImport({
        kind: "animation",
        filePaths: scan.files,
        gate,
        analyzeFn: (filePaths) =>
          analyzeVrmaFiles(filePaths, { purpose, ...scoreOptions }),
        summarizeFn: summarizeReports,
        writeReportFn: (reports, options) =>
          writeMarkdownReport(reports, { ...options, ...scoreOptions }),
        preferredReportDir,
        sourceDir: rootDir,
      });
      const {
        quality,
        reportPath,
        reportError,
        importCandidates,
        skippedQuality,
      } = evaluated;

      const confirmed = await confirmDirectoryImport({
        kind: "animation",
        scanned: scan.files.length,
        importCount: importCandidates.length,
        quality,
        skippedQuality,
      });
      if (!confirmed) return null;

      let snapshot = settingsStore.getSnapshot();
      let results = [];
      if (importCandidates.length > 0) {
        ({ snapshot, results } = settingsStore.addAnimationClipsBestEffort(
          animationId,
          importCandidates,
        ));
        publishSettings(snapshot);
      }
      const imported = results.filter((item) => item.ok).length;
      const skippedInvalid = results.filter(
        (item) => item.reason === "invalid",
      ).length;
      const skippedLimit = results.filter(
        (item) => item.reason === "limit",
      ).length;
      const failed = results
        .filter((item) => !item.ok && item.reason !== "limit")
        .map((item) => ({
          path: item.filePath,
          error: item.error,
        }));

      return {
        snapshot,
        summary: buildDirectoryImportSummary({
          kind: "animation",
          rootDir,
          scanned: scan.files.length,
          truncated: scan.truncated,
          imported,
          skippedQuality,
          skippedInvalid,
          skippedLimit,
          failed,
          quality,
          reportPath,
          reportError,
        }),
      };
    },
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-vrma-quality-gate",
    (_event, value) =>
      publishSettings(settingsStore.setVrmaQualityGate(value)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-vrma-quality-score-thresholds",
    (_event, value) =>
      publishSettings(settingsStore.setVrmaQualityScoreThresholds(value)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-choose-vrma-report-dir",
    async () => {
      const selected = await selectAssetDirectory(
        "選擇 VRMA 品質報告儲存資料夾",
      );
      if (!selected) return null;
      return publishSettings(settingsStore.setVrmaReportDir(selected));
    },
  );
  handleTrustedSettingsIpc("voxavatar:settings-clear-vrma-report-dir", () =>
    publishSettings(settingsStore.setVrmaReportDir(null)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-update-animation",
    (_event, animationId, metadata) =>
      publishSettings(
        settingsStore.updateAnimation(animationId, metadata),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-update-animation-clip",
    (_event, animationId, clipId, patch) =>
      publishSettings(
        settingsStore.updateAnimationClip(animationId, clipId, patch),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-move-animation-clip",
    (_event, fromAnimationId, clipId, toAnimationId) =>
      publishSettings(
        settingsStore.moveAnimationClip(
          fromAnimationId,
          clipId,
          toAnimationId,
        ),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-delete-animation",
    (_event, animationId) =>
      publishSettings(settingsStore.deleteAnimation(animationId)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-delete-animation-clip",
    (_event, animationId, clipId) =>
      publishSettings(
        settingsStore.deleteAnimationClip(animationId, clipId),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-reorder-animation-clip",
    (_event, animationId, clipId, direction) =>
      publishSettings(
        settingsStore.reorderAnimationClip(animationId, clipId, direction),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-add-unassigned-clips",
    async () => {
      const filePaths = await selectAssetFile("animation", true);
      if (filePaths.length === 0) return null;
      return publishSettings(settingsStore.addUnassignedClips(filePaths));
    },
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-update-unassigned-clip",
    (_event, clipId, patch) =>
      publishSettings(settingsStore.updateUnassignedClip(clipId, patch)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-delete-unassigned-clip",
    (_event, clipId) =>
      publishSettings(settingsStore.deleteUnassignedClip(clipId)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-assign-unassigned-clip",
    (_event, clipId, toAnimationId) =>
      publishSettings(
        settingsStore.assignUnassignedClip(clipId, toAnimationId),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-move-animation-clip-to-unassigned",
    (_event, animationId, clipId) =>
      publishSettings(
        settingsStore.moveAnimationClipToUnassigned(animationId, clipId),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-update-clips-purpose",
    (_event, targets, purpose) =>
      publishSettings(settingsStore.updateClipsPurpose(targets, purpose)),
  );
  handleTrustedSettingsIpc("voxavatar:settings-reveal-path", (_event, targetPath) => {
    if (typeof targetPath !== "string" || !targetPath.trim()) {
      throw new Error("Path is required.");
    }
    if (!path.isAbsolute(targetPath)) {
      throw new Error("Path must be absolute.");
    }
    shell.showItemInFolder(path.resolve(targetPath));
  });
  handleTrustedSettingsIpc(
    "voxavatar:settings-reset-packaged-animations",
    () => publishSettings(settingsStore.resetPackagedAnimations()),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-delete-model",
    (_event, modelId) => {
      const model = settingsStore
        .getSnapshot()
        .models.find((candidate) => candidate.id === modelId);
      if (!model?.removable) {
        throw new Error("Packaged models cannot be deleted.");
      }
      return publishSettings(settingsStore.deleteModel(modelId));
    },
  );
  handleTrustedSettingsIpc("voxavatar:settings-delete-all-user-models", () =>
    publishSettings(settingsStore.deleteAllUserModels()),
  );
  handleTrustedSettingsIpc("voxavatar:settings-delete-all-user-animation-clips", () =>
    publishSettings(settingsStore.deleteAllUserAnimationClips()),
  );
  handleTrustedSettingsIpc("voxavatar:settings-set-default-model", (_event, modelId) =>
    publishSettings(settingsStore.setDefaultModel(modelId)),
  );
  handleTrustedSettingsIpc("voxavatar:settings-set-character-size", (_event, size) =>
    publishSettings(settingsStore.setCharacterSize(size)),
  );
  handleTrustedSettingsIpc("voxavatar:settings-set-idle-rest-ms", (_event, ms) =>
    publishSettings(settingsStore.setIdleRestMs(ms)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-mcp-show-message-enabled",
    (_event, enabled) =>
      publishSettings(settingsStore.setMcpShowMessageEnabled(enabled)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-state-slot-bindings",
    (_event, bindings) =>
      publishSettings(settingsStore.setStateSlotBindings(bindings)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-state-slot-binding",
    (_event, stateKey, animationName) =>
      publishSettings(
        settingsStore.setStateSlotBinding(stateKey, animationName),
      ),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-import-action-pack",
    async () => {
      if (typeof selectActionPackFile !== "function") return null;
      if (typeof importActionPackFromPath !== "function") {
        throw new Error("action_pack_import_unavailable");
      }
      const packPath = await selectActionPackFile();
      if (!packPath) return null;
      const result = importActionPackFromPath({
        packPath,
        settingsStore,
        mergeBindings: true,
      });
      publishSettings(result.snapshot);
      return result;
    },
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-assign-vrma-by-filename",
    async () => {
      if (typeof suggestVrmaAssignments !== "function") {
        throw new Error("vrma_assignment_suggest_unavailable");
      }
      const filePaths = await selectAssetFile("animation", true);
      if (!filePaths || filePaths.length === 0) return null;

      const snapshot = settingsStore.getSnapshot();
      const suggestions = suggestVrmaAssignments(
        filePaths,
        snapshot.animations ?? [],
      ).map((item, index) => ({
        ...item,
        filePath: filePaths[index],
      }));
      const assignable =
        typeof assignableVrmaSuggestions === "function"
          ? assignableVrmaSuggestions(suggestions)
          : suggestions.filter(
              (item) =>
                typeof item.animationId === "string" && item.animationId,
            );
      const skipped = suggestions.length - assignable.length;

      if (assignable.length === 0) {
        return {
          snapshot,
          assigned: 0,
          skipped,
          cancelled: false,
          results: [],
        };
      }

      const confirmed =
        typeof confirmAssignByFilename === "function"
          ? await confirmAssignByFilename({
              assignable,
              skipped,
              total: suggestions.length,
            })
          : false;
      if (!confirmed) {
        return {
          snapshot,
          assigned: 0,
          skipped,
          cancelled: true,
          results: [],
        };
      }

      const byAnimation = new Map();
      for (const item of assignable) {
        const list = byAnimation.get(item.animationId) ?? [];
        list.push(item.filePath);
        byAnimation.set(item.animationId, list);
      }

      let nextSnapshot = snapshot;
      const results = [];
      for (const [animationId, paths] of byAnimation) {
        const batch = settingsStore.addAnimationClipsBestEffort(
          animationId,
          paths,
        );
        nextSnapshot = batch.snapshot;
        for (const item of batch.results) {
          results.push({
            file: path.basename(item.filePath),
            ok: item.ok,
            error: item.error,
            animationId,
          });
        }
      }

      publishSettings(nextSnapshot);
      return {
        snapshot: nextSnapshot,
        assigned: results.filter((item) => item.ok).length,
        skipped,
        cancelled: false,
        results,
      };
    },
  );
  handleTrustedSettingsIpc("voxavatar:settings-set-ui-locale", (_event, locale) =>
    publishSettings(settingsStore.setUiLocale(locale)),
  );
  handleTrustedSettingsIpc("voxavatar:settings-get-app-info", () => ({
    version: app.getVersion(),
  }));
  handleTrustedSettingsIpc("voxavatar:settings-show-about", async () => {
    showAboutDialog();
  });
  handleTrustedSettingsIpc("voxavatar:settings-set-voice-source", (_event, voiceSource) => {
    const snapshot = publishSettings(settingsStore.setVoiceSource(voiceSource));
    restartAudioListener();
    return snapshot;
  });
  handleTrustedSettingsIpc("voxavatar:settings-list-voice-sources", async () => {
    const { mcpServerPort, latestListenerStatus } =
      getIntegrationRuntimeState();
    try {
      return sanitizeVoiceSourcesCatalog({
        ...(await listVoiceSources()),
        error: null,
        events_url: `http://127.0.0.1:${mcpServerPort}/events`,
        listener: latestListenerStatus,
      });
    } catch (error) {
      return sanitizeVoiceSourcesCatalog({
        platform: process.platform,
        sources: [],
        error: error instanceof Error ? error.message : String(error),
        events_url: `http://127.0.0.1:${mcpServerPort}/events`,
        listener: latestListenerStatus,
      });
    }
  });
  handleTrustedSettingsIpc(
    "voxavatar:settings-set-model-lighting",
    (_event, modelId, lighting) =>
      publishSettings(settingsStore.setModelLighting(modelId, lighting)),
  );
  handleTrustedSettingsIpc(
    "voxavatar:settings-reset-model-lighting",
    (_event, modelId) =>
      publishSettings(settingsStore.resetModelLighting(modelId)),
  );
  handleTrustedSettingsIpc("voxavatar:settings-get-mcp-status", () => {
    const { mcpServerError, mcpServerHealth, mcpServerPort } =
      getIntegrationRuntimeState();
    return createMcpSettingsStatus({
      error: mcpServerError,
      health: mcpServerHealth,
      port: mcpServerPort,
      settingsSnapshot: settingsStore.getSnapshot(),
    });
  });
  handleTrustedSettingsIpc("voxavatar:settings-get-readiness", () =>
    getAppReadinessSnapshot(),
  );
  handleTrustedSettingsIpc("voxavatar:settings-get-diagnostic-summary", () => ({
    text: getDiagnosticSummaryText(),
  }));
}

module.exports = {
  registerSettingsIpc,
};
