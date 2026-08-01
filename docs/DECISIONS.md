# VoxAvatar 決策紀錄

本檔記錄相對上游與維護流程的重要決策。日期均為 2026-08-01；歷史發行細節見 [`CHANGELOG.md`](../CHANGELOG.md)。

## D-01｜文件語言

公開文件 `README`、`ROADMAP`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁體中文為預設，提供 `*.en.md`。其餘維護文件使用繁中，避免雙份內部文件漂移。

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

## D-15｜路線圖與開發工具鏈

以雙語 `ROADMAP.md`／`ROADMAP.en.md` 作為公開產品方向，取代較薄且容易與 review 重複的 `PLAN.md`；`REVIEW.md` 只保留最新健康狀態，`CHANGELOG.md` 只記已完成版本。

一般 Node／Electron／文件開發不要求本機 Visual Studio Build Tools。C++ helper 變更與本機 installer 才需要 C++ toolchain；GitHub Windows runner 是正式 native build／self-test／NSIS gate，下載後的 Windows GUI smoke 仍由真實桌面完成。

## D-16｜程式與媒體授權分離

`LICENSE` 保持可被工具辨識的 canonical MIT 全文。第三方 VRM、VRMA、圖片與環境資產的排除、來源及再散布條件集中在 `NOTICE.md` 與 `ASSET_LICENSES.md`；移除 LICENSE 尾端的自訂句子不會把第三方媒體改授權為 MIT。

## D-17｜Release 與素材匯入信任邊界

Release 可由可信 `main` 的 `workflow_dispatch`，或在 **push `main` 且 `v{package.version}` tag 已精確指向該 tip** 時自動打包（供無法 dispatch 的自動化／agent 使用；一般無 tip tag 的 `main` push 略過）。不以 tag ref 觸發 packaging，因 `release` environment 的部署分支政策只允許 `main`。執行前驗證 workflow／遠端 `main`／tag commit 相同，後續 checkout 固定該 SHA，發布前再驗 tag 未移動。checkout 不保留 credentials，只有 publish job 取得 `contents: write`；已發布 tag 另由 active tag ruleset 禁止 force-update（刪除舊版僅在新版成功後、政策允許時暫關 ruleset）。素材匯入先複製到 app-controlled 暫存檔，再從同一個 file descriptor 驗證實際／宣告 GLB 長度、bounded JSON chunk、glTF 2.0 與 VRM／VRMA extension，最後 atomic rename；renderer 載入錯誤必須保留可回復的設定入口。

## D-18｜輸出裝置全音監聽（opt-in）

- **日期**：2026-08-01
- **決定**：語音來源新增 `output` 模式，以 WASAPI 預設 render endpoint loopback 監聽目前輸出裝置混音。預設仍為指定應用程式／自動偵測。
- **隱私**：必須在 Settings 明示「隱私邊界警告」——會聽到音樂、影片、遊戲、系統音與其他應用，不只語音助理；音量僅本機轉口型／動作、不上傳。使用者需主動選擇該模式。
- **配套**：角色縮放最小 30%；Idle 間隔預設 8 秒（可調 2–60 秒）；VRMA 品質門檻淘汰低於 60、保留 75 以上，預設嚴格模式；匣／右鍵／設定提供「關於」顯示版本。

## D-19｜每次 push 的文件檢討與中斷接續

- **日期**：2026-08-01
- **決定**：每次 commit／push 前必須檢討 `CHANGELOG`、雙語 `README`／`ROADMAP`／`SECURITY`、`REVIEW`、`docs/DECISIONS` 及相關流程文件；無變更也要確認已檢討。Agent 在對話壓縮或工具中斷後必須自動接續未完成工作，不得等主人再次提醒。
- **發行清理**：新版 GitHub Release 成功後才刪除其餘舊 Release／tag，只保留最新；失敗則保留舊版。不可變 tag 的「禁止 force-update」仍成立；刪除舊 tag 僅在主人政策允許且新版已驗證成功時執行。
- **權威來源**：[`AGENTS.md`](../AGENTS.md)、[`.cursorrules`](../.cursorrules)、[`ROADMAP.md`](../ROADMAP.md) 執行規則。

## D-20｜VRM 目錄評估匯入共用品質 gate

- **日期**：2026-08-01
- **決定**：VRM 從目錄匯入比照 VRMA，共用 `vrma_quality_gate`／`vrma_report_dir`（不另開設定鍵）。報告檔名為 `voxavatar-vrm-report.md`；評分檢查 VRM 擴充、humanoid、mesh、體積與粗估三角面等。單檔選 VRM 仍只做 GLB／extension 驗證。
- **嚴格模式**：`verdict === reject` 不匯入；`report` 仍全部匯入並寫報告；`off` 不做分析。
