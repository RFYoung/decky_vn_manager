export const en = {
  plugin: {
    name: "Visual Novel Manager",
    description: "Manage and play visual novels from various platforms"
  },
  sections: {
    overview: "Overview",
    account: "Account",
    games: "Games",
    environment: "Steam Integration",
    settings: "Settings",
    downloads: "Downloads"
  },
  buttons: {
    login: "Log In",
    logout: "Logout",
    refresh: "Refresh Game List",
    download: "Download & Add to Steam",
    play: "Launch via Steam",
    delete: "Delete & Remove from Steam",
    manageProton: "Manage Compatibility Tools",
    switchServer: "Switch Server",
    dismiss: "Dismiss"
  },
  settings: {
    language: "Language",
    protonVersion: "Compatibility Tool",
    autoUpdate: "Auto Update Games",
    downloadPath: "Download Path",
    preferences: "Preferences",
    about: "About",
    version: "Version",
    backendStatus: "Backend Status",
    backend: {
      running: "Python backend running",
      stopped: "Python backend offline",
      unknown: "Backend status unavailable",
      noUptime: "just started"
    },
    languageOptions: {
      en: "English",
      zh_CN: "Simplified Chinese",
      zh_TW: "Traditional Chinese",
      ja: "Japanese"
    },
    protonOptions: {
      experimental: "Proton Experimental",
      proton9: "Proton 9.0",
      proton8: "Proton 8.0",
      geLatest: "Proton GE Latest"
    }
  },
  fields: {
    username: "Username",
    email: "Email",
    password: "Password",
    server: "Server"
  },
  status: {
    connectedTo: "Connected to",
    loggingIn: "Logging in...",
    switching: "Switching...",
    online: "Online",
    offline: "Offline",
    maintenance: "Maintenance",
    recent_game: "Recent Game",
    loading: "Loading..."
  },
  quick_actions: "Quick Actions",
  welcome: {
    title: "Welcome to Visual Novel Manager",
    description: "Connect to platforms to browse and download visual novels"
  },
  platforms: {
    status: "Platform Status",
    hikari: {
      name: "Hikari Field",
      description: "Japanese visual novel platform",
      cdnLabel: "CDN"
    },
    dlsite: {
      name: "DLsite",
      description: "Japanese doujin game platform"
    }
  },
  library: {
    games_available: "games available",
    last_updated: "Last updated",
    no_games_found: "No games found. Login to platforms to browse games.",
    login_to_see_games: "Login to platforms to see your games."
  },
  modals: {
    login: {
      title: "Login to Hikari Field"
    },
    serverSelection: {
      title: "Select Server"
    },
    dlsite_login: {
      title: "Login to DLsite"
    }
  },
  dlsite: {
    login_note: "Login with your DLsite account to access your purchased games."
  },
  errors: {
    missingCredentials: "Please enter username and password",
    loginFailed: "Login failed",
    fetch_games_failed: "Failed to fetch game list",
    download_failed: "Download failed",
    error_occurred: "Error"
  },
  download: {
    eta: "ETA",
    paused: "Paused",
    error: "Error",
    pending: "Pending",
    cancelled: "Cancelled",
    downloading: "Downloading...",
    active_downloads: "Active Downloads",
    no_active: "No active downloads yet",
    tips: "Download Tips",
    tip_title: "Tips",
    tip_resume: "Downloads can be resumed if interrupted",
    tip_background: "Downloads continue in the background",
    tip_steam_auto: "Games are automatically added to Steam after download"
  },
  steam: {
    title: "Steam Integration",
    integration_status: "Integration Status",
    compatibility_tool: "Compatibility Tool",
    add_to_steam: "Add to Steam",
    remove_from_steam: "Remove from Steam",
    launch_via_steam: "Launch via Steam",
    launch_direct: "Launch Directly",
    configure_wine: "Configure Wine",
    configure_wine_title: "Configure Wine Components",
    wine_components: "Wine Components",
    locale_setting: "System Locale",
    current_config: "Current Configuration",
    compatibility: "Compatibility Tool",
    locale: "Locale",
    components: "Components",
    added_to_steam: "Added to Steam",
    not_in_steam: "Not in Steam",
    loading: "Loading...",
    configuring: "Configuring...",
    apply_config: "Apply Configuration",
    setup_success: "Steam integration set up successfully",
    setup_failed: "Failed to set up Steam integration",
    environment: "Steam Environment",
    notConfigured: "Not added to Steam",
    manageVersions: "Manage Compatibility Tools",
    setupEnvironment: "Add to Steam",
    version: "Compatibility Tool",
    game_config: "Game Configuration",
    help: "Help & Tips",
    help_title: "Steam Integration Help",
    help_auto_add: "Games are automatically added to Steam after download",
    help_wine_config: "Configure Wine components for better compatibility",
    help_proton_versions: "Choose the best Proton version for each game",
    no_game_selected: "No Game Selected",
    select_game_first: "Select a Game First",
    download_game_instruction: "Download a game from the library to configure Steam integration",
    localeLabels: {
      japanese: "Japanese (ja_JP)",
      chinese: "Chinese (zh_CN)",
      korean: "Korean (ko_KR)",
      english: "English (en_US)"
    },
    wineComponents: {
      wmp9: {
        name: "Windows Media Player 9",
        description: "Media playback support"
      },
      wmp10: {
        name: "Windows Media Player 10",
        description: "Enhanced media support"
      },
      wmp11: {
        name: "Windows Media Player 11",
        description: "Latest media support"
      },
      wmv9vcm: {
        name: "WMV9 Video Codec",
        description: "Video codec for WMV files"
      },
      vcrun2019: {
        name: "Visual C++ 2019",
        description: "Runtime libraries"
      },
      vcrun2022: {
        name: "Visual C++ 2022",
        description: "Latest runtime libraries"
      },
      cjkfonts: {
        name: "CJK Fonts",
        description: "Chinese/Japanese/Korean fonts"
      },
      fakejapanese: {
        name: "Japanese Locale",
        description: "Japanese system locale"
      }
    }
  },
  messages: {
    loginSuccess: "Login successful",
    loginFailed: "Login failed",
    downloadStarted: "Download started",
    downloadFailed: "Download failed",
    gameNotFound: "Game not found",
    downloadInProgress: "Download already in progress",
    steamIntegrationSuccess: "Successfully added to Steam",
    steamIntegrationFailed: "Failed to add to Steam",
    wineConfigSuccess: "Wine components configured successfully",
    wineConfigFailed: "Failed to configure Wine components"
  }
};
