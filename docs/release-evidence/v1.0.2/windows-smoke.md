# Windows smoke evidence — v1.0.2

> `smokeExecuted=false` because the full Windows lifecycle matrix remains incomplete. The formal GitHub runner asset completed a desktop `1.0.0`→`1.0.2` upgrade; partial and unverified rows remain explicit below.

## Release

- version: `1.0.2`
- tag: `v1.0.2`
- commit: `1d40dd8f96cfd24269cd248dcb8f6e9222a5fbe9`
- Release: <https://github.com/SanHsien/voxavatar/releases/tag/v1.0.2>
- Actions: <https://github.com/SanHsien/voxavatar/actions/runs/31782426134>
- trigger: `workflow_dispatch`（tag 已先推至 main tip；OAuth push 未建立 Actions run，依正式 fallback 手動 dispatch）
- Latest／唯一 Release／唯一 tag: pass

## Formal installer

- filename: `VoxAvatar-1.0.2-windows-x64-setup.exe`
- size: `105138671` bytes
- sha256: `76a74e5584d482a2618e36c3a1da46b0a5f1874d6bc78c2862f8ce0d4db995b4`
- checksum: GitHub digest、`SHA256SUMS.txt`、本機 SHA-256 三路一致
- unsigned: `true`
- authenticode: `NotSigned`（PowerShell `Get-AuthenticodeSignature` + empty PE Certificate Table）
- desktop execution: pass — 在既有 all-users／Program Files 安裝上完成 `1.0.0`→`1.0.2` 升級並自動啟動

## Environment

- OS: Windows 11 Pro `10.0.26200` build `26200`
- architecture: x64
- display scaling: 225%
- GPU: NVIDIA GeForce RTX 3060 (`32.0.16.1088`)
- installed executable: ProductVersion `1.0.2.0`／FileVersion `1.0.2`

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — 本機 Node 24 `npm run check`、299 Node tests、151 renderer tests、production audit/build、assets release gate、native self-test／Usage=2／typed errors 10–13 通過；Release workflow 重跑 Node 24 check、Windows native build、NSIS 與 immutable tag 重驗後成功發布。
- [ ] **安裝** (`install`): 部分 — 正式 GitHub installer 在既有 all-users／Program Files 安裝上完成升級、自動啟動與版本確認；全新安裝、自訂位置、捷徑與一般使用者免管理員矩陣仍未驗。
- [x] **升級** (`upgrade`): pass — `1.0.0`→`1.0.2`；12 個模型、10 個動作、預設模型、訊息氣泡設定與 MCP 動作保留。
- [ ] **移除** (`uninstall`): 未驗 — 本輪不刪除既有安裝或使用者資料。
- [ ] **系統匣** (`tray`): 未驗 — menu 結構有自動測試；本輪未操作系統匣左右鍵。
- [ ] **DPI／縮放** (`dpi_scaling`): 部分 — 225% DPI 的設定、MCP 卡片與即時預覽可讀；100%／150% 未驗。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 225%／50% 可讀；30% 尚無可靠實機證據。
- [x] **語音與 MCP** (`voice_mcp`): pass — 正式 1.0.2 Settings 顯示「線上／就緒」、6 個工具、2 個可播放動作；`get_status` 回報 readiness complete、listener `no_output`，`list_animations` 回傳 `idle`／`speaking`；bridge 僅監聽 `127.0.0.1:47831`，`/health` 為 `ok=true`。
- [x] **簽署標示（NotSigned）** (`signing_label`): pass — GitHub digest／checksum／本機雜湊一致；PowerShell 與 PE Certificate Table 雙軌確認未簽署。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無簽署密鑰；不宣稱 SmartScreen 或具名 publisher。

## Findings

- v1.0.0 正式重裝曾發現 Settings MCP 卡片永久顯示「啟動中」；v1.0.2 以 handler 呼叫當下的 live runtime state 修正。正式 runner installer 實跑已確認卡片顯示「線上／就緒」，不是只靠單元測試推論。
- 正式升級後模型／動作數量、預設模型、訊息氣泡 opt-in、MCP readiness 與兩個可播放動作均保留；沒有讀取或記錄對話內容、音訊或私人媒體。
- 公開資產維持 `NotSigned`；這是已標示的發行狀態，不代表 SmartScreen 通過。

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
