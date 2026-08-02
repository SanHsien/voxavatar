# 上游評估紀錄（xikhar/persona）

最後評估：2026-08-02  
遠端：`https://github.com/xikhar/persona.git`（`upstream`）  
評估規則：只挑選符合 VoxAvatar Windows-only／隱私／媒體授權／識別邊界的變更；不整包 merge 已 squash 殘留分支。產品邊界見 [`DECISIONS.md`](DECISIONS.md) 與 [`AGENTS.md`](../AGENTS.md)。

## 水位

| 項目 | 值 |
| --- | --- |
| `upstream/main` tip（commit 水位） | `cf27d12`（#15，2026-08-01） |
| 下次接續 | tip 之後的新 commit；以及仍為 open 的 issue／PR 再掃一次 |
| Open PR／issue 本輪掃描 | 2026-08-02 |

## 評估流程（本 repo）

1. `git fetch upstream main`，列出水位之後的 commit。
2. `gh pr list`／`gh issue list` 掃 open（必要時對照近期 merged／closed）。
3. 對每一項標 **採用／部分採用／不合併／已涵蓋／範圍外**，並寫理由。
4. 需要程式變更才動手；僅文件決策也要更新本檔與 [`DECISIONS.md`](DECISIONS.md) 水位。
5. 不把上游 `PERSONA_*`、PipeWire、Hyprland、macOS native、`demo.jpg`（無再散布確認）或授權檔路徑大搬遷直接合入。

## Open PR

| PR | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#16](https://github.com/xikhar/persona/pull/16) | fix: stabilize Core Audio tap lifecycle against ChatGPT worker churn | **不合併**（範圍外） | 變更限 `native/macos/*` 與 darwin 路徑的 tap lifecycle（`resolvedPids`／穩定 capture key）。VoxAvatar Windows listener 已對 **單一 sticky root PID** 建 tap（`selectStickyRootPid`＋`captureKey`），不存在「descendant worker churn 重開 Core Audio tap」問題。合併會引入 macOS 程式與測試，違反 Windows-only。若未來 Windows 出現類似「多 PID 重綁」需求，應在 WASAPI 路徑單獨設計，不 cherry-pick 此 PR。 |

## Open issues

| Issue | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#13](https://github.com/xikhar/persona/issues/13) | Built-in ChatGPT/Codex matcher can prevent ChatGPT Voice from starting on macOS | **範圍外** | 僅 macOS Core Audio／ChatGPT Voice 啟動競態；本 fork 不發行 macOS。追蹤上游由 #16 處理。Windows 使用者若遇語音來源不穩，維持既有 sticky root、External 模式與系統輸出 opt-in 邊界，不因此恢復 macOS helper。 |
| [#11](https://github.com/xikhar/persona/issues/11) | Docs: first-run guide for getting a VRM avatar and VRMA animations | **已涵蓋** | 需求為「首次如何取得／匯入 VRM／VRMA」。本 fork README「快速開始」＋ VRoid Hub／BOOTH／Studio 連結、[`ASSET_LICENSES.md`](../ASSET_LICENSES.md)、[`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md) 已覆蓋；追蹤 issue [`SanHsien/voxavatar#1`](https://github.com/SanHsien/voxavatar/issues/1) 已關閉。無需再合上游文件。 |

## 已評估的 merged commit／PR（摘要）

| 對象 | 結論 | 備註 |
| --- | --- | --- |
| #12 → `327c8ca` | **部分採用** | 手動移植 Windows 語音來源；不收 PipeWire／macOS／跨平台包裝／`PERSONA_*` |
| #14 → `a72292f` | **不合併** | 維持根目錄 `ASSET_LICENSES.md`；不引入 `demo.jpg`；不搬到 `public/assets/LICENSES.md` |
| #15 → `cf27d12` | **不合併** | 僅調整上游 `demo.jpg` 顯示 |
| #10、`5bd380e` 等語音／lighting 基線 | **已在 fork** | 語音來源、per-model lighting 等已落地為 VoxAvatar 行為 |
| #1–#7、#9 等早期 PR | **不重併** | 對應殘留分支政策：已 squash 進上游 `main` 者不再整包合併 |

殘留分支 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update`：**不再合併**（見 DECISIONS §1）。

## Closed issues（對照）

| Issue | 狀態 | 對本 fork |
| --- | --- | --- |
| [#8](https://github.com/xikhar/persona/issues/8) lighting | completed（#9） | 已有 per-model lighting |
| [#3](https://github.com/xikhar/persona/issues/3) Local AI usage | completed | 本機 MCP／整合文件已覆蓋；不執行內建 LLM |

## 本輪結論

- **無須從上游 PR／issue 引進程式合併。**
- Commit 水位維持 `cf27d12`；open 項已建檔，下次先看 #16 是否 merge 進上游 `main`（仍預期跳過 macOS 本體，只留意是否夾帶 Windows 共用 listener 重構）。
