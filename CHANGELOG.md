# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致；`main` 上可有多次版號 bump，Release／tag 依批次政策累積後一次發布（見 D-23）。

## 0.5.0 - 2026-08-01

- 依功能邊界拆分 `settings-migration`／`settings-sanitize`、`renderer-windows`、`SettingsModelsSection`；`SettingsPage`／`main`／store 仍可繼續拆。
- 以合成 fixture 建立公開 VRM／VRMA 相容矩陣骨架（`docs/VRM_VRMA_COMPATIBILITY.md`）；真實 exporter 證據仍待。
- 新增 renderer bundle 基準腳本（`npm run baseline:bundle`）；冷啟動／Idle／真機記憶體基準仍待。
- Scene 錯誤復原 `resetKey` component test；App／Settings 整合與桌面 smoke 仍待。
- release-evidence manifest 模板（`npm run evidence:manifest`）；SBOM 腳本（`npm run sbom`）沿用。

## 0.4.0 - 2026-08-01

- MCP 工具結果改為可解析 JSON（含 `status_schema_version`／`tools_schema_version`）；設定頁 MCP 狀態同步暴露 schema 版本。
- 多 client 並發、catalog 熱更新與 handler close／重開自動化測試；`docs/INTEGRATIONS.md` 補 Streamable HTTP、重連、port 變更與故障排除。
- 決策 D-23：批次 Release；Windows 實機驗證不阻塞 v0.3+。

## 0.3.0 - 2026-08-01

- Settings schema 4／5→6 migration fixture；不可遷移 schema 備份為 `settings.json.unmigratable-backup`。
- 目錄匯入抽出 `directory-import` evaluate helper；匯入前顯示品質摘要並確認後才寫 catalog。
- VRMA 片段上移／下移；品質報告可在檔案總管顯示。
- 設定頁 `React.lazy` 延後載入；新增 `npm run sbom` production 依賴清單。
- CHANGELOG 精簡歷史條目；agent／發行文件改為累積 bump、批次 Release。

## 0.2.9 - 2026-08-01

- README：已落地能力併入功能一覽；「相對上游」改為短政策註。
- avatar／settings preload 分權；設定寫入綁 settings webContents。
- MCP／protocol／HTTP 動作改走有界佇列（同名合併、容量、最小間隔）。

## 0.2.0 – 0.2.8 - 2026-08-01

- **診斷與首次設定**：進度清單、helper 狀態、診斷摘要、readiness 共用 schema。
- **安全與可靠性**（`0.2.0`）：sticky discovery、有界 matcher、MCP session TTL／容量、IPC sender 驗證。
- **素材品質**：VRM 目錄評估匯入、`voxavatar-vrm-report.md`；修正 VRM 0.x `humanBones` 陣列誤判。
- **發行與治理**：main tip 已 tagged 才打包；文件檢討／中斷接續規則；系統匣「重設視角」。

## 0.1.0 - 2026-08-01

- **第一個 stable release**：Windows overlay、WASAPI 口型、本機 VRM／VRMA、MCP／HTTP／protocol、中英設定。
- Fork 獨有：點穿、系統匣、目錄匯入、品質報告、一鍵清除、自訂動作。
- **0.1.1–0.1.2**：文件／Release 信任根、GLB 驗證、Idle 間隔、系統輸出語音 opt-in、縮放下限 30%。

## 0.1.0-beta - 2026-08-01

- 自 `xikhar/persona` 建立 Windows-only fork；移除內建角色／Idle VRMA；目錄匯入與品質報告；識別改為 `voxavatar`；CI／CodeQL／Dependabot 基線。
