# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致；`main` 上可有多次版號 bump，再依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次發布。

## 1.0.2 - 2026-08-14

- 修正 Settings 的 MCP 健康狀態永久停在「啟動中」：Settings IPC 原本在 bridge `listen()` 前把 health／port／error／listener primitive 值閉包，之後即使 MCP 已 online 仍回傳舊狀態。現在每次 IPC 呼叫都讀取最新 runtime state，自訂 port、啟動錯誤與語音來源 listener 也不再陳舊。
- 新增 IPC 回歸測試，先重現 `starting:0`→`online:49152` 與 listener 更新，再驗證 MCP status 與 voice catalog 都取得呼叫當下值。
- Windows 11、225% DPI 實機候選驗證確認 Settings 顯示版本 1.0.2、MCP「線上／就緒」、6 個工具與 2 個可播放動作；既有 12 個模型、10 個動作與預設模型完整保留。
- 已執行從 GitHub Release 下載且通過 SHA-256 核對的 `v1.0.0` 正式 installer 同版本重裝；安裝後版本 1.0.0、12 個模型、10 個動作、預設模型、語音自動模式與 MCP 設定均保留，readiness complete 且 bridge 只綁 `127.0.0.1`。

## 1.0.1 - 2026-08-14

- 發布後回填 `v1.0.0` 正式證據：CI、CodeQL、Windows 打包與 Release workflow 全綠；Latest／tag／Release 均指向 `2482b602d04c2304a5db634681646a3e635a7eb7`。
- GitHub runner installer 的 digest、`SHA256SUMS.txt` 與本機 SHA-256 三路一致（`d9fcd68ce0862891a809f59b7faa506608e5698ad34a3b32c1e5eef51498fa29`，`105138682` bytes）；PowerShell 與 PE Certificate Table 均確認 `NotSigned`。
- 新版成功後移除舊 `v0.16.23` Release／tag；遠端與本機只保留 `v1.0.0`。當時正式下載檔的桌面同版本重裝仍待使用者允許，後續結果記於 1.0.2。

## 1.0.0 - 2026-08-14

- 正式化 Windows-only、local-first 的 1.0 產品契約：VRM／VRMA 桌面角色、指定應用程式與 opt-in 系統輸出音量驅動、Idle／Speaking 洗牌輪播、漫畫氣泡、6 個 loopback-only MCP 工具，以及不擷取麥克風、不錄音、不轉錄、不上傳的硬性邊界。
- 修正繁中 Windows PowerShell 5.1 程序列舉的編碼錯誤：CIM JSON 現在明確以無 BOM UTF-8 輸出，避免 Big5 尾位元組被誤解為 JSON escape，導致自動語音來源進入 `launch_failed`。新增命令契約測試，並在 Windows 11 實機確認自動偵測與系統輸出 TTS 皆恢復正常。
- 品質門檻相等時不再顯示不存在的 `75–75` 觀察區間；繁中與英文改為明確標示「未設觀察區間」，並加入 renderer 回歸測試。
- 完成 225% DPI 實機候選驗收：設定五區、角色預覽、About、MCP 6 工具、漫畫氣泡、視窗顯示／隱藏、loopback-only bridge 防護與未簽署狀態均取得證據；尚無法覆蓋的 100%／150% DPI、SmartScreen、簽署與真實 exporter 樣本仍明確標示未驗。
- Release notes 不再無條件宣稱所有 GUI／DPI／WASAPI 未驗，改為指向各版本 `docs/release-evidence/` 的實際結果；未取得證據的子項仍須逐項標示。

## 0.16.24 - 2026-08-10

- 新增 `electron/ipc-registration.test.cjs`：直接讀 `main.cjs` 原始碼，釘住「未經 `handleTrusted*Ipc` 包裝而註冊的 IPC 通道」精確集合，要求每個都在自己的 body 內比對 `event.sender`，並斷言只有三個信任包裝可以用變數通道名註冊。日後有人用裸 `ipcMain.handle`／`ipcMain.on` 新增通道會讓 CI 紅，而不是等 review 抓。構想取自上游 `xikhar/persona` PR #48。
- 現況實查：44 個設定變更通道全部走 `handleTrustedSettingsIpc`（驗 renderer URL＋settings 視窗 `webContents`），5 個未包裝的 `ipcMain.on` 各自比對 `event.sender`，`voxavatar:settings-get` 是唯一放行的讀取通道（avatar renderer 需要）。上游 issue #43 描述的繞過在本 fork 不成立，本次為預防性加固，非修補既有漏洞。
- 上游評估：`bb7ef24`→`152b1b4` 的 12 個 commit 與全部 open PR／issue 已逐項判定並寫入 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1。

