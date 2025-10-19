export const zh_CN = {
  plugin: {
    name: "视觉小说管理器",
    description: "管理和运行来自各个平台的视觉小说"
  },
  sections: {
    overview: "总览",
    account: "账户",
    games: "游戏",
    environment: "Steam 集成",
    settings: "设置",
    downloads: "下载"
  },
  buttons: {
    login: "登录",
    logout: "退出登录",
    refresh: "刷新游戏列表",
    download: "下载并添加到 Steam",
    play: "通过 Steam 启动",
    delete: "删除并从 Steam 移除",
    manageProton: "管理兼容性工具",
    switchServer: "切换服务器",
    dismiss: "关闭"
  },
  settings: {
    language: "语言",
    protonVersion: "兼容性工具",
    autoUpdate: "自动更新游戏",
    downloadPath: "下载路径",
    preferences: "偏好设置",
    about: "关于",
    version: "版本",
    backendStatus: "后端状态",
    backend: {
      running: "Python 后端运行中",
      stopped: "Python 后端未运行",
      unknown: "后端状态不可用",
      noUptime: "刚刚启动"
    },
    languageOptions: {
      en: "英语",
      zh_CN: "简体中文",
      zh_TW: "繁體中文",
      ja: "日语"
    },
    protonOptions: {
      experimental: "Proton 实验版",
      proton9: "Proton 9.0",
      proton8: "Proton 8.0",
      geLatest: "Proton GE 最新版"
    }
  },
  fields: {
    username: "用户名",
    email: "邮箱",
    password: "密码",
    server: "服务器"
  },
  status: {
    connectedTo: "已连接到",
    loggingIn: "登录中...",
    switching: "切换中...",
    online: "在线",
    offline: "离线",
    maintenance: "维护中",
    recent_game: "最近游戏",
    loading: "加载中..."
  },
  quick_actions: "快速操作",
  welcome: {
    title: "欢迎使用视觉小说管理器",
    description: "连接到平台以浏览和下载视觉小说"
  },
  platforms: {
    status: "平台状态",
    hikari: {
      name: "Hikari Field",
      description: "日本视觉小说平台",
      cdnLabel: "CDN"
    },
    dlsite: {
      name: "DLsite",
      description: "日本同人游戏平台"
    }
  },
  library: {
    games_available: "游戏可用",
    last_updated: "最后更新",
    no_games_found: "未找到游戏。请登录平台以浏览游戏。",
    login_to_see_games: "登录平台以查看您的游戏。"
  },
  modals: {
    login: {
      title: "登录Hikari Field"
    },
    serverSelection: {
      title: "选择服务器"
    },
    dlsite_login: {
      title: "登录DLsite"
    }
  },
  dlsite: {
    login_note: "使用DLsite账户登录以访问您已购买的游戏。"
  },
  errors: {
    missingCredentials: "请输入用户名和密码",
    loginFailed: "登录失败",
    fetch_games_failed: "获取游戏列表失败",
    download_failed: "下载失败",
    error_occurred: "错误"
  },
  download: {
    eta: "预计剩余时间",
    paused: "已暂停",
    error: "错误",
    pending: "排队中",
    cancelled: "已取消",
    downloading: "下载中...",
    active_downloads: "活跃下载",
    no_active: "暂无进行中的下载",
    tips: "下载提示",
    tip_title: "提示",
    tip_resume: "下载可以在中断后恢复",
    tip_background: "下载在后台继续进行",
    tip_steam_auto: "游戏下载后自动添加到Steam"
  },
  steam: {
    title: "Steam 集成",
    integration_status: "集成状态",
    compatibility_tool: "兼容性工具",
    add_to_steam: "添加到 Steam",
    remove_from_steam: "从 Steam 移除",
    launch_via_steam: "通过 Steam 启动",
    launch_direct: "直接启动",
    configure_wine: "配置 Wine",
    configure_wine_title: "配置 Wine 组件",
    wine_components: "Wine 组件",
    locale_setting: "系统区域设置",
    current_config: "当前配置",
    compatibility: "兼容性工具",
    locale: "区域设置",
    components: "组件",
    added_to_steam: "已添加到 Steam",
    not_in_steam: "未添加到 Steam",
    loading: "加载中...",
    configuring: "配置中...",
    apply_config: "应用配置",
    setup_success: "Steam 集成设置成功",
    setup_failed: "Steam 集成设置失败",
    environment: "Steam 环境",
    notConfigured: "未添加到 Steam",
    manageVersions: "管理兼容性工具",
    setupEnvironment: "添加到 Steam",
    version: "兼容性工具",
    game_config: "游戏配置",
    help: "帮助和提示",
    help_title: "Steam集成帮助",
    help_auto_add: "游戏下载后自动添加到Steam",
    help_wine_config: "配置Wine组件以提高兼容性",
    help_proton_versions: "为每个游戏选择最佳Proton版本",
    no_game_selected: "未选择游戏",
    select_game_first: "请先选择游戏",
    download_game_instruction: "从库中下载游戏以配置Steam集成",
    localeLabels: {
      japanese: "日语 (ja_JP)",
      chinese: "简体中文 (zh_CN)",
      korean: "韩语 (ko_KR)",
      english: "英语 (en_US)"
    },
    wineComponents: {
      wmp9: {
        name: "Windows Media Player 9",
        description: "提供媒体播放支持"
      },
      wmp10: {
        name: "Windows Media Player 10",
        description: "增强的媒体支持"
      },
      wmp11: {
        name: "Windows Media Player 11",
        description: "最新的媒体支持"
      },
      wmv9vcm: {
        name: "WMV9 视频解码器",
        description: "用于 WMV 文件的视频解码器"
      },
      vcrun2019: {
        name: "Visual C++ 2019",
        description: "运行时库"
      },
      vcrun2022: {
        name: "Visual C++ 2022",
        description: "最新运行时库"
      },
      cjkfonts: {
        name: "中日韩字体",
        description: "安装中日韩字体"
      },
      fakejapanese: {
        name: "日文区域设置",
        description: "将系统区域设置为日文"
      }
    }
  },
  messages: {
    loginSuccess: "登录成功",
    loginFailed: "登录失败",
    downloadStarted: "下载已开始",
    downloadFailed: "下载失败",
    gameNotFound: "未找到游戏",
    downloadInProgress: "下载正在进行中",
    steamIntegrationSuccess: "已成功添加到 Steam",
    steamIntegrationFailed: "添加到 Steam 失败",
    wineConfigSuccess: "Wine 组件配置成功",
    wineConfigFailed: "Wine 组件配置失败"
  }
};
