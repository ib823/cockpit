/**
 * TimelineHeader Component
 * Displays quarter/month/week labels above the Gantt timeline
 * Clean, minimal design per Apple HIG - no red dots
 */

"use client";

import React, { useMemo } from "react";
import { ViewMode } from "./types";
import { addBusinessDays } from "./utils/date";

interface TimelineHeaderProps {
  startDateISO: string;
  maxEndBD: number;
  pixelsPerDay: number;
  paddingLeft: number;
  viewMode: ViewMode;
  width: number;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  startDateISO,
  maxEndBD,
  pixelsPerDay,
  paddingLeft,
  viewMode,
  width,
}) => {
  const periods = useMemo(() => {
    const startDate = new Date(startDateISO);
    const endDateISO = addBusinessDays(startDateISO, maxEndBD, []);
    const endDate = new Date(endDateISO);

    if (viewMode === "quarter") {
      return generateQuarterPeriods(startDate, endDate, startDateISO, pixelsPerDay, paddingLeft);
    } else if (viewMode === "month") {
      return generateMonthPeriods(startDate, endDate, startDateISO, pixelsPerDay, paddingLeft);
    } else {
      return generateWeekPeriods(startDate, endDate, startDateISO, pixelsPerDay, paddingLeft);
    }
  }, [startDateISO, maxEndBD, pixelsPerDay, paddingLeft, viewMode]);

  return (
    <div
      className="relative border-b border-[var(--color-gray-4)] bg-[var(--color-bg-secondary)]"
      style={{
        height: "48px",
        width: `${width}px`,
      }}
    >
      {periods.map((period) => (
        <div
          key={period.id}
          className="absolute top-0 bottom-0 flex items-center justify-center border-r border-[var(--color-gray-4)]"
          style={{
            left: `${period.left}px`,
            width: `${period.width}px`,
          }}
        >
          <span
            className="text-[var(--text-body)] font-medium text-[var(--color-gray-1)]"
            style={{ fontSize: viewMode === "week" ? "0.6875rem" : "0.8125rem" }}
          >
            {period.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// Generate quarter periods (e.g., "Q1 '26", "Q2 '26")
function generateQuarterPeriods(
  startDate: Date,
  endDate: Date,
  startDateISO: string,
  pixelsPerDay: number,
  paddingLeft: number
): Array<{ id: string; label: string; left: number; width: number }> {
  const periods: Array<{ id: string; label: string; left: number; width: number }> = [];

  let currentDate = new Date(startDate);
  currentDate.setMonth(Math.floor(currentDate.getMonth() / 3) * 3, 1); // Start of quarter

  while (currentDate <= endDate) {
    const quarterStart = new Date(currentDate);
    const quarterEnd = new Date(currentDate);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3, 0); // Last day of quarter

    const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
    const year = quarterStart.getFullYear().toString().slice(-2);

    const startBD = Math.max(0, businessDaysBetween(new Date(startDateISO), quarterStart));
    const endBD = businessDaysBetween(new Date(startDateISO), new Date(Math.min(quarterEnd.getTime(), endDate.getTime())));

    periods.push({
      id: `q${quarter}-${year}`,
      label: `Q${quarter} '${year}`,
      left: paddingLeft + startBD * pixelsPerDay,
      width: (endBD - startBD) * pixelsPerDay,
    });

    currentDate.setMonth(currentDate.getMonth() + 3, 1);
  }

  return periods;
}

// Generate month periods (e.g., "Jan", "Feb", "Mar")
function generateMonthPeriods(
  startDate: Date,
  endDate: Date,
  startDateISO: string,
  pixelsPerDay: number,
  paddingLeft: number
): Array<{ id: string; label: string; left: number; width: number }> {
  const periods: Array<{ id: string; label: string; left: number; width: number }> = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let currentDate = new Date(startDate);
  currentDate.setDate(1); // Start of month

  while (currentDate <= endDate) {
    const monthStart = new Date(currentDate);
    const monthEnd = new Date(currentDate);
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0); // Last day of month

    const startBD = Math.max(0, businessDaysBetween(new Date(startDateISO), monthStart));
    const endBD = businessDaysBetween(new Date(startDateISO), new Date(Math.min(monthEnd.getTime(), endDate.getTime())));

    periods.push({
      id: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthNames[monthStart.getMonth()],
      left: paddingLeft + startBD * pixelsPerDay,
      width: (endBD - startBD) * pixelsPerDay,
    });

    currentDate.setMonth(currentDate.getMonth() + 1, 1);
  }

  return periods;
}

// Generate week periods (e.g., "W1", "W2", "W3")
function generateWeekPeriods(
  startDate: Date,
  endDate: Date,
  startDateISO: string,
  pixelsPerDay: number,
  paddingLeft: number
): Array<{ id: string; label: string; left: number; width: number }> {
  const periods: Array<{ id: string; label: string; left: number; width: number }> = [];

  let currentDate = new Date(startDate);
  let weekNum = 1;

  while (currentDate <= endDate) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6); // 7 days

    const startBD = Math.max(0, businessDaysBetween(new Date(startDateISO), weekStart));
    const endBD = businessDaysBetween(new Date(startDateISO), new Date(Math.min(weekEnd.getTime(), endDate.getTime())));

    periods.push({
      id: `week-${weekNum}`,
      label: `W${weekNum}`,
      left: paddingLeft + startBD * pixelsPerDay,
      width: (endBD - startBD) * pixelsPerDay,
    });

    currentDate.setDate(currentDate.getDate() + 7);
    weekNum++;
  }

  return periods;
}

// Helper: Calculate business days between two dates (simplified - doesn't account for holidays)
function businessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Not Saturday or Sunday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
