# 路線圖

> 本 repo 後續工作的單一真相源。做完一項，就在同一個 commit 刪掉那一列；新工作只加在這裡。
> 現況段的數字是 2026-11-08 依 `main` `5af7bcc` 查的快照，開工前先重查 GitHub。

## 現況

VoxAvatar：Windows-only、local-first 的 VRM 桌面角色，口型由語音輸出音量驅動，可經 loopback-only MCP 控制，私有（`AGENTS.md`、`docs/DECISIONS.md`）。健康：`main` 的 CI（2026-11-07 success）、CodeQL（2026-11-07 success）、Release（2026-11-07 success）、Dependabot guarded merge（2026-11-07 success）、Dependency freshness（2026-11-03 success）、Upstream check（2026-11-02 success）、Dependabot risk review（2026-11-03 success，跑在 Dependabot 的 PR 分支）最近一次皆 success，Dependabot Updates 則是 2026-11-03 failure（minimatch 傳遞依賴因 eslint/electron-builder 限制無法自動更新至修補版本）；open issue 1（#11 Dependency freshness 依賴追蹤：本輪 freshness 報告 0 項待處理——electron 45.1.0→45.2.1 為唯一實際升級（lock 內 eslint 10.14.0、typescript-eslint 8.72.1、electron-builder 26.18.1、globals 17.13.0 在 HEAD 就是這些版本，只把 package.json 下限對齊）；concurrently、electron 45.2.3、globals、vite、vitest 的新版未滿 7 天發布冷卻，維持原版並在 `.github/dependency-deferrals.json` 記冷卻到期時間；typescript、@types/node、three、@types/three、jsdom 記錄延後理由；npm audit 尚有 15 個 moderate 弱點（minimatch 經由 eslint/electron-builder 引入，非 runtime），依排程 workflow 保持開啟追蹤，不手動關閉）、open PR 0、Dependabot 與 Code scanning 告警 0；最新 release 是 v1.0.7（2026-09-30），`main` 之後已合併 Electron 45 升級與深掃修正尚未發版（`gh` 實查，2026-11-08）。卡住的是需要 Windows 桌面、簽署憑證或特殊環境的驗證，不是程式缺陷；已知的實機驗證缺口（打包版安裝、多 DPI、30% 角色、系統匣、移除、Idle 長跑、SmartScreen、真實 COM／WASAPI 失敗、其他 exporter 樣本）全部列在下方表格，未列入者視為沒有已知缺口。上游 `xikhar/persona` 的水位在 `ffd5cb0`（`scripts/upstream-baseline.json`），上游檢查沒有待審項目。

## 近期：可以直接動手
| 項目 | 為什麼 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| Electron 45 打包版 Windows 實機驗收（發下一版之前的必要條件） | Electron 44→45 升級只證明了啟動與自動化測試，打包安裝版的 VRM 外觀、VRMA 播放、嘴形、系統匣與 DPI 沒人看過；CI 看不到。2026-11-14 已先驗一部分（本機打包、未簽署的候選檔，不能取代發版時對 Release 產物做的 `windows-smoke.md`）：從 1.0.6 升級成功、使用者資料與設定保留；VRM 外觀、VRMA 播放（MCP `play_animation`）正常；`/health`、`tools/list` 正常，並實際操作 `list_animations`、`play_animation`、`control_window`、`get_status` 四個工具；原生 listener 單獨執行可讀到行程音量。尚未驗：app 內口型（見下一列）、系統匣、DPI、移除、SmartScreen（`docs/DECISIONS.md`「2026-11-14」） | 依 `docs/RELEASING.md` 實機章節逐項勾選；新增 `docs/release-evidence/<版本>/windows-smoke.md`，記錄 Windows build、DPI、安裝／啟動／系統匣／MCP／口型結果與截圖；任何一項失敗就開 issue 並暫緩發版 | 維護者 | `docs/DECISIONS.md`「2026-10-25：Electron 升到 45.0.0」之「未驗」段；commit `b096e23`；`docs/release-evidence/v1.0.7/windows-smoke.md`（上一版格式） |
| 查明 app 內口型沒反應：listener 一直回 `no_output` | 2026-11-14 實機：原生 helper 以 `--pid` 單獨擷取播放中的行程可讀到 0.7～0.8 的音量，但同一台機器上 app 的 `get_status` 一直是 `no_output`、`voiceState` 為 null；用 `VOXAVATAR_TARGET_PROCESS_PATTERN` 指向唯一名稱的播放行程，狀態仍從一開始就是 `no_output` 而不是找不到目標，覆寫看起來沒生效。可能是測試方法、行程挑選（sticky root）或覆寫讀取的問題，尚未定位 | 能重現或排除：寫出 app 實際挑到哪個 PID、為何沒收到音量；若是缺陷，修好並補測試；之後在實機播放 ChatGPT／Codex 朗讀時 `voiceState` 出現 speaking、停止後回到 idle | Codex | `docs/DECISIONS.md`「2026-11-14」；`electron/native-process-audio-listener.cjs:192-245`；`electron/voice-source.cjs:208` |

