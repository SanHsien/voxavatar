# 發行 VoxAvatar

VoxAvatar 只從可信 `main` 的 `v{package.version}` tag 建立 Windows GitHub Release；workflow 位於 `.github/workflows/release.yml`。

## 批次政策

`main` 可累積多次 SemVer bump 與 CHANGELOG 條目，不必每次都建立 tag。只有準備提供可下載版本時才 batch cut；禁止空轉 Release。Windows GUI／簽署缺口不阻塞其餘開發，但未驗項目不得宣稱完成。

## 發行前

- 工作樹乾淨，`HEAD` 與 `origin/main` 同步。
- `package.json`、lockfile 與 CHANGELOG 版號一致。
- 打包媒體通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md) 與 manifest gate。
- 簽署 Release 時，GitHub `release` environment 已提供 `WIN_CSC_LINK` 與 `WIN_CSC_KEY_PASSWORD`。

```powershell
npm ci
npm run check
npm run assets:release
```

一般環境不必安裝 Visual Studio Build Tools；GitHub Windows runner 是正式 native build、self-test 與 NSIS gate。本機已有 C++ toolchain 時可額外跑 `npm run native:build`、`npm run native:test`、`npm run dist:windows`。

## 建立版本與 tag

```powershell
npm version 0.13.0 --no-git-tag-version
# 更新 CHANGELOG 後：
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.13.0"
git tag v0.13.0
git push origin v0.13.0
git push origin main
```

必須先推 tag、再推 `main`：當 `main` tip 已有相符的 `v{version}` tag 時，main push 才觸發打包。也可在 main 上手動 dispatch：

```powershell
gh workflow run release.yml --repo SanHsien/voxavatar --ref main -f tag=v0.13.0
```

Workflow 會確認 workflow、遠端 main、tag 與 package version 指向同一 SHA，再固定 checkout 該 commit；publish 前再次確認 tag 未移動。已發布 tag 不得 force-update，目前不要求 tag protection ruleset。

## Workflow 與產物

1. 驗證 tag、package version 與資產授權。
2. 在 Windows 執行 `npm run check`、native build／self-test 與 NSIS 打包。
3. 上傳 installer 與 `SHA256SUMS.txt`。
4. 建立 published、non-draft、non-prerelease、Latest Release。

## 發布後驗證

```powershell
gh release view v0.13.0 --repo SanHsien/voxavatar --json url,isDraft,isPrerelease,targetCommitish,assets
gh api repos/SanHsien/voxavatar/releases/latest
```

完成條件：Latest 指向相同 tag；tag 與 Release target 可追到預期 main commit；installer 與 checksum 非空；下載後 SHA-256 相符；依下方「Windows 發行驗收」完成可執行的安裝與 GUI smoke。只有 tag 或 workflow 綠燈不算完成。

新版 Release 成功且成為 Latest 後，才刪除其餘舊 Release／tag；失敗則全部保留。刪除舊 tag 是版本清理，不得把既有 tag 移到另一個 commit。

## 輔助證據

- `npm run baseline:bundle`：renderer bundle 對照。
- `npm run evidence:manifest`：建立 release-evidence 的機讀 `manifest.json` metadata 模板；人工 smoke 另依本檔「Windows 發行驗收」填寫。
- `npm run sbom`：從 lockfile 產生 production dependency SBOM，預設寫入 `release/sbom.json`。

這些腳本只用 Node 內建模組；模板或 runner 結果不能取代真實桌面證據。

## Windows 發行驗收

GitHub Actions 能證明程式可在乾淨 Windows runner 編譯、測試與打包，但不能證明真實桌面的音效裝置、透明視窗、系統匣、SmartScreen 或安裝／移除體驗。每個準備宣稱「已完成實機驗收」的版本都依本節執行。

### 證據檔案與範圍

記錄放在 `docs/release-evidence/v{version}/windows-smoke.md`。不得提交使用者名稱、絕對路徑、VRM／VRMA 原檔、憑證、音訊、對話或其他私人內容；截圖先裁切或遮蔽。

