# VoxAvatar 現行決策

最後修訂：2026-08-02

本檔只保留仍影響實作的取捨，不重述版本歷史、操作步驟或路線圖。歷史見 [`CHANGELOG.md`](../CHANGELOG.md)，未來工作與目前健康見 [`ROADMAP.md`](../ROADMAP.md)，具體發行流程見 [`RELEASING.md`](RELEASING.md)。

## 1. 產品與上游

- 顯示名為 **VoxAvatar**，識別字串為 `voxavatar`；產品只維護 Windows Electron、WASAPI 與 NSIS。
- 上游為 `xikhar/persona`，保留 MIT 與 attribution。已 squash 的 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update` 不再合併，只挑選符合本 fork 邊界的變更。
- 硬性不收：PipeWire／Hyprland／macOS native、`PERSONA_*` 識別、未確認再散布權的上游 `demo.jpg`、把授權政策搬離根目錄 `ASSET_LICENSES.md`。
- VoxAvatar 是桌面角色呈現層，不在應用程式內執行 LLM、保存聊天紀錄或取代聊天客戶端。
- 2026-08-02 已執行 GitHub **Leave fork network**：VoxAvatar 現為 standalone repo（API：`fork=false`、`parent=null`）。解除前相對共同基線有 50 個獨有 commit，上游有 4 個獨有 commit；解除後已驗證 `main`、`v0.16.0`、Latest Release、1 個 issue、2 個 PR、Actions、About 與 topics 均保留。操作不可逆，但不改變來源：README、LICENSE 與本節持續保留上游 credit，本機 `upstream` remote 也保留作比較與挑選變更。

### 來源、授權與 remotes

- 上游程式碼的著作權與署名屬 `xikhar` 及其貢獻者；應用程式原始碼沿用 [MIT License](../LICENSE)。
- VoxAvatar 的 Windows-only 改作、文件與新增程式由各自貢獻者保有著作權，並依同一 MIT License 提供。
- 第三方模型、動作、圖片或其他媒體不因出現在本機工作區而自動採 MIT；發行條件見 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。
- Git remotes：`origin` → `https://github.com/SanHsien/voxavatar.git`；`upstream` → `https://github.com/xikhar/persona.git`（只作比較與挑選變更，不直接重併已 squash 分支）。

### 上游評估紀錄（xikhar/persona）

最後評估：2026-08-02

遠端：`https://github.com/xikhar/persona.git`（`upstream`）

評估規則：只挑選符合 VoxAvatar Windows-only／隱私／媒體授權／識別邊界的變更；不整包 merge 已 squash 殘留分支。

#### 水位

| 項目 | 值 |
| --- | --- |
| `upstream/main` tip（commit 水位） | `9287ea3`（#16，2026-08-02） |
| 下次接續 | tip 之後的新 commit；以及仍為 open 的 issue／PR 再掃一次 |
| Open PR／issue 本輪掃描 | 2026-08-02；無 open PR，open issue 僅 #11 |

#### 評估流程

1. `git fetch upstream main`，列出水位之後的 commit。
2. `gh pr list`／`gh issue list` 掃 open（必要時對照近期 merged／closed）。
3. 對每一項標 **採用／部分採用／不合併／已涵蓋／範圍外**，並寫理由。
4. 需要程式變更才動手；僅文件決策也要更新本節水位。
5. 不把上游 `PERSONA_*`、PipeWire、Hyprland、macOS native、`demo.jpg`（無再散布確認）或授權檔路徑大搬遷直接合入。

#### Open PR

目前無 open PR。

#### Open issues

| Issue | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#11](https://github.com/xikhar/persona/issues/11) | Docs: first-run guide for getting a VRM avatar and VRMA animations | **已涵蓋** | 需求為「首次如何取得／匯入 VRM／VRMA」。本 fork README「快速開始」＋ VRoid Hub／BOOTH／Studio 連結、[`ASSET_LICENSES.md`](../ASSET_LICENSES.md)、[`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md) 已覆蓋；追蹤 issue [`SanHsien/voxavatar#1`](https://github.com/SanHsien/voxavatar/issues/1) 已關閉。無需再合上游文件。 |

#### 已評估的 merged commit／PR（摘要）