## 0.16.23 - 2026-08-10

- 動作選片改為洗牌袋（shuffle bag）：一輪內每支片段各播一次，播完自動重洗開下一輪。原本每次從整池重抽、只排除上一支的純隨機覆蓋率很差——45 支的池平均要抽約 300 次才會全部看過一輪，且同一支可能只隔一支就重播。改後看完整池只需與池同樣的次數。
- 重洗時若新一輪第一支等於上一輪最後一支會交換位置，跨輪接縫不會連播同一支；池變動（新增／刪除／改用途片段）即重建當前輪次；單片段池與空池行為不變。
- Idle、Speaking 與 MCP `play_animation` 的自訂動作各自維護獨立輪次（依動作類型分開）。
- 移除已被取代的 `randomAnimationUrl`。
- 新增 `src/motion-shuffle-bag.ts` 與 8 條契約測試：整輪覆蓋、連續多輪、跨輪接縫（200 組隨機序列）、池變動重建、單片段池、空池、給定亂數序列的決定性，以及非有限／超界亂數來源的防禦（`Math.max(0, NaN)` 仍是 `NaN`，會讓洗牌寫入 `undefined`）。

## 0.16.22 - 2026-08-10

- 說話動作改為隨機輪播，修掉與 0.16.21 待機問題同源的第二半：`cycleRandomMotions` 原本硬綁 `animation === 'IDLE'`，TALK 一律 `playback: 'loop'` 且 `animationRequest` 不推進，指派多支 Speaking 片段時每次說話只會用到一支。
- 新增 `shouldCycleRandomMotions`（IDLE 與 TALK 都輪播，空池不輪播）與 `motionRestMsForAnimation`（TALK 停頓為 0，其餘沿用 `idle_rest_ms`）。說話期間片段直接接續下一支，不套用待機休息，避免句子講到一半凍住。
- `idleCycle`／`idleRestTimerRef`／`clearIdleRestTimer` 更名為 `motionCycle`／`motionRestTimerRef`／`clearMotionRestTimer`，名稱與「待機與說話共用」的實際行為一致。
- 迴歸測試涵蓋 IDLE／TALK／CUSTOM／DANCE 與空池的輪播判斷，以及 TALK 停頓為 0、非有限值與負值的停頓正規化。

## 0.16.21 - 2026-08-10

- 修正待機動作不再隨機輪播、從啟動起固定循環同一支的問題。快照層 `applyDefaultStateSlotBindings` 會自動補上 `{idle:'idle', listening:'idle', speaking:'speaking'}`，於是 `resolveStateMotion` 對 idle 一定解析出具名動作，`App` 照單全收建立 state override；override 存在時 `cycleRandomMotions` 為 false、`playback` 退回 `loop`，且 `animationRequest` 綁在不會變的 `requestId` 上，結果是啟動時抽中的那支 Idle 片段無限循環，`ambientIdleMotionUrls` 整池形同虛設。
- 新增 `isSystemSlotFallbackMotion`：綁定只是指回該狀態本來就會走的系統槽（idle→`IDLE`、speaking→`TALK`）時視同沒有具名動作，讓 Idle 回到 ambient 隨機輪播（播完一支、休息 `idle_rest_ms`、從整池重抽並排除上一支）。綁到真正自訂動作的狀態槽行為不變。
- 迴歸測試涵蓋預設綁定三個狀態、自訂槽、具名動作型別與 hint 不同、以及無具名動作四種情形。
- 已知未修：Speaking 仍走 `playback: 'loop'`，說話期間只會循環單一片段，不隨機輪播。

## 0.16.20 - 2026-08-08

- 修正診斷摘要與 MCP `get_status`／語音來源清單的路徑遮罩漏洞：精確替換插入的 `<home>`／`<user>` 佔位符含 `<>`，會切斷後續路徑正則的字元類，使 `\OneDrive\人物`、`\AppData\Local\…` 等尾段原樣留在輸出中。只有在使用者家目錄／帳號真的出現在路徑裡時才觸發，CI runner 帳號與測試字串永遠不同，因此自動化測不到。
- `redactSensitive`（Electron／MCP）與 `redactDisplayText`（UI）新增佔位符尾段收斂，兩側行為對齊；`SECURITY.md` 既有的遮罩承諾自此在實機成立。
- 迴歸測試：shared fixture 補 OneDrive 無副檔名資料夾、AppData helper 路徑、POSIX 巢狀資料夾三案；另加顯式帶入 `homeDir`／`username` 的環境無關測試，避免同類漏洞再次只在 CI 綠燈。
- 依賴：fast-uri 3.1.5（修 GHSA-7p8r-x3mc-p8w7 high）、hono 4.13.1、js-yaml 4.3.1。
- 本輪切 installer Release。

