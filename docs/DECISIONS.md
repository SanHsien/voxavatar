# VoxAvatar 現行決策

最後修訂：2026-08-02

本檔只保留仍影響實作的取捨，不重述版本歷史、操作步驟或路線圖。歷史見 [`CHANGELOG.md`](../CHANGELOG.md)，未來工作與目前健康見 [`ROADMAP.md`](../ROADMAP.md)，具體發行流程見 [`RELEASING.md`](RELEASING.md)。

## 1. 產品與上游

- 顯示名為 **VoxAvatar**，識別字串為 `voxavatar`；產品只維護 Windows Electron、WASAPI 與 NSIS。
- 上游為 `xikhar/persona`，保留 MIT 與 attribution。已 squash 的 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update` 不再合併，只挑選符合本 fork 邊界的變更。
- 硬性不收：PipeWire／Hyprland／macOS native、`PERSONA_*` 識別、未確認再散布權的上游 `demo.jpg`、把授權政策搬離根目錄 `ASSET_LICENSES.md`。
- VoxAvatar 是桌面角色呈現層，不在應用程式內執行 LLM、保存聊天紀錄或取代聊天客戶端。

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
| `upstream/main` tip（commit 水位） | `cf27d12`（#15，2026-08-01） |
| 下次接續 | tip 之後的新 commit；以及仍為 open 的 issue／PR 再掃一次 |
| Open PR／issue 本輪掃描 | 2026-08-02 |

#### 評估流程

1. `git fetch upstream main`，列出水位之後的 commit。
2. `gh pr list`／`gh issue list` 掃 open（必要時對照近期 merged／closed）。
3. 對每一項標 **採用／部分採用／不合併／已涵蓋／範圍外**，並寫理由。
4. 需要程式變更才動手；僅文件決策也要更新本節水位。
5. 不把上游 `PERSONA_*`、PipeWire、Hyprland、macOS native、`demo.jpg`（無再散布確認）或授權檔路徑大搬遷直接合入。

#### Open PR

| PR | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#16](https://github.com/xikhar/persona/pull/16) | fix: stabilize Core Audio tap lifecycle against ChatGPT worker churn | **不合併**（範圍外） | 變更限 `native/macos/*` 與 darwin 路徑的 tap lifecycle（`resolvedPids`／穩定 capture key）。VoxAvatar Windows listener 已對 **單一 sticky root PID** 建 tap（`selectStickyRootPid`＋`captureKey`），不存在「descendant worker churn 重開 Core Audio tap」問題。合併會引入 macOS 程式與測試，違反 Windows-only。若未來 Windows 出現類似「多 PID 重綁」需求，應在 WASAPI 路徑單獨設計，不 cherry-pick 此 PR。 |

#### Open issues

| Issue | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#13](https://github.com/xikhar/persona/issues/13) | Built-in ChatGPT/Codex matcher can prevent ChatGPT Voice from starting on macOS | **範圍外** | 僅 macOS Core Audio／ChatGPT Voice 啟動競態；本 fork 不發行 macOS。追蹤上游由 #16 處理。Windows 使用者若遇語音來源不穩，維持既有 sticky root、External 模式與系統輸出 opt-in 邊界，不因此恢復 macOS helper。 |
| [#11](https://github.com/xikhar/persona/issues/11) | Docs: first-run guide for getting a VRM avatar and VRMA animations | **已涵蓋** | 需求為「首次如何取得／匯入 VRM／VRMA」。本 fork README「快速開始」＋ VRoid Hub／BOOTH／Studio 連結、[`ASSET_LICENSES.md`](../ASSET_LICENSES.md)、[`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md) 已覆蓋；追蹤 issue [`SanHsien/voxavatar#1`](https://github.com/SanHsien/voxavatar/issues/1) 已關閉。無需再合上游文件。 |

#### 已評估的 merged commit／PR（摘要）

| 對象 | 結論 | 備註 |
| --- | --- | --- |
| #12 → `327c8ca` | **部分採用** | 手動移植 Windows 語音來源；不收 PipeWire／macOS／跨平台包裝／`PERSONA_*` |
| #14 → `a72292f` | **不合併** | 維持根目錄 `ASSET_LICENSES.md`；不引入 `demo.jpg`；不搬到 `public/assets/LICENSES.md` |
| #15 → `cf27d12` | **不合併** | 僅調整上游 `demo.jpg` 顯示 |
| #10、`5bd380e` 等語音／lighting 基線 | **已在 fork** | 語音來源、per-model lighting 等已落地為 VoxAvatar 行為 |
| #1–#7、#9 等早期 PR | **不重併** | 對應殘留分支政策：已 squash 進上游 `main` 者不再整包合併 |

殘留分支 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update`：**不再合併**。

#### Closed issues（對照）

| Issue | 狀態 | 對本 fork |
| --- | --- | --- |
| [#8](https://github.com/xikhar/persona/issues/8) lighting | completed（#9） | 已有 per-model lighting |
| [#3](https://github.com/xikhar/persona/issues/3) Local AI usage | completed | 本機 MCP／整合文件已覆蓋；不執行內建 LLM |

#### 本輪結論

- **無須從上游 PR／issue 引進程式合併。**
- Commit 水位維持 `cf27d12`；open 項已建檔，下次先看 #16 是否 merge 進上游 `main`（仍預期跳過 macOS 本體，只留意是否夾帶 Windows 共用 listener 重構）。

## 2. 音訊與本機整合

- 預設只分析指定應用程式的 WASAPI playback loopback 音量；`output` 模式須由使用者明確啟用，並警告它會涵蓋目前輸出裝置的所有聲音。
- 不擷取麥克風、不保存／傳送音訊、不轉錄。任何擴張都視為新的安全設計。
- MCP／HTTP bridge 僅綁定 loopback，限制 Host、origin、body、session 與 schema；不提供任意命令或任意檔案存取。
- MCP CLI、protocol 與環境變數分別使用 `voxavatar`、`voxavatar://`、`VOXAVATAR_*`。

## 3. 媒體與角色表現

- 安裝包預設不內建角色或動作。使用者本機匯入不代表專案具有再散布權；打包媒體須通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。
- 匯入先在 app-controlled 暫存檔完成有界 GLB／VRM／VRMA 驗證，再 atomic rename；失敗不得污染既有 catalog。
- 目錄品質報告是啟發式輔助，不能取代人工預覽或授權審查。VRM 與 VRMA 共用既有 quality-gate 設定鍵，避免平行設定漂移。
- Idle、Speaking、自訂動作與後續狀態／氣泡契約集中在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
- VRMA clip 可標註用途 `loop`／`one-shot`／`pose`（settings schema ≥7）；品質分析依用途套規則。

## 4. Electron 與狀態邊界

- Renderer 維持 sandbox、context isolation、無 Node integration；avatar 與 settings 使用不同 preload allowlist。
- Privileged IPC 驗證 sender URL；設定寫入另要求 settings 視窗的 `webContents`。
- MCP／protocol／HTTP 動作進入有界佇列，包含同名合併、容量上限與最小間隔。
- Settings 與 MCP `get_status` 共用 readiness、listener 狀態與診斷語彙；診斷必須移除使用者名、絕對路徑與媒體檔名，不包含音訊或模型內容。

## 5. 文件與開發環境

- `AGENTS.md` 是 agent 單一真相源；`CLAUDE.md` 只作入口，不複製完整規則（原獨立 `SKILL.md` 已併入）。
- `README`、`ROADMAP`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁中為預設並提供英文版；內部維護文件只保留繁中（不另建英文平行檔，例如已刪除 `VRM_VRMA_COMPATIBILITY.en.md`）。
- `ROADMAP` 管未來與「目前健康」、`CHANGELOG` 管已完成；不另建平行計畫檔或獨立 `REVIEW.md`。
- 來源／授權摘要與上游評估水位寫在本檔 §1；不另建 `NOTICE.md`／`UPSTREAM_EVAL.md`。
- action-pack 契約寫在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)；Windows 實機驗收寫在 [`RELEASING.md`](RELEASING.md)。
- 一般 Node／Electron／文件開發不要求 Visual Studio Build Tools。C++ helper 或本機 installer 才需 C++ toolchain；GitHub Windows runner 是正式 native 與 package gate。

## 6. 依賴與合併自動化

- Dependabot 高權限 workflow 必須 fail closed：只信任 `dependabot[bot]`、`main` base 與 base commit 上的 policy，並綁定 head SHA。
- 只有 CI 直接覆蓋的開發工具與 GitHub Actions minor／patch 可 guarded auto-merge；runtime、打包、渲染、major 與未知更新保留人工審查。

## 7. 版本與 Release

- 完成可交付工作後直接 commit／push `main`，並以 SemVer 更新 package、lockfile 與 CHANGELOG。
- `main` 可累積多個版號再批次 Release；不為空轉或無實質變更建立 tag。
- Release tag 必須精確指向可信 `main` tip。已發布 tag 不 force-update；目前不要求以 repository ruleset 保護 tag。
- 新 Release 成功且成為 Latest 後才清理舊 Release／tag；失敗時保留舊版。
- Windows GUI、簽署與真機 capture 在缺少桌面或密鑰時不阻塞可自動驗證的開發，但未驗項目不得宣稱完成。

## 8. 相容與品質證據

- 合成 fixture 用於穩定重現 parser、品質 gate 與 rollback；真實 exporter 結論必須有版本與合法樣本證據。
- 自動 workflow 綠燈不能取代透明視窗、DPI、系統匣、音效裝置、SmartScreen 與安裝生命週期的 Windows 實機驗收。
- 只有具體測試、build、GitHub 狀態或人工紀錄才能標記完成；相關模板與判定見 [`RELEASING.md`](RELEASING.md)「Windows 發行驗收」。
