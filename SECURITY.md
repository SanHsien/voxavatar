# 安全政策

> English: [`SECURITY.en.md`](SECURITY.en.md)

## 支援版本

僅支援 [最新 GitHub Release](https://github.com/SanHsien/voxavatar/releases/latest) 與目前 `main`。舊 beta 不會另行維護安全修補。

## 私下回報

請使用 [GitHub Private Vulnerability Reporting](https://github.com/SanHsien/voxavatar/security/advisories/new)。請附版本、影響、重現步驟與已移除敏感資料的診斷資訊；完成修補前不要公開 issue 或 PoC。

## 安全模型

- 語音監聽只在記憶體中計算指定應用程式的播放音量，不擷取麥克風、不保存、不轉錄、不傳送音訊。
- MCP 與 HTTP bridge 只綁定 `127.0.0.1`，驗證 loopback `Host`、來源、內容型別、請求大小與輸入 schema。
- 本機 MCP 無登入驗證；同一 Windows 帳號下的其他行程可操作角色視窗與動作。不要把連接埠轉發到區域網路或 Internet。
- MCP 只提供動畫、視窗與狀態工具，不執行任意命令、不讀取任意檔案。
- Electron renderer 啟用 sandbox 與 context isolation，停用 Node integration；preload 只暴露必要 IPC。
- 使用者匯入媒體會複製到每使用者應用資料，renderer 只能以已登記 ID 經 `voxavatar-asset:` 讀取。

安全邊界的變更必須附測試與威脅說明。一般錯誤請用 issue template，不要透過漏洞管道回報。
