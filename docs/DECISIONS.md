# VoxAvatar 現行決策

最後修訂：2026-08-02

本檔只保留仍影響實作的取捨，不重述版本歷史、操作步驟或路線圖。歷史見 [`CHANGELOG.md`](../CHANGELOG.md)，未來工作見 [`ROADMAP.md`](../ROADMAP.md)，具體發行流程見 [`RELEASING.md`](RELEASING.md)。

## 1. 產品與上游

- 顯示名為 **VoxAvatar**，識別字串為 `voxavatar`；產品只維護 Windows Electron、WASAPI 與 NSIS。
- 上游為 `xikhar/persona`，保留 MIT 與 attribution。已 squash 的 `docs/contribution`、`feat/settings`、`feat/ui-theme`、`fix/mcp-update` 不再合併，只挑選符合本 fork 邊界的變更。
- 上游評估水位與 issue／PR 結論見 [`UPSTREAM_EVAL.md`](UPSTREAM_EVAL.md)（commit 水位 `cf27d12`；open #16／#13 範圍外，#11 已涵蓋）。
- 硬性不收：PipeWire／Hyprland／macOS native、`PERSONA_*` 識別、未確認再散布權的上游 `demo.jpg`、把授權政策搬離根目錄 `ASSET_LICENSES.md`。
- VoxAvatar 是桌面角色呈現層，不在應用程式內執行 LLM、保存聊天紀錄或取代聊天客戶端。

## 2. 音訊與本機整合

- 預設只分析指定應用程式的 WASAPI playback loopback 音量；`output` 模式須由使用者明確啟用，並警告它會涵蓋目前輸出裝置的所有聲音。
- 不擷取麥克風、不保存／傳送音訊、不轉錄。任何擴張都視為新的安全設計。
- MCP／HTTP bridge 僅綁定 loopback，限制 Host、origin、body、session 與 schema；不提供任意命令或任意檔案存取。
- MCP CLI、protocol 與環境變數分別使用 `voxavatar`、`voxavatar://`、`VOXAVATAR_*`。

## 3. 媒體與角色表現

- 安裝包預設不內建角色或動作。使用者本機匯入不代表專案具有再散布權；打包媒體須通過 [`ASSET_LICENSES.md`](../ASSET_LICENSES.md)。
- 匯入先在 app-controlled 暫存檔完成有界 GLB／VRM／VRMA 驗證，再 atomic rename；失敗不得污染既有 catalog。
- 目錄品質報告是啟發式輔助，不能取代人工預覽或授權審查。VRM 與 VRMA 共用既有 quality-gate 設定鍵，避免平行設定漂移。
- Idle、Speaking、自訂動作與後續狀態／氣泡契約集中在 [`CHARACTER_BEHAVIOR.md`](CHARACTER_BEHAVIOR.md)。
- VRMA clip 可標註用途 `loop`／`one-shot`／`pose`（settings schema ≥7）；品質分析依用途套規則。

## 4. Electron 與狀態邊界

- Renderer 維持 sandbox、context isolation、無 Node integration；avatar 與 settings 使用不同 preload allowlist。
- Privileged IPC 驗證 sender URL；設定寫入另要求 settings 視窗的 `webContents`。
- MCP／protocol／HTTP 動作進入有界佇列，包含同名合併、容量上限與最小間隔。
- Settings 與 MCP `get_status` 共用 readiness、listener 狀態與診斷語彙；診斷必須移除使用者名、絕對路徑與媒體檔名，不包含音訊或模型內容。

## 5. 文件與開發環境

- `AGENTS.md` 是 agent 單一真相源；`CLAUDE.md` 與 `SKILL.md` 只作入口，不複製完整規則。
- `README`、`ROADMAP`、`CONTRIBUTING`、`CODE_OF_CONDUCT`、`SECURITY` 以繁中為預設並提供英文版；內部維護文件只保留繁中。
- `ROADMAP` 管未來、`REVIEW` 管目前健康、`CHANGELOG` 管已完成；不另建平行計畫或歷史決策流水帳。
- 一般 Node／Electron／文件開發不要求 Visual Studio Build Tools。C++ helper 或本機 installer 才需 C++ toolchain；GitHub Windows runner 是正式 native 與 package gate。

## 6. 依賴與合併自動化

- Dependabot 高權限 workflow 必須 fail closed：只信任 `dependabot[bot]`、`main` base 與 base commit 上的 policy，並綁定 head SHA。
- 只有 CI 直接覆蓋的開發工具與 GitHub Actions minor／patch 可 guarded auto-merge；runtime、打包、渲染、major 與未知更新保留人工審查。

## 7. 版本與 Release

- 完成可交付工作後直接 commit／push `main`，並以 SemVer 更新 package、lockfile 與 CHANGELOG。
- `main` 可累積多個版號再批次 Release；不為空轉或無實質變更建立 tag。
- Release tag 必須精確指向可信 `main` tip。已發布 tag 不 force-update；目前不要求以 repository ruleset 保護 tag。
- 新 Release 成功且成為 Latest 後才清理舊 Release／tag；失敗時保留舊版。
- Windows GUI、簽署與真機 capture 在缺少桌面或密鑰時不阻塞可自動驗證的開發，但未驗項目不得宣稱完成。

## 8. 相容與品質證據

- 合成 fixture 用於穩定重現 parser、品質 gate 與 rollback；真實 exporter 結論必須有版本與合法樣本證據。
- 自動 workflow 綠燈不能取代透明視窗、DPI、系統匣、音效裝置、SmartScreen 與安裝生命週期的 Windows 實機驗收。
- 只有具體測試、build、GitHub 狀態或人工紀錄才能標記完成；相關模板與判定見 [`WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md)。
