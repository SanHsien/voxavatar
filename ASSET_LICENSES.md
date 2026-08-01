# VoxAvatar 資產授權

程式碼採 MIT License；VRM、VRMA、圖片與環境貼圖各自遵循來源授權。**使用者可以合法下載後本機匯入，不代表專案可以再散布原檔。**

## 目前發行內容

| 類型 | 狀態 | 說明 |
| --- | --- | --- |
| 角色 VRM | 無 | `public/assets/library.json` 的 `models` 為空，首次啟動由使用者匯入 |
| Idle／Speaking VRMA | 無 | 系統動作槽存在，但不附身體動作素材 |
| `public/assets/avatar.png` | 專案 UI 圖示 | 僅作為應用程式與 repo 視覺識別 |
| `@pmndrs/assets` 環境貼圖 | CC0 1.0 資源集 | 執行時由套件提供，來源包含 Poly Haven |

## 使用者本機匯入

可從 [VRoid Hub](https://hub.vroid.com/)、[BOOTH](https://booth.pm/) 或角色官方網站取得素材，也可用 [VRoid Studio](https://vroid.com/studio) 建立原創 VRM。下載前逐一確認：

- 是否允許下載與 Avatar 使用。
- 是否限制個人／商用、直播、改作或署名。
- 是否禁止再配布或以可取出狀態包入其他軟體。

官方 VRoid Photo Booth VRMA [BOOTH 5512385](https://booth.pm/en/items/5512385) 適合本機匯入，但不可直接提交到本 repo 或安裝包。匯入方式見 [`docs/IDLE_MOTIONS.md`](docs/IDLE_MOTIONS.md)。

## 新增打包媒體的發行閘門

任何 VRM／VRMA 進入 Git 或 Release 前，必須同時完成：

1. 保存可稽核的官方來源與授權版本。
2. 明確確認允許 GitHub 公開散布及安裝包再散布。
3. 在 `public/assets/library.json` 宣告用途，在 `public/assets/manifest.json` 記錄來源、授權、credit 與 `distributionAllowed: true`。
4. 更新本檔的媒體清單與必要署名。
5. 執行 `npm run assets:release`；任何缺漏都必須 fail closed。

本機測試媒體、使用者匯入媒體與來源不明媒體不可提交或發行。
