var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && SP_REACT.createContext(DefaultContext);

var __assign = window && window.__assign || function () {
  __assign = Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __rest = window && window.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function Tree2Element(tree) {
  return tree && tree.map(function (node, i) {
    return SP_REACT.createElement(node.tag, __assign({
      key: i
    }, node.attr), Tree2Element(node.child));
  });
}
function GenIcon(data) {
  // eslint-disable-next-line react/display-name
  return function (props) {
    return SP_REACT.createElement(IconBase, __assign({
      attr: __assign({}, data.attr)
    }, props), Tree2Element(data.child));
  };
}
function IconBase(props) {
  var elem = function (conf) {
    var attr = props.attr,
      size = props.size,
      title = props.title,
      svgProps = __rest(props, ["attr", "size", "title"]);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return SP_REACT.createElement("svg", __assign({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: __assign(__assign({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? SP_REACT.createElement(IconContext.Consumer, null, function (conf) {
    return elem(conf);
  }) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaSteam (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 496 512"},"child":[{"tag":"path","attr":{"d":"M496 256c0 137-111.2 248-248.4 248-113.8 0-209.6-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.9-32.4 70.2-73.5l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.9-5.4-26.7-5.2-38.9-.6l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.8 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"}}]})(props);
}function FaBook (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"}}]})(props);
}function FaCog (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"}}]})(props);
}function FaDownload (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"}}]})(props);
}function FaGamepad (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 640 512"},"child":[{"tag":"path","attr":{"d":"M480.07 96H160a160 160 0 1 0 114.24 272h91.52A160 160 0 1 0 480.07 96zM248 268a12 12 0 0 1-12 12h-52v52a12 12 0 0 1-12 12h-24a12 12 0 0 1-12-12v-52H84a12 12 0 0 1-12-12v-24a12 12 0 0 1 12-12h52v-52a12 12 0 0 1 12-12h24a12 12 0 0 1 12 12v52h52a12 12 0 0 1 12 12zm216 76a40 40 0 1 1 40-40 40 40 0 0 1-40 40zm64-96a40 40 0 1 1 40-40 40 40 0 0 1-40 40z"}}]})(props);
}function FaGlobe (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 496 512"},"child":[{"tag":"path","attr":{"d":"M336.5 160C322 70.7 287.8 8 248 8s-74 62.7-88.5 152h177zM152 256c0 22.2 1.2 43.5 3.3 64h185.3c2.1-20.5 3.3-41.8 3.3-64s-1.2-43.5-3.3-64H155.3c-2.1 20.5-3.3 41.8-3.3 64zm324.7-96c-28.6-67.9-86.5-120.4-158-141.6 24.4 33.8 41.2 84.7 50 141.6h108zM177.2 18.4C105.8 39.6 47.8 92.1 19.3 160h108c8.7-56.9 25.5-107.8 49.9-141.6zM487.4 192H372.7c2.1 21 3.3 42.5 3.3 64s-1.2 43-3.3 64h114.6c5.5-20.5 8.6-41.8 8.6-64s-3.1-43.5-8.5-64zM120 256c0-21.5 1.2-43 3.3-64H8.6C3.2 212.5 0 233.8 0 256s3.2 43.5 8.6 64h114.6c-2-21-3.2-42.5-3.2-64zm39.5 96c14.5 89.3 48.7 152 88.5 152s74-62.7 88.5-152h-177zm159.3 141.6c71.4-21.2 129.4-73.7 158-141.6h-108c-8.8 56.9-25.6 107.8-50 141.6zM19.3 352c28.6 67.9 86.5 120.4 158 141.6-24.4-33.8-41.2-84.7-50-141.6h-108z"}}]})(props);
}function FaPause (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M144 479H48c-26.5 0-48-21.5-48-48V79c0-26.5 21.5-48 48-48h96c26.5 0 48 21.5 48 48v352c0 26.5-21.5 48-48 48zm304-48V79c0-26.5-21.5-48-48-48h-96c-26.5 0-48 21.5-48 48v352c0 26.5 21.5 48 48 48h96c26.5 0 48-21.5 48-48z"}}]})(props);
}function FaPlay (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z"}}]})(props);
}function FaPlus (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"}}]})(props);
}function FaServer (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M480 160H32c-17.673 0-32-14.327-32-32V64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm112 248H32c-17.673 0-32-14.327-32-32v-64c0-17.673 14.327-32 32-32h448c17.673 0 32 14.327 32 32v64c0 17.673-14.327 32-32 32zm-48-88c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm-64 0c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24z"}}]})(props);
}function FaSignInAlt (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M416 448h-84c-6.6 0-12-5.4-12-12v-40c0-6.6 5.4-12 12-12h84c17.7 0 32-14.3 32-32V160c0-17.7-14.3-32-32-32h-84c-6.6 0-12-5.4-12-12V76c0-6.6 5.4-12 12-12h84c53 0 96 43 96 96v192c0 53-43 96-96 96zm-47-201L201 79c-15-15-41-4.5-41 17v96H24c-13.3 0-24 10.7-24 24v96c0 13.3 10.7 24 24 24h136v96c0 21.5 26 32 41 17l168-168c9.3-9.4 9.3-24.6 0-34z"}}]})(props);
}function FaSignOutAlt (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 512 512"},"child":[{"tag":"path","attr":{"d":"M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"}}]})(props);
}function FaStop (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48z"}}]})(props);
}function FaTrash (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 448 512"},"child":[{"tag":"path","attr":{"d":"M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"}}]})(props);
}function FaWineGlass (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 288 512"},"child":[{"tag":"path","attr":{"d":"M216 464h-40V346.81c68.47-15.89 118.05-79.91 111.4-154.16l-15.95-178.1C270.71 6.31 263.9 0 255.74 0H32.26c-8.15 0-14.97 6.31-15.7 14.55L.6 192.66C-6.05 266.91 43.53 330.93 112 346.82V464H72c-22.09 0-40 17.91-40 40 0 4.42 3.58 8 8 8h208c4.42 0 8-3.58 8-8 0-22.09-17.91-40-40-40z"}}]})(props);
}

// Decky Loader will pass this api in, it's versioned to allow for backwards compatibility.
// Prevents it from being duplicated in output.
const manifest = {"name":"visual-novel-manager","author":"YangYusen","version":"0.1.0","description":"Comprehensive visual novel management for Steam Deck with Hikari Field and DLsite support","flags":[],"publish":{"tags":["visual-novel","game-manager","hikari-field","dlsite","downloads"],"description":"Download, organize, and play visual novels from Hikari Field and DLsite platforms. Features multi-source downloads, Proton management, and multi-language support.","image":"./assets/icon.png"},"api_version":1,"license":"MIT","homepage":"https://github.com/yangyusen/visual-novel-manager","repository":{"type":"git","url":"https://github.com/yangyusen/visual-novel-manager.git"},"bugs":{"url":"https://github.com/yangyusen/visual-novel-manager/issues"},"keywords":["visual-novel","steam-deck","decky-loader","hikari-field","dlsite","game-manager"]};
const API_VERSION = 2;
if (!manifest?.name) {
    throw new Error('[@decky/api]: Failed to find plugin manifest.');
}
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
// Initialize
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
// Version 1 throws on version mismatch so we have to account for that here.
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
// TODO these could use a lot of JSDoc
const call = api.call;
const addEventListener = api.addEventListener;
const removeEventListener = api.removeEventListener;

const HikariLogin = ({ isLoggedIn, cdnServers, selectedCdn, onLoginSuccess, onLogout, t, }) => {
    const platformName = t("platforms.hikari.name");
    const cdnLabel = t("platforms.hikari.cdnLabel");
    const statusLabel = isLoggedIn ? t("status.online") : t("status.offline");
    const accentColor = isLoggedIn ? "#00d4ff" : "#666";
    const description = t("platforms.hikari.description");
    const cdnInfo = isLoggedIn && selectedCdn ? `${cdnLabel}: ${selectedCdn}` : "";
    const showLoginModal = () => {
        DFL.showModal(window.SP_REACT.createElement(LoginModal, { onSuccess: onLoginSuccess, t: t }));
    };
    const showCDNModal = () => {
        DFL.showModal(window.SP_REACT.createElement(CDNSelectionModal, { cdnServers: cdnServers, selectedCdn: selectedCdn, t: t }));
    };
    const handleLogout = async () => {
        try {
            await call("hikari_logout");
            onLogout();
        }
        catch (error) {
            console.error("Logout failed:", error);
        }
    };
    return (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
        window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" } },
            window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                window.SP_REACT.createElement(FaGamepad, { style: { color: accentColor } }),
                window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } },
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.9em", fontWeight: "bold" } }, platformName),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.7 } },
                        statusLabel,
                        cdnInfo ? ` • ${cdnInfo}` : ""),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.6 } }, description))),
            window.SP_REACT.createElement("div", { style: { display: "flex", gap: "4px" } }, !isLoggedIn ? (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: showLoginModal },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                    window.SP_REACT.createElement(FaSignInAlt, null),
                    t("buttons.login")))) : (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                cdnServers.length > 0 && (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: showCDNModal },
                    window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                        window.SP_REACT.createElement(FaServer, null),
                        t("buttons.switchServer")))),
                window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: handleLogout },
                    window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                        window.SP_REACT.createElement(FaSignOutAlt, null),
                        t("buttons.logout")))))))));
};
const LoginModal = ({ onSuccess, t }) => {
    const [email, setEmail] = SP_REACT.useState("");
    const [password, setPassword] = SP_REACT.useState("");
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    const [error, setError] = SP_REACT.useState("");
    const handleLogin = async () => {
        if (!email || !password) {
            setError(t("errors.missingCredentials"));
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const result = await call("hikari_login", email, password);
            if (result.success) {
                onSuccess();
            }
            else {
                setError(result.message);
            }
        }
        catch (error) {
            setError(t("errors.loginFailed"));
        }
        finally {
            setIsLoading(false);
        }
    };
    return (window.SP_REACT.createElement(DFL.ModalRoot, null,
        window.SP_REACT.createElement(DFL.DialogHeader, null, t("modals.login.title")),
        window.SP_REACT.createElement(DFL.DialogBody, null,
            window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "16px" } },
                window.SP_REACT.createElement(DFL.TextField, { label: t("fields.email"), value: email, onChange: (e) => setEmail(e.target.value) }),
                window.SP_REACT.createElement(DFL.TextField, { label: t("fields.password"), bIsPassword: true, value: password, onChange: (e) => setPassword(e.target.value) }),
                error && (window.SP_REACT.createElement("div", { style: { color: "#ff6b6b", fontSize: "0.9em" } }, error)))),
        window.SP_REACT.createElement(DFL.DialogFooter, null,
            window.SP_REACT.createElement(DFL.DialogButton, { onClick: handleLogin, disabled: isLoading || !email || !password }, isLoading ? t("status.loggingIn") : t("buttons.login")))));
};
const CDNSelectionModal = ({ cdnServers, selectedCdn, t }) => {
    const [selectedServer, setSelectedServer] = SP_REACT.useState(selectedCdn || "");
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    const handleServerSwitch = async () => {
        if (selectedServer === selectedCdn || !selectedServer)
            return;
        setIsLoading(true);
        try {
            await call("select_hikari_cdn_server", selectedServer);
        }
        catch (error) {
            console.error("CDN server switch failed:", error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (window.SP_REACT.createElement(DFL.ModalRoot, null,
        window.SP_REACT.createElement(DFL.DialogHeader, null, t("modals.serverSelection.title")),
        window.SP_REACT.createElement(DFL.DialogBody, null,
            window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "12px" } }, cdnServers.map(server => (window.SP_REACT.createElement("div", { key: server.ip, onClick: () => setSelectedServer(server.ip), style: {
                    padding: "12px",
                    border: selectedServer === server.ip ? "2px solid #00d4ff" : "1px solid #444",
                    borderRadius: "4px",
                    cursor: "pointer",
                } },
                window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    window.SP_REACT.createElement("div", null,
                        window.SP_REACT.createElement("div", { style: { fontWeight: "bold" } }, server.ip),
                        window.SP_REACT.createElement("div", { style: { fontSize: "0.8em", opacity: 0.7 } }, server.region)),
                    server.ping && (window.SP_REACT.createElement("div", { style: {
                            color: server.ping < 100 ? '#4CAF50' : server.ping < 200 ? '#ff9800' : '#f44336',
                            fontSize: "0.8em",
                            fontWeight: "bold"
                        } },
                        server.ping,
                        "ms")))))))),
        window.SP_REACT.createElement(DFL.DialogFooter, null,
            window.SP_REACT.createElement(DFL.DialogButton, { onClick: handleServerSwitch, disabled: isLoading || selectedServer === selectedCdn }, isLoading ? t("status.switching") : t("buttons.switchServer")))));
};