## 中期：等條件成立再做
| 項目 | 觸發條件 | 驗收方式 | 建議執行者 | 證據 |
| --- | --- | --- | --- | --- |
| 發佈下一版（v1.0.8 或維護者另訂） | 近期的 Electron 45 實機驗收通過 | 依 `docs/RELEASING.md`：`package.json` 版號與 tag 一致；Release workflow success；下載的 installer 與 `SHA256SUMS.txt` 核對 GitHub digest、本機 SHA-256、檔案大小與 PE Certificate Table；新增 `docs/release-evidence/v<版本>/`；`CHANGELOG.md` 與 README 的版本提及同步（`npm run docs:check` 會檢查） | 維護者 | `package.json:3`（1.0.7）；`gh release list -R SanHsien/voxavatar`；`docs/RELEASING.md:60-67,140-147` |
| 補完實機矩陣：100%／150% DPI、30% 角色尺寸、系統匣、鍵盤操作、移除、Idle 長跑與切換模型的記憶體基準、待機／說話洗牌輪播整輪可觀察的 clip ID | 維護者有一段完整的 Windows 桌面時間，且 Electron 45 實機驗收已完成 | 每項在 `docs/release-evidence/<版本>/windows-smoke.md` 有結果、截圖或量測值；洗牌輪播以可觀察的 clip ID 證明整輪不重複；無法驗證者明寫「未驗」與原因，不虛構完成 | 維護者 | `npm run baseline:startup`（`scripts/startup-baseline.cjs:123,133`，明寫不含 GUI 冷啟動、Idle、記憶體）；`docs/release-evidence/v1.0.7/windows-smoke.md`；`docs/CHARACTER_BEHAVIOR.md:157` |
| 安裝包簽署與 SmartScreen／publisher 驗收 | 維護者取得 code signing 憑證 | 正式資產 Authenticode 簽章有效、publisher 正確；SmartScreen 行為與升級路徑記入 `docs/release-evidence/`；`npm run evidence:verify` 與 README／SECURITY／About 的「未簽署」標示同步改寫 | 維護者 | `docs/release-evidence/v1.0.7/manifest.json`（正式資產 `NotSigned`）；`docs/RELEASING.md` |
| 真實 Native COM／WASAPI／Device／Event 失敗路徑與其他 exporter 樣本的人工結果 | 取得可控的 COM／WASAPI 失敗環境（如停用音訊服務、虛擬裝置），或取得授權明確的 VRoid／UniVRM／Blender 樣本 | 失敗路徑：真實 HRESULT 對應的 typed exit 與 `native_helper_*` 錯誤碼出現在 Settings 的人話提示；exporter：結果依 `docs/release-evidence/_templates/` 的 schema 填寫，另 3 個內建 VRM 切換與逐片段播放有證據；樣本授權先記入 `ASSET_LICENSES.md` | 維護者 | `docs/release-evidence/_templates/exporter-results.json`；`docs/DECISIONS.md:451` |
| 從 `docs/DECISIONS.md` 候選清單選下一個功能：Alt+drag 移動視窗（#25）、VRM meta 授權條款顯示（#29）、拖曳／環繞 secondary motion（#39／#42）、動作綁定 VRM 表情（#46／#35） | 上面的實機驗證缺口已關閉或明確降級；動作綁定表情須先定義與口型驅動的 expression 誰優先 | 選定一項後先在 `docs/DECISIONS.md` 寫規格與優先序；實作有契約測試；不放寬 local-first、loopback-only 邊界；`npm run check` 綠 | Claude Opus | `docs/DECISIONS.md:329-331`（候選清單）；`docs/DECISIONS.md:279`（#46／#49／#50／#54 候選，未實作） |

