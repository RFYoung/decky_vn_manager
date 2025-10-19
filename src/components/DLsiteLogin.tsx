import { FC, useState } from "react";
import {
  ButtonItem,
  PanelSectionRow,
  TextField,
  DialogBody,
  DialogButton,
  DialogFooter,
  DialogHeader,
  ModalRoot,
  Focusable,
  showModal,
} from "@decky/ui";
import { FaGlobe, FaSignInAlt, FaSignOutAlt } from "react-icons/fa";
import { call } from "@decky/api";

interface DLsiteLoginProps {
  isLoggedIn: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export const DLsiteLogin: FC<DLsiteLoginProps> = ({
  isLoggedIn,
  onLoginSuccess,
  onLogout,
  t,
}) => {
  const statusLabel = isLoggedIn ? t("status.online") : t("status.offline");
  const accentColor = isLoggedIn ? "#ff6b6b" : "#666";
  const description = t("platforms.dlsite.description");

  const showLoginModal = () => {
    showModal(<DLsiteLoginModal onSuccess={onLoginSuccess} t={t} />);
  };

  const handleLogout = async () => {
    try {
      await call<[], { success: boolean }>("dlsite_logout");
    } catch (error) {
      console.error("DLsite logout failed:", error);
    } finally {
      onLogout();
    }
  };

  return (
    <PanelSectionRow>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaGlobe style={{ color: accentColor }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontSize: "0.9em", fontWeight: "bold" }}>{t("platforms.dlsite.name")}</div>
            <div style={{ fontSize: "0.7em", opacity: 0.7 }}>{statusLabel}</div>
            <div style={{ fontSize: "0.7em", opacity: 0.6 }}>{description}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {!isLoggedIn ? (
            <ButtonItem layout="inline" onClick={showLoginModal}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaSignInAlt />
                {t("buttons.login")}
              </div>
            </ButtonItem>
          ) : (
            <ButtonItem layout="inline" onClick={handleLogout}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaSignOutAlt />
                {t("buttons.logout")}
              </div>
            </ButtonItem>
          )}
        </div>
      </div>
    </PanelSectionRow>
  );
};

const DLsiteLoginModal: FC<{
  onSuccess: () => void;
  t: (key: string) => string;
}> = ({ onSuccess, t }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setError(t("errors.missingCredentials"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await call<[string, string], { success: boolean; message: string }>(
        "dlsite_login",
        username,
        password
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message || t("errors.loginFailed"));
      }
    } catch (error) {
      console.error("DLsite login failed:", error);
      setError(t("errors.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalRoot onCancel={() => {}}>
      <DialogHeader>{t("modals.dlsite_login.title")}</DialogHeader>
      <DialogBody>
        <Focusable style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextField
            label={t("fields.username")}
            value={username}
            onChange={(e) => setUsername(e?.target.value || "")}
          />
          <TextField
            label={t("fields.password")}
            bIsPassword={true}
            value={password}
            onChange={(e) => setPassword(e?.target.value || "")}
          />

          {error && (
            <div style={{ color: "#ff6b6b", fontSize: "0.8em" }}>
              {error}
            </div>
          )}

          <div style={{ fontSize: "0.7em", opacity: 0.7 }}>
            {t("dlsite.login_note")}
          </div>
        </Focusable>
      </DialogBody>
      <DialogFooter>
        <DialogButton onClick={handleLogin} disabled={isLoading}>
          {isLoading ? t("status.loggingIn") : t("buttons.login")}
        </DialogButton>
      </DialogFooter>
    </ModalRoot>
  );
};
