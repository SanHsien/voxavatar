# VoxAvatar 專案覆核

覆核日期：2026-08-01
基準：`v0.9.0`／`main`；Latest GitHub Release：`v0.5.0`（未批次發版）

## 結論

沒有已知未解 P0／P1。v0.9 已落地可自動驗證的第一段：動作用途品質評分、狀態仲裁、氣泡／口型純邏輯。DOM 氣泡、MCP `show_message`、口型 renderer 接線與 Windows／簽署仍未完成，**不空轉發版**。

## 現況

- 安全邊界：WASAPI playback level only；MCP／HTTP loopback-only。
- 媒體：合成相容矩陣含 purpose 差異；真實 exporter 樣本仍待。
- 角色表現：`character-state`／`character-message`／`lip-sync-gain` 有測試；App 僅語音路徑接入仲裁。
- Settings schema **7**（clip `purpose`）；舊版 6 可遷移。

## v0.9 仍開放

1. 氣泡 DOM overlay、MCP `show_message` opt-in、系統狀態動作槽 UI。
2. 口型增益接到 Avatar／Scene；30% 尺寸與 DPI 實機。
3. overlay lifecycle／store CRUD／jsdom 整合。
4. 真實 exporter 人工樣本；Windows smoke／簽署／native。

## 本輪驗證

- 以 `npm run check` 為 gate（提交前執行）。
- 非阻塞：main chunk 偏大、Fast Refresh 警告。

## 發行判定

- `main` 累積版號；足夠前進且有安裝需求時再批次 Release。
- 目前 Latest=`v0.5.0`，tip=`0.9.0` 未 tag。
