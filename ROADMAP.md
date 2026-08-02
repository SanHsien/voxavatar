# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-02
規劃基準：`v0.13.5`（`main` tip；正式 Release tag `v0.13.0`；上游評估見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)。

## 目前健康

覆核基準：`v0.13.5`／`main`；GitHub Latest Release：`v0.13.0`

沒有已知未解 P0／P1。`v0.13.0` 為 Latest。上游 open PR／issue 已評估（無須合併，見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。路線圖焦點為 **v0.14**。`main` tip `0.13.5` 含語音輸出隱私警告顯示修正（未另 tag）。

- Latest Release：`v0.13.0`；`main` tip 為 `0.13.x`。
- 上游：commit 水位 `cf27d12`；open PR #16／issue #13 為 macOS（不合併）；issue #11 首次取得角色文件已涵蓋。
- MCP 工具：5 個（含 opt-in `show_message`）；狀態事件正規化已備、狀態工具尚未掛上。
- Settings：自訂動作建立後可在卡片加入多段 VRMA；語音「輸出裝置」隱私警告改依 UI 選取即時顯示／隱藏。

仍開放：系統狀態動作槽 UI；MCP 狀態工具；action-pack 匯入管線；App／Settings jsdom 整合；精確 head 投影、DPI／30%／Idle 長跑實機；Installer 簽署與 Windows GUI smoke（無密鑰／桌面時標未驗）。

本輪驗證：`npm run check` 全綠；Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

## 原則

1. 隱私、安全、授權與發行正確性優先。
2. 角色反應要可理解、可降級，不靠推測聊天或情緒。
3. 純邏輯與契約盡量自動測試；Windows 桌面、WASAPI、DPI、系統匣與 installer 留實機證據。
4. 一般開發不要求 Visual Studio Build Tools；原生與 installer 以 GitHub Windows runner 為正式 gate。
5. 不以內建角色、動作或 agent 數量競賽；不擴張成聊天客戶端。

## 已完成摘要

| 系列 | 代表成果 |
| --- | --- |
| v0.1.x | stable Windows 基線、授權、CI 與 Release 信任根 |
| v0.2.x | 語音來源、IPC／preload、readiness、診斷、MCP session 與動作佇列 |
| v0.3.x | 素材匯入確認、migration fixtures、片段排序與品質報告 |
| v0.4.x | MCP 結構化 schema、整合文件與多 client 測試 |
| v0.5.x | 錯誤復原、設定模組拆分、bundle／SBOM／release-evidence 工具 |
| v0.6.x | Settings／IPC／asset validation 收斂與 renderer 錯誤測試 |
| v0.7.x | bundle／startup 基準、非首屏 lazy-load 與設定頁再拆 |
| v0.8.x | VRM／VRMA 合成相容矩陣、Exporter 備註與匯入 rollback |
| v0.9–v0.10 | 動作用途、狀態仲裁、氣泡 DOM、`show_message` opt-in、口型增益接線 |
| v0.11–v0.12 | action-pack 契約、overlay／catalog 抽離、狀態事件正規化、Idle 長跑停住修復 |
| v0.13.0 | 上游 #14／#15 評估不合併；批次 Release 累積功能 |

v0.9–v0.12 已完成項不再逐條留在路線圖；未完成工作見下方 v0.14。

## v0.14.x：狀態槽接線、測試深化與 Windows 驗收

### 角色與 MCP

完整契約見 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

- 系統狀態動作槽 UI（Settings 綁定狀態→動作）；MCP 狀態工具接上 `normalizeExternalStateEvent`。
- `action-pack.json` 實際匯入管線（仍不得繞過授權／路徑／GLB gate）。
- 精確 head 投影驅動口型增益與氣泡錨點（目前為角色尺寸估算）。

### 測試與品質

- 補 App／Settings jsdom 整合測試。
- 建立 Idle 長跑、切換模型與記憶體的可重複 Windows 基準（自動 `baseline:startup` 不含 GUI 長駐）。
- 取得授權清楚的真實 VRoid／UniVRM／Blender 樣本，補 exporter 人工結果；二進位不入庫。

### Windows 與發行驗收

- 為候選／正式 Release 留存版本化 Windows smoke：安裝、升級、移除、protocol、系統匣、MCP、DPI 與鍵盤。
- 完成 installer 簽署、publisher、SmartScreen 與升級路徑驗證。
- 為 native helper 建立可測試的 COM／WASAPI 錯誤型別或退出碼，並驗證播放、裝置切換與 recovery。
- 無桌面或密鑰時只標記未驗，不虛構完成。

### 完成條件

- 狀態槽 UI／MCP 狀態工具有自動測試；30% 角色尺寸與多 DPI 有實機證據。
- 至少一版正式資產有 SHA-256、Windows smoke 與簽章狀態紀錄。
- `npm run check`、CI、CodeQL 與 production audit 無未處理高風險項。

## v1.0.0 門檻

- 沒有已知 P0／P1，主動操作都有成功或失敗回饋。
- Windows 10／11 的安裝、升級、移除、首次設定、語音、素材、角色表現與 MCP 有實機證據。
- Installer 已簽署並驗證 publisher、SmartScreen 與更新路徑；未簽署不得進 1.0。
- settings、catalog 與 MCP schema 有版本政策和 migration 測試。
- 常見 exporter 有可公開驗證的相容結果，匯入失敗不造成資料遺失。
- 隱私、loopback-only、媒體授權、Windows-only 與上游 attribution 邊界保持可驗證。

## 明確不做

- 麥克風擷取、錄音、轉錄、音訊保存或上傳。
- 將 MCP／HTTP bridge 開到 LAN／Internet，或加入任意命令／檔案存取。
- 從聊天畫面、音訊或其他應用推測文字、情緒或工作狀態。
- 散布未確認授權的 VRM／VRMA，或恢復 Linux／macOS 發行。
- 在 VoxAvatar 內執行 LLM、保存聊天歷史或取代聊天客戶端。

## 接下來三件事

1. 接上系統狀態槽 UI 與 MCP 狀態工具（沿用既有正規化與仲裁）。
2. 補 App／Settings jsdom 整合與 action-pack 匯入管線（不繞過 gate）。
3. 有 Windows／密鑰時補 smoke、簽署與 30%／DPI 實機證據。