## 0.16.19 - 2026-08-02

- ROADMAP 拆「實機仍待」與「證據路徑進度」；新增 `evidence:verify`／`evidence:pe`（PE Certificate Table → NotSigned 機器證據，≠ SmartScreen）。
- Native `--emit-error` 10／11／12／13 契約；Event exit 13 獨立為 `native_helper_event_error`；smoke checklist 分段子項。
- exporter 證據 schema／空結果表；30%／idle 設定契約測；theme／tray／preload clip 契約；README↔package 版號 docs gate。
- tip evidence `v0.16.19`（`tag=null`、tip SHA、`ci_gates=pass`）；本輪不切 installer Release。

## 0.16.18 - 2026-08-02

- Settings notice 統一經 `settingsErrorMessage` 遮罩路徑；UI／MCP 雙軌 redact 對齊（含 `user Name`、`/root`、共用 fixture）。
- tip evidence：`--no-installer` 不再虛構 `tag: v{version}`；修正既有 tip manifest。
- 刪死鍵 `setup.code.mcp_offline`；readiness／i18n 窮舉 `mcp_*`；README「設定進度」雙語對齊。
- 抽出匯入／分槽確認文案、`resolveListenerProcessPattern`、`resolveAppliedTtlMs`；補 formatShowMessage／rate-limit／TTL／preload／settings-IPC 契約測。

## 0.16.17 - 2026-08-02

- Settings `list-voice-sources`／MCP listener 同步遮罩 `error`／`source`；語音 catalog 錯誤與 UI 顯示再遮罩。
- helper 下一步擴至 `target_missing`／`no_output`／`inactive`；設定進度 `resolveSetupCodeLabel` 抽出可測。
- 補 `settings-sanitize`／`settings-migration`／preload About／voice／state-slot／MCP toggle、tray `menuStrings` 語系對齊契約。
- tip evidence `v0.16.17`；INTEGRATIONS／SECURITY／DECISIONS 上游掃描時間戳對齊。

## 0.16.16 - 2026-08-02

- 精簡 ROADMAP「已完成摘要」為系列表；補齊設定進度 `voice_*` code 人話與 helper 下一步提示。
- MCP `get_status` 遮罩 `listener.error` 路徑；INTEGRATIONS／SECURITY 補完整 `helper_error` 碼表與出口契約。
- zh／en settings i18n 鍵對齊測試；匯入品質報告錯誤遮罩；`settings-sanitize`／`app-readiness` 語音碼契約測。
- tip `docs/release-evidence/v0.16.16`（無 installer）；歷史 `v0.16.12` 標 superseded；README 功能一覽對齊 0.16.x。

## 0.16.15 - 2026-08-02

- 修正 CodeQL `js/incomplete-url-substring-sanitization`：`secureRendererWindow` 測試改以精確陣列斷言外開 URL，不再對 URL 字串使用 `.includes` 子字串比對。

## 0.16.14 - 2026-08-02

- 公開安裝包明確標示 **NotSigned**：README／SECURITY 下載與完整性說明、About 對話框簽署狀態、Release workflow／`v0.16.12` notes 誠實段。
- 建立 `docs/release-evidence/v0.16.12`（含 installer SHA／size／NotSigned）與 tip 證據占位；`evidence:manifest` 支援填入資產並產生 `windows-smoke.md` 骨架。
- Settings 語音／設定進度：typed `helper_error` 人話、raw error 遮罩、缺 helper 下一步說明；INTEGRATIONS 補 listener 契約；VRM 相容真實樣本證據列骨架。
- About `formatAboutDetail` 與 Voice helper-missing 互動測鎖定未簽署／人話契約。
- 發布後：`docs/release-evidence/v0.16.14` 填入 tip SHA、installer SHA256／size、Release／Actions URL；`ci_gates` 標 pass；舊 `v0.16.12` Release／tag 已刪，僅保留 Latest。

## 0.16.13 - 2026-08-02

- 鎖定 `assign-vrma-by-filename`／`import-action-pack` IPC 回傳形狀（cancel／skip／confirm／assign）。
- MCP `show_message` callTool 契約；HTTP `POST /events` character-state 接受／拒絕。
- Appearance 語系／主題、確認對話 Escape／backdrop／忙碌、Voice application 模式、MCP agent 訊息開關互動測。
- `secureRendererWindow` 外開拒絕與導航阻擋；avatar preload 訂閱／視窗 API 契約。

