# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.5.0`／`main`（v0.5 模組拆分、bundle 基準、相容矩陣骨架；Latest GitHub Release 可能仍為較早 tag，見 D-23）

## 結論

VoxAvatar 已越過 `0.2.x` hardening，並在本機可驗證範圍內推進 v0.3／v0.4／v0.5 收斂。沒有已知未解 P0／P1。Windows 實機／簽署／native capture 缺口**延後、不阻塞**後續路線圖。

## 本輪已修正（含至 0.5.0）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | Release 信任根／環境政策 | tip tag 對齊；改為批次 Release（D-23） |
| P1 | 匯入 GLB 驗證過淺 | 完整驗證後 atomic rename |
| P2 | discovery／matcher／MCP session／IPC／preload／佇列 | `0.2.0`–`0.2.9` |
| P2 | settings migration／匯入確認／片段排序／報告導覽 | `0.3.0` |
| P2 | MCP 工具輸出需解析人類文字 | `0.4.0` JSON schema＋多 client 測試 |
| P3 | 設定頁同步打包進 overlay | `React.lazy`；SBOM 腳本 |
| P3 | 大型模組難以維護 | `0.5.0` 開始拆分 migration／sanitize／renderer-windows／SettingsModelsSection |
| P3 | 無 bundle 基準與 release 證據模板 | `baseline:bundle`、`evidence:manifest` |
| P3 | 相容矩陣與 Scene 錯誤復原缺測 | 合成 fixture 矩陣骨架；Scene `resetKey` component test |

## 延後（不阻塞 v0.3+）

1. Installer 簽署（需 `WIN_CSC_*`）。
2. 版本化 Windows GUI smoke 證據。
3. Native COM／WASAPI capture self-test（需 Windows＋C++）。
4. 桌面 E2E／DPI／鍵盤實機驗收。

## 仍開放的開發項

1. 大型模組繼續拆分（`SettingsPage`／`main`／`settings-store` CRUD）。
2. 真實 VRM／VRMA exporter 相容矩陣與人工證據。
3. App／Settings 整合 component tests 與 protocol／tray 桌面 smoke。
4. 冷啟動／Idle／真機記憶體效能基準。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**，純修補走 patch。
- `main` 可累積多個版號；足夠前進後再一次 tag／Release。
- `ROADMAP` 管里程碑，`REVIEW` 只保留最新健康狀態，`CHANGELOG` 記已完成版本。
