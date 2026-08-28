# Windows smoke evidence — v0.16.14

> 自動產生的誠實骨架。`smokeExecuted=false`；未取得桌面證據前不得改為 true 或勾選通過。

## Release

- version: `0.16.14`
- tag: `v0.16.14`
- commit: `10de133a233983cc7b9a814c85705a91eed36cd3`
- release URL: https://github.com/SanHsien/voxavatar/releases/tag/v0.16.14
- has installer cut: `true`

## Assets / signing

- installer: `VoxAvatar-0.16.14-windows-x64-setup.exe`
- size bytes: `105132741`
- sha256: `e30bd7b9bbb888fa295569a643c55747c3d0385344f2584b081e93770c2d659d`
- unsigned: `true`
- authenticode: `NotSigned`

## Environment

- Windows edition / version / build: **未驗**（無桌面）
- architecture: x64
- display scaling / GPU: **未驗**

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — CI／CodeQL／Release 於 tip 10de133 全綠（Release run 30747857459）。
- [ ] **安裝與生命週期** (`install_lifecycle`): 未驗 — 無 Windows 桌面；未執行安裝／升級／移除。
- [ ] **核心桌面流程** (`desktop_core`): 未驗 — 無 Windows 桌面；系統匣／DPI／30%／透明視窗未實測。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。
- [ ] **簽署／SmartScreen** (`signing`): 未驗 — 無 WIN_CSC_* 密鑰；Authenticode 狀態為 NotSigned。

## Notes

Release workflow success (run 30747857459). GUI smoke / Authenticode still 未驗. Old v0.16.12 Release/tag deleted after Latest cut.

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
