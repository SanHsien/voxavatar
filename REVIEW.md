# VoxAvatar 專案覆核

覆核日期：2026-08-02
基準：`v0.10.0`／`main`；Latest GitHub Release：`v0.5.0`（未批次發版）

## 結論

沒有已知未解 P0／P1。v0.9 角色表現主線（用途、狀態、氣泡 DOM、`show_message` opt-in、口型增益接線）已可自動驗證。剩餘為 `action-pack`、overlay／store 再拆、jsdom 深化，以及 Windows／簽署／真實 exporter 證據；**不空轉發版**。

## 現況

- MCP 工具：5 個（含 opt-in `show_message`）；loopback-only；無訊息歷史。
- Settings schema **8**（`mcp_show_message_enabled` 預設 false）。
- Avatar：`CharacterBubble`＋`lip-sync-gain` 已接線。
- 合成相容矩陣與 purpose 評分仍在。

## 仍開放

1. `action-pack.json` 薄契約；系統狀態動作槽 UI／MCP 狀態事件。
2. overlay lifecycle／store CRUD；更完整 jsdom 整合。
3. 精確 head 投影、邊緣換邊、DPI／30% 尺寸實機。
4. Windows smoke／簽署／native；真實 exporter 人工樣本。

## 本輪驗證

- `npm run check` 全綠（提交前執行）。

## 發行判定

- `main` tip=`0.10.0` 未 tag；Latest=`v0.5.0`。累積足夠後再批次 Release。
