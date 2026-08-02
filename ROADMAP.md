# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-02
規劃基準：`v0.15.1`（`main` tip；正式 Release tag `v0.13.0`；上游評估見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)。

> **文件入口**：原獨立 `REVIEW.md` 已於 0.13.3 併入本檔「目前健康」；不另建平行覆核檔。`CHANGELOG` 管已完成，本檔管健康狀態與未關閉缺口。

## 目前健康

覆核基準：`v0.15.1`／`main`；GitHub Latest Release：`v0.13.0`

沒有已知未解 P0／P1。`v0.13.0` 為 Latest。上游 open PR／issue 已評估（無須合併，見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。**本輪不規劃新功能**；只收斂既有開放缺口。`main` tip `0.15.1`：jsdom 互動測、匯入 partial failure 回饋、catalog schema 政策與測試（未另 tag）。

- Latest Release：`v0.13.0`；`main` tip 為 `0.15.1`。
- 上游：commit 水位 `cf27d12`；open PR #16／issue #13 為 macOS（不合併）；issue #11 首次取得角色文件已涵蓋。
- MCP 工具：6 個（含 opt-in `show_message` 與 `set_character_state`）；`tools_schema_version`＝3。
- Settings：系統狀態動作槽、action-pack、品質門檻；狀態槽／門檻／語音／氣泡有 jsdom 互動測。
- 頭部錨點：Scene／Avatar 以 VRM humanoid 骨點投影；缺資料退回尺寸估算。

本輪驗證：`npm run check` 全綠；Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

### 驗證缺口（標未驗，不虛構完成）

| 項目 | 狀態 | 原因 |
| --- | --- | --- |
| Windows GUI smoke（安裝／升級／移除／系統匣／MCP／DPI／鍵盤） | **未驗** | 無 Windows 桌面 |
| 30% 角色尺寸與多 DPI 實機 | **未驗** | 無 Windows 桌面 |
| Idle 長跑／切換模型記憶體基準（GUI 長駐） | **未驗** | 無 Windows 桌面；`baseline:startup` 不含 GUI |
| Installer 簽署／publisher／SmartScreen／升級路徑 | **未驗** | 無簽署密鑰 |
| Native helper COM／WASAPI 分型 exit code（C++） | **未驗** | 需 Windows runner／toolchain；JS 分類層已有 |
| 真實 VRoid／UniVRM／Blender 樣本人工結果 | **未驗** | 尚無授權清楚之二進位樣本入庫外證據 |

產品維持 **Windows-only**，不恢復 Linux／macOS 發行。

## 原則

1. 隱私、安全、授權與發行正確性優先。
2. 角色反應要可理解、可降級，不靠推測聊天或情緒。
3. 純邏輯與契約盡量自動測試；Windows 桌面、WASAPI、DPI、系統匣與 installer 留實機證據。
4. 一般開發不要求 Visual Studio Build Tools；原生與 installer 以 GitHub Windows runner 為正式 gate。
5. 不以內建角色、動作或 agent 數量競賽；不擴張成聊天客戶端。
6. **先關閉既有缺口，不另開新功能**；無法驗證者只標未驗。

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
| v0.13.0 | 上游 #14／#15 評估不合併；批次 Release 累積功能；`REVIEW`→「目前健康」 |
| v0.14.0 | 系統狀態槽 UI、MCP `set_character_state`、action-pack 匯入、settings schema 9 |
| v0.14.1 | head-projection 純邏輯、Settings 狀態槽／門檻 SSR 測、native helper 失敗分類 |
| v0.15.0 | Scene／Avatar VRM head bone 投影接線（氣泡錨點＋口型增益） |
| v0.15.1 | jsdom 互動測、匯入 partial failure 回饋、catalog schema 政策／reject 測 |

## 既有缺口收斂（v0.14–v0.15）

### 角色、MCP、測試（可自動驗證）

完整契約見 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

- [x] 系統狀態動作槽 UI；MCP `set_character_state`。
- [x] `action-pack.json` 匯入管線（不繞過授權／路徑／GLB gate）。
- [x] 精確 head 投影：純邏輯＋Scene／Avatar VRM bone 接線；缺骨點退回估算。
- [x] Settings 狀態槽／品質門檻／語音模式／氣泡錨點 jsdom 互動測。
- [x] Native helper 失敗分類語彙（JS）。
- [x] 目錄／action-pack 匯入 partial failure 使用者可見回饋（略過／失敗計數）。

### 仍待／未驗（見上方表格）

- [~] Native helper COM／WASAPI 分型 exit code（需 Windows runner）。
- [~] Idle 長跑／模型切換 GUI 基準；真實 exporter 人工結果。
- [~] Windows smoke、DPI／30%、Installer 簽署。

## v1.0.0 門檻

- [x] 沒有已知 P0／P1；主動操作（Settings `run`／匯入／MCP／listener 狀態）有成功或失敗回饋；目錄與 action-pack partial failure 亦可見。
- [~] Windows 10／11 的安裝、升級、移除、首次設定、語音、素材、角色表現與 MCP 有實機證據。**未驗**（無桌面）。
- [~] Installer 已簽署並驗證 publisher、SmartScreen 與更新路徑。**未驗**（無密鑰）；未簽署不得進 1.0。
- [x] settings、catalog 與 MCP schema 有版本政策（[`docs/DECISIONS.md`](docs/DECISIONS.md) §9）與測試（Settings 1–8→9、catalog unsupported reject、MCP schema 輸出）。
- [x] 匯入失敗不造成資料遺失：單檔 VRM／VRMA rollback、catalog mutation all-or-nothing、目錄／action-pack best-effort 結構結果已測。
- [~] 常見 exporter **真實**相容結果。**未驗**（目前僅 synthetic matrix，見 [`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md)）。
- [x] 隱私、loopback-only、媒體授權、Windows-only 與上游 attribution 有文件與自動 gate（`SECURITY`／bridge／assets／listener 測試）。

### 完成條件（進 1.0 前仍須關閉）

- 上表所有「未驗」項取得證據或明確降級說明（不可假裝完成）。
- 至少一版正式資產有 SHA-256、Windows smoke 與簽章狀態紀錄。
- `npm run check`、CI、CodeQL 與 production audit 無未處理高風險項。

## 明確不做

- 麥克風擷取、錄音、轉錄、音訊保存或上傳。
- 將 MCP／HTTP bridge 開到 LAN／Internet，或加入任意命令／檔案存取。
- 從聊天畫面、音訊或其他應用推測文字、情緒或工作狀態。
- 散布未確認授權的 VRM／VRMA，或恢復 Linux／macOS 發行。
- 在 VoxAvatar 內執行 LLM、保存聊天歷史或取代聊天客戶端。
- **在既有缺口與 1.0 未驗項關閉前，不另開新功能路線。**

## 接下來三件事

1. 有 Windows runner 時補 native COM／WASAPI 分型 exit code 與 `native:test`。
2. 有 Windows／密鑰時補 smoke、簽署與 30%／DPI／Idle 實機證據。
3. 取得授權清楚的真實 exporter 樣本結果後，批次發 Release（Latest 仍為 `v0.13.0`）。
