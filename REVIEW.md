# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.2.7`／`main`（首次設定 readiness、helper 狀態、診斷摘要；VRM0 humanoid 覆蓋修正）

## 結論

VoxAvatar 已有可信的 Windows stable 基線，並以 **`0.2.x`** 收斂安全／可靠性與首次設定閉環。Windows-only、local-first、音訊隱私、loopback MCP 與媒體授權邊界在程式、測試和文件中大致一致；CI、CodeQL、guarded dependency automation 與 Windows Release 也已能重建正式安裝包。

本輪已關閉原 P2 可程式驗證項，以及 REVIEW #3 的程式面：helper 狀態語彙、可複製診斷摘要（redact）、設定頁首次設定清單，與 MCP `get_status` 共用 readiness。沒有已知未解 P0／P1。

## 本輪已修正（含 0.1.1–0.2.7）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | Release 信任根／環境政策 | tag／main tip 對齊；`main` tip 已 tagged 時打包 |
| P1 | 匯入 GLB 驗證過淺 | 完整 descriptor／長度／JSON／extension 驗證後 atomic rename |
| P2 | Darwin／PipeWire 殘留 | 移除並安全回退 |
| P2 | discovery／matcher／MCP session／IPC sender | `0.2.0` 已收斂 |
| P2 | VRM0 humanBones 陣列誤判覆蓋 | `0.2.6` 正確解析陣列／物件 |
| P2 | 首次設定／診斷 readiness 未完成 | `0.2.7` helper 狀態、checklist、診斷摘要、共用 readiness |

## 尚未關閉的缺口

1. **Installer 未簽署。** 無 `WIN_CSC_*`；未完成 publisher／SmartScreen／升級路徑前不符合 `1.0.0`。
2. **尚無版本化 Windows 實機證據。** 需依 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) 填 `docs/release-evidence/`。
3. **IPC 尚未拆 preload。** sender URL 已驗，但 avatar／settings 仍共用 API surface。
4. **native self-test 未進 COM／WASAPI capture。**
5. **renderer／桌面 E2E 覆蓋不足。**
6. **大型模組與 bundle 拆分。** `SettingsPage`／`main`／`settings-store` 與 chunk 警告仍待基準後處理。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**（如 `0.2.0`），純修補走 patch；不為了「看起來穩」長時間卡在 `0.1.x`。
- `ROADMAP.md` 管里程碑，`REVIEW.md` 只保留最新健康狀態，`CHANGELOG.md` 記已完成版本。
- 完成條件依 [`docs/RELEASING.md`](docs/RELEASING.md) 與 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md)。
