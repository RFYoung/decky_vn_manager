export const zh_TW = {
  plugin: {
    name: "視覺小說管理器",
    description: "管理和運行來自各個平台的視覺小說"
  },
  sections: {
    overview: "總覽",
    account: "帳戶",
    games: "遊戲",
    environment: "Steam 整合",
    settings: "設定",
    downloads: "下載"
  },
  buttons: {
    login: "登入",
    logout: "登出",
    refresh: "重新整理遊戲清單",
    download: "下載並新增至 Steam",
    play: "透過 Steam 啟動",
    delete: "刪除並從 Steam 移除",
    manageProton: "管理相容性工具",
    switchServer: "切換伺服器",
    dismiss: "關閉"
  },
  settings: {
    language: "語言",
    protonVersion: "相容性工具",
    autoUpdate: "自動更新遊戲",
    downloadPath: "下載路徑",
    preferences: "偏好設定",
    about: "關於",
    version: "版本",
    backendStatus: "後端狀態",
    backend: {
      running: "Python 後端執行中",
      stopped: "Python 後端未啟動",
      unknown: "無法取得後端狀態",
      noUptime: "剛啟動"
    },
    languageOptions: {
      en: "英文",
      zh_CN: "簡體中文",
      zh_TW: "繁體中文",
      ja: "日文"
    },
    protonOptions: {
      experimental: "Proton 實驗版",
      proton9: "Proton 9.0",
      proton8: "Proton 8.0",
      geLatest: "Proton GE 最新版"
    }
  },
  fields: {
    username: "使用者名稱",
    email: "電子郵件",
    password: "密碼",
    server: "伺服器"
  },
  status: {
    connectedTo: "已連線到",
    loggingIn: "登入中...",
    switching: "切換中...",
    online: "線上",
    offline: "離線",
    maintenance: "維護中",
    recent_game: "最近遊戲",
    loading: "載入中..."
  },
  quick_actions: "快速操作",
  welcome: {
    title: "歡迎使用視覺小說管理器",
    description: "連接到平台以瀏覽和下載視覺小說"
  },
  platforms: {
    status: "平台狀態",
    hikari: {
      name: "Hikari Field",
      description: "日本視覺小說平台",
      cdnLabel: "CDN"
    },
    dlsite: {
      name: "DLsite",
      description: "日本同人遊戲平台"
    }
  },
  library: {
    games_available: "遊戲可用",
    last_updated: "最後更新",
    no_games_found: "未找到遊戲。請登入平台以瀏覽遊戲。",
    login_to_see_games: "登入平台以查看您的遊戲。"
  },
  modals: {
    login: {
      title: "登入Hikari Field"
    },
    serverSelection: {
      title: "選擇伺服器"
    },
    dlsite_login: {
      title: "登入DLsite"
    }
  },
  dlsite: {
    login_note: "使用DLsite帳戶登入以存取您已購買的遊戲。"
  },
  errors: {
    missingCredentials: "請輸入使用者名稱和密碼",
    loginFailed: "登入失敗",
    fetch_games_failed: "獲取遊戲清單失敗",
    download_failed: "下載失敗",
    error_occurred: "錯誤"
  },
  download: {
    eta: "預計剩餘時間",
    paused: "已暫停",
    error: "錯誤",
    pending: "排隊中",
    cancelled: "已取消",
    downloading: "下載中...",
    active_downloads: "活躍下載",
    no_active: "目前沒有進行中的下載",
    tips: "下載提示",
    tip_title: "提示",
    tip_resume: "下載可以在中斷後恢復",
    tip_background: "下載在背景中繼續進行",
    tip_steam_auto: "遊戲下載後自動新增至Steam"
  },
  steam: {
    title: "Steam 整合",
    integration_status: "整合狀態",
    compatibility_tool: "相容性工具",
    add_to_steam: "新增至 Steam",
    remove_from_steam: "從 Steam 移除",
    launch_via_steam: "透過 Steam 啟動",
    launch_direct: "直接啟動",
    configure_wine: "設定 Wine",
    configure_wine_title: "設定 Wine 元件",
    wine_components: "Wine 元件",
    locale_setting: "系統區域設定",
    current_config: "目前設定",
    compatibility: "相容性工具",
    locale: "區域設定",
    components: "元件",
    added_to_steam: "已新增至 Steam",
    not_in_steam: "未新增至 Steam",
    loading: "載入中...",
    configuring: "設定中...",
    apply_config: "套用設定",
    setup_success: "Steam 整合設定成功",
    setup_failed: "Steam 整合設定失敗",
    environment: "Steam 環境",
    notConfigured: "未新增至 Steam",
    manageVersions: "管理相容性工具",
    setupEnvironment: "新增至 Steam",
    version: "相容性工具",
    game_config: "遊戲設定",
    help: "幫助和提示",
    help_title: "Steam 整合幫助",
    help_auto_add: "遊戲下載後自動新增至Steam",
    help_wine_config: "設定Wine元件以提高相容性",
    help_proton_versions: "為每個遊戲選擇最佳Proton版本",
    no_game_selected: "未選擇遊戲",
    select_game_first: "請先選擇遊戲",
    download_game_instruction: "從庫中下載遊戲以設定Steam整合",
    localeLabels: {
      japanese: "日文 (ja_JP)",
      chinese: "簡體中文 (zh_CN)",
      korean: "韓文 (ko_KR)",
      english: "英文 (en_US)"
    },
    wineComponents: {
      wmp9: {
        name: "Windows Media Player 9",
        description: "提供媒體播放支援"
      },
      wmp10: {
        name: "Windows Media Player 10",
        description: "增強的媒體支援"
      },
      wmp11: {
        name: "Windows Media Player 11",
        description: "最新的媒體支援"
      },
      wmv9vcm: {
        name: "WMV9 影片解碼器",
        description: "用於 WMV 檔案的影片解碼器"
      },
      vcrun2019: {
        name: "Visual C++ 2019",
        description: "執行階段函式庫"
      },
      vcrun2022: {
        name: "Visual C++ 2022",
        description: "最新執行階段函式庫"
      },
      cjkfonts: {
        name: "中日韓字型",
        description: "安裝中日韓字型"
      },
      fakejapanese: {
        name: "日文地區設定",
        description: "將系統地區設定為日文"
      }
    }
  },
  messages: {
    loginSuccess: "登入成功",
    loginFailed: "登入失敗",
    downloadStarted: "下載已開始",
    downloadFailed: "下載失敗",
    gameNotFound: "未找到遊戲",
    downloadInProgress: "下載正在進行中",
    steamIntegrationSuccess: "已成功新增至 Steam",
    steamIntegrationFailed: "新增至 Steam 失敗",
    wineConfigSuccess: "Wine 元件設定成功",
    wineConfigFailed: "Wine 元件設定失敗"
  }
};