const DLsiteLogin = ({ isLoggedIn, onLoginSuccess, onLogout, t, }) => {
    const statusLabel = isLoggedIn ? t("status.online") : t("status.offline");
    const accentColor = isLoggedIn ? "#ff6b6b" : "#666";
    const description = t("platforms.dlsite.description");
    const showLoginModal = () => {
        DFL.showModal(window.SP_REACT.createElement(DLsiteLoginModal, { onSuccess: onLoginSuccess, t: t }));
    };
    const handleLogout = async () => {
        try {
            await call("dlsite_logout");
        }
        catch (error) {
            console.error("DLsite logout failed:", error);
        }
        finally {
            onLogout();
        }
    };
    return (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
        window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" } },
            window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                window.SP_REACT.createElement(FaGlobe, { style: { color: accentColor } }),
                window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } },
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.9em", fontWeight: "bold" } }, t("platforms.dlsite.name")),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.7 } }, statusLabel),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.6 } }, description))),
            window.SP_REACT.createElement("div", { style: { display: "flex", gap: "4px" } }, !isLoggedIn ? (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: showLoginModal },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                    window.SP_REACT.createElement(FaSignInAlt, null),
                    t("buttons.login")))) : (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: handleLogout },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                    window.SP_REACT.createElement(FaSignOutAlt, null),
                    t("buttons.logout"))))))));
};
const DLsiteLoginModal = ({ onSuccess, t }) => {
    const [username, setUsername] = SP_REACT.useState("");
    const [password, setPassword] = SP_REACT.useState("");
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    const [error, setError] = SP_REACT.useState("");
    const handleLogin = async () => {
        if (!username || !password) {
            setError(t("errors.missingCredentials"));
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const result = await call("dlsite_login", username, password);
            if (result.success) {
                onSuccess();
            }
            else {
                setError(result.message || t("errors.loginFailed"));
            }
        }
        catch (error) {
            console.error("DLsite login failed:", error);
            setError(t("errors.loginFailed"));
        }
        finally {
            setIsLoading(false);
        }
    };
    return (window.SP_REACT.createElement(DFL.ModalRoot, { onCancel: () => { } },
        window.SP_REACT.createElement(DFL.DialogHeader, null, t("modals.dlsite_login.title")),
        window.SP_REACT.createElement(DFL.DialogBody, null,
            window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "16px" } },
                window.SP_REACT.createElement(DFL.TextField, { label: t("fields.username"), value: username, onChange: (e) => setUsername(e?.target.value || "") }),
                window.SP_REACT.createElement(DFL.TextField, { label: t("fields.password"), bIsPassword: true, value: password, onChange: (e) => setPassword(e?.target.value || "") }),
                error && (window.SP_REACT.createElement("div", { style: { color: "#ff6b6b", fontSize: "0.8em" } }, error)),
                window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.7 } }, t("dlsite.login_note")))),
        window.SP_REACT.createElement(DFL.DialogFooter, null,
            window.SP_REACT.createElement(DFL.DialogButton, { onClick: handleLogin, disabled: isLoading }, isLoading ? t("status.loggingIn") : t("buttons.login")))));
};

