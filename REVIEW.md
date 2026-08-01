# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.2.0`／`main`（承接 `v0.1.2` 功能面與本輪 hardening）

## 結論

VoxAvatar 已有可信的 Windows stable 基線，並以 **minor `0.2.0`** 收斂 REVIEW 可落地的安全／可靠性缺口。Windows-only、local-first、音訊隱私、loopback MCP 與媒體授權邊界在程式、測試和文件中大致一致；CI、CodeQL、guarded dependency automation 與 Windows Release 也已能重建正式安裝包。

本輪已關閉原 P2 中可程式驗證的項目：process discovery 快路徑／backoff、多 root sticky、自訂 matcher ReDoS 防護、MCP session TTL／容量、privileged IPC sender URL 驗證，以及移除無效的 `strict-allow-scripts` npmrc 假防線。沒有已知未解 P0／P1。

## 本輪已修正（含 0.1.1–0.2.0）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | tag push 信任根不足 | 只從可信 `main` dispatch；workflow／main／tag SHA 對齊 |
| P1 | 匯入 GLB 驗證過淺 | 完整 descriptor／長度／JSON／extension 驗證後 atomic rename |
| P2 | Darwin／PipeWire 殘留 | 移除並安全回退 |
| P2 | Markdown／媒體型別／Actions SHA／Dependabot／MIT | 已納入 gate 與文件 |
| P2 | discovery 每 1.5s 全量掃描 | PID 存活快路徑 + adaptive backoff（1.5s–10s） |
| P2 | 多 root 只取第一個、語意不清 | sticky active root；否則取排序後第一個 |
| P2 | 自訂 regex ReDoS | 有界安全子集，拒絕巢狀／堆疊量詞 |
| P2 | MCP session 無界 | idle TTL 30 分、hard cap 32、可 sweep |
| P2 | privileged IPC 未驗 sender | `ipc-guard` 統一驗 renderer URL |
| P2 | 無效 `strict-allow-scripts` npmrc | 已刪除；不再假裝 npm 會 enforce |

## 尚未關閉的缺口

1. **Installer 未簽署。** 無 `WIN_CSC_*`；未完成 publisher／SmartScreen／升級路徑前不符合 `1.0.0`。
2. **尚無版本化 Windows 實機證據。** 需依 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) 填 `docs/release-evidence/`。
3. **首次設定／診斷 readiness 模型未完成。** helper 狀態、可複製診斷摘要、設定與 `get_status` 共用語彙仍屬 `0.2.x` 後續。
4. **IPC 尚未拆 preload。** sender URL 已驗，但 avatar／settings 仍共用 API surface。
5. **native self-test 未進 COM／WASAPI capture。**
6. **renderer／桌面 E2E 覆蓋不足。**
7. **大型模組與 bundle 拆分。** `SettingsPage`／`main`／`settings-store` 與 chunk 警告仍待基準後處理。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**（如 `0.2.0`），純修補走 patch；不為了「看起來穩」長時間卡在 `0.1.x`。
- `ROADMAP.md` 管里程碑，`REVIEW.md` 只保留最新健康狀態，`CHANGELOG.md` 記已完成版本。
- 完成條件依 [`docs/RELEASING.md`](docs/RELEASING.md) 與 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md)。
