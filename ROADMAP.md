# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-14
規劃基準：`1.0.6`（`main`；GitHub Latest Release：`v1.0.6`；上游評估見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)。

> **文件入口**：原獨立 `REVIEW.md` 已於 0.13.3 併入本檔「目前健康」；不另建平行覆核檔。`CHANGELOG` 管已完成，本檔管健康狀態與未關閉缺口。

## 目前健康

覆核基準：`1.0.6`／`main`；GitHub Latest Release：`v1.0.6`

沒有已知未解 P0／P1。`1.0.0` 將 Windows-only、local-first、loopback-only MCP、音量驅動口型與不擷取麥克風等既有產品邊界定為穩定契約。`1.0.4` 在 `main` 納入 4 個可再配布且品質 100／`keep` 的 VRM，以及 13 個來源明示 CC0、品質 78–100／`keep` 的 VRMA；上游 18 個未授權 VRMA 與本機 10 個只有 `review` 的動作仍排除。Windows 11 實機驗收發現並修正繁中 PowerShell 5.1 程序 JSON 的 Big5／UTF-8 混用：自動語音來源不再進入 `launch_failed`；系統輸出 TTS 亦再次證明 `speaking`／`listening` 鏈路。一般上游程式評估水位仍為 `152b1b4`（2026-08-10；素材 #17 的重新判定見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。

- 正式 Release：`v1.0.6`（Release workflow `31809770616` 的授權資產 gate、Node 24 check、完整 dependency audit、Windows native build／self-test、NSIS 打包與發布全綠；runner installer digest、`SHA256SUMS.txt` 與本機 SHA-256 一致，Authenticode `NotSigned` 經 PE Certificate Table 確認）。本輪無 Windows 桌面，未重跑安裝／升級／系統匣／DPI／真實語音；1.0.5 乾淨 per-user 安裝與 MCP 部分驗證仍見版本化歷史證據。成功後僅保留 `v1.0.6` Latest Release／tag。
- 安全基線：Electron 39.8.10 升級至仍受支援的 43.4.0；GHSA-jmr9-qjv8-65gv 的 `extract-zip@2.0.1` 已由 lockfile 移除，改用 Electron 維護的 extractor。完整 dependency audit 為 0，且日常／CI gate 不再只檢查 production dependencies。
- 內建資產：VRoid Sample A／B／C、つくよみちゃん Type A 與 13 個 CC0 VRMA；全部同時通過原始來源、再配布、品質 `keep`（預設 >75；75 為 `review`）與 SHA-256 查核。Idle／Speaking 與 10 個自訂動作可直接使用；`assets:release` 會重算每個 digest。
- 上游：commit 水位 `7ca65a3`（2026-08-22，已評估）。`152b1b4..7ca65a3` 的 13 個 commit 逐項判定：已涵蓋 2（#48 settings IPC 註冊點把關、#61 click-through，本 fork 皆已有且 #48 更嚴）、範圍外 3（VRoid Hub #47／#53、macOS 發行 #58）、不合併 4（#51 TypeScript 遷移、#56 eol-last plugin、#59／#60 Settings UI 拆分）、**候選 4**（#46／#49／#50／#54 動作綁定 VRM 表情——本 fork 目前只把 expression 用在 lip-sync 與眨眼，缺使用者可設定的動作↔表情綁定與 hold／release 事件，屬 fork 端實作而非 cherry-pick）。詳見 `docs/DECISIONS.md` §1。
- 上游（前輪）：commit 水位 `152b1b4`（2026-08-10，已評估）。12 個 commit 判定為不合併 6（含 VRoid Hub 帳號連線四件與 #23 排程器）、已涵蓋 1、不適用 1、候選 4；open PR #45（含麥克風，撞硬性邊界）不合併、#47 範圍外、#46 候選、#48 部分採用已實作；open issue #43 已涵蓋＋已加固、#44／#18 範圍外、#35 候選、#11 已涵蓋。
- MCP 工具：6 個；HTTP `character-state`；系統匣手動狀態；Speaking 第二層頭部／上身反應已落地。
- 系統狀態動作槽有可播放時自動預選；Settings 可展開 action-pack 說明並複製範例；可選「依檔名建議分槽」。必要設定完成後不再顯示設定進度面板；動作片段可預覽／改名／改用途／搬移；未分類片段池可拖曳指定。
- 1.0.6 的待機池預設納入所有非說話動作，可在 Settings 依動作種類取消；`TALK`、Speaking 槽及其綁定動作強制排除。schema 12、store／IPC／preload 與 renderer 互動均有契約測。

