"use strict";

const path = require("node:path");
const { pathToFileURL } = require("node:url");
const {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  net,
  nativeImage,
  nativeTheme,
  protocol,
  screen,
  shell,
  Tray,
} = require("electron");
const { createBridgeServer, DEFAULT_PORT } = require("./bridge-server.cjs");
const { createVoxAvatarMcpHandler } = require("./mcp-server.cjs");
const {
  createMcpSettingsStatus,
} = require("./mcp-settings-status.cjs");
const { createSettingsStore } = require("./settings-store.cjs");
const { createAudioListener } = require("./audio-listener.cjs");
const { isAllowedRendererNavigation } = require("./navigation-policy.cjs");
const { assertTrustedIpcSender } = require("./ipc-guard.cjs");
const { snapshotHasConfiguredModel } = require("./model-readiness.cjs");
const { parseProtocolUrl, voiceState } = require("./protocol-actions.cjs");
const {
  createSettingsWindowPresentationGate,
} = require("./settings-window-presentation.cjs");
const {
  normalizeVoiceSource,
  resolveVoiceSourcePattern,
  settingsPatternFromVoiceSource,
} = require("./voice-source.cjs");
const { listVoiceSources } = require("./voice-source-discovery.cjs");
const { menuStrings, normalizeUiLocale } = require("./i18n.cjs");
const { collectAssetFiles } = require("./asset-scan.cjs");
const {
  QUALITY_GATE,
  VERDICT,
  analyzeVrmaFiles,
  normalizeQualityGate,
  summarizeReports,
  writeMarkdownReport,
} = require("./vrma-quality.cjs");

const WINDOW_WIDTH = 430;
const WINDOW_HEIGHT = 680;
const SETTINGS_WINDOW_WIDTH = 1180;
const SETTINGS_WINDOW_HEIGHT = 780;
// Chromium paints this behind newly exposed areas during a resize, so it must
// track the renderer's --bg-window token in src/styles.css.
const SETTINGS_WINDOW_BACKGROUND = {
  dark: "#0d0e12",
  light: "#e6e8ec",
};
const VOXAVATAR_ASSET_SCHEME = "voxavatar-asset";
const startInBackground = process.argv.includes("--background");
const startInSettings = process.argv.includes("--settings");
const protocolScheme = "voxavatar";
const debugEnabled = process.env.VOXAVATAR_DEBUG === "1";

let avatarWindow = null;
let settingsWindow = null;
let settingsWindowPresentationGate = null;
let settingsStore = null;
let bridge = null;
let mcpHandler = null;
let isQuitting = false;
let latestEvent = null;
let latestListenerStatus = null;
let latestVoiceState = null;
let audioListener = null;
let tray = null;
let avatarMousePassthrough = true;
let rendererLoadHookAttached = false;
let animationCommandRequestId = 0;
let modelConfigured = false;
let mcpServerError = null;
let mcpServerHealth = "starting";
let mcpServerPort = Number(
  process.env.VOXAVATAR_BRIDGE_PORT || DEFAULT_PORT,
);
let mcpAnimationCatalogSignature = null;
const pendingRendererEvents = new Map();

