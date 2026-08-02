# VoxAvatar 整合

所有整合預設只監聽 `127.0.0.1:47831`。不要以 port forwarding、reverse proxy 或防火牆規則把端點暴露到其他電腦。

## MCP：目前已提供

保持 VoxAvatar 桌面程式開啟，再註冊相容 MCP 用戶端。Codex：

```powershell
codex mcp add voxavatar --url http://127.0.0.1:47831/mcp
```

重新啟動用戶端或建立新 session 後可用：

| 工具 | 輸入 | 行為 |
| --- | --- | --- |
| `list_animations` | 無 | 列出目前可播放動作、描述與觸發情境 |
| `play_animation` | `animation`: 動作名稱 | 顯示角色並隨機播放該動作的一個片段 |
| `control_window` | `action`: `show`／`hide`／`toggle` | 控制角色視窗；hide 不會結束程式 |
| `get_status` | 無 | 回傳視窗、模型、語音狀態、listener（含 `state`）、版本化 `readiness`，以及 `mcp_show_message_enabled`／`message_visible`（不含訊息文字） |
| `show_message` | `text`；可選 `duration_ms`／`mood` | 在角色旁顯示短句氣泡（Settings 預設關閉；需 opt-in） |

### Agent 應如何使用

MCP 用戶端會讀取工具 schema 與每個自訂動作的描述／觸發情境；使用者不需要手動指定工具名稱。建議 agent 流程：

1. 初次連線或失敗後先呼叫 `get_status`，依 `readiness.next_step` 說明缺少模型、語音來源或可選動作。
2. 要做角色反應時先呼叫 `list_animations`，不要猜動作名稱。
3. 依 `animation_trigger_scenario` 選最符合情境的動作，再呼叫 `play_animation`；同一回覆不要高頻重播。
4. 只有使用者要求或角色被隱藏時才用 `control_window`；不要用反覆 toggle 代替讀取狀態。
5. 短訊息先確認 Settings 已啟用 AI 訊息，再呼叫 `show_message`；以回傳 `displayed` 判定是否呈現。
6. 工具失敗時讀結構化 `error`，提供可操作的修復方式，不宣稱已播放或已顯示。

使用者可直接說：「檢查 VoxAvatar 是否就緒」、「列出適合打招呼的動作」、「播放 `wave-hello`」、「隱藏角色」或（啟用後）「在角色旁顯示：完成！」。`play_animation` 只控制身體動作；口型由播放音量驅動，MCP 不會合成語音。

### AI 短訊息與浮動氣泡

`show_message` 讓已連線的本機 AI 把短句、Emoji 或顏文字顯示在角色旁。工具 description 要求：只用於使用者要求的短訊息或重要階段回饋，不傳長文、秘密、Markdown、連結或逐 token 串流。

輸入範例：

```json
{
  "text": "完成！ (๑•̀ㅂ•́)و✧",
  "duration_ms": 5000,
  "mood": "cheerful"
}
```

- `text`：必填純文字，最多 80 個 Unicode grapheme（清理後）。
- `duration_ms`：選填，1000–15000；省略時預設約 4 秒。
- `mood`：選填，`neutral`／`cheerful`／`thinking`／`warning`；只選既定樣式。

成功結果含 `schema_version`、`displayed`、`message_id`、`expires_at`。錯誤碼：`agent_messages_disabled`、`invalid_message`、`rate_limited`、`avatar_unavailable`。

安全與生命週期：Settings「允許已連接 AI 顯示訊息」預設關閉；每 session 與全域有速率限制；斷線清除該來源；訊息不進設定、歷史、診斷或完整 debug 內容 log。UI／狀態規則見 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。

### Status／工具輸出 schema

所有 MCP 工具結果皆以 **JSON 文字** 回傳（`content[0].text` 為 `JSON.stringify` 結果）。請解析結構化欄位，並保留 `message` 供人類閱讀。

| 常數 | 目前值 | 用途 |
| --- | --- | --- |
| `status_schema_version` | `1` | `get_status` 與設定頁 MCP 狀態區塊的外層 envelope |
| `tools_schema_version` | `1` | `list_animations`、`play_animation`、`control_window` 的 envelope |
| `readiness.schema_version` | `1` | `get_status.readiness` 內嵌步驟語彙（`electron/app-readiness.cjs`） |

#### `get_status` 主要欄位

- `status_schema_version`、`message`
- `modelConfigured`、`windowVisible`、`voiceState`、`listener`
- `readiness`：`complete`、`steps`、`next_step`、`listener_state`、`playable_actions` 等

#### 其他工具主要欄位

| 工具 | 結構化欄位 |
| --- | --- |
| `list_animations` | `schema_version`、`message`、`count`、`animations[]`（`animation_name`、`animation_description`、`animation_trigger_scenario`） |
| `play_animation` | `schema_version`、`message`、`animation`、`played`；失敗時另有 `error`（`animation_not_playable` 或 `model_or_clips_missing`） |
| `control_window` | `schema_version`、`message`、`action`、`visible` |

#### SemVer 相容政策

