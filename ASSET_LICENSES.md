# VoxAvatar 資產授權

程式碼採 MIT License；VRM、VRMA、圖片與環境貼圖各自遵循來源授權。**可以免費下載或合法本機使用，不等於可以把原檔放進 GitHub repo 或安裝包。** 精確檔案清單、來源、限制與 SHA-256 以 [`public/assets/manifest.json`](public/assets/manifest.json) 為準。

## 目前發行內容

| 類型 | 狀態 | 說明 |
| --- | --- | --- |
| 角色 VRM | **4 個** | VRoid Project 的 `AvatarSample_A`／`B`／`C`，以及夢前黎的「つくよみちゃん公式3Dモデル タイプA」 |
| 動作 VRMA | **13 個／12 個動作槽** | 來自 3 個作者明示 CC0 的 motion pack；含 1 段 Idle、1 段 Speaking 與 10 個可由 MCP／介面播放的自訂動作；全部為程式判定 `keep` |
| `public/assets/avatar.png` | VoxAvatar 原創品牌圖示 | 用於 repo、README、程式、安裝檔、工作列與系統匣，不含第三方角色素材 |
| `@pmndrs/assets` 環境貼圖 | CC0 1.0 資源集 | 執行時由套件提供，來源包含 Poly Haven |

## 內建 VRM

### VRoid 官方 Sample A／B／C