protocol.registerSchemesAsPrivileged([
  {
    scheme: VOXAVATAR_ASSET_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
app.setName("VoxAvatar");

function debugLog(...values) {
  if (debugEnabled) console.error("[voxavatar]", ...values);
}

function positionWindow(window) {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const bounds = window.getBounds();
  const margin = 24;
  window.setPosition(
    Math.round(display.workArea.x + display.workArea.width - bounds.width - margin),
    Math.round(display.workArea.y + display.workArea.height - bounds.height - margin),
    false,
  );
}

function hasConfiguredModel() {
  return modelConfigured;
}

function showOverlay({ focus = false } = {}) {
  if (!hasConfiguredModel()) {
    showSettings();
    return;
  }
  const window = createWindow();
  if (window.isMinimized()) window.restore();
  if (focus) {
    if (!window.isVisible()) window.show();
    window.focus();
  } else if (!window.isVisible()) {
    window.showInactive();
  }
}

async function hideOverlay() {
  debugLog("hide overlay");
  const targetWindow = avatarWindow;
  if (!targetWindow || targetWindow.isDestroyed()) return;
  targetWindow.hide();
}

function destroyOverlayForSetup() {
  rendererLoadHookAttached = false;
  pendingRendererEvents.clear();
  if (avatarWindow && !avatarWindow.isDestroyed()) {
    avatarWindow.destroy();
  }
  avatarWindow = null;
}

function toggleOverlay() {
  if (!hasConfiguredModel()) {
    showSettings();
    return;
  }
  if (avatarWindow && !avatarWindow.isDestroyed() && avatarWindow.isVisible()) {
    void hideOverlay();
  } else {
    showOverlay({ focus: true });
  }
}

function setAvatarMousePassthrough(ignore) {
  if (!avatarWindow || avatarWindow.isDestroyed()) return;
  const next = Boolean(ignore);
  if (next === avatarMousePassthrough && avatarWindow.isVisible()) {
    // Still re-apply after show/hide; Windows can drop the flag.
  }
  avatarMousePassthrough = next;
  avatarWindow.setIgnoreMouseEvents(next, { forward: true });
}

function currentMenuStrings() {
  return menuStrings(settingsStore?.getSnapshot()?.ui_locale);
}

function showAboutDialog() {
  const t = currentMenuStrings();
  const version = app.getVersion();
  const parent =
    settingsWindow && !settingsWindow.isDestroyed()
      ? settingsWindow
      : avatarWindow && !avatarWindow.isDestroyed()
        ? avatarWindow
        : undefined;
  const options = {
    type: "info",
    title: t.aboutTitle,
    message: "VoxAvatar",
    detail: String(t.aboutDetail).replaceAll("{version}", version),
    buttons: [t.aboutOk],
    noLink: true,
  };
  if (parent) {
    void dialog.showMessageBox(parent, options);
  } else {
    void dialog.showMessageBox(options);
  }
}

function buildTrayMenuTemplate() {
  const t = currentMenuStrings();
  const ready = hasConfiguredModel();
  const quitItem = {
    label: t.quit,
    click: () => {
      isQuitting = true;
      app.quit();
    },
  };
  const aboutItem = { label: t.about, click: () => showAboutDialog() };
  const languageSubmenu = [
    {
      label: t.languageZh,
      type: "radio",
      checked: normalizeUiLocale(settingsStore?.getSnapshot()?.ui_locale) === "zh-TW",
      click: () => {
        if (!settingsStore) return;
        publishSettings(settingsStore.setUiLocale("zh-TW"));
      },
    },
    {
      label: t.languageEn,
      type: "radio",
      checked: normalizeUiLocale(settingsStore?.getSnapshot()?.ui_locale) === "en",
      click: () => {
        if (!settingsStore) return;
        publishSettings(settingsStore.setUiLocale("en"));
      },
    },
  ];
  if (!ready) {
    return [
      { label: t.setup, click: showSettings },
      { type: "separator" },
      { label: t.language, submenu: languageSubmenu },
      { type: "separator" },
      aboutItem,
      quitItem,
    ];
  }
  const visible = Boolean(avatarWindow && !avatarWindow.isDestroyed() && avatarWindow.isVisible());
  return [
    {
      label: visible ? t.hide : t.show,
      click: () => toggleOverlay(),
    },
    { label: t.settings, click: showSettings },
    { type: "separator" },
    {
      label: t.previewListening,
      click: () => handleBridgeEvent(voiceState("listening")),
    },
    {
      label: t.previewSpeaking,
      click: () => handleBridgeEvent(voiceState("speaking")),
    },
    { type: "separator" },
    { label: t.language, submenu: languageSubmenu },
    { type: "separator" },
    aboutItem,
    quitItem,
  ];
}

function popupTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate(buildTrayMenuTemplate());
  // Rebuild each time; avoid setContextMenu so left-click keeps working on Windows.
  setTimeout(() => {
    if (!tray) return;
    tray.popUpContextMenu(menu);
  }, 50);
}

function buildAvatarContextMenu() {
  const t = currentMenuStrings();
  return Menu.buildFromTemplate([
    {
      label: t.hide,
      click: () => void hideOverlay(),
    },
    {
      label: t.resetView,
      click: () => {
        if (!avatarWindow || avatarWindow.isDestroyed()) return;
        avatarWindow.webContents.send("voxavatar:reset-view");
      },
    },
    { type: "separator" },
    {
      label: t.zoomHint,
      enabled: false,
    },
    {
      label: t.clickThroughHint,
      enabled: false,
    },
    { type: "separator" },
    { label: t.settings, click: showSettings },
    {
      label: t.language,
      submenu: [
        {
          label: t.languageZh,
          type: "radio",
          checked: normalizeUiLocale(settingsStore?.getSnapshot()?.ui_locale) === "zh-TW",
          click: () => {
            if (!settingsStore) return;
            publishSettings(settingsStore.setUiLocale("zh-TW"));
          },
        },
        {
          label: t.languageEn,
          type: "radio",
          checked: normalizeUiLocale(settingsStore?.getSnapshot()?.ui_locale) === "en",
          click: () => {
            if (!settingsStore) return;
            publishSettings(settingsStore.setUiLocale("en"));
          },
        },
      ],
    },
    { type: "separator" },
    { label: t.about, click: () => showAboutDialog() },
    {
      label: t.quit,
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function rendererUrl(view = null) {
  const url = new URL(
    process.env.VITE_DEV_SERVER_URL ||
      pathToFileURL(path.join(__dirname, "..", "dist", "index.html")).href,
  );
  if (view) url.searchParams.set("view", view);
  return url.href;
}

function trustedRendererUrls() {
  return [rendererUrl(), rendererUrl("settings")];
}

function handleTrustedIpc(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
    assertTrustedIpcSender(event, trustedRendererUrls());
    return handler(event, ...args);
  });
}

function secureRendererWindow(window, allowedRendererUrl) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        void shell.openExternal(parsed.toString());
      }
    } catch {
      // ignore invalid URLs
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, targetUrl) => {
    if (!isAllowedRendererNavigation(targetUrl, allowedRendererUrl)) {
      event.preventDefault();
      try {
        const parsed = new URL(targetUrl);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          void shell.openExternal(parsed.toString());
        }
      } catch {
        // ignore
      }
    }
  });
}

