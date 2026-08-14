# VRM／VRMA 相容性矩陣（骨架）

本文件記錄 VoxAvatar 品質閘門的 **合成** 相容性案例，對應現有 Node 品質測試。真實 exporter 實測矩陣 **尚未建立**；下方「Exporter 備註」僅整理公開文件中的常見假設與已知限制，**不代表**已用真實樣本驗證。

## 範圍與邊界

- **已覆蓋**：`electron/vrm-quality.test.cjs`、`electron/vrma-quality.test.cjs` 中的 synthetic GLB 案例。
- **未覆蓋**：特定 exporter 版本、貼圖格式、表情 preset、實機 Three.js 載入與口型結果。
- **媒體政策**：不提交 `.vrm`／`.vrma` 二進位；案例由 [`electron/fixtures/vrm-vrma/builders.cjs`](../electron/fixtures/vrm-vrma/builders.cjs) 於測試執行時產生。機讀清單見 [`electron/fixtures/vrm-vrma/manifest.json`](../electron/fixtures/vrm-vrma/manifest.json)。
- **匯入安全**：不相容檔案在寫入 catalog 前即遭拒絕；回歸測試見 `electron/settings-store.test.cjs`（`failed model import…`、`addAnimationClips rolls back…`）。

## 判定語意

品質分析輸出 `keep`（保留）、`review`（觀察）、`reject`（淘汰）三種判定，並附 0–100 分數與 issue code。目錄匯入時依設定頁的 `report`／`strict`／`off` 門檻決定是否略過檔案；分數門檻可由 Settings 調整（預設淘汰 < 60、觀察 60–75、保留 > 75，VRM／VRMA 共用）。本矩陣只記 **分析器預期**，不含 UI 行為。

## VRM 合成案例

| 案例 id | 描述 | 建構方式 | 預期判定 | 預期分數／issue | 對應測試 |
| --- | --- | --- | --- | --- | --- |
| `vrm-complete` | VRM 1.0 完整 humanoid＋mesh＋expression | `buildVrmGlb()` | keep 或 review | score ≥ 70；非 reject | `complete VRM scores as keep or mild review` |
| `vrm0-array-bones` | VRM 0.x `humanBones` 陣列格式 | `buildVrmGlb({ vrm0ArrayHumanoid: true })` | keep | score > 75；無 `low_bone_coverage` | `VRM0 array humanBones is parsed for coverage (not false low_bone_coverage)` |
| `vrm-missing-extension` | 無 VRM／VRMC_vrm extension | `buildVrmGlb({ includeExtension: false })` | reject | `missing_vrm_extension` | `missing VRM extension is rejected` |
| `vrm-missing-humanoid` | 有 extension 但缺 humanoid | `buildVrmGlb({ includeHumanoid: false })` | review 或 reject | `missing_humanoid` | `missing humanoid is review or reject` |
| `vrm-no-mesh` | 有 extension 但無 mesh | `buildVrmGlb({ includeMesh: false })` | reject | `no_meshes` | `VRM without meshes is rejected` |
| `vrm-sparse-humanoid` | 僅 hips／spine／head 等稀疏骨骼 | `buildVrmGlb({ sparseHumanoidBones: true })` | review | `low_bone_coverage` | `sparse humanoid bone coverage is marked review` |
| `vrm-no-textures` | 有 mesh／material 但無 textures | `buildVrmGlb({ includeTextures: false })` | keep 或 review | `no_textures` | `VRM without textures is flagged` |
| `vrm-no-expressions` | 無表情／blendShape | `buildVrmGlb({ includeExpressions: false })` | keep 或 review | `missing_expressions` | `VRM without expressions is flagged` |
| `vrm-broken` | 非 GLB 位元組 | 原始 `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## VRMA 合成案例

| 案例 id | 描述 | 建構方式 | 預期判定 | 預期分數／issue | 對應測試 |
| --- | --- | --- | --- | --- | --- |
| `vrma-smooth-loop` | 多骨平滑旋轉、可迴圈 | `buildRotationVrma()` | keep 或 review | score ≥ 70；非 reject | `smooth looping VRMA scores as keep or mild review` |
| `vrma-velocity-spike` | 中途角速度尖峰 | `buildRotationVrma({ spike: true, angle: 0.15 })` | review 或 reject | issue code 前綴 `velocity` | `velocity spike VRMA is marked review or reject` |
| `vrma-too-short` | 時長 < 0.4 秒 | `buildRotationVrma({ duration: 0.25, frames: 6 })` | review 或 reject | `too_short` | `too-short VRMA clip is marked review or reject` |
| `vrma-no-animation` | GLB 內無 animation 區塊 | `buildRotationVrma({ includeAnimation: false })` | reject | `no_animation` | `VRMA without animation tracks is rejected` |
| `vrma-loop-seam` | 首尾姿態接縫落差（非中途 spike） | `buildRotationVrma({ loopSeam: true, … })`；預設 `loop` | review 或 reject | issue code 前綴 `loop_seam`；非 `velocity_spike` | `loop seam VRMA is marked review or reject` |
| `vrma-one-shot-seam` | 同上接縫，用途 `one-shot` | `analyzeVrmaFile(…, { purpose: "one-shot" })` | 非 reject（不套用接縫扣分） | 無 `loop_seam*` | `one-shot purpose does not reject for loop seam alone` |
| `vrma-pose-static` | 近靜態，用途 `pose` | `buildRotationVrma({ angle: 0 })` + `purpose: "pose"` | 不因 `dead_motion` 扣分 | 無 `dead_motion` | `pose purpose skips dead-motion…` |
| `vrma-broken` | 非 GLB 位元組 | 原始 `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

