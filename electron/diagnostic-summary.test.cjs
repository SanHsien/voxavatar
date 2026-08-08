"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildDiagnosticSummary,
  redactSensitive,
} = require("./diagnostic-summary.cjs");

test("redactSensitive strips home, username, paths, and asset names", () => {
  const input =
    "err C:\\Users\\SanHsien\\OneDrive\\人物\\Daily_Miku.vrm home=/Users/SanHsien/proj";
  const out = redactSensitive(input, {
    homeDir: "C:\\Users\\SanHsien",
    username: "SanHsien",
  });
  assert.doesNotMatch(out, /SanHsien/i);
  assert.doesNotMatch(out, /Daily_Miku\.vrm/i);
  assert.match(out, /<home>|<path>|<asset>/);
});

test("redactSensitive matches shared fixture secrets with UI heuristics", () => {
  const cases = require("../scripts/fixtures/redact-cases.json");
  for (const entry of cases) {
    const out = redactSensitive(entry.input, {
      homeDir: "",
      username: "",
    });
    for (const secret of entry.mustNotContain) {
      assert.doesNotMatch(
        out,
        new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
        `${entry.id} leaked ${secret}: ${out}`,
      );
    }
  }
});

// 迴歸：homeDir／username 真的命中時，精確替換插入的 <home>／<user> 會切斷後續路徑正則
// （字元類排除 <>），害資料夾名留在原地。CI runner 的帳號永遠不等於 fixture 字串，測不到，
// 所以這裡顯式帶入 homeDir／username，讓失敗與執行環境無關。
test("redactSensitive redacts folder tails when home and username match", () => {
  const cases = [
    "err C:\\Users\\SanHsien\\OneDrive\\人物\\clip.VRMA",
    "ENOENT C:\\Users\\SanHsien\\AppData\\Local\\ChatGPT\\app.exe",
    "open C:/Users/SanHsien/OneDrive/私人素材",
  ];
  for (const input of cases) {
    const out = redactSensitive(input, {
      homeDir: "C:\\Users\\SanHsien",
      username: "SanHsien",
    });
    assert.doesNotMatch(out, /SanHsien/i, input);
    assert.doesNotMatch(out, /OneDrive|AppData|ChatGPT/i, input);
    assert.doesNotMatch(out, /人物|私人素材/, input);
    assert.doesNotMatch(out, /clip|app\.exe/i, input);
    assert.match(out, /<home>|<path>|<user>|<asset>/, input);
  }
});

test("buildDiagnosticSummary never embeds absolute paths or asset names", () => {
  const text = buildDiagnosticSummary({
    readiness: {
      schema_version: 1,
      complete: false,
      window_visible: false,
      listener_state: "missing",
      mcp_health: "unavailable",
      playable_actions: 0,
      voice_activity: null,
      steps: [
        {
          id: "model",
          ready: false,
          optional: false,
          code: "model_missing",
          next_action: "import_model",
        },
      ],
      next_step: {
        id: "model",
        code: "model_missing",
        next_action: "import_model",
      },
    },
    appVersion: "0.2.7",
    platform: "win32",
    generatedAt: "2026-08-01T00:00:00.000Z",
  });
  assert.match(text, /VoxAvatar diagnostic summary/);
  assert.match(text, /setup_complete: no/);
  assert.match(text, /next: model/);
  assert.doesNotMatch(text, /\.vrm/i);
  assert.doesNotMatch(text, /C:\\/i);
});

test("buildDiagnosticSummary reports setup complete with no next step", () => {
  const text = buildDiagnosticSummary({
    readiness: {
      schema_version: 1,
      complete: true,
      window_visible: true,
      listener_state: "running",
      mcp_health: "online",
      playable_actions: 2,
      voice_activity: null,
      steps: [
        {
          id: "model",
          ready: true,
          optional: false,
          code: "model_ready",
          next_action: null,
        },
      ],
      next_step: null,
    },
    appVersion: "0.16.11",
    platform: "win32",
    generatedAt: "2026-08-02T00:00:00.000Z",
  });
  assert.match(text, /setup_complete: yes/);
  assert.match(text, /next: none/);
});