const GameList = SP_REACT.memo(({ games, onDownload, onPlay, onDelete, t, }) => {
    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'hikari':
                return window.SP_REACT.createElement(FaGamepad, { style: { color: '#00d4ff' } });
            case 'dlsite':
                return window.SP_REACT.createElement(FaGlobe, { style: { color: '#ff6b6b' } });
            default:
                return window.SP_REACT.createElement(FaGamepad, null);
        }
    };
    const getPlatformName = (platform) => {
        switch (platform) {
            case 'hikari':
                return t('platforms.hikari.name');
            case 'dlsite':
                return t('platforms.dlsite.name');
            default:
                return platform;
        }
    };
    const memoizedGames = SP_REACT.useMemo(() => games, [games]);
    return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null, memoizedGames.map((game) => (window.SP_REACT.createElement(DFL.PanelSectionRow, { key: `${game.platform}-${game.id}` },
        window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "8px" } },
            window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                window.SP_REACT.createElement("div", { style: { flex: 1 } },
                    window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" } },
                        getPlatformIcon(game.platform),
                        window.SP_REACT.createElement("div", { style: { fontWeight: "bold" } }, game.name)),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.8em", opacity: 0.7, marginLeft: "24px" } },
                        game.size,
                        " \u2022 ",
                        getPlatformName(game.platform),
                        game.circle && ` • ${game.circle}`,
                        game.price && ` • ¥${game.price}`),
                    game.tags && game.tags.length > 0 && (window.SP_REACT.createElement("div", { style: { fontSize: "0.7em", opacity: 0.6, marginLeft: "24px", marginTop: "2px" } },
                        game.tags.slice(0, 3).join(", "),
                        game.tags.length > 3 && "..."))),
                window.SP_REACT.createElement("div", { style: { display: "flex", gap: "8px" } },
                    !game.installed && !game.downloading && (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => onDownload(game.id, game.platform) },
                        window.SP_REACT.createElement(FaDownload, null))),
                    game.installed && (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                        window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => onPlay(game.id) },
                            window.SP_REACT.createElement(FaPlay, null)),
                        window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => onDelete(game.id) },
                            window.SP_REACT.createElement(FaTrash, null)))))),
            game.downloading && (window.SP_REACT.createElement("div", { style: { fontSize: "0.8em", opacity: 0.8 } },
                t("download.downloading"),
                " ",
                game.progress || 0,
                "%"))))))));
});

const WINE_COMPONENTS = [
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
const SteamIntegration = ({ gameId, onGameAdded, t, }) => {
    const [protonVersions, setProtonVersions] = SP_REACT.useState([]);
    const [selectedProton, setSelectedProton] = SP_REACT.useState("proton_experimental");
    const [steamGameInfo, setSteamGameInfo] = SP_REACT.useState(null);
    const [selectedComponents, setSelectedComponents] = SP_REACT.useState([]);
    const [selectedLocale, setSelectedLocale] = SP_REACT.useState("");
    const [isConfiguring, setIsConfiguring] = SP_REACT.useState(false);
    const [loading, setLoading] = SP_REACT.useState(true);
    SP_REACT.useEffect(() => {
        loadProtonVersions();
        if (gameId) {
            loadSteamGameInfo();
        }
    }, [gameId]);
    const loadProtonVersions = async () => {
        try {
            const versions = await call("get_proton_versions");
            setProtonVersions(versions || []);
        }
        catch (error) {
            console.error("Failed to load Proton versions:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadSteamGameInfo = async () => {
        if (!gameId)
            return;
        try {
            const info = await call("get_steam_game_info", gameId);
            setSteamGameInfo(info);
            if (info) {
                setSelectedProton(info.compatibility_tool);
                setSelectedComponents(info.components);
                setSelectedLocale(info.locale);
            }
        }
        catch (error) {
            console.error("Failed to load Steam game info:", error);
        }
    };
    const addGameToSteam = async () => {
        if (!gameId)
            return;
        setLoading(true);
        try {
            const result = await call("add_game_to_steam", gameId, selectedProton);
            if (result.success) {
                await loadSteamGameInfo();
                onGameAdded?.(true, result.app_id);
            }
            else {
                console.error("Failed to add game to Steam:", result.message);
                onGameAdded?.(false);
            }
        }
        catch (error) {
            console.error("Error adding game to Steam:", error);
            onGameAdded?.(false);
        }
        finally {
            setLoading(false);
        }
    };
    const removeGameFromSteam = async () => {
        if (!steamGameInfo)
            return;
        setLoading(true);
        try {
            const result = await call("remove_game_from_steam", steamGameInfo.app_id);
            if (result.success) {
                setSteamGameInfo(null);
            }
            else {
                console.error("Failed to remove game from Steam:", result.message);
            }
        }
        catch (error) {
            console.error("Error removing game from Steam:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const configureWineComponents = async () => {
        if (!steamGameInfo)
            return;
        setIsConfiguring(true);
        try {
            const result = await call("configure_wine_components", steamGameInfo.app_id, selectedComponents, selectedLocale || undefined);
            if (result.success) {
                await loadSteamGameInfo();
                console.log("Wine components configured successfully");
            }
            else {
                console.error("Failed to configure Wine components:", result.message);
            }
        }
        catch (error) {
            console.error("Error configuring Wine components:", error);
        }
        finally {
            setIsConfiguring(false);
        }
    };
    const launchGame = async (viaSteam = true) => {
        if (!gameId)
            return;
        try {
            const result = await call("launch_game", gameId, viaSteam);
            if (!result.success) {
                console.error("Failed to launch game:", result.message);
            }
        }
        catch (error) {
            console.error("Error launching game:", error);
        }
    };
    const showComponentSelector = () => {
        DFL.showModal(window.SP_REACT.createElement(DFL.ModalRoot, { onCancel: () => { } },
            window.SP_REACT.createElement(DFL.DialogHeader, null, t("steam.configure_wine_title")),
            window.SP_REACT.createElement(DFL.DialogBody, null,
                window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "10px" } },
                    window.SP_REACT.createElement(DFL.Field, { label: t("steam.locale_setting") },
                        window.SP_REACT.createElement(DFL.DropdownItem, { rgOptions: LOCALE_OPTIONS.map(opt => ({
                                data: opt.value,
                                label: t(opt.labelKey),
                            })), selectedOption: selectedLocale, onChange: (data) => setSelectedLocale(data.data), disabled: isConfiguring })),
                    window.SP_REACT.createElement(DFL.Field, { label: t("steam.wine_components") },
                        window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } }, WINE_COMPONENTS.map(component => (window.SP_REACT.createElement(DFL.ToggleField, { key: component.id, label: t(component.nameKey), description: t(component.descriptionKey), checked: selectedComponents.includes(component.id), onChange: (checked) => {
                                if (checked) {
                                    setSelectedComponents(prev => [...prev, component.id]);
                                }
                                else {
                                    setSelectedComponents(prev => prev.filter(id => id !== component.id));
                                }
                            }, disabled: isConfiguring }))))))),
            window.SP_REACT.createElement(DFL.DialogFooter, null,
                window.SP_REACT.createElement(DFL.DialogButton, { onClick: configureWineComponents, disabled: isConfiguring }, isConfiguring ? t("steam.configuring") : t("steam.apply_config")))));
    };
    if (loading) {
        return (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement("div", null, t("steam.loading"))));
    }
    return (window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.Field, { label: t("steam.integration_status") },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    window.SP_REACT.createElement(FaSteam, { style: { color: steamGameInfo ? "#1b2838" : "#666" } }),
                    window.SP_REACT.createElement("span", null, steamGameInfo ?
                        `${t("steam.added_to_steam")} (ID: ${steamGameInfo.app_id})` :
                        t("steam.not_in_steam"))))),
        !steamGameInfo && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.Field, { label: t("steam.compatibility_tool") },
                window.SP_REACT.createElement(DFL.DropdownItem, { rgOptions: protonVersions.map(version => ({
                        data: version.id,
                        label: `${version.name} (${version.version})`,
                    })), selectedOption: selectedProton, onChange: (data) => setSelectedProton(data.data) })))),
        window.SP_REACT.createElement(DFL.PanelSectionRow, null, !steamGameInfo ? (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: addGameToSteam, disabled: loading || !gameId },
            window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                window.SP_REACT.createElement(FaPlus, null),
                t("steam.add_to_steam")))) : (window.SP_REACT.createElement("div", { style: { display: "flex", flexDirection: "column", gap: "8px" } },
            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => launchGame(true), disabled: !gameId },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    window.SP_REACT.createElement(FaSteam, null),
                    t("steam.launch_via_steam"))),
            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: showComponentSelector, disabled: isConfiguring },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    window.SP_REACT.createElement(FaCog, null),
                    t("steam.configure_wine"))),
            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: removeGameFromSteam, disabled: loading },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    window.SP_REACT.createElement(FaWineGlass, null),
                    t("steam.remove_from_steam")))))),
        steamGameInfo && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.Field, { label: t("steam.current_config") },
                window.SP_REACT.createElement("div", { style: { fontSize: "12px", color: "#b8b6b4" } },
                    window.SP_REACT.createElement("div", null,
                        t("steam.compatibility"),
                        ": ",
                        steamGameInfo.compatibility_tool),
                    steamGameInfo.locale && (window.SP_REACT.createElement("div", null,
                        t("steam.locale"),
                        ": ",
                        steamGameInfo.locale)),
                    steamGameInfo.components.length > 0 && (window.SP_REACT.createElement("div", null,
                        t("steam.components"),
                        ": ",
                        steamGameInfo.components.join(", "))))))),
        steamGameInfo && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => launchGame(false), disabled: !gameId },
                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                    window.SP_REACT.createElement(FaGlobe, null),
                    t("steam.launch_direct")))))));
};

