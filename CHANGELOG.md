# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致；`main` 上可有多次版號 bump，再依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次發布。

## 0.10.0 - 2026-08-02

- MCP 新增 `show_message`（Settings 預設關閉）；輸入清理、session／全域速率限制、斷線清除；`get_status` 只回報開關與是否可見。
- Settings schema 8：`mcp_show_message_enabled`；MCP 頁新增 opt-in 開關與隱私警告。
- Avatar overlay 漫畫式 `CharacterBubble` DOM；口型改走 `lip-sync-gain`（依 characterSize 推估頭部增益）。
- `tools_schema_version`／`status_schema_version` 升為 2；整合與安全文件同步。

## 0.9.0 - 2026-08-01

- VRMA 品質分析支援動作用途 `loop`／`one-shot`／`pose`：一次性動作不再因循環接縫被淘汰；pose 不套用 dead-motion。
- Settings schema 7：clip 持久化 `purpose`；Idle／Speaking 預設 `loop`，自訂動作預設 `one-shot`；6→7 遷移自動補齊。
- 新增角色狀態仲裁（`character-state`）、氣泡輸入清理／有界佇列（`character-message`）、小尺寸口型增益（`lip-sync-gain`）純邏輯與測試；App 語音路徑改走仲裁。
- DOM 氣泡、MCP `show_message`、口型 renderer 接線與 Windows 實機仍屬後續。

## 0.8.1 - 2026-08-01

- 簡化整個 repository 的 Markdown 分工：ROADMAP 只留已完成摘要與 v0.9，決策檔改為現行主題，代理與 fixture 文件改為薄入口。
- v0.6–v0.8 未完成項全部移入 v0.9；Windows release-evidence 規則併入單一驗收文件。
- 新增角色表現設計：動作用途、狀態仲裁、小尺寸口型可讀性、漫畫式浮動氣泡，以及已連接 AI 的 MCP `show_message` 規劃。
- 原 VRMA Idle 指南併入 `docs/CHARACTER_BEHAVIOR.md`，同步更新 Settings、README 與資產 manifest 連結。
- Settings MCP 頁新增連線後的自然語言使用範例；整合文件明確分開目前 4 個工具與 v0.9 `show_message` 契約。

## 0.8.0 - 2026-08-01

- 擴充合成 VRM／VRMA 相容矩陣：無 mesh／稀疏骨骼／無貼圖／無表情、過短／無動畫／loop seam 等案例，並掛到品質測試與 `manifest.json`。
- 公開文件補 Exporter 備註（VRoid／UniVRM／Blender）；真實廠商樣本仍標 `pending-human-sample`。
- `settings-store` 補強匯入失敗不留下半完成 catalog 的回歸測試。
- 設定頁抽出 `SettingsConfirmationDialog`（與 Preview／Appearance／MCP 拆分同輪收斂）。

## 0.7.0 - 2026-08-01

- `baseline:bundle` 支援歷史對照與門檻建議（`comparison`／`guidance`）；文件化於 `docs/DEVELOPMENT.md`。
- 新增 `baseline:startup`（main process 關鍵模組 `require()` 計時）；真機 cold-start／Idle／記憶體仍屬 v0.9。
- 設定頁再拆 `SettingsAppearanceSection`／`SettingsMcpSection`／`SettingsPreviewPanel`；Settings 仍為 lazy chunk。

## 0.6.0 - 2026-08-01

- 路線圖重規劃：v0.1–v0.5 收斂為已完成摘要；未完成項移入 v0.6–v0.9 與 v1.0 門檻。
- 設定頁抽出 `SettingsAnimationsSection`／`SettingsVoiceSection`；`SettingsPage` 行數下降。
- `main.cjs` 抽出 `settings-ipc.cjs`（settings IPC 註冊與測試）；`settings-store` 抽出資產驗證邊界（`settings-asset-validation`＋測試）。
- Scene 錯誤復原抽出 `scene-error-recovery` helper 與測試；`main.cjs` 行數下降。

## 0.5.0 - 2026-08-01

- 依功能邊界拆分 `settings-migration`／`settings-sanitize`、`renderer-windows`、`SettingsModelsSection`；`SettingsPage`／`main`／store 仍可繼續拆。
- 以合成 fixture 建立公開 VRM／VRMA 相容矩陣骨架（`docs/VRM_VRMA_COMPATIBILITY.md`）；真實 exporter 證據仍待。
- 新增 renderer bundle 基準腳本（`npm run baseline:bundle`）；冷啟動／Idle／真機記憶體基準仍待。
- Scene 錯誤復原 `resetKey` component test；App／Settings 整合與桌面 smoke 仍待。
- release-evidence manifest 模板（`npm run evidence:manifest`）；SBOM 腳本（`npm run sbom`）沿用。

## 0.4.0 - 2026-08-01

- MCP 工具結果改為可解析 JSON（含 `status_schema_version`／`tools_schema_version`）；設定頁 MCP 狀態同步暴露 schema 版本。
- 多 client 並發、catalog 熱更新與 handler close／重開自動化測試；`docs/INTEGRATIONS.md` 補 Streamable HTTP、重連、port 變更與故障排除。
- 採批次 Release；Windows 實機驗證不阻塞其他可自動驗證的路線圖工作。

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
