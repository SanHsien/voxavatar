# Release evidence 目錄說明

本目錄存放各版本 Windows 發行的**誠實**證據紀錄（機讀 `manifest.json`、可選 `windows-smoke.md`／`sbom.json`）。

## 怎麼讀

- **Latest 公開安裝包**：以 GitHub [Releases](https://github.com/SanHsien/voxavatar/releases/latest) 為準；目前證據目錄應與 Latest tag 對齊（例如 `v0.16.14/`）。
- **tip／無 installer 的目錄**：可記錄 `main` 上尚未切安裝版的 SemVer（`--no-installer`）；`tag` 預設為 `null`，除非顯式傳 `--tag`。不得宣稱有可下載 installer 或已存在的 GitHub Release tag。
- **歷史目錄**（例如已刪除的舊 Release）：僅作當時紀錄，**不要**當成仍可下載的資產證據。可在該版 `manifest.json` 的 `notes` 標明已被更新版取代。

## 產生方式

```powershell
npm run evidence:manifest -- --version <ver> [--installer-name …] [--installer-sha256 …] [--installer-size …] [--sha …] [--release-url …] [--smoke-md] [--no-installer]
```

`smokeExecuted` 在真實 Windows 桌面驗收完成前必須維持 `false`；清單項目未執行者寫「未驗」。流程見 [`docs/RELEASING.md`](../RELEASING.md)。