// Decky-compatible style utilities following their design system
const commonStyles = {
    // Layout containers
    modalContainer: {
        minHeight: "500px",
        maxHeight: "600px",
        width: "100%",
        maxWidth: "900px",
        overflowY: "auto",
        padding: "0 16px"
    },
    // Welcome/info boxes
    infoBox: {
        textAlign: "center",
        padding: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        marginBottom: "12px"
    },
    // Error display
    errorBox: {
        padding: "8px 12px",
        background: "rgba(244, 67, 54, 0.1)",
        border: "1px solid rgba(244, 67, 54, 0.3)",
        borderRadius: "6px",
        fontSize: "0.8em"
    },
    // Help/tip boxes
    tipBox: {
        padding: "12px",
        background: "rgba(33, 150, 243, 0.1)",
        borderRadius: "6px",
        border: "1px solid rgba(33, 150, 243, 0.3)"
    },
    helpBox: {
        padding: "12px",
        background: "rgba(76, 175, 80, 0.1)",
        borderRadius: "6px",
        border: "1px solid rgba(76, 175, 80, 0.3)"
    },
    aboutBox: {
        padding: "12px",
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "6px",
        textAlign: "center"
    },
    // Flex layouts
    flexRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    flexColumn: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    flexBetween: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    // Scrollable lists
    scrollableList: {
        maxHeight: "350px",
        overflowY: "auto"
    },
    // Text styles
    titleText: {
        fontSize: "1em",
        fontWeight: "bold",
        marginBottom: "8px"
    },
    subtitleText: {
        fontSize: "0.9em",
        marginBottom: "8px"
    },
    bodyText: {
        fontSize: "0.8em",
        opacity: 0.8
    },
    captionText: {
        fontSize: "0.7em",
        opacity: 0.6
    },
    // Progress bar
    progressBar: {
        width: "100%",
        height: "4px",
        backgroundColor: "#333",
        borderRadius: "2px",
        overflow: "hidden"
    },
    // Status indicators
    statusDot: (online) => ({
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        backgroundColor: online ? "#00d4ff" : "#666"
    }),
    // Button groups
    buttonGroup: {
        display: "flex",
        gap: "4px"
    },
    // Game info layout
    gameInfo: {
        flex: 1
    },
    gameTitle: {
        fontWeight: "bold"
    },
    gameDetails: {
        fontSize: "0.8em",
        opacity: 0.7,
        marginLeft: "24px"
    },
    gameTags: {
        fontSize: "0.7em",
        opacity: 0.6,
        marginLeft: "24px",
        marginTop: "2px"
    }
};
// Progress bar fill style generator
const createProgressFill = (progress, status = 'downloading') => {
    const colors = {
        downloading: "#00d4ff",
        failed: "#ff6b6b",
        paused: "#666",
        completed: "#4caf50",
        pending: "#999",
        cancelled: "#ff9800",
    };
    return {
        width: `${progress}%`,
        height: "100%",
        backgroundColor: colors[status],
        transition: "width 0.3s ease"
    };
};

