# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-02
規劃基準：`v0.15.3`（`main` tip；正式 Release tag `v0.13.0`；上游評估見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)。

> **文件入口**：原獨立 `REVIEW.md` 已於 0.13.3 併入本檔「目前健康」；不另建平行覆核檔。`CHANGELOG` 管已完成，本檔管健康狀態與未關閉缺口。

## 目前健康

覆核基準：`v0.15.3`／`main`；GitHub Latest Release：`v0.13.0`

沒有已知未解 P0／P1。`v0.13.0` 為 Latest。上游 open PR／issue 已評估（無須合併，見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。**本輪不規劃新功能**；關閉既有缺口。`main` tip `0.15.3`：系統匣／右鍵手動狀態、native 分型 exit code（Windows runner 仍未驗）。

- Latest Release：`v0.13.0`；`main` tip 為 `0.15.3`。
- 上游：commit 水位 `cf27d12`；open PR #16／issue #13 為 macOS（不合併）；issue #11 首次取得角色文件已涵蓋。
- MCP 工具：6 個（含 `show_message` 與 `set_character_state`）；Settings 顯示 tools／status schema 版本。
- HTTP `/events` 支援 `character-state`；`VOXAVATAR_TARGET_PROCESS_PATTERN` 覆寫應用程式來源；external listener state 正確。
- 使用者可經系統匣與角色右鍵「角色狀態」手動指定／清除（`sourceKind: user`）。

本輪驗證：`npm run check` 全綠；Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

### 驗證缺口（標未驗，不虛構完成）

| 項目 | 狀態 | 原因 |
| --- | --- | --- |
| Windows GUI smoke（安裝／升級／移除／系統匣／MCP／DPI／鍵盤） | **未驗** | 無 Windows 桌面 |
| 30% 角色尺寸與多 DPI 實機可讀性 | **未驗** | 無 Windows 桌面 |
| Idle 長跑／切換模型記憶體基準（GUI 長駐） | **未驗** | 無 Windows 桌面；`baseline:startup` 不含 GUI |
| Installer 簽署／publisher／SmartScreen／升級路徑 | **未驗** | 無簽署密鑰 |
| Native helper COM／WASAPI 分型 exit code（Windows runner `native:build`／`native:test`） | **未驗** | C++／JS 碼已落地；本機無 Windows toolchain，正式 gate 仍靠 runner |
| 真實 VRoid／UniVRM／Blender 樣本人工結果 | **未驗** | 尚無授權清楚之二進位樣本入庫外證據 |

### 文件承諾已對齊／仍缺（非 Windows 阻塞）

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| docs 口型／head 投影敘述 | **已對齊** | Scene bone 接線已落地；文件不再寫「仍待投影」 |
| HTTP integration `character-state` | **已落地** | `POST /events` + `normalizeExternalStateEvent` |
| env process pattern 覆寫 UI | **已落地** | 覆寫 application／default／custom；不覆寫 output／external |
| External `listener.state` | **已落地** | 回報 `external` |
| Settings MCP schema 版本／6 工具文案 | **已落地** | |
| `ttl_ms` 0＝預設 TTL | **已落地** | |
| `show_message` zod 上限放寬 | **已落地** | 權威仍為 80 grapheme sanitize |
| 氣泡「來源優先序」 | **文件已改正** | 實作為有界佇列、無跨來源優先；契約已改寫 |
| 使用者手動狀態 UI | **已落地** | 系統匣／角色右鍵「角色狀態」；仲裁 `user` 最高 |
| Native 分型 exit／NDJSON `code` | **碼已落地** | HelperExit 2／10／11／12／13；JS 分類優先 typed；runner 未驗 |
| Speaking 第二層頭部／上身反應 | **未做** | CHARACTER_BEHAVIOR「仍待」；非 1.0 硬門檻 |

產品維持 **Windows-only**，不恢復 Linux／macOS 發行。

## 原則

1. 隱私、安全、授權與發行正確性優先。
2. 角色反應要可理解、可降級，不靠推測聊天或情緒。
3. 純邏輯與契約盡量自動測試；Windows 桌面、WASAPI、DPI、系統匣與 installer 留實機證據。
4. 一般開發不要求 Visual Studio Build Tools；原生與 installer 以 GitHub Windows runner 為正式 gate。
5. 不以內建角色、動作或 agent 數量競賽；不擴張成聊天客戶端。
6. **先關閉既有缺口與文件／實作漂移，不另開新功能**；無法驗證者只標未驗。

## 已完成摘要

| 系列 | 代表成果 |
| --- | --- |
| v0.1.x–v0.13.0 | 見既有 CHANGELOG；`REVIEW`→「目前健康」 |
| v0.14.0–v0.14.1 | 狀態槽／MCP state／head-projection 純邏輯／native JS 分類 |
| v0.15.0 | Scene／Avatar VRM head bone 投影接線 |
| v0.15.1 | jsdom 互動測、匯入 partial failure、catalog schema 政策 |
| v0.15.2 | docs／整合承諾對齊（HTTP character-state、env pattern、MCP UI、TTL／訊息契約） |
| v0.15.3 | 系統匣／右鍵手動狀態；native COM／WASAPI 分型 exit code（碼落地、runner 未驗） |

## 既有缺口收斂

### 可自動驗證（已完成）

- [x] 系統狀態槽 UI；MCP `set_character_state`；HTTP `character-state`。
- [x] action-pack 匯入；head 投影接線；jsdom 互動測；匯入 partial failure 回饋。
- [x] Settings／catalog／MCP schema 政策與測試；env pattern 覆寫；external listener state。
- [x] docs 與實作漂移修正（氣泡佇列、品質 gate「報告」模式、CHARACTER_BEHAVIOR 投影敘述）。
- [x] 使用者手動狀態（系統匣／右鍵）；native 分型 exit／NDJSON `code` 與 JS 分類測。

### 仍待／未驗

- [~] Native COM／WASAPI 分型 exit code 的 Windows runner `native:build`／`native:test`。
- [~] Idle／DPI／30%／GUI smoke／Installer 簽署（見驗證缺口表）。
- [~] 真實 exporter 人工結果。
- [~] Speaking 第二層頭部／上身反應（文件仍待；非阻斷）。

## v1.0.0 門檻

- [x] 沒有已知 P0／P1；主動操作有成功或失敗回饋。
- [~] Windows 實機證據。**未驗**。
- [~] Installer 簽署。**未驗**；未簽署不得進 1.0。
- [x] settings／catalog／MCP schema 版本政策與測試。
- [x] 匯入失敗不造成資料遺失。
- [~] 常見 exporter **真實**相容結果。**未驗**。
- [x] 隱私、loopback-only、媒體授權、Windows-only、上游 attribution 可驗證。

### 完成條件（進 1.0 前仍須關閉）

- 驗證缺口表所有「未驗」項取得證據或明確降級說明。
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

1. 有 Windows runner 時跑 `native:build`／`native:test`，確認分型 exit code。
2. 有 Windows／密鑰時補 smoke、簽署與 30%／DPI／Idle 實機證據。
3. 取得授權清楚的真實 exporter 樣本結果後，批次發 Release（Latest 仍為 `v0.13.0`）。
