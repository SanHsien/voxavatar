"use strict";

/**
 * Avatar overlay 顯示／隱藏／銷毀生命週期（與 BrowserWindow 細節解耦）。
 */

function createOverlayLifecycle({
  hasConfiguredModel,
  createWindow,
  getAvatarWindow,
  setAvatarWindow,
  showSettings,
  debugLog = () => {},
  onBeforeDestroy = () => {},
}) {
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
    const targetWindow = getAvatarWindow();
    if (!targetWindow || targetWindow.isDestroyed()) return;
    targetWindow.hide();
  }

  function destroyOverlayForSetup() {
    onBeforeDestroy();
    const avatarWindow = getAvatarWindow();
    if (avatarWindow && !avatarWindow.isDestroyed()) {
      avatarWindow.destroy();
    }
    setAvatarWindow(null);
  }

  function toggleOverlay() {
    if (!hasConfiguredModel()) {
      showSettings();
      return;
    }
    const avatarWindow = getAvatarWindow();
    if (avatarWindow && !avatarWindow.isDestroyed() && avatarWindow.isVisible()) {
      void hideOverlay();
    } else {
      showOverlay({ focus: true });
    }
  }

  return {
    showOverlay,
    hideOverlay,
    destroyOverlayForSetup,
    toggleOverlay,
  };
}

module.exports = {
  createOverlayLifecycle,
};
