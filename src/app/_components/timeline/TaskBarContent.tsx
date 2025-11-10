/**
 * TaskBarContent Component
 * Rich task bar with icon, name, duration, and resource avatars
 * Implements Apple HIG design standards
 */

"use client";

import React from "react";
import { clsx } from "clsx";
import { PhaseStatus } from "./types";
import { Circle, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface TaskBarContentProps {
  name: string;
  durationDays: number;
  status: PhaseStatus;
  assignees?: string[];
  width: number;
  isSelected?: boolean;
}

// Status icon mapping
const STATUS_ICONS: Record<PhaseStatus, React.ReactNode> = {
  not_started: <Circle size={12} strokeWidth={2} />,
  in_progress: <Clock size={12} strokeWidth={2} />,
  at_risk: <AlertCircle size={12} strokeWidth={2} />,
  complete: <CheckCircle size={12} strokeWidth={2} fill="currentColor" />,
};

// Semantic color mapping (iOS System Colors)
const STATUS_COLORS: Record<PhaseStatus, string> = {
  not_started: "var(--color-gray-1)", // Gray
  in_progress: "var(--color-blue)", // iOS Blue
  at_risk: "var(--color-orange)", // iOS Orange
  complete: "var(--color-green)", // iOS Green
};

export const TaskBarContent: React.FC<TaskBarContentProps> = ({
  name,
  durationDays,
  status,
  assignees = [],
  width,
  isSelected,
}) => {
  // Determine if we have enough space for full content
  const showDuration = width > 120;
  const showAvatars = width > 200;
  const showFullName = width > 150;

  return (
    <div
      className={clsx(
        "relative h-full flex items-center gap-2 px-3 rounded-[var(--radius-sm)] transition-all duration-[var(--duration-default)]",
        "hover:brightness-110 focus-within:ring-2 focus-within:ring-[var(--color-blue)] focus-within:ring-opacity-50",
        isSelected && "ring-2 ring-[var(--color-blue)]"
      )}
      style={{
        backgroundColor: STATUS_COLORS[status],
        color: "white",
      }}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0" style={{ opacity: 0.9 }}>
        {STATUS_ICONS[status]}
      </div>

      {/* Task Name */}
      <span
        className={clsx(
          "flex-1 text-[var(--text-body)] font-medium truncate",
          !showFullName && "text-xs"
        )}
        style={{ opacity: 1 }}
      >
        {name}
      </span>

      {/* Duration */}
      {showDuration && (
        <span
          className="flex-shrink-0 text-[var(--text-detail)] font-regular"
          style={{ opacity: 0.8 }}
        >
          {formatDuration(durationDays)}
        </span>
      )}

      {/* Resource Avatars */}
      {showAvatars && assignees.length > 0 && (
        <div className="flex-shrink-0 flex items-center -space-x-1">
          {assignees.slice(0, 3).map((initials, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold border-2"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderColor: STATUS_COLORS[status],
                color: "white",
              }}
            >
              {initials}
            </div>
          ))}
          {assignees.length > 3 && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold border-2"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                borderColor: STATUS_COLORS[status],
                color: "white",
              }}
            >
              +{assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format duration
function formatDuration(days: number): string {
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;

  const weeks = Math.round(days / 5); // Business weeks (5 days)
  if (weeks === 1) return "1 week";
  if (weeks < 4) return `${weeks} weeks`;

  const months = Math.round(weeks / 4);
  if (months === 1) return "1 month";
  return `${months} months`;
}
