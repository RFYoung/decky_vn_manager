import { FC, useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  ButtonItem,
  PanelSectionRow,
  Focusable,
} from "@decky/ui";
import { FaPause, FaPlay, FaStop } from "react-icons/fa";
import { call, addEventListener, removeEventListener } from "@decky/api";
import { commonStyles, createProgressFill } from "../utils/styles";

const DOWNLOAD_EVENT = "visual_novel_manager/download-update";

type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';

interface DownloadItem {
  gameId: string;
  gameName: string;
  progress: number;
  speed: number;
  eta: number;
  status: DownloadStatus;
  totalSize: number;
  downloadedSize: number;
  resumable: boolean;
  message?: string;
  startedAt?: number;
  updatedAt?: number;
}

type RawDownloadItem = {
  game_id?: string;
  gameId?: string;
  game_name?: string;
  gameName?: string;
  progress?: number;
  speed?: number;
  eta_seconds?: number;
  eta?: number;
  status?: string;
  total_size?: number;
  totalSize?: number;
  downloaded_size?: number;
  downloadedSize?: number;
  resumable?: boolean;
  message?: string | null;
  started_at?: number;
  startedAt?: number;
  updated_at?: number;
  updatedAt?: number;
};

const VALID_STATUSES: DownloadStatus[] = ['pending', 'downloading', 'paused', 'completed', 'failed', 'cancelled'];
const isTerminalStatus = (status: DownloadStatus) =>
  status === 'completed' || status === 'cancelled';

const normalizeDownload = (raw: RawDownloadItem): DownloadItem | null => {
  const gameId = raw.game_id ?? raw.gameId;
  const gameName = raw.game_name ?? raw.gameName;

  if (!gameId || !gameName) {
    return null;
  }

  const rawStatus = (raw.status ?? 'downloading').toLowerCase();
  const status = (VALID_STATUSES.includes(rawStatus as DownloadStatus)
    ? rawStatus
    : 'downloading') as DownloadStatus;

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

interface DownloadManagerProps {
  t: (key: string) => string;
}

export const DownloadManager: FC<DownloadManagerProps> = memo(({ t }) => {
  const [downloadsById, setDownloadsById] = useState<Record<string, DownloadItem>>({});

  useEffect(() => {
    let mounted = true;
    let backoffMs = 15000; // start at 15s
    let timer: ReturnType<typeof setTimeout> | null = null;

    const applySnapshot = (raw: RawDownloadItem) => {
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
        if (
          existing &&
          existing.progress === normalized.progress &&
          existing.status === normalized.status &&
          existing.downloadedSize === normalized.downloadedSize &&
          existing.speed === normalized.speed &&
          existing.eta === normalized.eta &&
          existing.message === normalized.message
        ) {
          return prev;
        }

        next[normalized.gameId] = normalized;
        return next;
      });
    };

    const eventListener = (...args: RawDownloadItem[]) => {
      const payload = args[0];
      if (payload) {
        applySnapshot(payload);
      }
    };

    addEventListener(DOWNLOAD_EVENT, eventListener);

    const seedFromApi = async (): Promise<boolean> => {
      try {
        const downloadList = await call<[], RawDownloadItem[]>("get_active_downloads");
        if (!mounted) return false;
        setDownloadsById(() => {
          const next: Record<string, DownloadItem> = {};
          downloadList
            .map(normalizeDownload)
            .filter((item): item is DownloadItem => item !== null)
            .forEach((item) => {
              if (!isTerminalStatus(item.status)) {
                next[item.gameId] = item;
              }
            });
          return next;
        });
        return true;
      } catch (error) {
        console.error("Failed to fetch downloads:", error);
        return false;
      }
    };

    const loop = async () => {
      const ok = await seedFromApi();
      // Exponential backoff on failure up to 2 minutes; reset on success
      backoffMs = ok ? 15000 : Math.min(backoffMs * 2, 120000);
      if (!mounted) return;
      timer = setTimeout(loop, backoffMs);
    };

    // Kick off fallback loop
    loop();

    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
      removeEventListener(DOWNLOAD_EVENT, eventListener);
    };
  }, []);

  const handlePause = useCallback(async (gameId: string) => {
    try {
      await call<[string], { success: boolean }>("pause_download", gameId);
    } catch (error) {
      console.error("Failed to pause download:", error);
    }
  }, []);

  const handleResume = useCallback(async (gameId: string) => {
    try {
      await call<[string], { success: boolean }>("resume_download", gameId);
    } catch (error) {
      console.error("Failed to resume download:", error);
    }
  }, []);

  const handleCancel = useCallback(async (gameId: string) => {
    try {
      await call<[string], { success: boolean }>("cancel_download", gameId);
    } catch (error) {
      console.error("Failed to cancel download:", error);
    }
  }, []);

  const formatSpeed = (speed: number): string => {
    if (speed < 1024) return `${speed.toFixed(1)} B/s`;
    if (speed < 1024 * 1024) return `${(speed / 1024).toFixed(1)} KB/s`;
    return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const downloads = useMemo(() =>
    Object.values(downloadsById).sort(
      (a, b) => (b.updatedAt ?? b.startedAt ?? 0) - (a.updatedAt ?? a.startedAt ?? 0)
    ), [downloadsById]
  );

  if (downloads.length === 0) {
    return (
      <PanelSectionRow>
        <div style={{ textAlign: "center", width: "100%", padding: "12px 0", ...commonStyles.bodyText }}>
          {t("download.no_active")}
        </div>
      </PanelSectionRow>
    );
  }

  return (
    <>
      {downloads.map((download) => (
        <PanelSectionRow key={download.gameId}>
          <Focusable style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "0.9em" }}>
                  {download.gameName}
                </div>
                <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
                  {formatSize(download.downloadedSize)} / {formatSize(download.totalSize)}
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {download.status === 'downloading' && (
                  <ButtonItem
                    layout="inline"
                    onClick={() => handlePause(download.gameId)}
                  >
                    <FaPause />
                  </ButtonItem>
                )}
                {(download.status === 'paused' || download.status === 'failed') && download.resumable && (
                  <ButtonItem
                    layout="inline"
                    onClick={() => handleResume(download.gameId)}
                  >
                    <FaPlay />
                  </ButtonItem>
                )}
                <ButtonItem
                  layout="inline"
                  onClick={() => handleCancel(download.gameId)}
                >
                  <FaStop />
                </ButtonItem>
              </div>
            </div>

            <div style={commonStyles.flexColumn}>
              <div style={commonStyles.progressBar}>
                <div style={createProgressFill(download.progress, download.status)} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", ...commonStyles.captionText }}>
                <span>{download.progress.toFixed(1)}%</span>
                {download.status === 'downloading' && (
                  <>
                    <span>{formatSpeed(download.speed)}</span>
                    <span>{t("download.eta")}: {formatTime(download.eta)}</span>
                  </>
                )}
                {download.status === 'paused' && (
                  <span>{t("download.paused")}</span>
                )}
                {download.status === 'pending' && (
                  <span>{t("download.pending")}</span>
                )}
                {download.status === 'failed' && (
                  <span style={{ color: "#ff6b6b" }}>
                    {download.message || t("download.error")}
                  </span>
                )}
                {download.status === 'cancelled' && (
                  <span style={{ color: "#ff9800" }}>{t("download.cancelled")}</span>
                )}
              </div>
            </div>
          </Focusable>
        </PanelSectionRow>
      ))}
    </>
  );
});
