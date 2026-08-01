# 更新紀錄

本檔記錄使用者與維護者可觀察的重要變更。版本 tag 與 `package.json` 必須一致。

## 0.2.9 - 2026-08-01

- README：核實後將已落地能力併入功能一覽並簡化；「相對上游」改為短政策註（Windows-only、識別改名、預設不內建媒體）。
- avatar／settings preload 分權；設定寫入 IPC 綁定 settings 視窗 webContents。
- MCP／protocol／HTTP 動作指令改走有界佇列（同名合併、容量上限、最小間隔）。
- 同步 SECURITY／DEVELOPMENT／INTEGRATIONS／ROADMAP／REVIEW。

## 0.2.8 - 2026-08-01

- 雙語 README 補回「相對上游的獨有能力」專節：Windows-only 識別、桌面互動、語音／helper、素材品質把關、首次設定／診斷、MCP 硬化與發行基線；隱私邊界同步系統輸出 opt-in 說明。

## 0.2.7 - 2026-08-01

- 首次設定進度清單（模型／可選動作／語音／MCP）與「複製診斷摘要」（遮罩使用者名、路徑、`.vrm`／`.vrma` 檔名）。
- Native helper 明確狀態：`missing`／`launch_failed`／`target_missing`／`no_output`／`listening`；設定頁與 MCP `get_status` 共用 readiness schema。
- 雙語 README 功能一覽同步獨有能力（系統輸出語音、品質把關、readiness／診斷）。

## 0.2.6 - 2026-08-01

- 修正 VRM 品質報告：VRM 0.x 的 `humanBones` 為陣列時誤把索引當骨名，導致「humanoid 54 卻覆蓋 0／13」、分數 80 卻判觀察；現正確解析陣列／物件兩種格式。

## 0.2.5 - 2026-08-01

- Release 改為在 push `main` 且 tip 已有對應 `v{version}` tag 時自動打包（避開 `release` environment 只允許 `main` 部署、tag ref 無法進 packaging 的限制）；一般無 tip tag 的 `main` push 略過。
- 含 `0.2.3`／`0.2.4`：VRM 目錄評估匯入；先前 tag-push 觸發路徑已汰換。

## 0.2.4 - 2026-08-01

- Release 曾支援 `v*` tag push 自動打包；因 environment 分支政策改由 `0.2.5` 的 main-tip 路徑取代。
- 含 `0.2.3`：VRM 目錄評估匯入共用品質把關與 `voxavatar-vrm-report.md`。

## 0.2.3 - 2026-08-01

- 模型目錄匯入比照動作：共用品質把關（report／strict／off），新增 VRM 啟發式評分與 `voxavatar-vrm-report.md`；嚴格模式略過淘汰檔。
- 設定頁模型區可調整同一把關設定；匯入通知顯示保留／觀察／淘汰摘要。

## 0.2.2 - 2026-08-01

- 將「每次 push 前文件檢討」與「中斷後自動接續未完成工作」寫入 `AGENTS.md`、`.cursorrules`、`CLAUDE.md`、雙語 ROADMAP／CONTRIBUTING、`docs/DECISIONS.md`（D-19）與 `docs/RELEASING.md`。
- README 同步系統匣／角色右鍵含「重設視角」，專案狀態改以 `v0.2.x` 為準。
- 發行政策：新版成功後只保留最新 Release／tag；清理時可暫關 immutable tag ruleset，完成後恢復。

## 0.2.1 - 2026-08-01

- 系統匣右鍵選單補回「重設視角」（角色可見時可用）；與角色本體右鍵共用同一重置路徑。

## 0.2.0 - 2026-08-01

- Process discovery 改為 PID 存活快路徑與 adaptive backoff；多 root 採 sticky active source。
- 自訂 process matcher 改為有界安全子集，拒絕巢狀／堆疊量詞與過長 pattern。
- MCP session 新增 idle TTL（30 分）與容量上限（32），並可 sweep 淘汰。
- Privileged IPC 統一驗證 renderer sender URL；移除無效的 `strict-allow-scripts` npmrc 假防線。
- 同步 SECURITY／REVIEW／雙語 ROADMAP：SemVer 改以 minor 推進能力與邊界強化，規劃基準改為 `v0.2.0`。

## 0.1.2 - 2026-08-01

- 角色縮放下限改為 30%；設定滑桿與驗證一致。
- VRMA 品質把關預設改為嚴格（拒絕分數低於 60、保留至少 75）；報告文案同步。
- 新增 Idle 休息間隔設定（預設 8 秒，可調 2–60 秒）；動作播完後再休息。
- 語音來源新增「系統輸出」模式（WASAPI loopback），設定頁標示隱私邊界警告；決策見 D-18。
- 系統匣／右鍵與設定側欄新增「關於」，顯示應用程式版本號。
- 路線圖已完成項改為勾選，對齊目前產品狀態。

