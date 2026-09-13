# VRM／VRMA 合成 fixtures

本目錄為 `electron/vrm-quality.test.cjs` 與 `electron/vrma-quality.test.cjs` 產生 synthetic GLB；repo 不保存 `.vrm`／`.vrma` 二進位。

- [`builders.cjs`](builders.cjs)：VRM 0.x／1.0 與 VRMA 測試建構器。
- [`manifest.json`](manifest.json)：案例 id、預期判定與對應測試。
- [`docs/VRM_VRMA_COMPATIBILITY.md`](../../../docs/VRM_VRMA_COMPATIBILITY.md)：公開案例矩陣與 exporter 證據狀態。

新增案例時同步 manifest、測試與相容矩陣。真實樣本必須遵守 [`ASSET_LICENSES.md`](../../../ASSET_LICENSES.md)，未確認再散布權的媒體不可提交。
