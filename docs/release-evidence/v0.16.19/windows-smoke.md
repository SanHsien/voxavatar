# Windows smoke evidence — (no GitHub tag)

> 自動產生的誠實骨架。`smokeExecuted=false`；未取得桌面證據前不得改為 true 或勾選通過。

## Release

- version: `0.16.19`
- tag: `(no GitHub tag)`
- commit: `3cbee4808301dcd64347a3b6e878b98bbc609ac4`
- release URL: null
- has installer cut: `false`

## Assets / signing

- installer: `null`
- size bytes: `null`
- sha256: `null`
- unsigned: `true`
- authenticode: `NotSigned`

## Environment

- Windows edition / version / build: **未驗**（無桌面）
- architecture: x64
- display scaling / GPU: **未驗**

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — GitHub Actions CI 綠燈（僅自動化 gate；不含 GUI smoke）。
- [ ] **安裝** (`install`): 未驗 — 無 Windows 桌面；未執行全新安裝。
- [ ] **升級** (`upgrade`): 未驗 — 無 Windows 桌面；未執行舊版→新版升級。
- [ ] **移除** (`uninstall`): 未驗 — 無 Windows 桌面；未執行移除。
- [ ] **系統匣** (`tray`): 未驗 — 無 Windows 桌面；系統匣左右鍵未實測。
- [ ] **DPI／縮放** (`dpi_scaling`): 未驗 — 無 Windows 桌面；100%／150%／225% 未實測。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 設定契約可自動測；多 DPI 實機可讀性未驗。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。
- [ ] **簽署標示（NotSigned）** (`signing_label`): 未驗 — 可用 PE Certificate Table／evidence:verify 對照標示；≠ SmartScreen。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無 WIN_CSC_* 密鑰；需人工桌面觀察。

## Notes

tip evidence after 0.16.19; ci_gates=pass (CI only); no installer

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