## 0.1.1 - 2026-08-01

- 重寫繁中／英文 README，新增可驗證徽章、產品定位、架構、安全邊界、MCP 使用、開發分流、文件導覽與專案狀態。
- 以雙語 `ROADMAP` 取代薄弱的 `PLAN`，新增版本里程碑、完成條件、風險、非目標、Windows 實機驗收與 Release evidence 規範；同步更新 review、決策與 agent 指引。
- 強化 Release 信任根：只從 `main` dispatch，固定可信 SHA、重驗 immutable tag、隔離 `release` environment、最小化權限，並將 GitHub Actions 鎖定完整 commit SHA。
- 強化 VRM／VRMA 匯入：先複製再完整驗證 GLB／extension 並 atomic rename；Scene 載入失敗改為可復原畫面，避免壞素材拖垮設定頁。
- 清除 Windows-only 專案中的 Darwin／PipeWire 語音來源殘留，並讓 HTTP events／MCP POST 拒絕非 JSON media type。
- 恢復 canonical MIT license 偵測、啟用 Dependabot security alerts／自動安全修補建議，並補齊文件、workflow 與 recovery regression tests。

## 0.1.0 - 2026-08-01

- **第一個 stable release**：Windows overlay、WASAPI 語音輸出口型、本機 VRM／VRMA 管理、MCP／HTTP／URL protocol 與中英設定介面進入穩定基線。
- 整合本 fork 的獨有功能：透明區點穿、可靠系統匣、目錄批次匯入、VRMA 品質報告、一鍵清除、自訂動作與常用動作預設。
- 專案維護基線包含完整中英文件、行為準則、Markdown／資產閘門、CI、CodeQL、Dependabot guarded auto-merge、Windows NSIS 與 SHA-256 Release 驗證。
- 穩定版不代表凍結未來設定或 MCP schema；不相容變更仍會依 SemVer 提升 minor／major 並記錄遷移方式。

## 0.1.0-beta.10 - 2026-08-01

- 修正 guarded Dependabot workflow 未指定 `GH_REPO`，導致空佇列在非 checkout job 中誤判失敗。

## 0.1.0-beta.9 - 2026-08-01

- 重整中英 README、貢獻、安全、行為準則與維護文件，建立清楚的使用者／開發者／整合／發行資訊分工。
- 新增 Markdown 連結、控制字元、檔尾與舊 MCP 名稱檢查，納入 `npm run check`。
- 新增 EditorConfig、issue／PR templates、Dependabot、CodeQL 與 fail-closed guarded auto-merge policy。

## 0.1.0-beta.8 - 2026-08-01

- 設定頁新增常用動作預設，可預覽、套用到表單或直接建立 MCP 可見動作。
- README 補齊目錄匯入、品質把關、一鍵刪除、自訂動作與 `voxavatar` MCP 名稱。

## 0.1.0-beta.7 - 2026-08-01

- 新增一鍵刪除全部使用者 VRM／VRMA；刪除前確認，清除片段時保留動作槽。

## 0.1.0-beta.6 - 2026-08-01

- 清除產品程式碼、設定鍵、樣式、測試與範例中的舊 `persona` 識別；保留上游 attribution。

## 0.1.0-beta.5 - 2026-08-01

- 新增 VRM／VRMA 目錄遞迴匯入、VRMA 品質模式、Markdown 報告與自訂報告位置。
- Codex MCP 註冊名稱改為 `voxavatar`。

## 0.1.0-beta.4 - 2026-08-01

- 移除僵硬的預設 Idle VRMA；安裝包不再內建 Idle／Speaking 動作媒體。

## 0.1.0-beta.3 - 2026-08-01

- VRM 名稱改為選填，空白時使用檔名；修正選檔視窗被置頂角色遮擋。
- 設定介面與桌面選單支援繁中／英文。

## 0.1.0-beta.2 - 2026-08-01

- 移除安裝包內建角色；首次啟動改為顯示合法下載與本機匯入指引。
- beta tag 發布為可見 Latest GitHub Release。

## 0.1.0-beta.1 - 2026-08-01

- 新增透明區點穿、角色拖曳、滾輪縮放、中鍵旋轉、右鍵選單與可靠系統匣操作。
- 新增多段待機動作輪播與介面語系設定。

## 0.1.0-beta.0 - 2026-08-01

- 從 `xikhar/persona` 建立 Windows-only VoxAvatar fork。
- 提供 WASAPI process loopback、VRM renderer、設定頁、本機 MCP 與 HTTP bridge。
- 建立繁中預設／英文對照文件與 Windows Release 流程。
