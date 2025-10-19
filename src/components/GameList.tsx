import { FC, memo, useMemo } from "react";
import {
  ButtonItem,
  PanelSectionRow,
  Focusable,
} from "@decky/ui";
import { FaDownload, FaPlay, FaTrash, FaGamepad, FaGlobe } from "react-icons/fa";

export type Platform = 'hikari' | 'dlsite';

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

interface GameListProps {
  games: Game[];
  onDownload: (gameId: string, platform: Platform) => void;
  onPlay: (gameId: string) => void;
  onDelete: (gameId: string) => void;
  t: (key: string) => string;
}

export const GameList: FC<GameListProps> = memo(({
  games,
  onDownload,
  onPlay,
  onDelete,
  t,
}) => {
  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'hikari':
        return <FaGamepad style={{ color: '#00d4ff' }} />;
      case 'dlsite':
        return <FaGlobe style={{ color: '#ff6b6b' }} />;
      default:
        return <FaGamepad />;
    }
  };

  const getPlatformName = (platform: Platform) => {
    switch (platform) {
      case 'hikari':
        return t('platforms.hikari.name');
      case 'dlsite':
        return t('platforms.dlsite.name');
      default:
        return platform;
    }
  };

  const memoizedGames = useMemo(() => games, [games]);

  return (
    <>
      {memoizedGames.map((game) => (
        <PanelSectionRow key={`${game.platform}-${game.id}`}>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {getPlatformIcon(game.platform)}
                  <div style={{ fontWeight: "bold" }}>{game.name}</div>
                </div>
                <div style={{ fontSize: "0.8em", opacity: 0.7, marginLeft: "24px" }}>
                  {game.size} • {getPlatformName(game.platform)}
                  {game.circle && ` • ${game.circle}`}
                  {game.price && ` • ¥${game.price}`}
                </div>
                {game.tags && game.tags.length > 0 && (
                  <div style={{ fontSize: "0.7em", opacity: 0.6, marginLeft: "24px", marginTop: "2px" }}>
                    {game.tags.slice(0, 3).join(", ")}
                    {game.tags.length > 3 && "..."}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {!game.installed && !game.downloading && (
                  <ButtonItem
                    layout="inline"
                    onClick={() => onDownload(game.id, game.platform)}
                  >
                    <FaDownload />
                  </ButtonItem>
                )}
                {game.installed && (
                  <>
                    <ButtonItem
                      layout="inline"
                      onClick={() => onPlay(game.id)}
                    >
                      <FaPlay />
                    </ButtonItem>
                    <ButtonItem
                      layout="inline"
                      onClick={() => onDelete(game.id)}
                    >
                      <FaTrash />
                    </ButtonItem>
                  </>
                )}
              </div>
            </div>
            {game.downloading && (
              <div style={{ fontSize: "0.8em", opacity: 0.8 }}>
                {t("download.downloading")} {game.progress || 0}%
              </div>
            )}
          </Focusable>
        </PanelSectionRow>
      ))}
    </>
  );
});
