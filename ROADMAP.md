# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-01

規劃基準：`v0.2.8`

這份路線圖描述產品方向、里程碑順序與完成條件。版本是依賴順序，不是日期承諾；已完成內容以 [`CHANGELOG.md`](CHANGELOG.md) 為準，當前健康狀態以 [`REVIEW.md`](REVIEW.md) 為準。列表中 `- [x]` 表示已完成（可跨版本標示），`-` 表示尚未完成。

## 產品判斷

VoxAvatar 不應變成另一套聊天介面，也不該用內建角色數量競賽。它最有價值的定位是：

> **Windows 上本機優先、可由 AI agent 控制，而且安全邊界清楚的桌面角色呈現層。**

使用者真正要完成四件事：

1. **看見**：角色穩定顯示在桌面，不干擾原本的工作。
2. **聽見反應**：指定應用程式（或明確 opt-in 的系統輸出）播放助理語音時，角色自然做口型與動作。
3. **讓 agent 行動**：透過 MCP 播放已設定動作、控制視窗並取得可信狀態。
4. **保持掌控**：素材、設定與音量判定留在本機，錯誤可解釋，隱私與授權不靠猜。

```text
v0.1.x  穩定第一個 Windows 發行基線（已完成至 0.1.2）
   │
   ├─ v0.2.x  診斷／discovery 硬化 → 首次設定與安裝驗收閉環
   ├─ v0.3.x  VRM／VRMA 相容性與素材生命週期
   ├─ v0.4.x  MCP 契約、狀態與多用戶端可靠性
   └─ v0.5.x  可維護性、啟動與 renderer 效能
        │
        ▼
v1.0.0：可長期信任的 Windows 桌面角色與本機 agent 介面
```

SemVer 節奏：能力或安全邊界強化直接升 **minor**（例如 `0.1.2` → `0.2.0`），不在 `0.1.x` 長時間堆功能；純修補才用 patch。

## 已有基礎，不重做

- [x] Windows-only Electron overlay、透明區點穿、角色拖曳／縮放／旋轉與可靠系統匣。
- [x] WASAPI application-loopback helper，只計算指定應用程式播放輸出的音量。
- [x] VRM／VRMA 本機匯入、目錄批次匯入、品質報告、自訂動作與常用預設。
- [x] loopback-only MCP、HTTP 事件 API、`voxavatar://` protocol 與即時動作 catalog。
- [x] 繁中／英文設定介面，首次無模型時開啟設定與合法素材指引。
- [x] CI、CodeQL、Dependabot guarded auto-merge、資產授權 gate、NSIS 與 SHA-256 Release。

新工作應先補齊既有能力的使用者閉環。例如，先讓 listener 失敗能被診斷，而不是再加第二種音訊管線。

## 優先順序

1. **隱私、安全、授權與發行正確性**
2. **首次使用與錯誤可修復性**
3. **Windows、VRM／VRMA 與應用程式相容性**
4. **MCP 契約與狀態可信度**
5. **可維護性、效能與無障礙**
6. **更多外觀或動作功能**

## v0.1.x：關閉穩定版基線缺口

目標：`0.1.0` 的承諾可以由程式、GitHub 與下載後資產共同證明。

### 工作

- [x] 清除現有 CodeQL 警示，讓資產驗證使用已開啟檔案的 descriptor 取得 metadata，並移除無效函式參數。
- [x] 啟用 GitHub Dependabot security alerts 與自動安全修補建議；一般依賴更新仍遵守既有風險分類。
- [x] 維持 canonical MIT `LICENSE`，把第三方媒體排除與再散布條件留在 `NOTICE.md`／`ASSET_LICENSES.md`。
- [x] 將一般 Node／Electron 開發與原生 C++／安裝包工具鏈分開，避免要求所有貢獻者安裝 Visual Studio Build Tools。
- [x] 建立下載後 installer smoke 記錄格式，至少涵蓋安裝、首次啟動、模型匯入、語音來源、系統匣、MCP、升級與移除。

### 完成條件

- [x] `main` 沒有未處理的 CodeQL security／quality alert。
- [x] Dependabot security alerts 已啟用，production audit 保持 0 個 high 以上漏洞。
- [x] GitHub 能辨識 MIT License；媒體授權 gate 仍 fail closed。
- [x] GitHub Release 的 tag、package 版號、installer、Latest 與 SHA-256 一致。
- [x] 未簽署安裝包不宣稱已通過 SmartScreen 簽章驗收。
- 真實 Windows smoke 有可追溯記錄（格式已有，尚缺版本化實機填寫）。

## v0.2.x：診斷硬化與首次設定閉環

目標：`0.2.0` 先收斂 listener／matcher／IPC／MCP session 可靠性；後續 `0.2.x` 補齊首次設定進度、診斷摘要與實機矩陣。

### 工作

