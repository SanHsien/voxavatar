# 角色表現設計

本檔集中說明 VoxAvatar 的動作、狀態、口型與漫畫式對話氣泡契約。產品排程以 [`ROADMAP.md`](../ROADMAP.md) 為準；這裡只定義行為，不承諾日期。

## 現有能力

- Settings 可為 Idle、Speaking 與自訂動作加入一個或多個 `.vrma`。
- 選片用**洗牌袋**（`src/motion-shuffle-bag.ts`）：把整池洗成一輪依序播完，再自動重洗開下一輪，因此一輪內每支各播一次、看完整池所需次數等於池大小。重洗時若新一輪第一支等於上一輪最後一支會交換，跨輪接縫不連播同一支；池變動即重建當前輪次。輪次永不結束，沒有「播完就停」的狀態。Idle、Speaking 與自訂動作依動作類型各自維護獨立輪次。
- Idle 每段以 `once` 播完後依「待機動作間隔」停在最後一幀再播下一段（預設約 8 秒，不是當機）。實作重用 clip／action，並有完成逾時後備，避免長跑後永久停住。
- Speaking 由語音輸出音量觸發，走同一套輪次：每段 `once` 播完直接接續下一段，**不套用待機間隔**（說話中間停住 8 秒不是預期行為）。判斷集中在 `shouldCycleRandomMotions`（IDLE／TALK 才輪播，空池不輪播）與 `motionRestMsForAnimation`（TALK 停頓 0，其餘沿用 `idle_rest_ms`）。
- 輪播只在沒有 override 時生效。MCP `play_animation` 建立的 one-shot override 播完即釋放；狀態槽 override 見下方「角色狀態」。
- 自訂動作有 MCP 名稱、描述與觸發情境，可用 `play_animation` 播放。
- 安裝包不附第三方 VRM／VRMA；取得與再散布規則見 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。

匯入路徑：系統匣 →「設定…」→「動作」。可加入單檔或遞迴掃描目錄，並用預覽檢查骨架、位移、循環與角色相容性。目錄品質 gate 有三種模式：

| 模式 | 行為 |
| --- | --- |
| 報告 | 全部送入匯入流程並產生 `voxavatar-vrma-report.md`；仍受 GLB／catalog 驗證與數量限制（`skipped_invalid`／`failed` 可見） |
| 嚴格 | 略過品質判定為 `reject` 的檔案，仍產生報告；同樣受 GLB／catalog gate |
| 關閉 | 不做品質分析，直接走匯入；仍受 GLB／catalog gate |

品質分數只協助找出解析錯誤、速度尖峰或循環接縫，不代表美術品質、角色相容性或授權結論。

## 口型與小尺寸可讀性

口型不依賴 VRMA。WASAPI helper 或 external integration 只傳入正規化播放音量；renderer 平滑音量後驅動 VRM 的 `aa`、`ee`、`ih`、`oh`、`ou` expression。這是**音量驅動的近似口型**，不分析原始音訊、文字或音素；Speaking VRMA 只是可同時播放的身體動作。

已落地：

- 可調的口型強度與最小可見開口，保留 attack／release 平滑（`lip-sync-gain`）。
- Scene／Avatar 以 VRM head／chest 骨點投影驅動口型增益與氣泡錨點；缺骨點時退回角色尺寸估算。
- Speaking 第二層低幅度頭部／上身程序化反應（`speaking-secondary-motion`；疊加於 VRMA，缺骨安全跳過）。

仍待／未驗：

- 以最小 30% 角色尺寸及 100%／150%／225% DPI 做實機可讀性驗收（無桌面時標未驗）。

## 狀態與動作契約

### 角色狀態

固定狀態集合：`idle`、`listening`、`speaking`、`working`、`reviewing`、`success`、`failed`。狀態只是呈現語意，不推測對話內容。

同時出現多個來源時，優先序為：

1. 使用者手動指定（`sourceKind: "user"` 最高優先；系統匣與角色右鍵選單「角色狀態」可設定／清除；`sourceId: tray-user`）
2. `failed` 短暫回饋
3. `success` 短暫回饋
4. `speaking`
5. `reviewing`
6. `working`
7. `listening`
8. `idle`

