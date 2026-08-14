# AGENTS.md

本檔是 **所有** AI coding agents（Claude、Cursor、Codex、其他）在 **SanHsien/voxavatar** 工作時的單一真相源。薄入口 [`CLAUDE.md`](CLAUDE.md)、[`SKILL.md`](SKILL.md) 只指向本檔；衝突時以本檔為準。

## 工作流程（所有 agent）

1. 讀本檔、[`README.md`](README.md) 與本次工作相關文件。
2. Checkout／fetch `origin/main` 與 tags，保留使用者既有修改；**禁止另開 feature／cursor 分支**。
3. 在 `main` 上完成需求，至少執行 `npm run check`；原生相關再跑 `native:build`／`native:test`，發行資產再跑 `assets:release`／`dist:windows`。
4. 檢討 README、ROADMAP（含「目前健康」）、SECURITY、CHANGELOG 與受影響文件。
5. 依本檔更新版號、提交並 `git push origin main`；tag／Release 依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次處理。
6. 已併入 `main` 的殘餘分支（遠端與本機／雲端主機）確認後刪除，只留 `main`。

## 回覆與工作方式

- 以繁體中文回答。
- 直接處理需求，不用冗長背景、技術選型或表演式推理拖延簡單工作。
- 主人交代的要求（含執行中補充）必須做完；自行拆分的階段計畫可在合理關卡暫停。
- **中斷後必須自動接續**：對話壓縮、session 重開、工具中斷或主人再說「繼續」時，先還原上一輪已計劃／進行中／未驗證的工作，立刻做完，**禁止**等主人再次提醒「繼續未完成工作」。接續順序：查 git／CI／Release／todo 現況 → 從中斷點執行 → 驗證 → 依本檔交付。

## 完成、推送與發行

主人指示（2026-08-01；分支規則 2026-08-02；批次流程見 [`docs/RELEASING.md`](docs/RELEASING.md)）：

1. **直接在 `main` 工作**：完成後 commit 並 `git push origin main`。**不要開 feature／cursor 分支，不要預設開 PR。**
2. 每個有新產品／程式內容的可交付工作段落在 push 前 bump `package.json` 版號、同步 lockfile 並更新 `CHANGELOG.md`。**不必每次 bump 都 Release／tag**；`main` 可累積多個版本再批次發布。發布後的正式證據回填、公開文件狀態同步與本機來源整理屬於剛發布版本的同一工作項，**不得只為這些收尾另 bump patch 版號**。
3. **批次 Release 時**：建立並推送 `v{version}` tag（指向 `main` tip）；**先推 tag、再推 `main`**，由「main tip 已 tagged」觸發打包，或依 [`docs/RELEASING.md`](docs/RELEASING.md) 手動 dispatch。驗證公開 Release、Latest、target commit 與資產。禁止空轉或無實質變更的 Release。
4. 新版 Release **成功後**才刪除其餘舊 GitHub Release 與對應 tag，只保留最新版；新版失敗則不動舊版。
5. **同一發布工作必須收尾**：下載正式資產核對 digest／checksum／簽署狀態，補 `docs/release-evidence/v{version}/`、README／ROADMAP／CHANGELOG 的實際狀態；若本輪使用本機素材來源，也要依本輪結果整理來源目錄並重驗數量／hash／報告。這些動作不得遺留到下一個版本。
6. **Windows 實機驗證**（GUI smoke、簽署、native capture 矩陣）在無 Windows 桌面或密鑰時**不得阻塞** v0.3+ 路線圖；應停止實機步驟、回報缺口，繼續可驗證的開發。
7. 只有密鑰、未授權破壞性操作或互相矛盾的需求才停下詢問。

### 每次 push 前的文件檢討（必做）

每次準備 commit／push（含 release bump）前，必須檢討並視需要更新相關文件，不可只改程式：

| 檔案 | 檢討重點 |
| --- | --- |
| `CHANGELOG.md` | 使用者可觀察變更是否已寫入對應版本 |
| `ROADMAP.md`／`ROADMAP.en.md` | 完成項勾選、規劃基準、「目前健康」、接下來三件事、SemVer 節奏是否仍正確 |
| `README.md`／`README.en.md` | 產品敘述、能力、安全邊界、安裝／開發指引是否與現況一致 |
| `SECURITY.md`／`SECURITY.en.md` | 隱私／IPC／MCP／語音模式邊界是否跟上 |
| `docs/CHARACTER_BEHAVIOR.md` | 動作輪播／狀態槽／口型／氣泡的行為契約是否與實作一致 |
| `docs/DECISIONS.md` | 新取捨、上游評估水位是否需更新 |
| `CONTRIBUTING*`／`docs/DEVELOPMENT.md`／`docs/RELEASING.md` | 流程或指令是否漂移（含 Windows 實機驗收專節） |
| `AGENTS.md`／`.cursorrules`／`CLAUDE.md`／`SKILL.md` | agent 行為規則與薄入口是否需同步 |

雙語公開文件成對修改。無使用者可見變更時可在 CHANGELOG 略過，但仍須在 commit 說明或工作紀錄確認「已檢討、無需改」。

## 產品

VoxAvatar 是 Windows-only Electron VRM 桌面角色陪伴：監聽指定應用程式的語音播放輸出，驅動口型與動作，並提供本機 MCP。上游為 [`xikhar/persona`](https://github.com/xikhar/persona)。

## 硬性邊界

- 不擷取麥克風、不保存／傳送音訊、不轉錄。
- 不提交未驗證再散布權或品質未判定為 `keep` 的 VRM／VRMA；預設 `keep` 必須高於 75 分且沒有高嚴重度問題，75 分仍是 `review`。目前只內建通過官方來源、條款、品質與 SHA-256 查核的 4 個 VRM／13 個 CC0 VRMA，完整清單見 `ASSET_LICENSES.md`。
- 不移除上游 MIT 與 `xikhar` attribution。
- MCP／bridge 維持 loopback-only，不加入任意命令或任意檔案存取。
- 不恢復 PipeWire、Hyprland、macOS native、`dist:linux` 或 `dist:mac`。
- 不再合併上游殘留分支 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update`。

## 識別字串

| 項目 | 值 |
| --- | --- |
| npm／protocol／MCP CLI | `voxavatar` |
| 顯示名 | VoxAvatar |
| appId | `com.sanhsien.voxavatar` |
| 環境變數 | `VOXAVATAR_*` |
| 資產 scheme | `voxavatar-asset:` |
| 原生 helper | `voxavatar-audio-listener.exe` |

## 文件與驗證

- 公開文件：`README`、`ROADMAP`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁中為預設，附 `*.en.md`。
- `ROADMAP` 管未來與「目前健康」、`CHANGELOG` 管已完成；不另建平行計畫檔或獨立覆核檔。
- 其餘維護文件使用繁中；規則與路線圖都可隨專案現況修正，但硬性產品邊界的變更必須寫入 `docs/DECISIONS.md`。
- 所有修改至少跑 `npm run check`；原生相關再跑 `npm run native:build` 與 `npm run native:test`。一般 UI、MCP、文件與 TypeScript 開發不要求本機安裝 Visual Studio Build Tools。
- 資產或發行相關另跑 `npm run assets:release`；安裝相關跑 `npm run dist:windows`。
- 若本機沒有 C++ toolchain，以 GitHub Windows runner 的 native build／self-test／installer 為正式 gate。Windows GUI smoke 與簽署驗收在可取得桌面／密鑰時補做，不阻塞其他可自動驗證的路線圖工作。
- 不接受「應該可用」；以測試、build、Git／GitHub 與實際 Release 狀態收尾。