- [x] 將首次設定整理成進度清單：模型、可選動作、語音來源、MCP 健康與完成狀態。
- [x] 為 native helper 建立明確狀態：不存在、無法啟動、目標行程不存在、無輸出、正常監聽。
- [x] 增加可複製的診斷摘要，預設遮蔽使用者名稱、絕對路徑與素材檔名，不包含音訊或模型內容。
- [x] 讓 `get_status` 與設定頁共用同一套 readiness／錯誤語彙。
- 建立 Windows 10／11、安裝／升級／移除與 protocol 註冊的實機矩陣。
- [x] 將 process discovery 改成 PID 存活快路徑與 adaptive backoff，並定義多個符合 root process 時的 sticky active source 語意（`0.2.0`）。
- [x] 限制自訂 process matcher 為不會回溯爆炸的安全子集（`0.2.0`）。
- [x] 為 MCP session 加入 idle TTL、容量上限與可測試淘汰（自 `0.4` 提前至 `0.2.0`）。
- [x] privileged IPC 統一驗證 sender URL（完整拆 preload 仍屬後續）。

### 完成條件

- [x] 首次啟動每個未完成步驟都有原因與可執行的下一步。
- [x] 常見 helper／來源失敗不必開 DevTools 才能辨識。
- [x] 設定頁與 MCP 對同一狀態不會給出互相矛盾的答案。
- [x] 診斷摘要通過敏感資料測試，可直接附到 issue。
- [x] 穩定監聽時不再每次都啟動 PowerShell 全量掃描；多個符合來源有可預期的 sticky 選擇結果。
- [x] 惡意或病態 matcher 不會阻塞 Electron main process。
- [x] 遺棄或大量 MCP session 不會無界成長。

## v0.3.x：素材相容性與生命週期

目標：使用者匯入不同 exporter 的素材時，能預先知道可用性、品質與遷移結果。

### 工作

- 建立已驗證的 VRM 0.x／1.0 與常見 VRMA exporter 矩陣，記錄骨架、表情、貼圖與動作結果。
- 匯入前顯示格式、大小與品質摘要；失敗時保留可理解原因，不留下半完成 catalog 紀錄。
- 為 settings／library catalog 加上明確 schema version 與最近兩個 MINOR 的 migration fixture。
- 改善動作預覽、片段重新排序與品質報告到實際動作的導覽。
- [x] 維持「使用者本機匯入」與「專案可以再散布」兩套不同授權判定。

### 完成條件

- 支援矩陣中的素材都有自動 fixture 或版本化人工證據。
- [x] 匯入中斷、重名、損壞、過大與不相容素材不會破壞既有 library。
- 最近兩個 MINOR 的設定與 catalog 可以安全升級；不可遷移時會保留原資料並說明。

## v0.4.x：穩定的本機 MCP 契約

目標：agent 不必猜工具能力、動作名稱或錯誤狀態，也不會因長 session 使用過期 catalog。

### 工作

- 為 MCP status 與工具輸出宣告版本化 schema，記錄 SemVer 相容政策。
- 補齊 Codex 與通用 Streamable HTTP 用戶端範例、連接埠變更、重連與故障排除。
- 驗證多個本機 MCP client、長 session catalog 更新與 app 關閉／重啟行為。
- [x] 為 MCP session 加入 idle TTL、容量上限與可測試的淘汰／關閉行為（已於 `0.2.0` 落地）。
- 將 avatar 與 settings preload 分權；sender URL 驗證已於 `0.2.0` 落地，完整分權仍待完成。
- 對高頻重複動作加入有界佇列或節流語意，避免 renderer 被無限制事件淹沒。
- [x] 保持視覺控制範圍，不加入任意命令、任意檔案、網路代理或語音生成。

### 完成條件

- 支援的 client 不需解析人類文字來判斷狀態。
- schema 破壞性變更有版本與 migration 說明。
- app 重啟、client 斷線、多 client 與動作更新都有自動測試或可重現 smoke。
- [x] MCP 仍只監聽 loopback，安全邊界測試保持完整。
- [x] 遺棄或大量 session 不會無界成長。
- avatar renderer 無法呼叫設定／資產管理 IPC（仍待拆 preload）。

## v0.5.x：可維護性與效能

目標：功能增加時，不讓單一設定頁、main process 與 settings store 成為修改瓶頸。

### 工作

- 依功能邊界拆分 `SettingsPage.tsx`、`electron/main.cjs` 與 `settings-store.cjs`，先保留行為測試再搬移。
- 建立冷啟動、首次角色顯示、模型切換、長時間 Idle 與大型 library 的基準。
- 依 bundle 分析延後載入設定頁、品質報告與非首屏功能，不犧牲 overlay 首次顯示。
- 補鍵盤操作、焦點順序、縮放與高 DPI 的 Windows 實機驗收。
- 讓 native helper 的 COM／WASAPI capture 錯誤使用 typed failure 與非零退出，並補播放中、裝置切換與 recovery 真機測試。
- 補 App、Settings、Scene 錯誤復原的 component tests，以及 protocol、tray、MCP 的桌面 smoke。
- 評估 SBOM 與 Release evidence manifest，讓 installer 內容與依賴可稽核。

