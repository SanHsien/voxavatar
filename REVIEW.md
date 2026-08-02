# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.13.2`／`main`；GitHub Latest Release：`v0.13.0`

## 結論

沒有已知未解 P0／P1。`v0.13.0` 為 Latest。上游 open PR／issue 已評估並寫入 [`docs/UPSTREAM_EVAL.md`](docs/UPSTREAM_EVAL.md)（無須合併）。路線圖焦點為 **v0.14**。`main` tip `0.13.2` 為文件／評估紀錄（未另 tag）。

## 現況

- Latest Release：`v0.13.0`；`main` tip 文件／路線圖為 `0.13.x`。
- 上游：commit 水位 `cf27d12`；open PR #16／issue #13 為 macOS（不合併）；issue #11 首次取得角色文件已涵蓋。詳見 [`docs/UPSTREAM_EVAL.md`](docs/UPSTREAM_EVAL.md)。
- MCP 工具：5 個（含 opt-in `show_message`）；狀態事件正規化已備、狀態工具尚未掛上。
- Settings schema 8；catalog CRUD／overlay lifecycle 已抽離；Idle once 有 clip 快取與完成逾時後備。

## 仍開放

1. 系統狀態動作槽 UI；MCP 狀態工具；action-pack 匯入管線。
2. App／Settings jsdom 整合。
3. 精確 head 投影、DPI／30%／Idle 長跑實機。
4. Installer 簽署與 Windows GUI smoke（無密鑰／桌面時標未驗）。

## 本輪驗證

- `npm run check` 全綠。
- Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

## 發行判定

- Latest=`v0.13.0`；僅保留最新 Release／tag。`main` tip=`0.13.2`（上游評估紀錄）未另發版。
