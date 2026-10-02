# Windows smoke evidence — v1.0.7

> `smokeExecuted=false`；本輪只驗證正式 runner 資產、`NotSigned` 與自動化 gate，未執行桌面生命週期驗收。

## Release

- version: `1.0.7`
- tag／Latest／唯一 Release: `v1.0.7`
- commit: `86f9ef8c67c21c9fa5e332843d76da877e9162f0`
- release URL: https://github.com/SanHsien/voxavatar/releases/tag/v1.0.7
- Actions: https://github.com/SanHsien/voxavatar/actions/runs/36738174882
- has installer cut: `true`

## Assets / signing

- installer: `VoxAvatar-1.0.7-windows-x64-setup.exe`
- size bytes: `190029919`
- sha256: `830d577ed34aa803887c3f8f21d18a81610bf751ad8c4b94b84b7ded86c7e82a`
- unsigned: `true`
- authenticode: `NotSigned`
- checksum: GitHub digest、`SHA256SUMS.txt`、本機 SHA-256 三方一致
- certificate table: empty（`pe-certificate-table-empty`）

## Environment

- 執行者／日期：Codex primary session，2026-10-02（僅發行資料與安裝包完整性核對）
- 桌面類型：不適用；本輪未執行桌面 smoke，因此無實體機／VM／遠端桌面分類
- Windows edition / version / build: **未記錄**（未執行桌面 smoke）
- architecture: x64
- display scaling / GPU: **未驗**

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — 精確 tag SHA 的 Release workflow 完成授權資產、Node 24 check、依賴稽核、Windows native build／self-test、NSIS 打包與發布；`main` CI、CodeQL 也通過。
- [ ] **安裝** (`install`): 未驗 — 本輪未執行正式 installer 的全新桌面安裝。
- [ ] **升級** (`upgrade`): 未驗 — 本輪未執行舊版→1.0.7 的桌面升級。
- [ ] **移除** (`uninstall`): 未驗 — 本輪未執行桌面移除。
- [ ] **系統匣** (`tray`): 未驗 — 本輪未實測系統匣左右鍵。
- [ ] **DPI／縮放** (`dpi_scaling`): 未驗 — 本輪未實測 100%／150%／225% 桌面縮放。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 設定契約可自動測；多 DPI 實機可讀性未驗。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 本輪未實測真實 WASAPI／系統匣 MCP。
- [x] **簽署標示（NotSigned）** (`signing_label`): pass — 三方 checksum 一致、Authenticode 為 `NotSigned`，PE Certificate Table 為空；不代表 SmartScreen 通過。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無 WIN_CSC_* 密鑰；需人工桌面觀察。

## Notes

- v1.0.7 發布成功後，已刪除 v1.0.6 Release／遠端 tag；本機舊 tag 也清除，僅保留 v1.0.7。舊版證據仍作歷史紀錄。
- 1.0.5 的部分桌面驗收不能代替 1.0.7 的桌面驗收。

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
