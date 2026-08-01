"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");
const { createRendererWindows } = require("./renderer-windows.cjs");

function createTestRendererWindows(overrides = {}) {
  return createRendererWindows({
    path,
    pathToFileURL,
    BrowserWindow: class {},
    shell: { openExternal: () => {} },
    nativeTheme: { shouldUseDarkColors: true },
    isAllowedRendererNavigation: () => true,
    createSettingsWindowPresentationGate: () => ({
      markReadyToShow: () => false,
    }),
    electronDir: path.join(__dirname),
    devServerUrl: undefined,
    preloadAvatarPath: path.join(__dirname, "preload-avatar.cjs"),
    preloadSettingsPath: path.join(__dirname, "preload-settings.cjs"),
    getIsQuitting: () => false,
    getAvatarMousePassthrough: () => true,
    setAvatarMousePassthroughFlag: () => {},
    onAvatarWindowClosed: () => {},
    positionWindow: () => {},
    setAvatarMousePassthrough: () => {},
    hideOverlay: async () => {},
    focusSettingsWindow: () => {},
    getAvatarWindow: () => null,
    setAvatarWindow: () => {},
    getSettingsWindow: () => null,
    setSettingsWindow: () => {},
    getSettingsWindowPresentationGate: () => null,
    setSettingsWindowPresentationGate: () => {},
    ...overrides,
  });
}

test("rendererUrl assembles the packaged entry without a view query", () => {
  const { rendererUrl } = createTestRendererWindows();
  const url = new URL(rendererUrl());
  assert.equal(url.pathname.endsWith("/dist/index.html"), true);
  assert.equal(url.searchParams.get("view"), null);
});

test("rendererUrl adds view=settings for the settings window", () => {
  const { rendererUrl } = createTestRendererWindows();
  const url = new URL(rendererUrl("settings"));
  assert.equal(url.searchParams.get("view"), "settings");
});

test("trustedRendererUrls includes avatar and settings entry points", () => {
  const { trustedRendererUrls } = createTestRendererWindows();
  const [avatarUrl, settingsUrl] = trustedRendererUrls();
  assert.equal(new URL(avatarUrl).searchParams.get("view"), null);
  assert.equal(new URL(settingsUrl).searchParams.get("view"), "settings");
});

test("rendererUrl uses the development server when configured", () => {
  const { rendererUrl } = createTestRendererWindows({
    devServerUrl: "http://127.0.0.1:5173/",
  });
  assert.equal(rendererUrl(), "http://127.0.0.1:5173/");
  assert.equal(rendererUrl("settings"), "http://127.0.0.1:5173/?view=settings");
});

test("settingsWindowBackground resolves known themes", () => {
  const { settingsWindowBackground } = createTestRendererWindows();
  assert.equal(settingsWindowBackground("dark"), "#0d0e12");
  assert.equal(settingsWindowBackground("light"), "#e6e8ec");
  assert.equal(settingsWindowBackground("unknown"), "#0d0e12");
});
