# 角色表現設計

本檔集中說明 VoxAvatar 現有的動作使用方式與 v0.9 預計加入的角色狀態、動作用途和漫畫式對話氣泡。產品排程以 [`ROADMAP.md`](../ROADMAP.md) 為準；這裡只定義行為契約。

## 現有能力

- Settings 可為 Idle、Speaking 與自訂動作加入一個或多個 `.vrma`。
- Idle 從可用的非說話動作池抽播並避免立即重複；Speaking 由語音輸出音量觸發。
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

桌面角色縮到較小尺寸時，v0.9 應加入：

- 可調的口型強度與最小可見開口，保留 attack／release 平滑，避免低音量不動或高音量抖動。
- 依頭部投影到螢幕的像素尺寸調整增益；小角色加強、近距離角色回到自然幅度，並設安全上限。
- Speaking 可搭配低幅度頭部／上身反應或氣泡作第二層提示；沒有 VRMA 仍須看得出正在說話。
- 以最小 30% 角色尺寸及 100%／150%／225% DPI 做實機可讀性驗收，避免只在 Settings 大預覽判定。

## v0.9 狀態與動作契約

### 角色狀態

先採固定、小而穩定的狀態集合：`idle`、`listening`、`speaking`、`working`、`reviewing`、`success`、`failed`。狀態只是呈現語意，不推測對話內容。

同時出現多個來源時，優先序為：

1. 使用者手動指定
2. `failed` 短暫回饋
3. `success` 短暫回饋
4. `speaking`
5. `reviewing`
6. `working`
7. `listening`
8. `idle`

相同狀態同時到達時，以最新的有效事件取代舊事件。所有外部狀態都有 bounded TTL，`failed`／`success` 預設使用短 TTL；來源 session 斷線時立即清除該來源狀態，避免角色卡住。每個狀態可對應選用的系統動作槽；缺少素材時安全退回 Idle 或模型預設姿勢。減少動態模式只顯示安靜姿勢與必要回饋。

### 動作用途

VRMA 品質分析先區分用途，再套用規則：

- `loop`：Idle、Speaking 等循環動作，檢查首尾接縫與長時間重複。
- `one-shot`：招手、跳舞、成功或失敗回饋，不因首尾不可銜接而扣分。
- `pose`：短暫或靜態姿勢，重點是骨架、位移與穩定性。

動作包可用薄的 `action-pack.json` 描述名稱、用途、狀態槽與檔案參照；它不能繞過既有匯入驗證、授權 gate 或 app-controlled 資產路徑。

## 浮動對話氣泡

角色旁可顯示漫畫式短句，例如 `完成！`、`正在看…`、`(๑•̀ㅂ•́)و✧` 或單一 Emoji。第一版契約：

- 優先在既有透明 avatar `BrowserWindow` 內用 DOM overlay 呈現，預留氣泡區域並沿角色頭部定位；不為純顯示新增第二個 privileged 視窗。
- 純文字，支援 Unicode、Emoji 與顏文字；不解析 HTML、Markdown、圖片或連結。
- 預設最多 80 個 Unicode grapheme，可設定 1–15 秒 TTL；到期淡出。
- 氣泡跟隨角色，在螢幕邊緣自動換邊並保持可見；不可阻擋角色拖曳或點穿透明區。
- 同時只顯示一則；新訊息依來源優先序取代或排入小型有界佇列，重複內容可合併。
- 內容只在記憶體與本機視窗呈現，不寫入歷史或 debug log、不讀取聊天紀錄、不上傳。
- 字級、對比、動畫與 reduced-motion 行為必須可讀；空字串、控制字元與過長輸入要拒絕或正規化。

建議新增有界 MCP 工具 `show_message`，讓已建立本機 MCP session 的 AI 把短訊息送到角色氣泡。參數只包含 `text`、可選 `duration_ms` 與 `mood`；`mood` 限定為 `neutral`／`cheerful`／`thinking`／`warning`，只能映射到既定樣式，不能執行任意 CSS、腳本、檔案或未定義狀態。

- Settings 提供「允許已連接 AI 顯示訊息」，預設關閉；啟用時須提示本機 MCP 無身分驗證，同帳號行程都可能連線。
- 若顯示 `clientInfo`，必須標成「未驗證的 client-provided 名稱」；也可一律顯示「本機 AI」，不得把它當成可信身分。
- 同時套用每個 session 與跨 session 的全域頻率限制、全域有界佇列；斷線時清除該 session 尚未顯示的訊息。
- `get_status` 只回報功能是否允許與目前是否有氣泡，不回傳訊息內容或歷史。
- 系統狀態可顯示內建短語，但預設不代替 agent 發言；VoxAvatar 仍不是聊天紀錄或訊息收件匣。

## 驗證

- 狀態仲裁、TTL、佇列、Unicode 長度與輸入拒絕採純邏輯測試。
- 動作品質使用合成 fixture 與用途別門檻；真實素材只記授權清楚的人工結果。
- 氣泡位置、DPI、長字串、Emoji 字型、點穿與 reduced motion 以 Windows 實機 smoke 驗證。
- 口型在不同模型、角色尺寸與 DPI 下以錄影或逐項觀察記錄可讀性；不宣稱音素同步。
- 修正以最小範圍進行；不得因單一素材問題改寫整套 renderer 或降低安全 gate。

## 明確排除

- 不從畫面、聊天程式或音訊推測文字、情緒或工作狀態。
- 不要求每個角色具備所有狀態動作；缺少素材時必須可安全降級。
- 不把某套 sprite atlas、固定 frame 數或第三方寵物素材格式變成 VRM／VRMA 契約。
- 不散布無再配布權的角色、動作、字型或圖像資產。
