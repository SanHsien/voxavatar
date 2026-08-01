# AGENTS.md

本檔是 AI coding agents 在 **SanHsien/voxavatar** 工作時的單一真相源。Claude 補充見 [`CLAUDE.md`](CLAUDE.md)；衝突時以本檔為準。

## 回覆與工作方式

- 以繁體中文回答。
- 直接處理需求，不用冗長背景、技術選型或表演式推理拖延簡單工作。
- 主人交代的要求（含執行中補充）必須做完；自行拆分的階段計畫可在合理關卡暫停。

## 完成、推送與發行

主人指示（2026-08-01）：

1. 完成要求後直接 commit 並 `git push origin main`，不要預設只開 PR。
2. 推上 `main` 後主動 bump `package.json` 版號、同步 lockfile、更新 `CHANGELOG.md`，再 commit／push。
3. 建立並推送 `v{version}` tag，讓 GitHub Actions 打包及發布；依 [`docs/RELEASING.md`](docs/RELEASING.md) 驗證公開 Release、Latest、target commit 與資產。
4. 只有密鑰、未授權破壞性操作或互相矛盾的需求才停下詢問。

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

- 使用者文件：`README`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁中為預設，附 `*.en.md`。
- 其餘維護文件使用繁中。
- 所有修改至少跑 `npm run check`；原生相關再跑 `npm run native:build` 與 `npm run native:test`。
- 資產或發行相關另跑 `npm run assets:release`；安裝相關跑 `npm run dist:windows`。
- 不接受「應該可用」；以測試、build、Git／GitHub 與實際 Release 狀態收尾。
