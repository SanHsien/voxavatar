<p align="center">
  <img src="./public/assets/avatar.png" alt="VoxAvatar" width="144" />
</p>

<h1 align="center">VoxAvatar</h1>

<p align="center"><strong>讓 AI 助理在 Windows 桌面上有一個會說話、會動、可由 MCP 控制的 VRM 化身。</strong></p>

<p align="center">
  繁體中文 · <a href="./README.en.md">English</a> ·
  <a href="https://github.com/SanHsien/voxavatar/releases/latest">下載最新版</a> ·
  <a href="./ROADMAP.md">產品路線圖</a>
</p>

[![Release](https://img.shields.io/github/v/release/SanHsien/voxavatar?sort=semver)](https://github.com/SanHsien/voxavatar/releases/latest)
[![CI](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml)
[![Windows Release](https://github.com/SanHsien/voxavatar/actions/workflows/release.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/release.yml)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-339933.svg?logo=nodedotjs&logoColor=white)](package.json)
[![Platform: Windows 10/11](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4.svg?logo=windows11&logoColor=white)](#系統需求)
[![Local-first](https://img.shields.io/badge/Architecture-Local--first-2E7D32.svg)](#隱私與安全邊界)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> VoxAvatar 衍生自 [`xikhar/persona`](https://github.com/xikhar/persona)，由 [`SanHsien/voxavatar`](https://github.com/SanHsien/voxavatar) 獨立維護。本 fork 僅支援 Windows；來源與署名見 [`NOTICE.md`](NOTICE.md)。

## 這是什麼

VoxAvatar 是 Windows-only、local-first 的 VRM 桌面角色陪伴。它監聽你指定應用程式的**播放輸出音量**，讓角色跟著助理聲音做口型與 Speaking 動作；Codex 或其他相容代理也能透過本機 MCP 讓角色播放動作、顯示、隱藏或回報狀態。

它不是另一個聊天機器人，也不執行語言模型。VoxAvatar 專心做好 AI 助理的本機視覺呈現層：角色、動作、設定和音量判定都留在你的電腦上。

## 功能一覽

| 類別 | 能做什麼 |
| --- | --- |
| 語音口型 | 以 WASAPI application loopback 讀取指定 Windows 應用程式的播放音量，驅動嘴型與 Speaking 狀態 |
| 桌面角色 | 透明置頂、透明區點穿、拖曳、縮放、旋轉、顯示／隱藏與系統匣控制 |
| 本機素材 | 匯入 `.vrm`／`.vrma`、目錄批次匯入、VRMA 品質報告、一鍵清除與自訂動作 |
| 動作系統 | Idle／Speaking 系統槽、多片段隨機播放、常用動作預設與 MCP 即時 catalog |
| Agent 整合 | loopback-only MCP、HTTP 事件 API 與 `voxavatar://` URL protocol |
| 發行品質 | Windows CI、CodeQL、資產授權 gate、NSIS 安裝包與 SHA-256 checksum |

## 運作方式

```text
指定應用程式的播放輸出
        │ WASAPI process loopback，只計算音量
        ▼
voxavatar-audio-listener.exe
        │ NDJSON
        ▼
Electron main ── 設定／系統匣／MCP／HTTP／URL protocol
        │ sandboxed、context-isolated preload bridge
        ▼
React + Three.js ── VRM／VRMA／口型／桌面互動
```

## 隱私與安全邊界

- **不擷取麥克風**，不錄音、不轉錄、不保存或傳送音訊。
- MCP／HTTP bridge 只綁定 `127.0.0.1`，限制 Host、origin、body 大小與輸入 schema。
- MCP 只控制角色動作、視窗與狀態，不執行任意命令，也不讀取任意檔案。
- 使用者媒體複製到每使用者應用資料；renderer 只能以登記後的資產 ID 讀取。
- 安裝包預設不附第三方角色或動作。可本機匯入，不等於本專案可以再散布原檔。

同一 Windows 帳號下的其他行程仍可連到未驗證身分的本機 MCP，請勿把連接埠轉發到區域網路或 Internet。完整模型見 [`SECURITY.md`](SECURITY.md)。

## 系統需求

| 用途 | 需求 |
| --- | --- |
| 使用正式版 | Windows 10 build 20348+ 或 Windows 11 x64、支援硬體加速的桌面環境 |
| 角色素材 | 一個你有權使用的 `.vrm`；`.vrma` 動作可選 |
| 一般原始碼開發 | Windows、Node.js 24+、npm |
| 修改原生 listener／本機打包 | Visual Studio Build Tools，含「使用 C++ 的桌面開發」工作負載 |

一般 UI、設定、MCP、文件與 JavaScript／TypeScript 開發不需要安裝 Visual Studio Build Tools；GitHub Actions 會執行正式的 Windows 原生編譯與打包。

## 快速開始

1. 從 [GitHub Releases](https://github.com/SanHsien/voxavatar/releases/latest) 下載 Windows 安裝程式。
2. 啟動 VoxAvatar；首次沒有模型時會自動開啟設定頁。
3. 在「模型」匯入你有權使用的 `.vrm`。
4. 在 Idle／Speaking 或自訂動作加入 `.vrma`；沒有 VRMA 時仍可做口型。
5. 在「語音」選擇會播放助理聲音的應用程式。

模型與動作可從 [VRoid Hub](https://hub.vroid.com/)、[BOOTH](https://booth.pm/) 或 [VRoid Studio](https://vroid.com/studio) 合法取得。每個素材的下載、Avatar、商用與再散布條款各自不同，詳見 [`ASSET_LICENSES.md`](ASSET_LICENSES.md) 與 [`docs/IDLE_MOTIONS.md`](docs/IDLE_MOTIONS.md)。

## 連接 Codex 與 MCP

保持 VoxAvatar 開啟，執行一次：

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

重新啟動 Codex 或建立新任務後，可以直接要求：

- 列出目前可播放動作。
- 播放指定動作，例如 `wave-hello`。
- 顯示、隱藏或切換 VoxAvatar 視窗。
- 查詢模型、語音 listener 與視窗狀態。

MCP 工具為 `list_animations`、`play_animation`、`control_window`、`get_status`。設定頁新增或移除動作後，現有 session 會更新工具描述。完整 schema、健康檢查、HTTP 事件與 URL protocol 見 [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)。

## 角色操作

- 滾輪：縮放角色。
- 左鍵拖曳角色：移動視窗。
- 中鍵拖曳：旋轉視角。
- 右鍵角色：開啟快捷選單（含重設視角、設定、語系、關於）。
- 系統匣左鍵：顯示／隱藏角色；右鍵：開啟功能選單（含重設視角、預覽聆聽／說話、設定、關於）。

## 專案狀態與路線圖

目前 Latest 為 `v0.2.x`：在 `0.1` 穩定基線上補強系統輸出語音、品質把關、Idle 間隔、discovery／matcher／MCP session／IPC sender，以及系統匣重設視角。下一階段完成首次設定 readiness、診斷摘要與版本化 Windows 實機證據，再進入素材相容與 MCP 契約深化。

版本里程碑、完成條件、風險與明確不做的範圍見 [`ROADMAP.md`](ROADMAP.md)；最新健康狀態與仍需實機驗證的項目見 [`REVIEW.md`](REVIEW.md)。

## 從原始碼執行

一般 Electron／React／MCP 開發：

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run dev
npm run check
```

未編譯原生 helper 時，桌面 UI 與大部分功能仍可開發，但 application-loopback 語音 listener 不可用。只有修改 C++ helper、驗證完整語音路徑或在本機建立安裝包時才需要：

```powershell
npm run native:build
npm run native:test
npm run dist:windows
```

`npm run check` 會執行 lint、Markdown 檢查、Node 與 renderer 測試、資產契約、production audit 及正式 build。完整環境與指令矩陣見 [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)。

## 專案結構

```text
electron/        Electron main、preload、設定、MCP／HTTP 與 Node tests
src/             React／Three.js renderer、動作邏輯與 Vitest
native/windows/  WASAPI process-loopback C++ helper
scripts/         build、資產、文件、Dependabot、版本與 checksum gates
public/assets/   UI 圖示與發行 manifest，預設不含 VRM／VRMA
docs/            開發、整合、路線圖決策與發行文件
.github/         CI、CodeQL、Dependabot、Release 與貢獻模板
```

## 文件

| 文件 | 內容 |
| --- | --- |
| [`ROADMAP.md`](ROADMAP.md) | 產品定位、版本里程碑、完成條件、風險與非目標 |
| [`REVIEW.md`](REVIEW.md) | 最新一次專案 review 與未解驗證缺口 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | 架構、目錄、工具鏈與驗證矩陣 |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) | MCP、HTTP 事件 API 與 URL protocol |
| [`docs/RELEASING.md`](docs/RELEASING.md) | 版本、GitHub Actions、資產與發布後驗證 |
| [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) | 安裝、桌面、語音、MCP 與簽章實機驗收 |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | fork、隱私、授權與維護決策 |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | 貢獻流程與不可跨越的邊界 |
| [`SECURITY.md`](SECURITY.md) | 支援版本、安全模型與漏洞回報 |
| [`ASSET_LICENSES.md`](ASSET_LICENSES.md) | 媒體來源與再散布 gate |
| [`CHANGELOG.md`](CHANGELOG.md) | 逐版變更紀錄 |

## 支援與貢獻

- 一般錯誤或功能建議：使用 [issue templates](https://github.com/SanHsien/voxavatar/issues/new/choose)。
- 安全漏洞：依 [`SECURITY.md`](SECURITY.md) 使用 Private Vulnerability Reporting。
- 送出程式碼前：閱讀 [`CONTRIBUTING.md`](CONTRIBUTING.md)，並至少執行 `npm run check`。

## 來源與授權

程式碼採 [MIT License](LICENSE)，並保留上游 `xikhar/persona` 的著作權與署名。第三方 VRM、VRMA、圖片與環境資產不會因匯入或打包而自動採 MIT；完整範圍見 [`NOTICE.md`](NOTICE.md) 與 [`ASSET_LICENSES.md`](ASSET_LICENSES.md)。
