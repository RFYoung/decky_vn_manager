import { CSSProperties } from "react";

// Decky-compatible style utilities following their design system
export const commonStyles = {
  // Layout containers
  modalContainer: {
    minHeight: "500px",
    maxHeight: "600px",
    width: "100%",
    maxWidth: "900px",
    overflowY: "auto" as const,
    padding: "0 16px"
  },

  // Welcome/info boxes
  infoBox: {
    textAlign: "center" as const,
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
    textAlign: "center" as const
  },

  // Flex layouts
  flexRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  flexColumn: {
    display: "flex",
    flexDirection: "column" as const,
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
    overflowY: "auto" as const
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
  statusDot: (online: boolean) => ({
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
    fontWeight: "bold" as const
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
} as const;

// Helper function to create themed styles
export const createModalStyle = (
  minHeight: string = "500px",
  maxHeight: string = "600px",
  maxWidth: string = "900px"
): CSSProperties => ({
  minHeight,
  maxHeight,
  width: "100%",
  maxWidth,
  overflowY: "auto",
  padding: "0 16px"
});

// Progress bar fill style generator
export const createProgressFill = (
  progress: number,
  status: 'downloading' | 'failed' | 'paused' | 'completed' | 'pending' | 'cancelled' = 'downloading'
): CSSProperties => {
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