const DOWNLOAD_EVENT = "visual_novel_manager/download-update";
const VALID_STATUSES = ['pending', 'downloading', 'paused', 'completed', 'failed', 'cancelled'];
const isTerminalStatus = (status) => status === 'completed' || status === 'cancelled';
const normalizeDownload = (raw) => {
    const gameId = raw.game_id ?? raw.gameId;
    const gameName = raw.game_name ?? raw.gameName;
    if (!gameId || !gameName) {
        return null;
    }
    const rawStatus = (raw.status ?? 'downloading').toLowerCase();
    const status = (VALID_STATUSES.includes(rawStatus)
        ? rawStatus
        : 'downloading');
    return {
        gameId,
        gameName,
        progress: raw.progress ?? 0,
        speed: raw.speed ?? 0,
        eta: raw.eta_seconds ?? raw.eta ?? 0,
        status,
        totalSize: raw.total_size ?? raw.totalSize ?? 0,
        downloadedSize: raw.downloaded_size ?? raw.downloadedSize ?? 0,
        resumable: raw.resumable ?? (status === 'paused' || status === 'failed'),
        message: raw.message ?? undefined,
        startedAt: raw.started_at ?? raw.startedAt,
        updatedAt: raw.updated_at ?? raw.updatedAt,
    };
};
const DownloadManager = SP_REACT.memo(({ t }) => {
    const [downloadsById, setDownloadsById] = SP_REACT.useState({});
    SP_REACT.useEffect(() => {
        let mounted = true;
        let backoffMs = 15000; // start at 15s
        let timer = null;
        const applySnapshot = (raw) => {
            const normalized = normalizeDownload(raw);
            if (!normalized) {
                return;
            }
            setDownloadsById((prev) => {
                if (!mounted) {
                    return prev;
                }
                const next = { ...prev };
                if (isTerminalStatus(normalized.status)) {
                    if (!(normalized.gameId in next)) {
                        return prev;
                    }
                    delete next[normalized.gameId];
                    return next;
                }
                const existing = next[normalized.gameId];
                if (existing &&
                    existing.progress === normalized.progress &&
                    existing.status === normalized.status &&
                    existing.downloadedSize === normalized.downloadedSize &&
                    existing.speed === normalized.speed &&
                    existing.eta === normalized.eta &&
                    existing.message === normalized.message) {
                    return prev;
                }
                next[normalized.gameId] = normalized;
                return next;
            });
        };
        const eventListener = (...args) => {
            const payload = args[0];
            if (payload) {
                applySnapshot(payload);
            }
        };
        addEventListener(DOWNLOAD_EVENT, eventListener);
        const seedFromApi = async () => {
            try {
                const downloadList = await call("get_active_downloads");
                if (!mounted)
                    return false;
                setDownloadsById(() => {
                    const next = {};
                    downloadList
                        .map(normalizeDownload)
                        .filter((item) => item !== null)
                        .forEach((item) => {
                        if (!isTerminalStatus(item.status)) {
                            next[item.gameId] = item;
                        }
                    });
                    return next;
                });
                return true;
            }
            catch (error) {
                console.error("Failed to fetch downloads:", error);
                return false;
            }
        };
        const loop = async () => {
            const ok = await seedFromApi();
            // Exponential backoff on failure up to 2 minutes; reset on success
            backoffMs = ok ? 15000 : Math.min(backoffMs * 2, 120000);
            if (!mounted)
                return;
            timer = setTimeout(loop, backoffMs);
        };
        // Kick off fallback loop
        loop();
        return () => {
            mounted = false;
            if (timer)
                clearTimeout(timer);
            removeEventListener(DOWNLOAD_EVENT, eventListener);
        };
    }, []);
    const handlePause = SP_REACT.useCallback(async (gameId) => {
        try {
            await call("pause_download", gameId);
        }
        catch (error) {
            console.error("Failed to pause download:", error);
        }
    }, []);
    const handleResume = SP_REACT.useCallback(async (gameId) => {
        try {
            await call("resume_download", gameId);
        }
        catch (error) {
            console.error("Failed to resume download:", error);
        }
    }, []);
    const handleCancel = SP_REACT.useCallback(async (gameId) => {
        try {
            await call("cancel_download", gameId);
        }
        catch (error) {
            console.error("Failed to cancel download:", error);
        }
    }, []);
    const formatSpeed = (speed) => {
        if (speed < 1024)
            return `${speed.toFixed(1)} B/s`;
        if (speed < 1024 * 1024)
            return `${(speed / 1024).toFixed(1)} KB/s`;
        return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
    };
    const formatTime = (seconds) => {
        if (seconds < 60)
            return `${seconds}s`;
        if (seconds < 3600)
            return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };
    const formatSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024)
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };
    const downloads = SP_REACT.useMemo(() => Object.values(downloadsById).sort((a, b) => (b.updatedAt ?? b.startedAt ?? 0) - (a.updatedAt ?? a.startedAt ?? 0)), [downloadsById]);
    if (downloads.length === 0) {
        return (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement("div", { style: { textAlign: "center", width: "100%", padding: "12px 0", ...commonStyles.bodyText } }, t("download.no_active"))));
    }
    return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null, downloads.map((download) => (window.SP_REACT.createElement(DFL.PanelSectionRow, { key: download.gameId },
        window.SP_REACT.createElement(DFL.Focusable, { style: { display: "flex", flexDirection: "column", gap: "8px" } },
            window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                window.SP_REACT.createElement("div", { style: { flex: 1 } },
                    window.SP_REACT.createElement("div", { style: { fontWeight: "bold", fontSize: "0.9em" } }, download.gameName),
                    window.SP_REACT.createElement("div", { style: { fontSize: "0.8em", opacity: 0.7 } },
                        formatSize(download.downloadedSize),
                        " / ",
                        formatSize(download.totalSize))),
                window.SP_REACT.createElement("div", { style: { display: "flex", gap: "4px" } },
                    download.status === 'downloading' && (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => handlePause(download.gameId) },
                        window.SP_REACT.createElement(FaPause, null))),
                    (download.status === 'paused' || download.status === 'failed') && download.resumable && (window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => handleResume(download.gameId) },
                        window.SP_REACT.createElement(FaPlay, null))),
                    window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: () => handleCancel(download.gameId) },
                        window.SP_REACT.createElement(FaStop, null)))),
            window.SP_REACT.createElement("div", { style: commonStyles.flexColumn },
                window.SP_REACT.createElement("div", { style: commonStyles.progressBar },
                    window.SP_REACT.createElement("div", { style: createProgressFill(download.progress, download.status) })),
                window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", ...commonStyles.captionText } },
                    window.SP_REACT.createElement("span", null,
                        download.progress.toFixed(1),
                        "%"),
                    download.status === 'downloading' && (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                        window.SP_REACT.createElement("span", null, formatSpeed(download.speed)),
                        window.SP_REACT.createElement("span", null,
                            t("download.eta"),
                            ": ",
                            formatTime(download.eta)))),
                    download.status === 'paused' && (window.SP_REACT.createElement("span", null, t("download.paused"))),
                    download.status === 'pending' && (window.SP_REACT.createElement("span", null, t("download.pending"))),
                    download.status === 'failed' && (window.SP_REACT.createElement("span", { style: { color: "#ff6b6b" } }, download.message || t("download.error"))),
                    download.status === 'cancelled' && (window.SP_REACT.createElement("span", { style: { color: "#ff9800" } }, t("download.cancelled")))))))))));
});