1.0.4 候選曾以 Node 24.19.0 完成 lint、305 個 Node 測試、152 個 renderer 測試、production build、資產 release gate 與本機 `electron-builder` NSIS 打包；封裝內容為精確 4 個 VRM／13 個 VRMA。正式 Release workflow `31795033665` 後續完成授權資產 gate、Node 24 check、Windows native build、NSIS 打包與發布；下載檔 SHA-256 與兩路 `NotSigned` 證據已核對。Windows 11、225% DPI fresh-userData 已顯示 AvatarSample_A 並列出完整 catalog；正式安裝／升級、100%／150% DPI、另 3 模型切換與逐片段播放仍不擴大宣稱。

### 驗證缺口（標未驗，不虛構完成）

| 項目 | 狀態 | 原因 |
| --- | --- | --- |
| 0.16.21–0.16.23 待機與說話洗牌輪播的實機確認 | **部分驗證** | 1.0 候選可播放 Idle／Speaking 且角色有動作；整輪不重複仍只有洗牌袋契約測，無可觀察 clip ID 的實機證據 |
| Windows GUI smoke（安裝／升級／移除／系統匣／MCP／DPI／鍵盤） | **部分驗證** | 本機候選 0.16.23→1.0.0 與正式下載檔 1.0.0→1.0.2 升級均保留設定；225% DPI 設定／預覽／About、MCP／氣泡／視窗控制已驗；移除、系統匣與鍵盤矩陣待補 |
| 30% 角色尺寸與多 DPI 實機可讀性 | **部分驗證** | 225% DPI、50% 角色尺寸可讀；30% 與 100%／150% 尚未驗 |
| Idle 長跑／切換模型記憶體基準（GUI 長駐） | **未驗** | 本輪只做短時間 GUI 操作；`baseline:startup` 不含 GUI |
| Installer 簽署／publisher／SmartScreen／升級路徑 | **部分驗證** | 1.0.0–1.0.6 正式 runner 資產均證明 `NotSigned`（1.0.6 為 PE Certificate Table 空）；0.16.23→1.0.0 與 1.0.0→1.0.2 升級均保留資料，1.0.4 起正式升級未驗。SmartScreen 與 publisher 待補 |
| Native COM／WASAPI／Device／Event **真實**失敗路徑 | **未驗** | Usage=2 可由 runner 斷言；真實音訊／COM 失敗仍需環境 |
| 真實 VRoid／UniVRM／Blender 樣本人工結果 | **部分驗證** | 4 個內建 VRM 自動品質分析皆 100／`keep`；13 個內建 VRMA 為 78–100／`keep`。Windows fresh-userData 已顯示 AvatarSample_A 並列出全部 4 模型／13 片段；另 3 模型切換、逐片段播放與其他 exporter 仍待補 |

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
| v0.1–v0.13 | Windows-only fork 基線；`REVIEW`→「目前健康」（細節見 CHANGELOG） |
| v0.14–v0.15 | 狀態槽／MCP／HTTP／head 投影／手動狀態／typed exit |
| v0.16.0–0.16.9 | Speaking 第二層、tray、狀態槽預設、action-pack、clip 池／預覽、UI 間距 |
| v0.16.10–0.16.23 | `vrma:curate`、契約測、NotSigned／evidence、helper／MCP 遮罩（含 0.16.20 佔位符尾段修正）、CodeQL、i18n／sanitize／IPC、證據路徑腳手架、Idle／Speaking 輪播修正與洗牌袋（0.16.21–0.16.23） |
| v1.0.0 | 穩定產品契約；繁中 Windows 程序列舉 UTF-8 修正；225% DPI GUI／WASAPI／MCP 候選實機驗收 |
| v1.0.1 | `v1.0.0` 正式 runner 資產／workflow／Latest 證據與舊 tag 清理收尾 |
| v1.0.2 | 正式 installer 桌面重裝證據；Settings MCP status 改讀 live runtime state |
| v1.0.3 | `v1.0.2` runner／Latest／正式升級與 MCP 修正實機證據收尾 |
| v1.0.4 | 4 個品質 `keep` 的已授權 VRM、13 個品質 `keep` 的 CC0 VRMA、逐檔 SHA-256 發行 gate；未授權與 `review` 媒體排除 |
| v1.0.5 | 升級至受支援的 Electron 43；移除易受 symlink path traversal 影響的 `extract-zip`；完整 dependency audit 納入 CI；正式乾淨安裝與 MCP smoke |
| v1.0.6 | 可設定的非說話待機池；Speaking／TALK 與其綁定動作強制排除；schema 12 持久化與 UI／IPC 契約 |

細部條目只保留在 [`CHANGELOG.md`](CHANGELOG.md)；本表不逐版展開。

## 既有缺口收斂

