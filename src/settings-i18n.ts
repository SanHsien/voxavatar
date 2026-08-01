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
  'notice.modelAdded': '模型已加入資料庫。',
  'notice.modelsImported':
    '已從目錄匯入 {imported}／{scanned} 個 VRM。',
  'notice.animationCreated':
    '動作已建立。請加入至少一個 VRMA 片段才能播放。',
  'notice.actionPresetExists':
    '動作「{name}」已存在；已套用到表單，可直接編輯或改名。',
  'notice.clipsAdded': '已將 VRMA 片段加入 {name}。',
  'notice.clipsImported':
    '已將 {imported}／{scanned} 個 VRMA 加入 {name}（保留 {keep}／觀察 {review}／淘汰 {reject}）。',
  'notice.clipsImportedOff':
    '已將 {imported}／{scanned} 個 VRMA 加入 {name}。',
  'notice.reportSaved': '品質報告：{path}',
  'notice.reportFailed': '品質報告寫入失敗：{error}',
  'notice.qualityGateUpdated': '目錄匯入品質把關已更新。',
  'notice.reportDirUpdated': '報告儲存位置已更新。',
  'notice.reportDirCleared': '報告改回存入掃描目錄。',
  'notice.defaultModelUpdated': '預設模型已更新。',
  'notice.modelDeleted': '模型已從資料庫移除。',
  'notice.modelsDeletedAll': '已刪除全部使用者 VRM（{count} 個）。',
  'notice.clipsDeletedAll': '已刪除全部使用者 VRMA 片段（{count} 個）。',
  'notice.animationUpdated': '動作詳情已更新。',
  'notice.animationDeleted': '動作已從使用中資料庫移除。',
  'notice.clipDeleted': '已移除 {name}。',
  'notice.packagedRestored': '內建動作已還原。',
  'notice.characterSizeSet': '預設角色大小已設為 {percent}%。',
  'notice.uiLocaleZh': '介面語系已設為繁體中文。',
  'notice.uiLocaleEn': '介面語系已設為 English。',
  'notice.lightingUpdated': '光照已更新。',
  'notice.lightingReset': '光照已重設為 VoxAvatar 預設值。',
  'notice.voiceDefault': '已啟用 ChatGPT 與 Codex 自動偵測。',
  'notice.voiceExternal': '已啟用外部語音整合。',
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
  'models.chooseVrmFolder': '從目錄批次匯入',
  'models.chooseVrmFolderHint':
    '選擇資料夾後，會自動掃描所有子目錄中的 .vrm 並加入資料庫（檔名重複時自動更名）。',
  'models.desktopOnly': '檔案匯入僅在 VoxAvatar 桌面程式可用。',

  'actions.idleGuideTitle': '更豐富的待機動作',
  'actions.idleGuideDesc':
    '安裝包不安裝任何 Idle 動作。請從官方或 BOOTH 下載 .vrma 並加入 Idle（亦可選 Greeting / Happy）。待機時若有素材，VoxAvatar 會隨機播放非說話片段。',
  'actions.idleGuideStep1Prefix':
    '從 BOOTH 取得 VRoid 免費 Photo Booth 組',
  'actions.idleGuideStep1Suffix':
    '（請閱讀該頁條款——通常僅限本機使用；將可提取檔案打包進其他安裝程式通常不允許）。',
  'actions.idleGuideStep2': '設定 → 動作 → Idle → 加入 .vrma 片段。',
  'actions.idleGuideStep3': '完整指南：repo 內 docs/IDLE_MOTIONS.md。',
  'actions.listTitle': '動作列表',
  'actions.listDesc':
    '點選 VRMA 片段可預覽該動畫。動作執行時 VoxAvatar 會從中隨機選取。',
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
    '從目錄批次加入 VRMA 時套用。會檢查時長、關鍵幀密度、旋轉突波、循環接縫與運動量，並可寫入 Markdown 報告供你自行判斷。啟發式僅供參考，請以即時預覽為準。',
  'actions.qualityGate.report': '分析並寫報告（全部匯入）',
  'actions.qualityGate.strict': '嚴格：略過評為「淘汰」的檔案',
  'actions.qualityGate.off': '關閉分析（最快）',
  'actions.reportDirTitle': '報告儲存位置',
  'actions.reportDirDesc':
    '預設寫入你選的掃描目錄（檔名 voxavatar-vrma-report.md）。也可指定固定資料夾。',
  'actions.reportDirScan': '掃描目錄（預設）',
  'actions.reportDirChoose': '選擇…',
  'actions.reportDirClear': '重設',
  'actions.emptyClipsSystemIdle':
    '請上傳一或多個待機片段。在此之前 VoxAvatar 使用模型預設姿勢。',
  'actions.emptyClipsSystemSpeaking':
    '請上傳一或多個說話片段。在此之前 VoxAvatar 使用模型預設姿勢。',
  'actions.emptyClipsCustom':
    '請上傳一或多個片段，此動作才可供 MCP 使用。',
  'actions.previewClip': '預覽 {name}',
  'actions.deleteClip': '刪除 {name}',
  'actions.editTitle': '編輯動作詳情',
  'actions.editDesc':
    '這些詳情供 VoxAvatar MCP 工具描述動作。更名後片段仍歸在同一動作下。',
  'actions.nameLabel': '動作名稱 animation_name',
  'actions.descriptionLabel': '描述 animation_description',
  'actions.triggerLabel': '觸發情境 animation_trigger_scenario',
  'actions.createTitle': '建立自訂動作',
  'actions.createDesc':
    '先建立 MCP 可見的動作，再從上方卡片加入任意數量的 VRMA 片段。',
  'actions.presetsTitle': '常用動作選單',
  'actions.presetsDesc':
    '點選可檢視並套用到下方表單；「套用並建立」會立刻建立動作（仍須自行加入 VRMA）。',
  'actions.presetsApply': '套用到表單',
  'actions.presetsApplyCreate': '套用並建立',
  'actions.presetsExists': '已建立',
  'actions.createNamePlaceholder': '例如：wave-hello',
  'actions.createNameHint':
    '小寫字母、數字與連字號。加入此動作的片段會自動命名，如 wave-hello1、wave-hello2。',
  'actions.createDescPlaceholder': '描述動作的外觀與感覺。',
  'actions.createTriggerPlaceholder': '說明代理應在何時選用此動作。',
  'actions.createButton': '建立動作',

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
  'appearance.sizeMin': '70%',
  'appearance.sizeDefault': '預設',
  'appearance.sizeMax': '160%',
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
    'VoxAvatar 監聽單一語音應用程式的播放，並將音量轉為動畫與口型。',
  'voice.modeAria': '語音來源模式',
  'voice.mode.default.title': '自動',
  'voice.mode.default.desc': '偵測 ChatGPT 或 Codex 輸出。',
  'voice.mode.application.title': '應用程式',
  'voice.mode.application.desc': '選擇執行中的 Windows 應用程式。',
  'voice.mode.custom.title': '進階',
  'voice.mode.custom.desc': '以正則比對程序。',
  'voice.mode.external.title': '外部',
  'voice.mode.external.desc': '由管線直接傳送音量。',
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
  'mcp.toolsTitle': '可用工具',
  'mcp.toolsDesc': '工具不提供檔案系統、轉錄或原始音訊存取。',
  'mcp.toolsCount': '{count} 個工具',
  'mcp.tools.play_animation': '播放任一已設定且至少有一個動畫片段的動作。',
  'mcp.tools.list_animations': '讀取最新可播放動作及其使用說明。',
  'mcp.tools.control_window': '顯示、隱藏或切換 VoxAvatar 角色視窗。',
  'mcp.tools.get_status': '讀取視窗、模型、語音與監聽器就緒狀態。',
  'mcp.tools.fallback': 'VoxAvatar MCP 工具',
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
};

