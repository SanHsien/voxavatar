# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.11.0`／`main`；Latest GitHub Release：`v0.5.0`（未批次發版）

## 結論

沒有已知未解 P0／P1。v0.11 已落地 `action-pack` 薄契約、overlay lifecycle 抽離、狀態槽解析與氣泡邊緣避讓。剩餘為 store CRUD、系統狀態槽 UI／MCP 狀態事件、jsdom 深化，以及 Windows／簽署／真實 exporter 證據；**不空轉發版**。

## 現況

- MCP 工具：5 個（含 opt-in `show_message`）；loopback-only；無訊息歷史。
- Settings schema **8**（`mcp_show_message_enabled` 預設 false）。
- Avatar：`CharacterBubble`＋邊緣 layout＋`lip-sync-gain`；overlay 生命週期模組化。
- `action-pack.json` schema 1 僅驗證／文件／範例，不繞過匯入 gate。

## 仍開放

1. 系統狀態動作槽 UI／MCP 狀態事件；action-pack 實際匯入管線。
2. `settings-store` CRUD 再拆；更完整 jsdom 整合。
3. 精確 head 投影、DPI／30% 尺寸實機。
4. Windows smoke／簽署／native；真實 exporter 人工樣本。

## 本輪驗證

- `npm run check` 全綠（提交前執行）。

## 發行判定

- `main` tip=`0.11.0` 未 tag；Latest=`v0.5.0`。累積足夠後再批次 Release。
