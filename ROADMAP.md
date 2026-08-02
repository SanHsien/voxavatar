# VoxAvatar 產品路線圖

繁體中文 · [English](ROADMAP.en.md)

更新日期：2026-08-02
規劃基準：`v0.12.1`（`main` 累積；Latest Release：`v0.5.0`）

VoxAvatar 的定位是 **Windows 上本機優先、可由 AI agent 控制且安全邊界清楚的桌面角色呈現層**。版本表示依賴順序，不是日期承諾；已完成內容見 [`CHANGELOG.md`](CHANGELOG.md)，目前健康狀態見 [`REVIEW.md`](REVIEW.md)。

## 原則

1. 隱私、安全、授權與發行正確性優先。
2. 角色反應要可理解、可降級，不靠推測聊天或情緒。
3. 純邏輯與契約盡量自動測試；Windows 桌面、WASAPI、DPI、系統匣與 installer 留實機證據。
4. 一般開發不要求 Visual Studio Build Tools；原生與 installer 以 GitHub Windows runner 為正式 gate。
5. 不以內建角色、動作或 agent 數量競賽；不擴張成聊天客戶端。

## 已完成摘要

| 系列 | 代表成果 |
| --- | --- |
| v0.1.x | stable Windows 基線、授權、CI 與 Release 信任根 |
| v0.2.x | 語音來源、IPC／preload、readiness、診斷、MCP session 與動作佇列 |
| v0.3.x | 素材匯入確認、migration fixtures、片段排序與品質報告 |
| v0.4.x | MCP 結構化 schema、整合文件與多 client 測試 |
| v0.5.x | 錯誤復原、設定模組拆分、bundle／SBOM／release-evidence 工具 |
| v0.6.x | Settings／IPC／asset validation 收斂與 renderer 錯誤測試 |
| v0.7.x | bundle／startup 基準、非首屏 lazy-load 與設定頁再拆 |
| v0.8.x | VRM／VRMA 合成相容矩陣、Exporter 備註與匯入 rollback |

v0.6–v0.8 已完成項不再逐條留在路線圖；尚未完成的工作已全部移入 v0.9。

## v0.9.x：角色表現、收斂與 Windows 驗收

### 角色表現

完整契約見 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

- [x] 為 VRMA 加入 `loop`／`one-shot`／`pose` 用途，品質 gate 依用途評估，不再用循環接縫淘汰一次性動作。
- [x] 加入 `idle`／`listening`／`speaking`／`working`／`reviewing`／`success`／`failed` 狀態、固定優先序、TTL、來源清除與安全 fallback（純邏輯＋App 語音路徑＋狀態槽名稱解析＋外部事件正規化；系統動作槽 UI／MCP 狀態工具仍待）。
- [x] 強化小尺寸角色的口型可讀性：可調強度、最小開口、依縮放推估頭部增益（精確 head 投影與 DPI 實機仍待）。
- [x] 加入跟隨角色的漫畫式對話氣泡：短句、Emoji、顏文字、TTL、reduced motion 與有界佇列（DOM overlay＋清理／佇列；邊緣避讓純邏輯已接 CharacterBubble；精確 head 投影仍可再強化）。
- [x] 讓已連接的本機 AI 透過 MCP `show_message` 顯示短訊息；功能預設關閉，啟用後仍有速率限制與輸入清理，不保存訊息歷史。
- [x] 評估薄的 `action-pack.json`，只描述動作用途與狀態對應，不繞過匯入、路徑或授權 gate（契約＋驗證＋範例；實際匯入管線仍走既有 Settings gate）。

### 從 v0.6–v0.8 移入的未完成工作

- [x] 抽離 `main` overlay lifecycle（`overlay-lifecycle.cjs`）與 `settings-store` catalog CRUD（`settings-store-catalog.cjs`）。
- 補 App／Settings jsdom 整合測試。
- 建立 Idle 長跑、切換模型與記憶體的可重複 Windows 基準。
- 取得授權清楚的真實 VRoid／UniVRM／Blender 樣本，補 exporter 人工結果；二進位不入庫。

### Windows 與發行驗收

- 為候選 Release 留存版本化 Windows smoke 證據：安裝、升級、移除、protocol、系統匣、MCP、DPI 與鍵盤。
- 完成 installer 簽署、publisher、SmartScreen 與升級路徑驗證。
- 為 native helper 建立可測試的 COM／WASAPI 錯誤型別或退出碼，並驗證播放、裝置切換與 recovery。
- 補 protocol／tray／桌面流程的實機 smoke；無桌面或密鑰時只標記未驗，不虛構完成。

### 完成條件

- 狀態仲裁、動作用途、口型增益、氣泡輸入／TTL／佇列與 MCP opt-in gate 有自動測試；30% 角色尺寸與不同 DPI 的 Windows UI 行為有實機證據。
- v0.6–v0.8 移入項目完成，或有明確理由移出 1.0 範圍。
- 至少一版正式資產有 SHA-256、Windows smoke 與簽章狀態紀錄。
- `npm run check`、CI、CodeQL 與 production audit 無未處理高風險項。

## v1.0.0 門檻

- 沒有已知 P0／P1，主動操作都有成功或失敗回饋。
- Windows 10／11 的安裝、升級、移除、首次設定、語音、素材、角色表現與 MCP 有實機證據。
- Installer 已簽署並驗證 publisher、SmartScreen 與更新路徑；未簽署不得進 1.0。
- settings、catalog 與 MCP schema 有版本政策和 migration 測試。
- 常見 exporter 有可公開驗證的相容結果，匯入失敗不造成資料遺失。
- 隱私、loopback-only、媒體授權、Windows-only 與上游 attribution 邊界保持可驗證。

## 明確不做

- 麥克風擷取、錄音、轉錄、音訊保存或上傳。
- 將 MCP／HTTP bridge 開到 LAN／Internet，或加入任意命令／檔案存取。
- 從聊天畫面、音訊或其他應用推測文字、情緒或工作狀態。
- 散布未確認授權的 VRM／VRMA，或恢復 Linux／macOS 發行。
- 在 VoxAvatar 內執行 LLM、保存聊天歷史或取代聊天客戶端。

## 接下來三件事

1. [x] 實作動作用途 profile，讓品質分析先理解 `loop`／`one-shot`／`pose`。
2. [x] 實作角色狀態仲裁、氣泡 DOM 與 MCP `show_message` opt-in。
3. [x] 落地 `action-pack.json` 契約、overlay lifecycle 與氣泡邊緣避讓。

近期焦點：系統狀態槽 UI／MCP 狀態工具接線、jsdom 整合；有 Windows／密鑰時再補實機與簽署。
