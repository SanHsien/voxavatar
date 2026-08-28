# Claude 專案入口

完整且具優先權的規則見 [`AGENTS.md`](AGENTS.md)。本檔不複製規則；衝突時以 `AGENTS.md` 為準。

```powershell
npm ci
npm run check
```

一般 UI、MCP、文件與 TypeScript 工作不需要 Visual Studio Build Tools；只有 C++ helper 或本機 installer 需要。完成後依 `AGENTS.md` 更新版號、文件並推送 `main`。
