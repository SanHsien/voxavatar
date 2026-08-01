# VoxAvatar 決策紀錄

本檔記錄相對上游與維護流程的重要決策。日期均為 2026-08-01；歷史發行細節見 [`CHANGELOG.md`](../CHANGELOG.md)。

## D-01｜文件語言

使用者文件 `README`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁體中文為預設，提供 `*.en.md`。其餘維護文件使用繁中，避免雙份內部文件漂移。

## D-02｜上游同步

不再合併 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update`：這些分支已透過上游 squash PR 進入 main，再合會產生重複歷史與大量衝突。後續只挑選可驗證且符合 Windows-only 邊界的上游變更。

## D-03｜Windows-only

產品識別固定為 VoxAvatar／`voxavatar`，只維護 Windows WASAPI、NSIS 與桌面行為。不恢復 PipeWire、Hyprland、macOS native、Linux／macOS CI 或發行目標。

## D-04｜語音資料邊界

只從使用者選定應用程式的 WASAPI playback loopback 計算記憶體內音量；不擷取麥克風、不保存／傳送音訊、不轉錄。任何擴張都視為新的安全設計，而非一般功能。

## D-05｜本機整合邊界

MCP 與 HTTP bridge 只綁定 loopback，限制 Host、origin、body 與 schema；不提供任意命令或檔案存取。MCP CLI 名稱、protocol 與環境變數分別固定為 `voxavatar`、`voxavatar://`、`VOXAVATAR_*`。

## D-06｜Windows 語音來源選擇

從上游 #12 手動移植 application、external、可搜尋來源與設定 schema；不整包帶入 PipeWire、macOS 或舊產品識別。

## D-07｜不內建角色 VRM

`public/assets/library.json` 預設沒有 model，首次啟動開啟設定並引導使用者合法下載後本機匯入。這避免品質不佳的強制預設，也縮小第三方再散布風險。

## D-08｜不內建 Idle／Speaking VRMA

程序產生動作品質僵硬，官方 VRoid VRMA 又限制可取出原檔再配布，因此系統動作槽保留但媒體為空。使用者可本機匯入；Release 內建媒體須通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。

## D-09｜動作與桌面互動

Idle 從可用非說話動作池隨機抽播並避免立即重複。透明區點穿；角色本體支援左鍵拖曳、滾輪縮放、中鍵旋轉、右鍵選單；系統匣左右鍵分工保持 Windows 可靠性。

## D-10｜自訂動作與品質報告

動作以名稱、描述、觸發情境與多個 VRMA 片段組成；MCP 即時看到 catalog。目錄匯入品質把關是啟發式報告，可選全收、嚴格略過或關閉，不能取代人工預覽或授權審查。

## D-11｜開發與協作入口

`AGENTS.md` 是 agent 單一真相源，`CLAUDE.md` 是薄入口；另維護 `SKILL.md`、`REVIEW.md`、EditorConfig、issue／PR templates、CI、CodeQL 與文件驗證。專案採中英行為準則，以清楚執行原則取代過去「不維護社群準則」決定。

## D-12｜依賴自動化

Dependabot 可使用高權限 workflow，但必須 fail closed：只信任 `dependabot[bot]`、`main` base 與 base commit 上的 policy；以 semver、檔案範圍與 allowlist 分類；policy check 綁定 head SHA；必要 CI／CodeQL 全綠後再核准與 squash。runtime、打包、渲染、major 與未知更新人工審查。

## D-13｜完成即推 main 並發布

主人要求完成後直接 push `main`，接著主動 bump 版本、更新 CHANGELOG、推 tag，並驗證 published GitHub Release、Latest、target commit 與資產。tag 本身不算完成。

## D-14｜第一個穩定版本

`0.1.0-beta.10` 後以 `0.1.0` 作為第一個 stable release。理由是主要 Windows 使用流程、local-first 安全邊界、MCP、媒體管理、CI／CodeQL、guarded dependency automation 與正式安裝包已形成可驗證基線；不直接跳 `1.0.0`，避免過早承諾所有設定與整合 schema 長期不變。