const Settings = SP_REACT.memo(({ onLanguageChange, onProtonVersionChange, onAutoUpdateChange, onDownloadPathChange, currentLanguage, currentProtonVersion, autoUpdate, downloadPath, backendStatus, t, }) => {
    const languageOptions = SP_REACT.useMemo(() => [
        { label: t("settings.languageOptions.en"), value: "en" },
        { label: t("settings.languageOptions.zh_CN"), value: "zh_CN" },
        { label: t("settings.languageOptions.zh_TW"), value: "zh_TW" },
        { label: t("settings.languageOptions.ja"), value: "ja" },
    ], [t]);
    const protonOptions = SP_REACT.useMemo(() => [
        { label: t("settings.protonOptions.experimental"), value: "proton_experimental" },
        { label: t("settings.protonOptions.proton9"), value: "proton_90" },
        { label: t("settings.protonOptions.proton8"), value: "proton_80" },
        { label: t("settings.protonOptions.geLatest"), value: "ge-latest" },
    ], [t]);
    const backendRunning = backendStatus?.running ?? false;
    const uptimeSeconds = backendStatus?.uptimeSeconds ?? 0;
    const formatUptime = (seconds) => {
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
    return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.Field, { label: t("settings.backendStatus"), description: backendDescription, icon: window.SP_REACT.createElement("span", { style: commonStyles.statusDot(backendRunning) }) })),
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.DropdownItem, { label: t("settings.language"), menuLabel: t("settings.language"), rgOptions: languageOptions.map((opt) => ({
                    label: opt.label,
                    data: opt.value,
                })), selectedOption: currentLanguage, onChange: (selected) => onLanguageChange(selected.data) })),
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.DropdownItem, { label: t("settings.protonVersion"), menuLabel: t("settings.protonVersion"), rgOptions: protonOptions.map((opt) => ({
                    label: opt.label,
                    data: opt.value,
                })), selectedOption: currentProtonVersion, onChange: (selected) => onProtonVersionChange(selected.data) })),
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.ToggleField, { label: t("settings.autoUpdate"), checked: autoUpdate, onChange: onAutoUpdateChange })),
        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
            window.SP_REACT.createElement(DFL.TextField, { label: t("settings.downloadPath"), value: downloadPath, onChange: (e) => onDownloadPathChange(e.target.value) }))));
});

const en = {
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

const zh_CN = {
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

const zh_TW = {
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

const ja = {
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

const translations = {
    en,
    zh_CN,
    zh_TW,
    ja
};

const useTranslation = (initialLanguage = 'en') => {
    const [currentLanguage, setCurrentLanguage] = SP_REACT.useState(initialLanguage);
    const t = SP_REACT.useCallback((key) => {
        const keys = key.split('.');
        let value = translations[currentLanguage];
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                // Fallback to English if key not found
                value = translations.en;
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    }
                    else {
                        return key; // Return key if not found in fallback
                    }
                }
                break;
            }
        }
        return typeof value === 'string' ? value : key;
    }, [currentLanguage]);
    const setLanguage = SP_REACT.useCallback((language) => {
        setCurrentLanguage(language);
    }, []);
    return {
        t,
        currentLanguage,
        setLanguage,
        availableLanguages: Object.keys(translations)
    };
};

