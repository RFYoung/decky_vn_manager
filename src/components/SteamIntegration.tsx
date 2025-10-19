import { FC, useState, useEffect } from "react";
import {
  ButtonItem,
  PanelSectionRow,
  DropdownItem,
  ToggleField,
  DialogBody,
  DialogButton,
  DialogFooter,
  DialogHeader,
  ModalRoot,
  Focusable,
  showModal,
  Field,
} from "@decky/ui";
import { FaSteam, FaCog, FaWineGlass, FaGlobe, FaPlus } from "react-icons/fa";
import { call } from "@decky/api";

interface ProtonVersion {
  id: string;
  name: string;
  version: string;
  type: 'builtin' | 'custom' | 'ge';
  path?: string;
  description?: string;
}

interface WineComponentDefinition {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: 'dll' | 'font' | 'runtime' | 'codec';
}

interface SteamGameInfo {
  app_id: string;
  compatibility_tool: string;
  prefix_path: string;
  components: string[];
  locale: string;
}

interface SteamIntegrationProps {
  gameId?: string;
  gameName?: string;
  onGameAdded?: (success: boolean, appId?: string) => void;
  t: (key: string) => string;
}

const WINE_COMPONENTS: WineComponentDefinition[] = [
  { id: "wmp9", nameKey: "steam.wineComponents.wmp9.name", descriptionKey: "steam.wineComponents.wmp9.description", category: "codec" },
  { id: "wmp10", nameKey: "steam.wineComponents.wmp10.name", descriptionKey: "steam.wineComponents.wmp10.description", category: "codec" },
  { id: "wmp11", nameKey: "steam.wineComponents.wmp11.name", descriptionKey: "steam.wineComponents.wmp11.description", category: "codec" },
  { id: "wmv9vcm", nameKey: "steam.wineComponents.wmv9vcm.name", descriptionKey: "steam.wineComponents.wmv9vcm.description", category: "codec" },
  { id: "vcrun2019", nameKey: "steam.wineComponents.vcrun2019.name", descriptionKey: "steam.wineComponents.vcrun2019.description", category: "runtime" },
  { id: "vcrun2022", nameKey: "steam.wineComponents.vcrun2022.name", descriptionKey: "steam.wineComponents.vcrun2022.description", category: "runtime" },
  { id: "cjkfonts", nameKey: "steam.wineComponents.cjkfonts.name", descriptionKey: "steam.wineComponents.cjkfonts.description", category: "font" },
  { id: "fakejapanese", nameKey: "steam.wineComponents.fakejapanese.name", descriptionKey: "steam.wineComponents.fakejapanese.description", category: "font" },
];

const LOCALE_OPTIONS = [
  { value: "japanese", labelKey: "steam.localeLabels.japanese" },
  { value: "chinese", labelKey: "steam.localeLabels.chinese" },
  { value: "korean", labelKey: "steam.localeLabels.korean" },
  { value: "english", labelKey: "steam.localeLabels.english" },
];

