# VRM / VRMA synthetic fixtures

本目錄定義 **合成** 相容性案例，對應 `electron/vrm-quality.test.cjs` 與 `electron/vrma-quality.test.cjs`。不提交 `.vrm`／`.vrma` 二進位；測試執行時由 [`builders.cjs`](builders.cjs) 於暫存目錄產生 GLB。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| [`manifest.json`](manifest.json) | 案例 id → 預期判定範圍 → Node 測試名稱 |
| [`builders.cjs`](builders.cjs) | 共用 GLB 建構器（VRM 1.0／VRM0、VRMA 旋轉動畫） |

## 案例一覽

完整說明與矩陣狀態見 [`docs/VRM_VRMA_COMPATIBILITY.md`](../../../docs/VRM_VRMA_COMPATIBILITY.md)。

| id | kind | 預期判定 | 對應測試 |
| --- | --- | --- | --- |
| `vrm-complete` | vrm | keep／review | complete VRM scores as keep or mild review |
| `vrm0-array-bones` | vrm | keep | VRM0 array humanBones is parsed… |
| `vrm-missing-extension` | vrm | reject | missing VRM extension is rejected |
| `vrm-missing-humanoid` | vrm | review／reject | missing humanoid is review or reject |
| `vrm-broken` | vrm | reject | broken file is rejected |
| `vrma-smooth-loop` | vrma | keep／review | smooth looping VRMA scores as keep or mild review |
| `vrma-velocity-spike` | vrma | review／reject | velocity spike VRMA is marked review or reject |
| `vrma-broken` | vrma | reject | broken file is rejected |

## 真實 exporter 矩陣

常見工具（VRoid Studio、Blender VRM Add-on 等）的實測矩陣 **尚未建立**；本目錄僅覆蓋品質閘門的 synthetic regression。新增真實案例時請遵守 [`ASSET_LICENSES.md`](../../../ASSET_LICENSES.md)，勿提交未授權媒體。