const EN: MessageDictionary = {
  'app.documentTitle': 'VoxAvatar Settings',
  'app.brandSubtitle': 'Settings',
  'app.sidebarStatus': 'Changes save automatically',
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
  'notice.modelAdded': 'Model added to your library.',
  'notice.modelsImported':
    'Imported {imported}/{scanned} VRM file(s) from the folder.',
  'notice.animationCreated':
    'Animation action created. Add one or more VRMA clips to make it playable.',
  'notice.actionPresetExists':
    'Action “{name}” already exists; applied to the form so you can edit or rename it.',
  'notice.clipsAdded': 'VRMA clips added to {name}.',
  'notice.clipsImported':
    'Added {imported}/{scanned} VRMA clip(s) to {name} (keep {keep} / review {review} / reject {reject}).',
  'notice.clipsImportedOff':
    'Added {imported}/{scanned} VRMA clip(s) to {name}.',
  'notice.reportSaved': 'Quality report: {path}',
  'notice.reportFailed': 'Could not write quality report: {error}',
  'notice.qualityGateUpdated': 'Folder-import quality gate updated.',
  'notice.reportDirUpdated': 'Report save location updated.',
  'notice.reportDirCleared': 'Reports will be saved in the scanned folder again.',
  'notice.defaultModelUpdated': 'Default model updated.',
  'notice.modelDeleted': 'Model deleted from your library.',
  'notice.modelsDeletedAll': 'Deleted all user VRM models ({count}).',
  'notice.clipsDeletedAll': 'Deleted all user VRMA clips ({count}).',
  'notice.animationUpdated': 'Animation details updated.',
  'notice.animationDeleted': 'Animation action removed from your active library.',
  'notice.clipDeleted': '{name} removed.',
  'notice.packagedRestored': 'Packaged animation actions restored.',
  'notice.characterSizeSet': 'Default character size set to {percent}%.',
  'notice.uiLocaleZh': 'Menu language set to Traditional Chinese.',
  'notice.uiLocaleEn': 'Menu language set to English.',
  'notice.lightingUpdated': 'Lighting updated.',
  'notice.lightingReset': 'Lighting reset to VoxAvatar defaults.',
  'notice.voiceDefault': 'Automatic ChatGPT and Codex detection enabled.',
  'notice.voiceExternal': 'External voice integration enabled.',
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
  'models.chooseVrmFolder': 'Import folder',
  'models.chooseVrmFolderHint':
    'Pick a folder to recursively import every .vrm under it (duplicate names are auto-renamed).',
  'models.desktopOnly': 'File import is available only in the VoxAvatar desktop app.',

  'actions.idleGuideTitle': 'Richer idle motions',
  'actions.idleGuideDesc':
    'No Idle clips ship in the installer. Download official or BOOTH .vrma files and add them to Idle (and optionally Greeting / Happy). While idle, VoxAvatar randomly plays non-talk clips when available.',
  'actions.idleGuideStep1Prefix':
    'Get VRoid’s free Photo Booth set from',
  'actions.idleGuideStep1Suffix':
    '(read that page’s terms — local use is typical; bundling extractable files into another installer usually is not).',
  'actions.idleGuideStep2': 'Settings → Actions → Idle → add the .vrma clips.',
  'actions.idleGuideStep3': 'Full guide: docs/IDLE_MOTIONS.md in the repo.',
  'actions.listTitle': 'Animation actions',
  'actions.listDesc':
    'Click a VRMA clip to preview that exact animation. VoxAvatar chooses randomly between them when the action runs.',
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
    'Applied when adding VRMA clips from a folder. Checks duration, keyframe density, rotation spikes, loop seams, and motion amount, and can write a Markdown report for you to review. Heuristic only — trust the live preview.',
  'actions.qualityGate.report': 'Analyze and write report (import all)',
  'actions.qualityGate.strict': 'Strict: skip clips judged “reject”',
  'actions.qualityGate.off': 'Disable analysis (fastest)',
  'actions.reportDirTitle': 'Report save location',
  'actions.reportDirDesc':
    'By default the report is written into the folder you scanned (filename voxavatar-vrma-report.md). You can also pick a fixed folder.',
  'actions.reportDirScan': 'Scanned folder (default)',
  'actions.reportDirChoose': 'Choose…',
  'actions.reportDirClear': 'Reset',
  'actions.emptyClipsSystemIdle':
    'Upload one or more clips for the idle state. VoxAvatar uses the model pose until then.',
  'actions.emptyClipsSystemSpeaking':
    'Upload one or more clips for the speaking state. VoxAvatar uses the model pose until then.',
  'actions.emptyClipsCustom':
    'Upload one or more clips to make this action available to MCP.',
  'actions.previewClip': 'Preview {name}',
  'actions.deleteClip': 'Delete {name}',
  'actions.editTitle': 'Edit action details',
  'actions.editDesc':
    'These details describe the action to the VoxAvatar MCP tool. Clips remain grouped under the action if its name changes.',
  'actions.nameLabel': 'Action name animation_name',
  'actions.descriptionLabel': 'Description animation_description',
  'actions.triggerLabel': 'Trigger scenario animation_trigger_scenario',
  'actions.createTitle': 'Create a custom action',
  'actions.createDesc':
    'Create the MCP-visible action first, then add any number of VRMA clips from its card above.',
  'actions.presetsTitle': 'Common actions',
  'actions.presetsDesc':
    'Select a preset to preview and apply it to the form below. “Apply & create” creates the action immediately (you still add VRMA clips yourself).',
  'actions.presetsApply': 'Apply to form',
  'actions.presetsApplyCreate': 'Apply & create',
  'actions.presetsExists': 'Already created',
  'actions.createNamePlaceholder': 'e.g. wave-hello',
  'actions.createNameHint':
    'Lowercase letters, numbers, and hyphens. Clips added to this action are named automatically, such as wave-hello1 and wave-hello2.',
  'actions.createDescPlaceholder': 'Describe what the movement looks and feels like.',
  'actions.createTriggerPlaceholder': 'Explain when an agent should choose this action.',
  'actions.createButton': 'Create action',

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
  'appearance.sizeMin': '70%',
  'appearance.sizeDefault': 'Default',
  'appearance.sizeMax': '160%',
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
    'VoxAvatar listens to playback from one voice application and turns its volume into animation and lip sync.',
  'voice.modeAria': 'Voice source mode',
  'voice.mode.default.title': 'Automatic',
  'voice.mode.default.desc': 'Detect ChatGPT or Codex output.',
  'voice.mode.application.title': 'Application',
  'voice.mode.application.desc': 'Pick a running Windows app.',
  'voice.mode.custom.title': 'Advanced',
  'voice.mode.custom.desc': 'Match processes with a regular expression.',
  'voice.mode.external.title': 'External',
  'voice.mode.external.desc': 'Receive levels directly from a pipeline.',
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
    'Read window, model, voice, and listener readiness.',
  'mcp.tools.fallback': 'VoxAvatar MCP tool',
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
] as const;

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
