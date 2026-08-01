# VoxAvatar 維護計畫

本檔記錄目前產品方向；已完成版本細節以 [`CHANGELOG.md`](CHANGELOG.md) 為準，架構決策以 [`docs/DECISIONS.md`](docs/DECISIONS.md) 為準。

## 已建立的基線

- Windows-only Electron 桌面 overlay、系統匣與 `voxavatar://` protocol。
- WASAPI application loopback 音量偵測；不擷取麥克風、不保存音訊。
- 本機 VRM／VRMA 匯入、目錄批次匯入、品質報告、自訂動作與常用動作預設。
- loopback MCP／HTTP bridge 與 Codex 整合。
- CI、CodeQL、Dependabot、guarded auto-merge、Markdown／資產／Release 驗證。

## 下一階段

1. 以真實 Windows 安裝包持續驗證首次啟動、模型匯入、語音來源、MCP 與升級流程。
2. 擴充可由使用者自行匯入的高品質 VRMA 指引，不把再配布受限素材塞入 Release。
3. 改善大型 renderer bundle 的程式碼切分，但不得犧牲首次顯示可靠性。
4. 等待實際低風險 Dependabot PR，驗證 policy check、必要 checks、核准與 squash merge 的完整生命週期。

## 不做

- 麥克風錄音、語音保存／上傳／轉錄。
- 非 loopback MCP／bridge 或任意系統操作。
- 未授權角色／動作再散布。
- Linux／macOS 監聽與發行維護。