## 0.16.12 - 2026-08-02

- 補齊可自動驗證的 review／路線圖契約：schema 10→11 migration fixture；未分類池改名／刪除／移回池 store 測；settings IPC handler 轉發；native typed exit／NDJSON code 10–13 矩陣。
- 抽出系統匣頂層選單與 Speaking 第二層 bone 套用為可測純邏輯；設定進度顯示條件、動作頁／模型匯入／action-pack 複製範例補 jsdom 互動測。
- 同步 DEVELOPMENT／CHARACTER_BEHAVIOR／ROADMAP；診斷摘要 complete 路徑斷言。
- 批次發布 GitHub Release `v0.16.12`（installer＋SHA256）；刪除舊 `v0.16.8`。

## 0.16.11 - 2026-08-02

- 上游 `xikhar/persona` 重掃：水位仍為 `9287ea3`（#16 macOS，不合併）；無 open PR；#11 仍標已涵蓋。
- `docs/DEVELOPMENT.md`／README 補上 `npm run vrma:curate` 驗證矩陣與目錄說明。
- 契約測補強：settings IPC／preload 鎖定未分類池與批次用途 channel；`vrma-curation` 補 assumed_purpose／schema／CLI／whitelist 案例；動作頁未分類池 static Vitest。

## 0.16.10 - 2026-08-02

- 新增離線 `vrma:curate` 維護工具：解包 VRMA／Humanoid 骨架與身體區域運動量，產生結構報告但不推斷動作語意。
- 支援 schema 1 人工改名計畫的 dry-run／套用；限制單一目錄 basename 與 VRMA／metadata 副檔名，拒絕越界、Windows 非法名稱、缺檔、重名及既有目的檔。
- 改名採兩階段暫存並逐檔驗 SHA-256；交換名稱、大小寫正規化與中途失敗復原均有 Node 測試。
- `verify-names` 直接使用產品的檔名建議規則，核對 action-pack 目標、未命中、錯誤動作、缺檔與重複引用。
- `CHARACTER_BEHAVIOR`／`DECISIONS §10` 記錄可重複流程，釐清檔名白名單只是 opt-in 建議，正式語意與狀態槽仍由 action-pack／使用者／外部 agent 明示。

## 0.16.9 - 2026-08-02

- Settings 模型「新增自訂模型」：選擇 VRM／從目錄評估匯入改為與其他頁相同的 `form-actions` 橫列間距，不再黏在一起。

## 0.16.8 - 2026-08-02

- Settings「未分類片段池」：可先匯入 VRMA，再拖曳到動作卡片指定；已指定片段可移回池中（settings schema 11 `unassigned_clips`）。
- 使用者 clip 磁碟檔名改為可讀 `{clip_name}--{id8}.vrma`，重新命名顯示名稱時同步磁碟檔名與 `source_basename`；資產 URL 仍用 UUID。
- 片段列表支援勾選批次設定 loop／one-shot／pose（`updateClipsPurpose`）。
- 同步 DECISIONS §9／§12、CHARACTER_BEHAVIOR。

## 0.16.7 - 2026-08-02

- Settings 動作片段管理：明確「預覽」按鈕；可重新命名顯示名稱、設定用途（loop／one-shot／pose）、移至其他動作；保留匯入時原始檔名供辨識（settings schema 10）。
- 改動作 metadata 時不再覆寫已自訂的 clip 顯示名稱。
- 同步 CHARACTER_BEHAVIOR／DECISIONS §9／§12。

## 0.16.6 - 2026-08-02

- Settings「設定進度」：必要項目完成後整塊隱藏，不再各分頁常駐；標題去掉「首次」以免誤解。診斷摘要改在 MCP 分頁也可複製。
- `docs/DECISIONS.md`：釐清不以 VRMA 內容做語意分槽、不內建動作分類 AI；設定進度面板顯示條件寫入 §11。

## 0.16.5 - 2026-08-02

- action-pack 匯入會把各動作的 `purpose` 寫入對應 VRMA clip（不再一律依動作類型預設）。
- 新增檔名白名單建議分槽（opt-in）：Settings → 動作 →「依檔名建議分槽…」，須確認後才寫入；不明確檔案略過。政策見 `docs/DECISIONS.md` §10。
- 同步 CHARACTER_BEHAVIOR／ROADMAP：澄清自動對應＝pack／同名預選／白名單確認，不做語意猜分。

## 0.16.4 - 2026-08-02

- 澄清狀態槽預設：沒有獨立 listening 系統動作；有可播放 Idle 時 idle／listening 槽預選 `idle`，有 Speaking 時 speaking 預選 `speaking`。Settings 文案與 CHARACTER_BEHAVIOR 同步。