### 可自動驗證／證據說明（已完成）

- [x] 狀態槽／MCP／HTTP／action-pack／head 投影；jsdom／schema／env／external listener；手動狀態；typed exit 與 Usage=2。
- [x] Speaking 第二層、tray、`vrma:curate`、schema 10→11、IPC／Settings 互動契約、assign／show_message／secureRenderer。
- [x] release-evidence（Latest SHA／NotSigned；`ci_gates` 綠）；README／SECURITY／About 未簽署標示；helper_error 人話與路徑遮罩。
- [x] 設定進度語音碼人話；MCP／Settings 語音清單路徑遮罩；zh／en i18n 鍵對齊；helper 狀態下一步；sanitize／migration／preload 契約。
- [x] Settings notice 遮罩；tip evidence 不虛構 tag；雙軌 redact fixture；確認對話／listener pattern／TTL 抽出；format／rate-limit／IPC 頻道窮舉契約。
- [x] `evidence:verify`／PE NotSigned；`--emit-error`；Event 獨立碼；smoke 子項；exporter schema；30%／idle／theme 契約。
- [x] Idle／Speaking 輪播：`shouldCycleRandomMotions`、`motionRestMsForAnimation`、`isSystemSlotFallbackMotion` 與洗牌袋（整輪覆蓋／跨輪接縫／池變動／亂數防禦）純邏輯契約（實機觀察見驗證缺口表）。
- [x] 待機池：所有非說話動作預設納入、使用者排除可持久化；Speaking／TALK 與其綁定動作不可啟用，具 static／互動／migration／IPC 契約測。

### 仍待／未驗（實機、密鑰或授權樣本阻塞）

- [~] Native COM／WASAPI／Device／Event **真實**失敗路徑（HRESULT／裝置環境）。
- [~] Idle／DPI／30% 實機可讀性／GUI smoke／Installer 簽署與 SmartScreen（見驗證缺口表）。
- [~] 真實 exporter 人工結果：4 個內建 VRM 與 13 個 VRMA 已通過自動品質 gate；Windows fresh-userData 已顯示 AvatarSample_A 並讀出完整內建 catalog，另 3 模型切換、逐片段播放與其他 exporter 樣本仍待完整矩陣。

### 證據路徑進度（可自動／可在 Linux 推進；≠ 實機完成）

- [x] Usage=2＋JS typed-exit 分類；`--emit-error` 10／11／12／13 契約（真實 COM／WASAPI 仍未驗）。
- [x] Event exit **13** 獨立為 `native_helper_event_error`（不再併入 wasapi 語彙）。
- [x] `evidence:verify`：GitHub digest／SHA256SUMS／NotSigned 標示對照（≠ SmartScreen）。
- [x] PE Certificate Table 空＝機器可證 `NotSigned`（`evidence:pe`；≠ publisher 驗收）。
- [x] smoke checklist 拆成可分段填寫子項；tip evidence 可標 `ci_gates=pass` 並寫 tip SHA。
- [x] exporter 證據 JSON schema／空結果表（`docs/release-evidence/_templates/`；無真實結果）。
- [x] 角色尺寸 30%／idle 設定契約互動測（多 DPI 實機可讀性未驗）。

## 正式發行完整驗收

- [x] 沒有已知 P0／P1；主動操作有成功或失敗回饋。
- [~] Windows 實機證據。**部分驗證**；本機候選安裝／升級與 225% DPI smoke 已完成，移除／多 DPI 矩陣仍待補。
- [~] Installer 簽署。**未驗**；未簽署版本必須明確標示。
- [x] settings／catalog／MCP schema 版本政策與測試。
- [x] 匯入失敗不造成資料遺失。
- [~] 常見 exporter **真實**相容結果。**部分驗證**：官方 VRoid sample 已通過自動品質 gate，AvatarSample_A 通過 fresh-userData 顯示 smoke；另 3 模型與其他 exporter 待補。
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

1. 補齊尚未覆蓋的實機矩陣：100%／150% DPI、30% 角色、系統匣、鍵盤、移除、Idle 長跑與可觀察 clip ID 的洗牌整輪證據。
2. 等簽署密鑰／授權樣本／可控 COM 失敗環境：補 SmartScreen／publisher、真實 exporter 結果與 Native COM／WASAPI／Device／Event 真實失敗路徑。
3. 上述穩定性證據成熟後，再從 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1 候選清單選下一個明確功能，不擴張既有安全邊界。

動作↔VRMA 自動對應政策已定（pack／同名預選／白名單確認；不做語意猜分），見 [`docs/DECISIONS.md`](docs/DECISIONS.md) §10；不再另開語意分槽路線。
