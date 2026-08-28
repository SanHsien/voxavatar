# VoxAvatar 現行決策

最後修訂：2026-08-28

本檔只保留仍影響實作的取捨，不重述版本歷史、操作步驟或路線圖。歷史見 [`CHANGELOG.md`](../CHANGELOG.md)，未來工作與目前健康見 [`ROADMAP.md`](../ROADMAP.md)，具體發行流程見 [`RELEASING.md`](RELEASING.md)。

## 2026-08-28：水位 `5f0ab50` 已涵蓋；`da2545b` 範圍外

**決定**：`reviewedThrough` 推進到 `da2545b`（完整 SHA）。沒有產品程式可取。

Issue [`SanHsien/voxavatar#10`](https://github.com/SanHsien/voxavatar/issues/10) 內文仍停在 `7ca65a3`、未審 `5f0ab50`，但 `scripts/upstream-baseline.json` 已於同日寫入 `5f0ab50`。該 commit 即上游合併 [PR #62](https://github.com/xikhar/persona/pull/62)，本 fork 已於 2026-08-23 記為**已涵蓋**（移植做法而非 `.cts` diff）。無需再合程式。

核對時發現水位之後還有 `da2545b`（[PR #65](https://github.com/xikhar/persona/pull/65)）：Settings 裡 VRoid Hub 角色卡 hover 放大頭像。本 fork 不做 VRoid Hub 帳號連線與應用程式內瀏覽（見本節先前 #24／#28／#31／#34／#47／#53），無此元件路徑，判定**範圍外**。

2026-08-28 那次只把 `reviewedThrough` 寫成 7 字縮寫，會讓 `scripts/check-upstream-updates.cjs` 拒絕讀取（必須 40 字元 SHA）。本次一併改存完整 SHA。

Open 項目未在本輪讀 diff：上游 PR #64、issue #63／#66／#67；#18 維持範圍外。下次接續這些與 `da2545b` 之後的新 commit。

## 2026-08-23：`--state all` 補查，引用上游 PR #62，並補一道 Electron 安裝守衛

**決定**：`reviewedPrThrough` 45 → 62、`reviewedIssueThrough` 18 → 57。引用上游
[PR #62](https://github.com/xikhar/persona/pull/62)；另依上游 [issue #36](https://github.com/xikhar/persona/issues/36)
的建議補一道本地守衛。

**查法先修**：上一輪查 PR／issue 用 `--state open`，看不到已關閉的項目——而未合併就關閉的 PR
永遠不會經由 commit 路徑抵達。改用 `--state all` 後，水位之上多出 PR #46–#62 與 issue #19–#57。
其中 #46–#61 全部已合併，正是上一輪逐條判過的那 13 個 commit；issue #19–#57 也都是那些 PR 關掉
的。真正新的只有 **PR #62（open）**。

**引用 PR #62——本 fork 實查中招**：`electron/mcp-server.cjs` 的第 49 行與第 61 行各呼叫一次
`describeAnimations(animations)`，於是動作目錄在每一次 `tools/list` 都被送出**兩份**：一份在工具
描述、一份在 `animation` 參數描述。工具定義會在每次 API 呼叫時進入 prompt，所以那份複本是**每次
呼叫都被計費、每次都佔 context**。上游量到 `play_animation` 定義 2,150 → 1,412 bytes。

移植的是**做法不是 diff**：上游已遷移到 TypeScript（`.cts`），而本 fork 在上一輪明確不採用該遷移。
本 fork 改成模組層級的 `ANIMATION_INPUT_SCHEMA` 常數。參數名稱刻意維持不加 enum——真正的把關是
呼叫當下的存在檢查（回 `animation_not_playable`），enum 只會在 catalog 變動時給出過期的封閉清單。
三條既有測試同步改成「目錄只在工具描述出現」，含 session 中途 catalog 更新那條。

**issue #36（npm ci 靜默裝出壞掉的 Electron）**：症狀本身是 macOS 專屬（缺 `Electron.app`、
用 `ditto` 解壓），本機實查 `node_modules/electron/dist/` 與 `path.txt` 都完整，本 fork 未中。
但該 issue 另外提的一點與平台無關且成立：**npm 會以 exit 0 結束並留下一棵不能跑的樹**，第一個
症狀出現在 `npm run dev` 失敗時，訊息還指向別的地方。因此補 `scripts/check-electron-install.cjs`
並接上 `predev`／`prestart`：只驗不變式（`path.txt` 存在、非空、指到的檔案真的在），只回報不修復
——對一棵已經壞掉的樹亂修只會讓它更難懂。6 條測試涵蓋「只剩授權檔的 dist」等實際形狀。

**其中一條測試只在開發機跑**：`check-electron-install.test.cjs` 有五條自己造樹的測試，那五條到哪
都成立；第六條「已簽入的樹通過自己的守衛」讀的是真的 `node_modules`，只有在 Electron 二進位真的
被下載過的地方才有意義。CI 的 `npm ci` 二十秒就結束、從不抓那顆二進位——node 與 renderer 兩組測試
都不啟動 Electron，沒有人需要它。在 CI 對真實的樹下斷言，等於把這個**刻意的缺席**報成壞掉的安裝，
正好和守衛的用途相反。因此該條在 `process.env.CI` 有值時 skip，開發機照跑——那裡 `npm run dev`
確實需要二進位，誤報才是真新聞。

**驗證**：`npm run test:node` 341 pass、`npm test` 155 renderer tests pass、`npm run lint` 0 errors、
`npm run docs:check` 通過；`CI=true node --test scripts/check-electron-install.test.cjs` 5 pass /
1 skipped，未設 `CI` 時 6 pass。

## 2026-08-22：上游 PR／issue 盤點——本 fork 已涵蓋，不引用

**決定**：盤點上游 `xikhar/persona` 當時的 **1 個 open PR、1 個 open issue、15 個分支**，沒有引用。
水位記進 `scripts/upstream-baseline.json`（PR #45、issue #18）。

**理由**：

- PR [#45](https://github.com/xikhar/persona/pull/45)（desktop-pet 點擊穿透 + renderer 內唇形同步）：
  兩項本 fork 都已有，而且做得更完整。點擊穿透在 `electron/main.cjs:172` 與
  `electron/renderer-windows.cjs:117` 已用 `setIgnoreMouseEvents(…, { forward: true })`；唇形同步是
  `src/hooks/useAmplitudeLipSync.ts` 搭配可測試的 `computeLipSyncOpen`（`src/lip-sync-gain.test.ts`），
  系統音來源走原生 helper `voxavatar-audio-listener.exe` 的 loopback，而不是在 renderer 裡抓。
  引用只會把兩套實作疊在一起。
- issue [#18](https://github.com/xikhar/persona/issues/18)（提案改用 PocketJS-native VRM renderer）：
  上游的架構提案，與本 fork 目前的 three-vrm + Electron 路線衝突，不追。

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

最後評估：2026-08-28（水位 `7ca65a3`→`da2545b`：`5f0ab50` 已涵蓋、`da2545b` 範圍外）

遠端：`https://github.com/xikhar/persona.git`（`upstream`）

評估規則：只挑選符合 VoxAvatar Windows-only／隱私／媒體授權／識別邊界的變更；不整包 merge 已 squash 殘留分支。

#### 水位

| 項目 | 值 |
| --- | --- |
| `upstream/main` tip（commit 水位，已評估） | `da2545b`（#65，2026-08-28） |
| 前次水位 | `5f0ab50`（#62，2026-08-23 已涵蓋；2026-08-28 記進 baseline） |
| 下次接續 | `da2545b` 之後的新 commit；open PR #64；open issue #63／#66／#67／#18 |
| Open PR／issue 本輪掃描 | 2026-08-28：merged #65＝`da2545b` 範圍外；open PR #64 與 issue #63／#66／#67 未讀 diff，標**待評估**。#18 維持範圍外。 |

#### `7ca65a3..da2545b` 新 commit（2026-08-28 評估完成）

兩個 commit，沒有產品程式可取。`5f0ab50` 的做法已於 2026-08-23 移植。

| Commit | 上游 PR | 判定 | 理由 |
| --- | --- | --- | --- |
| `5f0ab50` | #62 list the action catalog once in the play_animation contract | **已涵蓋** | 上游自己合併 PR #62 的那一筆。本 fork 已於 2026-08-23 移植做法而非 diff（上游已轉 `.cts`，本 fork 不採用該遷移），見本檔 2026-08-23 節。 |
| `da2545b` | #65 enlarge a VRoid Hub portrait on hover | **範圍外** | 變更全在 `VroidCharacters`／portrait zoom，依附本 fork 已否決的 VRoid Hub 帳號整合與應用程式內瀏覽。無此元件路徑。 |

#### `152b1b4..7ca65a3` 新 commit（2026-08-22 評估完成）

排程檢查首跑列出的 13 個 commit，逐項判定如下。本輪只有文件決策，沒有程式變更。

| Commit | 上游 PR | 判定 | 理由 |
| --- | --- | --- | --- |
| `6c309bc` | #48 gate privileged IPC to the Settings window | **已涵蓋** | 上游的根因是「~20 個 settings channel 各自檢查 sender、漏了一批」，改法是在註冊點包一層。本 fork 的 `handleTrustedSettingsIpc` 早就這麼做，而且同時驗 renderer URL（`rendererUrl("settings")`）與 webContents 身分，比上游只驗 webContents 嚴；全 repo 只有 3 個 `ipcMain.handle` 呼叫點（trusted／settings／avatar 三個包裝器），結構上不存在「忘記加 guard」的漏洞。 |
| `ce4feff` | #47 VRoid Hub session refresh | **範圍外** | VRoid Hub 帳號整合，本 fork 已決定不採（見本節先前的四個 VRoid Hub account commits 判定）。 |
| `0bdbc58` `30bb8e7` `f7605ca` `7592e77` | #46／#49／#50／#54 動作綁定 VRM 表情 | **候選（未實作）** | 真實的功能缺口：本 fork 目前只把 VRM expression 用在 lip-sync（`useAmplitudeLipSync`）與眨眼（`useBlink`），沒有使用者可設定的「動作↔表情」綁定，也沒有 hold／release 整合事件。與本 fork 邊界不衝突，值得做；但 renderer 已是各自演進的 TypeScript 實作與不同的 settings schema，這是一次 fork 端的功能實作而非 cherry-pick。列入 ROADMAP 候選，不在本輪動手。 |
| `e60081b` | #51 migrate Persona codebase to TypeScript | **不合併** | 上游在追上本 fork 早就在的位置：renderer 本來就是 TypeScript，Electron 主行程刻意維持 `.cjs`（與 `node --test` 的 `electron/*.test.cjs` 契約一致）。合併 90+ 檔的遷移只會製造大量衝突而無所得。 |
| `19abd0b` | #53 VRoid Hub picker 分組 | **範圍外** | 同 #47，VRoid Hub。 |
| `3673a9c` | #56 以 `@stylistic/eol-last` 強制檔尾換行 | **不採** | 本 fork 的 eslint 設定未引入 `@stylistic`；為單一格式規則新增一個 plugin 依賴不划算，且 `npm run check` 已有 lint 與 docs 檢查。 |
| `937034e` | #58 允許未簽署的 macOS release build | **範圍外** | 本 fork 是 Windows-only 產品，發行流程只走 NSIS／Authenticode。 |
| `59dbf92` `aec8a3d` | #59／#60 Settings 頁面拆分與介面美化 | **不合併** | Settings 已由本 fork 自行重構，含中英雙語字串、動作／待機池、MCP 與素材授權等上游沒有的區塊；上游的拆分方式與樣式無法直接套用。 |
| `7ca65a3` | #61 desktop-pet click-through | **已涵蓋** | 本 fork 早有 click-through：tray 開關、`setIgnoreMouseEvents(next, { forward: true })` 與 alpha hit-test（`Scene.tsx`／`main.cjs`）。上游 PR #45 當初就是因為「含麥克風擷取」被拒、並註明 click-through 本 fork 已有。 |

#### 評估流程

0. 不必自己記得開始：`.github/workflows/upstream-check.yml` 每週一 11:07（Asia/Taipei）跑 `scripts/check-upstream-updates.cjs`，比對上游 `main` 與`scripts/upstream-baseline.json` 的 `reviewedThrough`（＝本節水位的完整 SHA），把水位之後的 commit 與其變動檔案寫進一張長期存在的 issue；水位追上就自動關閉。本機執行 `npm run upstream:check`。
1. `git fetch upstream main`，列出水位之後的 commit。
2. `gh pr list`／`gh issue list` 掃 open（必要時對照近期 merged／closed）。
3. 對每一項標 **採用／部分採用／不合併／已涵蓋／範圍外**，並寫理由。只重掃清單而未讀 diff 時標 **待評估**，不得先寫結論。
4. 需要程式變更才動手；僅文件決策也要更新本節水位。
5. 不把上游 `PERSONA_*`、PipeWire、Hyprland、macOS native、`demo.jpg`（無再散布確認）或授權檔路徑大搬遷直接合入。

#### `bb7ef24..152b1b4` 新 commit（2026-08-10 評估完成）

12 個 commit，逐項判定如下。判準為產品邊界、與本 fork 現況的重疊，以及變更規模對既有驗證的衝擊；未逐行讀 diff 者於理由中註明依據。

| Commit | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| `22557aa` | #23 stateful animation scheduler | **不合併** | 3967＋／954－，含 `speech-signal`／`speaking-chunks` 等依附上游語音管線的子系統。本 fork 已於 0.16.21–0.16.23 以 `isSystemSlotFallbackMotion`＋`shouldCycleRandomMotions`＋洗牌袋解決實際缺陷，規模小且各有契約測。以外來大型子系統取代可用且已驗證的實作，代價高於效益。日後若要做「依語音分段排程」再回頭參考 |
| `612fd7e` | #25 window size setting and Alt+drag | **部分採用（候選）** | 視窗尺寸設定與本 fork 角色縮放（下限 30%）重疊，不取；Alt+drag 提供「不必點中角色也能移動視窗」的路徑，對透明點穿視窗有實用價值，列候選 |
| `cd09d68` `d95e006` `81b3a4c` `1e798fc` | #24／#28／#31／#34 VRoid Hub 帳號連線與瀏覽 | **不合併** | 引入外部服務 OAuth 帳號連線、token 保存與應用程式內線上瀏覽，牴觸 local-first 定位並新增憑證保存面（上游 plaintext storage 開關與 issue #44 皆由此線長出）。使用者仍可自 VRoid Hub 網站下載 VRM 再匯入，功能不缺 |
| `0f0e1a4` | #29 extract VRM 1.0 conditions of use from vrm_meta | **部分採用（候選）** | 去除 VRoid Hub 相依後，「從 VRM meta 讀出授權條款並在 Settings 顯示」有助使用者遵循 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)，方向正確。屬新功能，依 ROADMAP 原則 6 先列候選 |
| `49b185f` | #32 bump fast-uri and hono | **已涵蓋** | 本 fork 已由 Dependabot 於 0.16.20（fast-uri 3.1.5、GHSA-7p8r-x3mc-p8w7）與 0.16.22（hono 4.13.1）處理，lockfile 可核對 |
| `582be3b` | #37 unbreak Electron install on Node.js 24.16.0+ | **不採用（不適用）** | 實測：本 fork 於 CI Node 24 與本機 Node 25.6.0 皆 `npm ci` 成功，`node_modules/electron/dist/electron.exe` 存在；雖仍解析到 `yauzl@2.10.0` 也未觸發。加 root `overrides` 會蓋住整棵相依樹的 yauzl，風險大於效益。日後真的安裝失敗再套 |
| `6406641` `152b1b4` | #39／#42 drag／orbit secondary motion 與 lean 累加修正 | **部分採用（候選）** | 與本 fork Speaking 第二層是不同路徑（拖曳／環繞慣性與 spring bone），不衝突且觀感加分。屬新功能，列候選 |
| `f24e8fe` | #40 change avatar logo | **不合併** | 產品識別由本 fork 自行維護（見本節「識別字串」與 `AGENTS.md`） |

#### Open PR（2026-08-10 評估完成）

| PR | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#48](https://github.com/xikhar/persona/pull/48) | Fix/gate settings ipc sender | **部分採用（已實作）** | 漏洞本身**本 fork 已涵蓋**：實查 44 個設定變更通道全走 `handleTrustedSettingsIpc`（驗 renderer URL＋settings 視窗 `webContents`），未包裝的 5 個 `ipcMain.on` 各自比對 `event.sender`，`voxavatar:settings-get` 是唯一放行的讀取通道（avatar renderer 需要）。**採用其結構性 pin 的構想**：新增 `electron/ipc-registration.test.cjs`，直接讀 `main.cjs` 釘住未包裝通道的精確集合並要求各自驗 sender，日後繞過包裝新增通道會讓 CI 紅 |
| [#47](https://github.com/xikhar/persona/pull/47) | Keep the VRoid Hub session through a transient refresh failure | **範圍外** | 依附上方否決的 VRoid Hub 整合，本 fork 無此程式路徑 |
| [#46](https://github.com/xikhar/persona/pull/46) | feat: add VRM expressions to animation actions | **部分採用（候選）** | 動作可帶 VRM expression 與本 fork「口型由音量驅動 expression」可能競用同組 blendshape，須先定義優先序（口型優先或動作優先）再談實作。列候選 |
| [#45](https://github.com/xikhar/persona/pull/45) | feat: desktop-pet click-through and in-renderer lip-sync (mic + system audio) | **不合併** | 含**麥克風**擷取，直接牴觸硬性邊界；click-through 本 fork 已有 |

#### Open issues（2026-08-10 評估完成）

| Issue | 標題 | 結論 | 理由 |
| --- | --- | --- | --- |
| [#44](https://github.com/xikhar/persona/issues/44) | VRoid Hub token refresh destroys a valid session | **範圍外** | 本 fork 不做 VRoid Hub 帳號連線，無此程式路徑 |
| [#43](https://github.com/xikhar/persona/issues/43) | Settings-mutation and VRoid plaintext-storage IPC handlers bypass sender restriction | **已涵蓋＋已加固** | 設定變更部分已涵蓋（見 PR #48 列）；VRoid plaintext 儲存部分範圍外。已補結構性 pin 測試防止日後繞過 |
| [#35](https://github.com/xikhar/persona/issues/35) | Support VRM expressions in custom animation actions | **部分採用（候選）** | 同 PR #46，須先定 expression 優先序 |
| [#18](https://github.com/xikhar/persona/issues/18) | Proposal: PocketJS-native VRM renderer and an Electron-free path | **範圍外** | 本 fork 明確維護 Windows Electron／WASAPI／NSIS 路線（§1） |

#### 候選清單（已判定值得做，但依 ROADMAP 原則 6 排在既有缺口之後）

Alt+drag 移動視窗（#25 部分）、VRM meta 授權條款顯示（#29 去 VRoid 相依）、drag／orbit secondary motion（#39／#42）、動作 VRM expression 並定義與口型的優先序（#46／#35）。
| [#11](https://github.com/xikhar/persona/issues/11) | Docs: first-run guide for getting a VRM avatar and VRMA animations | **已涵蓋** | 需求為「首次如何取得／匯入 VRM／VRMA」。本 fork README「快速開始」＋ VRoid Hub／BOOTH／Studio 連結、[`ASSET_LICENSES.md`](../ASSET_LICENSES.md)、[`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md) 已覆蓋；追蹤 issue [`SanHsien/voxavatar#1`](https://github.com/SanHsien/voxavatar/issues/1) 已關閉。無需再合上游文件。 |

#### 已評估的 merged commit／PR（摘要）

| 對象 | 結論 | 備註 |
| --- | --- | --- |
| #12 → `327c8ca` | **部分採用** | 手動移植 Windows 語音來源；不收 PipeWire／macOS／跨平台包裝／`PERSONA_*` |
| #14 → `a72292f` | **不合併** | 維持根目錄 `ASSET_LICENSES.md`；不引入 `demo.jpg`；不搬到 `public/assets/LICENSES.md` |
| #15 → `cf27d12` | **不合併** | 僅調整上游 `demo.jpg` 顯示 |
| #16 → `9287ea3` | **不合併**（範圍外） | macOS Core Audio worker churn 修正；共用 JS 也只服務 darwin capture key，Windows sticky-root listener 不適用 |
| #17 → `bb7ef24` | **部分採用（僅模型）** | 2026-08-14 重新逐項查核：官方 VRoid Hub 與 sample-model 條款明列 `AvatarSample_A` 可免費再配布、改作與商用，因此只複製 hash 固定的官方 sample VRM，授權仍集中於根目錄 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。上游 idle＋17 個 speaking VRMA 的 metadata 無作者／授權／原始公開來源，上游自身也明載未另授予 reuse license，故全部不收；模組化 speaking 程式與 Developer gated 設定亦不整包合入。 |
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

- **不從上游 PR／issue 整包合併程式。** #17 僅依原始官方條款採用 `AvatarSample_A`；VRMA 與附帶程式仍不合併。
- Commit 水位推進至 `bb7ef24`；目前無 open PR，#11 文件需求已由 VoxAvatar 涵蓋。下次從此水位後的新 commit 接續評估。

## 2. 音訊與本機整合

- 預設只分析指定應用程式的 WASAPI playback loopback 音量；`output` 模式須由使用者明確啟用，並警告它會涵蓋目前輸出裝置的所有聲音。
- 不擷取麥克風、不保存／傳送音訊、不轉錄。任何擴張都視為新的安全設計。
- MCP／HTTP bridge 僅綁定 loopback，限制 Host、origin、body、session 與 schema；不提供任意命令或任意檔案存取。
- MCP CLI、protocol 與環境變數分別使用 `voxavatar`、`voxavatar://`、`VOXAVATAR_*`。

## 3. 媒體與角色表現

- 安裝包只內建同時通過原始來源、再配布條款、VoxAvatar 品質 `keep` 與 SHA-256 查核的媒體；預設 `keep` 是分數 **> 75** 且沒有高嚴重度問題，75 分仍屬 `review`。目前為 4 個 VRM 與 13 個 CC0 VRMA。使用者本機匯入或品質 `review` 不代表可進 repo；逐檔結論見 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。
- 匯入先在 app-controlled 暫存檔完成有界 GLB／VRM／VRMA 驗證，再 atomic rename；失敗不得污染既有 catalog。
- 目錄品質報告是啟發式輔助，不能取代人工預覽或授權審查。VRM 與 VRMA 共用既有 quality-gate 設定鍵與分數門檻（淘汰／保留），避免平行設定漂移。
- Idle、Speaking、自訂動作與後續狀態／氣泡契約集中在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
- VRMA clip 可標註用途 `loop`／`one-shot`／`pose`（settings schema ≥7）；品質分析依用途套規則。
- **動作↔VRMA 自動對應**：正式來源是 action-pack 明示 `files`／`state_slot`／`purpose`（匯入時寫入 clip purpose）與狀態槽同名預選。可選「依檔名白名單建議分槽」須使用者確認；**禁止**以品質分數、動作特徵、聊天／情緒／音訊內容語意猜分槽。
- **選片採洗牌袋，不用純隨機**：整池洗成一輪依序播完再重洗，一輪內每支各播一次。純隨機（每次重抽、只排除上一支）覆蓋率太差——45 支的池平均要約 300 次才會全部看過，且會近距重複。重洗檢查跨輪接縫、池變動即重建輪次；輪次永不結束。實作見 `src/motion-shuffle-bag.ts`。
- **輪播是 Idle 與 Speaking 的預設，不是 Idle 專屬**：兩者都以 `once` 播完後取下一支；Speaking 的片段間停頓固定為 0，只有 Idle 套用 `idle_rest_ms`。狀態 override 會停用輪播並改用 `loop`，因此**指回該狀態系統槽的預設綁定不得建立 override**（`isSystemSlotFallbackMotion`）——否則人人都有的預設綁定會把 Idle 鎖在單一片段無限循環（0.16.21／0.16.22 實錯）。契約細節見 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
- **待機池採明確排除，不做語意猜測**：所有可播放的非說話動作預設加入，使用者可按動作種類取消；`TALK`、Speaking 槽與其綁定動作強制不可勾。這能讓新動作自動有作用，同時以可測分類邊界避免待機誤播說話手勢；若要改用途，先解除 Speaking 綁定或重新分類，不允許同一動作同時宣告為 Speaking 又進待機池。產品仍不分析 VRMA 骨架或內容猜用途。

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
- **支援的 Node 版本以 CI 為準（Node 24）**。Node 25 起內建 Web Storage 全域會覆蓋 jsdom 的 `window.localStorage`，`src/theme.test.ts` 在 Node 25 下會失敗；這是本機工具鏈限制，不是產品缺陷，本機請用 Node 24 跑 `npm run check`。

## 6. 依賴與合併自動化

- Dependabot 高權限 workflow 必須 fail closed：只信任 `dependabot[bot]`、`main` base 與 base commit 上的 policy，並綁定 head SHA。
- 只有 CI 直接覆蓋的開發工具與 GitHub Actions minor／patch 可 guarded auto-merge；runtime、打包、渲染、major 與未知更新保留人工審查。

## 7. 版本與 Release

- 完成可交付工作後直接 commit／push `main`，並以 SemVer 更新 package、lockfile 與 CHANGELOG。
- `1.0.0` 將已穩定的 Windows-only、local-first、loopback-only MCP、音量驅動口型與媒體授權邊界定為正式契約。進入 1.0 不等於虛構所有環境皆驗收完成：225% DPI、GUI／WASAPI／MCP 候選 smoke 有實機證據；100%／150% DPI、30% 角色、簽署／SmartScreen、完整 installer 生命週期與真實 exporter 樣本仍在 ROADMAP／release evidence 逐項標示部分驗證或未驗。
- `main` 可累積多個版號再批次 Release；不為空轉或無實質變更建立 tag。
- Release tag 必須精確指向可信 `main` tip。已發布 tag 不 force-update；目前不要求以 repository ruleset 保護 tag。
- 新 Release 成功且成為 Latest 後才清理舊 Release／tag；失敗時保留舊版。
- Windows GUI、簽署與真機 capture 在缺少桌面或密鑰時不阻塞可自動驗證的開發，但未驗項目不得宣稱完成。

## 8. 相容與品質證據

- 合成 fixture 用於穩定重現 parser、品質 gate 與 rollback；真實 exporter 結論必須有版本與合法樣本證據。
- 自動 workflow 綠燈不能取代透明視窗、DPI、系統匣、音效裝置、SmartScreen 與安裝生命週期的 Windows 實機驗收。
- 只有具體測試、build、GitHub 狀態或人工紀錄才能標記完成；相關模板與判定見 [`RELEASING.md`](RELEASING.md)「Windows 發行驗收」。

## 9. Schema 版本政策

- **Settings**（`settings-migration.cjs`）：目前 `schema_version`＝12。允許清單內舊版（1–11）讀取時遷移並寫回；不在清單者備份為 `settings.json.unmigratable-backup` 並回報 `unsupported_schema`。升版須加 migration 路徑與 fixture 測試。schema 10 起使用者 clip 可選存 `source_basename`，並支援更新顯示名稱／用途與跨動作搬移；schema 11 起新增 `unassigned_clips` 未分類片段池，磁碟檔名可為可讀 `{clip_name}--{id8}.vrma` 並與顯示名同步；schema 12 起保存待機池明確排除的動作 ID。
- **MCP tools／status**（`mcp-schemas.cjs`）：`tools_schema_version`／`status_schema_version` 隨工具契約變更遞增；成功與失敗皆回結構化 JSON。政策與相容說明見 [`INTEGRATIONS.md`](INTEGRATIONS.md)。
- **Packaged library／catalog**（`library-catalog.cjs`）：`schema_version` 必須精確等於 `PACKAGED_LIBRARY_SCHEMA_VERSION`（目前為 1）。不支援就地 migration；不匹配直接拒絕載入，避免半套 catalog 污染執行期。升版時改常數並同步 `library.json`／example／測試。
- **action-pack.json**：獨立 `schema_version`（見 `action-pack.cjs`）；匯入仍走 GLB／路徑／catalog gate，失敗項不覆寫既有動作；`purpose` 寫入對應 clip。

## 10. 動作↔VRMA 自動對應

- **A（已落地）**：action-pack 明示分槽＋`purpose`；狀態槽同名／類型預選（listening→idle）。這是產品正式「自動」路徑。
- **B（已落地、opt-in）**：檔名白名單／動作名前綴建議（`suggestVrmaAssignment`）；Settings「依檔名建議分槽」選檔後列出對應並確認才寫入；無匹配則略過，不新建動作。
- **C（明確不做）**：不以 VRMA 品質分數、骨架特徵、聊天畫面、情緒或音訊內容推斷應屬哪個動作。
- **關於「分析 VRMA 內容來判斷動作」**：現有 `vrma-quality` 只做**技術適配**（時長、接縫、死動作等）供匯入把關，**不能**可靠分辨 idle／speaking／招手等語意。要從骨架軌跡猜用途，不是再多幾個啟發式就能穩定跨 exporter；若硬做語意分類，本質上接近訓練／呼叫模型，等同在 app 內或外掛生成式 AI。產品邊界是**不在 VoxAvatar 內執行 LLM**；語意標註交給使用者、action-pack 或外部 agent（經 MCP 明示），不內建動作分類 AI。
- **離線整理允許，但不是產品分類器**：`scripts/vrma-curation.cjs` 只輸出 GLB／Humanoid 骨骼、運動量與品質等可驗證事實，並安全套用人工／外部 agent 審核過的改名 plan；它不產生語意標籤。正式對應仍須 action-pack 或 Settings 確認，流程見 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)「離線 VRMA 整理流程」。
- 播放層維持同動作多 clip 隨機（避重複）；自動對應只解決「檔案進哪個動作」，不改播放挑選語意。

## 11. Settings 設定進度面板

- 必要項目未完成時，於各設定分頁上方顯示「設定進度」清單（含捷徑與複製診斷）。
- **必要項目完成後隱藏整塊面板**，避免「首次」常駐造成已就緒卻仍像未設定的誤解；診斷摘要改由 MCP 分頁提供複製入口。

## 12. 動作片段（VRMA）人工管理

- 使用者可在動作卡片上：加入／目錄匯入、預覽播放、重新命名顯示名稱、設定 `purpose`、排序、刪除、移至其他動作或未分類片段池。
- **未分類片段池**（schema 11 `unassigned_clips`）：可先匯入 VRMA 到池中，再拖曳或指定到動作；池內與已指定片段皆可批次設定 `purpose`。
- 磁碟檔名為 app-controlled 可讀 `{clip_name}--{id8}.vrma`（舊版 `{uuid}.vrma` 仍合法）；catalog／URL 資產 ID 永遠是 UUID。「改名」同步磁碟檔名與 `source_basename`（`{clip_name}.vrma`），不覆寫使用者原始匯入路徑。
- 不提供任意路徑寫回或覆寫使用者原始檔；語意分槽仍以 action-pack／手動指定／檔名白名單確認為準。

## 13. Native helper Event（exit 13）語意

- C++ `HelperExit::Event = 13`（音訊 event callback 建立失敗）與 WASAPI／Device／COM 分開。
- JS／Settings／MCP 使用獨立碼 `native_helper_event_error`；**不再**把 exit 13 摺進 `native_helper_wasapi_error`。
- `--emit-error 10|11|12|13` 僅供契約／self-test，**不**等同真實 HRESULT 或裝置失敗已驗。
- 真實 COM／WASAPI／Device／Event 失敗仍須有環境證據；見 ROADMAP「仍待／未驗」。

### 附：上游分支（2026-08-22 一併比對）

上游 15 個分支、14 個不是 PR head。有實質內容的兩個都已在本 fork：

- `fix/mcp-update`（ahead 2）：動畫優先序與名稱更新（新增 `animation-action.ts`、
  `animation-priority.ts`，`CELEBRATE` 換成 `HAPPY`／`FINGER_GUN`）。本 fork 已有同名模組，
  `src/animation-catalog.ts` 也已是新的名稱集合，另外還多一層 `animation-playback-guard.ts`。
- `feat/modular-speaking`（ahead 7）：`electron/audio-activity-gate.cjs`、`library-catalog.test.cjs`
  等檔案本 fork 皆已存在。

其餘分支（`chore/*`、`docs/*`、`feat/settings`、`feat/ui-theme`、`codex/*`）落後 2–36 個 commit，
內容不是已進上游 `main`、就是 macOS 打包／文件，本 fork 不適用。
