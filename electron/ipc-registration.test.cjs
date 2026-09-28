"use strict";

/**
 * IPC 註冊面的結構性 pin。
 *
 * 設定變更一律要走 `handleTrustedSettingsIpc`（驗 renderer URL＋settings 視窗
 * webContents）。真正的風險不是現有 handler 漏檢，而是**日後有人直接用
 * `ipcMain.handle`／`ipcMain.on` 加通道**而繞過包裝——那種漏洞靠 review 抓不住。
 *
 * 本測試直接讀 `main.cjs` 原始碼，釘住「未經包裝註冊的通道」精確集合，並要求
 * 每個這樣的通道在自己的 body 裡驗 `event.sender`。新增未包裝的通道會讓 CI 紅，
 * 而不是等人看出來。構想取自上游 xikhar/persona PR #48（漏洞本身本 fork 已涵蓋）。
 */

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const MAIN_SOURCE = fs.readFileSync(
  path.join(__dirname, "main.cjs"),
  "utf8",
);

/** 只有這三個包裝可以用變數通道名註冊。 */
const TRUSTED_WRAPPERS = [
  "handleTrustedIpc",
  "handleTrustedSettingsIpc",
  "handleTrustedAvatarIpc",
];

/**
 * 未經包裝、以字面字串註冊的通道。每一個都必須在 body 內自行比對
 * `event.sender`，且都不得是設定變更通道。
 */
const EXPECTED_UNWRAPPED_CHANNELS = [
  "voxavatar:avatar-context-menu",
  "voxavatar:hide",
  "voxavatar:move-window",
  "voxavatar:set-ignore-mouse",
  "voxavatar:settings-set-window-theme",
];

const REGISTRATION = /ipcMain\.(handle|handleOnce|on)\(\s*(?:"([^"]+)"|'([^']+)'|`([^`]+)`|([A-Za-z_$][\w$]*))/g;

function registrations() {
  return [...MAIN_SOURCE.matchAll(REGISTRATION)].map((match) => ({
    method: match[1],
    channel: match[2] ?? match[3] ?? match[4] ?? null,
    identifier: match[5] ?? null,
    index: match.index ?? 0,
  }));
}

test("main.cjs still registers IPC through the expected shapes", () => {
  const found = registrations();
  // 防止正則失效變成空跑：主程序一定有 ipcMain 註冊。
  assert.ok(found.length >= 6, `expected IPC registrations, found ${found.length}`);
  assert.ok(
    found.some((entry) => entry.identifier != null),
    "expected at least one wrapper registration using a variable channel",
  );
});

test("only the trusted wrappers register IPC with a variable channel", () => {
  const variableRegistrations = registrations().filter(
    (entry) => entry.identifier != null,
  );
  assert.equal(
    variableRegistrations.length,
    TRUSTED_WRAPPERS.length,
    `variable-channel registrations must stay limited to ${TRUSTED_WRAPPERS.join(", ")}`,
  );
  for (const entry of variableRegistrations) {
    // 每個變數註冊都應落在對應包裝函式的定義之後、下一個函式定義之前。
    const preceding = MAIN_SOURCE.slice(0, entry.index);
    const wrapper = TRUSTED_WRAPPERS.find((name) =>
      preceding.lastIndexOf(`function ${name}(`) >= 0
        ? preceding.lastIndexOf(`function ${name}(`) ===
          Math.max(
            ...TRUSTED_WRAPPERS.map((candidate) =>
              preceding.lastIndexOf(`function ${candidate}(`),
            ),
          )
        : false,
    );
    assert.ok(
      wrapper,
      "variable-channel ipcMain registration outside a trusted wrapper",
    );
  }
});

test("every unwrapped channel is pinned and checks event.sender itself", () => {
  const literal = registrations()
    .filter((entry) => entry.channel != null)
    .map((entry) => entry.channel);
  assert.deepEqual(
    [...new Set(literal)].sort(),
    EXPECTED_UNWRAPPED_CHANNELS,
    "unwrapped ipcMain channels changed; settings mutations must use handleTrustedSettingsIpc",
  );

  for (const channel of EXPECTED_UNWRAPPED_CHANNELS) {
    const start = MAIN_SOURCE.indexOf(`ipcMain.on("${channel}"`);
    assert.ok(start >= 0, `expected a registration for ${channel}`);
    const body = MAIN_SOURCE.slice(start, start + 900);
    assert.match(
      body,
      /event\.sender !==/,
      `${channel} must compare event.sender before acting`,
    );
  }
});

test("no unwrapped channel mutates settings", () => {
  // settings-get 之外的設定通道都必須經過 settings 包裝；set-window-theme 是
  // 視窗底色修正（send 無回傳通道），已在 body 內驗 settingsWindow.webContents。
  const mutating = EXPECTED_UNWRAPPED_CHANNELS.filter(
    (channel) =>
      channel.startsWith("voxavatar:settings-") &&
      channel !== "voxavatar:settings-set-window-theme",
  );
  assert.deepEqual(mutating, []);
});
