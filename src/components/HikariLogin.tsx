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
import { FaGamepad, FaSignInAlt, FaServer, FaSignOutAlt } from "react-icons/fa";
import { call } from "@decky/api";

interface HikariCDNServer {
  ip: string;
  region: string;
  ping?: number;
}

interface HikariLoginProps {
  isLoggedIn: boolean;
  cdnServers: HikariCDNServer[];
  selectedCdn: string | null;
  onLoginSuccess: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export const HikariLogin: FC<HikariLoginProps> = ({
  isLoggedIn,
  cdnServers,
  selectedCdn,
  onLoginSuccess,
  onLogout,
  t,
}) => {
  const platformName = t("platforms.hikari.name");
  const cdnLabel = t("platforms.hikari.cdnLabel");
  const statusLabel = isLoggedIn ? t("status.online") : t("status.offline");
  const accentColor = isLoggedIn ? "#00d4ff" : "#666";
  const description = t("platforms.hikari.description");
  const cdnInfo = isLoggedIn && selectedCdn ? `${cdnLabel}: ${selectedCdn}` : "";

  const showLoginModal = () => {
    showModal(
      <LoginModal
        onSuccess={onLoginSuccess}
        t={t}
      />
    );
  };

  const showCDNModal = () => {
    showModal(
      <CDNSelectionModal
        cdnServers={cdnServers}
        selectedCdn={selectedCdn}
        t={t}
      />
    );
  };

  const handleLogout = async () => {
    try {
      await call<[], { success: boolean }>("hikari_logout");
      onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <PanelSectionRow>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FaGamepad style={{ color: accentColor }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontSize: "0.9em", fontWeight: "bold" }}>{platformName}</div>
            <div style={{ fontSize: "0.7em", opacity: 0.7 }}>
              {statusLabel}
              {cdnInfo ? ` • ${cdnInfo}` : ""}
            </div>
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
            <>
              {cdnServers.length > 0 && (
                <ButtonItem layout="inline" onClick={showCDNModal}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FaServer />
                    {t("buttons.switchServer")}
                  </div>
                </ButtonItem>
              )}
              <ButtonItem layout="inline" onClick={handleLogout}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <FaSignOutAlt />
                  {t("buttons.logout")}
                </div>
              </ButtonItem>
            </>
          )}
        </div>
      </div>
    </PanelSectionRow>
  );
};

const LoginModal: FC<{
  onSuccess: () => void;
  t: (key: string) => string;
}> = ({ onSuccess, t }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t("errors.missingCredentials"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await call<[string, string], { success: boolean; message: string }>(
        "hikari_login",
        email,
        password
      );

      if (result.success) {
        onSuccess();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(t("errors.loginFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalRoot>
      <DialogHeader>{t("modals.login.title")}</DialogHeader>
      <DialogBody>
        <Focusable style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextField
            label={t("fields.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label={t("fields.password")}
            bIsPassword={true}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div style={{ color: "#ff6b6b", fontSize: "0.9em" }}>
              {error}
            </div>
          )}
        </Focusable>
      </DialogBody>
      <DialogFooter>
        <DialogButton
          onClick={handleLogin}
          disabled={isLoading || !email || !password}
        >
          {isLoading ? t("status.loggingIn") : t("buttons.login")}
        </DialogButton>
      </DialogFooter>
    </ModalRoot>
  );
};

const CDNSelectionModal: FC<{
  cdnServers: HikariCDNServer[];
  selectedCdn: string | null;
  t: (key: string) => string;
}> = ({ cdnServers, selectedCdn, t }) => {
  const [selectedServer, setSelectedServer] = useState(selectedCdn || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleServerSwitch = async () => {
    if (selectedServer === selectedCdn || !selectedServer) return;

    setIsLoading(true);

    try {
      await call<[string], { success: boolean }>("select_hikari_cdn_server", selectedServer);
    } catch (error) {
      console.error("CDN server switch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalRoot>
      <DialogHeader>{t("modals.serverSelection.title")}</DialogHeader>
      <DialogBody>
        <Focusable style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {cdnServers.map(server => (
            <div
              key={server.ip}
              onClick={() => setSelectedServer(server.ip)}
              style={{
                padding: "12px",
                border: selectedServer === server.ip ? "2px solid #00d4ff" : "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{server.ip}</div>
                  <div style={{ fontSize: "0.8em", opacity: 0.7 }}>{server.region}</div>
                </div>
                {server.ping && (
                  <div style={{
                    color: server.ping < 100 ? '#4CAF50' : server.ping < 200 ? '#ff9800' : '#f44336',
                    fontSize: "0.8em",
                    fontWeight: "bold"
                  }}>
                    {server.ping}ms
                  </div>
                )}
              </div>
            </div>
          ))}
        </Focusable>
      </DialogBody>
      <DialogFooter>
        <DialogButton
          onClick={handleServerSwitch}
          disabled={isLoading || selectedServer === selectedCdn}
        >
          {isLoading ? t("status.switching") : t("buttons.switchServer")}
        </DialogButton>
      </DialogFooter>
    </ModalRoot>
  );
};
