---
name: voxavatar
description: 開發、驗證、整合與發布 SanHsien/voxavatar Windows VRM 桌面角色陪伴。
---

# VoxAvatar 專案技能

## 適用情境

- 修改 Electron／React／Three.js VRM 桌面行為。
- 處理 WASAPI 語音輸出、MCP、HTTP bridge 或 `voxavatar://`。
- 更新 VRM／VRMA 匯入、catalog、授權與 Release。
- 診斷 Windows 安裝包、原生 helper 或 GitHub Actions。

## 開工

1. 讀 [`AGENTS.md`](AGENTS.md)、[`README.md`](README.md) 與相關 `docs/`。
2. `git fetch origin main --tags`，確認 branch、worktree 與遠端差異。
3. 保留使用者既有修改，不恢復 Linux／macOS 或已 squash 的上游殘留分支。

## 驗證

```powershell
npm ci
npm run check
npm run native:build
npm run native:test
```

安裝／Release 相關再執行：

```powershell
npm run assets:release
npm run dist:windows
```

## 安全與授權

- 不擷取麥克風、不保存或傳送音訊。
- MCP／bridge 保持 loopback-only、輸入有界、無任意命令或檔案存取。
- 未完成 [`ASSET_LICENSES.md`](ASSET_LICENSES.md) 閘門前，不提交或發行 VRM／VRMA。
- 保留 MIT 與 `xikhar` attribution。

## 交付

完成要求後推送 `main`，再依 [`docs/RELEASING.md`](docs/RELEASING.md) bump 版本、更新 CHANGELOG、推 tag，並驗證 GitHub Release 的 Latest、target commit 與資產。
