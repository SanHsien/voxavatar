# CLAUDE.md

Claude 的完整規則以 [`AGENTS.md`](AGENTS.md) 為準；本檔只保留快速入口。

## 專案摘要

VoxAvatar 是 Windows-only Electron + React + Three.js VRM 桌面角色陪伴，衍生自 `xikhar/persona`。產品識別一律使用 **VoxAvatar／voxavatar**。

## 常用指令

```powershell
npm ci
npm run dev
npm run check
```

只有修改原生 listener 或本機安裝包時才需要 Visual Studio Build Tools：

```powershell
npm run native:build
npm run native:test
npm run dist:windows
```

## 交付

完成主人要求後推送 `main`，再依 [`docs/RELEASING.md`](docs/RELEASING.md) 主動更新版本、CHANGELOG、tag 與 GitHub Release。

每次 push 前必須檢討 `README`／`ROADMAP`／`CHANGELOG`／`SECURITY`／`REVIEW` 等相關文件（見 [`AGENTS.md`](AGENTS.md)）。中斷或壓縮後必須自動接續未完成工作，不要等主人再提醒。

不可越過音訊隱私、loopback、Windows-only、媒體授權或上游 attribution 邊界。