## 0.16.3 - 2026-08-02

- 設定 → 動作：重排為「建立自訂動作／常用選單 → 動作列表（編輯／加入 VRMA）」緊鄰；待機指南改摺疊、品質把關與狀態槽下移，避免建立後找不到卡片。

## 0.16.2 - 2026-08-02

- 系統狀態動作槽：有可播放 Idle／Speaking（或同名）片段時自動預選；**listening 槽預選綁到 idle**（無獨立 listening 動作）；明確選「未綁定」保留空、不覆寫。
- Settings 內補 action-pack 可展開說明、複製最小範例；新增使用者範例 [`docs/examples/action-pack.example.json`](docs/examples/action-pack.example.json)，並更新 CHARACTER_BEHAVIOR 最短流程。

## 0.16.1 - 2026-08-02

- 全新原創品牌圖示取代上游風格頭像，透明背景與粗輪廓兼顧 GitHub、README、程式、安裝檔、工作列及 20 px 系統匣。
- README 新增醒目的上游 Credit，明確感謝 `xikhar/persona` 與貢獻者；無論 GitHub fork 關聯是否保留，都持續保留上游 MIT、著作權與署名。
- 重新 fetch 並評估上游至 `9287ea3`（#16）：macOS Core Audio 修正不適用 Windows-only 產品；目前無其他程式碼需合入。
- GitHub repository 已執行 **Leave fork network**，`SanHsien/voxavatar` 現為 standalone repo；解除後驗證 `fork=false`、`parent=null`，`main`、`v0.16.0`、Latest Release、1 個 issue、2 個 PR、Actions、About 與 topics 均保留。
- fork 以來的 `main` 歷史自共同上游基線後 squash 為單一 `v0.16.1` commit；本輪不建立 `v0.16.1` tag 或安裝版 Release，GitHub Latest Release 仍為 `v0.16.0`。

## 0.16.0 - 2026-08-02

- Speaking 第二層低幅度頭部／上身程序化反應（`speaking-secondary-motion` + Avatar 接線；疊加於 VRMA，缺骨跳過）。
- 抽出系統匣／右鍵「角色狀態」選單為可測模組；補 `user` sourceKind 與選單結構測試。
- Native typed exit：listener 模擬 exit／NDJSON `code` 測試；`native:test` 於 Windows 斷言 Usage=2。COM／WASAPI／Device／Event 真實失敗路徑仍標未驗。
- 同步 CHARACTER_BEHAVIOR／ROADMAP／DEVELOPMENT；實機 GUI／簽署／真實 exporter 仍未驗。

## 0.15.3 - 2026-08-02

- 系統匣與角色右鍵新增「角色狀態」選單：可手動指定 idle／listening／speaking／working／reviewing／success／failed，或清除手動狀態（`sourceKind: user`，最高優先）。
- Native helper 分型 exit code：C++ `HelperExit`（Usage=2、COM=10、WASAPI=11、Device=12、Event=13）與 NDJSON `"code"`；JS 分類優先 typed exit／code，再退回訊息啟發式。Windows runner `native:build`／`native:test` 仍標未驗。
- 同步 CHARACTER_BEHAVIOR／ROADMAP：手動狀態已有產品入口；Speaking 第二層頭部反應與實機／簽署仍開放。

## 0.15.2 - 2026-08-02

- 對齊 docs 承諾與實作：HTTP `/events` 支援 `character-state`；`VOXAVATAR_TARGET_PROCESS_PATTERN` 覆寫應用程式來源；external listener 回報 `external`。
- Settings MCP 顯示 tools／status schema 版本與 `set_character_state` 文案；`ttl_ms` 0／省略改用狀態預設 TTL；`show_message` zod 上限放寬（仍以 80 grapheme 為準）。
- 文件修正：氣泡佇列無跨來源優先、品質 gate「報告」模式仍受 GLB／catalog gate、CHARACTER_BEHAVIOR 投影已落地敘述。
- 路線圖註記仍缺：使用者手動狀態 UI、Speaking 第二層頭部反應、以及既有 Windows／簽署／真實 exporter 未驗項。

## 0.15.1 - 2026-08-02

- 補 Settings／氣泡 jsdom 互動測（狀態槽選取／匯入、品質門檻、語音隱私警告、投影錨點）。
- 目錄與 action-pack 匯入 notice 顯示略過／失敗計數（partial failure 可見；既有資料不覆寫）。
- Packaged library／catalog：unsupported `schema_version` reject 測試；[`docs/DECISIONS.md`](docs/DECISIONS.md) §9 schema 版本政策。
- 路線圖：註明 `REVIEW.md` 已併入「目前健康」；不規劃新功能，先收既有缺口；v1.0 可驗證項打勾，實機／簽署標未驗。

