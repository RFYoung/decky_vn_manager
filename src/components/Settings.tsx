import { FC, memo, useMemo } from "react";
import {
  PanelSectionRow,
  DropdownItem,
  ToggleField,
  TextField,
  Field,
} from "@decky/ui";
import { commonStyles } from "../utils/styles";
import { Language } from "../locales";

interface SettingsProps {
  onLanguageChange: (lang: Language) => void;
  onProtonVersionChange: (version: string) => void;
  onAutoUpdateChange: (value: boolean) => void;
  onDownloadPathChange: (path: string) => void;
  currentLanguage: Language;
  currentProtonVersion: string;
  autoUpdate: boolean;
  downloadPath: string;
  backendStatus?: {
    running: boolean;
    uptimeSeconds?: number;
    startedAt?: number;
  } | null;
  t: (key: string) => string;
}

export const Settings: FC<SettingsProps> = memo(({
  onLanguageChange,
  onProtonVersionChange,
  onAutoUpdateChange,
  onDownloadPathChange,
  currentLanguage,
  currentProtonVersion,
  autoUpdate,
  downloadPath,
  backendStatus,
  t,
}) => {
  const languageOptions = useMemo(() => [
    { label: t("settings.languageOptions.en"), value: "en" as Language },
    { label: t("settings.languageOptions.zh_CN"), value: "zh_CN" as Language },
    { label: t("settings.languageOptions.zh_TW"), value: "zh_TW" as Language },
    { label: t("settings.languageOptions.ja"), value: "ja" as Language },
  ], [t]);

  const protonOptions = useMemo(() => [
    { label: t("settings.protonOptions.experimental"), value: "proton_experimental" },
    { label: t("settings.protonOptions.proton9"), value: "proton_90" },
    { label: t("settings.protonOptions.proton8"), value: "proton_80" },
    { label: t("settings.protonOptions.geLatest"), value: "ge-latest" },
  ], [t]);

  const backendRunning = backendStatus?.running ?? false;
  const uptimeSeconds = backendStatus?.uptimeSeconds ?? 0;

  const formatUptime = (seconds: number): string => {
    if (!seconds || seconds <= 0) {
      return t("settings.backend.noUptime");
    }

    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${Math.floor(seconds)}s`;
  };

  const backendDescription = backendStatus
    ? backendRunning
      ? `${t("settings.backend.running")} • ${formatUptime(uptimeSeconds)}`
      : t("settings.backend.stopped")
    : t("settings.backend.unknown");

  return (
    <>
      <PanelSectionRow>
        <Field
          label={t("settings.backendStatus")}
          description={backendDescription}
          icon={<span style={commonStyles.statusDot(backendRunning)} />}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label={t("settings.language")}
          menuLabel={t("settings.language")}
          rgOptions={languageOptions.map((opt) => ({
            label: opt.label,
            data: opt.value,
          }))}
          selectedOption={currentLanguage}
          onChange={(selected) => onLanguageChange(selected.data as Language)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <DropdownItem
          label={t("settings.protonVersion")}
          menuLabel={t("settings.protonVersion")}
          rgOptions={protonOptions.map((opt) => ({
            label: opt.label,
            data: opt.value,
          }))}
          selectedOption={currentProtonVersion}
          onChange={(selected) => onProtonVersionChange(selected.data)}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label={t("settings.autoUpdate")}
          checked={autoUpdate}
          onChange={onAutoUpdateChange}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <TextField
          label={t("settings.downloadPath")}
          value={downloadPath}
          onChange={(e) => onDownloadPathChange(e.target.value)}
        />
      </PanelSectionRow>
    </>
  );
});
