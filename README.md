<p align="center">
  <img src="./public/assets/avatar.png" alt="VoxAvatar" width="144" />
</p>

<h1 align="center">VoxAvatar</h1>

<p align="center"><strong>讓 AI 助理在 Windows 桌面上擁有會說話、會動、可由 MCP 控制的 VRM 化身。</strong></p>

<p align="center">
  繁體中文 · <a href="./README.en.md">English</a> ·
  <a href="https://github.com/SanHsien/voxavatar/releases/latest">下載最新版</a> ·
  <a href="./ROADMAP.md">產品路線圖</a>
</p>

[![Release](https://img.shields.io/github/v/release/SanHsien/voxavatar?sort=semver)](https://github.com/SanHsien/voxavatar/releases/latest)
[![CI](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml/badge.svg)](https://github.com/SanHsien/voxavatar/actions/workflows/codeql.yml)
[![Platform: Windows 10/11](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D4.svg?logo=windows11&logoColor=white)](#系統需求)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**VoxAvatar** 是 Windows-only、local-first 的 VRM 桌面角色。它監聽你指定應用程式的**播放輸出音量**，讓角色跟著 AI 助理的聲音做口型與 Speaking 動作；Codex 或其他相容 Agent 也能透過本機 MCP 控制角色動作、視窗、狀態與訊息氣泡。

它**不是聊天機器人，也不執行語言模型**。VoxAvatar 專注做 AI 助理的本機視覺呈現層。

## 下載與第一次使用

目前原始碼的 package version 為 `1.0.6`；實際可下載版本、簽署狀態與 checksum 以 [Latest Release](https://github.com/SanHsien/voxavatar/releases/latest) 為準。

1. 從 Latest Release 下載 `VoxAvatar-*-windows-x64-setup.exe`。
2. 若該 Release／installer 標示 **NotSigned**，Windows SmartScreen 可能顯示未知發行者；請用同一 Release 的 `SHA256SUMS.txt` 核對檔案。
3. 安裝並啟動；首次會直接顯示內建角色。
4. 到「語音」選擇會播放助理聲音的應用程式。
5. 需要 Agent 控制時，再依下方方式連接 MCP。

安裝包內建 4 個來源與再散布條件已查核的 VRM 角色，以及 13 個 CC0 VRMA 動作；你也可以匯入自己有權使用的 `.vrm`／`.vrma`。完整素材來源見 [ASSET_LICENSES.md](ASSET_LICENSES.md)。

## 你可以做什麼

| 功能 | 說明 |
| --- | --- |
| 語音口型 | 依指定應用程式的播放音量驅動嘴型與 Speaking 狀態；不是語音辨識或音素同步 |
| 桌面角色 | 透明置頂、拖曳、縮放、旋轉、點穿、系統匣控制 |
| 動作 | 內建 Idle／Speaking／自訂動作，可匯入 VRMA、預覽與整理 |
| 角色素材 | 內建 4 個 VRM；可匯入自己有權使用的 VRM／VRMA |
| Agent 控制 | 本機 MCP 可列出／播放動作、控制視窗、查詢狀態、切換角色狀態與顯示短句氣泡 |
| 本機優先 | 不錄音、不轉錄、不上傳音訊；角色、設定與音量判定留在本機 |

## 連接 Codex / MCP

保持 VoxAvatar 開啟，執行一次：

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

重新啟動 Codex 或建立新任務後，可以要求它：

- 列出目前可播放動作。
- 播放指定動作。
- 顯示、隱藏或切換 VoxAvatar 視窗。
- 查詢模型、語音 listener 與視窗狀態。
- 切換角色狀態。
- 在 Settings 啟用後，顯示短句氣泡。

MCP 工具為 `list_animations`、`play_animation`、`control_window`、`get_status`、`show_message` 與 `set_character_state`。完整 schema、HTTP 事件 API 與 `voxavatar://` protocol 見 [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)。

## 隱私與安全邊界

- **不擷取麥克風**，不錄音、不轉錄、不保存或傳送音訊。
- 預設只量測指定應用程式的播放輸出；若手動改成「系統輸出」，會量測目前輸出裝置的混音，設定頁會明確提示此隱私邊界。
- MCP／HTTP 只綁定 `127.0.0.1`，不應轉發到區域網路或 Internet。
- MCP 只能控制 VoxAvatar 的角色、視窗與狀態，不能執行任意命令，也不能讀取任意檔案。
- 同一 Windows 帳號下的其他本機程序仍可能連到未驗證身分的 loopback MCP；完整威脅模型見 [SECURITY.md](SECURITY.md)。
- 本機匯入第三方素材不代表 VoxAvatar 可以重新散布該素材；請遵守各素材原始授權。

## 系統需求

| 用途 | 需求 |
| --- | --- |
| 使用正式版 | Windows 10 build 20348+ 或 Windows 11 x64；支援硬體加速的桌面環境 |
| 一般原始碼開發 | Windows、Node.js 24、npm |
| 修改原生語音 listener／本機打包 | Visual Studio Build Tools，含「使用 C++ 的桌面開發」工作負載 |

一般 UI、設定、MCP、文件與 TypeScript 開發不需要 Visual Studio Build Tools；正式 Windows native build 與安裝包由 GitHub Actions 驗證。

## 角色操作

- 滾輪：縮放角色。
- 左鍵拖曳：移動視窗。
- 中鍵拖曳：旋轉視角。
- 右鍵角色：開啟快捷選單。
- 系統匣左鍵：顯示／隱藏；右鍵：開啟功能選單。

## 從原始碼執行

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run dev
```

提交前至少執行：

```powershell
npm run check
```

`npm run check` 會執行 lint、Markdown 檢查、Node／renderer tests、資產契約、dependency audit 與 production build。修改 C++ listener 或 Windows installer 時，再依 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) 與 [docs/RELEASING.md](docs/RELEASING.md) 執行原生與發行驗證。

## 文件

- [docs/INTEGRATIONS.md](docs/INTEGRATIONS.md)：MCP、HTTP event API、URL protocol
- [docs/CHARACTER_BEHAVIOR.md](docs/CHARACTER_BEHAVIOR.md)：角色狀態、動作與口型行為
- [docs/VRM_VRMA_COMPATIBILITY.md](docs/VRM_VRMA_COMPATIBILITY.md)：素材相容性
- [ASSET_LICENSES.md](ASSET_LICENSES.md)：內建素材來源與授權
- [SECURITY.md](SECURITY.md)：完整安全與隱私模型
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)：開發、測試與架構
- [docs/RELEASING.md](docs/RELEASING.md)：Windows 發行與驗證
- [ROADMAP.md](ROADMAP.md)：未來工作與目前健康狀態
- [CHANGELOG.md](CHANGELOG.md)：版本歷史

## 專案來源

VoxAvatar 衍生自 [`xikhar/persona`](https://github.com/xikhar/persona)，並保留上游著作權、MIT License 與 attribution。現行專案由 `SanHsien/voxavatar` 獨立維護為 **Windows-only** 產品，另行發展 WASAPI 應用程式輸出監聽、MCP 控制、角色狀態、漫畫氣泡、VRM／VRMA 管理與 Windows 發行流程。

完整 provenance、上游取捨與技術決策見 [docs/DECISIONS.md](docs/DECISIONS.md) §1。

## 授權

程式碼採 [MIT License](LICENSE)。第三方 VRM、VRMA、圖片與其他資產各自受原始授權約束，不會因被 VoxAvatar 匯入或打包而自動變成 MIT。
