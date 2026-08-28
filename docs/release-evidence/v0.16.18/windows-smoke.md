# Windows smoke evidence — (no GitHub tag)

> 自動產生的誠實骨架。`smokeExecuted=false`；未取得桌面證據前不得改為 true 或勾選通過。

## Release

- version: `0.16.18`
- tag: `(no GitHub tag)`
- commit: `null`
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

- [ ] **自動化前置 gate** (`ci_gates`): 未驗 — 以 GitHub Actions CI／Release 綠燈為準；本證據不重跑。
- [ ] **安裝與生命週期** (`install_lifecycle`): 未驗 — 無 Windows 桌面；未執行安裝／升級／移除。
- [ ] **核心桌面流程** (`desktop_core`): 未驗 — 無 Windows 桌面；系統匣／DPI／30%／透明視窗未實測。
- [ ] **語音與 MCP** (`voice_mcp`): 未驗 — 無 Windows 桌面；真實 WASAPI／系統匣 MCP 未實測。
- [ ] **簽署／SmartScreen** (`signing`): 未驗 — 無 WIN_CSC_* 密鑰；Authenticode 狀態為 NotSigned。

## Notes

Populate per-item pass/fail/未驗 after a real Windows smoke; do not pre-check.

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
