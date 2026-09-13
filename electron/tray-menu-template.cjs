"use strict";

/**
 * 系統匣頂層選單骨架（可測純邏輯）。
 * click 由呼叫端注入；此模組不碰 Electron Menu／Tray。
 */

/**
 * @param {Record<string, string>} labels
 * @param {{
 *   ready: boolean,
 *   visible?: boolean,
 *   locale?: string,
 *   onSetup?: () => void,
 *   onToggleVisible?: () => void,
 *   onResetView?: () => void,
 *   onSettings?: () => void,
 *   onPreviewListening?: () => void,
 *   onPreviewSpeaking?: () => void,
 *   onSetLocale?: (locale: string) => void,
 *   onAbout?: () => void,
 *   onQuit?: () => void,
 *   characterStateSubmenu?: Array<object>,
 * }} options
 */
function buildTrayMenuTemplate(labels, options = {}) {
  const ready = options.ready === true;
  const visible = options.visible === true;
  const locale = options.locale === "en" ? "en" : "zh-TW";
  const languageSubmenu = [
    {
      label: labels.languageZh ?? "繁體中文",
      type: "radio",
      checked: locale === "zh-TW",
      click: () => options.onSetLocale?.("zh-TW"),
    },
    {
      label: labels.languageEn ?? "English",
      type: "radio",
      checked: locale === "en",
      click: () => options.onSetLocale?.("en"),
    },
  ];
  const aboutItem = {
    label: labels.about ?? "About",
    click: () => options.onAbout?.(),
  };
  const quitItem = {
    label: labels.quit ?? "Quit",
    click: () => options.onQuit?.(),
  };

  if (!ready) {
    return [
      { label: labels.setup ?? "Setup", action: "setup", click: () => options.onSetup?.() },
      { type: "separator" },
      { label: labels.language ?? "Language", submenu: languageSubmenu },
      { type: "separator" },
      aboutItem,
      quitItem,
    ];
  }

  return [
    {
      label: visible ? labels.hide ?? "Hide" : labels.show ?? "Show",
      action: visible ? "hide" : "show",
      click: () => options.onToggleVisible?.(),
    },
    {
      label: labels.resetView ?? "Reset view",
      action: "resetView",
      enabled: visible,
      click: () => options.onResetView?.(),
    },
    {
      label: labels.settings ?? "Settings",
      action: "settings",
      click: () => options.onSettings?.(),
    },
    { type: "separator" },
    {
      label: labels.characterState ?? "Character state",
      action: "characterState",
      submenu: options.characterStateSubmenu ?? [],
    },
    {
      label: labels.previewListening ?? "Preview listening",
      action: "previewListening",
      click: () => options.onPreviewListening?.(),
    },
    {
      label: labels.previewSpeaking ?? "Preview speaking",
      action: "previewSpeaking",
      click: () => options.onPreviewSpeaking?.(),
    },
    { type: "separator" },
    { label: labels.language ?? "Language", submenu: languageSubmenu },
    { type: "separator" },
    aboutItem,
    quitItem,
  ];
}

module.exports = {
  buildTrayMenuTemplate,
};
