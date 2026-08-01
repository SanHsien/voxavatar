# 發行 VoxAvatar

VoxAvatar 只從 `main` 的 `v{package.version}` tag 建立 Windows GitHub Release。workflow 位於 `.github/workflows/release.yml`。

## 前置條件

- 工作樹乾淨，`HEAD` 與 `origin/main` 同步。
- `package.json` 與 `package-lock.json` 版號一致。
- `CHANGELOG.md` 有該版本且沒有仍屬本版的 `Unreleased` 項目。
- 打包媒體已通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md) 與 manifest 閘門。
- 簽署時在 GitHub `release` environment 提供 `WIN_CSC_LINK`、`WIN_CSC_KEY_PASSWORD`；未簽署 build 不得宣稱已完成正式簽章驗收。

## 本機版本 gate

```powershell
npm ci
npm run check
npm run assets:release
```

一般開發環境不必為了發版安裝 Visual Studio Build Tools。GitHub Release workflow 的 Windows runner 是正式 native build、self-test 與 NSIS gate。

若本機已有 C++ toolchain，可額外提早驗證：

```powershell
npm run native:build
npm run native:test
npm run dist:windows
```

不論安裝包由本機或 GitHub 建立，都必須下載正式 Release，依 [`WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md) 實測首次啟動、模型匯入、語音來源、系統匣、`voxavatar://`、MCP、升級與移除。

## 版本與 tag

先用 SemVer 決定下一版，再同步 package 與 lockfile。例如把 prerelease 提升為 stable：

```powershell
npm version 0.1.0 --no-git-tag-version
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
git tag v0.1.0
# 必須先推 tag、再推 main：release environment 只允許 main 部署；
# main tip 已有 v{version} tag 時，push main 會觸發打包。
git push origin v0.1.0
git push origin main
# 亦可在 main 上手動：
# gh workflow run release.yml --repo SanHsien/voxavatar --ref main -f tag=v0.1.0
```

不得把 tag 移到另一個 commit 或只推 tag 不推版本 commit。Release 可由可信 `main` 手動 dispatch，或在 **push `main` 且 `v{package.version}` tag 已精確指向該 tip** 時自動打包（一般 `main` push 若無對應 tip tag 會略過）。兩者都在執行前驗證 workflow／`main`／tag commit 相同，package／publish 固定 checkout 該 SHA，發布前再驗 tag 未移動。`scripts/check-release-tag.cjs` 另驗 tag 與 package 版號。GitHub `release` environment 只允許 `main` 部署，故不以 tag ref 觸發 packaging。

推送流程（agent／本機皆可）：

```powershell
git tag v0.2.5
git push origin v0.2.5
git push origin main
# main tip 已 tagged 會觸發 Release；亦可改手動：
# gh workflow run release.yml --repo SanHsien/voxavatar --ref main -f tag=v0.2.5
```

每次準備 bump／push 前，依 [`AGENTS.md`](../AGENTS.md) 檢討 `CHANGELOG`、雙語 `README`／`ROADMAP`／`SECURITY`、`REVIEW` 與決策／流程文件。

## 舊版清理

新版 GitHub Release **成功且 Latest 指向新 tag 後**，刪除其餘舊 GitHub Release，並在 repository ruleset 允許時刪除對應舊 tag，只保留最新版。新版失敗則不動舊版。不可對既有 tag 做 force-update；「Immutable release tags」ruleset 禁止刪除時，先由擁有者暫時調整 ruleset／bypass，刪除後再恢復「禁止 force-update／誤刪」保護。

## GitHub Actions

Release workflow 依序：

1. 從 `main` 的可信 workflow 驗證 tag 精確指向目前 `main`，再驗資產授權與 tag／package version。
2. 在 Windows 執行完整 `npm run check`、原生 build／self-test 與 NSIS 打包。
3. 上傳安裝檔、產生 `SHA256SUMS.txt`。
4. 建立 published、non-draft、non-prerelease 且 `make_latest: true` 的 GitHub Release。

beta 字樣保留在版本與標題中，但 GitHub Release 不標 prerelease，避免 Latest 隱藏。

## 發布後驗證

```powershell
gh release view v0.1.0 --repo SanHsien/voxavatar --json url,isDraft,isPrerelease,targetCommitish,assets
gh api repos/SanHsien/voxavatar/releases/latest
```

完成條件：

- Release 已 published，`isDraft=false`、`isPrerelease=false`。
- Latest API 回傳同一 tag。
- tag 與 Release target 可追溯到預期 `main` commit。
- Windows installer 與 `SHA256SUMS.txt` 均存在且非空。
- 從 GitHub 下載後重新計算 SHA-256，解包／安裝與 GUI smoke 通過。

人工證據依 [`release-evidence/README.md`](release-evidence/README.md) 留存；不得用 GitHub runner 的 workflow 綠燈取代真實桌面驗收。

只有 tag 或 workflow 綠燈，不等於 Release 已完成。
