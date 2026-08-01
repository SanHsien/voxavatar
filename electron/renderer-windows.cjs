"use strict";

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

function createRendererWindows({
  path,
  pathToFileURL,
  BrowserWindow,
  shell,
  nativeTheme,
  isAllowedRendererNavigation,
  createSettingsWindowPresentationGate,
  electronDir,
  devServerUrl,
  preloadAvatarPath,
  preloadSettingsPath,
  getIsQuitting,
  getAvatarMousePassthrough,
  setAvatarMousePassthroughFlag,
  onAvatarWindowClosed,
  positionWindow,
  setAvatarMousePassthrough,
  hideOverlay,
  focusSettingsWindow,
  getAvatarWindow,
  setAvatarWindow,
  getSettingsWindow,
  setSettingsWindow,
  getSettingsWindowPresentationGate,
  setSettingsWindowPresentationGate,
}) {
  function rendererUrl(view = null) {
    const url = new URL(
      devServerUrl ||
        pathToFileURL(path.join(electronDir, "..", "dist", "index.html")).href,
    );
    if (view) url.searchParams.set("view", view);
    return url.href;
  }

  function trustedRendererUrls() {
    return [rendererUrl(), rendererUrl("settings")];
  }

  function settingsWindowBackground(theme) {
    return SETTINGS_WINDOW_BACKGROUND[theme] ?? SETTINGS_WINDOW_BACKGROUND.dark;
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
    const existing = getAvatarWindow();
    if (existing && !existing.isDestroyed()) return existing;

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
        preload: preloadAvatarPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    setAvatarWindow(window);

    window.setAlwaysOnTop(true, "floating");
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    window.setOpacity(1);
    // Transparent pixels click through; renderer re-enables hit-testing over the avatar.
    window.setIgnoreMouseEvents(true, { forward: true });
    setAvatarMousePassthroughFlag(true);
    window.once("ready-to-show", () => {
      if (window.isDestroyed()) return;
      positionWindow(window);
    });
    window.on("show", () => {
      if (window.isDestroyed()) return;
      window.setAlwaysOnTop(true, "floating");
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
      window.setOpacity(1);
      setAvatarMousePassthrough(getAvatarMousePassthrough());
    });
    window.on("close", (event) => {
      if (getIsQuitting()) return;
      event.preventDefault();
      void hideOverlay();
    });
    window.on("closed", () => {
      if (getAvatarWindow() !== window) return;
      onAvatarWindowClosed();
      setAvatarWindow(null);
    });

    const avatarRendererUrl = rendererUrl();
    secureRendererWindow(window, avatarRendererUrl);
    void window.loadURL(avatarRendererUrl);
    return window;
  }

  function createSettingsWindow() {
    const existing = getSettingsWindow();
    if (existing && !existing.isDestroyed()) return existing;

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
        preload: preloadSettingsPath,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    const presentationGate = createSettingsWindowPresentationGate();
    setSettingsWindow(window);
    setSettingsWindowPresentationGate(presentationGate);

    const settingsRendererUrl = rendererUrl("settings");
    secureRendererWindow(window, settingsRendererUrl);
    window.once("ready-to-show", () => {
      if (
        getSettingsWindow() !== window ||
        getSettingsWindowPresentationGate() !== presentationGate
      ) {
        return;
      }
      if (presentationGate.markReadyToShow()) focusSettingsWindow();
    });
    window.on("closed", () => {
      if (getSettingsWindow() !== window) return;
      setSettingsWindow(null);
      setSettingsWindowPresentationGate(null);
    });
    void window.loadURL(settingsRendererUrl);
    return window;
  }

  return {
    createSettingsWindow,
    createWindow,
    rendererUrl,
    secureRendererWindow,
    settingsWindowBackground,
    trustedRendererUrls,
  };
}

module.exports = {
  SETTINGS_WINDOW_BACKGROUND,
  createRendererWindows,
};
