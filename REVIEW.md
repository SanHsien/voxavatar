# VoxAvatar 專案覆核

覆核日期：2026-08-01

## 結論

VoxAvatar 的 Windows-only、local-first 與媒體授權邊界已在程式、測試、文件和發行流程中對齊。開發骨架涵蓋 CI、CodeQL、Dependabot、guarded auto-merge、issue／PR templates、Markdown 驗證與 tag-based Release。

目前沒有已知阻擋 `0.1.0` stable 的 P0／P1。尚待實際環境持續驗證的項目，不應以自動測試冒充完成，也不阻止後續 minor 版持續改善相容性。

## 已覆蓋

- JavaScript／TypeScript lint、Node 測試、Vitest 與 production build。
- Windows 原生 WASAPI helper 編譯與 self-test。
- loopback Host／origin／schema、Electron sandbox／navigation 與資產 ID 邊界。
- 資產 manifest 的 fail-closed 發行檢查。
- tag／package version 一致、Windows NSIS、SHA-256 與 GitHub Release。
- Markdown 本機連結、控制字元、檔尾與產品識別檢查。
- Dependabot 作者、base、檔案範圍、semver、allowlist、head-bound policy 與必要 checks gate。

## 尚需真實環境驗證

- 不同 Windows 10／11 build、音效裝置與目標應用程式的 WASAPI loopback 行為。
- 已簽署安裝包的 SmartScreen、升級、移除與 protocol 註冊。
- 不同 VRM／VRMA exporter、骨架與素材條款組合。
- 第一張符合政策的 Dependabot PR 完整自動核准／合併生命週期。
- GitHub Release 下載後的安裝版 GUI、模型匯入、語音來源與 MCP smoke。

## 發行判定

每次 Release 必須以 [`docs/RELEASING.md`](docs/RELEASING.md) 的本機檢查、遠端 workflow、published/latest/target SHA 與資產驗證為準。本檔是覆核基線，不取代當次證據。
