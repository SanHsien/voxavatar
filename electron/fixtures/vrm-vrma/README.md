# VRM / VRMA synthetic fixtures

本目錄定義 **合成** 相容性案例，對應 `electron/vrm-quality.test.cjs` 與 `electron/vrma-quality.test.cjs`。不提交 `.vrm`／`.vrma` 二進位；測試執行時由 [`builders.cjs`](builders.cjs) 於暫存目錄產生 GLB。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| [`manifest.json`](manifest.json) | 案例 id → 預期判定範圍 → Node 測試名稱 |
| [`builders.cjs`](builders.cjs) | 共用 GLB 建構器（VRM 1.0／VRM0、VRMA 旋轉動畫） |

## 案例一覽

完整說明、Exporter 備註與矩陣狀態見 [`docs/VRM_VRMA_COMPATIBILITY.md`](../../../docs/VRM_VRMA_COMPATIBILITY.md)。

| id | kind | 預期判定 | 對應測試 |
| --- | --- | --- | --- |
| `vrm-complete` | vrm | keep／review | complete VRM scores as keep or mild review |
| `vrm0-array-bones` | vrm | keep | VRM0 array humanBones is parsed… |
| `vrm-missing-extension` | vrm | reject | missing VRM extension is rejected |
| `vrm-missing-humanoid` | vrm | review／reject | missing humanoid is review or reject |
| `vrm-no-mesh` | vrm | reject | VRM without meshes is rejected |
| `vrm-sparse-humanoid` | vrm | review | sparse humanoid bone coverage is marked review |
| `vrm-no-textures` | vrm | keep／review | VRM without textures is flagged |
| `vrm-no-expressions` | vrm | keep／review | VRM without expressions is flagged |
| `vrm-broken` | vrm | reject | broken file is rejected |
| `vrma-smooth-loop` | vrma | keep／review | smooth looping VRMA scores as keep or mild review |
| `vrma-velocity-spike` | vrma | review／reject | velocity spike VRMA is marked review or reject |
| `vrma-too-short` | vrma | review／reject | too-short VRMA clip is marked review or reject |
| `vrma-no-animation` | vrma | reject | VRMA without animation tracks is rejected |
| `vrma-loop-seam` | vrma | review／reject | loop seam VRMA is marked review or reject |
| `vrma-broken` | vrma | reject | broken file is rejected |

## 真實 exporter 矩陣

常見工具（VRoid Studio、UniVRM、Blender VRM Add-on 等）的實測矩陣 **尚未建立**；本目錄僅覆蓋品質閘門的 synthetic regression。Exporter 公開文件假設見相容性文件中的 **Exporter 備註** 一節。新增真實案例時請遵守 [`ASSET_LICENSES.md`](../../../ASSET_LICENSES.md)，勿提交未授權媒體。
