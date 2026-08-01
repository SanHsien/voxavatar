# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致。

## 0.1.0 - 2026-08-01

- **第一個 stable release**：Windows overlay、WASAPI 語音輸出口型、本機 VRM／VRMA 管理、MCP／HTTP／URL protocol 與中英設定介面進入穩定基線。
- 整合本 fork 的獨有功能：透明區點穿、可靠系統匣、目錄批次匯入、VRMA 品質報告、一鍵清除、自訂動作與常用動作預設。
- 專案維護基線包含完整中英文件、行為準則、Markdown／資產閘門、CI、CodeQL、Dependabot guarded auto-merge、Windows NSIS 與 SHA-256 Release 驗證。
- 穩定版不代表凍結未來設定或 MCP schema；不相容變更仍會依 SemVer 提升 minor／major 並記錄遷移方式。

## 0.1.0-beta.10 - 2026-08-01

- 修正 guarded Dependabot workflow 未指定 `GH_REPO`，導致空佇列在非 checkout job 中誤判失敗。

## 0.1.0-beta.9 - 2026-08-01

- 重整中英 README、貢獻、安全、行為準則與維護文件，建立清楚的使用者／開發者／整合／發行資訊分工。
- 新增 Markdown 連結、控制字元、檔尾與舊 MCP 名稱檢查，納入 `npm run check`。
- 新增 EditorConfig、issue／PR templates、Dependabot、CodeQL 與 fail-closed guarded auto-merge policy。

## 0.1.0-beta.8 - 2026-08-01

- 設定頁新增常用動作預設，可預覽、套用到表單或直接建立 MCP 可見動作。
- README 補齊目錄匯入、品質把關、一鍵刪除、自訂動作與 `voxavatar` MCP 名稱。

## 0.1.0-beta.7 - 2026-08-01

- 新增一鍵刪除全部使用者 VRM／VRMA；刪除前確認，清除片段時保留動作槽。

## 0.1.0-beta.6 - 2026-08-01

- 清除產品程式碼、設定鍵、樣式、測試與範例中的舊 `persona` 識別；保留上游 attribution。

## 0.1.0-beta.5 - 2026-08-01

- 新增 VRM／VRMA 目錄遞迴匯入、VRMA 品質模式、Markdown 報告與自訂報告位置。
- Codex MCP 註冊名稱改為 `voxavatar`。

## 0.1.0-beta.4 - 2026-08-01

- 移除僵硬的預設 Idle VRMA；安裝包不再內建 Idle／Speaking 動作媒體。

## 0.1.0-beta.3 - 2026-08-01

- VRM 名稱改為選填，空白時使用檔名；修正選檔視窗被置頂角色遮擋。
- 設定介面與桌面選單支援繁中／英文。

## 0.1.0-beta.2 - 2026-08-01

- 移除安裝包內建角色；首次啟動改為顯示合法下載與本機匯入指引。
- beta tag 發布為可見 Latest GitHub Release。

## 0.1.0-beta.1 - 2026-08-01

- 新增透明區點穿、角色拖曳、滾輪縮放、中鍵旋轉、右鍵選單與可靠系統匣操作。
- 新增多段待機動作輪播與介面語系設定。

## 0.1.0-beta.0 - 2026-08-01

- 從 `xikhar/persona` 建立 Windows-only VoxAvatar fork。
- 提供 WASAPI process loopback、VRM renderer、設定頁、本機 MCP 與 HTTP bridge。
- 建立繁中預設／英文對照文件與 Windows Release 流程。
