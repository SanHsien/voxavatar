# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-01

規劃基準：`v0.6.0`（`main` 累積；Latest Release 為 `v0.5.0`，見 D-23）

這份路線圖描述產品方向、里程碑順序與完成條件。版本是依賴順序，不是日期承諾；已完成內容以 [`CHANGELOG.md`](CHANGELOG.md) 為準，當前健康狀態以 [`REVIEW.md`](REVIEW.md) 為準。列表中 `- [x]` 表示已完成，`-` 表示尚未完成。

## 產品判斷

VoxAvatar 不應變成另一套聊天介面，也不該用內建角色數量競賽。它最有價值的定位是：

> **Windows 上本機優先、可由 AI agent 控制，而且安全邊界清楚的桌面角色呈現層。**

使用者真正要完成四件事：

1. **看見**：角色穩定顯示在桌面，不干擾原本的工作。
2. **聽見反應**：指定應用程式（或明確 opt-in 的系統輸出）播放助理語音時，角色自然做口型與動作。
3. **讓 agent 行動**：透過 MCP 播放已設定動作、控制視窗並取得可信狀態。
4. **保持掌控**：素材、設定與音量判定留在本機，錯誤可解釋，隱私與授權不靠猜。

```text
v0.1–v0.5   已完成基線 → hardening → 素材／MCP → 可維護性起步（見下方「已完成里程碑」）
   │
   ├─ v0.6.x  模組收斂與 renderer／設定頁可測試性
   ├─ v0.7.x  效能基準深化與非首屏拆分
   ├─ v0.8.x  素材 exporter 相容矩陣（合成＋公開文件）
   ├─ v0.9.x  Windows 實機／簽署／native 驗收軌道（可延後開工，不阻塞 0.6–0.8）
   └─ v1.0.0  長期信任門檻
```

SemVer 節奏：能力或安全邊界強化直接升 **minor**；純修補才用 patch。Windows 實機與簽署**不得**阻塞 0.6–0.8（D-23）。

## 優先順序

1. **隱私、安全、授權與發行正確性**
2. **首次使用與錯誤可修復性**
3. **可維護性與可測試性（本機可驗證）**
4. **素材相容文件與合成矩陣**
5. **Windows 實機／簽署／native（有桌面或密鑰再做）**
6. **更多外觀或動作功能**

## 已有基礎，不重做

- [x] Windows-only Electron overlay、透明區點穿、拖曳／縮放／旋轉與可靠系統匣。
- [x] WASAPI application-loopback helper；首次設定 readiness／診斷摘要；helper 狀態模型。
- [x] VRM／VRMA 匯入、目錄確認匯入、品質報告、片段排序、migration fixtures。
- [x] loopback-only MCP（JSON schema、session TTL、多 client、動作佇列）、HTTP／`voxavatar://`。
- [x] avatar／settings preload 分權；CI、CodeQL、Dependabot、NSIS、SHA-256、批次 Release。
- [x] Settings lazy-load、bundle／SBOM／evidence 腳本、合成相容矩陣骨架。

## 已完成里程碑（摘要）

| 系列 | 代表成果 |
| --- | --- |
| v0.1.x | 第一個 stable Windows 基線、授權／CI／Release 信任根 |
| v0.2.x | discovery／matcher／IPC／session、readiness、診斷、preload、動作佇列 |
| v0.3.x | 匯入確認、schema 4／5→6 fixtures、片段排序、報告導覽 |
| v0.4.x | MCP JSON schema、整合文件、多 client 測試 |
| v0.5.x | migration／sanitize／renderer-windows／SettingsModels 拆分起步、bundle 基準、矩陣骨架 |

歷史細項見 [`CHANGELOG.md`](CHANGELOG.md)。下列各節只列**未完成**與**新規劃**工作。

---

## v0.6.x：模組收斂與可測試性

目標：繼續拆分大型檔，讓常見設定／IPC 修改不必一次碰完整 `SettingsPage`／`main`／store；補齊可在 Linux CI 跑的錯誤復原測試。

### 工作

