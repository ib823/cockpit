/**
 * View Mode Selector - Apple Calendar-style Segmented Control
 * Used in Timeline (Gantt) view to switch between zoom modes
 */

import styles from "./ViewModeSelector.module.css";

export type ZoomMode = "auto" | "week" | "month" | "quarter" | "year";

interface ViewModeSelectorProps {
  zoomMode: ZoomMode;
  activeZoomMode: string;
  onZoomModeChange: (mode: ZoomMode) => void;
}

export function ViewModeSelector({ zoomMode, activeZoomMode, onZoomModeChange }: ViewModeSelectorProps) {
  const modes: ZoomMode[] = ["auto", "week", "month", "quarter", "year"];

  return (
    <div className={styles.viewSelector}>
      {modes.map((mode) => {
        const isActive = zoomMode === mode;
        const displayLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

        return (
          <button
            key={mode}
            onClick={() => onZoomModeChange(mode)}
            className={`${styles.viewSelectorButton} ${isActive ? styles.active : ""}`}
            title={mode === "auto" ? `Auto (${activeZoomMode})` : `${displayLabel} view`}
          >
            {displayLabel}
          </button>
        );
      })}
    </div>
  );
}
