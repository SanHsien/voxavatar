# AGENTS.md

本檔是 **SanHsien/voxavatar** 的 AI coding agent 主要維護規則。[`CLAUDE.md`](CLAUDE.md) 與 [`SKILL.md`](SKILL.md) 只作薄入口；若有衝突，以本檔為準。

## 專案定位

**VoxAvatar** 是 Windows-only、local-first 的 VRM 桌面角色陪伴：量測指定應用程式的播放輸出音量來驅動口型與 Speaking 狀態，並提供 loopback-only MCP／HTTP 控制介面。

專案衍生自 [`xikhar/persona`](https://github.com/xikhar/persona)，必須保留上游 MIT License、copyright 與 attribution。現行產品由 `SanHsien/voxavatar` 獨立維護 Windows 方向。

## 硬性邊界

- 不擷取麥克風、不錄音、不轉錄、不保存或傳送音訊。
- MCP／HTTP 維持 loopback-only；不得加入任意命令執行或任意檔案讀取。
- 不把連接埠預設暴露到 LAN／Internet。
- 不提交未確認再散布權的 VRM／VRMA；內建素材必須通過來源、授權與資產 gate。
- 不移除 `xikhar/persona` 的上游 attribution。
- 不恢復 PipeWire、Hyprland、macOS native、`dist:linux` 或 `dist:mac`；VoxAvatar 現行產品是 Windows-only。
- 使用者匯入的第三方素材屬本機資料，不代表專案取得再散布權。

## 架構地圖

- `electron/`：Electron main、preload、設定、系統匣、MCP／HTTP、Node tests
- `src/`：React + Three.js / VRM renderer、角色與動作邏輯、Vitest
- `native/windows/`：WASAPI process-loopback C++ helper
- `public/assets/`：UI 圖示、已審查 VRM／VRMA、manifest／library
- `scripts/`：build、資產、文件、版本、checksum 與 release gates
- `docs/`：整合、角色行為、開發、決策、發行與 release evidence

## 開發原則

- 一般變更走 branch → PR → CI → merge；不要直接改 `main`。
- 修 bug 優先補對應測試，不因為能重構就做大型無關重構。
- UI／MCP／角色狀態若共享行為，避免在 main／renderer 重複實作兩套規則。
- 修改安全、音訊監聽、資產、MCP schema 或 installer 時，先讀對應專門文件。
- 不為了「更完整」主動增加新的 governance workflow；現有 CI、CodeQL、Dependabot 與 Release gate 已足夠。
- 版本號只在有明確 release／產品版本需求時調整；純文件、維護規則或內部整理不需要機械式 bump。

## 文件分工

- `README.md` / `README.en.md`：產品入口、下載、常用功能與必要安全摘要
- `ROADMAP.md` / `ROADMAP.en.md`：未來工作與目前健康狀態
- `CHANGELOG.md`：正式版本的使用者可見變更
- `SECURITY.md` / `SECURITY.en.md`：完整隱私與安全模型
- `ASSET_LICENSES.md`：內建素材來源、限制與再散布條件
- `docs/INTEGRATIONS.md`：MCP、HTTP event API、URL protocol
- `docs/CHARACTER_BEHAVIOR.md`：角色狀態、動作、口型與氣泡行為
- `docs/DEVELOPMENT.md`：架構、環境與驗證矩陣
- `docs/RELEASING.md`：Windows 發行、簽署、checksum 與實機驗證
- `docs/DECISIONS.md`：耐久性的架構／產品取捨與上游 provenance

只更新**真正受本次變更影響**的文件；不要要求每次 commit 都重寫 README、ROADMAP、SECURITY、CHANGELOG 全套。

## 驗證

一般 JavaScript／TypeScript、UI、MCP 或文件相關變更至少執行：

```powershell
npm run check
```

`npm run check` 包含 lint、Markdown check、Node／renderer tests、資產 contract、dependency audit 與 production build。

變更範圍需要時再加：

```powershell
npm run native:build
npm run native:test
npm run assets:release
npm run dist:windows
```

- 修改 C++ helper 或完整 WASAPI 路徑：跑 `native:build` / `native:test`。
- 修改內建素材：跑 `assets:release`，並檢查 `ASSET_LICENSES.md` 與 manifest。
- 修改 installer／發行流程：跑 `dist:windows`，並依 `docs/RELEASING.md` 檢查 Release evidence。
- 沒有 Windows 桌面或簽署密鑰時，不得宣稱已完成 GUI smoke、DPI、SmartScreen 或 Authenticode 實機驗證；自動測試與實機驗證要分開陳述。

## 識別字串

| 項目 | 值 |
| --- | --- |
| npm／protocol／MCP CLI | `voxavatar` |
| 顯示名 | VoxAvatar |
| appId | `com.sanhsien.voxavatar` |
| 環境變數 | `VOXAVATAR_*` |
| 資產 scheme | `voxavatar-asset:` |
| 原生 helper | `voxavatar-audio-listener.exe` |

## 完成條件

提交前確認：

1. 變更範圍符合 Windows-only、local-first 與上游 attribution 邊界。
2. 對應自動測試／build 已通過；未能做的 Windows 實機驗證明確標示。
3. 只有受影響的文件被更新。
4. PR 說明清楚列出使用者可見影響、驗證結果與未驗證範圍。