- [x] 繼續拆分 `SettingsPage` section：`SettingsAnimationsSection`、`SettingsVoiceSection`（appearance／mcp／preview 仍可再拆）。
- [x] 將 `main.cjs` 的 settings IPC 註冊抽成 `settings-ipc.cjs`（overlay lifecycle 仍可再拆）。
- [x] 抽出 `settings-asset-validation.cjs`；store CRUD 邊界仍可繼續收斂。
- [x] 補 Scene／preview 錯誤復原純函式測試（`scene-error-recovery`）；jsdom App 整合與 protocol／tray 桌面 smoke 仍屬後續／v0.9。
- protocol／tray 桌面 smoke 仍屬 v0.9（實機）。

### 完成條件

- [x] `SettingsPage`／`main`／`settings-store` 行數明顯下降，section／IPC／store 有清楚邊界（可持續再拆）。
- [x] Scene／preview 錯誤復原有自動測試覆蓋主要路徑（純函式＋Scene boundary）。
- [x] `npm run check` 全綠；不要求本機 Visual Studio Build Tools。

## v0.7.x：效能基準深化

目標：用可重複數據導引拆包與延後載入，不以 bundle 警告本身當成功。

### 工作

- 延伸 `baseline:bundle`：記錄歷史對照、門檻建議（文件化，非遙測）。
- 非首屏進一步拆分（品質報告檢視、較重設定子頁）。
- 冷啟動／首次角色顯示／大型 library 的**軟體側**計時腳本（能跑多少算多少；真機記憶體屬 v0.9）。
- Idle 長跑與切換模型的可重複本機基準說明。

### 完成條件

- 至少兩次可比較的 bundle／啟動基準紀錄方式寫進開發文件。
- 非首屏拆分後 overlay 首屏 chunk 不回升到拆分前水準（對照 `baseline:bundle`）。

## v0.8.x：素材 exporter 相容矩陣

目標：在不提交未授權二進位媒體的前提下，把合成矩陣擴成可維護的公開相容文件。

### 工作

- 擴充 [`docs/VRM_VRMA_COMPATIBILITY.md`](docs/VRM_VRMA_COMPATIBILITY.md)：依公開資訊標註常見 exporter／版本假設與已知限制。
- 增加合成案例（骨架覆蓋、表情、貼圖缺損、動作尖峰等）並掛到自動測試。
- 匯入失敗／略過路徑保持不破壞既有 library（回歸測試）。
- 真實廠商檔案人工證據：可在取得合法樣本後補；**不**阻塞本系列文件與合成測試。

### 完成條件

- 公開矩陣涵蓋主要失敗模式，且每個案例能對到自動測試或明確「待人工」標記。
- 不相容匯入不會留下半完成 catalog 紀錄。

## v0.9.x：Windows 實機／簽署／native 軌道

目標：把先前自 0.1–0.5 **抽出且延後**的實機與 native 工作收進同一驗收軌道。無 Windows 桌面或密鑰時可整節暫停，不阻塞 0.6–0.8。

### 工作

- 填寫版本化 `docs/release-evidence/v{version}/windows-smoke.md`（安裝／升級／移除、protocol、匣、MCP）。
- Windows 10／11、DPI（100%／150%／225%）與鍵盤焦點實機驗收。
- Installer 簽署（`WIN_CSC_*`）與 SmartScreen／升級路徑驗證。
- Native helper：COM／WASAPI capture typed failure、非零退出；播放中／裝置切換／recovery 真機測試。
- protocol／tray／桌面 E2E smoke。

### 完成條件

- 至少一版有完整 smoke 證據與 checksum 對照。
- 簽署狀態在 Release 說明與 SECURITY 一致；未簽署不得宣稱 SmartScreen 通過。
- native 失敗路徑有可測試的錯誤型別或退出碼契約。

## v1.0.0 的門檻

`1.0.0` 代表使用者可以長期信任產品契約，不代表功能堆到最多。