### 完成條件

- 大型檔案有清楚模組責任，常見修改不必同時碰 renderer、main 與 store。
- 效能改善有修改前後數據，不以 bundle 警告本身當成功指標。
- 100%、150%、225% DPI 與鍵盤核心流程沒有阻擋操作的裁切或焦點問題。
- Release 可同時提供 installer、checksum、依賴清單與版本證據。

## v1.0.0 的門檻

`1.0.0` 代表使用者可以長期信任產品契約，不代表功能堆到最多。

- [x] 沒有已知 P0／P1，CodeQL 與 production security alerts 無未處理 high 風險。
- Windows 10／11 的安裝、升級、移除、首次設定、語音口型、素材與 MCP 都有實機證據。
- 已簽署 installer 的 publisher、SmartScreen 與更新路徑完成驗證；若仍未簽署，不能進入 1.0。
- settings、catalog、MCP status 與工具 schema 有穩定版本政策及最近兩個 MINOR migration 測試。
- 常見 VRM／VRMA exporter 有公開相容矩陣，失敗不造成資料遺失。
- 所有主動操作都有成功或失敗回饋，沒有已知靜默失敗。
- [x] 隱私、loopback、媒體授權、Windows-only 與上游 attribution 邊界維持可驗證。

## 衡量方式

VoxAvatar 不加入遙測。指標由自動測試、benchmark、GitHub workflow 與版本化人工 smoke 蒐證。

| 指標 | 目標 |
| --- | --- |
| 未處理 P0／P1 | 0 |
| CodeQL high security alerts | 0 |
| production audit high 以上漏洞 | 0 |
| Release tag／package／Latest／installer／checksum 一致率 | 100% |
| 已驗證 Windows 安裝矩陣的阻擋缺陷 | 0 |
| 素材匯入失敗造成既有 library 資料遺失 | 0 個已知案例 |
| MCP 安全邊界與工具契約回歸測試 | 每次 CI 全數通過 |

啟動速度、記憶體與 renderer bundle 先在 v0.5 建立基準，再依真實數據設定 gate。

## 主要風險與防線

| 風險／依賴 | 可能後果 | 防線與證據 |
| --- | --- | --- |
| Windows build、音效 driver 與目標 app 差異 | listener 無輸出或附掛失敗 | helper 狀態模型、fixture、Windows 10／11 實機矩陣 |
| VRM／VRMA exporter 差異 | 角色、表情或動作錯位 | 匯入驗證、相容矩陣、版本化 fixture |
| 未簽署 installer | SmartScreen 阻擋或信任不足 | 清楚標示簽章狀態；1.0 前完成簽署驗證 |
| 本機 MCP 無驗證 | 同帳號行程可控制角色 | loopback、Host／origin／schema 限制，不提供敏感能力 |
| 第三方素材條款複雜 | 違反再散布條款 | 預設不內建、manifest fail closed、人工授權證據 |
| 大型 renderer／main 檔案持續成長 | 修改容易產生跨功能回歸 | 行為測試先行、按責任拆分、bundle／啟動 benchmark |

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
3. 純邏輯用自動測試；WASAPI、透明視窗、系統匣與 installer 用 Windows 實機 smoke。
4. 至少通過 `npm run check`；原生與 Release 由 GitHub Windows runner 執行完整 gate。
5. **每次 push 前**檢討並同步繁中／英文公開文件與 `CHANGELOG.md`（含 `README`、`ROADMAP`、`SECURITY`、`REVIEW`、決策與流程文件）；無變更也要確認已檢討。
6. push 後驗 CI、CodeQL、published Latest Release、tag SHA、installer 與 checksum。
7. 新版 Release 成功後才刪除其餘舊 Release／tag，只留最新；失敗則保留舊版。
8. 只有完成條件有證據時，才把項目標為完成。
9. Agent／維護者在對話中斷後必須自動接續未完成工作，見 [`AGENTS.md`](AGENTS.md)。

## 接下來三件事

1. [x] **關閉 v0.1.x 信任缺口**：清除 CodeQL alerts、啟用 Dependabot security alerts、修正 MIT 偵測並完成本次穩定修正版。
2. [x] **發行 `0.2.0`–`0.2.7` hardening／readiness**：discovery／matcher／MCP session／IPC、首次設定清單、helper 狀態與診斷摘要。
3. **補版本化 Windows 實機證據**，再推進 v0.3 素材相容矩陣與 v0.4 preload 分權。
