# 開發 VoxAvatar

## 技術基線

- Windows 10 build 20348+／Windows 11 x64
- Node.js 24+ 與 npm
- Electron、Vite、React、TypeScript、Three.js、`@pixiv/three-vrm`

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

安全界線：main process 處理檔案、process discovery 與網路 listener；renderer 保持 sandbox、context isolation、無 Node integration。使用者媒體只透過登記 ID 的 `voxavatar-asset:` protocol 進入 renderer。avatar／settings preload 目前仍共用 allowlisted API；拆分權限與統一驗 sender 已列入 [`ROADMAP.md`](../ROADMAP.md)。

## 目錄

| 路徑 | 用途 |
| --- | --- |
| `electron/` | main、preload、設定、MCP／HTTP、語音來源與 Node tests |
| `src/` | React／Three.js renderer、動作邏輯與 Vitest |
| `native/windows/` | WASAPI process-loopback C++ helper |
| `scripts/` | 原生 build、自測、資產／文件／版本／checksum 驗證 |
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
| `npm run native:test` | helper self-test |
| `npm run check` | 非原生的完整日常 gate |
| `npm run dist:windows` | 原生 build／test + NSIS 安裝包 |

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