相同狀態同時到達時，以最新的有效事件取代舊事件。外部狀態有 bounded TTL：`ttl_ms` 省略或 `0` 時使用狀態預設 TTL（`idle` 預設 0＝直到被取代）；正值限制存活時間。`failed`／`success` 預設使用短 TTL；來源 session 斷線時立即清除該來源狀態。每個狀態可對應選用的系統動作槽；缺少素材時安全退回 Idle 或模型預設姿勢。外部（MCP／HTTP integration）狀態事件輸入須經 `normalizeExternalStateEvent` 驗證後才進入仲裁（MCP `set_character_state`；HTTP `POST /events` 的 `type: "character-state"`）；語音來源仍只由本機 voice 路徑產生。Settings「系統狀態動作槽」可綁定狀態→可播放動作名。**沒有獨立的 listening 系統動作**；有可播放 Idle 時 idle／listening 槽預選 `idle`，有 Speaking 時 speaking 槽預選 `speaking`。明確選「未綁定」則保留空並退回類型預設。

綁定**指回該狀態本來就會走的系統槽**（idle／listening→`IDLE` 型、speaking→`TALK` 型）時視同沒有具名動作，不建立狀態 override（`isSystemSlotFallbackMotion`）。這是必要的：狀態 override 會關掉隨機輪播並改用 `loop`，而預設綁定人人都有，若照單全收，Idle 會被鎖在啟動時抽中的那一支無限循環，整個動作池形同虛設。只有綁到**真正自訂**動作的狀態槽才建立 override。action-pack 可經 Settings 匯入（仍走 GLB／路徑／catalog gate），並合併 `state_slot` 綁定。

### 動作用途

VRMA 品質分析先區分用途，再套用規則：

- `loop`：Idle、Speaking 等循環動作，檢查首尾接縫與長時間重複。
- `one-shot`：招手、跳舞、成功或失敗回饋，不因首尾不可銜接而扣分。
- `pose`：短暫或靜態姿勢，重點是骨架、位移與穩定性。

動作包可用薄的 `action-pack.json` 描述名稱、用途、狀態槽與檔案參照；它不能繞過既有匯入驗證、授權 gate 或 app-controlled 資產路徑。狀態槽名稱解析見 `src/character-state-slots.ts`；Settings 可綁定系統槽並匯入 action-pack（仍走既有 gate）。詳見下方「action-pack.json 契約」。

### action-pack.json 契約

薄的動作包描述檔，只承載**名稱、用途、狀態槽與相對檔名**。它不是安裝格式，也不能繞過 Settings 匯入、GLB 驗證、授權 gate 或 `voxavatar-asset:` 路徑控制。

**給使用者的最短流程**

1. 把 `.vrma` 與 `action-pack.json` 放在同一資料夾（`files` 只寫檔名，不可含子目錄）。
2. 開啟設定 → 動作 →「系統狀態動作槽」→「匯入 action-pack…」。
3. 匯入成功後，動作列表會出現對應名稱，並依 `state_slot` 合併綁定（仍受 GLB／路徑／catalog gate；失敗／略過會顯示 notice）。

Settings 面板內有可展開說明與「複製範例」；完整範例：

- 使用者範例：[`docs/examples/action-pack.example.json`](examples/action-pack.example.json)
- 測試 fixture：[`electron/fixtures/action-pack/example.action-pack.json`](../electron/fixtures/action-pack/example.action-pack.json)
- 機讀驗證：[`electron/action-pack.cjs`](../electron/action-pack.cjs)

#### Schema（version 1）

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `schema_version` | 是 | 目前固定 `1` |
| `name` | 是 | 包名稱，≤64 |
| `description` | 否 | ≤240 |
| `actions[]` | 是 | 1–64 筆動作 |

