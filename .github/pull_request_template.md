## 變更摘要

請說明動機、使用者可見結果與主要實作。

## 驗證

- [ ] `npm run check`
- [ ] 原生相關：`npm run native:build` 與 `npm run native:test`
- [ ] 安裝包相關：`npm run dist:windows`
- [ ] 已記錄必要的 Windows 手動驗收

## 專案邊界

- [ ] 沒有擷取麥克風、保存／傳送音訊或加入轉錄。
- [ ] MCP／bridge 仍只綁定 loopback，且沒有任意命令／檔案存取。
- [ ] 沒有提交未驗證再散布權的 VRM／VRMA。
- [ ] 保留上游 MIT 與 `xikhar` attribution。
- [ ] 沒有恢復 Linux／macOS 支援。

## 文件與發行

- [ ] 使用者可見變更已更新 README／相關文件。
- [ ] 發行資訊已更新 `CHANGELOG.md`（如適用）。
