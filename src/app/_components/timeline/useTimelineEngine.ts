/**
 * Timeline Engine Hook
 * Headless logic: business-days, layout, dependencies
 */

'use client';

import { useMemo } from 'react';
import {
  TimelinePhase,
  TimelineRow,
  TimelineLink,
  ViewMode,
  TimelineConfig,
} from './types';
import {
  addBusinessDays,
  diffBusinessDays,
  formatISODate,
  parseISODate,
} from './utils/date';

interface UseTimelineEngineProps {
  startDateISO: string;
  phases: TimelinePhase[];
  holidays: string[];
  viewMode: ViewMode;
}

interface UseTimelineEngineReturn {
  rows: TimelineRow[];
  links: TimelineLink[];
  config: TimelineConfig;
  maxEndBD: number;
  totalWidth: number;
  totalHeight: number;
}

const VIEW_MODE_CONFIG: Record<ViewMode, { pixelsPerDay: number }> = {
  week: { pixelsPerDay: 40 },
  month: { pixelsPerDay: 10 },
  quarter: { pixelsPerDay: 3 },
};

export function useTimelineEngine({
  startDateISO,
  phases,
  holidays,
  viewMode,
}: UseTimelineEngineProps): UseTimelineEngineReturn {
  return useMemo(() => {
    // Configuration
    const config: TimelineConfig = {
      leftRailWidth: 240,
      rowHeight: 36,
      barHeight: 14,
      pixelsPerDay: VIEW_MODE_CONFIG[viewMode].pixelsPerDay,
      paddingLeft: 40,
      paddingRight: 40,
    };

    // Calculate max end BD
    const maxEndBD = phases.reduce((max, phase) => {
      const end = phase.startBD + phase.durationBD;
      return Math.max(max, end);
    }, 0);

    // Calculate rows with pixel positions
    const rows: TimelineRow[] = phases.map((phase) => {
      const startDate = addBusinessDays(startDateISO, phase.startBD, holidays);
      const endDate = addBusinessDays(
        startDateISO,
        phase.startBD + phase.durationBD,
        holidays
      );

      const startX = config.paddingLeft + phase.startBD * config.pixelsPerDay;
      const width = phase.durationBD * config.pixelsPerDay;

      const row: TimelineRow = {
        id: phase.id,
        name: phase.name,
        startX,
        width,
        startDate,
        endDate,
        progress: phase.progress ?? 0,
        critical: phase.critical ?? false,
        phase,
      };

      // Baseline if exists
      if (phase.baseline) {
        row.baseline = {
          startX:
            config.paddingLeft +
            phase.baseline.startBD * config.pixelsPerDay,
          width: phase.baseline.durationBD * config.pixelsPerDay,
        };
      }

      return row;
    });

    // Calculate links (dependencies)
    const links: TimelineLink[] = [];
    phases.forEach((phase) => {
      if (phase.dependsOn && phase.dependsOn.length > 0) {
        phase.dependsOn.forEach((dependencyId) => {
          const fromPhase = phases.find((p) => p.id === dependencyId);
          if (!fromPhase) return;

          const fromRow = rows.find((r) => r.id === dependencyId);
          const toRow = rows.find((r) => r.id === phase.id);
          if (!fromRow || !toRow) return;

          // Calculate link path (Finish-to-Start)
          const fromIndex = phases.findIndex((p) => p.id === dependencyId);
          const toIndex = phases.findIndex((p) => p.id === phase.id);

          const fromY =
            fromIndex * config.rowHeight + config.rowHeight / 2;
          const toY = toIndex * config.rowHeight + config.rowHeight / 2;

          const fromX = fromRow.startX + fromRow.width;
          const toX = toRow.startX;

          // Simple cubic bezier path
          const midX = (fromX + toX) / 2;
          const path = `M ${fromX},${fromY} C ${midX},${fromY} ${midX},${toY} ${toX},${toY}`;

          links.push({
            id: `${dependencyId}-${phase.id}`,
            fromPhaseId: dependencyId,
            toPhaseId: phase.id,
            type: 'FS',
            path,
          });
        });
      }
    });

    // Calculate total dimensions
    const totalWidth =
      config.paddingLeft +
      maxEndBD * config.pixelsPerDay +
      config.paddingRight;
    const totalHeight = phases.length * config.rowHeight;

    return {
      rows,
      links,
      config,
      maxEndBD,
      totalWidth,
      totalHeight,
    };
  }, [startDateISO, phases, holidays, viewMode]);
}