- **同 MAJOR**（例如仍為 `1`）：可新增 optional 欄位；Agent 應忽略未知欄位。
- **升 MAJOR**：移除欄位、改名或改變語意時必須 bump `status_schema_version` 或 `tools_schema_version`，並在 CHANGELOG 說明。
- `readiness.schema_version` 獨立演進；變更時一併檢查 `get_status` 文件與整合測試。
- Agent 應優先讀 `readiness.steps`、`listener.state`／`readiness.listener_state` 與工具 JSON 欄位，不要只解析 `message` 字串。

`list_animations`／`play_animation` 以目前設定 catalog 為準；設定變更後既有 MCP session 會收到 `tools/list_changed` 並更新 `play_animation` 描述。高頻 `play_animation` 經有界佇列合併同名請求，避免 renderer 被淹沒。

建議先呼叫 `list_animations`，再把回傳的小寫連字號名稱傳給 `play_animation`。

### Streamable HTTP 用戶端 sketch

VoxAvatar bridge 使用 MCP **Streamable HTTP**（非 stdio）。端點：`POST http://127.0.0.1:<port>/mcp`，初始化後後續請求需帶 `Mcp-Session-Id` header。

Node.js（`@modelcontextprotocol/sdk`）最小流程：

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client({ name: "my-agent", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(
  new URL("http://127.0.0.1:47831/mcp"),
);
await client.connect(transport);

const listed = await client.callTool({ name: "list_animations", arguments: {} });
const catalog = JSON.parse(listed.content[0].text);

const status = await client.callTool({ name: "get_status", arguments: {} });
const snapshot = JSON.parse(status.content[0].text);
```

設定頁「整合 → MCP」會顯示 `server_url`、`setup_command` 與 `status_schema_version`／`tools_schema_version`。

### 多個 MCP 用戶端

- 同一 bridge 可同時承載多個 MCP session（預設上限 32）；各 session 獨立，共用同一 catalog 與 app 狀態。
- 設定變更觸發 `notifyToolsChanged` 時，**所有** active session 都會收到工具列表更新。
- Session 閒置超過 30 分鐘會被回收；超過上限時最舊 session 會被關閉。
- VoxAvatar 結束或 MCP handler 關閉後，舊 `Mcp-Session-Id` 無效；請建立新 session，勿重複使用舊 ID。

### 重新註冊與重連

| 情境 | 建議做法 |
| --- | --- |
| VoxAvatar 重啟 | 重新 `codex mcp add` 或更新用戶端 URL；舊 session 必須重新 `initialize` |
| 變更 `VOXAVATAR_BRIDGE_PORT` | 以新 port 更新環境變數、重啟 VoxAvatar，並用設定頁顯示的 `server_url` **重新註冊** MCP |
| `get_status` 回 `mcp_unavailable` | 確認桌面程式已啟動；查 `/health` 與設定頁 MCP 狀態 |
| `play_animation` 回 `model_or_clips_missing` | 匯入 VRM 並至少設定一個可播放 clip |
| `play_animation` 回 `animation_not_playable` | 先 `list_animations` 取得最新 catalog |
| 404 `MCP session not found` | Session 已過期或被關閉；重新 connect／initialize |
| 工具 JSON 解析失敗 | 確認 VoxAvatar 版本與 `tools_schema_version`／`status_schema_version` 是否仍為 MAJOR `1` |

MCP 只控制視覺狀態，不會合成或播放語音。

## 健康狀態

```powershell
Invoke-RestMethod http://127.0.0.1:47831/health
```

成功時回傳 JSON，其中 `ok` 為 `true`。這只能證明 bridge 可連線，不代表已匯入模型、動作或選好語音來源；完整狀態請用 MCP `get_status`。

## HTTP 事件 API

`POST http://127.0.0.1:47831/events` 接受 VoxAvatar 定義的狀態、音量或動畫事件。請使用 `Content-Type: application/json`；bridge 會拒絕非 loopback Host、未允許來源、過大 body 與不合法 schema。

若是一般 agent 整合，優先使用 MCP；HTTP API 適合已在本機產生明確狀態事件的 adapter，不是任意命令端點。

## URL protocol

支援：

```text
voxavatar://show
voxavatar://hide
voxavatar://toggle
voxavatar://listening
voxavatar://thinking
voxavatar://speaking?level=0.8
voxavatar://inactive
voxavatar://animation?name=wave-hello
```

PowerShell／Windows：

```powershell
Start-Process 'voxavatar://show'
```

`animation` 名稱必須已在本機設定且符合小寫字母、數字與單一連字號格式。

## 自動語音輸出監聽

Windows helper 使用 WASAPI application loopback，只計算目標應用程式播放輸出的正規化音量。設定方式：

1. VoxAvatar「設定 → 語音」選擇自動、特定應用程式、外部或進階 pattern。
2. 或在啟動前設定 `VOXAVATAR_TARGET_PROCESS_PATTERN`；環境變數會覆寫介面選擇。
3. 不同 port 可用 `VOXAVATAR_BRIDGE_PORT` 覆寫，之後要用畫面顯示的新 URL 重新註冊 MCP。

VoxAvatar 不監聽麥克風，不保存或傳送音訊樣本。
