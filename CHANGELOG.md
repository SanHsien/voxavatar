# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致；`main` 上可有多次版號 bump，再依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次發布。

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
