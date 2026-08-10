# 開發 VoxAvatar

## 技術基線

- Windows 10 build 20348+／Windows 11 x64
- Node.js 24（CI 基準版本）與 npm
- Electron、Vite、React、TypeScript、Three.js、`@pixiv/three-vrm`

**Node 25 已知不相容**：Node 25 起內建 Web Storage 全域會覆蓋 jsdom 的 `window.localStorage`（未給 `--localstorage-file` 時該物件連 `setItem` 都沒有），`src/theme.test.ts` 會以 `TypeError: window.localStorage.clear is not a function` 失敗。與產品程式無關，正式 gate 是 CI 的 Node 24；本機請用 Node 24 跑 `npm run check`。

Visual Studio Build Tools 與「使用 C++ 的桌面開發」工作負載只用於編譯 WASAPI helper 與本機安裝包。一般 UI、設定、MCP、文件與 JavaScript／TypeScript 工作不需要安裝；正式 native／installer gate 由 GitHub Windows runner 執行。

## 架構

```text
Windows 應用程式播放輸出
        │ WASAPI process loopback（只取音量）
        ▼
voxavatar-audio-listener.exe
        │ NDJSON
        ▼
Electron main ── 設定／系統匣／MCP／HTTP／protocol
        │ sandboxed、context-isolated preload bridge
        ▼
React + Three.js renderer ── VRM／VRMA／口型／視窗互動
```

安全界線：main process 處理檔案、process discovery 與網路 listener；renderer 保持 sandbox、context isolation、無 Node integration。使用者媒體只透過登記 ID 的 `voxavatar-asset:` protocol 進入 renderer。avatar 與 settings 使用不同 preload（`preload-avatar.cjs`／`preload-settings.cjs`）；設定寫入 IPC 另驗 settings 視窗 webContents。

## 目錄

| 路徑 | 用途 |
| --- | --- |
| `electron/` | main、preload-avatar／preload-settings、設定、MCP／HTTP、語音來源與 Node tests |
| `src/` | React／Three.js renderer、動作邏輯與 Vitest |
| `native/windows/` | WASAPI process-loopback C++ helper |
| `scripts/` | 原生 build、自測、資產／文件／版本／checksum、離線 VRMA 整理（`vrma:curate`） |
| `public/assets/` | UI 圖示、打包 catalog 與授權 manifest；預設不含 VRM／VRMA |
| `docs/` | 架構、整合、動作、決策與發行文件 |
| `.github/` | CI、CodeQL、Dependabot、Release 與貢獻模板 |

## 本機開發

```powershell
npm ci
npm run dev
```

`npm run dev` 同時啟動 Vite 與 Electron。未編譯 `native/bin/win32/voxavatar-audio-listener.exe` 時，UI、設定、素材與 MCP 仍可開發，但 application-loopback 語音 listener 會顯示不可用。`npm run demo` 先建立 production renderer 再啟動桌面程式。使用本機 catalog 範例時，複製 `public/assets/library.json.example` 與 `manifest.json.example`，但不要提交測試媒體。

需要完整語音路徑或本機 installer 時：

```powershell
npm run native:build
npm run native:test
npm run dist:windows
```

## 驗證矩陣

| 指令 | 內容 |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run docs:check` | Markdown 本機連結、控制字元、檔尾與舊 MCP 名稱 |
| `npm test` | Electron／scripts Node tests + renderer Vitest |
| `npm run assets:check` | 開發用 catalog／manifest 契約 |
| `npm run assets:release` | 發行資產授權 fail-closed gate |
| `npm run audit:production` | production dependency audit |
| `npm run build` | TypeScript + Vite production build |
| `npm run native:build` | 編譯 Windows helper |
| `npm run native:test` | helper self-test 與 Usage=2 typed exit 斷言 |
| `npm run baseline:bundle` | 產生／對照 renderer bundle 基準（可選） |
| `npm run baseline:startup` | 量測 main process 關鍵模組 require 耗時（可選） |
| `npm run evidence:manifest -- --version <ver> [--smoke-md] …` | 寫入 `docs/release-evidence/v{ver}/manifest.json`（可選 windows-smoke.md）；可填 installer SHA／size |
| `npm run sbom` | 從 lockfile 產生 production SBOM（預設 `release/sbom.json`） |
| `npm run check` | 非原生的完整日常 gate |
| `npm run dist:windows` | 原生 build／test + NSIS 安裝包 |

離線整理流程與改名計畫契約見 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)「離線 VRMA 整理流程」；工具刻意不推斷動作語意（[`DECISIONS.md`](DECISIONS.md) §10）。發行證據目錄見 [`RELEASING.md`](RELEASING.md) 與 `docs/release-evidence/`。

## 效能基準（本地）

以下腳本輸出至 gitignore 的 `release/`，供回歸對照；不等同於已填寫的 Windows 實機證據。

### Bundle 基準

```powershell
npm run baseline:bundle
```

產生 `release/bundle-baseline.json`（main chunk、SettingsPage chunk、JS/CSS 總量）。若要與前次結果比較：

1. 將目前的 `release/bundle-baseline.json` 複製為 `release/bundle-baseline.prev.json`
2. 修改程式或設定後再執行一次 `npm run baseline:bundle`

腳本會自動讀取 `release/bundle-baseline.prev.json`（或 `--compare <path>`），在 JSON 的 `comparison` 與 `guidance` 欄位輸出位元組增減與門檻建議（例如 main chunk 成長 >10% 且 SettingsPage 未相應縮小時提示 review）。

### 啟動基準（Node 軟體層）

```powershell
npm run baseline:startup
```

產生 `release/startup-baseline.json`，量測 main process 關鍵模組的 `require()` 耗時（settings-store、mcp-schemas、directory-import、app-readiness）。預設不包含 `npm run build`；需要時加 `--include-build`。

**注意：** 此腳本不含 Electron GUI 冷啟動、Idle 長駐或記憶體量測；真機 cold-start／Idle／memory 基準屬 [`ROADMAP.md`](../ROADMAP.md) 驗證缺口（Windows 實機），仍標未驗。

## 設定與環境變數

| 變數 | 用途 |
| --- | --- |
| `VOXAVATAR_BRIDGE_PORT` | 覆寫 loopback MCP／HTTP port，預設 `47831` |
| `VOXAVATAR_TARGET_PROCESS_PATTERN` | 覆寫自動／設定頁的目標播放行程比對 |
| `VOXAVATAR_DEBUG=1` | 顯示 main process 診斷訊息；不得輸出音訊或敏感內容 |

## 依賴維護

Dependabot 每週檢查 npm 與 GitHub Actions。`scripts/dependabot-policy.cjs` 只允許 CI 直接覆蓋的開發工具與 workflow-only Actions minor／patch 自動合併；runtime、Electron／打包、React／Three.js／VRM、major 或範圍不明更新一律人工審查。

## 修改原則

- 行為變更先補回歸測試，再做最小實作。
- 交易、MCP session、Electron IPC 與原生 process 生命週期不得用未驗證的並行捷徑。
- 使用者可見變更同步更新 README、相關 docs 與 CHANGELOG。
- 原生或安裝行為不能只靠 mock；至少完成 Windows build/self-test，Release 再做安裝版 smoke。
