# Release evidence

本目錄保存 VoxAvatar 正式版本的人工 Windows smoke 證據。它不是截圖倉庫，也不保存安裝包、角色、動作、音訊或私人路徑。

## 目錄格式

```text
docs/release-evidence/
└── v0.2.0/
    └── windows-smoke.md
```

每個紀錄依 [`../WINDOWS_VALIDATION.md`](../WINDOWS_VALIDATION.md) 填寫，至少包含環境、tag／SHA、installer checksum／簽章狀態、測試項目、結果及相關 issue。沒有實際執行的項目標為「未驗」，不可預先勾選。

## 隱私與素材

- 不記錄使用者名稱、絕對路徑、憑證、音訊或對話。
- 不提交測試用 VRM／VRMA；只記可公開來源、授權與格式。
- 截圖只在能證明桌面行為且已遮蔽私人內容時提交。
- GitHub workflow、Release URL 與 checksum 可直接連結，installer 本身不要重複放進 Git。
