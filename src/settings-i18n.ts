export type UiLocale = 'zh-TW' | 'en';

/** 非 en 一律視為 zh-TW。 */
export function normalizeUiLocale(value: unknown): UiLocale {
  return value === 'en' ? 'en' : 'zh-TW';
}

type MessageDictionary = Record<string, string>;

const ZH_TW: MessageDictionary = {
  'app.documentTitle': 'VoxAvatar 設定',
  'app.brandSubtitle': '設定',
  'app.sidebarStatus': '變更會自動儲存',
  'app.about': '關於…',
  'app.aboutVersion': '版本 {version}',
  'app.versionUnknown': '版本 —',
  'app.dismissNotice': '關閉通知',

  'sections.models.label': '模型',
  'sections.models.description': '角色資料庫',
  'sections.animations.label': '動作',
  'sections.animations.description': '動作資料庫',
  'sections.appearance.label': '外觀',
  'sections.appearance.description': '預設構圖',
  'sections.voice.label': '語音',
  'sections.voice.description': '音訊來源',
  'sections.mcp.label': 'MCP',
  'sections.mcp.description': '代理連線',

  'nav.ariaLabel': '設定區段',
  'eyebrow.characterConfig': '角色設定',
  'eyebrow.voiceListener': '語音輸出監聽',
  'eyebrow.localIntegration': '本機整合',

  'summary.customLibrary': '{models} 個自訂模型 · {actions} 個自訂動作',
  'summary.voiceCustom': '自訂程序比對',
  'summary.voiceDefault': 'ChatGPT / Codex',
  'summary.voiceOutput': '輸出裝置全音',
  'summary.voiceExternal': '外部事件',
  'summary.mcpTools': '{tools} 個工具 · {actions} 個可播放動作',
  'summary.mcpConnection': '本機代理連線',

  'common.listDescSep': '：',
  'common.delete': '刪除',
  'common.reset': '重設',
  'common.cancel': '取消',
  'common.copy': '複製',
  'common.preview': '預覽',
  'common.edit': '編輯',
  'common.saveChanges': '儲存變更',
  'common.working': '處理中…',
  'common.confirmChange': '確認變更',
  'common.default': '預設',
  'common.packaged': '內建',
  'common.uploaded': '已上傳',
  'common.unavailable': '不可用',
  'common.selected': '已選取',
  'common.available': '可用',
  'common.refresh': '重新整理',
  'common.refreshing': '重新整理中…',
  'common.checkStatus': '檢查狀態',
  'common.checking': '檢查中…',
  'common.online': '線上',
  'common.starting': '啟動中',
  'common.ready': '就緒',
  'common.notRunning': '未執行',

  'notice.copied': '已複製 {label}。',
  'notice.copyFailed': '無法複製 {label}。',
  'notice.diagnosticCopied': '已複製診斷摘要（路徑與素材檔名已遮罩）。',
  'setup.checklistTitle': '設定進度',
  'setup.checklistDesc':
    '尚有必要項目未完成。完成後即可穩定使用口型與 MCP；動作片段為可選。完成後此區塊會自動隱藏。',
  'setup.complete': '必要設定已完成',
  'setup.incomplete': '尚有未完成項目',
  'setup.step.model': '匯入並選取角色模型',
  'setup.step.animations': '加入可播放動作（可選）',
  'setup.step.voice': '設定語音來源／listener',
  'setup.step.mcp': '本機 MCP 就緒',
  'setup.action.import_model': '前往模型',
  'setup.action.add_animation_clips': '前往動作',
  'setup.action.configure_voice_source': '前往語音',
  'setup.action.check_voice_source': '檢查語音',
  'setup.action.start_voice_app': '啟動語音應用程式',
  'setup.action.install_or_build_helper': '需要原生 listener',
  'setup.action.wait_or_restart_mcp': '檢查 MCP',
  'setup.copyDiagnostic': '複製診斷摘要',
  'helper.state.inactive': '未啟用',
  'helper.state.external': '外部事件模式',
  'helper.state.missing': 'helper 不存在',
  'helper.state.launch_failed': 'helper 啟動失敗',
  'helper.state.target_missing': '找不到目標行程',
  'helper.state.no_output': '已附掛、尚無輸出',
  'helper.state.listening': '正在接收音量',
  'helper.error.native_helper_missing':
    '找不到原生 listener。請使用正式 Windows 安裝包，或本機執行 npm run native:build。',
  'helper.error.native_helper_spawn_failed':
    '無法啟動原生 listener（權限或路徑問題）。',
  'helper.error.native_helper_com_error':
    'COM 初始化失敗。請確認以一般桌面工作階段執行，並重試。',
  'helper.error.native_helper_wasapi_error':
    'WASAPI／音訊端點失敗。請檢查預設播放裝置後重試。',
  'helper.error.native_helper_event_error':
    '音訊事件回呼建立失敗。請重試或改用其他語音來源。',
  'helper.error.native_helper_device_error':
    '找不到可用的播放裝置。請連接或啟用輸出裝置。',
  'helper.error.native_helper_usage': '原生 listener 參數無效（Usage）。',
  'helper.error.native_helper_permission': '啟動 helper 時權限被拒。',
  'helper.error.native_helper_exit_nonzero': '原生 listener 異常結束。',
  'helper.error.native_helper_unknown': '原生 listener 發生未知錯誤。',
  'helper.missingHint':
    '開發模式若尚未編譯 helper，語音 loopback 會不可用；正式安裝包應內含 voxavatar-audio-listener.exe。',
  'helper.hint.native_helper_missing':
    '開發模式若尚未編譯 helper，語音 loopback 會不可用；正式安裝包應內含 voxavatar-audio-listener.exe。',
  'helper.hint.native_helper_spawn_failed':
    '請確認安裝包完整，或以系統管理員以外的一般桌面工作階段重試。',
  'helper.hint.native_helper_com_error':
    '請關閉後以一般桌面工作階段重新開啟 VoxAvatar，勿在不支援 COM 的服務工作階段執行。',
  'helper.hint.native_helper_wasapi_error':
    '請檢查預設播放裝置是否啟用，並關閉佔用獨佔模式的其他音訊工具後重試。',
  'helper.hint.native_helper_event_error':
    '請重試語音來源；若持續失敗，改用外部事件模式並回報診斷摘要。',
  'helper.hint.native_helper_device_error':
    '請連接或啟用輸出裝置，再於設定重新整理語音來源。',
  'helper.hint.native_helper_usage':
    '請回報此問題；Usage 代表 helper 參數異常，通常為安裝損壞。',
  'helper.hint.native_helper_permission':
    '請檢查防毒／受控資料夾存取是否阻擋 voxavatar-audio-listener.exe。',
  'helper.hint.native_helper_exit_nonzero':
    '請重試語音來源；若持續失敗，改用外部事件模式或重裝安裝包。',
  'helper.hint.native_helper_unknown':
    '請重試；仍失敗時複製診斷摘要（已遮罩路徑）回報。',
  'helper.hint.launch_failed':
    '原生 listener 啟動失敗：檢查語音來源與播放裝置後重試。',
  'helper.hint.target_missing':
    '請啟動目標應用程式並開始播放，或改選其他語音來源。',
  'helper.hint.no_output':
    '已附掛目標，但尚無播放輸出；請在該應用播放語音後再觀察口型。',
  'helper.hint.inactive':
    '語音 listener 未啟用：確認語音模式與來源，或切換到外部事件模式。',
  'setup.code.model_missing': '尚未匯入或選取模型',
  'setup.code.model_configured': '模型已就緒',
  'setup.code.animations_optional_empty': '尚無可播放動作（可選）',
  'setup.code.animations_ready': '已有可播放動作',
  'setup.code.helper_missing': '缺少原生 listener',
  'setup.code.helper_launch_failed': '原生 listener 啟動失敗',
  'setup.code.listener_inactive': '語音 listener 尚未就緒',
  'setup.code.voice_external': '外部事件語音模式',
  'setup.code.voice_target_missing': '目標應用程式未在執行',
  'setup.code.voice_listening': '正在接收目標音量',
  'setup.code.voice_no_output': '已附掛、尚無播放輸出',
  'setup.code.voice_ready': '語音來源已就緒',
  'setup.code.mcp_online': '本機 MCP 已上線',
  'setup.code.mcp_starting': '本機 MCP 啟動中',
  'setup.code.mcp_unavailable': '本機 MCP 不可用',
  'setup.helperNote':
    '需要原生 listener 時：下載正式安裝包，或在有 Visual Studio Build Tools 的環境執行 npm run native:build。',
  'diagnostic.label': '診斷摘要',
  'notice.modelAdded': '模型已加入資料庫。',
  'notice.modelsImported':
    '已從目錄匯入 {imported}／{scanned} 個 VRM（保留 {keep}／觀察 {review}／淘汰 {reject}）。',
  'notice.modelsImportedOff':
    '已從目錄匯入 {imported}／{scanned} 個 VRM。',
  'notice.importPartial':
    '略過 {skipped}、失敗 {failed}（既有資料庫未覆蓋）。',
  'notice.animationCreated':
    '動作已建立。請到下方該動作卡片按「+ 加入 VRMA 檔案」加入片段；之後可用「編輯」修改詳情。',
  'notice.actionPresetExists':
    '動作「{name}」已存在；已套用到表單，可直接編輯或改名。',
  'notice.clipsAdded': '已將 VRMA 片段加入 {name}。',
  'notice.clipsImported':
    '已將 {imported}／{scanned} 個 VRMA 加入 {name}（保留 {keep}／觀察 {review}／淘汰 {reject}）。',
  'notice.clipsImportedOff':
    '已將 {imported}／{scanned} 個 VRMA 加入 {name}。',
  'notice.reportSaved': '品質報告：{path}',
  'notice.reportSavedShort': '已寫入品質報告。',
  'notice.revealReport': '在檔案總管顯示',
  'notice.reportFailed': '品質報告寫入失敗：{error}',
  'notice.qualityGateUpdated': '目錄匯入品質把關已更新。',
  'notice.qualityScoreUpdated': '品質分數門檻已更新。',
  'notice.reportDirUpdated': '報告儲存位置已更新。',
  'notice.reportDirCleared': '報告改回存入掃描目錄。',
  'notice.defaultModelUpdated': '預設模型已更新。',
  'notice.modelDeleted': '模型已從資料庫移除。',
  'notice.modelsDeletedAll': '已刪除全部使用者 VRM（{count} 個）。',
  'notice.clipsDeletedAll': '已刪除全部使用者 VRMA 片段（{count} 個）。',
  'notice.animationUpdated': '動作詳情已更新。',
  'notice.animationDeleted': '動作已從使用中資料庫移除。',
  'notice.stateSlotUpdated': '狀態動作槽已更新。',
  'notice.actionPackImported':
    '已匯入 action-pack「{name}」（{created} 個新動作，{clips} 個片段）。',
  'notice.actionPackPartial':
    '其中 {failed} 個動作未完整匯入（失敗項未覆寫既有動作）。',
  'notice.actionPackCancelled': '已取消匯入 action-pack。',
  'notice.assignByFilenameDone':
    '依檔名分槽完成：已加入 {assigned} 個，略過 {skipped} 個無法對應的檔案。',
  'notice.assignByFilenameNone':
    '沒有可對應的檔案（需與既有動作名相符，或符合 idle／speaking 等白名單且目標動作已存在）。',
  'notice.assignByFilenameCancelled': '已取消依檔名分槽。',
  'notice.clipDeleted': '已移除 {name}。',
  'notice.clipReordered': '已調整 {name} 的順序。',
  'notice.clipUpdated': '已更新片段「{name}」。',
  'notice.clipMoved': '已將「{name}」移至動作「{action}」。',
  'notice.clipMovedToPool': '已將「{name}」移至未分類片段池。',
  'notice.poolClipsAdded': '已將 {count} 個 VRMA 加入未分類片段池。',
  'notice.poolClipAssigned': '已將「{name}」指定到動作「{action}」。',
  'notice.clipsPurposeUpdated': '已更新 {count} 個片段的用途為 {purpose}。',
  'notice.packagedRestored': '內建動作已還原。',
  'notice.characterSizeSet': '預設角色大小已設為 {percent}%。',
  'notice.idleRestSet': '待機動作間隔已設為 {seconds} 秒。',
  'notice.mcpShowMessageEnabled': '已允許 AI 顯示訊息氣泡。',
  'notice.mcpShowMessageDisabled': '已關閉 AI 訊息氣泡。',
  'notice.uiLocaleZh': '介面語系已設為繁體中文。',
  'notice.uiLocaleEn': '介面語系已設為 English。',
  'notice.lightingUpdated': '光照已更新。',
  'notice.lightingReset': '光照已重設為 VoxAvatar 預設值。',
  'notice.voiceDefault': '已啟用 ChatGPT 與 Codex 自動偵測。',
  'notice.voiceExternal': '已啟用外部語音整合。',
  'notice.voiceOutput':
    '已啟用輸出裝置全音監聽（請確認你接受隱私邊界警告）。',
  'notice.voiceApplication': '語音輸出來源已設為 {name}。',
  'notice.voicePatternSaved': '進階程序比對已儲存。',

  'confirm.deleteModel.title': '刪除「{name}」？',
  'confirm.deleteModel.detail': '模型與本機儲存的 VRM 檔案將一併移除。',
  'confirm.deleteAllModels.title': '刪除全部使用者 VRM？',
  'confirm.deleteAllModels.detail':
    '將移除 {count} 個本機匯入的模型與 VRM 檔案。內建模型（若有）不受影響。此操作無法復原。',
  'confirm.deleteAnimation.title': '刪除「{name}」？',
  'confirm.deleteAnimation.detailPackaged':
    '此動作將從使用中資料庫移除。重設內建動作可還原。',
  'confirm.deleteAnimation.detailCustom':
    '此動作與所有本機 VRMA 片段將一併移除。',
  'confirm.deleteClip.title': '刪除「{name}」？',
  'confirm.deleteClip.detail': '本機儲存的 VRMA 片段將被移除。',
  'confirm.deleteAllClips.title': '刪除全部使用者 VRMA？',
  'confirm.deleteAllClips.detail':
    '將移除 {count} 個本機上傳的 VRMA 片段檔案。動作槽本身會保留。此操作無法復原。',
  'confirm.resetPackaged.title': '重設內建動作？',
  'confirm.resetPackaged.detail':
    '內建動作的名稱、描述、觸發條件與可見性將還原。使用者建立的動作與上傳的片段不受影響。',

  'models.libraryTitle': '模型資料庫',
  'models.libraryDesc': '選取模型以在預覽中檢視。',
  'models.deleteAll': '一鍵刪除全部 VRM',
  'models.empty.title': '尚未設定角色（首次啟動）',
  'models.empty.intro':
    '安裝包不內建角色模型。請先合法下載一個 .vrm，再用下方表單匯入；設為預設後才會出現桌面角色並開始語音監聽。',
  'models.empty.sourcesHeading': '合法下載現成角色的地方：',
  'models.empty.linkVroidHubDesc':
    '大量可下載 VRM；開啟模型頁後確認利用條件再下載。',
  'models.empty.linkBoothDesc':
    '搜尋 VRM；讀商品利用規約（多數僅允許本機使用）。',
  'models.empty.linkTsukuyomiDesc':
    '官方免費素材角色（請遵守該站 credit／條款）。',
  'models.empty.linkAngelDesc': 'VRoid Hub；年輕女生、較正式造型。',
  'models.empty.linkPonytailDesc': 'VRoid Hub；馬尾少女、FREE／DL 可。',
  'models.empty.linkKiDesc': 'VRoid Hub；條款偏寬的免費模。',
  'models.empty.linkSampleCDesc': 'VRoid 官方樣本男角。',
  'models.empty.linkTohokuDesc': '官方有釋出的人型 VRM 等。',
  'models.empty.linkStudioDesc': '自製原創角色後匯出 .vrm（最乾淨）。',
  'models.empty.afterDownloadPrefix':
    '下載完成後，用下方「新增自訂模型」選擇檔案；第一次匯入會自動成為預設。身體動作請另匯入',
  'models.empty.vrmaPackLink': '官方 VRMA 7 種組',
  'models.empty.afterDownloadSuffix':
    '（本機使用；勿再配布原檔）到 動作 → Idle。',
  'models.packagedModel': '內建模型',
  'models.userModel': '使用者模型',
  'models.defaultBadge': '預設',
  'models.makeDefault': '設為預設',
  'models.addTitle': '新增自訂模型',
  'models.addDesc':
    '選擇 VRM 後會複製到本機資料庫；名稱空白時自動用檔名。',
  'models.nameLabel': '模型名稱（選填）',
  'models.namePlaceholder': '空白則用 VRM 檔名',
  'models.chooseVrm': '選擇 VRM 檔案',
  'models.chooseVrmHint': '選擇 VRM 檔案',
  'models.chooseVrmFolder': '從目錄評估匯入',
  'models.chooseVrmFolderHint':
    '選擇資料夾後掃描所有子目錄的 .vrm，依品質把關分析並可寫入 Markdown 報告（檔名 voxavatar-vrm-report.md）。嚴格模式會略過淘汰檔；檔名重複時自動更名。',
  'models.desktopOnly': '檔案匯入僅在 VoxAvatar 桌面程式可用。',

  'actions.idleGuideTitle': '更豐富的待機動作',
  'actions.idleGuideDesc':
    '安裝包不安裝任何 Idle 動作。請從官方或 BOOTH 下載 .vrma 並加入 Idle（亦可選 Greeting / Happy）。待機時若有素材，VoxAvatar 會隨機播放非說話片段。',
  'actions.idleGuideStep1Prefix':
    '從 BOOTH 取得 VRoid 免費 Photo Booth 組',
  'actions.idleGuideStep1Suffix':
    '（請閱讀該頁條款——通常僅限本機使用；將可提取檔案打包進其他安裝程式通常不允許）。',
  'actions.idleGuideStep2': '設定 → 動作 → Idle → 加入 .vrma 片段。',
  'actions.idleGuideStep3': '查看完整角色表現指南。',
  'actions.listTitle': '動作列表',
  'actions.listDesc':
    '緊接在上方建立區之後。系統待機／說話可用「+ 加入 VRMA」；自訂動作另有「編輯」。點選片段或按「預覽」可播放；可重新命名、改用途或移至其他動作。',
  'actions.assignByFilename': '依檔名建議分槽…',
  'actions.assignByFilenameHint':
    '選多個 VRMA 後，依檔名與白名單建議加入既有動作（須確認；不明確則略過）。正式分槽仍建議用 action-pack。',
  'actions.clipsManageHint':
    '點片段或「預覽」可在右側預覽播放；「編輯」可改顯示名稱、用途（loop／one-shot／pose）、移至其他動作或未分類池。磁碟檔名會與顯示名稱同步（可讀名稱＋短 ID）。',
  'actions.previewButton': '預覽',
  'actions.editClip': '編輯 {name}',
  'actions.clipNameLabel': '片段顯示名稱',
  'actions.clipPurposeLabel': '用途',
  'actions.purpose.loop': 'loop 循環',
  'actions.purpose.one-shot': 'one-shot 單次',
  'actions.purpose.pose': 'pose 姿勢',
  'actions.moveClipTo': '指定到動作',
  'actions.saveClip': '儲存片段',
  'actions.clipEditHint':
    '顯示名稱請用小寫英文、數字與連字號（例如 wave-soft）；儲存時會同步磁碟檔名（可讀名稱＋短 ID）。用途會影響品質分析與播放語意。',
  'actions.poolTitle': '未分類片段池',
  'actions.poolDesc':
    '先匯入 VRMA 到池中，再拖曳到下方動作卡片指定；或勾選多個片段後批次設定用途。',
  'actions.poolEmpty': '尚未加入片段。按「+ 加入 VRMA 檔案」匯入到池中。',
  'actions.addPoolClips': '+ 加入 VRMA 檔案',
  'actions.poolDropHint': '拖曳片段到此動作',
  'actions.moveClipToPool': '移至未分類池',
  'actions.batchSelected': '已選 {count} 個片段',
  'actions.batchPurposeLoop': '設為 loop',
  'actions.batchPurposeOneShot': '設為 one-shot',
  'actions.batchPurposePose': '設為 pose',
  'actions.storedFilename': '磁碟檔名',
  'actions.selectClip': '選取 {name}',
  'actions.resetPackaged': '重設內建動作',
  'actions.deleteAllClips': '一鍵刪除全部 VRMA',
  'actions.systemAction': '系統動作',
  'actions.idle': '待機',
  'actions.speaking': '說話',
  'actions.packagedModified': '內建 · 已修改',
  'actions.customAction': '自訂動作',
  'actions.trigger': '觸發：',
  'actions.clipsTitle': 'VRMA 片段',
  'actions.noClips': '尚未加入片段',
  'actions.clipCount.one': '{count} 個片段',
  'actions.clipCount.other': '{count} 個片段',
  'actions.addClips': '+ 加入 VRMA 檔案',
  'actions.addClipsFolder': '+ 從目錄批次加入',
  'actions.qualityGateTitle': '目錄匯入品質把關',
  'actions.qualityGateDesc':
    '從目錄批次匯入 VRM／VRMA 時套用（共用同一設定）。目前門檻：分數低於 {reject} 淘汰、{reviewLow}–{reviewHigh} 觀察、{keep} 以上保留。VRMA 檢查時長、關鍵幀、突波與循環接縫；VRM 檢查擴充、humanoid、mesh、體積與粗估三角面。可寫入 Markdown 報告。啟發式僅供參考，請以即時預覽為準。',
  'actions.qualityGateMode': '把關模式',
  'actions.qualityGate.report': '分析並寫報告（全部匯入）',
  'actions.qualityGate.strict': '嚴格：略過評為「淘汰」的檔案',
  'actions.qualityGate.off': '關閉分析（最快）',
  'actions.qualityRejectBelow': '淘汰分數門檻（低於此分）',
  'actions.qualityKeepAtLeast': '保留分數門檻（達標且無高嚴重度）',
  'actions.qualityScoreHint':
    '預覽：< {reject} 淘汰；{reviewLow}–{reviewHigh} 觀察；≥ {keep} 保留。保留門檻不可低於淘汰門檻。',
  'actions.reportDirTitle': '報告儲存位置',
  'actions.reportDirDesc':
    '預設寫入你選的掃描目錄（VRM：voxavatar-vrm-report.md；VRMA：voxavatar-vrma-report.md）。也可指定固定資料夾。',
  'actions.reportDirScan': '掃描目錄（預設）',
  'actions.reportDirChoose': '選擇…',
  'actions.reportDirClear': '重設',
  'actions.emptyClipsSystemIdle':
    '請上傳一或多個待機片段。在此之前 VoxAvatar 使用模型預設姿勢。',
  'actions.emptyClipsSystemSpeaking':
    '請上傳一或多個說話片段。在此之前 VoxAvatar 使用模型預設姿勢。',
  'actions.emptyClipsCustom':
    '尚未加入 VRMA。請用下方按鈕加入一或多個片段，此動作才可供 MCP 使用。',
  'actions.nextAddClips':
    '下一步：為此動作加入 VRMA 片段（可一次選多個檔案，之後仍可再加）。',
  'actions.previewClip': '預覽 {name}',
  'actions.deleteClip': '刪除 {name}',
  'actions.moveClipUp': '上移 {name}',
  'actions.moveClipDown': '下移 {name}',
  'actions.editTitle': '編輯動作詳情',
  'actions.editDesc':
    '這些詳情供 VoxAvatar MCP 工具描述動作。更名後片段仍歸在同一動作下。可隨時再次編輯。',
  'actions.nameLabel': '動作名稱 animation_name',
  'actions.descriptionLabel': '描述 animation_description',
  'actions.triggerLabel': '觸發情境 animation_trigger_scenario',
  'actions.createTitle': '建立自訂動作',
  'actions.createDesc':
    '先填名稱與 MCP 描述並建立；下方「動作列表」會立刻出現該卡片，可按「編輯」改詳情，並用「+ 加入 VRMA 檔案」增刪片段。',
  'actions.presetsTitle': '常用動作選單',
  'actions.presetsDesc':
    '點選可套用到下方表單；「套用並建立」會立刻建立，並捲動到下方對應卡片以加入 VRMA。',
  'actions.presetsApply': '套用到表單',
  'actions.presetsApplyCreate': '套用並建立',
  'actions.presetsExists': '已建立',
  'actions.createNamePlaceholder': '例如：wave-hello',
  'actions.createNameHint':
    '小寫字母、數字與連字號。加入此動作的片段會自動命名，如 wave-hello1、wave-hello2。',
  'actions.createDescPlaceholder': '描述動作的外觀與感覺。',
  'actions.createTriggerPlaceholder': '說明代理應在何時選用此動作。',
  'actions.createButton': '建立動作',

  'stateSlots.title': '系統狀態動作槽',
  'stateSlots.desc':
    '為七個角色狀態綁定可播放動作。沒有獨立的 listening 系統動作：有可播放 Idle 時，idle／listening 槽會預選 idle；有 Speaking 時 speaking 槽預選 speaking。可改選或清成「未綁定」（退回 Idle／Speaking 類型預設）。也可匯入 action-pack.json。',
  'stateSlots.importPack': '匯入 action-pack…',
  'stateSlots.none': '（未綁定）',
  'stateSlots.noPlayable': '尚無可播放動作。請先為動作加入 VRMA 片段。',
  'stateSlots.packHelpSummary': '什麼是 action-pack.json？如何使用',
  'stateSlots.packHelpStep1':
    '在資料夾放好要匯入的 .vrma（檔名與 JSON 裡 files 一致，僅檔名、不可含子目錄）。',
  'stateSlots.packHelpStep2':
    '建立 action-pack.json：列出 animation_name、可選 purpose／state_slot，以及 files 檔名。',
  'stateSlots.packHelpStep3':
    '按「匯入 action-pack…」選該 JSON；程式會建立／更新動作並合併狀態槽（仍走 GLB／路徑／catalog gate）。',
  'stateSlots.packHelpStep4':
    '完整契約與較長範例見 repo 的 docs/CHARACTER_BEHAVIOR.md 與 docs/examples/action-pack.example.json。',
  'stateSlots.packHelpNote':
    'action-pack 不是安裝包、不內嵌媒體，也不能繞過授權或路徑檢查。',
  'stateSlots.packExampleTitle': '最小範例',
  'stateSlots.packExampleCopy': '複製範例',
  'stateSlots.packExampleCopied': '已複製',
  'stateSlots.state.idle': 'idle 待機',
  'stateSlots.state.listening': 'listening 聆聽（預設用 idle）',
  'stateSlots.state.speaking': 'speaking 說話',
  'stateSlots.state.working': 'working 工作中',
  'stateSlots.state.reviewing': 'reviewing 檢視中',
  'stateSlots.state.success': 'success 成功',
  'stateSlots.state.failed': 'failed 失敗',

  'appearance.localeTitle': '介面語言',
  'appearance.localeDesc': '介面語言會套用到設定頁與選單。',
  'appearance.localeAria': '介面語言',
  'appearance.localeZh': '繁體中文',
  'appearance.localeEn': 'English',
  'appearance.themeTitle': '主題',
  'appearance.themeDesc':
    '設定此設定視窗的外觀。角色疊層在所有主題下皆保持透明。',
  'appearance.themeAria': '主題',
  'appearance.theme.system': '跟隨系統',
  'appearance.theme.light': '淺色',
  'appearance.theme.dark': '深色',
  'appearance.themeNote': '跟隨系統會依桌面外觀更新。',
  'appearance.sizeTitle': '預設角色大小',
  'appearance.sizeDesc':
    '即時角色的初始構圖大小。在桌面疊層上：滾輪（中鍵滾動）縮放；左鍵拖曳移動視窗；中鍵拖曳旋轉；右鍵快捷選單。透明像素可點穿桌面。',
  'appearance.sizeAria': '預設角色大小',
  'appearance.sizeMin': '30%',
  'appearance.sizeDefault': '預設',
  'appearance.sizeMax': '160%',
  'appearance.idleRestTitle': '待機動作間隔',
  'appearance.idleRestDesc':
    '一段待機 VRMA 播完後，休息多久再播下一支。拉長可減少「過動」感。',
  'appearance.idleRestAria': '待機動作間隔秒數',
  'appearance.idleRestValue': '{seconds} 秒',
  'appearance.idleRestMin': '2 秒',
  'appearance.idleRestMax': '60 秒',
  'appearance.lightingTitle': '光照',
  'appearance.lightingDesc':
    '調整環境光與主光，改善 VRM 過曝或過暗。',
  'appearance.lightingReset': '重設光照',
  'appearance.toneMapping': '色調映射',
  'appearance.toneNone': '無',
  'appearance.toneAces': 'ACES Filmic',
  'appearance.hdrEnvironment': 'HDR 環境',
  'appearance.envIntensity': '環境光強度',
  'appearance.keyIntensity': '主光強度',
  'appearance.ambientIntensity': '環境／補光強度',
  'appearance.exposure': '曝光',

  'voice.chooseTitle': '選擇語音來源',
  'voice.chooseDesc':
    'VoxAvatar 預設只監聽單一語音應用程式的播放，並將音量轉為動畫與口型。',
  'voice.modeAria': '語音來源模式',
  'voice.mode.default.title': '自動',
  'voice.mode.default.desc': '偵測 ChatGPT 或 Codex 輸出。',
  'voice.mode.application.title': '應用程式',
  'voice.mode.application.desc': '選擇執行中的 Windows 應用程式。',
  'voice.mode.output.title': '輸出裝置',
  'voice.mode.output.desc': '監聽目前預設播放裝置上的所有聲音。',
  'voice.mode.custom.title': '進階',
  'voice.mode.custom.desc': '以正則比對程序。',
  'voice.mode.external.title': '外部',
  'voice.mode.external.desc': '由管線直接傳送音量。',
  'voice.outputPrivacyTitle': '隱私邊界警告',
  'voice.outputPrivacyWarn':
    '此模式會監聽「目前預設輸出裝置」混出的所有聲音（含音樂、影片、遊戲、系統提示、其他應用），不只語音助理。音量僅在本機轉成口型／動作觸發，不上傳；但仍可能對旁人語音或媒體有反應。請僅在你接受此邊界時啟用。',
  'voice.applicationTitle': '應用程式輸出',
  'voice.applicationDesc': '先啟動目標語音應用程式，再選取其執行中的程序。',
  'voice.filterLabel': '篩選應用程式',
  'voice.filterPlaceholder': '依應用程式或執行檔搜尋',
  'voice.savedApplication': '已儲存的應用程式',
  'voice.notRunning': '目前未執行',
  'voice.noMatchesTitle': '沒有符合的語音來源',
  'voice.noMatchesDesc': '請啟動目標應用程式並重新整理列表。',
  'voice.patternTitle': '進階程序比對',
  'voice.patternDesc':
    '比對在應用程式選擇器中不可用或不明確的輸出程序。',
  'voice.patternLabel': '程序比對',
  'voice.patternAria': '自訂語音程序比對',
  'voice.patternPlaceholder': 'my-voice-app|local-tts',
  'voice.patternNote':
    '在 Windows 上比對不分大小寫。設定 VOXAVATAR_TARGET_PROCESS_PATTERN 時會覆蓋自動與進階比對。',
  'voice.savePattern': '儲存比對',
  'voice.externalTitle': '外部語音管線',
  'voice.externalDesc':
    '由播放合成語音的元件直接傳送正規化狀態與輸出音量。',
  'voice.eventsEndpoint': '事件端點',
  'voice.externalNote':
    '外部模式停用自動擷取。VoxAvatar 僅接收說話狀態與正規化音量；原始音訊與轉錄留在您的管線中。',
  'voice.statusTitle': '監聽狀態',
  'voice.statusDesc': '本機語音整合的目前狀態。',
  'voice.statusMode': '模式',
  'voice.statusState': '狀態',
  'voice.statusAvailable': '可用',
  'voice.statusRunningApps': '執行中的應用程式',
  'voice.heading.application': '已選應用程式',
  'voice.heading.custom': '進階程序比對',
  'voice.heading.external': '外部事件',
  'voice.heading.output': '輸出裝置全音',
  'voice.heading.automatic': '自動偵測',
  'voice.heading.default': '自動偵測',
  'voice.detail.loopback': 'Loopback 事件 API',
  'voice.detail.chatgptCodex': 'ChatGPT 與 Codex',
  'voice.state.waitingEvents': '等待事件',
  'voice.state.receiving': '接收音訊中',
  'voice.state.monitoring': '監聽中',
  'voice.state.inactive': '未啟用',
  'voice.state.noStream': '無作用中輸出串流',

  'mcp.serverTitle': '本機 MCP 伺服器',
  'mcp.serverDesc':
    '將相容代理連至 VoxAvatar 的角色控制與已設定動作。',
  'mcp.health': '健康狀態',
  'mcp.transport': '傳輸',
  'mcp.transportDesc': 'Model Context Protocol',
  'mcp.transportDefault': 'Streamable HTTP',
  'mcp.access': '存取',
  'mcp.accessLocal': '僅本機',
  'mcp.accessNetwork': '網路',
  'mcp.accessBound': '綁定 127.0.0.1',
  'mcp.version': 'VoxAvatar',
  'mcp.versionDesc': '伺服器版本',
  'mcp.checkedAt': '已於 {time} 檢查',
  'mcp.waitingBridge': '等待桌面橋接',
  'mcp.endpointTitle': '伺服器端點',
  'mcp.endpointDesc': '桌面程式開啟時提供此端點。',
  'mcp.checkHealth': '檢查健康狀態',
  'mcp.serverUrl': '伺服器 URL',
  'mcp.setupCommand': 'Codex 設定指令',
  'mcp.setupCommandLabel': '設定指令',
  'mcp.portNote':
    '若要使用不同連接埠，請在啟動 VoxAvatar 前設定 VOXAVATAR_BRIDGE_PORT，並註冊顯示的 URL。',
  'mcp.usageTitle': '連線後怎麼用',
  'mcp.usageDesc':
    '註冊後開啟新的代理工作階段；代理會自動讀取 VoxAvatar 提供的工具與動作說明。可直接用自然語言要求：',
  'mcp.usageStatus': '「檢查 VoxAvatar 是否已準備好。」',
  'mcp.usageList': '「列出目前可播放動作，以及適合使用的情境。」',
  'mcp.usagePlay': '「播放 wave-hello。」（請改成實際列出的動作名稱）',
  'mcp.usageWindow': '「顯示、隱藏或切換 VoxAvatar 視窗。」',
  'mcp.usageMessage':
    '啟用後可請 AI：「在角色旁顯示：完成！」；預設關閉，且本機 MCP 無身分驗證。',
  'mcp.usageState':
    '「把角色設成 working／success／failed。」（set_character_state；不臆測情緒）',
  'mcp.usageGuide': '查看完整 MCP 使用方式、schema 與錯誤處理。',
  'mcp.agentMessagesTitle': 'AI 訊息氣泡',
  'mcp.agentMessagesDesc':
    '允許已連線的本機 AI 透過 MCP show_message 在角色旁顯示短句。',
  'mcp.agentMessagesToggle': '允許已連接 AI 顯示訊息',
  'mcp.agentMessagesWarning':
    '本機 MCP 沒有登入驗證；同帳號的任何行程都可能連線。啟用前請確認你信任本機上的 AI 客戶端。訊息只在記憶體顯示，不保存歷史。',
  'mcp.toolsTitle': '可用工具',
  'mcp.toolsDesc': '工具不提供檔案系統、轉錄或原始音訊存取。',
  'mcp.toolsCount': '{count} 個工具',
  'mcp.tools.play_animation': '播放任一已設定且至少有一個動畫片段的動作。',
  'mcp.tools.list_animations': '讀取最新可播放動作及其使用說明。',
  'mcp.tools.control_window': '顯示、隱藏或切換 VoxAvatar 角色視窗。',
  'mcp.tools.get_status': '讀取視窗、模型、語音、監聽器與訊息氣泡開關狀態。',
  'mcp.tools.show_message': '在角色旁顯示短句、Emoji 或顏文字（需先啟用）。',
  'mcp.tools.set_character_state':
    '設定呈現狀態（working／success／failed 等）；不臆測聊天內容。',
  'mcp.tools.fallback': 'VoxAvatar MCP 工具',
  'mcp.schemaVersions': '契約版本 tools={tools}／status={status}',
  'mcp.actionsTitle': '可播放動作',
  'mcp.actionsDesc': '動作在至少有一個 VRMA 片段後會出現在 MCP 動畫工具中。',
  'mcp.actionsActive': '{count} 個使用中',
  'mcp.noActionsTitle': '未偵測到可播放動作',
  'mcp.noActionsDesc': '請為動作加入 VRMA 片段，再重新檢查伺服器。',
  'mcp.sessionNote':
    '註冊 VoxAvatar 後請開新 Codex 工作階段。已安裝動作的變更會自動推播至已連線工作階段。',

  'preview.live': '即時預覽',
  'preview.liveBadge': '即時',
  'preview.character': '角色預覽',
  'preview.expand': '展開預覽',
  'preview.collapse': '收合預覽',
  'preview.expandAria': '展開預覽面板',
  'preview.collapseAria': '收合預覽面板',
  'preview.hint': '拖曳旋轉 · 滾輪縮放',
  'preview.nowPlaying': '目前預覽',
  'preview.loadError': '這個模型無法載入',
  'preview.loadErrorHint': '請選擇或刪除這個模型；設定頁其餘功能仍可使用。',
};

