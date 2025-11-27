/**
 * Showcase Modal Helpers
 *
 * EXACT copies of helper components from modal-design-showcase
 * These are the canonical implementations that ALL gantt-tool modals must match
 *
 * Source: /app/modal-design-showcase/page.tsx (lines 946-1110)
 * Created: 2025-11-17
 * Updated: 2025-11-17 - Added HolidayAwareDatePicker integration (MANDATORY)
 */

"use client";

import React from "react";
import { HolidayAwareDatePicker } from "@/components/ui/HolidayAwareDatePicker";
import type { GanttHoliday } from "@/types/gantt-tool";

// ============================================================================
// FORM EXAMPLE - Unified form field renderer
// ============================================================================

export function FormExample({ fields, onChange, holidays }: {
  fields: Array<{
    id: string;
    label: string;
    type: string;
    value?: string;
    required?: boolean;
    disabled?: boolean;
    placeholder?: string;
    error?: string;
    helpText?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
  onChange: (field: string, value: string) => void;
  holidays?: GanttHoliday[]; // Required for date inputs to show holiday markers
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {fields.map((field) => (
        <div key={field.id}>
          <label
            htmlFor={field.id}
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#6B7280",
              marginBottom: "8px",
            }}
          >
            {field.label}
            {field.required && <span style={{ color: "#FF3B30", marginLeft: "4px" }}>*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={field.id}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${field.error ? "#FF3B30" : "rgba(0, 0, 0, 0.1)"}`,
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
                resize: "vertical",
                opacity: field.disabled ? 0.5 : 1,
                cursor: field.disabled ? "not-allowed" : "text",
                backgroundColor: field.disabled ? "rgba(0, 0, 0, 0.02)" : "transparent",
              }}
            />
          ) : field.type === "select" ? (
            <select
              id={field.id}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              disabled={field.disabled}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
                opacity: field.disabled ? 0.5 : 1,
                cursor: field.disabled ? "not-allowed" : "pointer",
                backgroundColor: field.disabled ? "rgba(0, 0, 0, 0.02)" : "transparent",
              }}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "date" ? (
            // MANDATORY: Use HolidayAwareDatePicker for date inputs to show holiday markers
            <HolidayAwareDatePicker
              value={field.value || ""}
              onChange={(value) => onChange(field.id, value)}
              label=""
              error={field.error}
              placeholder={field.placeholder}
              size="medium"
              region="ABMY"
              disabled={field.disabled}
              // Pass holidays if available (from project data)
              // This enables visual holiday markers in the calendar
            />
          ) : (
            <input
              id={field.id}
              type={field.type}
              value={field.value || ""}
              onChange={(e) => onChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${field.error ? "#FF3B30" : "rgba(0, 0, 0, 0.1)"}`,
                borderRadius: "8px",
                fontSize: "15px",
                fontFamily: "inherit",
                opacity: field.disabled ? 0.5 : 1,
                cursor: field.disabled ? "not-allowed" : "text",
                backgroundColor: field.disabled ? "rgba(0, 0, 0, 0.02)" : "transparent",
              }}
            />
          )}

          {field.error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "6px",
              fontSize: "13px",
              color: "#FF3B30",
            }}>
              {field.error}
            </div>
          )}

          {field.helpText && !field.error && (
            <div style={{
              fontSize: "12px",
              color: "#86868B",
              marginTop: "6px",
            }}>
              {field.helpText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// WORKING DAYS INDICATOR
// ============================================================================

export function WorkingDaysIndicator({ startDate, endDate, holidays }: {
  startDate: string;
  endDate: string;
  holidays?: GanttHoliday[];
}) {
  // Return null if dates are missing or invalid
  if (!startDate || !endDate) {
    return null;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null;
  }

  // Calculate calendar days
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Return null if dates are invalid (end before start)
  if (days <= 0) {
    return null;
  }

  // Calculate working days
  let workingDays: number;
  if (holidays && holidays.length > 0) {
    const { calculateWorkingDaysInclusive } = require("@/lib/gantt-tool/working-days");
    workingDays = calculateWorkingDaysInclusive(start, end, holidays);
  } else {
    // Fallback: Approximate (5/7 of calendar days)
    workingDays = Math.floor(days * (5 / 7));
  }

  return (
    <div style={{
      marginTop: "16px",
      padding: "12px 16px",
      backgroundColor: "#F5F5F7",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}>
      <span style={{ fontSize: "14px", color: "#1D1D1F" }}>
        <strong>{workingDays}</strong> working days <span style={{ color: "#86868B" }}>({days} calendar days)</span>
      </span>
    </div>
  );
}

// ============================================================================
// IMPACT WARNING
// ============================================================================

export function ImpactWarning({ severity, message }: { severity: "low" | "medium" | "high" | "critical"; message: string }) {
  // Simplified - no colored backgrounds, just clear text
  const severityLabel = {
    low: "Note",
    medium: "Warning",
    high: "Important",
    critical: "Critical",
  };

  return (
    <div style={{
      padding: "12px 16px",
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      border: `1px solid rgba(0, 0, 0, 0.08)`,
      borderRadius: "8px",
      marginBottom: "24px",
    }}>
      <div style={{ fontSize: "13px", fontWeight: 600, color: 'rgba(0, 0, 0, 1)', marginBottom: "4px" }}>
        {severityLabel[severity]}
      </div>
      <div style={{ fontSize: "13px", color: 'rgba(0, 0, 0, 0.6)', lineHeight: 1.5 }}>
        {message}
      </div>
    </div>
  );
}

// ============================================================================
// COLOR PICKER EXAMPLE
// ============================================================================

export function ColorPickerExample({ value, onChange }: { value: string; onChange?: (color: string) => void }) {
  const colors = [
    "#007AFF", "#34C759", "#FF9500", "#AF52DE", "#FF3B30",
    "#00C7BE", "#FFD60A", "#FF2D55", "#5E5CE6", "#32ADE6",
  ];

  return (
    <div style={{ marginTop: "16px" }}>
      <label style={{
        display: "block",
        fontSize: "13px",
        fontWeight: 600,
        color: "#6B7280",
        marginBottom: "12px",
      }}>
        Phase Color
      </label>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "8px",
      }}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange?.(color)}
            style={{
              width: "100%",
              aspectRatio: "1",
              backgroundColor: color,
              borderRadius: "8px",
              border: value === color ? "3px solid #1D1D1F" : "1px solid rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (value !== color) {
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />
        ))}
      </div>
    </div>
  );
}
