# 貢獻 VoxAvatar

> English: [`CONTRIBUTING.en.md`](CONTRIBUTING.en.md)

歡迎改善 Windows 體驗、VRM／VRMA 相容性、測試、文件、無障礙與本機整合。參與前請遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)。

## 開始之前

- 先搜尋現有 [issues](https://github.com/SanHsien/voxavatar/issues) 與 pull requests。
- 大型產品、架構、安全或整合變更請先開 issue；小型修正可直接送 PR。
- 安全漏洞請依 [`SECURITY.md`](SECURITY.md) 私下回報。

## 開發環境

需要 Windows、Node.js 24+、npm，以及含 C++ 桌面工作負載的 Visual Studio Build Tools。

```powershell
git clone https://github.com/SanHsien/voxavatar.git
cd voxavatar
git remote add upstream https://github.com/xikhar/persona.git
npm ci
npm run native:build
npm run dev
```

## 不可跨越的邊界

- 不擷取麥克風，不保存、傳送或轉錄音訊。
- Renderer 維持 sandbox 與 context isolation；preload 只暴露窄介面。
- MCP／bridge 僅綁定 loopback，不提供任意命令或任意檔案存取。
- 不加入 Linux／macOS 監聽或發行目標。
- 不提交未確認再散布權的 VRM／VRMA。
- 保留上游 MIT 授權與 `xikhar` attribution。

## 提交前驗證

```powershell
npm run check
npm run native:build
npm run native:test
```

原生、安裝或 protocol 變更另跑 `npm run dist:windows`，並記錄 Windows 手動驗收。資產變更必須更新 `public/assets/library.json`、`public/assets/manifest.json`、[`ASSET_LICENSES.md`](ASSET_LICENSES.md)，再執行 `npm run assets:release`。

## Pull request

一個 PR 聚焦一個主題，說明：

1. 為什麼需要修改。
2. 使用者可見的結果。
3. 自動測試與手動驗證。
4. 安全、媒體授權及 Windows 相容性影響。

依賴更新會先經風險分類。只有 CI 直接覆蓋的開發工具及 GitHub Actions minor／patch 可通過 guarded auto-merge；執行期、打包、渲染與 major 更新保留人工審查。