| 對象 | 結論 | 備註 |
| --- | --- | --- |
| #12 → `327c8ca` | **部分採用** | 手動移植 Windows 語音來源；不收 PipeWire／macOS／跨平台包裝／`PERSONA_*` |
| #14 → `a72292f` | **不合併** | 維持根目錄 `ASSET_LICENSES.md`；不引入 `demo.jpg`；不搬到 `public/assets/LICENSES.md` |
| #15 → `cf27d12` | **不合併** | 僅調整上游 `demo.jpg` 顯示 |
| #16 → `9287ea3` | **不合併**（範圍外） | macOS Core Audio worker churn 修正；共用 JS 也只服務 darwin capture key，Windows sticky-root listener 不適用 |
| #10、`5bd380e` 等語音／lighting 基線 | **已在 fork** | 語音來源、per-model lighting 等已落地為 VoxAvatar 行為 |
| #1–#7、#9 等早期 PR | **不重併** | 對應殘留分支政策：已 squash 進上游 `main` 者不再整包合併 |

殘留分支 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update`：**不再合併**。

#### Closed issues（對照）

| Issue | 狀態 | 對本 fork |
| --- | --- | --- |
| [#8](https://github.com/xikhar/persona/issues/8) lighting | completed（#9） | 已有 per-model lighting |
| [#3](https://github.com/xikhar/persona/issues/3) Local AI usage | completed | 本機 MCP／整合文件已覆蓋；不執行內建 LLM |
| [#13](https://github.com/xikhar/persona/issues/13) macOS matcher | closed（#16） | 本 fork 不發行 macOS；不合併 Core Audio 修正 |

#### 本輪結論

- **無須從上游 PR／issue 引進程式合併。**
- Commit 水位推進至 `9287ea3`；目前無 open PR，#11 文件需求已由 VoxAvatar 涵蓋。下次從此水位後的新 commit 接續評估。

## 2. 音訊與本機整合

- 預設只分析指定應用程式的 WASAPI playback loopback 音量；`output` 模式須由使用者明確啟用，並警告它會涵蓋目前輸出裝置的所有聲音。
- 不擷取麥克風、不保存／傳送音訊、不轉錄。任何擴張都視為新的安全設計。
- MCP／HTTP bridge 僅綁定 loopback，限制 Host、origin、body、session 與 schema；不提供任意命令或任意檔案存取。
- MCP CLI、protocol 與環境變數分別使用 `voxavatar`、`voxavatar://`、`VOXAVATAR_*`。

## 3. 媒體與角色表現

- 安裝包預設不內建角色或動作。使用者本機匯入不代表專案具有再散布權；打包媒體須通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。
- 匯入先在 app-controlled 暫存檔完成有界 GLB／VRM／VRMA 驗證，再 atomic rename；失敗不得污染既有 catalog。
- 目錄品質報告是啟發式輔助，不能取代人工預覽或授權審查。VRM 與 VRMA 共用既有 quality-gate 設定鍵與分數門檻（淘汰／保留），避免平行設定漂移。
- Idle、Speaking、自訂動作與後續狀態／氣泡契約集中在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
- VRMA clip 可標註用途 `loop`／`one-shot`／`pose`（settings schema ≥7）；品質分析依用途套規則。

## 4. Electron 與狀態邊界

- Renderer 維持 sandbox、context isolation、無 Node integration；avatar 與 settings 使用不同 preload allowlist。
- Privileged IPC 驗證 sender URL；設定寫入另要求 settings 視窗的 `webContents`。
- MCP／protocol／HTTP 動作進入有界佇列，包含同名合併、容量上限與最小間隔。
- Settings 與 MCP `get_status` 共用 readiness、listener 狀態與診斷語彙；診斷必須移除使用者名、絕對路徑與媒體檔名，不包含音訊或模型內容。

## 5. 文件與開發環境