export const SteamIntegration: FC<SteamIntegrationProps> = ({
  gameId,
  onGameAdded,
  t,
}) => {
  const [protonVersions, setProtonVersions] = useState<ProtonVersion[]>([]);
  const [selectedProton, setSelectedProton] = useState<string>("proton_experimental");
  const [steamGameInfo, setSteamGameInfo] = useState<SteamGameInfo | null>(null);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string>("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtonVersions();
    if (gameId) {
      loadSteamGameInfo();
    }
  }, [gameId]);

  const loadProtonVersions = async () => {
    try {
      const versions = await call<[], ProtonVersion[]>("get_proton_versions");
      setProtonVersions(versions || []);
    } catch (error) {
      console.error("Failed to load Proton versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSteamGameInfo = async () => {
    if (!gameId) return;

    try {
      const info = await call<[string], SteamGameInfo | null>("get_steam_game_info", gameId);
      setSteamGameInfo(info);
      if (info) {
        setSelectedProton(info.compatibility_tool);
        setSelectedComponents(info.components);
        setSelectedLocale(info.locale);
      }
    } catch (error) {
      console.error("Failed to load Steam game info:", error);
    }
  };

  const addGameToSteam = async () => {
    if (!gameId) return;

    setLoading(true);
    try {
      const result = await call<[string, string], {success: boolean, app_id?: string, message: string}>(
        "add_game_to_steam",
        gameId,
        selectedProton
      );

      if (result.success) {
        await loadSteamGameInfo();
        onGameAdded?.(true, result.app_id);
      } else {
        console.error("Failed to add game to Steam:", result.message);
        onGameAdded?.(false);
      }
    } catch (error) {
      console.error("Error adding game to Steam:", error);
      onGameAdded?.(false);
    } finally {
      setLoading(false);
    }
  };

  const removeGameFromSteam = async () => {
    if (!steamGameInfo) return;

    setLoading(true);
    try {
      const result = await call<[string], {success: boolean, message: string}>(
        "remove_game_from_steam",
        steamGameInfo.app_id
      );

      if (result.success) {
        setSteamGameInfo(null);
      } else {
        console.error("Failed to remove game from Steam:", result.message);
      }
    } catch (error) {
      console.error("Error removing game from Steam:", error);
    } finally {
      setLoading(false);
    }
  };

  const configureWineComponents = async () => {
    if (!steamGameInfo) return;

    setIsConfiguring(true);
    try {
      const result = await call<[string, string[], string | undefined], {success: boolean, message: string, results: any[]}>(
        "configure_wine_components",
        steamGameInfo.app_id,
        selectedComponents,
        selectedLocale || undefined
      );

      if (result.success) {
        await loadSteamGameInfo();
        console.log("Wine components configured successfully");
      } else {
        console.error("Failed to configure Wine components:", result.message);
      }
    } catch (error) {
      console.error("Error configuring Wine components:", error);
    } finally {
      setIsConfiguring(false);
    }
  };

  const launchGame = async (viaSteam: boolean = true) => {
    if (!gameId) return;

    try {
      const result = await call<[string, boolean], {success: boolean, message: string}>(
        "launch_game",
        gameId,
        viaSteam
      );

      if (!result.success) {
        console.error("Failed to launch game:", result.message);
      }
    } catch (error) {
      console.error("Error launching game:", error);
    }
  };

  const showComponentSelector = () => {
    showModal(
      <ModalRoot onCancel={() => {}}>
        <DialogHeader>{t("steam.configure_wine_title")}</DialogHeader>
        <DialogBody>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Field label={t("steam.locale_setting")}>
              <DropdownItem
                rgOptions={LOCALE_OPTIONS.map(opt => ({
                  data: opt.value,
                  label: t(opt.labelKey),
                }))}
                selectedOption={selectedLocale}
                onChange={(data) => setSelectedLocale(data.data)}
                disabled={isConfiguring}
              />
            </Field>

            <Field label={t("steam.wine_components")}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {WINE_COMPONENTS.map(component => (
                  <ToggleField
                    key={component.id}
                    label={t(component.nameKey)}
                    description={t(component.descriptionKey)}
                    checked={selectedComponents.includes(component.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedComponents(prev => [...prev, component.id]);
                      } else {
                        setSelectedComponents(prev => prev.filter(id => id !== component.id));
                      }
                    }}
                    disabled={isConfiguring}
                  />
                ))}
              </div>
            </Field>
          </Focusable>
        </DialogBody>
        <DialogFooter>
          <DialogButton onClick={configureWineComponents} disabled={isConfiguring}>
            {isConfiguring ? t("steam.configuring") : t("steam.apply_config")}
          </DialogButton>
        </DialogFooter>
      </ModalRoot>
    );
  };

  if (loading) {
    return (
      <PanelSectionRow>
        <div>{t("steam.loading")}</div>
      </PanelSectionRow>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Steam Integration Status */}
      <PanelSectionRow>
        <Field label={t("steam.integration_status")}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FaSteam style={{ color: steamGameInfo ? "#1b2838" : "#666" }} />
            <span>
              {steamGameInfo ?
                `${t("steam.added_to_steam")} (ID: ${steamGameInfo.app_id})` :
                t("steam.not_in_steam")
              }
            </span>
          </div>
        </Field>
      </PanelSectionRow>

      {/* Proton Version Selection */}
      {!steamGameInfo && (
        <PanelSectionRow>
          <Field label={t("steam.compatibility_tool")}>
            <DropdownItem
              rgOptions={protonVersions.map(version => ({
                data: version.id,
                label: `${version.name} (${version.version})`,
              }))}
              selectedOption={selectedProton}
              onChange={(data) => setSelectedProton(data.data)}
            />
          </Field>
        </PanelSectionRow>
      )}

      {/* Action Buttons */}
      <PanelSectionRow>
        {!steamGameInfo ? (
          <ButtonItem
            layout="below"
            onClick={addGameToSteam}
            disabled={loading || !gameId}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPlus />
              {t("steam.add_to_steam")}
            </div>
          </ButtonItem>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <ButtonItem
              layout="below"
              onClick={() => launchGame(true)}
              disabled={!gameId}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaSteam />
                {t("steam.launch_via_steam")}
              </div>
            </ButtonItem>

            <ButtonItem
              layout="below"
              onClick={showComponentSelector}
              disabled={isConfiguring}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaCog />
                {t("steam.configure_wine")}
              </div>
            </ButtonItem>

            <ButtonItem
              layout="below"
              onClick={removeGameFromSteam}
              disabled={loading}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FaWineGlass />
                {t("steam.remove_from_steam")}
              </div>
            </ButtonItem>
          </div>
        )}
      </PanelSectionRow>

      {/* Current Configuration Display */}
      {steamGameInfo && (
        <PanelSectionRow>
          <Field label={t("steam.current_config")}>
            <div style={{ fontSize: "12px", color: "#b8b6b4" }}>
              <div>{t("steam.compatibility")}: {steamGameInfo.compatibility_tool}</div>
              {steamGameInfo.locale && (
                <div>{t("steam.locale")}: {steamGameInfo.locale}</div>
              )}
              {steamGameInfo.components.length > 0 && (
                <div>{t("steam.components")}: {steamGameInfo.components.join(", ")}</div>
              )}
            </div>
          </Field>
        </PanelSectionRow>
      )}

      {/* Direct Launch Fallback */}
      {steamGameInfo && (
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => launchGame(false)}
            disabled={!gameId}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaGlobe />
              {t("steam.launch_direct")}
            </div>
          </ButtonItem>
        </PanelSectionRow>
      )}
    </div>
  );
};