const normalizePreferences = (raw, allowedLanguages, fallbackLanguage) => {
    const candidateLanguage = typeof raw?.language === "string" ? raw.language : undefined;
    const language = candidateLanguage && allowedLanguages.includes(candidateLanguage)
        ? candidateLanguage
        : fallbackLanguage;
    const defaultProtonVersion = typeof raw?.defaultProtonVersion === "string" && raw.defaultProtonVersion.trim().length > 0
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
const Content = () => {
    const { t, currentLanguage, setLanguage, availableLanguages } = useTranslation();
    // Hikari Field state
    const [isHikariLoggedIn, setIsHikariLoggedIn] = SP_REACT.useState(false);
    const [cdnServers, setCdnServers] = SP_REACT.useState([]);
    const [selectedCdn, setSelectedCdn] = SP_REACT.useState(null);
    const [hikariGames, setHikariGames] = SP_REACT.useState([]);
    // DLsite state
    const [isDLsiteLoggedIn, setIsDLsiteLoggedIn] = SP_REACT.useState(false);
    const [dlsiteGames, setDLsiteGames] = SP_REACT.useState([]);
    // Combined state (derived)
    const [isLoading, setIsLoading] = SP_REACT.useState(false);
    const [recentGame, _setRecentGame] = SP_REACT.useState(null);
    const [error, setError] = SP_REACT.useState(null);
    const [preferences, setPreferences] = SP_REACT.useState(() => normalizePreferences(null, availableLanguages, currentLanguage));
    const [activePage, setActivePage] = SP_REACT.useState("overview");
    const [backendStatus, setBackendStatus] = SP_REACT.useState(null);
    const loadPreferences = SP_REACT.useCallback(async () => {
        try {
            const prefs = await call("get_user_preferences");
            const normalized = normalizePreferences(prefs, availableLanguages, currentLanguage);
            setPreferences(normalized);
            if (normalized.language !== currentLanguage) {
                setLanguage(normalized.language);
            }
        }
        catch (error) {
            console.error("Failed to load user preferences:", error);
        }
    }, [availableLanguages, currentLanguage, setLanguage]);
    const persistPreferences = SP_REACT.useCallback(async (updates) => {
        const payload = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
        if (Object.keys(payload).length === 0) {
            return;
        }
        let provisionalLanguage = null;
        setPreferences(prev => {
            const merged = normalizePreferences({ ...prev, ...payload }, availableLanguages, prev.language);
            provisionalLanguage = merged.language;
            return merged;
        });
        if (payload.language && payload.language !== currentLanguage) {
            setLanguage(payload.language);
        }
        try {
            const saved = await call("update_user_preferences", payload);
            const normalized = normalizePreferences(saved, availableLanguages, provisionalLanguage ?? currentLanguage);
            setPreferences(normalized);
            if (normalized.language !== currentLanguage) {
                setLanguage(normalized.language);
            }
        }
        catch (error) {
            console.error("Failed to update user preferences:", error);
        }
    }, [availableLanguages, currentLanguage, setLanguage]);
    const loadBackendStatus = SP_REACT.useCallback(async () => {
        try {
            const status = await call("get_backend_status");
            setBackendStatus(status);
        }
        catch (error) {
            console.error("Failed to fetch backend status:", error);
            setBackendStatus(current => current ? { ...current, running: false } : { running: false });
        }
    }, []);
    SP_REACT.useEffect(() => {
        loadPreferences();
    }, [loadPreferences]);
    SP_REACT.useEffect(() => {
        loadBackendStatus();
        const interval = setInterval(loadBackendStatus, 30000);
        return () => clearInterval(interval);
    }, [loadBackendStatus]);
    const handleLanguagePreferenceChange = SP_REACT.useCallback((language) => {
        persistPreferences({ language });
    }, [persistPreferences]);
    const handleProtonPreferenceChange = SP_REACT.useCallback((version) => {
        persistPreferences({ defaultProtonVersion: version });
    }, [persistPreferences]);
    const handleAutoUpdateChange = SP_REACT.useCallback((value) => {
        persistPreferences({ autoUpdate: value });
    }, [persistPreferences]);
    const handleDownloadPathChange = SP_REACT.useCallback((path) => {
        persistPreferences({ downloadPath: path });
    }, [persistPreferences]);
    // Note: Server configuration is handled internally by HikariLogin component
    SP_REACT.useEffect(() => {
        checkLoginStatus();
        checkDLsiteLoginStatus();
    }, []);
    SP_REACT.useEffect(() => {
        if (isHikariLoggedIn) {
            refreshHikariGames();
        }
    }, [isHikariLoggedIn]);
    SP_REACT.useEffect(() => {
        if (isDLsiteLoggedIn) {
            refreshDLsiteGames();
        }
    }, [isDLsiteLoggedIn]);
    const allGames = SP_REACT.useMemo(() => [...hikariGames, ...dlsiteGames], [hikariGames, dlsiteGames]);
    SP_REACT.useEffect(() => {
        const installedGames = allGames.filter(g => g.installed);
        if (installedGames.length > 0) {
            _setRecentGame(installedGames[0]);
        }
        else {
            _setRecentGame(null);
        }
    }, [allGames]);
    const checkLoginStatus = async () => {
        try {
            const status = await call("get_login_status");
            setIsHikariLoggedIn(status.isLoggedIn);
            setCdnServers(status.cdnServers || []);
            setSelectedCdn(status.selectedCdn);
        }
        catch (error) {
            console.error("Failed to check Hikari login status:", error);
        }
    };
    const checkDLsiteLoginStatus = async () => {
        try {
            const status = await call("get_dlsite_login_status");
            setIsDLsiteLoggedIn(status.isLoggedIn);
        }
        catch (error) {
            console.error("Failed to check DLsite login status:", error);
        }
    };
    const refreshHikariGames = SP_REACT.useCallback(async (force = false) => {
        if (!isHikariLoggedIn)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const games = force
                ? await call("get_hikari_game_list", true)
                : await call("get_hikari_game_list");
            // Add platform info to games
            const hikariGamesWithPlatform = games.map(game => ({
                ...game,
                platform: 'hikari'
            }));
            setHikariGames(hikariGamesWithPlatform);
        }
        catch (error) {
            console.error("Failed to fetch Hikari game list:", error);
            setError(t("errors.fetch_games_failed"));
        }
        finally {
            setIsLoading(false);
        }
    }, [isHikariLoggedIn, t, setHikariGames, setIsLoading, setError]);
    const refreshDLsiteGames = SP_REACT.useCallback(async (force = false) => {
        if (!isDLsiteLoggedIn)
            return;
        setIsLoading(true);
        setError(null);
        try {
            const games = force
                ? await call("get_dlsite_game_list", true)
                : await call("get_dlsite_game_list");
            // Add platform info to games
            const dlsiteGamesWithPlatform = games.map(game => ({
                ...game,
                platform: 'dlsite'
            }));
            setDLsiteGames(dlsiteGamesWithPlatform);
        }
        catch (error) {
            console.error("Failed to fetch DLsite game list:", error);
            setError(t("errors.fetch_games_failed"));
        }
        finally {
            setIsLoading(false);
        }
    }, [isDLsiteLoggedIn, t, setDLsiteGames, setIsLoading, setError]);
    const refreshAllGames = SP_REACT.useCallback(async () => {
        await Promise.all([
            isHikariLoggedIn ? refreshHikariGames(true) : Promise.resolve(),
            isDLsiteLoggedIn ? refreshDLsiteGames(true) : Promise.resolve()
        ]);
    }, [isHikariLoggedIn, isDLsiteLoggedIn, refreshHikariGames, refreshDLsiteGames]);
    const handleDownloadGame = SP_REACT.useCallback(async (gameId, platform) => {
        setError(null);
        try {
            // Use platform-specific download function
            const downloadFunction = platform === 'hikari' ? 'download_hikari_game' : 'download_dlsite_game';
            const downloadResult = await call(downloadFunction, gameId);
            if (downloadResult.success) {
                console.log(`Download started successfully from ${platform}`);
                // Update the appropriate game list to show downloading state
                if (platform === 'hikari') {
                    setHikariGames(prev => prev.map(game => game.id === gameId
                        ? { ...game, downloading: true, progress: 0 }
                        : game));
                }
                else {
                    setDLsiteGames(prev => prev.map(game => game.id === gameId
                        ? { ...game, downloading: true, progress: 0 }
                        : game));
                }
                // Note: Game will be automatically added to Steam after download completion
                // This is handled by the download completion callback in the backend
                setActivePage("downloads");
            }
            else {
                console.error("Download failed:", downloadResult.message);
                setError(`${t("errors.download_failed")}: ${downloadResult.message}`);
            }
        }
        catch (error) {
            console.error("Download failed:", error);
            setError(t("errors.download_failed"));
        }
    }, [t, setHikariGames, setDLsiteGames, setError]);
    const handlePlayGame = SP_REACT.useCallback(async (gameId) => {
        try {
            await call("launch_game", gameId);
        }
        catch (error) {
            console.error("Failed to launch game:", error);
        }
    }, []);
    const handleDeleteGame = SP_REACT.useCallback(async (gameId) => {
        try {
            await call("delete_game", gameId);
            await refreshAllGames();
        }
        catch (error) {
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
    const gameStats = SP_REACT.useMemo(() => ({
        total: allGames.length,
        hikari: hikariGames.length,
        dlsite: dlsiteGames.length,
        installed: allGames.filter(g => g.installed).length
    }), [allGames, hikariGames, dlsiteGames]);
    const layoutStyles = SP_REACT.useMemo(() => ({
        container: {
            display: "flex",
            gap: "16px",
            alignItems: "flex-start",
            width: "100%",
        },
        sidebar: {
            minWidth: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        },
        navButton: (active) => ({
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
            flexDirection: "column",
            gap: "12px",
            minWidth: 0,
        },
    }), []);
    const navItems = SP_REACT.useMemo(() => ([
        { key: "overview", label: t("sections.overview"), icon: window.SP_REACT.createElement(FaBook, null) },
        { key: "library", label: t("sections.games"), icon: window.SP_REACT.createElement(FaGamepad, null) },
        { key: "downloads", label: t("sections.downloads"), icon: window.SP_REACT.createElement(FaDownload, null) },
        { key: "steam", label: t("steam.title"), icon: window.SP_REACT.createElement(FaSteam, null) },
        { key: "settings", label: t("sections.settings"), icon: window.SP_REACT.createElement(FaCog, null) },
    ]), [t]);
    const renderPageContent = () => {
        switch (activePage) {
            case "overview":
                return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("platforms.status") },
                        isLoading && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.Field, { label: t("status.loading"), description: "", icon: window.SP_REACT.createElement(DFL.Spinner, null) }))),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.Field, { label: t("platforms.hikari.name"), description: isHikariLoggedIn ? t("status.online") : t("status.offline"), icon: window.SP_REACT.createElement("span", { style: commonStyles.statusDot(isHikariLoggedIn) }) })),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.Field, { label: t("platforms.dlsite.name"), description: isDLsiteLoggedIn ? t("status.online") : t("status.offline"), icon: window.SP_REACT.createElement("span", { style: commonStyles.statusDot(isDLsiteLoggedIn) }) })),
                        recentGame && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement("div", null,
                                window.SP_REACT.createElement("div", { style: commonStyles.bodyText },
                                    t("status.recent_game"),
                                    ":"),
                                window.SP_REACT.createElement("div", { style: commonStyles.subtitleText }, recentGame.name))))),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("sections.account") },
                        window.SP_REACT.createElement(HikariLogin, { isLoggedIn: isHikariLoggedIn, cdnServers: cdnServers, selectedCdn: selectedCdn, onLoginSuccess: handleHikariLoginSuccess, onLogout: handleHikariLogout, t: t }),
                        window.SP_REACT.createElement(DLsiteLogin, { isLoggedIn: isDLsiteLoggedIn, onLoginSuccess: handleDLsiteLoginSuccess, onLogout: handleDLsiteLogout, t: t })),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("sections.games") },
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement("div", { style: commonStyles.flexColumn },
                                window.SP_REACT.createElement("div", { style: commonStyles.bodyText },
                                    gameStats.total,
                                    " ",
                                    t("library.games_available"),
                                    gameStats.total > 0 ? ` (${gameStats.hikari} ${t("platforms.hikari.name")}, ${gameStats.dlsite} ${t("platforms.dlsite.name")})` : "")))),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("quick_actions") },
                        recentGame && (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => handlePlayGame(recentGame.id) },
                                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                                    window.SP_REACT.createElement(FaPlay, null),
                                    t("buttons.play"),
                                    " ",
                                    recentGame.name)))),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => setActivePage("library") },
                                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                                    window.SP_REACT.createElement(FaGamepad, null),
                                    t("sections.games")))),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => setActivePage("downloads") },
                                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                                    window.SP_REACT.createElement(FaDownload, null),
                                    t("sections.downloads")))),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => setActivePage("steam") },
                                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                                    window.SP_REACT.createElement(FaSteam, null),
                                    t("steam.title")))),
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => setActivePage("settings") },
                                window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                                    window.SP_REACT.createElement(FaCog, null),
                                    t("sections.settings")))))));
            case "library":
                return (window.SP_REACT.createElement(DFL.PanelSection, { title: t("sections.games") },
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "12px" } },
                            window.SP_REACT.createElement(DFL.ButtonItem, { layout: "inline", onClick: refreshAllGames, disabled: isLoading }, isLoading ? t("status.loading") : t("buttons.refresh")),
                            window.SP_REACT.createElement("div", { style: commonStyles.bodyText },
                                gameStats.total,
                                " ",
                                t("library.games_available")))),
                    allGames.length === 0 ? (window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { textAlign: "center", padding: "20px", opacity: 0.7 } }, !isHikariLoggedIn && !isDLsiteLoggedIn
                            ? t("library.login_to_see_games")
                            : t("library.no_games_found")))) : (window.SP_REACT.createElement("div", { style: commonStyles.scrollableList },
                        window.SP_REACT.createElement(GameList, { games: allGames, onDownload: handleDownloadGame, onPlay: handlePlayGame, onDelete: handleDeleteGame, t: t })))));
            case "downloads":
                return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("download.active_downloads") },
                        window.SP_REACT.createElement(DownloadManager, { t: t })),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("download.tips") },
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement("div", { style: commonStyles.tipBox },
                                window.SP_REACT.createElement("div", { style: commonStyles.subtitleText },
                                    "\uD83D\uDCA1 ",
                                    t("download.tip_title")),
                                window.SP_REACT.createElement("ul", { style: { ...commonStyles.bodyText, paddingLeft: "16px", margin: 0 } },
                                    window.SP_REACT.createElement("li", null, t("download.tip_resume")),
                                    window.SP_REACT.createElement("li", null, t("download.tip_background")),
                                    window.SP_REACT.createElement("li", null, t("download.tip_steam_auto"))))))));
            case "steam":
                return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null, recentGame ? (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                    window.SP_REACT.createElement(DFL.PanelSection, { title: `${t("steam.game_config")}: ${recentGame.name}` },
                        window.SP_REACT.createElement(SteamIntegration, { gameId: recentGame.id, gameName: recentGame.name, t: t })),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("steam.help") },
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement("div", { style: commonStyles.helpBox },
                                window.SP_REACT.createElement("div", { style: commonStyles.subtitleText },
                                    "\uD83C\uDFAE ",
                                    t("steam.help_title")),
                                window.SP_REACT.createElement("ul", { style: { ...commonStyles.bodyText, paddingLeft: "16px", margin: 0 } },
                                    window.SP_REACT.createElement("li", null, t("steam.help_auto_add")),
                                    window.SP_REACT.createElement("li", null, t("steam.help_wine_config")),
                                    window.SP_REACT.createElement("li", null, t("steam.help_proton_versions")))))))) : (window.SP_REACT.createElement(DFL.PanelSection, { title: t("steam.no_game_selected") },
                    window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                        window.SP_REACT.createElement("div", { style: { textAlign: "center", padding: "40px" } },
                            window.SP_REACT.createElement("div", { style: { fontSize: "1.1em", marginBottom: "8px" } }, t("steam.select_game_first")),
                            window.SP_REACT.createElement("div", { style: { fontSize: "0.9em", opacity: 0.7 } }, t("steam.download_game_instruction"))))))));
            case "settings":
                return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("settings.preferences") },
                        window.SP_REACT.createElement(Settings, { onLanguageChange: handleLanguagePreferenceChange, onProtonVersionChange: handleProtonPreferenceChange, onAutoUpdateChange: handleAutoUpdateChange, onDownloadPathChange: handleDownloadPathChange, currentLanguage: preferences.language, currentProtonVersion: preferences.defaultProtonVersion, autoUpdate: preferences.autoUpdate, downloadPath: preferences.downloadPath, backendStatus: backendStatus, t: t })),
                    window.SP_REACT.createElement(DFL.PanelSection, { title: t("settings.about") },
                        window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                            window.SP_REACT.createElement("div", { style: commonStyles.aboutBox },
                                window.SP_REACT.createElement("div", { style: commonStyles.titleText }, t("plugin.name")),
                                window.SP_REACT.createElement("div", { style: commonStyles.bodyText }, t("plugin.description")),
                                window.SP_REACT.createElement("div", { style: commonStyles.captionText },
                                    t("settings.version"),
                                    ": 1.0.0"))))));
            default:
                return null;
        }
    };
    return (window.SP_REACT.createElement(window.SP_REACT.Fragment, null,
        error && (window.SP_REACT.createElement(DFL.PanelSection, null,
            window.SP_REACT.createElement(DFL.PanelSectionRow, null,
                window.SP_REACT.createElement("div", { style: commonStyles.errorBox },
                    window.SP_REACT.createElement("div", { style: { color: "#f44336", fontWeight: "bold", marginBottom: "4px" } },
                        "\u26A0\uFE0F ",
                        t("errors.error_occurred")),
                    window.SP_REACT.createElement("div", { style: commonStyles.bodyText }, error),
                    window.SP_REACT.createElement("button", { style: {
                            background: "none",
                            border: "none",
                            color: "#f44336",
                            ...commonStyles.captionText,
                            cursor: "pointer",
                            marginTop: "4px",
                            textDecoration: "underline",
                        }, onClick: () => setError(null) }, t("buttons.dismiss")))))),
        window.SP_REACT.createElement("div", { style: layoutStyles.container },
            window.SP_REACT.createElement("div", { style: layoutStyles.sidebar },
                window.SP_REACT.createElement(DFL.PanelSection, { title: t("plugin.name") }, navItems.map((item) => (window.SP_REACT.createElement(DFL.PanelSectionRow, { key: item.key },
                    window.SP_REACT.createElement(DFL.Focusable, { style: layoutStyles.navButton(activePage === item.key), onClick: () => setActivePage(item.key) },
                        window.SP_REACT.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                            item.icon,
                            window.SP_REACT.createElement("span", null, item.label)))))))),
            window.SP_REACT.createElement("div", { style: layoutStyles.content }, renderPageContent()))));
};
var index = DFL.definePlugin(() => {
    return {
        name: "Visual Novel Manager",
        titleView: window.SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Visual Novel Manager"),
        content: window.SP_REACT.createElement(Content, null),
        icon: window.SP_REACT.createElement(FaBook, null),
        onDismount() {
            console.log("Visual Novel Manager unmounted");
        },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