function createWindow() {
  if (avatarWindow && !avatarWindow.isDestroyed()) return avatarWindow;

  const window = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 320,
    minHeight: 480,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    roundedCorners: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    title: "VoxAvatar",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  avatarWindow = window;

  window.setAlwaysOnTop(true, "floating");
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.setOpacity(1);
  // Transparent pixels click through; renderer re-enables hit-testing over the avatar.
  window.setIgnoreMouseEvents(true, { forward: true });
  avatarMousePassthrough = true;
  window.once("ready-to-show", () => {
    if (window.isDestroyed()) return;
    positionWindow(window);
  });
  window.on("show", () => {
    if (window.isDestroyed()) return;
    window.setAlwaysOnTop(true, "floating");
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    window.setOpacity(1);
    setAvatarMousePassthrough(avatarMousePassthrough);
  });
  window.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    void hideOverlay();
  });
  window.on("closed", () => {
    if (avatarWindow !== window) return;
    rendererLoadHookAttached = false;
    avatarWindow = null;
  });

  const avatarRendererUrl = rendererUrl();
  secureRendererWindow(window, avatarRendererUrl);
  void window.loadURL(avatarRendererUrl);
  return window;
}

function settingsWindowBackground(theme) {
  return SETTINGS_WINDOW_BACKGROUND[theme] ?? SETTINGS_WINDOW_BACKGROUND.dark;
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) return settingsWindow;

  const window = new BrowserWindow({
    width: SETTINGS_WINDOW_WIDTH,
    height: SETTINGS_WINDOW_HEIGHT,
    minWidth: 920,
    minHeight: 640,
    show: false,
    title: "VoxAvatar Settings",
    // Best guess until the renderer reports the theme it actually resolved,
    // which it does before the window is shown on ready-to-show.
    backgroundColor: settingsWindowBackground(
      nativeTheme.shouldUseDarkColors ? "dark" : "light",
    ),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  const presentationGate = createSettingsWindowPresentationGate();
  settingsWindow = window;
  settingsWindowPresentationGate = presentationGate;

  const settingsRendererUrl = rendererUrl("settings");
  secureRendererWindow(window, settingsRendererUrl);
  window.once("ready-to-show", () => {
    if (
      settingsWindow !== window ||
      settingsWindowPresentationGate !== presentationGate
    ) {
      return;
    }
    if (presentationGate.markReadyToShow()) focusSettingsWindow();
  });
  window.on("closed", () => {
    if (settingsWindow !== window) return;
    settingsWindow = null;
    settingsWindowPresentationGate = null;
  });
  void window.loadURL(settingsRendererUrl);
  return window;
}

function focusSettingsWindow() {
  if (!settingsWindow || settingsWindow.isDestroyed()) return;
  settingsWindow.setFocusable(true);
  if (settingsWindow.isMinimized()) settingsWindow.restore();
  settingsWindow.show();
  settingsWindow.moveTop();
  settingsWindow.focus();
  settingsWindow.webContents.focus();
}

function showSettings() {
  const window = createSettingsWindow();
  if (settingsWindowPresentationGate?.requestShow()) {
    focusSettingsWindow();
  }
  return window;
}

function animationCatalogSignature(snapshot) {
  return JSON.stringify(
    snapshot.animations.map((animation) => ({
      description: animation.animation_description,
      id: animation.id,
      name: animation.animation_name,
      playableClipCount: animation.asset_urls.length,
      trigger: animation.animation_trigger_scenario,
    })),
  );
}

function publishSettings(snapshot) {
  const wasConfigured = modelConfigured;
  modelConfigured = snapshotHasConfiguredModel(snapshot);
  const nextAnimationCatalogSignature = animationCatalogSignature(snapshot);
  if (nextAnimationCatalogSignature !== mcpAnimationCatalogSignature) {
    mcpAnimationCatalogSignature = nextAnimationCatalogSignature;
    mcpHandler?.notifyToolsChanged();
  }
  for (const window of [avatarWindow, settingsWindow]) {
    if (window && !window.isDestroyed() && !window.webContents.isLoading()) {
      window.webContents.send("voxavatar:settings-updated", snapshot);
    }
  }
  refreshTrayMenu();
  if (!wasConfigured && modelConfigured) {
    void audioListener?.start();
    showOverlay();
  } else if (wasConfigured && !modelConfigured) {
    audioListener?.stop();
    const inactiveState = voiceState("idle", "inactive");
    latestVoiceState = inactiveState.state;
    emitToRenderer(inactiveState);
    destroyOverlayForSetup();
    setImmediate(focusSettingsWindow);
  }
  return snapshot;
}

function resolveListenerProcessPattern(snapshot = settingsStore?.getSnapshot()) {
  const voiceSource = normalizeVoiceSource(snapshot?.voice_source);
  if (!["default", "custom"].includes(voiceSource.mode)) return null;
  return resolveVoiceSourcePattern({
    environment: process.env,
    settingsPattern: settingsPatternFromVoiceSource(voiceSource),
  });
}

function createConfiguredAudioListener(snapshot = settingsStore?.getSnapshot()) {
  const voiceSource = normalizeVoiceSource(snapshot?.voice_source);
  return createAudioListener({
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    processPattern: resolveListenerProcessPattern(snapshot),
    voiceSource,
    onActivity: (activity) => {
      debugLog("listener activity", activity);
      handleBridgeEvent(voiceState(activity));
    },
    onDebug: debugEnabled ? (nodes) => debugLog("listener output nodes", nodes) : null,
    onLevel: (level) => handleBridgeEvent({ type: "audio-level", level }),
    onSession: (active) => {
      debugLog("listener session", active);
      handleBridgeEvent(voiceState(active ? "listening" : "idle", active ? "active" : "inactive"));
    },
    onStatus: (status) => {
      debugLog("listener status", status);
      handleListenerStatus(status);
    },
  });
}

function reportInactiveListenerStatus(snapshot = settingsStore?.getSnapshot()) {
  const voiceSource = normalizeVoiceSource(snapshot?.voice_source);
  handleListenerStatus({
    available: voiceSource.mode === "external",
    capturing: false,
    monitoring: false,
    source: voiceSource.mode === "external" ? "External integration" : null,
  });
}

function restartAudioListener() {
  audioListener?.stop();
  audioListener = createConfiguredAudioListener();
  if (audioListener && modelConfigured) {
    void audioListener.start();
  } else if (audioListener) {
    handleListenerStatus({
      available: true,
      capturing: false,
      monitoring: false,
      source: null,
    });
  } else {
    reportInactiveListenerStatus();
  }
}

function playConfiguredAnimation(animationName) {
  if (!hasConfiguredModel()) return false;
  const installedAnimation = settingsStore?.getAnimation(animationName);
  if (
    installedAnimation == null ||
    installedAnimation.asset_urls.length === 0
  ) {
    return false;
  }
  animationCommandRequestId += 1;
  handleBridgeEvent({
    type: "animation",
    animation: installedAnimation.animation_type ?? "CUSTOM",
    animationName: installedAnimation.animation_name,
    animationUrls: installedAnimation.asset_urls,
    source: "command",
    requestId: animationCommandRequestId,
  });
  return true;
}

async function withAvatarAlwaysOnTopPaused(operation) {
  const avatarOnTop =
    avatarWindow &&
    !avatarWindow.isDestroyed() &&
    typeof avatarWindow.isAlwaysOnTop === "function" &&
    avatarWindow.isAlwaysOnTop();
  if (avatarOnTop) {
    try {
      avatarWindow.setAlwaysOnTop(false);
    } catch {
      // ignore
    }
  }
  try {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus();
    }
    return await operation();
  } finally {
    if (avatarOnTop && avatarWindow && !avatarWindow.isDestroyed()) {
      try {
        avatarWindow.setAlwaysOnTop(true);
      } catch {
        // ignore
      }
    }
  }
}