- `AGENTS.md` 是**所有** AI agent 的單一真相源（含工作流程與硬性邊界）。`CLAUDE.md` 與 `SKILL.md` 只作薄入口並指向 `AGENTS.md`，不複製完整規則；Cursor 技能載入器讀 `SKILL.md`，Claude 讀 `CLAUDE.md`，其餘 agent 直接讀 `AGENTS.md`。
- `README`、`ROADMAP`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁中為預設並提供英文版；內部維護文件只保留繁中（不另建英文平行檔，例如已刪除 `VRM_VRMA_COMPATIBILITY.en.md`）。
- `ROADMAP` 管未來與「目前健康」、`CHANGELOG` 管已完成；不另建平行計畫檔或獨立 `REVIEW.md`。
- 來源／授權摘要與上游評估水位寫在本檔 §1；不另建 `NOTICE.md`／`UPSTREAM_EVAL.md`。
- action-pack 契約寫在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)；Windows 實機驗收寫在 [`RELEASING.md`](RELEASING.md)。
- Settings「系統狀態動作槽」：有可播放 Idle／Speaking（或同名）時對尚未設定的鍵自動預選——**listening 槽預選綁到 idle**（無獨立 listening 系統動作）；使用者明確選「未綁定」（存成 `null`）不覆寫。使用者面向的 action-pack 說明與範例在 Settings 面板與 [`docs/examples/action-pack.example.json`](examples/action-pack.example.json)。
- 一般 Node／Electron／文件開發不要求 Visual Studio Build Tools。C++ helper 或本機 installer 才需 C++ toolchain；GitHub Windows runner 是正式 native 與 package gate。

## 6. 依賴與合併自動化

- Dependabot 高權限 workflow 必須 fail closed：只信任 `dependabot[bot]`、`main` base 與 base commit 上的 policy，並綁定 head SHA。
- 只有 CI 直接覆蓋的開發工具與 GitHub Actions minor／patch 可 guarded auto-merge；runtime、打包、渲染、major 與未知更新保留人工審查。

## 7. 版本與 Release

- 完成可交付工作後直接 commit／push `main`，並以 SemVer 更新 package、lockfile 與 CHANGELOG。
- `0.16.1` 維持 pre-1.0 版號；產品識別、Windows-only 邊界與公開契約雖已獨立成形，仍須完成路線圖中的 Windows 實機、簽署與真實素材相容證據，才評估進入 1.0。
- `main` 可累積多個版號再批次 Release；不為空轉或無實質變更建立 tag。
- Release tag 必須精確指向可信 `main` tip。已發布 tag 不 force-update；目前不要求以 repository ruleset 保護 tag。
- 新 Release 成功且成為 Latest 後才清理舊 Release／tag；失敗時保留舊版。
- Windows GUI、簽署與真機 capture 在缺少桌面或密鑰時不阻塞可自動驗證的開發，但未驗項目不得宣稱完成。

## 8. 相容與品質證據

- 合成 fixture 用於穩定重現 parser、品質 gate 與 rollback；真實 exporter 結論必須有版本與合法樣本證據。
- 自動 workflow 綠燈不能取代透明視窗、DPI、系統匣、音效裝置、SmartScreen 與安裝生命週期的 Windows 實機驗收。
- 只有具體測試、build、GitHub 狀態或人工紀錄才能標記完成；相關模板與判定見 [`RELEASING.md`](RELEASING.md)「Windows 發行驗收」。

## 9. Schema 版本政策

- **Settings**（`settings-migration.cjs`）：目前 `schema_version`＝9。允許清單內舊版（1–8）讀取時遷移並寫回；不在清單者備份為 `settings.json.unmigratable-backup` 並回報 `unsupported_schema`。升版須加 migration 路徑與 fixture 測試。
- **MCP tools／status**（`mcp-schemas.cjs`）：`tools_schema_version`／`status_schema_version` 隨工具契約變更遞增；成功與失敗皆回結構化 JSON。政策與相容說明見 [`INTEGRATIONS.md`](INTEGRATIONS.md)。
- **Packaged library／catalog**（`library-catalog.cjs`）：`schema_version` 必須精確等於 `PACKAGED_LIBRARY_SCHEMA_VERSION`（目前為 1）。不支援就地 migration；不匹配直接拒絕載入，避免半套 catalog 污染執行期。升版時改常數並同步 `library.json`／example／測試。
- **action-pack.json**：獨立 `schema_version`（見 `action-pack.cjs`）；匯入仍走 GLB／路徑／catalog gate，失敗項不覆寫既有動作。
