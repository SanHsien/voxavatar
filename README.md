<p align="center">
  <img src="./public/assets/avatar.png" alt="VoxAvatar" width="144" />
</p>

<h1 align="center">VoxAvatar</h1>

<p align="center">Windows 本機 VRM 桌面角色陪伴：跟隨助理語音做口型與動作，並提供 MCP 視覺控制。</p>

<p align="center">
  <a href="./README.en.md">English</a> ·
  <a href="https://github.com/SanHsien/voxavatar/releases/latest">下載最新版</a> ·
  <a href="./docs/INTEGRATIONS.md">整合說明</a>
</p>

> VoxAvatar 衍生自 [`xikhar/persona`](https://github.com/xikhar/persona)，由 [`SanHsien/voxavatar`](https://github.com/SanHsien/voxavatar) 獨立維護；本 fork 僅支援 Windows。署名見 [`NOTICE.md`](NOTICE.md)。

## 能做什麼

- 從指定 Windows 應用程式的**播放輸出**計算音量，驅動 VRM 口型與 Speaking 動作。
- 透明置頂角色視窗支援點穿、拖曳、縮放、旋轉與系統匣控制。
- 在設定頁匯入 `.vrm`／`.vrma`，支援目錄批次匯入、VRMA 品質報告與自訂動作。
- 提供 loopback-only MCP、HTTP 事件 API 與 `voxavatar://` protocol。
- 所有角色、動作與設定都留在本機；VoxAvatar 不執行語言模型。

VoxAvatar **不擷取麥克風、不錄音、不轉錄、不保存或傳送音訊**。

## 系統需求

| 項目 | 需求 |
| --- | --- |
| 作業系統 | Windows 10 build 20348 以上或 Windows 11 x64 |
| 顯示 | 支援硬體加速的桌面環境 |
| 原始碼開發 | Node.js 24+、npm、Visual Studio Build Tools C++ 桌面工作負載 |

## 快速開始

1. 從 [GitHub Releases](https://github.com/SanHsien/voxavatar/releases/latest) 下載 Windows 安裝程式。
2. 啟動 VoxAvatar；首次沒有模型時會自動開啟設定頁。
3. 在「模型」匯入你有權使用的 `.vrm`。安裝包預設不內建第三方角色。
4. 在 Idle／Speaking 或自訂動作加入 `.vrma`；沒有 VRMA 時仍可做口型。
5. 在「語音」選擇會播放助理聲音的應用程式。

模型與動作可從 [VRoid Hub](https://hub.vroid.com/)、[BOOTH](https://booth.pm/) 或 [VRoid Studio](https://vroid.com/studio) 合法取得。每個素材的下載、Avatar、商用與再散布條款各自不同；詳見 [`ASSET_LICENSES.md`](ASSET_LICENSES.md) 與 [`docs/IDLE_MOTIONS.md`](docs/IDLE_MOTIONS.md)。

## 角色操作

- 滾輪：縮放角色。
- 左鍵拖曳角色：移動視窗。
- 中鍵拖曳：旋轉視角。
- 右鍵：開啟快捷選單。
- 系統匣左鍵：顯示／隱藏角色；右鍵：開啟功能選單。

## 連接 Codex

保持 VoxAvatar 開啟，執行一次：

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

重新啟動 Codex 或建立新任務後，可以直接說：

- 「請用 VoxAvatar 列出可播放動作。」
- 「請讓 VoxAvatar 播放 `wave-hello`。」
- 「請顯示／隱藏 VoxAvatar。」
- 「請查詢 VoxAvatar 狀態。」

MCP 工具為 `list_animations`、`play_animation`、`control_window`、`get_status`。完整輸入與其他整合方式見 [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)。

## 從原始碼執行

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
npm ci
npm run native:build
npm run dev
```

常用驗證與打包：

```powershell
npm run check
npm run native:test
npm run dist:windows
```

`npm run check` 會執行 lint、Markdown 連結／內容檢查、Node 與 renderer 測試、資產契約、安全稽核及正式 build。Windows 安裝檔輸出至 `release/`。

## 文件

- [`CONTRIBUTING.md`](CONTRIBUTING.md)：貢獻流程與邊界
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)：架構、目錄與開發流程
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)：MCP、HTTP、URL protocol
- [`docs/RELEASING.md`](docs/RELEASING.md)：版本與發行流程
- [`SECURITY.md`](SECURITY.md)：安全模型與漏洞回報
- [`ASSET_LICENSES.md`](ASSET_LICENSES.md)：媒體授權閘門
- [`docs/DECISIONS.md`](docs/DECISIONS.md)：fork 決策紀錄

程式碼採 [MIT License](LICENSE)。第三方媒體不因匯入或打包而自動改採 MIT。