async function selectAssetFile(kind, multiple = false) {
  const extension = kind === "model" ? "vrm" : "vrma";
  const options = {
    title: kind === "model" ? "選擇 VRM 角色檔" : "選擇 VRMA 動作檔",
    properties: ["openFile", ...(multiple ? ["multiSelections"] : [])],
    filters: [
      {
        name: kind === "model" ? "VRM models" : "VRMA animations",
        extensions: [extension],
      },
      { name: "All files", extensions: ["*"] },
    ],
  };

  return withAvatarAlwaysOnTopPaused(async () => {
    const result =
      settingsWindow && !settingsWindow.isDestroyed()
        ? await dialog.showOpenDialog(settingsWindow, options)
        : await dialog.showOpenDialog(options);
    if (result.canceled) return multiple ? [] : null;
    return multiple ? result.filePaths : result.filePaths[0] ?? null;
  });
}

async function selectAssetDirectory(title) {
  const options = {
    title,
    properties: ["openDirectory"],
  };
  return withAvatarAlwaysOnTopPaused(async () => {
    const result =
      settingsWindow && !settingsWindow.isDestroyed()
        ? await dialog.showOpenDialog(settingsWindow, options)
        : await dialog.showOpenDialog(options);
    if (result.canceled) return null;
    return result.filePaths[0] ?? null;
  });
}