- [x] 沒有已知 P0／P1；CodeQL／production high 無未處理項（以當下 `REVIEW` 為準）。
- Windows 10／11 安裝、升級、移除、首次設定、語音口型、素材與 MCP 都有實機證據（v0.9）。
- 已簽署 installer 的 publisher、SmartScreen 與更新路徑完成驗證；若仍未簽署，不能進入 1.0。
- [x] settings／catalog／MCP schema 有版本政策與最近兩個 MINOR migration 測試（可持續補強）。
- 常見 VRM／VRMA exporter 有公開相容矩陣；失敗不造成資料遺失（v0.8＋人工證據）。
- 所有主動操作都有成功或失敗回饋，沒有已知靜默失敗。
- [x] 隱私、loopback、媒體授權、Windows-only 與上游 attribution 邊界維持可驗證。

## 衡量方式

VoxAvatar 不加入遙測。指標由自動測試、benchmark、GitHub workflow 與版本化人工 smoke 蒐證。

| 指標 | 目標 |
| --- | --- |
| 未處理 P0／P1 | 0 |
| CodeQL high security alerts | 0 |
| production audit high 以上漏洞 | 0 |
| Release tag／package／Latest／installer／checksum 一致率 | 100%（批次 Release 時） |
| 素材匯入失敗造成既有 library 資料遺失 | 0 個已知案例 |
| MCP 安全邊界與工具契約回歸測試 | 每次 CI 全數通過 |

## 主要風險與防線

| 風險／依賴 | 可能後果 | 防線與證據 |
| --- | --- | --- |
| Windows driver／目標 app 差異 | listener 失敗 | helper 狀態、v0.9 實機矩陣 |
| VRM／VRMA exporter 差異 | 角色或動作錯位 | 合成矩陣、匯入驗證、v0.8 文件 |
| 未簽署 installer | SmartScreen 阻擋 | 清楚標示；1.0 前完成 v0.9 簽署 |
| 本機 MCP 無登入 | 同帳號可控制角色 | loopback／schema；不擴權 |
| 大型檔案回潮 | 回歸成本上升 | v0.6 持續拆分、行為測試、bundle 基準 |

## 明確不做

- [x] 不擷取麥克風、不錄音、不保存／上傳／轉錄音訊。
- [x] 不把 MCP 或 HTTP bridge 開到 LAN／Internet。
- [x] 不加入任意命令、任意檔案讀寫、網路代理或遠端桌面能力。
- [x] 不內建或散布未確認授權的 VRM／VRMA。
- [x] 不恢復 Linux、PipeWire、Hyprland、macOS native 或跨平台發行。
- [x] 不在 VoxAvatar 內執行 LLM、管理模型帳號或取代聊天用戶端。
- [x] 不以角色、動作或 agent 數量作為產品成功指標。

## 執行規則

1. 使用者結果先寫成可驗收條件。
2. 安全、授權、schema 或產品取捨寫入 [`docs/DECISIONS.md`](docs/DECISIONS.md)。
3. 純邏輯用自動測試；WASAPI、透明視窗、系統匣與 installer 用 Windows 實機 smoke（v0.9）。
4. 至少通過 `npm run check`；原生與 Release 由 GitHub Windows runner 執行完整 gate。
5. **每次 push 前**檢討並同步繁中／英文公開文件與 `CHANGELOG.md`。
6. push 後驗 CI／CodeQL；**批次 Release 時**再驗 Latest、tag、installer、checksum。
7. 新版 Release 成功後才刪其餘舊 Release／tag；失敗則保留舊版。
8. 只有完成條件有證據才勾選；v0.9 實機項不阻塞 v0.6–0.8。
9. 中斷後必須自動接續未完成工作，見 [`AGENTS.md`](AGENTS.md)。

## 接下來三件事

1. [x] **完成 v0.6 本輪**：Settings／IPC／asset-validation 再拆與錯誤復原測試；路線圖重規劃。
2. **推進 v0.7／v0.8**：bundle／啟動基準深化與 exporter 相容矩陣擴充。
3. **有 Windows／密鑰時再開 v0.9**：smoke 證據、簽署、native capture；之前不空轉發版。