## 0.15.0 - 2026-08-02

- Scene／Avatar 以 VRM `head`（及 `upperChest`／`chest`／`spine` 退回）骨點接上 `head-projection`：每幀投影到 Canvas CSS 座標。
- 氣泡錨點優先使用骨點投影；缺骨點或相機後方時退回角色尺寸估算。
- 口型增益改用即時投影的 `headHeightPx`（每幀參數），隨角色遠近調整開口。
- 新增 `vrm-head-bones` 與投影回報節流／測試；文件與路線圖同步。

## 0.14.1 - 2026-08-02

- 抽出 `head-projection` 純邏輯：世界座標→視窗投影、頭部錨點解析；氣泡與口型共用尺寸退回路徑，並預留骨點投影輸入。
- Settings 狀態槽／品質分數門檻面板補 SSR 整合測試。
- Native helper 失敗分類（`native-helper-errors`）：依訊息／exit code 對應 MISSING／WASAPI／COM 等語彙，並寫入 listener 狀態。

## 0.14.0 - 2026-08-02

- Settings schema 9：新增 `state_slot_bindings`（idle／listening／speaking／working／reviewing／success／failed → 可播放動作名）。
- Settings「系統狀態動作槽」：可綁定狀態→動作，並匯入 `action-pack.json`（仍走既有 GLB／路徑／catalog gate，合併 `state_slot`）。
- MCP 新增 `set_character_state`（經 `normalizeExternalStateEvent`）；session 斷線清除該來源狀態；`tools_schema_version` 升為 3。
- Avatar overlay：外部狀態事件驅動系統槽動作；TTL 到期自動剪除並重算仲裁。
- Settings 目錄匯入品質把關：可調整 VRM／VRMA 共用分數門檻（`vrma_quality_reject_below`／`vrma_quality_keep_at_least`，預設 60／75）；分析器與 Markdown 報告跟隨設定。
- 整合／角色行為／README／路線圖同步（6 個 MCP 工具）。

## 0.13.5 - 2026-08-02

- 修正設定 → 語音：切離「輸出裝置」後，「隱私邊界警告」改依目前 UI 選取立即隱藏，不再因 settings 非同步寫入落後而殘留。

## 0.13.4 - 2026-08-02

- 設定 → 動作：建立區改到列表上方；文案改指「下方卡片」的「+ 加入 VRMA 檔案」。
- 無片段時在卡片內以主按鈕顯示加入 VRMA；建立後反白並捲動到該動作。
- 編輯改為卡片內聯表單，建立後可持續修改動作詳情與增刪片段。
- Agent 入口修正：規則只在 [`AGENTS.md`](AGENTS.md)；恢復薄 [`SKILL.md`](SKILL.md)，[`CLAUDE.md`](CLAUDE.md) 只作指向，供各 AI／Cursor 技能載入器遵守同一真相源。

## 0.13.3 - 2026-08-02

- 合併冗餘 Markdown，減少維護檔數量並更新全部引用：
  - 來源／授權與上游評估 → [`docs/DECISIONS.md`](docs/DECISIONS.md) §1（原 `NOTICE`／`UPSTREAM_EVAL`）
  - 專案健康 → [`ROADMAP.md`](ROADMAP.md)「目前健康」（原 `REVIEW`）
  - action-pack → [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)
  - Windows 驗收 → [`docs/RELEASING.md`](docs/RELEASING.md)
  - 刪除僅英文平行檔 `docs/VRM_VRMA_COMPATIBILITY.en.md`（維護文件只留繁中）
  - Agent 規則仍以 [`AGENTS.md`](AGENTS.md) 為準；`CLAUDE`／`SKILL` 僅作薄入口（0.13.4 再釐清）
- `evidence:manifest` 的 `validationDoc` 改指 `docs/RELEASING.md`；`AGENTS`／README／CONTRIBUTING 同步。

## 0.13.2 - 2026-08-02

- 新增上游 open PR／issue 評估紀錄（#16／#13 範圍外、#11 已涵蓋）與既有 commit 結論（現併於 [`docs/DECISIONS.md`](docs/DECISIONS.md) §1）。

## 0.13.1 - 2026-08-02

- 更新路線圖：v0.9–v0.12 收斂為已完成摘要，現行焦點改為 v0.14（狀態槽／jsdom／Windows 驗收）；重寫「接下來三件事」。
- 同步 README／CHARACTER_BEHAVIOR／DEVELOPMENT：發行版 `v0.13.0`、五個 MCP 工具、已落地氣泡／口型敘述。

