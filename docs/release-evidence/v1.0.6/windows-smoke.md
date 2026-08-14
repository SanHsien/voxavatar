# Windows smoke evidence — v1.0.6

> `smokeExecuted=false`，因本輪沒有 Windows 桌面，完整 lifecycle matrix 未重跑。本檔只記錄正式 runner 資產完整性與 `NotSigned` 機器證據。

## Release

- version: `1.0.6`
- tag／Latest／唯一 Release：`v1.0.6`
- commit: `448e505e2ce7d436660c339ddb4b5b908f471bbe`
- Release: <https://github.com/SanHsien/voxavatar/releases/tag/v1.0.6>
- Actions: <https://github.com/SanHsien/voxavatar/actions/runs/31809770616>

## Formal installer

- filename: `VoxAvatar-1.0.6-windows-x64-setup.exe`
- size: `177145660` bytes
- sha256: `ad65ec5be450fe98f02beb880c511a2a7c7bee2d14c01c2ab309b1993587faf7`
- checksum: GitHub digest、`SHA256SUMS.txt`、本機 SHA-256 三路一致
- unsigned: `true`
- authenticode: `NotSigned`（empty PE Certificate Table）

## Environment

- Windows edition / version / build: **未驗**（無桌面）
- architecture: x64
- display scaling / GPU: **未驗**

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — Release workflow 在精確 tag SHA 完成授權資產 gate、Node 24 check、完整 dependency audit、Windows native build／self-test、NSIS 打包與發布。
- [ ] **安裝** (`install`): 未驗 — 本輪無 Windows 桌面；未執行 1.0.6 正式 installer 全新安裝。
- [ ] **升級** (`upgrade`): 未驗 — 未驗證 1.0.5→1.0.6 保留資料升級。
- [ ] **移除** (`uninstall`): 未驗 — 未執行 1.0.6 移除。
- [ ] **系統匣** (`tray`): 未驗 — 系統匣左右鍵未實測。
- [ ] **DPI／縮放** (`dpi_scaling`): 未驗 — 本輪未重跑 DPI 矩陣。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 本輪未操作 30% 尺寸。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 本輪未重跑真實 WASAPI／系統匣 MCP。
- [x] **簽署標示（NotSigned）** (`signing_label`): pass — 三路 checksum 一致，PE Certificate Table 為空。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無簽署密鑰，不宣稱 SmartScreen 或具名 publisher。

## Findings

- 產品變更是可設定的非說話待機池（schema 12）；打包媒體仍為 4 個授權 VRM／13 個 CC0 VRMA。
- `v1.0.6` 成功後刪除 `v1.0.5` Release／tag；遠端與本機只保留最新版。先前 1.0.5 乾淨安裝／MCP 部分驗證仍見 [`../v1.0.5/`](../v1.0.5/)，不得當成仍可下載的安裝包。

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
