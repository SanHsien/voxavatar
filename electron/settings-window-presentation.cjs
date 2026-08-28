"use strict";

function createSettingsWindowPresentationGate() {
  let readyToShow = false;
  let themeApplied = false;
  let showRequested = false;

  function takeShowRequest() {
    if (!readyToShow || !themeApplied || !showRequested) return false;
    showRequested = false;
    return true;
  }

  return {
    markReadyToShow() {
      readyToShow = true;
      return takeShowRequest();
    },
    markThemeApplied() {
      themeApplied = true;
      return takeShowRequest();
    },
    requestShow() {
      showRequested = true;
      return takeShowRequest();
    },
  };
}

module.exports = { createSettingsWindowPresentationGate };