## 刻意不做
| 不做什麼 | 理由 | 什麼情況下重新考慮 |
| --- | --- | --- |
| 麥克風擷取、錄音、轉錄、音訊保存或上傳；將 MCP／HTTP bridge 開到 LAN／Internet 或加入任意命令／檔案存取；從聊天畫面或音訊推測文字、情緒；在 VoxAvatar 內執行 LLM 或保存聊天歷史 | 這是產品的硬性邊界（local-first、loopback-only、音量驅動口型），上游含麥克風的 PR #45 也因此不合併 | 維護者明確改變產品定位並重寫 `SECURITY.md` |
| VRoid Hub 帳號整合、macOS／Linux 發行、散布未確認授權的 VRM／VRMA、整包併入上游的大型子系統（Kimodo #70、動畫排程器 #23、TypeScript 遷移 #51） | 牴觸 local-first 與 Windows-only，或授權不明，或與本 fork 已驗證的實作重複（`docs/DECISIONS.md` §1 逐項判定） | 上游變更縮小到可個別評估，或維護者改變範圍；先讀 `docs/DECISIONS.md` 對應列 |
| 升級 `typescript` 到 7 | `typescript-eslint` 8.72.1 的 peer 範圍（`<6.1.0`）不含 TypeScript 7，升了 lint 會壞 | `typescript-eslint` 支援 TypeScript 7（`.github/dependency-deferrals.json` 會在版本變動時自動重新提醒） |
| 升級 `@types/node` 到 26 | CI 以 Node 24 建置，Node 26 型別可能暴露建置 runtime 沒有的 API | CI 與支援的 runtime 升到 Node 26 |
| 升級 `three` 到 0.187 及 `@types/three` | three r187（2026-10-30）的 release notes 列有移除 r177 起的棄用程式碼、以 cube render target 取代 PMREMGenerator 的 CubeUV atlas、修正色彩空間轉換矩陣順序（<https://github.com/mrdoob/three.js/releases/tag/r187>；遷移指南 <https://github.com/mrdoob/three.js/wiki/Migration-Guide#186--187>），尚未在 Windows 桌面對 VRM 載入、VRMA 播放、口型與效能基準實跑；`@types/three` 須與安裝的 three 同步 | Windows 桌面實跑 VRM 載入、VRMA 播放、口型與效能基準後記錄結果（`.github/dependency-deferrals.json` 會在版本變動時自動重新提醒） |
| 升級 `jsdom` 到 31 | jsdom 31.0.0 是主要版本，2026-11-05 發布，仍在 7 天發布冷卻內，尚未對本 repo 的 Vitest renderer 測試實跑 | 冷卻到期（2026-11-12）後升級並實跑 `npm run check`，無回歸才落地（`.github/dependency-deferrals.json` 會在版本變動時自動重新提醒） |

## 維護方式
fork 追蹤 `xikhar/persona`：Upstream check 每週一 11:07（Asia/Taipei）比對 `scripts/upstream-baseline.json` 的 `reviewedThrough`，有新項目才開 issue；逐項判定為採用、不合併、已涵蓋、範圍外或待評估並寫進 `docs/DECISIONS.md` §1，推進水位。failure 代表上游有未審項目，不是工具壞。Dependabot 週更；判斷過暫不升的套件記在 `.github/dependency-deferrals.json`，綁定當時版本、版本變動自動失效；升 Electron 時務必同步改 `allowScripts` 的鍵。查現況：`gh issue list -R SanHsien/voxavatar`、`gh api repos/SanHsien/voxavatar/dependabot/alerts?state=open`、`gh run list -R SanHsien/voxavatar -b main -L 8`。
