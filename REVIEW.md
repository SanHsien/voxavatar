# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.13.0`／`main`；Latest GitHub Release：發版中（目標 `v0.13.0`；先前 `v0.5.0`）

## 結論

沒有已知未解 P0／P1。上游自 `327c8ca` 之後的 #14／#15 已評估且**不合併**；水位 `cf27d12`。本版為累積功能批次 Release。

## 現況

- 上游評估：`327c8ca` 已手動移植 Windows；`a72292f`／`cf27d12` 跳過（授權檔路徑、`demo.jpg`、README 圖示）。
- Idle once 輪播有 clip 快取與完成逾時後備（0.12.1）。
- MCP 5 工具；Settings schema 8；action-pack／overlay／catalog CRUD 已落地。

## 仍開放

1. 系統狀態動作槽 UI；MCP 狀態工具。
2. App／Settings jsdom；action-pack 匯入管線。
3. 精確 head 投影、DPI／30%／Idle 長跑實機。
4. Installer 簽署與 Windows GUI smoke（本機無密鑰／桌面時標未驗）。

## 本輪驗證

- `npm run check` 全綠（提交前執行）。
- Release 依 `docs/RELEASING.md` 驗證 tag／Latest／資產。

## 發行判定

- 批次 tag `v0.13.0`；成功後只保留最新 Release。