每個 `actions[]` 項目：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `animation_name` | 是 | 小寫＋連字號，與 MCP／Settings 動作名相同規則 |
| `purpose` | 否 | `loop`／`one-shot`／`pose`（預設 `loop`） |
| `state_slot` | 否 | `idle`／`listening`／`speaking`／`working`／`reviewing`／`success`／`failed` |
| `files[]` | 否 | **僅**相對 basename（如 `wave.vrma`）；禁止 `/`、`\\`、`..` |
| `animation_description` | 否 | ≤240 |
| `animation_trigger_scenario` | 否 | ≤240 |

#### 明確不做

- 不內嵌或下載二進位媒體。
- 不提供絕對路徑、URL、或 app data 外路徑。
- 不取代 catalog／settings schema；實際安裝仍走既有匯入流程。
- 不因 action-pack 自動啟用 MCP 擴權。
- 不以品質分數、動作特徵、聊天或情緒內容自動猜測 VRMA 應屬於哪個動作。

### 動作↔VRMA 自動對應（政策摘要）

| 層級 | 行為 |
| --- | --- |
| **明示契約（正式）** | `action-pack.json` 的 `files`＋`state_slot`＋`purpose`；匯入時寫入 clip `purpose` 並合併狀態槽 |
| **同名預選** | 系統狀態槽在可播放時預選 idle／speaking（listening 綁 idle） |
| **檔名白名單（opt-in）** | Settings「依檔名建議分槽」：僅同名／前綴或 idle／speaking 等白名單，**須確認**才寫入；不明確略過 |
| **不做** | 語意／情緒／音訊／品質分數自動分槽 |

Settings 動作列表另提供人工管理：未分類片段池（先匯入再拖曳指定）、預覽、顯示名稱、用途、批次用途、排序、刪除、移至其他動作或回池（磁碟為可讀檔名＋短 ID，URL 仍用 UUID）。詳見 [`DECISIONS.md`](DECISIONS.md) §3／§10／§12。

### 離線 VRMA 整理流程

VoxAvatar 不在執行期用 AI 猜測動作語意。維護者或外部 agent 可以離線檢視 VRMA 骨架軌跡，再以人工審核的 action-pack 明示用途與狀態槽：

1. 先把候選檔集中到不含子目錄的本機整理目錄，再執行 `npm run vrma:curate -- inspect <目錄> --output <報告.json>`。報告會列出 GLB／VRMA 有效性、時長、Humanoid 骨骼、身體區域運動量、髖位移、品質分數與解析錯誤；不輸出語意分類。品質欄位會標示本次假定的 `purpose`，混合用途仍須在 action-pack 逐項明示。
2. 同時參考原始檔名、來源說明、授權與 Settings 預覽。骨架數值只能證明「動了哪些部位」，不能單獨證明 idle、speaking 或情緒。
3. 建立 schema 1 改名計畫：`{"schema_version":1,"renames":[{"from":"原名.vrma","to":"idle-01.vrma"}]}`。名稱採小寫 kebab-case；只有高信心素材才使用 `idle`、`speaking`、`greeting`、`happy`、`finger-gun`、`dance` 等保留語意，未知素材使用 `motion-unknown-*`。
4. 先執行 `npm run vrma:curate -- rename <目錄> <計畫.json>` dry-run；確認來源、目的名稱、重名與 Windows 路徑都通過後，再加 `--apply`。工具以兩階段 rename 避免交換名稱時覆寫，並逐檔比對改名前後 SHA-256。
5. 重新執行 `inspect`，確認有效檔數、內容與目標名稱。非 GLB 的 `._*.vrma` 多為 macOS AppleDouble metadata，應改成非 `.vrma` 副檔名保留或移出匯入目錄，不可冒充動畫。
6. 需要正式自動對應時，在同目錄建立 `action-pack.json`，以 `animation_name`、`purpose`、`state_slot`、`files[]` 明示關係。執行 `npm run vrma:curate -- verify-names <目錄> <action-pack.json> --output <對應報告.json>`，它會直接呼叫產品使用的 `suggestVrmaAssignment`，核對完全相同、`<動作名>-*` 前綴與六種狀態白名單，並列出未命中、錯誤動作、未列入 pack、缺檔及重複引用；任一項不為零便以非零結束碼失敗。
7. 用 Settings 匯入 action-pack 並逐項預覽。完全相同／前綴規則只會尋找**已存在**的動作，不會依檔名新建動作；action-pack 會建立所列動作，之後 opt-in「依檔名建議分槽」才有完整目標。一般目錄匯入仍加入使用者先選定的動作。安裝後由 app 保存為可讀 `{clip_name}--{id8}.vrma`，資產 URL 使用 UUID。

