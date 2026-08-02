"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { buildTrayMenuTemplate } = require("./tray-menu-template.cjs");
const { menuStrings } = require("./i18n.cjs");

const LABELS = Object.freeze({
  ...menuStrings("zh-TW"),
  show: "顯示",
  hide: "隱藏",
  resetView: "重設視角",
  settings: "設定",
  language: "語言",
  languageZh: "繁體中文",
  languageEn: "English",
  about: "關於",
  quit: "結束",
});

test("buildTrayMenuTemplate shows setup when no model is ready", () => {
  const calls = [];
  const menu = buildTrayMenuTemplate(LABELS, {
    ready: false,
    onSetup: () => calls.push("setup"),
    onQuit: () => calls.push("quit"),
  });
  assert.equal(menu[0].action, "setup");
  assert.equal(menu[0].label, menuStrings("zh-TW").setup);
  assert.ok(menu.some((item) => item.label === "語言"));
  assert.ok(menu.some((item) => item.label === "關於"));
  assert.equal(menu.at(-1).label, "結束");
  assert.ok(!menu.some((item) => item.action === "settings"));
  menu[0].click();
  menu.at(-1).click();
  assert.deepEqual(calls, ["setup", "quit"]);
});

test("buildTrayMenuTemplate lists show/hide and previews when ready", () => {
  const calls = [];
  const menu = buildTrayMenuTemplate(LABELS, {
    ready: true,
    visible: false,
    locale: "en",
    characterStateSubmenu: [{ label: "idle" }],
    onToggleVisible: () => calls.push("toggle"),
    onPreviewListening: () => calls.push("listen"),
    onPreviewSpeaking: () => calls.push("speak"),
    onSetLocale: (locale) => calls.push(`locale:${locale}`),
  });
  assert.equal(menu[0].action, "show");
  assert.equal(menu[0].label, "顯示");
  assert.equal(menu[1].action, "resetView");
  assert.equal(menu[1].enabled, false);
  assert.equal(menu[2].action, "settings");
  assert.equal(menu[4].action, "characterState");
  assert.equal(menu[4].submenu.length, 1);
  assert.equal(menu[5].action, "previewListening");
  assert.equal(menu[6].action, "previewSpeaking");

  const language = menu.find((item) => item.label === "語言");
  assert.ok(language?.submenu);
  assert.equal(language.submenu[1].checked, true);
  language.submenu[0].click();
  menu[0].click();
  menu[5].click();
  menu[6].click();
  assert.deepEqual(calls, ["locale:zh-TW", "toggle", "listen", "speak"]);
});

test("buildTrayMenuTemplate uses hide when avatar is visible", () => {
  const menu = buildTrayMenuTemplate(LABELS, {
    ready: true,
    visible: true,
  });
  assert.equal(menu[0].action, "hide");
  assert.equal(menu[1].enabled, true);
});
