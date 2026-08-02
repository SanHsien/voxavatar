# 角色表現設計

本檔集中說明 VoxAvatar 的動作、狀態、口型與漫畫式對話氣泡契約。產品排程以 [`ROADMAP.md`](../ROADMAP.md) 為準；這裡只定義行為，不承諾日期。

## 現有能力

- Settings 可為 Idle、Speaking 與自訂動作加入一個或多個 `.vrma`。
- Idle 從可用的非說話動作池抽播並避免立即重複；每段以 `once` 播完後依「待機動作間隔」停在最後一幀再播下一段（預設約 8 秒，不是當機）。實作重用 clip／action，並有完成逾時後備，避免長跑後永久停住。
- Speaking 由語音輸出音量觸發。
- 自訂動作有 MCP 名稱、描述與觸發情境，可用 `play_animation` 播放。
- 安裝包不附第三方 VRM／VRMA；取得與再散布規則見 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。

匯入路徑：系統匣 →「設定…」→「動作」。可加入單檔或遞迴掃描目錄，並用預覽檢查骨架、位移、循環與角色相容性。目錄品質 gate 有三種模式：

| 模式 | 行為 |
| --- | --- |
| 報告 | 全部匯入並產生 `voxavatar-vrma-report.md` |
| 嚴格 | 略過判定為 `reject` 的檔案，仍產生報告 |
| 關閉 | 不分析，直接匯入 |

品質分數只協助找出解析錯誤、速度尖峰或循環接縫，不代表美術品質、角色相容性或授權結論。

## 口型與小尺寸可讀性

口型不依賴 VRMA。WASAPI helper 或 external integration 只傳入正規化播放音量；renderer 平滑音量後驅動 VRM 的 `aa`、`ee`、`ih`、`oh`、`ou` expression。這是**音量驅動的近似口型**，不分析原始音訊、文字或音素；Speaking VRMA 只是可同時播放的身體動作。

已落地：

- 可調的口型強度與最小可見開口，保留 attack／release 平滑（`lip-sync-gain`）。
- 依角色縮放推估螢幕頭部高度並調整增益；精確 head 投影與 DPI 實機仍待。

仍待：

- Speaking 可搭配低幅度頭部／上身反應作第二層提示。
- 以最小 30% 角色尺寸及 100%／150%／225% DPI 做實機可讀性驗收。

## 狀態與動作契約

### 角色狀態

固定狀態集合：`idle`、`listening`、`speaking`、`working`、`reviewing`、`success`、`failed`。狀態只是呈現語意，不推測對話內容。

同時出現多個來源時，優先序為：

1. 使用者手動指定
2. `failed` 短暫回饋
3. `success` 短暫回饋
4. `speaking`
5. `reviewing`
6. `working`
7. `listening`
8. `idle`

相同狀態同時到達時，以最新的有效事件取代舊事件。所有外部狀態都有 bounded TTL，`failed`／`success` 預設使用短 TTL；來源 session 斷線時立即清除該來源狀態。每個狀態可對應選用的系統動作槽；缺少素材時安全退回 Idle 或模型預設姿勢。外部（MCP／integration）狀態事件輸入須經 `normalizeExternalStateEvent` 驗證後才進入仲裁；語音來源仍只由本機 voice 路徑產生。系統槽 UI／MCP 狀態工具仍待接線。

### 動作用途

VRMA 品質分析先區分用途，再套用規則：

- `loop`：Idle、Speaking 等循環動作，檢查首尾接縫與長時間重複。
- `one-shot`：招手、跳舞、成功或失敗回饋，不因首尾不可銜接而扣分。
- `pose`：短暫或靜態姿勢，重點是骨架、位移與穩定性。

動作包可用薄的 `action-pack.json` 描述名稱、用途、狀態槽與檔案參照；它不能繞過既有匯入驗證、授權 gate 或 app-controlled 資產路徑。狀態槽名稱解析見 `src/character-state-slots.ts`（系統槽 UI／實際匯入管線仍待）。詳見下方「action-pack.json 契約」。

### action-pack.json 契約

薄的動作包描述檔，只承載**名稱、用途、狀態槽與相對檔名**。它不是安裝格式，也不能繞過 Settings 匯入、GLB 驗證、授權 gate 或 `voxavatar-asset:` 路徑控制。

- 機讀驗證：[`electron/action-pack.cjs`](../electron/action-pack.cjs)
- 範例：[`electron/fixtures/action-pack/example.action-pack.json`](../electron/fixtures/action-pack/example.action-pack.json)

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

## 浮動對話氣泡

角色旁可顯示漫畫式短句，例如 `完成！`、`正在看…`、`(๑•̀ㅂ•́)و✧` 或單一 Emoji。已落地契約：

- 在既有透明 avatar `BrowserWindow` 內用 DOM overlay（`CharacterBubble`）呈現；不為純顯示新增第二個 privileged 視窗。
- 純文字，支援 Unicode、Emoji 與顏文字；不解析 HTML、Markdown、圖片或連結。
- 預設最多 80 個 Unicode grapheme，可設定 1–15 秒 TTL；到期淡出。
- 以 `resolveBubbleLayout` 在視窗邊緣自動換邊（頭部錨點目前為角色尺寸估算；精確 head 投影仍待）；不可阻擋拖曳或點穿。
- 同時只顯示一則；新訊息依來源優先序取代或排入小型有界佇列。
- 內容只在記憶體與本機視窗呈現，不寫入歷史或 debug log。

MCP 工具 `show_message` 已提供：參數只含 `text`、可選 `duration_ms` 與 `mood`（`neutral`／`cheerful`／`thinking`／`warning`）。Settings「允許已連接 AI 顯示訊息」預設關閉；啟用後仍有 session／全域速率限制，斷線清除該來源訊息。`get_status` 只回報開關與是否可見，不回傳內容或歷史。

## 驗證

- 狀態仲裁、TTL、佇列、Unicode 長度與輸入拒絕採純邏輯測試。
- 口型增益純函式見 `src/lip-sync-gain.ts`；精確投影與 DPI 實機仍待。
- 動作品質使用合成 fixture 與用途別門檻；真實素材只記授權清楚的人工結果。
- 氣泡位置、DPI、長字串、Emoji、點穿與 reduced motion 以 Windows 實機 smoke 驗證。
- 修正以最小範圍進行；不得因單一素材問題改寫整套 renderer 或降低安全 gate。

## 明確排除

- 不從畫面、聊天程式或音訊推測文字、情緒或工作狀態。
- 不要求每個角色具備所有狀態動作；缺少素材時必須可安全降級。
- 不把某套 sprite atlas、固定 frame 數或第三方寵物素材格式變成 VRM／VRMA 契約。
- 不散布無再配布權的角色、動作、字型或圖像資產。