function buildDirectoryImportSummary({
  kind,
  rootDir,
  scanned,
  truncated,
  imported,
  skippedQuality,
  skippedInvalid,
  skippedLimit,
  failed,
  quality,
  reportPath,
  reportError,
}) {
  return {
    kind,
    root_dir: rootDir,
    scanned,
    truncated: Boolean(truncated),
    imported,
    skipped_quality: skippedQuality,
    skipped_invalid: skippedInvalid,
    skipped_limit: skippedLimit,
    failed,
    quality,
    report_path: reportPath,
    report_error: reportError,
  };
}

function flushPendingRendererEvents() {
  rendererLoadHookAttached = false;
  if (!avatarWindow || avatarWindow.isDestroyed() || avatarWindow.webContents.isLoading()) return;
  for (const event of pendingRendererEvents.values()) {
    avatarWindow.webContents.send("voxavatar:event", event);
  }
  pendingRendererEvents.clear();
}

function ensureRendererLoadHook() {
  if (
    rendererLoadHookAttached ||
    !avatarWindow ||
    avatarWindow.isDestroyed() ||
    !avatarWindow.webContents.isLoading()
  ) {
    return;
  }
  rendererLoadHookAttached = true;
  avatarWindow.webContents.once("did-finish-load", flushPendingRendererEvents);
}

function emitToRenderer(event) {
  latestEvent = event;
  pendingRendererEvents.set(event.type, event);
  if (!avatarWindow || avatarWindow.isDestroyed()) return;
  if (avatarWindow.webContents.isLoading()) {
    ensureRendererLoadHook();
    return;
  }
  avatarWindow.webContents.send("voxavatar:event", event);
  pendingRendererEvents.delete(event.type);
}

function handleBridgeEvent(event) {
  if (event.type !== "audio-level" || event.level > 0.025) debugLog("event", event);
  const canShowAvatar = hasConfiguredModel();
  if (event.type === "state") {
    latestVoiceState = event.state;
    if (
      canShowAvatar &&
      (event.state.phase === "starting" || event.state.phase === "active")
    ) {
      showOverlay();
    }
  } else if (
    canShowAvatar &&
    event.type === "audio-level" &&
    event.level > 0.025
  ) {
    showOverlay();
  } else if (canShowAvatar && event.type === "animation") {
    showOverlay();
  }
  if (canShowAvatar) emitToRenderer(event);
}

function handleIntegrationEvent(event) {
  if (event.type === "animation-command") {
    return playConfiguredAnimation(event.animationName);
  }
  handleBridgeEvent(event);
  return true;
}

function handleListenerStatus(status) {
  latestListenerStatus = status;
  if (hasConfiguredModel()) {
    emitToRenderer({ type: "listener-status", status });
  }
}

async function handleMcpWindowAction(action) {
  if (!hasConfiguredModel()) return false;
  if (action === "show") showOverlay({ focus: true });
  else if (action === "hide") await hideOverlay();
  else if (avatarWindow?.isVisible()) await hideOverlay();
  else showOverlay({ focus: true });
  return avatarWindow?.isVisible() ?? false;
}

function getMcpStatus() {
  return {
    modelConfigured: hasConfiguredModel(),
    windowVisible: avatarWindow?.isVisible() ?? false,
    voiceState: latestVoiceState,
    listener: latestListenerStatus,
  };
}

