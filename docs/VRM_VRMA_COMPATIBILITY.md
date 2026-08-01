# VRM／VRMA 相容性矩陣（骨架）

本文件記錄 VoxAvatar 品質閘門的 **合成** 相容性案例，對應現有 Node 品質測試。真實 exporter（VRoid Studio、Blender VRM Add-on、Unity UniVRM 等）的實測矩陣 **尚未建立**，待取得可公開引用且授權清楚的樣本後再擴充。

## 範圍與邊界

- **已覆蓋**：`electron/vrm-quality.test.cjs`、`electron/vrma-quality.test.cjs` 中的 synthetic GLB 案例。
- **未覆蓋**：特定 exporter 版本、貼圖格式、表情 preset、實機 Three.js 載入與口型結果。
- **媒體政策**：不提交 `.vrm`／`.vrma` 二進位；案例由 [`electron/fixtures/vrm-vrma/builders.cjs`](../electron/fixtures/vrm-vrma/builders.cjs) 於測試執行時產生。機讀清單見 [`electron/fixtures/vrm-vrma/manifest.json`](../electron/fixtures/vrm-vrma/manifest.json)。

## 判定語意

品質分析輸出 `keep`（保留）、`review`（觀察）、`reject`（淘汰）三種判定，並附 0–100 分數與 issue code。目錄匯入時依設定頁的 `report`／`strict`／`off` 門檻決定是否略過檔案；本矩陣只記 **分析器預期**，不含 UI 行為。

## VRM 合成案例

| 案例 id | 描述 | 建構方式 | 預期判定 | 預期分數／issue | 對應測試 |
| --- | --- | --- | --- | --- | --- |
| `vrm-complete` | VRM 1.0 完整 humanoid＋mesh＋expression | `buildVrmGlb()` | keep 或 review | score ≥ 70；非 reject | `complete VRM scores as keep or mild review` |
| `vrm0-array-bones` | VRM 0.x `humanBones` 陣列格式 | `buildVrmGlb({ vrm0ArrayHumanoid: true })` | keep | score ≥ 75；無 `low_bone_coverage` | `VRM0 array humanBones is parsed for coverage (not false low_bone_coverage)` |
| `vrm-missing-extension` | 無 VRM／VRMC_vrm extension | `buildVrmGlb({ includeExtension: false })` | reject | `missing_vrm_extension` | `missing VRM extension is rejected` |
| `vrm-missing-humanoid` | 有 extension 但缺 humanoid | `buildVrmGlb({ includeHumanoid: false })` | review 或 reject | `missing_humanoid` | `missing humanoid is review or reject` |
| `vrm-broken` | 非 GLB 位元組 | 原始 `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## VRMA 合成案例

| 案例 id | 描述 | 建構方式 | 預期判定 | 預期分數／issue | 對應測試 |
| --- | --- | --- | --- | --- | --- |
| `vrma-smooth-loop` | 多骨平滑旋轉、可迴圈 | `buildRotationVrma()` | keep 或 review | score ≥ 70；非 reject | `smooth looping VRMA scores as keep or mild review` |
| `vrma-velocity-spike` | 中途角速度尖峰 | `buildRotationVrma({ spike: true, angle: 0.15 })` | review 或 reject | issue code 前綴 `velocity` | `velocity spike VRMA is marked review or reject` |
| `vrma-broken` | 非 GLB 位元組 | 原始 `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## 待辦（真實 exporter 矩陣）

以下項目刻意延後，不在本 skeleton 宣稱已完成：

1. 各 exporter／版本的代表性 `.vrm`／`.vrma` 樣本（僅引用來源與授權，二進位不入庫）。
2. Three.js 載入、骨架對位、表情與 VRMA 播放的實機結果欄位。
3. 與 [`docs/WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md) 匯入 smoke 的交叉引用。

## 相關文件

- 英文版：[`VRM_VRMA_COMPATIBILITY.en.md`](VRM_VRMA_COMPATIBILITY.en.md)
- Fixture 說明：[`electron/fixtures/vrm-vrma/README.md`](../electron/fixtures/vrm-vrma/README.md)
- 品質實作：[`electron/vrm-quality.cjs`](../electron/vrm-quality.cjs)、[`electron/vrma-quality.cjs`](../electron/vrma-quality.cjs)
