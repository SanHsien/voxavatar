# action-pack.json 契約

薄的動作包描述檔，只承載**名稱、用途、狀態槽與相對檔名**。它不是安裝格式，也不能繞過 Settings 匯入、GLB 驗證、授權 gate 或 `voxavatar-asset:` 路徑控制。

## 位置與範例

- 機讀驗證：[`electron/action-pack.cjs`](../electron/action-pack.cjs)
- 範例：[`electron/fixtures/action-pack/example.action-pack.json`](../electron/fixtures/action-pack/example.action-pack.json)

## Schema（version 1）

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

## 明確不做

- 不內嵌或下載二進位媒體。
- 不提供絕對路徑、URL、或 app data 外路徑。
- 不取代 catalog／settings schema；實際安裝仍走既有匯入流程。
- 不因 action-pack 自動啟用 MCP 擴權。

狀態槽解析見 `src/character-state-slots.ts`；行為契約見 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