function handleProtocolUrl(rawUrl) {
  const commands = parseProtocolUrl(rawUrl, protocolScheme);
  if (!commands) return false;
  let handled = true;
  for (const command of commands) {
    if (command.type === "show") showOverlay({ focus: true });
    else if (command.type === "hide") void hideOverlay();
    else if (command.type === "toggle") toggleOverlay();
    else if (command.type === "event") handleBridgeEvent(command.event);
    else if (command.type === "animation-command") {
      handled = playConfiguredAnimation(command.animationName) && handled;
    }
  }
  return handled;
}

function handleProtocolArgv(argv) {
  const protocolUrl = argv.find((value) => value.startsWith(`${protocolScheme}://`));
  if (protocolUrl) handleProtocolUrl(protocolUrl);
}

function refreshTrayMenu() {
  if (!tray) return;
  const t = currentMenuStrings();
  tray.setToolTip(`${t.trayTooltip} — ${t.zoomHint}`);
}

function createTray() {
  const iconPath = path.join(
    __dirname,
    "..",
    app.isPackaged ? "dist" : "public",
    "assets",
    "avatar.png",
  );
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 20, height: 20 });
  tray = new Tray(icon);
  refreshTrayMenu();
  // Do not call setContextMenu — on Windows it breaks repeated left-click toggle.
  tray.on("click", () => toggleOverlay());
  tray.on("right-click", () => popupTrayMenu());
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const handled = argv.some((value) => value.startsWith(`${protocolScheme}://`));
    handleProtocolArgv(argv);
    if (argv.includes("--settings")) showSettings();
    else if (!handled && !argv.includes("--background")) showOverlay({ focus: true });
  });

  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId("com.sanhsien.voxavatar");
    if (app.isPackaged) app.setAsDefaultProtocolClient(protocolScheme);
    settingsStore = createSettingsStore({
      userDataPath: app.getPath("userData"),
      packagedLibraryPath: path.join(
        __dirname,
        "..",
        app.isPackaged ? "dist" : "public",
        "assets",
        "library.json",
      ),
    });
    const initialSettingsSnapshot = settingsStore.getSnapshot();
    modelConfigured = snapshotHasConfiguredModel(initialSettingsSnapshot);
    mcpAnimationCatalogSignature = animationCatalogSignature(
      initialSettingsSnapshot,
    );
    protocol.handle(VOXAVATAR_ASSET_SCHEME, (request) => {
      const assetPath = settingsStore?.resolveAssetRequest(request.url);
      if (!assetPath) {
        return new Response("Asset not found", { status: 404 });
      }
      return net.fetch(pathToFileURL(assetPath).href);
    });

    handleTrustedIpc("voxavatar:get-snapshot", () => latestEvent);
    handleTrustedIpc("voxavatar:settings-get", () => settingsStore.getSnapshot());
    handleTrustedIpc("voxavatar:settings-import-model", async (_event, metadata) => {
      const filePath = await selectAssetFile("model");
      if (!filePath) return null;
      return publishSettings(
        settingsStore.importModel({ filePath, model_name: metadata?.model_name }),
      );
    });
    handleTrustedIpc(
      "voxavatar:settings-import-models-from-directory",
      async (_event, metadata) => {
        const rootDir = await selectAssetDirectory("選擇含 VRM 的資料夾");
        if (!rootDir) return null;
        const scan = collectAssetFiles(rootDir, { extensions: [".vrm"] });
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
        const { snapshot, results } = settingsStore.importModelsFromPaths(
          scan.files,
          { model_name: metadata?.model_name },
        );
        publishSettings(snapshot);
        const imported = results.filter((item) => item.ok).length;
        const skippedLimit = results.filter((item) => item.reason === "limit").length;
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
            skippedQuality: 0,
            skippedInvalid: 0,
            skippedLimit,
            failed,
            quality: null,
            reportPath: null,
            reportError: null,
          }),
        };
      },
    );
    handleTrustedIpc("voxavatar:settings-create-animation", (_event, metadata) =>
      publishSettings(settingsStore.createAnimation(metadata)),
    );
    handleTrustedIpc(
      "voxavatar:settings-add-animation-clips",
      async (_event, animationId) => {
        const filePaths = await selectAssetFile("animation", true);
        if (filePaths.length === 0) return null;
        return publishSettings(
          settingsStore.addAnimationClips(animationId, filePaths),
        );
      },
    );
    handleTrustedIpc(
      "voxavatar:settings-add-animation-clips-from-directory",
      async (_event, animationId) => {
        const rootDir = await selectAssetDirectory("選擇含 VRMA 的資料夾");
        if (!rootDir) return null;

        const scan = collectAssetFiles(rootDir, { extensions: [".vrma"] });
        const gate = normalizeQualityGate(
          settingsStore.getSnapshot().vrma_quality_gate,
        );
        const preferredReportDir = settingsStore.getSnapshot().vrma_report_dir;

        let quality = null;
        let reportPath = null;
        let reportError = null;
        let importCandidates = scan.files;
        let skippedQuality = 0;

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

        if (gate !== QUALITY_GATE.OFF) {
          const reports = analyzeVrmaFiles(scan.files);
          quality = summarizeReports(reports);
          try {
            ({ reportPath } = writeMarkdownReport(reports, {
              reportDir: preferredReportDir,
              sourceDir: rootDir,
              gate,
            }));
          } catch (error) {
            reportError =
              error instanceof Error ? error.message : String(error);
          }
          if (gate === QUALITY_GATE.STRICT) {
            const rejected = new Set(
              reports
                .filter((report) => report.verdict === VERDICT.REJECT)
                .map((report) => report.filePath),
            );
            skippedQuality = rejected.size;
            importCandidates = scan.files.filter(
              (filePath) => !rejected.has(filePath),
            );
          }
        }

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
    handleTrustedIpc(
      "voxavatar:settings-set-vrma-quality-gate",
      (_event, value) =>
        publishSettings(settingsStore.setVrmaQualityGate(value)),
    );
    handleTrustedIpc(
      "voxavatar:settings-choose-vrma-report-dir",
      async () => {
        const selected = await selectAssetDirectory(
          "選擇 VRMA 品質報告儲存資料夾",
        );
        if (!selected) return null;
        return publishSettings(settingsStore.setVrmaReportDir(selected));
      },
    );
    handleTrustedIpc("voxavatar:settings-clear-vrma-report-dir", () =>
      publishSettings(settingsStore.setVrmaReportDir(null)),
    );
    handleTrustedIpc(
      "voxavatar:settings-update-animation",
      (_event, animationId, metadata) =>
        publishSettings(
          settingsStore.updateAnimation(animationId, metadata),
        ),
    );
    handleTrustedIpc(
      "voxavatar:settings-delete-animation",
      (_event, animationId) =>
        publishSettings(settingsStore.deleteAnimation(animationId)),
    );
    handleTrustedIpc(
      "voxavatar:settings-delete-animation-clip",
      (_event, animationId, clipId) =>
        publishSettings(
          settingsStore.deleteAnimationClip(animationId, clipId),
        ),
    );
    handleTrustedIpc(
      "voxavatar:settings-reset-packaged-animations",
      () => publishSettings(settingsStore.resetPackagedAnimations()),
    );
    handleTrustedIpc(
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
    handleTrustedIpc("voxavatar:settings-delete-all-user-models", () =>
      publishSettings(settingsStore.deleteAllUserModels()),
    );
    handleTrustedIpc("voxavatar:settings-delete-all-user-animation-clips", () =>
      publishSettings(settingsStore.deleteAllUserAnimationClips()),
    );
    handleTrustedIpc("voxavatar:settings-set-default-model", (_event, modelId) =>
      publishSettings(settingsStore.setDefaultModel(modelId)),
    );
    handleTrustedIpc("voxavatar:settings-set-character-size", (_event, size) =>
      publishSettings(settingsStore.setCharacterSize(size)),
    );
    handleTrustedIpc("voxavatar:settings-set-idle-rest-ms", (_event, ms) =>
      publishSettings(settingsStore.setIdleRestMs(ms)),
    );
    handleTrustedIpc("voxavatar:settings-set-ui-locale", (_event, locale) =>
      publishSettings(settingsStore.setUiLocale(locale)),
    );
    handleTrustedIpc("voxavatar:settings-get-app-info", () => ({
      version: app.getVersion(),
    }));
    handleTrustedIpc("voxavatar:settings-show-about", async () => {
      showAboutDialog();
    });
    handleTrustedIpc("voxavatar:settings-set-voice-source", (_event, voiceSource) => {
      const snapshot = publishSettings(settingsStore.setVoiceSource(voiceSource));
      restartAudioListener();
      return snapshot;
    });
    handleTrustedIpc("voxavatar:settings-list-voice-sources", async () => {
      try {
        return {
          ...(await listVoiceSources()),
          error: null,
          events_url: `http://127.0.0.1:${mcpServerPort}/events`,
          listener: latestListenerStatus,
        };
      } catch (error) {
        return {
          platform: process.platform,
          sources: [],
          error: error instanceof Error ? error.message : String(error),
          events_url: `http://127.0.0.1:${mcpServerPort}/events`,
          listener: latestListenerStatus,
        };
      }
    });
    handleTrustedIpc(
      "voxavatar:settings-set-model-lighting",
      (_event, modelId, lighting) =>
        publishSettings(settingsStore.setModelLighting(modelId, lighting)),
    );
    handleTrustedIpc(
      "voxavatar:settings-reset-model-lighting",
      (_event, modelId) =>
        publishSettings(settingsStore.resetModelLighting(modelId)),
    );
    handleTrustedIpc("voxavatar:settings-get-mcp-status", () =>
      createMcpSettingsStatus({
        error: mcpServerError,
        health: mcpServerHealth,
        port: mcpServerPort,
        settingsSnapshot: settingsStore.getSnapshot(),
      }),
    );
    ipcMain.on("voxavatar:hide", () => void hideOverlay());
    ipcMain.on("voxavatar:set-ignore-mouse", (event, ignore) => {
      if (!avatarWindow || avatarWindow.isDestroyed()) return;
      if (event.sender !== avatarWindow.webContents) return;
      setAvatarMousePassthrough(Boolean(ignore));
    });
    handleTrustedIpc("voxavatar:get-window-bounds", (event) => {
      if (!avatarWindow || avatarWindow.isDestroyed()) return null;
      if (event.sender !== avatarWindow.webContents) return null;
      return avatarWindow.getBounds();
    });
    ipcMain.on("voxavatar:move-window", (event, payload) => {
      if (!avatarWindow || avatarWindow.isDestroyed()) return;
      if (event.sender !== avatarWindow.webContents) return;
      const x = Number(payload?.x);
      const y = Number(payload?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      avatarWindow.setPosition(Math.round(x), Math.round(y));
    });
    ipcMain.on("voxavatar:avatar-context-menu", (event) => {
      if (!avatarWindow || avatarWindow.isDestroyed()) return;
      if (event.sender !== avatarWindow.webContents) return;
      setAvatarMousePassthrough(false);
      buildAvatarContextMenu().popup({
        window: avatarWindow,
        callback: () => {
          // 下一幀 pointermove 會依 hit-test 重設；先回到穿透較安全。
          setAvatarMousePassthrough(true);
        },
      });
    });
    // The resolved theme lives in renderer storage, so the window chrome can
    // only be corrected once the settings renderer reports it. Accepts the two
    // known theme names and never a caller-supplied colour.
    ipcMain.on("voxavatar:settings-set-window-theme", (event, theme) => {
      if (theme !== "dark" && theme !== "light") return;
      if (!settingsWindow || settingsWindow.isDestroyed()) return;
      if (event.sender !== settingsWindow.webContents) return;
      const background = settingsWindowBackground(theme);
      settingsWindow.setBackgroundColor(background);
      debugLog("settings window background", theme, background);
      if (settingsWindowPresentationGate?.markThemeApplied()) {
        focusSettingsWindow();
      }
    });

    mcpHandler = createVoxAvatarMcpHandler({
      onAnimation: playConfiguredAnimation,
      onWindowAction: handleMcpWindowAction,
      getStatus: getMcpStatus,
      getAnimations: () =>
        settingsStore
          .getSnapshot()
          .animations.filter((animation) => animation.asset_urls.length > 0),
    });
    bridge = createBridgeServer({
      port: mcpServerPort,
      onEvent: handleIntegrationEvent,
      mcpHandler,
    });
    try {
      const address = await bridge.listen();
      if (address && typeof address === "object") {
        mcpServerPort = address.port;
      }
      mcpServerHealth = "online";
      mcpServerError = null;
    } catch (error) {
      mcpServerHealth = "unavailable";
      mcpServerError =
        error instanceof Error ? error.message : String(error);
      console.error(
        "[voxavatar] local integration server unavailable:",
        mcpServerError,
      );
      bridge = null;
    }

    createTray();
    globalShortcut.register("CommandOrControl+Shift+A", toggleOverlay);
    handleProtocolArgv(process.argv);

    audioListener = createConfiguredAudioListener();
    if (audioListener && modelConfigured) void audioListener.start();
    if (!audioListener) {
      handleListenerStatus({
        available: false,
        capturing: false,
        monitoring: false,
        source: null,
      });
    }

    if (!modelConfigured || startInSettings) {
      showSettings();
    } else if (!startInBackground) {
      createWindow();
      showOverlay({ focus: true });
    }
  });
}

app.on("activate", () => showOverlay({ focus: true }));

app.on("before-quit", () => {
  isQuitting = true;
  audioListener?.stop();
  globalShortcut.unregisterAll();
  void mcpHandler?.close();
  void bridge
    ?.close()
    .catch((error) => debugLog("integration server close failed", error));
});

app.on("window-all-closed", () => {
  // The tray, protocol handler, and adapter server keep VoxAvatar available.
});
