# Claude／Agent 專案入口

完整且具優先權的規則見 [`AGENTS.md`](AGENTS.md)。衝突時以 `AGENTS.md` 為準。

## 工作流程（精簡）

1. 讀 [`AGENTS.md`](AGENTS.md)、[`README.md`](README.md) 與本次工作相關文件。
2. Fetch `origin/main` 與 tags，保留使用者既有修改。
3. 完成需求，至少執行 `npm run check`；原生相關再跑 `native:build`／`native:test`，發行資產再跑 `assets:release`／`dist:windows`。
4. 檢討 README、ROADMAP（含「目前健康」）、SECURITY、CHANGELOG 與受影響文件。
5. 依 `AGENTS.md` 更新版號、提交並推送 `main`；tag／Release 依 [`docs/RELEASING.md`](docs/RELEASING.md) 批次處理。

## 常用指令

```powershell
npm ci
npm run check
```

一般 UI、MCP、文件與 TypeScript 工作不需要 Visual Studio Build Tools；只有 C++ helper 或本機 installer 需要。

## 硬性邊界

Windows-only；不擷取、保存、傳送或轉錄音訊；MCP／bridge 保持 loopback-only 且無任意命令／檔案存取；不散布未確認授權的 VRM／VRMA；保留 MIT 與 `xikhar` attribution。不可越過音訊隱私、loopback-only、Windows-only、媒體授權與上游 attribution 邊界。