## 0.13.0 - 2026-08-02

- 接續評估上游 `xikhar/persona`：`a72292f`（#14）、`cf27d12`（#15）不合併；水位推進至 `cf27d12`（見 `docs/DECISIONS.md`）。
- 批次發行累積於 `main` 的 v0.6–v0.12.1 變更（含角色表現、action-pack、Idle 長跑停住修復等）；Latest 自 `v0.5.0` 推進。

## 0.12.1 - 2026-08-02

- 修復長時間待機後角色停住：Idle `once` 輪播改為依 URL 重用 AnimationClip／Action，避免 mixer 堆積；並以 clip 時長逾時後備，即使 `finished` 漏發仍會排下一輪。
- 待機間隔（`idle_rest_ms`，預設 8 秒）期間仍會刻意停在最後一幀，屬設計行為，與永久停住不同。

## 0.12.0 - 2026-08-02

- 抽出 `settings-store-catalog.cjs`：模型／動作／clip CRUD 與偏好設定分離；既有 store 行為不變。
- 新增外部狀態事件正規化（`normalizeExternalStateEvent`）：供後續 MCP／integration 狀態事件使用，拒絕未知狀態與 `voice` 來源覆寫。

## 0.11.0 - 2026-08-02

- 新增薄 `action-pack.json` 契約與驗證（`electron/action-pack.cjs`、範例與 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)）；不繞過匯入／授權／路徑 gate。
- 抽出 avatar overlay lifecycle（`electron/overlay-lifecycle.cjs`）；`main.cjs` 以懶回呼接線，避免與 renderer windows 循環初始化。
- 新增狀態槽解析（`character-state-slots`）與氣泡邊緣避讓（`bubble-layout`）；`CharacterBubble` 依視窗與角色尺寸估算錨點換邊。

## 0.10.0 - 2026-08-02

- MCP 新增 `show_message`（Settings 預設關閉）；輸入清理、session／全域速率限制、斷線清除；`get_status` 只回報開關與是否可見。
- Settings schema 8：`mcp_show_message_enabled`；MCP 頁新增 opt-in 開關與隱私警告。
- Avatar overlay 漫畫式 `CharacterBubble` DOM；口型改走 `lip-sync-gain`（依 characterSize 推估頭部增益）。
- `tools_schema_version`／`status_schema_version` 升為 2；整合與安全文件同步。

## 0.9.0 - 2026-08-01

- VRMA 品質分析支援動作用途 `loop`／`one-shot`／`pose`：一次性動作不再因循環接縫被淘汰；pose 不套用 dead-motion。
- Settings schema 7：clip 持久化 `purpose`；Idle／Speaking 預設 `loop`，自訂動作預設 `one-shot`；6→7 遷移自動補齊。
- 新增角色狀態仲裁（`character-state`）、氣泡輸入清理／有界佇列（`character-message`）、小尺寸口型增益（`lip-sync-gain`）純邏輯與測試；App 語音路徑改走仲裁。
- DOM 氣泡、MCP `show_message`、口型 renderer 接線與 Windows 實機仍屬後續。

## 0.8.1 - 2026-08-01

- 簡化整個 repository 的 Markdown 分工：ROADMAP 只留已完成摘要與 v0.9，決策檔改為現行主題，代理與 fixture 文件改為薄入口。
- v0.6–v0.8 未完成項全部移入 v0.9；Windows release-evidence 規則併入單一驗收文件。
- 新增角色表現設計：動作用途、狀態仲裁、小尺寸口型可讀性、漫畫式浮動氣泡，以及已連接 AI 的 MCP `show_message` 規劃。
- 原 VRMA Idle 指南併入 `docs/CHARACTER_BEHAVIOR.md`，同步更新 Settings、README 與資產 manifest 連結。
- Settings MCP 頁新增連線後的自然語言使用範例；整合文件明確分開目前 4 個工具與 v0.9 `show_message` 契約。

## 0.8.0 - 2026-08-01

- 擴充合成 VRM／VRMA 相容矩陣：無 mesh／稀疏骨骼／無貼圖／無表情、過短／無動畫／loop seam 等案例，並掛到品質測試與 `manifest.json`。
- 公開文件補 Exporter 備註（VRoid／UniVRM／Blender）；真實廠商樣本仍標 `pending-human-sample`。
- `settings-store` 補強匯入失敗不留下半完成 catalog 的回歸測試。
- 設定頁抽出 `SettingsConfirmationDialog`（與 Preview／Appearance／MCP 拆分同輪收斂）。

