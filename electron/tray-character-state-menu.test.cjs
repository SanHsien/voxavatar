"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CHARACTER_STATE_MENU_ORDER,
  TRAY_USER_SOURCE_ID,
  buildCharacterStateMenuSubmenu,
} = require("./tray-character-state-menu.cjs");

const LABELS = Object.freeze({
  characterStateIdle: "idle 待機",
  characterStateListening: "listening 聆聽",
  characterStateSpeaking: "speaking 說話",
  characterStateWorking: "working 工作中",
  characterStateReviewing: "reviewing 檢視中",
  characterStateSuccess: "success 成功",
  characterStateFailed: "failed 失敗",
  characterStateClear: "清除手動狀態",
});

test("buildCharacterStateMenuSubmenu lists seven states then clear", () => {
  const selected = [];
  let cleared = 0;
  const menu = buildCharacterStateMenuSubmenu(LABELS, {
    onSelect: (state) => selected.push(state),
    onClear: () => {
      cleared += 1;
    },
  });
  assert.equal(menu.length, CHARACTER_STATE_MENU_ORDER.length + 2);
  assert.deepEqual(
    menu.slice(0, 7).map((item) => item.state),
    [...CHARACTER_STATE_MENU_ORDER],
  );
  assert.equal(menu[7].type, "separator");
  assert.equal(menu[8].label, "清除手動狀態");
  assert.equal(menu[8].state, null);

  menu[0].click();
  menu[3].click();
  menu[8].click();
  assert.deepEqual(selected, ["idle", "working"]);
  assert.equal(cleared, 1);
});

test("tray user source id is stable", () => {
  assert.equal(TRAY_USER_SOURCE_ID, "tray-user");
});
