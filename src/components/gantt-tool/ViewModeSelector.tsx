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

  // Abbreviation map for compact display (Apple minimalism)
  const abbreviations: Record<ZoomMode, string> = {
    auto: "A",
    week: "W",
    month: "M",
    quarter: "Q",
    year: "Y",
  };

  // Full labels for tooltips
  const fullLabels: Record<ZoomMode, string> = {
    auto: "Auto",
    week: "Week",
    month: "Month",
    quarter: "Quarter",
    year: "Year",
  };

  return (
    <div className={styles.viewSelector}>
      {modes.map((mode) => {
        const isActive = zoomMode === mode;
        const abbreviation = abbreviations[mode];
        const fullLabel = fullLabels[mode];

        return (
          <button
            key={mode}
            onClick={() => onZoomModeChange(mode)}
            className={`${styles.viewSelectorButton} ${isActive ? styles.active : ""}`}
            title={mode === "auto" ? `${fullLabel} (${activeZoomMode})` : `${fullLabel} view`}
          >
            {abbreviation}
          </button>
        );
      })}
    </div>
  );
}
