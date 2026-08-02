# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-02
規劃基準：`0.16.5`（`main`；GitHub Latest Release tag 仍為 `v0.16.0`；上游評估見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)。

> **文件入口**：原獨立 `REVIEW.md` 已於 0.13.3 併入本檔「目前健康」；不另建平行覆核檔。`CHANGELOG` 管已完成，本檔管健康狀態與未關閉缺口。

## 目前健康

覆核基準：`0.16.5`／`main`；GitHub Latest Release：`v0.16.0`

沒有已知未解 P0／P1。上游 open PR／issue 已評估（無須合併，見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。**本輪不規劃新功能路線**；關閉既有缺口與契約漂移。`main` tip `0.16.5`：action-pack `purpose` 寫入 clip；檔名白名單 opt-in 分槽。

- Latest Release：`v0.16.0`（GUI／簽署／真實 exporter 仍標未驗）。
- 上游：commit 水位 `9287ea3`；目前無 open PR；#16／已關閉 issue #13 為 macOS（不合併），issue #11 首次取得角色文件已涵蓋。
- MCP 工具：6 個；HTTP `character-state`；系統匣手動狀態；Speaking 第二層頭部／上身反應已落地。
- 系統狀態動作槽有可播放時自動預選；Settings 可展開 action-pack 說明並複製範例；可選「依檔名建議分槽」。

本輪驗證：`npm run check` 全綠；Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

### 驗證缺口（標未驗，不虛構完成）

| 項目 | 狀態 | 原因 |
| --- | --- | --- |
| Windows GUI smoke（安裝／升級／移除／系統匣／MCP／DPI／鍵盤） | **未驗** | 無 Windows 桌面 |
| 30% 角色尺寸與多 DPI 實機可讀性 | **未驗** | 無 Windows 桌面 |
| Idle 長跑／切換模型記憶體基準（GUI 長駐） | **未驗** | 無 Windows 桌面；`baseline:startup` 不含 GUI |
| Installer 簽署／publisher／SmartScreen／升級路徑 | **未驗** | 無簽署密鑰 |
| Native COM／WASAPI／Device／Event **真實**失敗路徑 | **未驗** | Usage=2 可由 runner 斷言；真實音訊／COM 失敗仍需環境 |
| 真實 VRoid／UniVRM／Blender 樣本人工結果 | **未驗** | 尚無授權清楚之二進位樣本入庫外證據 |

### 文件承諾已對齊／仍缺（非 Windows 阻塞）

| 項目 | 狀態 | 說明 |
| --- | --- | --- |
| docs 口型／head 投影敘述 | **已對齊** | Scene bone 接線已落地 |
| HTTP／env／external／MCP UI／TTL／訊息契約 | **已落地** | 見 0.15.2 |
| 氣泡「來源優先序」 | **文件已改正** | 有界佇列、無跨來源優先 |
| 使用者手動狀態 UI | **已落地** | 系統匣／右鍵；選單結構可測 |
| Native 分型 exit／NDJSON `code` | **碼＋Usage=2 斷言已落地** | JS／listener 測齊；真實 COM／WASAPI 失敗未驗 |
| Speaking 第二層頭部／上身反應 | **已落地** | 純邏輯＋Avatar 接線；實機觀感未驗 |

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
| v0.15.0–v0.15.3 | head bone 投影、jsdom、docs 對齊、手動狀態、typed exit 碼 |
| v0.16.0 | Speaking 第二層反應；tray 選單可測；Usage=2 native 斷言 |
| v0.16.1 | 原創品牌圖示；上游 Credit；fork network 解除；standalone／metadata 與 squash 驗證 |
| v0.16.2 | 狀態槽預設綁定；Settings 內 action-pack 說明與範例 |
| v0.16.3 | 動作頁：建立區與列表緊鄰；指南摺疊、狀態槽下移 |
| v0.16.4 | 澄清 listening 狀態槽預設綁 idle（無獨立 listening 系統動作） |
| v0.16.5 | action-pack purpose 寫入 clip；檔名白名單 opt-in 分槽（DECISIONS §10） |

## 既有缺口收斂

### 可自動驗證（已完成）

- [x] 系統狀態槽 UI；MCP／HTTP character-state；action-pack；head 投影。
- [x] jsdom／匯入 partial failure；schema 政策；env pattern；external listener。
- [x] docs 漂移修正；使用者手動狀態；native 分型 exit 碼與 JS／listener 測。
- [x] Speaking 第二層頭部／上身；tray 選單抽出測試；Usage=2 runner 斷言。

### 仍待／未驗

- [~] Native COM／WASAPI／Device／Event 真實失敗路徑。
- [~] Idle／DPI／30%／GUI smoke／Installer 簽署（見驗證缺口表）。
- [~] 真實 exporter 人工結果。

## 正式發行完整驗收

- [x] 沒有已知 P0／P1；主動操作有成功或失敗回饋。
- [~] Windows 實機證據。**未驗**。
- [~] Installer 簽署。**未驗**；未簽署版本必須明確標示。
- [x] settings／catalog／MCP schema 版本政策與測試。
- [x] 匯入失敗不造成資料遺失。
- [~] 常見 exporter **真實**相容結果。**未驗**。
- [x] 隱私、loopback-only、媒體授權、Windows-only、上游 attribution 可驗證。

### 完成條件

- 驗證缺口表所有「未驗」項取得證據或明確降級說明。
- 至少一版正式資產有 SHA-256、Windows smoke 與簽章狀態紀錄。
- `npm run check`、CI、CodeQL 與 production audit 無未處理高風險項。

## 明確不做

- 麥克風擷取、錄音、轉錄、音訊保存或上傳。
- 將 MCP／HTTP bridge 開到 LAN／Internet，或加入任意命令／檔案存取。
- 從聊天畫面、音訊或其他應用推測文字、情緒或工作狀態。
- 散布未確認授權的 VRM／VRMA，或恢復 Linux／macOS 發行。
- 在 VoxAvatar 內執行 LLM、保存聊天歷史或取代聊天客戶端。
- **在既有缺口與未驗項關閉前，不另開新功能路線。**

## 接下來三件事

1. 有 Windows／密鑰時補 smoke、簽署與 30%／DPI／Idle 實機證據。
2. 取得授權清楚的真實 exporter 樣本結果。
3. Native COM／WASAPI／Device／Event 真實失敗路徑（有環境時補測）。

動作↔VRMA 自動對應政策已定（pack／同名預選／白名單確認；不做語意猜分），見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §10；不再另開語意分槽路線。
