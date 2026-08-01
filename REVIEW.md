# VoxAvatar 專案覆核

覆核日期：2026-08-01
基準：`v0.8.1`／`main`；Latest GitHub Release：`v0.5.0`

## 結論

目前沒有已知未解 P0／P1。v0.6–v0.8 可自動驗證的主體已完成，剩餘工作已集中到 v0.9，避免已完成清單與 CHANGELOG 重複。這次完成文件架構、角色表現契約與 Settings 的現有 MCP 使用指引；**尚未實作**狀態仲裁、浮動氣泡、MCP `show_message` 或小尺寸口型增益。

## 現況

- 安全邊界：WASAPI playback level only、無麥克風／錄音／轉錄；MCP／HTTP 仍為 loopback-only。
- 媒體邊界：安裝包無第三方 VRM／VRMA；匯入與 Release 各有 fail-closed gate。
- 維護性：Settings、IPC、validation 與 preview 已拆分；尚有 overlay lifecycle、store CRUD 與 jsdom 整合可補。
- 品質證據：合成 VRM／VRMA matrix 已存在；真實 exporter、Windows GUI、DPI、WASAPI 與簽署仍需人工證據。
- 文件責任：ROADMAP 管未來、REVIEW 管目前、CHANGELOG 管歷史；角色動作與氣泡契約集中在 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

## v0.9 開放項

1. **角色表現**：動作用途 profile、狀態仲裁／fallback、小尺寸口型可讀性、浮動氣泡與 MCP `show_message`。
2. **程式收斂**：overlay lifecycle、settings-store CRUD、App／Settings jsdom、Idle／切換模型基準。
3. **素材證據**：取得授權清楚的 VRoid／UniVRM／Blender 樣本並補人工結果，不提交二進位。
4. **Windows／Release**：protocol、tray、DPI、鍵盤、native capture、installer 簽署與版本化 smoke。

## 本輪驗證

- `npm run check`：通過（174 Node tests、22 renderer tests、文件／資產、production audit、TypeScript 與 Vite build）。
- `npm run assets:release`：通過，安裝包仍不含第三方角色或動作。
- 非阻塞警告：`src/main.tsx` Fast Refresh 規則，以及約 1.61 MB 的 main renderer chunk；後者持續以 bundle baseline 監看。

## 發行判定

- 能力或安全邊界強化用 minor，純修補與文件維護用 patch。
- `main` 可累積多個版號，再依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次 tag／Release；目前不需要空轉發版。
- 已發布 tag 不 force-update；新 Release 成功且成為 Latest 後才清理舊版。
- 未取得真實桌面、合法樣本或簽署密鑰時，相關項目標為未驗，不阻塞其他工作，也不宣稱完成。
