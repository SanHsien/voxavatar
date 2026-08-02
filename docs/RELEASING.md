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

完成條件：Latest 指向相同 tag；tag 與 Release target 可追到預期 main commit；installer 與 checksum 非空；下載後 SHA-256 相符；依 [`WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md) 完成可執行的安裝與 GUI smoke。只有 tag 或 workflow 綠燈不算完成。

新版 Release 成功且成為 Latest 後，才刪除其餘舊 Release／tag；失敗則全部保留。刪除舊 tag 是版本清理，不得把既有 tag 移到另一個 commit。

## 輔助證據

- `npm run baseline:bundle`：renderer bundle 對照。
- `npm run evidence:manifest`：建立 release-evidence 的機讀 `manifest.json` metadata 模板；人工 smoke 另依 Windows 驗收文件填寫。
- `npm run sbom`：從 lockfile 產生 production dependency SBOM，預設寫入 `release/sbom.json`。

這些腳本只用 Node 內建模組；模板或 runner 結果不能取代真實桌面證據。
