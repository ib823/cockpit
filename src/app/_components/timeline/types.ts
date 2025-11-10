/**
 * Timeline Types
 * Type definitions for the AeroTimeline component
 */

export interface TimelinePhase {
  id: string;
  name: string;
  startBD: number; // Business days from project start
  durationBD: number; // Duration in business days
  progress?: number; // 0-100
  critical?: boolean;
  baseline?: {
    startBD: number;
    durationBD: number;
  };
  dependsOn?: string[]; // Phase IDs (finish-to-start dependencies)
  color?: string;
  assignees?: string[];
  notes?: string;
}

export interface TimelineRow {
  id: string;
  name: string;
  startX: number; // Pixel position from left
  width: number; // Pixel width
  startDate: string; // ISO date
  endDate: string; // ISO date
  progress: number;
  critical: boolean;
  baseline?: {
    startX: number;
    width: number;
  };
  phase: TimelinePhase;
}

export interface TimelineLink {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  type: "FS" | "SS" | "FF" | "SF"; // Finish-to-Start (only FS for now)
  path: string; // SVG path data
}

export type ViewMode = "week" | "month" | "quarter";

export interface TimelineConfig {
  leftRailWidth: number; // px
  rowHeight: number; // px
  barHeight: number; // px
  pixelsPerDay: number; // Depends on view mode
  paddingLeft: number; // px
  paddingRight: number; // px
}

export interface TimelineViewport {
  scrollX: number;
  scrollY: number;
  visibleWidth: number;
  visibleHeight: number;
  totalWidth: number;
  totalHeight: number;
}

export interface TimelineInteraction {
  type: "drag" | "resize-left" | "resize-right" | "none";
  phaseId: string | null;
  startX: number;
  startBD: number;
  originalStartBD: number;
  originalDurationBD: number;
}
