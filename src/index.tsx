import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ButtonItem,
  Focusable,
  staticClasses,
  Spinner,
  Field,
} from "@decky/ui";
import { FaBook, FaGamepad, FaCog, FaDownload, FaSteam, FaPlay } from "react-icons/fa";
import { useState, FC, useEffect, useMemo, useCallback } from "react";
import { call } from "@decky/api";
import { HikariLogin } from "./components/HikariLogin";
import { DLsiteLogin } from "./components/DLsiteLogin";
import { GameList, Platform } from "./components/GameList";
import { SteamIntegration } from "./components/SteamIntegration";
import { DownloadManager } from "./components/DownloadManager";
import { Settings } from "./components/Settings";
import { useTranslation } from "./hooks/useTranslation";
import { Language } from "./locales";
import { commonStyles } from "./utils/styles";


interface Game {
  id: string;
  name: string;
  size: string;
  platform: Platform;
  installed?: boolean;
  downloading?: boolean;
  progress?: number;
  circle?: string; // DLsite specific
  price?: number; // DLsite specific
  tags?: string[]; // DLsite specific
}

interface Preferences {
  language: Language;
  defaultProtonVersion: string;
  autoUpdate: boolean;
  downloadPath: string;
}

type PreferenceUpdate = Partial<Preferences>;

type PageKey = "overview" | "library" | "downloads" | "steam" | "settings";

interface BackendStatus {
  running: boolean;
  uptimeSeconds?: number;
  startedAt?: number;
}

const normalizePreferences = (
  raw: Partial<Preferences> | null | undefined,
  allowedLanguages: Language[],
  fallbackLanguage: Language
): Preferences => {
  const candidateLanguage =
    typeof raw?.language === "string" ? (raw.language as Language) : undefined;
  const language = candidateLanguage && allowedLanguages.includes(candidateLanguage)
    ? candidateLanguage
    : fallbackLanguage;

  const defaultProtonVersion =
    typeof raw?.defaultProtonVersion === "string" && raw.defaultProtonVersion.trim().length > 0
      ? raw.defaultProtonVersion
      : "proton_experimental";

  const autoUpdate = typeof raw?.autoUpdate === "boolean" ? raw.autoUpdate : true;
  const downloadPath = typeof raw?.downloadPath === "string" ? raw.downloadPath : "";

  return {
    language,
    defaultProtonVersion,
    autoUpdate,
    downloadPath,
  };
};