## 0.7.0 - 2026-08-01

- `baseline:bundle` 支援歷史對照與門檻建議（`comparison`／`guidance`）；文件化於 `docs/DEVELOPMENT.md`。
- 新增 `baseline:startup`（main process 關鍵模組 `require()` 計時）；真機 cold-start／Idle／記憶體仍屬 v0.9。
- 設定頁再拆 `SettingsAppearanceSection`／`SettingsMcpSection`／`SettingsPreviewPanel`；Settings 仍為 lazy chunk。

## 0.6.0 - 2026-08-01

- 路線圖重規劃：v0.1–v0.5 收斂為已完成摘要；未完成項移入 v0.6–v0.9 與 v1.0 門檻。
- 設定頁抽出 `SettingsAnimationsSection`／`SettingsVoiceSection`；`SettingsPage` 行數下降。
- `main.cjs` 抽出 `settings-ipc.cjs`（settings IPC 註冊與測試）；`settings-store` 抽出資產驗證邊界（`settings-asset-validation`＋測試）。
- Scene 錯誤復原抽出 `scene-error-recovery` helper 與測試；`main.cjs` 行數下降。

## 0.5.0 - 2026-08-01

- 依功能邊界拆分 `settings-migration`／`settings-sanitize`、`renderer-windows`、`SettingsModelsSection`；`SettingsPage`／`main`／store 仍可繼續拆。
- 以合成 fixture 建立公開 VRM／VRMA 相容矩陣骨架（`docs/VRM_VRMA_COMPATIBILITY.md`）；真實 exporter 證據仍待。
- 新增 renderer bundle 基準腳本（`npm run baseline:bundle`）；冷啟動／Idle／真機記憶體基準仍待。
- Scene 錯誤復原 `resetKey` component test；App／Settings 整合與桌面 smoke 仍待。
- release-evidence manifest 模板（`npm run evidence:manifest`）；SBOM 腳本（`npm run sbom`）沿用。

## 0.4.0 - 2026-08-01

- MCP 工具結果改為可解析 JSON（含 `status_schema_version`／`tools_schema_version`）；設定頁 MCP 狀態同步暴露 schema 版本。
- 多 client 並發、catalog 熱更新與 handler close／重開自動化測試；`docs/INTEGRATIONS.md` 補 Streamable HTTP、重連、port 變更與故障排除。
- 採批次 Release；Windows 實機驗證不阻塞其他可自動驗證的路線圖工作。

## 0.3.0 - 2026-08-01

- Settings schema 4／5→6 migration fixture；不可遷移 schema 備份為 `settings.json.unmigratable-backup`。
- 目錄匯入抽出 `directory-import` evaluate helper；匯入前顯示品質摘要並確認後才寫 catalog。
- VRMA 片段上移／下移；品質報告可在檔案總管顯示。
- 設定頁 `React.lazy` 延後載入；新增 `npm run sbom` production 依賴清單。
- CHANGELOG 精簡歷史條目；agent／發行文件改為累積 bump、批次 Release。

## 0.2.9 - 2026-08-01

- README：已落地能力併入功能一覽；「相對上游」改為短政策註。
- avatar／settings preload 分權；設定寫入綁 settings webContents。
- MCP／protocol／HTTP 動作改走有界佇列（同名合併、容量、最小間隔）。

## 0.2.0 – 0.2.8 - 2026-08-01

- **診斷與首次設定**：進度清單、helper 狀態、診斷摘要、readiness 共用 schema。
- **安全與可靠性**（`0.2.0`）：sticky discovery、有界 matcher、MCP session TTL／容量、IPC sender 驗證。
- **素材品質**：VRM 目錄評估匯入、`voxavatar-vrm-report.md`；修正 VRM 0.x `humanBones` 陣列誤判。
- **發行與治理**：main tip 已 tagged 才打包；文件檢討／中斷接續規則；系統匣「重設視角」。

## 0.1.0 - 2026-08-01

- **第一個 stable release**：Windows overlay、WASAPI 口型、本機 VRM／VRMA、MCP／HTTP／protocol、中英設定。
- Fork 獨有：點穿、系統匣、目錄匯入、品質報告、一鍵清除、自訂動作。
- **0.1.1–0.1.2**：文件／Release 信任根、GLB 驗證、Idle 間隔、系統輸出語音 opt-in、縮放下限 30%。

## 0.1.0-beta - 2026-08-01

- 自 `xikhar/persona` 建立 Windows-only fork；移除內建角色／Idle VRMA；目錄匯入與品質報告；識別改為 `voxavatar`；CI／CodeQL／Dependabot 基線。
