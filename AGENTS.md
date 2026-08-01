# AGENTS.md

本檔是 AI coding agents 在 **SanHsien/voxavatar** 工作時的單一真相源。Claude 補充見 [`CLAUDE.md`](CLAUDE.md)；衝突時以本檔為準。

## 回覆與工作方式

- 以繁體中文回答。
- 直接處理需求，不用冗長背景、技術選型或表演式推理拖延簡單工作。
- 主人交代的要求（含執行中補充）必須做完；自行拆分的階段計畫可在合理關卡暫停。
- **中斷後必須自動接續**：對話壓縮、session 重開、工具中斷或主人再說「繼續」時，先還原上一輪已計劃／進行中／未驗證的工作，立刻做完，**禁止**等主人再次提醒「繼續未完成工作」。接續順序：查 git／CI／Release／todo 現況 → 從中斷點執行 → 驗證 → 依本檔交付。

## 完成、推送與發行

主人指示（2026-08-01；批次政策見 D-23）：

1. 完成要求後直接 commit 並 `git push origin main`，不要預設只開 PR。
2. 每個可交付工作段落 bump `package.json` 版號、同步 lockfile、更新 `CHANGELOG.md`，再 commit／push。**不必每次 bump 都 Release／tag**；`main` 可累積多個版本再批次發布。
3. **批次 Release 時**：建立並推送 `v{version}` tag（指向 `main` tip）；**先推 tag、再推 `main`**，由「main tip 已 tagged」觸發打包，或依 [`docs/RELEASING.md`](docs/RELEASING.md) 手動 dispatch。驗證公開 Release、Latest、target commit 與資產。禁止空轉或無實質變更的 Release。
4. 新版 Release **成功後**才刪除其餘舊 GitHub Release 與對應 tag，只保留最新版；新版失敗則不動舊版。
5. **Windows 實機驗證**（GUI smoke、簽署、native capture 矩陣）在無 Windows 桌面或密鑰時**不得阻塞** v0.3+ 路線圖；應停止實機步驟、回報缺口，繼續可驗證的開發。
6. 只有密鑰、未授權破壞性操作或互相矛盾的需求才停下詢問。

### 每次 push 前的文件檢討（必做）

每次準備 commit／push（含 release bump）前，必須檢討並視需要更新相關文件，不可只改程式：

| 檔案 | 檢討重點 |
| --- | --- |
| `CHANGELOG.md` | 使用者可觀察變更是否已寫入對應版本 |
| `ROADMAP.md`／`ROADMAP.en.md` | 完成項勾選、規劃基準、接下來三件事、SemVer 節奏是否仍正確 |
| `README.md`／`README.en.md` | 產品敘述、能力、安全邊界、安裝／開發指引是否與現況一致 |
| `SECURITY.md`／`SECURITY.en.md` | 隱私／IPC／MCP／語音模式邊界是否跟上 |
| `REVIEW.md` | 最新健康狀態；已修項目勿留在「尚未關閉」 |
| `docs/DECISIONS.md` | 新取捨是否需決策條目 |
| `CONTRIBUTING*`／`docs/DEVELOPMENT.md`／`docs/RELEASING.md` | 流程或指令是否漂移 |
| `AGENTS.md`／`.cursorrules` | agent 行為規則是否需同步 |

雙語公開文件成對修改。無使用者可見變更時可在 CHANGELOG 略過，但仍須在 commit 說明或工作紀錄確認「已檢討、無需改」。

## 產品

VoxAvatar 是 Windows-only Electron VRM 桌面角色陪伴：監聽指定應用程式的語音播放輸出，驅動口型與動作，並提供本機 MCP。上游為 [`xikhar/persona`](https://github.com/xikhar/persona)。

## 硬性邊界

- 不擷取麥克風、不保存／傳送音訊、不轉錄。
- 不提交未驗證再散布權的 VRM／VRMA；預設安裝包不內建角色或動作媒體。
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
- `REVIEW.md` 只保留最新覆核；`ROADMAP` 管未來、`CHANGELOG` 管已完成，不另建平行計畫檔。
- 其餘維護文件使用繁中；規則、review 與路線圖都可隨專案現況修正，但硬性產品邊界的變更必須寫入 `docs/DECISIONS.md`。
- 所有修改至少跑 `npm run check`；原生相關再跑 `npm run native:build` 與 `npm run native:test`。一般 UI、MCP、文件與 TypeScript 開發不要求本機安裝 Visual Studio Build Tools。
- 資產或發行相關另跑 `npm run assets:release`；安裝相關跑 `npm run dist:windows`。
- 若本機沒有 C++ toolchain，以 GitHub Windows runner 的 native build／self-test／installer 為正式 gate。Windows GUI smoke 與簽署驗收在可取得桌面／密鑰時補做，**不阻塞** v0.3+ 路線圖（D-23）。
- 不接受「應該可用」；以測試、build、Git／GitHub 與實際 Release 狀態收尾。
