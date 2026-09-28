"use strict";

/**
 * 系統匣／角色右鍵「角色狀態」選單結構（可測純邏輯）。
 * click 由呼叫端注入；此模組不碰 Electron Menu。
 */

const CHARACTER_STATE_MENU_ORDER = Object.freeze([
  "idle",
  "listening",
  "speaking",
  "working",
  "reviewing",
  "success",
  "failed",
]);

const TRAY_USER_SOURCE_ID = "tray-user";

/**
 * @param {Record<string, string>} labels i18n 字串表（需含 characterState* 鍵）
 * @param {{ onSelect: (state: string) => void, onClear: () => void }} handlers
 * @returns {Array<{ type?: string, label?: string, state?: string, click?: Function }>}
 */
function buildCharacterStateMenuSubmenu(labels, handlers) {
  const onSelect =
    typeof handlers?.onSelect === "function" ? handlers.onSelect : () => {};
  const onClear =
    typeof handlers?.onClear === "function" ? handlers.onClear : () => {};
  const entries = CHARACTER_STATE_MENU_ORDER.map((state) => {
    const key =
      "characterState" + state.charAt(0).toUpperCase() + state.slice(1);
    return {
      label: labels[key] ?? state,
      state,
      click: () => onSelect(state),
    };
  });
  return [
    ...entries,
    { type: "separator" },
    {
      label: labels.characterStateClear ?? "Clear",
      state: null,
      click: () => onClear(),
    },
  ];
}

module.exports = {
  CHARACTER_STATE_MENU_ORDER,
  TRAY_USER_SOURCE_ID,
  buildCharacterStateMenuSubmenu,
};