動作用途（`loop`／`one-shot`／`pose`）由分析選項或 settings schema 7 的 clip `purpose` 提供；未指定時預設 `loop`。目錄匯入會依目標動作類型推斷用途。

## Exporter 備註

以下整理常見工具在 **公開文件** 中的假設與已知限制。狀態欄位說明：

- `synthetic-covered`：已有對應合成案例與自動化測試，但 **非** 該 exporter 真實輸出。
- `pending-human-sample`：需取得可公開引用且授權清楚的真實 `.vrm`／`.vrma` 後才能填寫實測欄位。

| Exporter | 典型輸出 | 公開文件假設／已知限制 | 合成覆蓋 | 狀態 |
| --- | --- | --- | --- | --- |
| **VRoid Studio** | VRM 0.x／1.0；官方 VRMA | 預設輸出含 humanoid、mesh、表情 preset；VRM 0.x 使用 `humanBones` **陣列**；VRMA 來自 VRoid Hub 官方動作庫 | `vrm-complete`、`vrm0-array-bones`、`vrm-no-expressions`、`vrma-smooth-loop` | `synthetic-covered`（VRM 骨架／表情缺損）；`pending-human-sample`（VRoid 真實檔） |
| **UniVRM**（Unity） | VRM 0.x／1.0；VRMA（UniVRM 1.x） | 需正確設定 Unity Humanoid Avatar 才會寫入完整 humanoid；座標系為 Unity 左手系，匯出時轉 glTF；表情為 blendShape 綁定 | `vrm-complete`、`vrm-sparse-humanoid`、`vrm-no-textures`、`vrma-smooth-loop` | `synthetic-covered`（稀疏骨骼／貼圖缺損）；`pending-human-sample`（Unity 管線實檔） |
| **Blender VRM Add-on** | VRM 0.x／1.0 | 依 Armature 與 VRM Humanoid 面板對位；可選匯出 mesh／blend shape；骨骼命名須符合 VRM humanoid 規範，否則覆蓋不足 | `vrm-sparse-humanoid`、`vrm-no-mesh`、`vrm-no-textures`、`vrm-missing-humanoid` | `synthetic-covered`（缺 mesh／貼圖／稀疏骨骼）；`pending-human-sample`（Blender 匯出實檔） |

> 公開文件來源（未驗證版本號）：[VRM Consortium 規格](https://vrm.dev/en/vrm/vrm_meta/)、[UniVRM README](https://github.com/vrm-c/UniVRM)、[Blender VRM Add-on 文件](https://vrm-addon-for-blender.info/en/latest/)。版本差異與實際檔案行為以真實樣本為準。

## 待辦（真實 exporter 矩陣）

以下項目刻意延後，不在本 skeleton 宣稱已完成：

1. 各 exporter／版本的代表性 `.vrm`／`.vrma` 樣本（僅引用來源與授權，二進位不入庫）。
2. Three.js 載入、骨架對位、表情與 VRMA 播放的實機結果欄位。
3. 與 [`docs/RELEASING.md`](RELEASING.md)「Windows 發行驗收」匯入 smoke 的交叉引用；機讀骨架見 [`release-evidence/_templates/exporter-results.json`](release-evidence/_templates/exporter-results.json) 與 [`exporter-sample.schema.json`](release-evidence/_templates/exporter-sample.schema.json)。

### 真實樣本證據列（尚未填寫結果）

| Exporter | 樣本來源（授權清楚才填） | 工具版本 | 匯入／品質結果 | Three.js 播放 | 證據連結 | 狀態 |
| --- | --- | --- | --- | --- | --- | --- |
| VRoid Studio | **未驗**（尚無授權清楚之可引用樣本） | — | 未驗 | 未驗 | [`docs/release-evidence/`](release-evidence/) | pending-human-sample |
| UniVRM | **未驗** | — | 未驗 | 未驗 | 同上 | pending-human-sample |
| Blender VRM Add-on | **未驗** | — | 未驗 | 未驗 | 同上 | pending-human-sample |

填寫時只記錄來源 URL、授權摘要、工具版本與通過／失敗／未驗；**不要**提交 `.vrm`／`.vrma` 二進位。匯入 smoke 步驟見 [`RELEASING.md`](RELEASING.md)。

## 相關文件

- Fixture 說明：[`electron/fixtures/vrm-vrma/README.md`](../electron/fixtures/vrm-vrma/README.md)
- 品質實作：[`electron/vrm-quality.cjs`](../electron/vrm-quality.cjs)、[`electron/vrma-quality.cjs`](../electron/vrma-quality.cjs)
- 維護文件僅繁中；不另建英文平行檔。
