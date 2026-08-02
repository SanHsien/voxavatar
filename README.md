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
| 語音口型 | 指定應用／自訂 matcher／外部事件／系統輸出（opt-in）loopback；可搜尋來源目錄；sticky discovery 與 helper 狀態（missing／target_missing／no_output／listening） |
| 桌面角色 | 透明置頂與點穿、拖曳、縮放（下限 30%）、旋轉、系統匣左右鍵、重設視角、聆聽／說話預覽、關於 |
| 本機素材 | 匯入 `.vrm`／`.vrma`；目錄評估匯入與品質報告（report／strict／off）；VRM 0.x／1.0；一鍵清除；載入失敗可回復 |
| 動作系統 | Idle／Speaking 槽、隨機多片段（避免立即重複）、可調 Idle 休息間隔、用途 `loop`／`one-shot`／`pose`、自訂動作與 MCP catalog |
| 角色表現 | 狀態仲裁、漫畫式氣泡、`show_message`（Settings opt-in）、口型增益（依縮放推估） |
| 首次設定 | 進度清單（模型／可選動作／語音／MCP）；可複製診斷摘要（遮罩路徑與素材檔名）；與 `get_status` 共用 readiness |
| Agent 整合 | loopback-only MCP（5 工具含 opt-in `show_message`）、HTTP 事件 API、`voxavatar://` |
| 發行品質 | Windows CI、CodeQL、資產授權 gate、NSIS、SHA-256；`main` tip 已 tagged 才打包 |

## 相對上游

相對 [`xikhar/persona`](https://github.com/xikhar/persona)：本專案為 **Windows-only**（不恢復 PipeWire／Hyprland／macOS 發行）、產品識別改為 **VoxAvatar／`voxavatar`**、安裝包**預設不內建**第三方 VRM／VRMA，並保留上游 MIT 與 attribution。其餘已落地能力見上方功能一覽與 [`docs/DECISIONS.md`](docs/DECISIONS.md)。

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

口型由音量即時驅動 VRM expression；VRMA 只負責可選的身體動作，因此沒有 Speaking VRMA 仍可張嘴。這是音量反應，不是語音辨識或音素同步。

## 隱私與安全邊界

- **不擷取麥克風**，不錄音、不轉錄、不保存或傳送音訊。
- 預設只聽指定應用程式的播放輸出；若改為「系統輸出」模式，會監聽目前輸出裝置混音（含音樂／影片／遊戲等），設定頁會顯示隱私邊界警告，且仍為本機計算、不上傳。
- MCP／HTTP bridge 只綁定 `127.0.0.1`，限制 Host、origin、body 大小與輸入 schema；MCP session 有 idle TTL 與容量上限。
- MCP 只控制角色動作、視窗與狀態，不執行任意命令，也不讀取任意檔案。
- 自訂 process matcher 為有界安全子集，拒絕明顯易 ReDoS 的 pattern。
- 使用者媒體複製到每使用者應用資料；renderer 只能以登記後的資產 ID 經 `voxavatar-asset:` 讀取。
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
3. 在「模型」匯入你有權使用的 `.vrm`。安裝包預設不內建第三方角色。
4. 在 Idle／Speaking 或自訂動作加入 `.vrma`；沒有 VRMA 時仍可做口型。
5. 在「語音」選擇會播放助理聲音的應用程式。

模型與動作可從 [VRoid Hub](https://hub.vroid.com/)、[BOOTH](https://booth.pm/) 或 [VRoid Studio](https://vroid.com/studio) 合法取得。每個素材的下載、Avatar、商用與再散布條款各自不同，詳見 [`ASSET_LICENSES.md`](ASSET_LICENSES.md) 與 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

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
- （需 Settings 啟用）在角色旁顯示短句氣泡。

MCP 工具為 `list_animations`、`play_animation`、`control_window`、`get_status`、`show_message`（預設關閉）。設定頁新增或移除動作後，現有 session 會更新工具描述。完整 schema、健康檢查、HTTP 事件與 URL protocol 見 [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)。

## 角色操作

- 滾輪：縮放角色。
- 左鍵拖曳角色：移動視窗。
- 中鍵拖曳：旋轉視角。
- 右鍵角色：開啟快捷選單（含重設視角、設定、語系、關於）。
- 系統匣左鍵：顯示／隱藏角色；右鍵：開啟功能選單（含重設視角、預覽聆聽／說話、設定、關於）。

## 專案狀態與路線圖

目前發行版為 **`v0.13.0`**；`main` tip 為 **`0.13.1`**（文件與路線圖收斂）。上游 `xikhar/persona` 已評估至 `cf27d12`（#14／#15 不合併）。

版本順序與接下來工作見 [`ROADMAP.md`](ROADMAP.md)；最新健康狀態與驗證缺口見 [`REVIEW.md`](REVIEW.md)。

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
electron/        Electron main、preload-avatar／preload-settings、設定、MCP／HTTP 與 Node tests
src/             React／Three.js renderer、動作邏輯與 Vitest
native/windows/  WASAPI process-loopback C++ helper
scripts/         build、資產、文件、Dependabot、版本與 checksum gates
public/assets/   UI 圖示與發行 manifest，預設不含 VRM／VRMA
docs/            開發、整合、角色表現、決策與發行文件
.github/         CI、CodeQL、Dependabot、Release 與貢獻模板
```

## 文件

| 文件 | 內容 |
| --- | --- |
| [`ROADMAP.md`](ROADMAP.md)／[`REVIEW.md`](REVIEW.md)／[`CHANGELOG.md`](CHANGELOG.md) | 未來、目前健康與已完成歷史 |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)／[`CONTRIBUTING.md`](CONTRIBUTING.md) | 架構、工具鏈、驗證與貢獻流程 |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md) | MCP、HTTP 事件 API 與 URL protocol |
| [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)／[`docs/ACTION_PACK.md`](docs/ACTION_PACK.md)／[`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md) | 動作匯入、角色表現、action-pack 契約與素材相容性 |
| [`docs/RELEASING.md`](docs/RELEASING.md)／[`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) | 發布流程與 Windows 實機證據 |
| [`SECURITY.md`](SECURITY.md)／[`ASSET_LICENSES.md`](ASSET_LICENSES.md)／[`docs/DECISIONS.md`](docs/DECISIONS.md) | 安全、媒體授權與現行取捨 |

## 支援與貢獻

- 一般錯誤或功能建議：使用 [issue templates](https://github.com/SanHsien/voxavatar/issues/new/choose)。
- 安全漏洞：依 [`SECURITY.md`](SECURITY.md) 使用 Private Vulnerability Reporting。
- 送出程式碼前：閱讀 [`CONTRIBUTING.md`](CONTRIBUTING.md)，並至少執行 `npm run check`。

## 來源與授權

程式碼採 [MIT License](LICENSE)，並保留上游 `xikhar/persona` 的著作權與署名。第三方 VRM、VRMA、圖片與環境資產不會因匯入或打包而自動採 MIT；完整範圍見 [`NOTICE.md`](NOTICE.md) 與 [`ASSET_LICENSES.md`](ASSET_LICENSES.md)。
