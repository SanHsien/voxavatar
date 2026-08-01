# Claude 專案入口

完整且具優先權的規則見 [`AGENTS.md`](AGENTS.md)。開始前另讀 [`README.md`](README.md) 與本次工作相關文件。

```powershell
npm ci
npm run check
```

一般 UI、MCP、文件與 TypeScript 工作不需要 Visual Studio Build Tools；只有 C++ helper 或本機 installer 需要。不可越過音訊隱私、loopback-only、Windows-only、媒體授權與上游 attribution 邊界。完成後依 `AGENTS.md` 更新版號、文件並推送 `main`；tag／Release 採批次發布。
