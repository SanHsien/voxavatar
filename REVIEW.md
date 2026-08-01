# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.8.0`／`main`（v0.7 效能基準＋設定再拆；v0.8 合成相容矩陣與 Exporter 備註；Latest GitHub Release 仍為 `v0.5.0`，見 D-23）

## 結論

v0.6–v0.8 路線圖本輪可在 Linux CI 驗證的工作已收斂。沒有已知未解 P0／P1。Windows 實機／簽署／native capture 缺口**延後、不阻塞**（D-23、D-24）。下一批次 Release 建議等 v0.9 有進展或累積需求再發；目前不空轉發版。

## 本輪已修正（含至 0.8.0）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | Release 信任根／環境政策 | tip tag 對齊；改為批次 Release（D-23） |
| P1 | 匯入 GLB 驗證過淺 | 完整驗證後 atomic rename |
| P2 | discovery／matcher／MCP session／IPC／preload／佇列 | `0.2.0`–`0.2.9` |
| P2 | settings migration／匯入確認／片段排序／報告導覽 | `0.3.0` |
| P2 | MCP 工具輸出需解析人類文字 | `0.4.0` JSON schema＋多 client 測試 |
| P3 | 設定頁同步打包進 overlay | `React.lazy`；SBOM 腳本 |
| P3 | 大型模組難以維護 | `0.5.0`–`0.7.0` 持續拆分 section／IPC／preview |
| P3 | 無 bundle／啟動基準與 release 證據模板 | `baseline:bundle` 對照／guidance；`baseline:startup`；`evidence:manifest` |
| P3 | 相容矩陣過淺 | `0.8.0` 擴充合成案例＋Exporter 備註；人工樣本仍待 |
| P3 | 路線圖仍列大量已完成 v0.1–v0.5 細項 | 重寫 ROADMAP（D-24）；v0.7／v0.8 本輪勾選 |

## 延後（不阻塞；屬 v0.9）

1. Installer 簽署（需 `WIN_CSC_*`）
2. 版本化 Windows GUI smoke 證據
3. Native COM／WASAPI capture self-test（需 Windows＋C++）
4. 桌面 E2E／DPI／鍵盤實機驗收

## 仍開放的開發項

1. **可選（Linux CI）**：`main` overlay lifecycle 再拆；`settings-store` CRUD 邊界；App／Settings jsdom 整合測；Idle／切換模型真機基準說明細化。
2. **v0.8 人工**：真實 exporter 樣本（授權清楚）補實測欄位。
3. **v0.9**：protocol／tray 桌面 smoke、簽署、native 真機驗收（有 Windows／密鑰再開）。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**，純修補走 patch。
- `main` 可累積多個版號；足夠前進後再一次 tag／Release（目前 Latest=`v0.5.0`，`main` tip=`0.8.0` 未發版）。
- `ROADMAP` 管里程碑，`REVIEW` 只保留最新健康狀態，`CHANGELOG` 記已完成版本。
