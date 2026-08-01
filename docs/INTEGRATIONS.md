# VoxAvatar 整合

所有整合預設只監聽 `127.0.0.1:47831`。不要以 port forwarding、reverse proxy 或防火牆規則把端點暴露到其他電腦。

## MCP

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
| `get_status` | 無 | 回傳視窗、模型、語音狀態與 listener 狀態 |

建議先呼叫 `list_animations`，再把回傳的小寫連字號名稱傳給 `play_animation`。設定頁新增或移除動作後，現有 MCP session 會更新工具描述。

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
