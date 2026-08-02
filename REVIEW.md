# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.13.1`／`main`；GitHub Release：`v0.13.0`

## 結論

沒有已知未解 P0／P1。角色表現主線（v0.9–v0.12）與上游評估（水位 `cf27d12`，#14／#15 不合併）已收斂。路線圖焦點改為 **v0.14**（狀態槽 UI／MCP 狀態工具、jsdom、Windows 實機與簽署）。

## 現況

- MCP 工具：5 個（含 opt-in `show_message`）；狀態事件正規化已備、狀態工具尚未掛上。
- Settings schema 8；catalog CRUD 在 `settings-store-catalog.cjs`；overlay lifecycle 已抽離。
- Idle once 輪播有 clip 快取與完成逾時後備；氣泡邊緣 layout 已接線。
- 上游：不引入 `demo.jpg`／不搬移 `ASSET_LICENSES.md`。

## 仍開放

1. 系統狀態動作槽 UI；MCP 狀態工具；action-pack 匯入管線。
2. App／Settings jsdom 整合。
3. 精確 head 投影、DPI／30%／Idle 長跑實機。
4. Installer 簽署與 Windows GUI smoke（無密鑰／桌面時標未驗）。

## 本輪驗證

- `npm run check` 全綠。
- Release／Latest／資產依 [`docs/RELEASING.md`](docs/RELEASING.md) 核對。

## 發行判定

- 批次 tag `v0.13.0`；成功成為 Latest 後只保留最新 Release。