改名計畫與分析報告是本機整理證據，不應提交含絕對路徑、未授權媒體名稱或私人資料的產物。

## 浮動對話氣泡

角色旁可顯示漫畫式短句，例如 `完成！`、`正在看…`、`(๑•̀ㅂ•́)و✧` 或單一 Emoji。已落地契約：

- 在既有透明 avatar `BrowserWindow` 內用 DOM overlay（`CharacterBubble`）呈現；不為純顯示新增第二個 privileged 視窗。
- 純文字，支援 Unicode、Emoji 與顏文字；不解析 HTML、Markdown、圖片或連結。
- 預設最多 80 個 Unicode grapheme，可設定 1–15 秒 TTL；到期淡出。
- 以 `resolveBubbleLayout` 在視窗邊緣自動換邊（頭部錨點優先使用 Scene 投影的 VRM head／chest 骨點；缺骨點時退回角色尺寸估算）；不可阻擋拖曳或點穿。
- 同時只顯示一則；新訊息進入有界佇列（容量 4），相同文字／mood 合併延長 TTL，超出時丟棄最舊待播；**無跨來源優先序**（與狀態仲裁不同）。
- 內容只在記憶體與本機視窗呈現，不寫入歷史或 debug log。

MCP 工具 `show_message` 已提供：參數只含 `text`、可選 `duration_ms` 與 `mood`（`neutral`／`cheerful`／`thinking`／`warning`）。Settings「允許已連接 AI 顯示訊息」預設關閉；啟用後仍有 session／全域速率限制，斷線清除該來源訊息。`get_status` 只回報開關與是否可見，不回傳內容或歷史。

## 驗證

- 狀態仲裁、TTL、佇列、Unicode 長度與輸入拒絕採純邏輯測試。
- 動作輪播：`shouldCycleRandomMotions`／`motionRestMsForAnimation`／`isSystemSlotFallbackMotion` 有純邏輯迴歸測試（涵蓋預設綁定三狀態、空池、TALK 停頓為 0）；洗牌袋另有整輪覆蓋、連續多輪、跨輪接縫、池變動重建、單片段／空池與亂數防禦契約測。實機觀察待重裝後補（見 [`ROADMAP.md`](../ROADMAP.md) 驗證缺口）。
- 口型增益純函式見 `src/lip-sync-gain.ts`；頭部錨點／投影見 `src/head-projection.ts` 與 `src/vrm-head-bones.ts`（Scene 已接 VRM bone；DPI 實機仍標未驗）。
- Settings 狀態槽／品質門檻／語音模式與氣泡錨點有 jsdom 互動測；目錄／action-pack partial failure 有可見 notice；動作頁未分類池／批次用途／依檔名分槽有 static＋互動測；模型匯入 `form-actions` 有契約測。
- 離線 `vrma:curate`（inspect／rename／verify-names）有 Node 測試；Speaking 第二層 bone 套用與系統匣頂層選單骨架有純邏輯測；真實素材只記授權清楚的人工結果。
- 氣泡位置、DPI、長字串、Emoji、點穿與 reduced motion 以 Windows 實機 smoke 驗證。
- 修正以最小範圍進行；不得因單一素材問題改寫整套 renderer 或降低安全 gate。

## 明確排除

- 不從畫面、聊天程式或音訊推測文字、情緒或工作狀態。
- 不要求每個角色具備所有狀態動作；缺少素材時必須可安全降級。
- 不把某套 sprite atlas、固定 frame 數或第三方寵物素材格式變成 VRM／VRMA 契約。
- 不散布無再配布權的角色、動作、字型或圖像資產。
