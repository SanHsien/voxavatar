# VRMA 動作指南

VoxAvatar 預設提供 Idle 與 Speaking 動作槽，但安裝包**不附任何 VRMA**。沒有 VRMA 時角色保持模型預設姿勢，口型仍可依語音輸出音量運作。

## 取得動作

- [VRoid 官方 Photo Booth VRMA 7 種組](https://booth.pm/en/items/5512385)：品質較高，適合使用者本機匯入；依原頁規約，不可把可取出的原檔塞入本 repo 或安裝包。
- [BOOTH](https://booth.pm/)：搜尋 `VRMA`，逐商品確認個人／商用、署名、改作與再配布條款。
- 自製或委製：只有取得明確再散布授權，才可能納入 Release。

## 匯入

1. 下載並解壓 `.vrma`。
2. 系統匣 →「設定…」→「動作」。
3. 在 Idle、Speaking 或自訂動作卡加入檔案；也可選目錄遞迴匯入。
4. 用預覽確認骨架、位移、循環與角色相容性。

Idle 會從可用的非說話動作池隨機抽播並避免立即重複；Speaking 在偵測到目標應用程式語音輸出時使用。自訂動作可提供 MCP 名稱、描述與觸發情境。

## 批次匯入品質把關

| 模式 | 行為 |
| --- | --- |
| 分析並寫報告 | 全部匯入，產生 `voxavatar-vrma-report.md` |
| 嚴格 | 略過啟發式評為淘汰的檔案，仍輸出報告 |
| 關閉 | 只匯入，不分析、不寫報告 |

報告預設寫入掃描目錄，也可在設定頁指定固定資料夾。評分只偵測平滑度、速度尖峰、解析錯誤等訊號，不代表美術品質或授權狀態；最終仍以即時預覽與素材條款為準。

## 為何不內建

專案曾短暫打包程序產生的 Idle，但品質僵硬；官方 VRoid 動作又限制原檔再配布，因此改採「使用者合法取得後本機匯入」。開發用產生腳本 `scripts/generate-packaged-idle-vrmas.cjs` 不會在 CI 或 Release 自動執行。

若未來要內建動作，必須通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md) 的來源、再散布、manifest、credit 與 release gate。
