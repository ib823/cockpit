/**
 * AeroTimeline Component
 * Minimal, elegant Gantt chart with canvas + DOM overlays
 * Business-day aware, keyboard accessible
 */

"use client";

import React, { useRef, useState, useEffect } from "react";
import { clsx } from "clsx";
import { useTimelineEngine } from "./useTimelineEngine";
import { TimelinePhase, ViewMode, TimelineInteraction as _TimelineInteraction } from "./types";
import { Segmented } from "../ui";
import { formatISODate } from "./utils/date";

interface AeroTimelineProps {
  startDateISO: string;
  phases: TimelinePhase[];
  holidays?: string[];
  onPhaseUpdate?: (phaseId: string, updates: Partial<TimelinePhase>) => void;
  onPhaseClick?: (phase: TimelinePhase) => void;
  className?: string;
}

export const AeroTimeline: React.FC<AeroTimelineProps> = ({
  startDateISO,
  phases,
  holidays = [],
  onPhaseClick,
  className,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { rows, links, config, totalWidth, totalHeight } = useTimelineEngine({
    startDateISO,
    phases,
    holidays,
    viewMode,
  });

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, totalWidth, totalHeight);

    // Draw grid lines
    ctx.strokeStyle = "var(--g-grid)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= phases.length; i++) {
      const y = i * config.rowHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(totalWidth, y);
      ctx.stroke();
    }

    // Draw today line
    const todayISO = formatISODate(new Date());
    if (todayISO >= startDateISO) {
      const todayBD = 0; // Simplified - should calculate actual BD from start
      const todayX = config.paddingLeft + todayBD * config.pixelsPerDay;
      ctx.strokeStyle = "var(--g-today)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(todayX, 0);
      ctx.lineTo(todayX, totalHeight);
      ctx.stroke();
    }

    // Draw links (dependencies)
    ctx.strokeStyle = "var(--g-link)";
    ctx.lineWidth = 1.5;
    links.forEach((link) => {
      const path = new Path2D(link.path);
      ctx.stroke(path);
    });

    // Draw baselines
    rows.forEach((row, index) => {
      if (row.baseline) {
        const y = index * config.rowHeight + config.rowHeight / 2;
        ctx.strokeStyle = "var(--g-baseline)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(row.baseline.startX, y);
        ctx.lineTo(row.baseline.startX + row.baseline.width, y);
        ctx.stroke();
      }
    });
  }, [rows, links, config, totalWidth, totalHeight, phases.length, startDateISO]);

  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--ink)]">Timeline</h2>
        <Segmented
          options={[
            { label: "Week", value: "week" },
            { label: "Month", value: "month" },
            { label: "Quarter", value: "quarter" },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
          size="small"
        />
      </div>

      {/* Timeline container */}
      <div
        ref={containerRef}
        className="relative border border-[var(--line)] rounded-[var(--r-md)] overflow-auto bg-[var(--surface)]"
        style={{ height: "600px" }}
      >
        {/* Left rail (names) */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-[var(--surface-sub)] border-r border-[var(--line)] z-10"
          style={{ width: `${config.leftRailWidth}px` }}
        >
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center px-3 border-b border-[var(--line)]"
              style={{ height: `${config.rowHeight}px` }}
            >
              <span className="text-sm text-[var(--ink)] truncate">{row.name}</span>
            </div>
          ))}
        </div>

        {/* Canvas timeline */}
        <div className="absolute top-0 bottom-0" style={{ left: `${config.leftRailWidth}px` }}>
          <canvas ref={canvasRef} className="block" />

          {/* DOM overlays (bars, tooltips) */}
          <div className="absolute inset-0 pointer-events-none">
            {rows.map((row, index) => {
              const y = index * config.rowHeight + (config.rowHeight - config.barHeight) / 2;
              const isSelected = row.id === selectedPhaseId;

              return (
                <div
                  key={row.id}
                  className="absolute pointer-events-auto cursor-pointer"
                  style={{
                    left: `${row.startX}px`,
                    top: `${y}px`,
                    width: `${row.width}px`,
                    height: `${config.barHeight}px`,
                  }}
                  onClick={() => {
                    setSelectedPhaseId(row.id);
                    onPhaseClick?.(row.phase);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPhaseClick?.(row.phase);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Phase: ${row.name}, ${row.phase.durationBD} business days, starts ${row.startDate}`}
                >
                  {/* Bar */}
                  <div
                    className={clsx(
                      "relative h-full rounded-[var(--r-sm)] transition-all duration-[var(--dur)]",
                      row.critical ? "bg-[var(--g-bar-critical)]" : "bg-[var(--g-bar)]",
                      isSelected && "ring-2 ring-[var(--focus)]"
                    )}
                  >
                    {/* Progress inner bar */}
                    {row.progress > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-[var(--g-progress)] rounded-[var(--r-sm)] opacity-30"
                        style={{ width: `${row.progress}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-[var(--ink-muted)] flex items-center gap-4">
        <span>Click to select • Enter to open details</span>
      </div>
    </div>
  );
};