- 創作者：VRoid Project／pixiv Inc.
- 官方模型：[A](https://hub.vroid.com/en/characters/2843975675147313744/models/5644550979324015604)／[B](https://hub.vroid.com/en/characters/7939147878897061040/models/2292219474373673889)／[C](https://hub.vroid.com/en/characters/1248981995540129234/models/8640547963669442173)
- 適用條款：[VRoid sample-model conditions of use](https://vroid.pixiv.help/hc/en-us/articles/4402394424089-VRoidPreset-A-Z)（頁面標示 2024-12-26 更新；2026-08-14 查核）
- Credit：條款不要求署名；本專案仍自願標示「AvatarSample_A／B／C by VRoid Project / pixiv Inc.」。

官方頁明列 Avatar 使用、個人／公司商用、改作與再配布均為 Allow。三個模型**不是 CC0**；不得把 sample model 或其中資料收費再配布、用其資料開發或提供角色建立服務、暗示 pixiv 背書，並須遵守官方頁列出的其他禁止行為。VoxAvatar 只免費附於開源 repo／免費安裝包，不把模型納入程式碼的 MIT License。

### つくよみちゃん公式3Dモデル タイプA

- 檔案版本：官方 1.0.0「通常版／輪郭線あり」
- 創作者：夢前黎（Rei Yumesaki）；裙襬調整 DONAMO-163
- 官方來源與條款：[つくよみちゃん公式3Dモデル タイプA](https://tyc.rei-yumesaki.net/material/avatar/3d-a/)（2026-08-14 查核）
- 必要 credit：`つくよみちゃん公式3Dモデル タイプA © Rei Yumesaki`

官方條款明確允許把未改作模型收錄於軟體後免費或付費散布，但必須保留角色身分、credit 與原條款的繼承義務。不得把她說成 VoxAvatar 原創角色、用於批判攻擊或特定政治／宗教／思想立場的倡議，也不得以 VRoid Hub 的公開再配布機制覆寫原授權；未改作原檔本身不得作為付費商品。使用者公開含此角色的內容時仍須遵守官方現行條款。

## 內建 CC0 VRMA

| 來源 | 創作者 | 入庫數 | 用途 |
| --- | --- | ---: | --- |
| [`SachiVRMA1`](https://booth.pm/ja/items/6412084) | sashii | 4 | Idle、Speaking 與兩段飛行姿勢 |
| [`使いどころに困るモーションセット`](https://booth.pm/ja/items/5527394) | へすい／rerofumi | 7 | 道歉、運動、手機、喝水、鼓勵、驚訝與展示姿勢 |
| [`CC0-animation-retarget-vrm`](https://booth.pm/ja/items/7861818) | sashii；原 Josie 動作 JenJell | 2 | 步行與慢跑 |

三個作者頁及隨附 README 都明示 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)；可改作、商用及再配布，不要求署名。本專案仍保留來源 credit，並只挑入目前本機實際使用、由 VoxAvatar 品質分析判定為 `keep` 的 13 個檔案（78–100 分）。預設 `keep` 必須 **高於 75 分**且沒有高嚴重度問題；75 分仍是 `review`，即使可本機匯入也不算發行通過。檔名與逐檔 SHA-256 見 manifest。

## 2026-08-14 本機資源審查

審查來源為 `C:\Users\SanHsien\OneDrive\Downloads\voxavatar` 與目前 VoxAvatar userData 中實際登記的檔案；以 SHA-256 對應，不能只靠檔名。

| 結論 | 資源 | 理由 |
| --- | --- | --- |
| **已入庫** | AvatarSample_A／B／C、つくよみちゃん Type A、上述 13 個 CC0 VRMA | 精確作者來源、再配布條款與本機檔案 digest 都可稽核；4 個 VRM 皆 100／`keep`，13 個 VRMA 皆為 `keep` |
| **授權可、品質未過發行門檻** | `airplane-01`、`dance-spin`、`gesture-conversation-01`、`greeting-01`／`02`、`idle-04`／`05`／`stand`、`pose-skirt`、`sit` | 都是 CC0，但程式因循環接縫判定 75／`review`；只保留在本機，不進 repo |
| **暫不入庫** | `【DL可】水色2【FREE】`、`Ki`、`Angel` | VRM 內嵌 VRoid Hub 授權參數雖標示 `redistribution=allow`，但本機檔案沒有可驗證的精確原始 model URL／版本鏈；找到原頁並核對版本後可重審 |
| **不得入庫** | Daily式 Miku、Hoshino Ai、Rinrin Shinomiya、Ymir Fritz | 內嵌 VRM meta 明列 `Redistribution_Prohibited` 或僅作者可用 |
| **不得入庫** | pixiv 官方 `VRMA_MotionPack`、Countach、目擊！テト31世、ワンダフルなVRMAセット等 | 條款禁止未授權原檔／改作檔再配布，或禁止以可直接取出的形式包入軟體 |
| **暫不入庫** | Reading、`vrma5ko`、`vrma形式`、うでぶんぶん、首を振る及其他無完整來源鏈的動作 | 本機資料不足以證明 GitHub 與安裝包再配布權；免費、檔名含 `CC0` 或品質分數高都不能補足授權 |

`xikhar/persona` 的 `idle.vrma` 與 17 個 speaking chunk 也維持排除。上游 [`public/assets/LICENSES.md`](https://github.com/xikhar/persona/blob/main/public/assets/LICENSES.md) 明確指出它們不屬於 Persona 的 MIT License，且沒有另授予 reuse license；逐檔 metadata 也沒有作者、原始公開來源或授權。

## 使用者本機匯入

可從 [VRoid Hub](https://hub.vroid.com/)、[BOOTH](https://booth.pm/) 或角色官方網站取得素材，也可用 [VRoid Studio](https://vroid.com/studio) 建立原創 VRM。下載前逐一確認：

- 是否允許下載與 Avatar 使用。
- 是否限制個人／商用、直播、改作或署名。
- 是否禁止再配布或以可取出狀態包入其他軟體。

本機使用不受 repo 的「可再配布」門檻限制；例如官方 VRoid Photo Booth VRMA [BOOTH 5512385](https://booth.pm/en/items/5512385) 可依其條款本機匯入，但不可直接提交到本 repo 或安裝包。匯入方式見 [`docs/CHARACTER_BEHAVIOR.md`](docs/CHARACTER_BEHAVIOR.md)。

## 新增打包媒體的發行閘門

任何 VRM／VRMA 進入 Git 或 Release 前，必須同時完成：

1. 保存可稽核的官方來源與授權版本。
2. 明確確認允許 GitHub 公開散布及安裝包再散布。
3. 以內容分析確認實際 VRM／VRMA 格式、角色／動作用途及技術品質，不能只看副檔名或檔名。
4. 在 `public/assets/library.json` 宣告用途，在 `public/assets/manifest.json` 記錄創作者、原始來源、授權 URL、credit、限制、精確 SHA-256 與 `distributionAllowed: true`。
5. 更新本檔的媒體清單與必要署名。
6. 執行 `npm run assets:release`；授權欄位缺漏、檔案遭替換、digest 不符或品質不是 `keep` 都必須 fail closed。

本機測試媒體、使用者匯入媒體與來源不明媒體不可提交或發行。
