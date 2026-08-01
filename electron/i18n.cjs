"use strict";

const LOCALES = Object.freeze({
  "zh-TW": Object.freeze({
    id: "zh-TW",
    trayTooltip: "VoxAvatar",
    show: "顯示 VoxAvatar",
    hide: "隱藏 VoxAvatar",
    settings: "設定…",
    setup: "設定 VoxAvatar…",
    about: "關於 VoxAvatar…",
    aboutTitle: "關於 VoxAvatar",
    aboutDetail:
      "版本 {version}\n\nWindows 桌面 VRM 語音伴侶。\n語音監聽預設僅針對指定應用程式；若啟用「輸出裝置」模式，會監聽目前播放裝置上的所有聲音。",
    aboutOk: "確定",
    previewListening: "預覽聆聽",
    previewSpeaking: "預覽說話",
    language: "語系",
    languageZh: "繁體中文",
    languageEn: "English",
    quit: "結束",
    resetView: "重設視角",
    clickThroughHint: "透明區可點穿桌面",
    zoomHint: "滾輪縮放人物",
  }),
  en: Object.freeze({
    id: "en",
    trayTooltip: "VoxAvatar",
    show: "Show VoxAvatar",
    hide: "Hide VoxAvatar",
    settings: "Settings…",
    setup: "Set up VoxAvatar…",
    about: "About VoxAvatar…",
    aboutTitle: "About VoxAvatar",
    aboutDetail:
      "Version {version}\n\nWindows desktop VRM voice companion.\nVoice listening defaults to a selected app; Output-device mode listens to all audio on the current playback device.",
    aboutOk: "OK",
    previewListening: "Preview listening",
    previewSpeaking: "Preview speaking",
    language: "Language",
    languageZh: "繁體中文",
    languageEn: "English",
    quit: "Quit",
    resetView: "Reset view",
    clickThroughHint: "Transparent areas click through",
    zoomHint: "Scroll wheel to zoom",
  }),
});

function normalizeUiLocale(value) {
  return value === "en" ? "en" : "zh-TW";
}

function menuStrings(locale) {
  return LOCALES[normalizeUiLocale(locale)] ?? LOCALES["zh-TW"];
}

module.exports = {
  LOCALES,
  menuStrings,
  normalizeUiLocale,
};
