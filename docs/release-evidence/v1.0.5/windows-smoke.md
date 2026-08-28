# Windows smoke evidence — v1.0.5

> `smokeExecuted=false`，因完整 Windows lifecycle matrix 仍有未驗項；本檔只記錄本輪實際完成的正式乾淨安裝與部分桌面 smoke。

## Release

- version: `1.0.5`
- tag（歷史紀錄，已被 `v1.0.6` 取代）：`v1.0.5`
- commit: `c9ad440d1c933f038b71e0fd895ed7d041a71d12`
- Release: <https://github.com/SanHsien/voxavatar/releases/tag/v1.0.5>
- Actions: <https://github.com/SanHsien/voxavatar/actions/runs/31800788259>

## Formal installer

- filename: `VoxAvatar-1.0.5-windows-x64-setup.exe`
- size: `177143840` bytes
- sha256: `49dad09d623247d95394991472702400bf9b21aec99d324db703563e7877074e`
- checksum: GitHub digest、`SHA256SUMS.txt`、本機 SHA-256 三路一致
- unsigned: `true`
- authenticode: `NotSigned`（PowerShell + empty PE Certificate Table）
- installed executable: per-user `AppData\Local\Programs\VoxAvatar\VoxAvatar.exe`；ProductVersion `1.0.5.0`／FileVersion `1.0.5`

## Environment

- OS: Windows 11 Pro `10.0.26200` build `26200`
- architecture: x64
- display scaling: 225%
- GPU: NVIDIA GeForce RTX 3060

## Checklist

- [x] **自動化前置 gate** (`ci_gates`): pass — Release workflow 在精確 tag SHA 完成授權資產 gate、Node 24 check、完整 dependency audit、Windows native build／self-test、NSIS 打包與發布。
- [ ] **安裝** (`install`): 部分驗證 — 正式 current-user installer exit 0；全新 userData 首次啟動顯示 AvatarSample_A，Settings 顯示 0 個自訂模型／0 個自訂動作；自訂位置與捷徑矩陣未驗。
- [ ] **升級** (`upgrade`): 未驗 — 本輪刻意清除舊資料做乾淨安裝，沒有驗證保留資料的 1.0.2→1.0.5 升級。
- [x] **移除** (`uninstall`): pass — 1.0.2 all-users uninstaller 移除程式檔與登錄；保留的 Roaming userData 另送資源回收筒，原路徑歸零後才安裝 1.0.5。
- [ ] **系統匣** (`tray`): 未驗 — Computer Use 未暴露 Windows notification area；以官方 `--settings` 第二實例入口開啟設定，未宣稱系統匣左右鍵通過。
- [ ] **DPI／縮放** (`dpi_scaling`): 部分驗證 — 225% DPI 的 overlay、模型／MCP 頁與即時預覽可讀；100%／150% 未驗。
- [ ] **角色尺寸 30%** (`size_30`): 未驗 — 本輪未操作 30% 尺寸。
- [ ] **語音與 MCP** (`voice_mcp`): 部分驗證 — Settings 顯示線上／就緒、6 工具／12 動作；獨立 Streamable HTTP client 回報 readiness complete、listener `no_output` 與 12 動作。真實語音未播放。
- [x] **簽署標示（NotSigned）** (`signing_label`): pass — 三路 checksum 一致，PowerShell 與 PE Certificate Table 雙軌確認未簽署。
- [ ] **SmartScreen／publisher** (`smartscreen`): 未驗 — 無簽署密鑰，不宣稱 SmartScreen 或具名 publisher。

## Findings

- 乾淨安裝前，1.0.2 的程式與解除安裝登錄已移除；uninstaller 不刪除每使用者資料，因此依本輪要求另將 `userData` 送資源回收筒。1.0.5 首次啟動前原路徑不存在。
- 首次啟動顯示 AvatarSample_A；模型頁列出 4 個內建模型，0 個自訂模型／動作。MCP 頁穩定後與獨立 client 一致顯示線上／就緒、6 工具與 12 個可播放動作。
- `v1.0.5` 當時成功後刪除 `v1.0.4` Release／tag。此目錄僅作歷史紀錄；公開 Latest 已改為 `v1.0.6`，對應 Release／tag 已刪。

驗證流程見 [`docs/RELEASING.md`](../../RELEASING.md)。
