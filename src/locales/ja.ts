export const ja = {
  plugin: {
    name: "ビジュアルノベル管理ツール",
    description: "様々なプラットフォームからビジュアルノベルを管理・実行"
  },
  sections: {
    overview: "概要",
    account: "アカウント",
    games: "ゲーム",
    environment: "Steam連携",
    settings: "設定",
    downloads: "ダウンロード"
  },
  buttons: {
    login: "ログイン",
    logout: "ログアウト",
    refresh: "ゲームリストを更新",
    download: "ダウンロードしてSteamに追加",
    play: "Steamから起動",
    delete: "削除してSteamから除去",
    manageProton: "互換性ツール管理",
    switchServer: "サーバー切り替え",
    dismiss: "閉じる"
  },
  settings: {
    language: "言語",
    protonVersion: "互換性ツール",
    autoUpdate: "ゲーム自動更新",
    downloadPath: "ダウンロードパス",
    preferences: "設定",
    about: "について",
    version: "バージョン",
    backendStatus: "バックエンド状態",
    backend: {
      running: "Python バックエンド稼働中",
      stopped: "Python バックエンドが停止しています",
      unknown: "バックエンド状態を取得できません",
      noUptime: "起動したばかり"
    },
    languageOptions: {
      en: "英語",
      zh_CN: "簡体字中国語",
      zh_TW: "繁体字中国語",
      ja: "日本語"
    },
    protonOptions: {
      experimental: "Proton 実験版",
      proton9: "Proton 9.0",
      proton8: "Proton 8.0",
      geLatest: "Proton GE 最新版"
    }
  },
  fields: {
    username: "ユーザー名",
    email: "メールアドレス",
    password: "パスワード",
    server: "サーバー"
  },
  status: {
    connectedTo: "接続先",
    loggingIn: "ログイン中...",
    switching: "切り替え中...",
    online: "オンライン",
    offline: "オフライン",
    maintenance: "メンテナンス中",
    recent_game: "最近のゲーム",
    loading: "読み込み中..."
  },
  quick_actions: "クイックアクション",
  welcome: {
    title: "ビジュアルノベル管理ツールへようこそ",
    description: "プラットフォームに接続してビジュアルノベルを閲覧・ダウンロード"
  },
  platforms: {
    status: "プラットフォーム状態",
    hikari: {
      name: "Hikari Field",
      description: "日本のビジュアルノベルプラットフォーム",
      cdnLabel: "CDN"
    },
    dlsite: {
      name: "DLsite",
      description: "日本の同人ゲームプラットフォーム"
    }
  },
  library: {
    games_available: "ゲーム利用可能",
    last_updated: "最終更新",
    no_games_found: "ゲームが見つかりません。プラットフォームにログインしてゲームを閲覧してください。",
    login_to_see_games: "プラットフォームにログインしてあなたのゲームを表示してください。"
  },
  modals: {
    login: {
      title: "ひかりフィールドにログイン"
    },
    serverSelection: {
      title: "サーバー選択"
    },
    dlsite_login: {
      title: "DLsiteにログイン"
    }
  },
  dlsite: {
    login_note: "DLsiteアカウントでログインして購入済みゲームにアクセスしてください。"
  },
  errors: {
    missingCredentials: "ユーザー名とパスワードを入力してください",
    loginFailed: "ログインに失敗しました",
    fetch_games_failed: "ゲームリストの取得に失敗しました",
    download_failed: "ダウンロードに失敗しました",
    error_occurred: "エラー"
  },
  download: {
    eta: "推定残り時間",
    paused: "一時停止中",
    error: "エラー",
    pending: "待機中",
    cancelled: "キャンセル済み",
    downloading: "ダウンロード中...",
    active_downloads: "アクティブダウンロード",
    no_active: "進行中のダウンロードはありません",
    tips: "ダウンロードのコツ",
    tip_title: "ヒント",
    tip_resume: "ダウンロードは中断されても再開できます",
    tip_background: "ダウンロードはバックグラウンドで継続されます",
    tip_steam_auto: "ゲームはダウンロード後に自動的にSteamに追加されます"
  },
  steam: {
    title: "Steam連携",
    integration_status: "連携状態",
    compatibility_tool: "互換性ツール",
    add_to_steam: "Steamに追加",
    remove_from_steam: "Steamから削除",
    launch_via_steam: "Steamから起動",
    launch_direct: "直接起動",
    configure_wine: "Wine設定",
    configure_wine_title: "Wineコンポーネント設定",
    wine_components: "Wineコンポーネント",
    locale_setting: "システムロケール",
    current_config: "現在の設定",
    compatibility: "互換性ツール",
    locale: "ロケール",
    components: "コンポーネント",
    added_to_steam: "Steamに追加済み",
    not_in_steam: "Steam未追加",
    loading: "読み込み中...",
    configuring: "設定中...",
    apply_config: "設定を適用",
    setup_success: "Steam連携設定成功",
    setup_failed: "Steam連携設定失敗",
    environment: "Steam環境",
    notConfigured: "Steam未追加",
    manageVersions: "互換性ツール管理",
    setupEnvironment: "Steamに追加",
    version: "互換性ツール",
    game_config: "ゲーム設定",
    help: "ヘルプとコツ",
    help_title: "Steam連携ヘルプ",
    help_auto_add: "ゲームはダウンロード後に自動的にSteamに追加されます",
    help_wine_config: "互換性向上のためのWineコンポーネント設定",
    help_proton_versions: "各ゲームに最適なProtonバージョンを選択",
    no_game_selected: "ゲーム未選択",
    select_game_first: "まずゲームを選択してください",
    download_game_instruction: "ライブラリからゲームをダウンロードしてSteam連携を設定してください",
    localeLabels: {
      japanese: "日本語 (ja_JP)",
      chinese: "中国語 (zh_CN)",
      korean: "韓国語 (ko_KR)",
      english: "英語 (en_US)"
    },
    wineComponents: {
      wmp9: {
        name: "Windows Media Player 9",
        description: "メディア再生をサポートします"
      },
      wmp10: {
        name: "Windows Media Player 10",
        description: "強化されたメディアサポート"
      },
      wmp11: {
        name: "Windows Media Player 11",
        description: "最新のメディアサポート"
      },
      wmv9vcm: {
        name: "WMV9 ビデオコーデック",
        description: "WMV ファイル用のビデオコーデック"
      },
      vcrun2019: {
        name: "Visual C++ 2019",
        description: "ランタイムライブラリ"
      },
      vcrun2022: {
        name: "Visual C++ 2022",
        description: "最新のランタイムライブラリ"
      },
      cjkfonts: {
        name: "CJK フォント",
        description: "中国語・日本語・韓国語のフォントを追加"
      },
      fakejapanese: {
        name: "日本語ロケール",
        description: "システムロケールを日本語に設定"
      }
    }
  },
  messages: {
    loginSuccess: "ログイン成功",
    loginFailed: "ログイン失敗",
    downloadStarted: "ダウンロード開始",
    downloadFailed: "ダウンロード失敗",
    gameNotFound: "ゲームが見つかりません",
    downloadInProgress: "ダウンロード実行中",
    steamIntegrationSuccess: "Steamへの追加が完了しました",
    steamIntegrationFailed: "Steamへの追加に失敗しました",
    wineConfigSuccess: "Wineコンポーネント設定完了",
    wineConfigFailed: "Wineコンポーネント設定失敗"
  }
};
