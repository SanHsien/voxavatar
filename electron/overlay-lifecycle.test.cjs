"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { createOverlayLifecycle } = require("./overlay-lifecycle.cjs");

function fakeWindow({ visible = false, minimized = false } = {}) {
  let isVisible = visible;
  let isMinimized = minimized;
  let destroyed = false;
  return {
    isDestroyed: () => destroyed,
    isVisible: () => isVisible,
    isMinimized: () => isMinimized,
    restore: () => {
      isMinimized = false;
    },
    show: () => {
      isVisible = true;
    },
    showInactive: () => {
      isVisible = true;
    },
    hide: () => {
      isVisible = false;
    },
    focus: () => {},
    destroy: () => {
      destroyed = true;
      isVisible = false;
    },
  };
}

test("showOverlay opens settings when model is missing", () => {
  let settingsOpened = 0;
  const lifecycle = createOverlayLifecycle({
    hasConfiguredModel: () => false,
    createWindow: () => fakeWindow(),
    getAvatarWindow: () => null,
    setAvatarWindow: () => {},
    showSettings: () => {
      settingsOpened += 1;
    },
  });
  lifecycle.showOverlay();
  assert.equal(settingsOpened, 1);
});

test("toggleOverlay hides a visible window and shows when hidden", async () => {
  const window = fakeWindow({ visible: true });
  let current = window;
  const lifecycle = createOverlayLifecycle({
    hasConfiguredModel: () => true,
    createWindow: () => current,
    getAvatarWindow: () => current,
    setAvatarWindow: (next) => {
      current = next;
    },
    showSettings: () => {
      throw new Error("should not open settings");
    },
  });
  lifecycle.toggleOverlay();
  assert.equal(window.isVisible(), false);
  lifecycle.toggleOverlay();
  assert.equal(window.isVisible(), true);
});

test("destroyOverlayForSetup clears window reference", () => {
  const window = fakeWindow({ visible: true });
  let current = window;
  let before = 0;
  const lifecycle = createOverlayLifecycle({
    hasConfiguredModel: () => true,
    createWindow: () => current,
    getAvatarWindow: () => current,
    setAvatarWindow: (next) => {
      current = next;
    },
    showSettings: () => {},
    onBeforeDestroy: () => {
      before += 1;
    },
  });
  lifecycle.destroyOverlayForSetup();
  assert.equal(before, 1);
  assert.equal(current, null);
  assert.equal(window.isDestroyed(), true);
});
