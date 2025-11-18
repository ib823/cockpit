/**
 * ProjectMetrics Component
 * Display key project metrics in Apple-inspired minimal style
 *
 * Features:
 * - Date range
 * - Duration (calendar/working days toggle)
 * - Team size
 * - Budget status (if available)
 * - Hover tooltips
 * - Color-coded status indicators
 */

"use client";

import { useState } from "react";
import { Calendar, Users, DollarSign } from "lucide-react";
import type { GanttProject } from "@/types/gantt-tool";
import {
  calculateProjectMetrics,
  getDurationTooltip,
  getTeamTooltip,
  getBudgetTooltip,
  type ProjectMetrics as Metrics,
} from "@/lib/gantt-tool/project-metrics";

interface ProjectMetricsProps {
  project: GanttProject | null;
  compact?: boolean;
}

export function ProjectMetrics({ project, compact = false }: ProjectMetricsProps) {
  const [showWorkingDays, setShowWorkingDays] = useState(false);
  const metrics = calculateProjectMetrics(project);

  if (!project || !metrics.startDate) {
    return (
      <div
        style={{
          fontFamily: "var(--font-text)",
          fontSize: "var(--text-body)",
          color: "var(--color-gray-1)",
          textAlign: "center",
          opacity: 0.6,
        }}
      >
        No timeline yet • Add phases to see metrics
      </div>
    );
  }

  const toggleDuration = () => {
    setShowWorkingDays(!showWorkingDays);
  };

  // Format duration: months for calendar, days for working
  const durationText = showWorkingDays
    ? `${metrics.workingDays} d`
    : metrics.durationDisplay;

  return (
    <div
      className="flex items-center gap-2"
      style={{
        fontFamily: "var(--font-text)",
        fontSize: "13px",
        fontWeight: 500,
        color: "#666",
      }}
    >
      {/* Date Range */}
      <MetricItem
        icon={<Calendar className="w-3.5 h-3.5" />}
        value={metrics.dateRangeDisplay}
        tooltip="Project timeline"
        showIcon={!compact}
      />

      <Separator />

      {/* Duration */}
      <MetricItem
        value={durationText}
        tooltip={getDurationTooltip(metrics)}
        onClick={toggleDuration}
        clickable
        showIcon={false}
      />

      <Separator />

      {/* Team Size */}
      <MetricItem
        icon={<Users className="w-3.5 h-3.5" />}
        value={metrics.teamDisplay}
        tooltip={getTeamTooltip(metrics)}
        showIcon={!compact}
      />

      {/* Budget (conditional) */}
      {metrics.budgetDisplay && (
        <>
          <Separator />
          <MetricItem
            icon={<DollarSign className="w-3.5 h-3.5" />}
            value={metrics.budgetDisplay}
            tooltip={getBudgetTooltip(metrics)}
            statusColor={getBudgetColor(metrics.budgetStatus)}
            showIcon={!compact}
          />
        </>
      )}
    </div>
  );
}

/**
 * Individual metric item with tooltip
 */
interface MetricItemProps {
  icon?: React.ReactNode;
  value: string;
  tooltip?: string;
  onClick?: () => void;
  clickable?: boolean;
  statusColor?: string;
  showIcon?: boolean;
}

function MetricItem({
  icon,
  value,
  tooltip,
  onClick,
  clickable = false,
  statusColor,
  showIcon = true,
}: MetricItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center gap-1.5 relative group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        cursor: clickable ? "pointer" : "default",
        opacity: isHovered ? 0.9 : 1,
        transition: "opacity 100ms ease",
        color: statusColor || "inherit",
      }}
      title={tooltip}
      role={clickable ? "button" : undefined}
      aria-label={tooltip}
    >
      {showIcon && icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
      <span>{value}</span>

      {/* Tooltip on hover - Fixed z-index */}
      {tooltip && isHovered && (
        <div
          className="fixed animate-fade-in"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "var(--weight-medium)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            zIndex: 9999,
            top: "64px", // Below header
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {tooltip}
          {/* Arrow */}
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              marginLeft: "-4px",
              borderWidth: "4px",
              borderStyle: "solid",
              borderColor: "transparent transparent rgba(0, 0, 0, 0.85) transparent",
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Separator dot
 */
function Separator() {
  return (
    <span
      style={{
        opacity: 0.4,
        fontSize: "13px",
      }}
    >
      •
    </span>
  );
}

/**
 * Get color for budget status
 */
function getBudgetColor(status: "good" | "warning" | "danger" | null): string | undefined {
  if (!status) return undefined;

  return {
    good: "var(--color-green)",
    warning: "var(--color-orange)",
    danger: "var(--color-red)",
  }[status];
}

/**
 * Hook for using project metrics in other components
 */
export function useProjectMetrics(project: GanttProject | null) {
  return calculateProjectMetrics(project);
}