const EN: MessageDictionary = {
  'app.documentTitle': 'VoxAvatar Settings',
  'app.brandSubtitle': 'Settings',
  'app.sidebarStatus': 'Changes save automatically',
  'app.about': 'About…',
  'app.aboutVersion': 'Version {version}',
  'app.versionUnknown': 'Version —',
  'app.dismissNotice': 'Dismiss notification',

  'sections.models.label': 'Models',
  'sections.models.description': 'Character library',
  'sections.animations.label': 'Actions',
  'sections.animations.description': 'Motion library',
  'sections.appearance.label': 'Appearance',
  'sections.appearance.description': 'Default framing',
  'sections.voice.label': 'Voice',
  'sections.voice.description': 'Audio source',
  'sections.mcp.label': 'MCP',
  'sections.mcp.description': 'Agent connection',

  'nav.ariaLabel': 'Settings sections',
  'eyebrow.characterConfig': 'Character configuration',
  'eyebrow.voiceListener': 'Voice output listener',
  'eyebrow.localIntegration': 'Local integration',

  'summary.customLibrary': '{models} custom models · {actions} custom actions',
  'summary.voiceCustom': 'Custom process pattern',
  'summary.voiceDefault': 'ChatGPT / Codex',
  'summary.voiceOutput': 'Output device mix',
  'summary.voiceExternal': 'External events',
  'summary.mcpTools': '{tools} tools · {actions} playable actions',
  'summary.mcpConnection': 'Local agent connection',

  'common.listDescSep': ': ',
  'common.delete': 'Delete',
  'common.reset': 'Reset',
  'common.cancel': 'Cancel',
  'common.copy': 'Copy',
  'common.preview': 'Preview',
  'common.edit': 'Edit',
  'common.saveChanges': 'Save changes',
  'common.working': 'Working…',
  'common.confirmChange': 'Confirm change',
  'common.default': 'Default',
  'common.packaged': 'Packaged',
  'common.uploaded': 'Uploaded',
  'common.unavailable': 'Unavailable',
  'common.selected': 'Selected',
  'common.available': 'Available',
  'common.refresh': 'Refresh',
  'common.refreshing': 'Refreshing…',
  'common.checkStatus': 'Check status',
  'common.checking': 'Checking…',
  'common.online': 'Online',
  'common.starting': 'Starting',
  'common.ready': 'Ready',
  'common.notRunning': 'Not running',

  'notice.copied': '{label} copied.',
  'notice.copyFailed': 'Unable to copy {label}.',
  'notice.diagnosticCopied':
    'Diagnostic summary copied (paths and asset names redacted).',
  'setup.checklistTitle': 'Setup progress',
  'setup.checklistDesc':
    'Required items are still open. Finish them for stable lip-sync and MCP; animation clips are optional. This panel hides when required setup is complete.',
  'setup.complete': 'Required setup is complete',
  'setup.incomplete': 'Setup still has open items',
  'setup.step.model': 'Import and select a character model',
  'setup.step.animations': 'Add playable actions (optional)',
  'setup.step.voice': 'Configure voice source / listener',
  'setup.step.mcp': 'Local MCP is ready',
  'setup.action.import_model': 'Go to Models',
  'setup.action.add_animation_clips': 'Go to Actions',
  'setup.action.configure_voice_source': 'Go to Voice',
  'setup.action.check_voice_source': 'Check voice',
  'setup.action.start_voice_app': 'Start the voice app',
  'setup.action.install_or_build_helper': 'Native listener required',
  'setup.action.wait_or_restart_mcp': 'Check MCP',
  'setup.copyDiagnostic': 'Copy diagnostic summary',
  'helper.state.inactive': 'Inactive',
  'helper.state.external': 'External events mode',
  'helper.state.missing': 'Helper missing',
  'helper.state.launch_failed': 'Helper failed to start',
  'helper.state.target_missing': 'Target process not found',
  'helper.state.no_output': 'Attached, no output yet',
  'helper.state.listening': 'Receiving levels',
  'helper.error.native_helper_missing':
    'Native listener not found. Use the official Windows installer, or run npm run native:build locally.',
  'helper.error.native_helper_spawn_failed':
    'Could not start the native listener (permission or path issue).',
  'helper.error.native_helper_com_error':
    'COM initialization failed. Run in a normal desktop session and retry.',
  'helper.error.native_helper_wasapi_error':
    'WASAPI / audio endpoint failed. Check the default playback device and retry.',
  'helper.error.native_helper_event_error':
    'Audio event callback setup failed. Retry or switch voice source.',
  'helper.error.native_helper_device_error':
    'No usable playback device. Connect or enable an output device.',
  'helper.error.native_helper_usage': 'Native listener arguments were invalid (Usage).',
  'helper.error.native_helper_permission': 'Permission denied when starting the helper.',
  'helper.error.native_helper_exit_nonzero': 'Native listener exited abnormally.',
  'helper.error.native_helper_unknown': 'Native listener reported an unknown error.',
  'helper.missingHint':
    'In development, loopback voice is unavailable until the helper is built; official installers ship voxavatar-audio-listener.exe.',
  'helper.hint.native_helper_missing':
    'In development, compile the helper or use a Windows installer that includes voxavatar-audio-listener.exe.',
  'helper.hint.native_helper_spawn_failed':
    'Confirm the install is complete, then retry from a normal desktop session (not a service session).',
  'helper.hint.native_helper_com_error':
    'Quit and reopen VoxAvatar in a normal desktop session; COM is unavailable in some service contexts.',
  'helper.hint.native_helper_wasapi_error':
    'Check the default playback device and close apps holding exclusive audio mode, then retry.',
  'helper.hint.native_helper_event_error':
    'Retry the voice source; if it keeps failing, switch to External-events mode and share a redacted diagnostic summary.',
  'helper.hint.native_helper_device_error':
    'Connect or enable an output device, then refresh voice sources in Settings.',
  'helper.hint.native_helper_usage':
    'Report this issue; Usage means helper arguments were invalid (often a damaged install).',
  'helper.hint.native_helper_permission':
    'Check whether antivirus or Controlled Folder Access is blocking voxavatar-audio-listener.exe.',
  'helper.hint.native_helper_exit_nonzero':
    'Retry the voice source; if it persists, use External-events mode or reinstall.',
  'helper.hint.native_helper_unknown':
    'Retry; if it fails again, copy the redacted diagnostic summary when reporting.',
  'helper.hint.launch_failed':
    'Native listener failed to start—check the voice source and playback device, then retry.',
  'helper.hint.target_missing':
    'Start the target app and play audio, or pick a different voice source.',
  'helper.hint.no_output':
    'Attached to the target, but no playback yet—play voice in that app to drive lip sync.',
  'helper.hint.inactive':
    'Voice listener is inactive—check the voice mode/source, or switch to External-events mode.',
  'setup.code.model_missing': 'No model imported or selected',
  'setup.code.model_configured': 'Model ready',
  'setup.code.animations_optional_empty': 'No playable actions yet (optional)',
  'setup.code.animations_ready': 'Playable actions available',
  'setup.code.helper_missing': 'Native listener missing',
  'setup.code.helper_launch_failed': 'Native listener failed to start',
  'setup.code.listener_inactive': 'Voice listener not ready',
  'setup.code.voice_external': 'External-events voice mode',
  'setup.code.voice_target_missing': 'Target application is not running',
  'setup.code.voice_listening': 'Receiving target audio levels',
  'setup.code.voice_no_output': 'Attached, no playback output yet',
  'setup.code.voice_ready': 'Voice source ready',
  'setup.code.mcp_online': 'Local MCP is online',
  'setup.code.mcp_starting': 'Local MCP is starting',
  'setup.code.mcp_unavailable': 'Local MCP is unavailable',
  'setup.helperNote':
    'When a native listener is required: download the official installer, or run npm run native:build with Visual Studio Build Tools.',
  'diagnostic.label': 'Diagnostic summary',
  'notice.modelAdded': 'Model added to your library.',
  'notice.modelsImported':
    'Imported {imported}/{scanned} VRM file(s) from the folder (keep {keep} / review {review} / reject {reject}).',
  'notice.modelsImportedOff':
    'Imported {imported}/{scanned} VRM file(s) from the folder.',
  'notice.importPartial':
    'Skipped {skipped}, failed {failed} (existing library unchanged for those).',
  'notice.animationCreated':
    'Action created. Use “+ Add VRMA files” on its card below to add clips; use Edit anytime to change details.',
  'notice.actionPresetExists':
    'Action “{name}” already exists; applied to the form so you can edit or rename it.',
  'notice.clipsAdded': 'VRMA clips added to {name}.',
  'notice.clipsImported':
    'Added {imported}/{scanned} VRMA clip(s) to {name} (keep {keep} / review {review} / reject {reject}).',
  'notice.clipsImportedOff':
    'Added {imported}/{scanned} VRMA clip(s) to {name}.',
  'notice.reportSaved': 'Quality report: {path}',
  'notice.reportSavedShort': 'Quality report saved.',
  'notice.revealReport': 'Show in Explorer',
  'notice.reportFailed': 'Could not write quality report: {error}',
  'notice.qualityGateUpdated': 'Folder-import quality gate updated.',
  'notice.qualityScoreUpdated': 'Quality score thresholds updated.',
  'notice.reportDirUpdated': 'Report save location updated.',
  'notice.reportDirCleared': 'Reports will be saved in the scanned folder again.',
  'notice.defaultModelUpdated': 'Default model updated.',
  'notice.modelDeleted': 'Model deleted from your library.',
  'notice.modelsDeletedAll': 'Deleted all user VRM models ({count}).',
  'notice.clipsDeletedAll': 'Deleted all user VRMA clips ({count}).',
  'notice.animationUpdated': 'Animation details updated.',
  'notice.animationDeleted': 'Animation action removed from your active library.',
  'notice.stateSlotUpdated': 'State motion slot updated.',
  'notice.actionPackImported':
    'Imported action-pack “{name}” ({created} new action(s), {clips} clip(s)).',
  'notice.actionPackPartial':
    '{failed} action(s) did not import fully (failures did not overwrite existing actions).',
  'notice.actionPackCancelled': 'Action-pack import cancelled.',
  'notice.assignByFilenameDone':
    'Filename assignment done: added {assigned}, skipped {skipped} unmatched file(s).',
  'notice.assignByFilenameNone':
    'No assignable files (need an existing action name match, or a whitelist stem like idle/speaking with that action installed).',
  'notice.assignByFilenameCancelled': 'Filename assignment cancelled.',
  'notice.clipDeleted': '{name} removed.',
  'notice.clipReordered': 'Reordered {name}.',
  'notice.clipUpdated': 'Updated clip “{name}”.',
  'notice.clipMoved': 'Moved “{name}” to action “{action}”.',
  'notice.clipMovedToPool': 'Moved “{name}” to the unassigned clip pool.',
  'notice.poolClipsAdded': 'Added {count} VRMA file(s) to the unassigned pool.',
  'notice.poolClipAssigned': 'Assigned “{name}” to action “{action}”.',
  'notice.clipsPurposeUpdated':
    'Updated purpose to {purpose} for {count} clip(s).',
  'notice.packagedRestored': 'Packaged animation actions restored.',
  'notice.characterSizeSet': 'Default character size set to {percent}%.',
  'notice.idleRestSet': 'Idle motion gap set to {seconds}s.',
  'notice.mcpShowMessageEnabled': 'AI message bubbles enabled.',
  'notice.mcpShowMessageDisabled': 'AI message bubbles disabled.',
  'notice.uiLocaleZh': 'Menu language set to Traditional Chinese.',
  'notice.uiLocaleEn': 'Menu language set to English.',
  'notice.lightingUpdated': 'Lighting updated.',
  'notice.lightingReset': 'Lighting reset to VoxAvatar defaults.',
  'notice.voiceDefault': 'Automatic ChatGPT and Codex detection enabled.',
  'notice.voiceExternal': 'External voice integration enabled.',
  'notice.voiceOutput':
    'Output-device listening enabled (confirm you accept the privacy warning).',
  'notice.voiceApplication': 'Voice output source set to {name}.',
  'notice.voicePatternSaved': 'Advanced process pattern saved.',

  'confirm.deleteModel.title': 'Delete “{name}”?',
  'confirm.deleteModel.detail':
    'The model and its locally stored VRM file will be removed.',
  'confirm.deleteAllModels.title': 'Delete all user VRM models?',
  'confirm.deleteAllModels.detail':
    'This removes {count} locally imported model(s) and their VRM files. Packaged models (if any) are kept. This cannot be undone.',
  'confirm.deleteAnimation.title': 'Delete “{name}”?',
  'confirm.deleteAnimation.detailPackaged':
    'The action will be removed from your active library. Reset packaged actions can restore it.',
  'confirm.deleteAnimation.detailCustom':
    'The action and all of its locally stored VRMA clips will be removed.',
  'confirm.deleteClip.title': 'Delete “{name}”?',
  'confirm.deleteClip.detail': 'The locally stored VRMA clip will be removed.',
  'confirm.deleteAllClips.title': 'Delete all user VRMA clips?',
  'confirm.deleteAllClips.detail':
    'This removes {count} uploaded VRMA clip file(s). Action slots themselves are kept. This cannot be undone.',
  'confirm.resetPackaged.title': 'Reset packaged actions?',
  'confirm.resetPackaged.detail':
    'Packaged names, descriptions, triggers, and visibility will be restored. User-created actions and uploaded clips will not change.',

  'models.libraryTitle': 'Model library',
  'models.libraryDesc': 'Select a model to inspect it in the preview.',
  'models.deleteAll': 'Delete all VRM',
  'models.empty.title': 'No character configured yet (first launch)',
  'models.empty.intro':
    'The installer does not bundle a character model. Download a .vrm legally, import it below, then set it as default before the desktop avatar and voice listener appear.',
  'models.empty.sourcesHeading': 'Places to download characters legally:',
  'models.empty.linkVroidHubDesc':
    'Many downloadable VRMs; confirm terms on each model page.',
  'models.empty.linkBoothDesc':
    'Search for VRM; read product terms (most allow local use only).',
  'models.empty.linkTsukuyomiDesc':
    'Free official asset (follow site credit/terms).',
  'models.empty.linkAngelDesc': 'VRoid Hub; young female, more formal look.',
  'models.empty.linkPonytailDesc': 'VRoid Hub; ponytail, free download.',
  'models.empty.linkKiDesc': 'VRoid Hub; permissive free model.',
  'models.empty.linkSampleCDesc': 'Official VRoid sample male.',
  'models.empty.linkTohokuDesc': 'Official humanoid VRM releases.',
  'models.empty.linkStudioDesc': 'Create an original character and export .vrm (cleanest).',
  'models.empty.afterDownloadPrefix':
    'After downloading, use Add a custom model below; the first import becomes default automatically. For body motion, import the',
  'models.empty.vrmaPackLink': 'official VRMA 7-pack',
  'models.empty.afterDownloadSuffix':
    '(local use only; do not redistribute) via Actions → Idle.',
  'models.packagedModel': 'Packaged model',
  'models.userModel': 'User model',
  'models.defaultBadge': 'Default',
  'models.makeDefault': 'Make default',
  'models.addTitle': 'Add a custom model',
  'models.addDesc':
    'Copies the selected VRM into your local library. If the name is blank, the filename is used.',
  'models.nameLabel': 'Model name (optional)',
  'models.namePlaceholder': 'Leave blank to use the VRM filename',
  'models.chooseVrm': 'Choose VRM file',
  'models.chooseVrmHint': 'Choose VRM file',
  'models.chooseVrmFolder': 'Evaluate & import folder',
  'models.chooseVrmFolderHint':
    'Pick a folder to recursively scan .vrm files, run the shared quality gate, and optionally write a Markdown report (voxavatar-vrm-report.md). Strict mode skips rejects; duplicate names are auto-renamed.',
  'models.desktopOnly': 'File import is available only in the VoxAvatar desktop app.',

  'actions.idleGuideTitle': 'Richer idle motions',
  'actions.idleGuideDesc':
    'No Idle clips ship in the installer. Download official or BOOTH .vrma files and add them to Idle (and optionally Greeting / Happy). While idle, VoxAvatar randomly plays non-talk clips when available.',
  'actions.idleGuideStep1Prefix':
    'Get VRoid’s free Photo Booth set from',
  'actions.idleGuideStep1Suffix':
    '(read that page’s terms — local use is typical; bundling extractable files into another installer usually is not).',
  'actions.idleGuideStep2': 'Settings → Actions → Idle → add the .vrma clips.',
  'actions.idleGuideStep3': 'Open the full character behavior guide.',
  'actions.listTitle': 'Animation actions',
  'actions.listDesc':
    'Directly under the create form. System Idle/Speaking use “+ Add VRMA”; custom actions also have Edit. Click a clip or Preview to play; rename, change purpose, or move to another action.',
  'actions.assignByFilename': 'Assign by filename…',
  'actions.assignByFilenameHint':
    'Pick multiple VRMA files; whitelist/name matches suggest existing actions (confirm required; unclear files skipped). Prefer action-pack for explicit mapping.',
  'actions.clipsManageHint':
    'Click a clip or Preview to play on the right. Edit renames the display name, sets purpose (loop / one-shot / pose), moves to another action or the unassigned pool. The on-disk filename stays in sync (readable name + short id).',
  'actions.previewButton': 'Preview',
  'actions.editClip': 'Edit {name}',
  'actions.clipNameLabel': 'Clip display name',
  'actions.clipPurposeLabel': 'Purpose',
  'actions.purpose.loop': 'loop',
  'actions.purpose.one-shot': 'one-shot',
  'actions.purpose.pose': 'pose',
  'actions.moveClipTo': 'Assign to action',
  'actions.saveClip': 'Save clip',
  'actions.clipEditHint':
    'Display names use lowercase letters, numbers, and hyphens (e.g. wave-soft). Saving also syncs the on-disk filename (readable name + short id). Purpose affects quality analysis and playback semantics.',
  'actions.poolTitle': 'Unassigned clip pool',
  'actions.poolDesc':
    'Import VRMA files into the pool, then drag them onto action cards below—or select multiple clips to batch-set purpose.',
  'actions.poolEmpty': 'No clips yet. Use “+ Add VRMA files” to import into the pool.',
  'actions.addPoolClips': '+ Add VRMA files',
  'actions.poolDropHint': 'Drop a clip here',
  'actions.moveClipToPool': 'Move to unassigned pool',
  'actions.batchSelected': '{count} clip(s) selected',
  'actions.batchPurposeLoop': 'Set loop',
  'actions.batchPurposeOneShot': 'Set one-shot',
  'actions.batchPurposePose': 'Set pose',
  'actions.storedFilename': 'On-disk filename',
  'actions.selectClip': 'Select {name}',
  'actions.resetPackaged': 'Reset packaged actions',
  'actions.deleteAllClips': 'Delete all VRMA',
  'actions.systemAction': 'System action',
  'actions.idle': 'Idle',
  'actions.speaking': 'Speaking',
  'actions.packagedModified': 'Packaged · modified',
  'actions.customAction': 'Custom action',
  'actions.trigger': 'Trigger:',
  'actions.clipsTitle': 'VRMA clips',
  'actions.noClips': 'No clips added',
  'actions.clipCount.one': '{count} clip',
  'actions.clipCount.other': '{count} clips',
  'actions.addClips': '+ Add VRMA files',
  'actions.addClipsFolder': '+ Add from folder',
  'actions.qualityGateTitle': 'Folder-import quality gate',
  'actions.qualityGateDesc':
    'Applied when importing VRM or VRMA from a folder (one shared setting). Current thresholds: reject below {reject}, review {reviewLow}–{reviewHigh}, keep at {keep}+. VRMA checks duration, keyframes, spikes, and loop seams; VRM checks extensions, humanoid coverage, meshes, size, and estimated triangles. Can write a Markdown report. Heuristic only — trust the live preview.',
  'actions.qualityGateMode': 'Gate mode',
  'actions.qualityGate.report': 'Analyze and write report (import all)',
  'actions.qualityGate.strict': 'Strict: skip clips judged “reject”',
  'actions.qualityGate.off': 'Disable analysis (fastest)',
  'actions.qualityRejectBelow': 'Reject score threshold (below)',
  'actions.qualityKeepAtLeast': 'Keep score threshold (and no high severity)',
  'actions.qualityScoreHint':
    'Preview: < {reject} reject; {reviewLow}–{reviewHigh} review; ≥ {keep} keep. Keep threshold cannot be lower than reject.',
  'actions.reportDirTitle': 'Report save location',
  'actions.reportDirDesc':
    'By default the report is written into the folder you scanned (VRM: voxavatar-vrm-report.md; VRMA: voxavatar-vrma-report.md). You can also pick a fixed folder.',
  'actions.reportDirScan': 'Scanned folder (default)',
  'actions.reportDirChoose': 'Choose…',
  'actions.reportDirClear': 'Reset',
  'actions.emptyClipsSystemIdle':
    'Upload one or more clips for the idle state. VoxAvatar uses the model pose until then.',
  'actions.emptyClipsSystemSpeaking':
    'Upload one or more clips for the speaking state. VoxAvatar uses the model pose until then.',
  'actions.emptyClipsCustom':
    'No VRMA yet. Use the buttons below to add one or more clips so MCP can play this action.',
  'actions.nextAddClips':
    'Next: add VRMA clips to this action (select multiple files; you can add more later).',
  'actions.previewClip': 'Preview {name}',
  'actions.deleteClip': 'Delete {name}',
  'actions.moveClipUp': 'Move {name} up',
  'actions.moveClipDown': 'Move {name} down',
  'actions.editTitle': 'Edit action details',
  'actions.editDesc':
    'These details describe the action to the VoxAvatar MCP tool. Clips remain grouped under the action if its name changes. You can edit again anytime.',
  'actions.nameLabel': 'Action name animation_name',
  'actions.descriptionLabel': 'Description animation_description',
  'actions.triggerLabel': 'Trigger scenario animation_trigger_scenario',
  'actions.createTitle': 'Create a custom action',
  'actions.createDesc':
    'Fill the name and MCP description, then create. The action card appears immediately in the list below—use Edit for details and “+ Add VRMA files” for clips.',
  'actions.presetsTitle': 'Common actions',
  'actions.presetsDesc':
    'Click to apply to the form below. “Apply & create” creates it and scrolls to the card so you can add VRMA.',
  'actions.presetsApply': 'Apply to form',
  'actions.presetsApplyCreate': 'Apply & create',
  'actions.presetsExists': 'Already created',
  'actions.createNamePlaceholder': 'e.g. wave-hello',
  'actions.createNameHint':
    'Lowercase letters, numbers, and hyphens. Clips added to this action are named automatically, such as wave-hello1 and wave-hello2.',
  'actions.createDescPlaceholder': 'Describe what the movement looks and feels like.',
  'actions.createTriggerPlaceholder': 'Explain when an agent should choose this action.',
  'actions.createButton': 'Create action',

  'stateSlots.title': 'System state motion slots',
  'stateSlots.desc':
    'Bind playable actions to the seven character states. There is no separate listening system action: when Idle is playable, idle/listening slots preselect idle; when Speaking is playable, speaking preselects speaking. You can change or clear to “(unbound)” (Idle/Speaking type fallback). You can also import action-pack.json.',
  'stateSlots.importPack': 'Import action-pack…',
  'stateSlots.none': '(unbound)',
  'stateSlots.noPlayable':
    'No playable actions yet. Add VRMA clips to an action first.',
  'stateSlots.packHelpSummary': 'What is action-pack.json? How to use it',
  'stateSlots.packHelpStep1':
    'Put the .vrma files in a folder (basenames must match the JSON files entries; no subfolders).',
  'stateSlots.packHelpStep2':
    'Create action-pack.json listing animation_name, optional purpose/state_slot, and file basenames.',
  'stateSlots.packHelpStep3':
    'Click “Import action-pack…” and choose the JSON; VoxAvatar creates/updates actions and merges state slots (still through GLB/path/catalog gates).',
  'stateSlots.packHelpStep4':
    'Full contract and a longer example: docs/CHARACTER_BEHAVIOR.md and docs/examples/action-pack.example.json in the repo.',
  'stateSlots.packHelpNote':
    'An action-pack is metadata only—not an installer, not embedded media, and it cannot bypass license or path checks.',
  'stateSlots.packExampleTitle': 'Minimal example',
  'stateSlots.packExampleCopy': 'Copy example',
  'stateSlots.packExampleCopied': 'Copied',
  'stateSlots.state.idle': 'idle',
  'stateSlots.state.listening': 'listening (defaults to idle)',
  'stateSlots.state.speaking': 'speaking',
  'stateSlots.state.working': 'working',
  'stateSlots.state.reviewing': 'reviewing',
  'stateSlots.state.success': 'success',
  'stateSlots.state.failed': 'failed',

  'appearance.localeTitle': 'Interface language',
  'appearance.localeDesc':
    'Interface language applies to the settings page and menus.',
  'appearance.localeAria': 'Interface language',
  'appearance.localeZh': '繁體中文',
  'appearance.localeEn': 'English',
  'appearance.themeTitle': 'Theme',
  'appearance.themeDesc':
    'Sets how this settings window looks. The character overlay stays transparent in every theme.',
  'appearance.themeAria': 'Theme',
  'appearance.theme.system': 'System',
  'appearance.theme.light': 'Light',
  'appearance.theme.dark': 'Dark',
  'appearance.themeNote':
    'System follows your desktop appearance and updates when it changes.',
  'appearance.sizeTitle': 'Default character size',
  'appearance.sizeDesc':
    'Initial framing size for the live avatar. On the desktop overlay, use the mouse wheel (middle-button scroll) to zoom the character; left-drag the character to move the window; middle-drag to rotate; right-click for the shortcut menu. Transparent pixels click through to the desktop.',
  'appearance.sizeAria': 'Default character size',
  'appearance.sizeMin': '30%',
  'appearance.sizeDefault': 'Default',
  'appearance.sizeMax': '160%',
  'appearance.idleRestTitle': 'Idle motion gap',
  'appearance.idleRestDesc':
    'How long to rest after an idle VRMA finishes before picking the next clip. Longer gaps feel less hyperactive.',
  'appearance.idleRestAria': 'Idle motion gap in seconds',
  'appearance.idleRestValue': '{seconds}s',
  'appearance.idleRestMin': '2s',
  'appearance.idleRestMax': '60s',
  'appearance.lightingTitle': 'Lighting',
  'appearance.lightingDesc':
    'Adjust environment and key light for VRM models that look overexposed or too dark.',
  'appearance.lightingReset': 'Reset lighting',
  'appearance.toneMapping': 'Tone mapping',
  'appearance.toneNone': 'None',
  'appearance.toneAces': 'ACES Filmic',
  'appearance.hdrEnvironment': 'HDR environment',
  'appearance.envIntensity': 'Environment intensity',
  'appearance.keyIntensity': 'Key light intensity',
  'appearance.ambientIntensity': 'Ambient / fill intensity',
  'appearance.exposure': 'Exposure',

  'voice.chooseTitle': 'Choose a voice source',
  'voice.chooseDesc':
    'By default VoxAvatar listens to playback from one voice application and turns its volume into animation and lip sync.',
  'voice.modeAria': 'Voice source mode',
  'voice.mode.default.title': 'Automatic',
  'voice.mode.default.desc': 'Detect ChatGPT or Codex output.',
  'voice.mode.application.title': 'Application',
  'voice.mode.application.desc': 'Pick a running Windows app.',
  'voice.mode.output.title': 'Output device',
  'voice.mode.output.desc':
    'Listen to all audio on the current default playback device.',
  'voice.mode.custom.title': 'Advanced',
  'voice.mode.custom.desc': 'Match processes with a regular expression.',
  'voice.mode.external.title': 'External',
  'voice.mode.external.desc': 'Receive levels directly from a pipeline.',
  'voice.outputPrivacyTitle': 'Privacy boundary warning',
  'voice.outputPrivacyWarn':
    'This mode listens to everything mixed on the current default output device (music, video, games, system sounds, other apps)—not just a voice assistant. Levels stay on-device for lip sync / motion triggers and are not uploaded, but the avatar may still react to nearby speech or media. Enable only if you accept this boundary.',
  'voice.applicationTitle': 'Application output',
  'voice.applicationDesc':
    'Start the target voice app, then select its running process.',
  'voice.filterLabel': 'Filter applications',
  'voice.filterPlaceholder': 'Search by application or executable',
  'voice.savedApplication': 'Saved application',
  'voice.notRunning': 'Not currently running',
  'voice.noMatchesTitle': 'No matching voice sources',
  'voice.noMatchesDesc': 'Start the target application and refresh the list.',
  'voice.patternTitle': 'Advanced process pattern',
  'voice.patternDesc':
    'Match output applications that are unavailable or ambiguous in the application picker.',
  'voice.patternLabel': 'Process pattern',
  'voice.patternAria': 'Custom voice process pattern',
  'voice.patternPlaceholder': 'my-voice-app|local-tts',
  'voice.patternNote':
    'The expression is case-insensitive on Windows. VOXAVATAR_TARGET_PROCESS_PATTERN overrides automatic and advanced matching when set.',
  'voice.savePattern': 'Save pattern',
  'voice.externalTitle': 'External voice pipeline',
  'voice.externalDesc':
    'Send normalized state and output levels directly from the component that plays generated speech.',
  'voice.eventsEndpoint': 'Events endpoint',
  'voice.externalNote':
    'External mode disables automatic capture. VoxAvatar receives only speaking state and a normalized level; raw audio and transcripts remain in your pipeline.',
  'voice.statusTitle': 'Listener status',
  'voice.statusDesc': 'Current state of the local voice integration.',
  'voice.statusMode': 'Mode',
  'voice.statusState': 'Status',
  'voice.statusAvailable': 'Available',
  'voice.statusRunningApps': 'Running applications',
  'voice.heading.application': 'Selected application',
  'voice.heading.custom': 'Advanced process pattern',
  'voice.heading.external': 'External events',
  'voice.heading.output': 'Output device mix',
  'voice.heading.automatic': 'Automatic detection',
  'voice.heading.default': 'Automatic detection',
  'voice.detail.loopback': 'Loopback event API',
  'voice.detail.chatgptCodex': 'ChatGPT and Codex',
  'voice.state.waitingEvents': 'Waiting for events',
  'voice.state.receiving': 'Receiving audio',
  'voice.state.monitoring': 'Monitoring',
  'voice.state.inactive': 'Not active',
  'voice.state.noStream': 'No active output stream',

  'mcp.serverTitle': 'Local MCP server',
  'mcp.serverDesc':
    'Connect compatible agents to VoxAvatar’s character controls and configured animation actions.',
  'mcp.health': 'Health',
  'mcp.transport': 'Transport',
  'mcp.transportDesc': 'Model Context Protocol',
  'mcp.transportDefault': 'Streamable HTTP',
  'mcp.access': 'Access',
  'mcp.accessLocal': 'Local only',
  'mcp.accessNetwork': 'Network',
  'mcp.accessBound': 'Bound to 127.0.0.1',
  'mcp.version': 'VoxAvatar',
  'mcp.versionDesc': 'Server version',
  'mcp.checkedAt': 'Checked {time}',
  'mcp.waitingBridge': 'Waiting for the desktop bridge',
  'mcp.endpointTitle': 'Server endpoint',
  'mcp.endpointDesc': 'VoxAvatar serves this endpoint while the desktop app is open.',
  'mcp.checkHealth': 'Check health',
  'mcp.serverUrl': 'Server URL',
  'mcp.setupCommand': 'Codex setup command',
  'mcp.setupCommandLabel': 'Setup command',
  'mcp.portNote':
    'To use a different port, set VOXAVATAR_BRIDGE_PORT before launching VoxAvatar and register the displayed URL.',
  'mcp.usageTitle': 'How to use it after connecting',
  'mcp.usageDesc':
    'Start a new agent session after registration. The agent discovers VoxAvatar’s tools and action guidance automatically. You can ask in natural language:',
  'mcp.usageStatus': '“Check whether VoxAvatar is ready.”',
  'mcp.usageList': '“List playable actions and when each one fits.”',
  'mcp.usagePlay': '“Play wave-hello.” (Use a name returned by the action list.)',
  'mcp.usageWindow': '“Show, hide, or toggle the VoxAvatar window.”',
  'mcp.usageMessage':
    'After enabling: “Show beside the avatar: Done!” Default off; local MCP has no authentication.',
  'mcp.usageState':
    '“Set the character to working / success / failed.” (set_character_state; never invent emotion.)',
  'mcp.usageGuide': 'Read the full MCP usage, schemas, and error handling guide.',
  'mcp.agentMessagesTitle': 'AI message bubble',
  'mcp.agentMessagesDesc':
    'Allow a connected local AI to show short captions via MCP show_message.',
  'mcp.agentMessagesToggle': 'Allow connected AI to show messages',
  'mcp.agentMessagesWarning':
    'Local MCP has no login. Any process on this account may connect. Enable only if you trust local AI clients. Messages stay in memory and are not stored.',
  'mcp.toolsTitle': 'Available tools',
  'mcp.toolsDesc':
    'Tools are exposed without filesystem, transcript, or raw audio access.',
  'mcp.toolsCount': '{count} tools',
  'mcp.tools.play_animation':
    'Play any configured action with at least one animation clip.',
  'mcp.tools.list_animations':
    'Read the latest playable actions and their usage details.',
  'mcp.tools.control_window':
    'Show, hide, or toggle the VoxAvatar character window.',
  'mcp.tools.get_status':
    'Read window, model, voice, listener readiness, and message-bubble flags.',
  'mcp.tools.show_message':
    'Show a short caption, emoji, or kaomoji beside the avatar (opt-in).',
  'mcp.tools.set_character_state':
    'Set a presentation state (working / success / failed, etc.); never invent chat content.',
  'mcp.tools.fallback': 'VoxAvatar MCP tool',
  'mcp.schemaVersions': 'Contract versions tools={tools} / status={status}',
  'mcp.actionsTitle': 'Playable actions',
  'mcp.actionsDesc':
    'Actions appear in the MCP animation tool after they have at least one VRMA clip.',
  'mcp.actionsActive': '{count} active',
  'mcp.noActionsTitle': 'No playable actions detected',
  'mcp.noActionsDesc': 'Add a VRMA clip to an action, then check the server again.',
  'mcp.sessionNote':
    'Start a new Codex session after registering VoxAvatar. Changes to installed actions are published to connected sessions automatically.',

  'preview.live': 'Live preview',
  'preview.liveBadge': 'Live',
  'preview.character': 'Character preview',
  'preview.expand': 'Expand preview',
  'preview.collapse': 'Collapse preview',
  'preview.expandAria': 'Expand preview pane',
  'preview.collapseAria': 'Collapse preview pane',
  'preview.hint': 'Drag to rotate · Mouse wheel to zoom',
  'preview.nowPlaying': 'Now previewing',
  'preview.loadError': 'This model could not be loaded',
  'preview.loadErrorHint': 'Select or delete this model; the rest of Settings remains available.',
};

const MESSAGES: Record<UiLocale, MessageDictionary> = {
  'zh-TW': ZH_TW,
  en: EN,
};

const MCP_TOOL_KEYS = [
  'play_animation',
  'list_animations',
  'control_window',
  'get_status',
  'show_message',
  'set_character_state',
] as const;

/** 供語系鍵對齊測試使用。 */
export function settingsMessageKeys(locale: UiLocale): string[] {
  return Object.keys(MESSAGES[normalizeUiLocale(locale)]).sort();
}

export function mcpToolDescriptionKeys(): readonly string[] {
  return MCP_TOOL_KEYS;
}

/** 依語系回傳設定頁字串；支援 {name} 等簡單插值。 */
export function settingsT(
  locale: UiLocale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const normalized = normalizeUiLocale(locale);
  let text = MESSAGES[normalized][key] ?? MESSAGES.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