const Content: FC = () => {
  const { t, currentLanguage, setLanguage, availableLanguages } = useTranslation();

  // Hikari Field state
  const [isHikariLoggedIn, setIsHikariLoggedIn] = useState(false);
  const [cdnServers, setCdnServers] = useState<any[]>([]);
  const [selectedCdn, setSelectedCdn] = useState<string | null>(null);
  const [hikariGames, setHikariGames] = useState<Game[]>([]);

  // DLsite state
  const [isDLsiteLoggedIn, setIsDLsiteLoggedIn] = useState(false);
  const [dlsiteGames, setDLsiteGames] = useState<Game[]>([]);

  // Combined state (derived)
  const [isLoading, setIsLoading] = useState(false);
  const [recentGame, _setRecentGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() =>
    normalizePreferences(null, availableLanguages, currentLanguage)
  );
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);

  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await call<[], Partial<Preferences>>("get_user_preferences");
      const normalized = normalizePreferences(prefs, availableLanguages, currentLanguage);
      setPreferences(normalized);
      if (normalized.language !== currentLanguage) {
        setLanguage(normalized.language);
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    }
  }, [availableLanguages, currentLanguage, setLanguage]);

  const persistPreferences = useCallback(async (updates: PreferenceUpdate) => {
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as PreferenceUpdate;

    if (Object.keys(payload).length === 0) {
      return;
    }

    let provisionalLanguage: Language | null = null;
    setPreferences(prev => {
      const merged = normalizePreferences({ ...prev, ...payload }, availableLanguages, prev.language);
      provisionalLanguage = merged.language;
      return merged;
    });

    if (payload.language && payload.language !== currentLanguage) {
      setLanguage(payload.language);
    }

    try {
      const saved = await call<[PreferenceUpdate], Preferences>("update_user_preferences", payload);
      const normalized = normalizePreferences(saved, availableLanguages, provisionalLanguage ?? currentLanguage);
      setPreferences(normalized);
      if (normalized.language !== currentLanguage) {
        setLanguage(normalized.language);
      }
    } catch (error) {
      console.error("Failed to update user preferences:", error);
    }
  }, [availableLanguages, currentLanguage, setLanguage]);

  const loadBackendStatus = useCallback(async () => {
    try {
      const status = await call<[], BackendStatus>("get_backend_status");
      setBackendStatus(status);
    } catch (error) {
      console.error("Failed to fetch backend status:", error);
      setBackendStatus(current => current ? { ...current, running: false } : { running: false });
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    loadBackendStatus();
    const interval = setInterval(loadBackendStatus, 30000);
    return () => clearInterval(interval);
  }, [loadBackendStatus]);

  const handleLanguagePreferenceChange = useCallback((language: Language) => {
    persistPreferences({ language });
  }, [persistPreferences]);

  const handleProtonPreferenceChange = useCallback((version: string) => {
    persistPreferences({ defaultProtonVersion: version });
  }, [persistPreferences]);

  const handleAutoUpdateChange = useCallback((value: boolean) => {
    persistPreferences({ autoUpdate: value });
  }, [persistPreferences]);

  const handleDownloadPathChange = useCallback((path: string) => {
    persistPreferences({ downloadPath: path });
  }, [persistPreferences]);

  // Note: Server configuration is handled internally by HikariLogin component

  useEffect(() => {
    checkLoginStatus();
    checkDLsiteLoginStatus();
  }, []);

  useEffect(() => {
    if (isHikariLoggedIn) {
      refreshHikariGames();
    }
  }, [isHikariLoggedIn]);

  useEffect(() => {
    if (isDLsiteLoggedIn) {
      refreshDLsiteGames();
    }
  }, [isDLsiteLoggedIn]);

  const allGames = useMemo(() => [...hikariGames, ...dlsiteGames], [hikariGames, dlsiteGames]);

  useEffect(() => {
    const installedGames = allGames.filter(g => g.installed);
    if (installedGames.length > 0) {
      _setRecentGame(installedGames[0]);
    } else {
      _setRecentGame(null);
    }
  }, [allGames]);

  const checkLoginStatus = async () => {
    try {
      const status = await call<[], { isLoggedIn: boolean; cdnServers: any[]; selectedCdn: string | null }>(
        "get_login_status"
      );
      setIsHikariLoggedIn(status.isLoggedIn);
      setCdnServers(status.cdnServers || []);
      setSelectedCdn(status.selectedCdn);
    } catch (error) {
      console.error("Failed to check Hikari login status:", error);
    }
  };

  const checkDLsiteLoginStatus = async () => {
    try {
      const status = await call<[], { isLoggedIn: boolean }>(
        "get_dlsite_login_status"
      );
      setIsDLsiteLoggedIn(status.isLoggedIn);
    } catch (error) {
      console.error("Failed to check DLsite login status:", error);
    }
  };

  const refreshHikariGames = useCallback(async (force: boolean = false) => {
    if (!isHikariLoggedIn) return;

    setIsLoading(true);
    setError(null);
    try {
      const games = force
        ? await call<[boolean], Game[]>("get_hikari_game_list", true)
        : await call<[], Game[]>("get_hikari_game_list");
      // Add platform info to games
      const hikariGamesWithPlatform = games.map(game => ({
        ...game,
        platform: 'hikari' as Platform
      }));
      setHikariGames(hikariGamesWithPlatform);
    } catch (error) {
      console.error("Failed to fetch Hikari game list:", error);
      setError(t("errors.fetch_games_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [isHikariLoggedIn, t, setHikariGames, setIsLoading, setError]);

  const refreshDLsiteGames = useCallback(async (force: boolean = false) => {
    if (!isDLsiteLoggedIn) return;

    setIsLoading(true);
    setError(null);
    try {
      const games = force
        ? await call<[boolean], Game[]>("get_dlsite_game_list", true)
        : await call<[], Game[]>("get_dlsite_game_list");
      // Add platform info to games
      const dlsiteGamesWithPlatform = games.map(game => ({
        ...game,
        platform: 'dlsite' as Platform
      }));
      setDLsiteGames(dlsiteGamesWithPlatform);
    } catch (error) {
      console.error("Failed to fetch DLsite game list:", error);
      setError(t("errors.fetch_games_failed"));
    } finally {
      setIsLoading(false);
    }
  }, [isDLsiteLoggedIn, t, setDLsiteGames, setIsLoading, setError]);

  const refreshAllGames = useCallback(async () => {
    await Promise.all([
      isHikariLoggedIn ? refreshHikariGames(true) : Promise.resolve(),
      isDLsiteLoggedIn ? refreshDLsiteGames(true) : Promise.resolve()
    ]);
  }, [isHikariLoggedIn, isDLsiteLoggedIn, refreshHikariGames, refreshDLsiteGames]);

  const handleDownloadGame = useCallback(async (gameId: string, platform: Platform) => {
    setError(null);

    try {
      // Use platform-specific download function
      const downloadFunction = platform === 'hikari' ? 'download_hikari_game' : 'download_dlsite_game';
      const downloadResult = await call<[string], { success: boolean; message: string }>(
        downloadFunction,
        gameId
      );

      if (downloadResult.success) {
        console.log(`Download started successfully from ${platform}`);

        // Update the appropriate game list to show downloading state
        if (platform === 'hikari') {
          setHikariGames(prev => prev.map(game =>
            game.id === gameId
              ? { ...game, downloading: true, progress: 0 }
              : game
          ));
        } else {
          setDLsiteGames(prev => prev.map(game =>
            game.id === gameId
              ? { ...game, downloading: true, progress: 0 }
              : game
          ));
        }

        // Note: Game will be automatically added to Steam after download completion
        // This is handled by the download completion callback in the backend
        setActivePage("downloads");
      } else {
        console.error("Download failed:", downloadResult.message);
        setError(`${t("errors.download_failed")}: ${downloadResult.message}`);
      }
    } catch (error) {
      console.error("Download failed:", error);
      setError(t("errors.download_failed"));
    }
  }, [t, setHikariGames, setDLsiteGames, setError]);

  const handlePlayGame = useCallback(async (gameId: string) => {
    try {
      await call<[string], { success: boolean }>("launch_game", gameId);
    } catch (error) {
      console.error("Failed to launch game:", error);
    }
  }, []);

  const handleDeleteGame = useCallback(async (gameId: string) => {
    try {
      await call<[string], { success: boolean }>("delete_game", gameId);
      await refreshAllGames();
    } catch (error) {
      console.error("Failed to delete game:", error);
    }
  }, [refreshAllGames]);

  const handleHikariLoginSuccess = () => {
    setIsHikariLoggedIn(true);
    refreshHikariGames();
  };

  const handleHikariLogout = () => {
    setIsHikariLoggedIn(false);
    setHikariGames([]);
  };

  const handleDLsiteLoginSuccess = () => {
    setIsDLsiteLoggedIn(true);
    refreshDLsiteGames();
  };

  const handleDLsiteLogout = () => {
    setIsDLsiteLoggedIn(false);
    setDLsiteGames([]);
  };

  // Memoized computed values
  const gameStats = useMemo(() => ({
    total: allGames.length,
    hikari: hikariGames.length,
    dlsite: dlsiteGames.length,
    installed: allGames.filter(g => g.installed).length
  }), [allGames, hikariGames, dlsiteGames]);

  const layoutStyles = useMemo(() => ({
    container: {
      display: "flex",
      gap: "16px",
      alignItems: "flex-start",
      width: "100%",
    },
    sidebar: {
      minWidth: "220px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
    },
    navButton: (active: boolean) => ({
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "10px 12px",
      borderRadius: "8px",
      cursor: "pointer",
      background: active ? "rgba(0, 212, 255, 0.12)" : "rgba(255, 255, 255, 0.04)",
      border: active ? "1px solid rgba(0, 212, 255, 0.5)" : "1px solid transparent",
      color: "#fff",
      fontWeight: active ? "bold" : "normal",
      transition: "background 0.2s ease, border 0.2s ease",
    }),
    content: {
      flex: 1,
      display: "flex",
      flexDirection: "column" as const,
      gap: "12px",
      minWidth: 0,
    },
  }), []);

  const navItems = useMemo(() => ([
    { key: "overview" as PageKey, label: t("sections.overview"), icon: <FaBook /> },
    { key: "library" as PageKey, label: t("sections.games"), icon: <FaGamepad /> },
    { key: "downloads" as PageKey, label: t("sections.downloads"), icon: <FaDownload /> },
    { key: "steam" as PageKey, label: t("steam.title"), icon: <FaSteam /> },
    { key: "settings" as PageKey, label: t("sections.settings"), icon: <FaCog /> },
  ]), [t]);

  const renderPageContent = () => {
    switch (activePage) {
      case "overview":
        return (
          <>
            <PanelSection title={t("platforms.status")}>
              {isLoading && (
                <PanelSectionRow>
                  <Field label={t("status.loading")} description="" icon={<Spinner />} />
                </PanelSectionRow>
              )}
              <PanelSectionRow>
                <Field
                  label={t("platforms.hikari.name")}
                  description={isHikariLoggedIn ? t("status.online") : t("status.offline")}
                  icon={<span style={commonStyles.statusDot(isHikariLoggedIn)} />}
                />
              </PanelSectionRow>
              <PanelSectionRow>
                <Field
                  label={t("platforms.dlsite.name")}
                  description={isDLsiteLoggedIn ? t("status.online") : t("status.offline")}
                  icon={<span style={commonStyles.statusDot(isDLsiteLoggedIn)} />}
                />
              </PanelSectionRow>
              {recentGame && (
                <PanelSectionRow>
                  <div>
                    <div style={commonStyles.bodyText}>{t("status.recent_game")}:</div>
                    <div style={commonStyles.subtitleText}>{recentGame.name}</div>
                  </div>
                </PanelSectionRow>
              )}
            </PanelSection>

            <PanelSection title={t("sections.account")}>
              <HikariLogin
                isLoggedIn={isHikariLoggedIn}
                cdnServers={cdnServers}
                selectedCdn={selectedCdn}
                onLoginSuccess={handleHikariLoginSuccess}
                onLogout={handleHikariLogout}
                t={t}
              />
              <DLsiteLogin
                isLoggedIn={isDLsiteLoggedIn}
                onLoginSuccess={handleDLsiteLoginSuccess}
                onLogout={handleDLsiteLogout}
                t={t}
              />
            </PanelSection>

            <PanelSection title={t("sections.games")}>
              <PanelSectionRow>
                <div style={commonStyles.flexColumn}>
                  <div style={commonStyles.bodyText}>
                    {gameStats.total} {t("library.games_available")}{gameStats.total > 0 ? ` (${gameStats.hikari} ${t("platforms.hikari.name")}, ${gameStats.dlsite} ${t("platforms.dlsite.name")})` : ""}
                  </div>
                </div>
              </PanelSectionRow>
            </PanelSection>

            <PanelSection title={t("quick_actions")}>
              {recentGame && (
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => handlePlayGame(recentGame.id)}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FaPlay />
                      {t("buttons.play")} {recentGame.name}
                    </div>
                  </ButtonItem>
                </PanelSectionRow>
              )}
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => setActivePage("library")}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaGamepad />
                    {t("sections.games")}
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => setActivePage("downloads")}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaDownload />
                    {t("sections.downloads")}
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => setActivePage("steam")}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSteam />
                    {t("steam.title")}
                  </div>
                </ButtonItem>
              </PanelSectionRow>
              <PanelSectionRow>
                <ButtonItem layout="below" onClick={() => setActivePage("settings")}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaCog />
                    {t("sections.settings")}
                  </div>
                </ButtonItem>
              </PanelSectionRow>
            </PanelSection>
          </>
        );
      case "library":
        return (
          <PanelSection title={t("sections.games")}>
            <PanelSectionRow>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" }}>
                <ButtonItem
                  layout="inline"
                  onClick={refreshAllGames}
                  disabled={isLoading}
                >
                  {isLoading ? t("status.loading") : t("buttons.refresh")}
                </ButtonItem>
                <div style={commonStyles.bodyText}>
                  {gameStats.total} {t("library.games_available")}
                </div>
              </div>
            </PanelSectionRow>
            {allGames.length === 0 ? (
              <PanelSectionRow>
                <div style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>
                  {!isHikariLoggedIn && !isDLsiteLoggedIn
                    ? t("library.login_to_see_games")
                    : t("library.no_games_found")}
                </div>
              </PanelSectionRow>
            ) : (
              <div style={commonStyles.scrollableList}>
                <GameList
                  games={allGames}
                  onDownload={handleDownloadGame}
                  onPlay={handlePlayGame}
                  onDelete={handleDeleteGame}
                  t={t}
                />
              </div>
            )}
          </PanelSection>
        );
      case "downloads":
        return (
          <>
            <PanelSection title={t("download.active_downloads")}>
              <DownloadManager t={t} />
            </PanelSection>
            <PanelSection title={t("download.tips")}>
              <PanelSectionRow>
                <div style={commonStyles.tipBox}>
                  <div style={commonStyles.subtitleText}>💡 {t("download.tip_title")}</div>
                  <ul style={{ ...commonStyles.bodyText, paddingLeft: "16px", margin: 0 }}>
                    <li>{t("download.tip_resume")}</li>
                    <li>{t("download.tip_background")}</li>
                    <li>{t("download.tip_steam_auto")}</li>
                  </ul>
                </div>
              </PanelSectionRow>
            </PanelSection>
          </>
        );
      case "steam":
        return (
          <>
            {recentGame ? (
              <>
                <PanelSection title={`${t("steam.game_config")}: ${recentGame.name}`}>
                  <SteamIntegration
                    gameId={recentGame.id}
                    gameName={recentGame.name}
                    t={t}
                  />
                </PanelSection>
                <PanelSection title={t("steam.help")}>
                  <PanelSectionRow>
                    <div style={commonStyles.helpBox}>
                      <div style={commonStyles.subtitleText}>🎮 {t("steam.help_title")}</div>
                      <ul style={{ ...commonStyles.bodyText, paddingLeft: "16px", margin: 0 }}>
                        <li>{t("steam.help_auto_add")}</li>
                        <li>{t("steam.help_wine_config")}</li>
                        <li>{t("steam.help_proton_versions")}</li>
                      </ul>
                    </div>
                  </PanelSectionRow>
                </PanelSection>
              </>
            ) : (
              <PanelSection title={t("steam.no_game_selected")}>
                <PanelSectionRow>
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ fontSize: "1.1em", marginBottom: "8px" }}>
                      {t("steam.select_game_first")}
                    </div>
                    <div style={{ fontSize: "0.9em", opacity: 0.7 }}>
                      {t("steam.download_game_instruction")}
                    </div>
                  </div>
                </PanelSectionRow>
              </PanelSection>
            )}
          </>
        );
      case "settings":
        return (
          <>
            <PanelSection title={t("settings.preferences")}>
              <Settings
                onLanguageChange={handleLanguagePreferenceChange}
                onProtonVersionChange={handleProtonPreferenceChange}
                onAutoUpdateChange={handleAutoUpdateChange}
                onDownloadPathChange={handleDownloadPathChange}
                currentLanguage={preferences.language}
                currentProtonVersion={preferences.defaultProtonVersion}
                autoUpdate={preferences.autoUpdate}
                downloadPath={preferences.downloadPath}
                backendStatus={backendStatus}
                t={t}
              />
            </PanelSection>
            <PanelSection title={t("settings.about")}>
              <PanelSectionRow>
                <div style={commonStyles.aboutBox}>
                  <div style={commonStyles.titleText}>{t("plugin.name")}</div>
                  <div style={commonStyles.bodyText}>{t("plugin.description")}</div>
                  <div style={commonStyles.captionText}>
                    {t("settings.version")}: 1.0.0
                  </div>
                </div>
              </PanelSectionRow>
            </PanelSection>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {error && (
        <PanelSection>
          <PanelSectionRow>
            <div style={commonStyles.errorBox}>
              <div style={{ color: "#f44336", fontWeight: "bold", marginBottom: "4px" }}>
                ⚠️ {t("errors.error_occurred")}
              </div>
              <div style={commonStyles.bodyText}>{error}</div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#f44336",
                  ...commonStyles.captionText,
                  cursor: "pointer",
                  marginTop: "4px",
                  textDecoration: "underline",
                }}
                onClick={() => setError(null)}
              >
                {t("buttons.dismiss")}
              </button>
            </div>
          </PanelSectionRow>
        </PanelSection>
      )}

      <div style={layoutStyles.container}>
        <div style={layoutStyles.sidebar}>
          <PanelSection title={t("plugin.name")}>
            {navItems.map((item) => (
              <PanelSectionRow key={item.key}>
                <Focusable
                  style={layoutStyles.navButton(activePage === item.key)}
                  onClick={() => setActivePage(item.key)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </Focusable>
              </PanelSectionRow>
            ))}
          </PanelSection>
        </div>
        <div style={layoutStyles.content}>{renderPageContent()}</div>
      </div>
    </>
  );
};

export default definePlugin(() => {
  return {
    name: "Visual Novel Manager",
    titleView: <div className={staticClasses.Title}>Visual Novel Manager</div>,
    content: <Content />,
    icon: <FaBook />,
    onDismount() {
      console.log("Visual Novel Manager unmounted");
    },
  };
});
