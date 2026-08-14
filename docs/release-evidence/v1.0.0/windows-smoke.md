# Windows smoke evidence — v1.0.0

> `smokeExecuted=true` for the local 1.0.0 candidate. Formal GitHub runner assets and workflows are verified; executing the downloaded formal installer and the remaining lifecycle matrix stay explicitly pending. This record does not treat partial rows as complete.

## Release

- version: `1.0.0`
- tag: `v1.0.0`
- commit: `2482b602d04c2304a5db634681646a3e635a7eb7`
- release URL: <https://github.com/SanHsien/voxavatar/releases/tag/v1.0.0>
- Release workflow: <https://github.com/SanHsien/voxavatar/actions/runs/31779768128>
- CI: <https://github.com/SanHsien/voxavatar/actions/runs/31779768143>
- CodeQL: <https://github.com/SanHsien/voxavatar/actions/runs/31779768136>
- has installer cut: `true`

## Formal runner asset / signing

- installer: `VoxAvatar-1.0.0-windows-x64-setup.exe`
- size bytes: `105138682`
- sha256: `d9fcd68ce0862891a809f59b7faa506608e5698ad34a3b32c1e5eef51498fa29`
- unsigned: `true`
- authenticode: `NotSigned`（GitHub digest、`SHA256SUMS.txt`、本機 SHA-256 三路一致；PowerShell `Get-AuthenticodeSignature` + empty PE Certificate Table）
- desktop execution: **待使用者允許**；目前桌面 smoke 與升級使用同 commit 的本機候選（`105138679` bytes，SHA-256 `5b8758b15f82d85a0e6af51539ff3160454992a36479b01a20c9c605b1e64acb`）

## Environment

- Windows edition / version / build: Windows 11 Pro, 10.0.26200, build 26200
- architecture: x64
- display scaling / GPU: 225%（216 DPI）／NVIDIA GeForce RTX 3060, driver 32.0.16.1088
- runtime used for automated gates: Node.js 24.19.0

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — 本機 Node 24 lint、298 Node tests、151 renderer tests、production build、assets release gate、native self-test／Usage=2／typed errors 10–13 與 NSIS 候選打包通過；GitHub CI、CodeQL、Windows 打包與 Release workflow 全綠。
- [ ] **安裝** (`install`): 部分 — 本機 NSIS 候選在既有「所有使用者」／Program Files 安裝上完成同版本重裝；安裝後 ProductVersion `1.0.0.0`／FileVersion `1.0.0`，程式自動啟動且 bridge 只綁 `127.0.0.1`。全新安裝、自訂位置、捷徑與一般使用者免管理員矩陣仍未驗。
- [x] **升級** (`upgrade`): pass — 由已安裝 `0.16.23` 覆蓋升級到 `1.0.0`；原有 12 個自訂模型、10 個自訂動作、預設模型、語音自動模式與 MCP 設定均保留，readiness 完整。
- [ ] **移除** (`uninstall`): 未驗 — 本輪不先刪除既有安裝或使用者資料。
- [ ] **系統匣** (`tray`): 未驗 — menu 結構有自動測試；本輪未操作系統匣左右鍵。
- [ ] **DPI／縮放** (`dpi_scaling`): 部分 — 225% 的設定五區、預覽與 About 無阻擋操作的裁切；100%／150% 未驗。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 225%／50% 可讀；30% 控制未取得實機結果。
- [x] **語音與 MCP** (`voice_mcp`): pass — 自動來源在繁中 PowerShell 5.1 程序列舉後為 `no_output`（非 `launch_failed`）；opt-in 系統輸出播放本機 TTS 時為 `voice_activity=speaking`、`listener_state=listening`。MCP 6 工具、Idle／Speaking 播放、狀態、氣泡與 hide/show 均成功；氣泡在 overlay 實際可見。
- [x] **Bridge 安全邊界** (`bridge_security`): pass — `/health` 回 `ok:true`；port 47831 只監聽 `127.0.0.1`；非 loopback Host、未允許 MCP Origin、錯誤 Content-Type、壞 JSON、過大 body 與錯誤 event schema 分別被 403／403／415／400／413／422 拒絕。
- [x] **簽署標示（NotSigned）** (`signing_label`): pass — 本機候選與正式 runner 資產均由 PowerShell 與 PE Certificate Table 兩路確認 `NotSigned`；1.0.0 About 亦顯示未簽署。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無 `WIN_CSC_*` 密鑰；無法宣稱通過 SmartScreen 或具名 publisher。

## Findings and fixes

- 實機發現繁中 Windows PowerShell 5.1 以 ANSI／Big5 輸出 CIM JSON，Node 以 UTF-8 解碼後可能把 Big5 尾位元組 `0x5C` 變成非法 escape，導致 listener `launch_failed`。1.0.0 明確設定無 BOM UTF-8，契約測與相同機器回歸均通過。
- 品質門檻同為 75 時，舊 UI 顯示不存在的 `75–75` 觀察區間；1.0.0 改為「未設觀察區間」，繁中／英文 renderer 測試與實際設定頁均確認。

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
