# 發行 VoxAvatar

VoxAvatar 只從 `main` 的 `v{package.version}` tag 建立 Windows GitHub Release。workflow 位於 `.github/workflows/release.yml`。

## 前置條件

- 工作樹乾淨，`HEAD` 與 `origin/main` 同步。
- `package.json` 與 `package-lock.json` 版號一致。
- `CHANGELOG.md` 有該版本且沒有仍屬本版的 `Unreleased` 項目。
- 打包媒體已通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md) 與 manifest 閘門。
- 簽署時提供 `WIN_CSC_LINK`、`WIN_CSC_KEY_PASSWORD`；未簽署 build 不得宣稱已完成正式簽章驗收。

## 本機發行 gate

```powershell
npm ci
npm run check
npm run assets:release
npm run native:build
npm run native:test
npm run dist:windows
```

確認 `release/` 產生非空 NSIS 安裝檔，並在 Windows 實測首次啟動、模型匯入、語音來源、系統匣、`voxavatar://` 與 MCP。

## 版本與 tag

先用 SemVer 決定下一版，再同步 package 與 lockfile。例如把 prerelease 提升為 stable：

```powershell
npm version 0.1.0 --no-git-tag-version
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v0.1.0"
git push origin main
git tag v0.1.0
git push origin v0.1.0
```

不得把 tag 移到另一個 commit 或只推 tag 不推版本 commit。`scripts/check-release-tag.cjs` 會驗證 tag 與 package 版號。

## GitHub Actions

Release workflow 依序：

1. 驗證資產授權與 tag／package version。
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

只有 tag 或 workflow 綠燈，不等於 Release 已完成。
