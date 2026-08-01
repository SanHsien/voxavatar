# VoxAvatar 專案覆核

覆核日期：2026-08-01

覆核基準：`v0.1.0`／`main` commit `c686ccb`

## 結論

VoxAvatar 已有可信的第一個 stable 基線，但還不到 `1.0.0`。Windows-only、local-first、音訊隱私、loopback MCP 與媒體授權邊界在程式、測試和文件中大致一致；CI、CodeQL、guarded dependency automation 與 Windows Release 也已能重建正式安裝包。

本輪 review 找到 2 個 P1 與數個 P2。P1 已納入修正：Release tag 必須指向當前 `main` tip，且 workflow write token 只給 publish job；使用者素材改為「先複製到 app-controlled 暫存檔，再以同一 descriptor 驗完整 GLB 長度、JSON chunk 與 VRM／VRMA extension，最後 atomic rename」，設定預覽另有錯誤邊界。修正通過完整 gate 並由 GitHub CodeQL 關閉 alerts 後，沒有已知未解 P0／P1。

## 本輪已修正

| 嚴重度 | 問題 | 處理 |
| --- | --- | --- |
| P1 | tag push 會使用 tag 自己版本的 workflow，無法靠 workflow 內的 gate 建立外部信任根 | 改為只從可信 `main` dispatch；執行 tag 程式碼前要求 workflow SHA、遠端 `main`、tag commit 相同；checkout 不留 credentials，只有 `release` environment 的 publish job有 `contents: write` |
| P1 | 匯入只驗 12-byte GLB magic/version，且 source validate 與 copy 分離；偽 GLB 或競態替換可進入 library 並讓 renderer 載入失敗 | 驗 copied file 的 descriptor、實際／宣告長度、bounded JSON chunk、glTF 2.0 與 VRM／VRMA extension，再 atomic rename；預覽錯誤不再拖垮設定頁 |
| P2 | Windows-only 設定仍接受 `darwin`／PipeWire source ID，形成永遠匹配不到的合法狀態 | 移除非 Windows ID、helper 與 exports，舊值安全回退預設來源 |
| P2 | PR CI 沒執行 Markdown gate | `docs:check` 納入 CI，並要求五組公開雙語文件成對存在 |
| P2 | GitHub 將 LICENSE 判定為 `Other` | `LICENSE` 恢復 canonical MIT；媒體排除集中於 `NOTICE.md`／`ASSET_LICENSES.md` |
| P2 | Dependabot security alerts 關閉 | 已啟用 vulnerability alerts 與 automated security-fix proposals；啟用時沒有 open alert |
| P2 | 文件讓所有開發者都以為必須安裝 Visual Studio Build Tools | 一般 Node／Electron 開發與 C++／installer 工具鏈分流，GitHub Windows runner 作正式 native gate |
| P2 | `/events` 與 MCP POST 未落實文件宣稱的 JSON media type 限制 | 非 `application/json`（允許 charset 等參數）一律回 `415`，並補 HTTP regression tests |
| P2 | CI／CodeQL／Release 使用可移動的 GitHub Actions major tags | 全部鎖定完整 commit SHA 並保留版本註解，後續由 Dependabot 提議更新 |

## 已驗證的基線

- Electron renderer 使用 sandbox、context isolation、無 Node integration；preload API 是明確 allowlist，但 avatar／settings 尚未分權。
- MCP／HTTP bridge 綁定 loopback，驗 Host、origin、內容型別、body 大小與 schema。
- 語音 helper 只計算指定應用程式播放輸出的音量，不擷取麥克風或保存音訊。
- 資產 manifest 與 `assets:release` 對再散布權 fail closed；正式版預設無 VRM／VRMA。
- CI 覆蓋 lint、Markdown、Node／renderer tests、資產契約、production audit、native build／self-test 與 renderer build。
- Release 覆蓋 tag／package、licensed assets、NSIS、SHA-256、published／Latest 與正式資產。
- Dependabot auto-merge 僅允許低風險開發工具及 GitHub Actions minor／patch，並綁 author、base、head policy、CI 與 CodeQL。

## 尚未關閉的 P2／實機缺口

1. **Installer 未簽署。** `v0.1.0` 的 Authenticode 狀態為 `NotSigned`；目前沒有 `WIN_CSC_*` secrets。未完成 publisher、SmartScreen 與升級路徑驗證前，不符合 `1.0.0` 門檻。
2. **尚無版本化 Windows 實機證據。** GitHub runner 不能取代 Windows 10／11、音效 driver、透明視窗、系統匣、DPI、protocol、升級與移除 smoke；後續依 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md) 留存。
3. **行程探索成本偏高。** listener 每 1.5 秒啟動 PowerShell 並掃描 `Win32_Process`，即使 capture 穩定仍持續；需量測耗電／CPU，再改為 PID 存活快路徑與 adaptive backoff。
4. **多個符合來源的 root 只取第一個 PID。** 同時存在多個相同 app root 時可能監聽錯誤 instance；需先定義 active source 或多 root 語意，再改 native contract。
5. **自訂 process regex 沒有 backtracking 安全 gate。** 輸入雖為本機使用者設定，仍在 main process 對多個行程重複執行；應改為安全子集、RE2 或有界 worker。
6. **IPC 權限尚未最小化。** avatar 與 settings 共用 preload，avatar renderer 也取得設定／資產管理 API；多數 privileged handler 沒有統一驗 sender／frame URL。需拆 preload、集中授權並補拒絕未授權 sender 測試。
7. **MCP session 沒有 TTL／容量上限。** 未正常 DELETE／close 的 client session 會留到 app 重啟；需加入 idle sweep、hard cap 與淘汰關閉測試。
8. **native self-test 沒有進入 COM／WASAPI capture。** capture API 的部分錯誤仍可能被當成靜音或成功退出；需 typed error、非零退出與播放／裝置切換真機測試。
9. **renderer／桌面 E2E 覆蓋不足。** 尚未以 component test 證明 App／Settings／Scene recovery，也沒有 protocol、tray、MCP 與 installer lifecycle 自動 E2E；先以版本化實機證據封口，再逐步自動化。
10. **npm script allowlist 的工具鏈契約未鎖定。** 目前 npm 會對 `.npmrc` 的 `strict-allow-scripts` 顯示未知設定警告；需確認實際 enforce 行為、鎖定相容 npm 版本並加 fail-closed 測試，不能把無效警告當防線。
11. **大型模組形成修改熱點。** `SettingsPage.tsx`、`electron/main.cjs`、`settings-store.cjs` 各自承擔過多責任；拆分前要保留行為測試，不做無證據重寫。
12. **renderer bundle 有大型 chunk 警告。** 先建立啟動與首次顯示基準，再延後載入非首屏設定／報告功能，不為消除警告犧牲 overlay 可靠性。

## 發行與治理判定

- 已發布 tag 視為 immutable；不再移動同名 tag 或讓同一版本由不同 commit 重建。
- `ROADMAP.md` 管未來里程碑，`REVIEW.md` 只保留最新健康狀態，`CHANGELOG.md` 記已完成版本。
- `main` 目前依主人規則允許直接推送，因此沒有 branch protection 不是自動化 gate 的替代品；每次交付仍必須驗 local、GitHub workflow 與 Release 三層狀態。
- 完成條件依 [`docs/RELEASING.md`](docs/RELEASING.md) 與 [`docs/WINDOWS_VALIDATION.md`](docs/WINDOWS_VALIDATION.md)，不能只看 tag 或 workflow 綠燈。
