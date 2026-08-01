# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.2.9`／`main`（preload 分權、動作佇列；README 功能一覽重整）

## 結論

VoxAvatar 已有可信的 Windows stable 基線。`0.2.x` 已收斂安全／可靠性、首次設定閉環，以及 avatar／settings preload 分權與高頻動作有界佇列。沒有已知未解 P0／P1。

## 本輪已修正（含至 0.2.9）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | Release 信任根／環境政策 | tag／main tip 對齊；`main` tip 已 tagged 時打包 |
| P1 | 匯入 GLB 驗證過淺 | 完整驗證後 atomic rename |
| P2 | discovery／matcher／MCP session／IPC sender | `0.2.0` |
| P2 | VRM0 humanBones／readiness／診斷 | `0.2.6`–`0.2.7` |
| P2 | avatar／settings 共用 preload | `0.2.9` 拆 preload，設定寫入綁 settings webContents |
| P2 | 高頻動作淹沒 renderer | `0.2.9` 有界佇列＋同名合併＋最小間隔 |

## 尚未關閉的缺口

1. **Installer 未簽署。** 需 `WIN_CSC_*` 與 SmartScreen／升級路徑實機驗收（無法在無密鑰環境完成）。
2. **尚無版本化 Windows 實機證據。** 需 Windows GUI 依 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) 填 `docs/release-evidence/`。
3. **native self-test 未進 COM／WASAPI capture。** 需 Windows C++／真機。
4. **renderer／桌面 E2E 覆蓋不足。** 需 Windows GUI 或額外自動化基建。
5. **大型模組與 bundle 拆分。** `SettingsPage`／`main`／`settings-store` 仍待基準後重構（範圍大，宜獨立段落）。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**，純修補走 patch。
- `ROADMAP.md` 管里程碑，`REVIEW.md` 只保留最新健康狀態，`CHANGELOG.md` 記已完成版本。
