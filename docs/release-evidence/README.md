# Release evidence 目錄說明

本目錄存放各版本 Windows 發行的**誠實**證據紀錄（機讀 `manifest.json`、可選 `windows-smoke.md`／`sbom.json`）。

## 怎麼讀

- **Latest 公開安裝包**：以 GitHub [Releases](https://github.com/SanHsien/voxavatar/releases/latest) 為準；目前證據目錄應與 Latest tag 對齊（例如 `v0.16.14/`）。
- **tip／無 installer 的目錄**：可記錄 `main` 上尚未切安裝版的 SemVer（`--no-installer`）；`tag` 預設為 `null`，除非顯式傳 `--tag`。可寫 tip SHA，並用 `--ci-pass` 只把 `ci_gates` 標 pass。不得宣稱有可下載 installer 或已存在的 GitHub Release tag。
- **歷史目錄**（例如已刪除的舊 Release）：僅作當時紀錄，**不要**當成仍可下載的資產證據。可在該版 `manifest.json` 的 `notes` 標明已被更新版取代。
- **Exporter 樣本**：[`_templates/exporter-results.json`](_templates/exporter-results.json) 為空結果表；填寫前狀態維持 `pending-human-sample`。

| 角色 | 路徑／版本 |
| --- | --- |
| Latest installer 證據 | `v0.16.14/` |
| 目前 tip（無 installer） | 見最新 `v0.16.x/` 且 `hasInstaller=false` |

## 產生與驗證

```powershell
npm run evidence:manifest -- --version <ver> [--installer-name …] [--installer-sha256 …] [--installer-size …] [--sha …] [--release-url …] [--smoke-md] [--no-installer] [--ci-pass]
npm run evidence:verify -- --manifest docs/release-evidence/v<ver>/manifest.json [--online]
# 下載 installer 後（可選）：
node -e "console.log(require('./scripts/pe-authenticode-presence.cjs').inspectPeAuthenticodePresenceFile('path/to/setup.exe'))"
```

`smokeExecuted` 在真實 Windows 桌面驗收完成前必須維持 `false`；清單項目未執行者寫「未驗」。`evidence:verify`／PE 掃描只證明雜湊與「無憑證表」標示一致性，**不是** SmartScreen 通過。流程見 [`docs/RELEASING.md`](../RELEASING.md)。
