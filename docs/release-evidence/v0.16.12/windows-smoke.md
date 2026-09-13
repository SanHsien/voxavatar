# Windows smoke evidence — v0.16.12

> 自動產生的誠實骨架。`smokeExecuted=false`；未取得桌面證據前不得改為 true 或勾選通過。

## Release

- version: `0.16.12`
- tag: `v0.16.12`
- commit: `c24aa10f611c5557c18031750981dc190250d1a8`
- release URL: https://github.com/SanHsien/voxavatar/releases/tag/v0.16.12
- has installer cut: `true`

## Assets / signing

- installer: `VoxAvatar-0.16.12-windows-x64-setup.exe`
- size bytes: `105131217`
- sha256: `1892aa950d4e9ead7b991a4eee92482ec93218e0db0dc7b441550fd18420101a`
- unsigned: `true`
- authenticode: `NotSigned`

## Environment

- Windows edition / version / build: **未驗**（無桌面）
- architecture: x64
- display scaling / GPU: **未驗**

## Checklist

- [ ] **自動化前置 gate** (`ci_gates`): 未驗 — 以 GitHub Actions CI／Release 綠燈為準；本證據不重跑。
- [ ] **安裝與生命週期** (`install_lifecycle`): 未驗 — 無 Windows 桌面；未執行安裝／升級／移除。
- [ ] **核心桌面流程** (`desktop_core`): 未驗 — 無 Windows 桌面；系統匣／DPI／30%／透明視窗未實測。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。
- [ ] **簽署／SmartScreen** (`signing`): 未驗 — 無 WIN_CSC_* 密鑰；Authenticode 狀態為 NotSigned。

## Notes

Honest record for Latest v0.16.12. GUI smoke and signing remain 未驗 (no Windows desktop / no WIN_CSC_*).

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
