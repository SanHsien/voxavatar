---
name: voxavatar
description: 開發、驗證、整合與發布 SanHsien/voxavatar Windows VRM 桌面角色陪伴。
---

# VoxAvatar 專案技能

1. 讀 [`AGENTS.md`](AGENTS.md)、[`README.md`](README.md) 與工作相關文件。
2. Fetch `origin/main` 與 tags，保留使用者既有修改。
3. 完成需求，至少執行 `npm run check`；原生相關再跑 `native:build`／`native:test`，發行資產再跑 `assets:release`／`dist:windows`。
4. 檢討 README、ROADMAP、REVIEW、SECURITY、CHANGELOG 與受影響文件。
5. 依 `AGENTS.md` 更新版號、提交並推送 `main`；tag／Release 依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次處理。

硬性邊界：Windows-only；不擷取、保存、傳送或轉錄音訊；MCP／bridge 保持 loopback-only 且無任意命令／檔案存取；不散布未確認授權的 VRM／VRMA；保留 MIT 與 `xikhar` attribution。
