# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.12.1`／`main`；Latest GitHub Release：`v0.5.0`（未批次發版）

## 結論

沒有已知未解 P0／P1。v0.12.1 修復 Idle 長跑後角色永久停住（clip／action 堆積＋`finished` 漏發）。剩餘為系統狀態槽 UI／MCP 狀態工具、jsdom、以及 Windows／簽署／真實 exporter 證據；**不空轉發版**。

## 現況

- MCP 工具：5 個（含 opt-in `show_message`）；狀態事件正規化已備、工具尚未掛上。
- Settings：schema 8；catalog 變更在 `settings-store-catalog.cjs`。
- Avatar：Idle once 輪播有 clip 快取與完成逾時後備；氣泡邊緣 layout、`lip-sync-gain`、overlay lifecycle、`action-pack` 契約。

## 仍開放

1. 系統狀態動作槽 UI；MCP 狀態工具（接 `normalizeExternalStateEvent`）。
2. App／Settings jsdom 整合；action-pack 實際匯入管線。
3. 精確 head 投影、DPI／30% 尺寸實機；Idle 長跑實機基準仍可補強。
4. Windows smoke／簽署／native；真實 exporter 人工樣本。

## 本輪驗證

- `npm run check` 全綠（提交前執行）。

## 發行判定

- `main` tip=`0.12.1` 未 tag；Latest=`v0.5.0`。累積足夠後再批次 Release。