用 `npm run evidence:manifest -- --version <version> [--installer-name …] [--installer-sha256 …] [--installer-size …] [--smoke-md] [--no-installer] [--ci-pass] [--sha …]` 建立機讀的 `manifest.json`，可選 `windows-smoke.md` 骨架。`--no-installer`（tip）時 `tag` 預設為 `null`，除非顯式傳 `--tag`。可用 `npm run evidence:verify` 對照 GitHub digest／SHA256SUMS／NotSigned 標示；`evidence:pe` 讀 PE Certificate Table（空＝NotSigned 機器證據，≠ SmartScreen）。每個版本只保留實際執行結果；無法執行的項目寫「未驗」與原因，不可預先勾選通過。證據目錄不是 installer、log dump 或私人媒體的保存位置。

至少記錄：

- VoxAvatar tag、commit SHA、installer 檔名、大小與 SHA-256。
- Windows edition／version／build、x64、顯示縮放與 GPU。
- installer Authenticode 狀態；未簽署即明記 `NotSigned`。
- 使用的測試素材只記可公開的來源、授權與格式，不提交原檔。
- 每項測試的通過／失敗、觀察結果與 issue 連結。
- 執行者、日期，以及是否為實體機、VM 或遠端桌面。

### 自動化前置 gate

```powershell
npm ci
npm run check
npm run assets:release
```

確認 GitHub 的 CI、CodeQL 與 Release workflow 全綠，Release 為 published、non-draft、non-prerelease、Latest，tag 指向預期 `main` commit。

下載正式資產後驗證：

```powershell
Get-FileHash .\VoxAvatar-*-windows-x64-setup.exe -Algorithm SHA256
Get-AuthenticodeSignature .\VoxAvatar-*-windows-x64-setup.exe
```

計算結果必須等於 Release 的 `SHA256SUMS.txt`。

### 安裝與生命週期

- [ ] 一般使用者權限可啟動 installer，不要求管理員權限。
- [ ] 自訂安裝位置、桌面捷徑與開始功能表捷徑符合選項。
- [ ] 首次啟動會開啟設定頁，不會因沒有內建模型而白屏或退出。
- [ ] 同版本重裝與上一個受支援版本升級不會遺失使用者 library／設定。
- [ ] 移除程式成功；是否保留每使用者資料有清楚行為。
- [ ] `voxavatar://show`、`hide`、`toggle` 的 protocol 註冊與移除符合預期。
- [ ] 已簽署版本顯示正確 publisher，並記錄 SmartScreen 結果。

### 核心桌面流程

- [ ] 匯入合法 VRM，切換預設模型，關閉再開仍能載入。
- [ ] 匯入 VRMA，Idle／Speaking／自訂動作可預覽與播放。
- [ ] 損壞、錯誤副檔名、過大或不含 VRM／VRMA extension 的 GLB 被拒絕，既有 library 不受影響。
- [ ] 透明區點穿；角色本體拖曳、縮放、旋轉與右鍵選單正常。
- [ ] 系統匣左鍵顯示／隱藏，右鍵選單、設定與結束正常。
- [ ] 100%、150%、225% DPI 的設定頁與預覽沒有阻擋操作的裁切。

### 語音與 MCP

- [ ] 自動與指定應用程式來源能找到 Windows 行程。
- [ ] 播放助理語音時產生口型與 Speaking；停止後回到 Idle。
- [ ] helper 缺失、目標行程不存在或無播放輸出時有可理解狀態。
- [ ] `/health` 回傳 `ok: true`，但不誤宣稱模型／listener 已就緒。
- [ ] `list_animations`、`play_animation`、`control_window`、`get_status` 均成功。
- [ ] 新增／刪除動作後，既有 MCP session 的工具描述更新。
- [ ] 非 loopback Host、未允許 origin、過大 body 與錯誤 schema 被拒絕。

### 完成判定

只有自動 gate、下載資產 SHA-256 與本節相關實機項目都有證據時，才可在 [`ROADMAP.md`](../ROADMAP.md)「目前健康」或 Release notes 宣稱該版本完成 Windows 實機驗收。單獨的 workflow success、installer 存在或本機開發版 smoke 都不夠。
