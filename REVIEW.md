# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.6.0`／`main`（路線圖重規劃、SettingsAnimations／Voice 拆分、settings-ipc／settings-asset-validation 抽出、scene-error-recovery helper＋測試；Latest GitHub Release 仍為 `v0.5.0`，見 D-23）

## 結論

v0.1–v0.5 里程碑已收斂；路線圖重規劃完成，後續工作依 v0.6–v0.9 分軌推進。沒有已知未解 P0／P1。Windows 實機／簽署／native capture 缺口**延後、不阻塞** v0.6–v0.8（D-23、D-24）。

## 本輪已修正（含至 0.6.0）

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | Release 信任根／環境政策 | tip tag 對齊；改為批次 Release（D-23） |
| P1 | 匯入 GLB 驗證過淺 | 完整驗證後 atomic rename |
| P2 | discovery／matcher／MCP session／IPC／preload／佇列 | `0.2.0`–`0.2.9` |
| P2 | settings migration／匯入確認／片段排序／報告導覽 | `0.3.0` |
| P2 | MCP 工具輸出需解析人類文字 | `0.4.0` JSON schema＋多 client 測試 |
| P3 | 設定頁同步打包進 overlay | `React.lazy`；SBOM 腳本 |
| P3 | 大型模組難以維護 | `0.5.0`–`0.6.0` 拆分 migration／sanitize／renderer-windows／SettingsModels／Animations／Voice；抽出 settings-ipc、settings-asset-validation |
| P3 | 無 bundle 基準與 release 證據模板 | `baseline:bundle`、`evidence:manifest` |
| P3 | 相容矩陣與 Scene 錯誤復原缺測 | 合成 fixture 矩陣骨架；scene-error-recovery helper＋測試 |
| P3 | 路線圖仍列大量已完成 v0.1–v0.5 細項 | 重寫 ROADMAP；未完成項對應 v0.6–v0.9（D-24） |

## 延後（不阻塞 v0.6–v0.8）

1. Installer 簽署（需 `WIN_CSC_*`）→ **v0.9**
2. 版本化 Windows GUI smoke 證據 → **v0.9**
3. Native COM／WASAPI capture self-test（需 Windows＋C++）→ **v0.9**
4. 桌面 E2E／DPI／鍵盤實機驗收 → **v0.9**

## 仍開放的開發項

1. **v0.6**：`SettingsPage`／`main`／`settings-store` 其餘 section 與 CRUD 拆分；App／Settings preview 錯誤復原整合測試。
2. **v0.7**：bundle／啟動基準深化；非首屏進一步拆分；冷啟動／Idle 軟體側計時。
3. **v0.8**：真實 VRM／VRMA exporter 相容矩陣擴充與合成案例回歸；人工證據可後補。
4. **v0.9**：protocol／tray 桌面 smoke、簽署、native 真機驗收（有 Windows／密鑰再開）。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag。
- SemVer：能力／邊界強化走 **minor**，純修補走 patch。
- `main` 可累積多個版號；足夠前進後再一次 tag／Release。
- `ROADMAP` 管里程碑，`REVIEW` 只保留最新健康狀態，`CHANGELOG` 記已完成版本。
