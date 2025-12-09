/**
 * Memoized Resource Row Components
 *
 * Performance-optimized components for rendering resource rows in the Gantt chart.
 * Uses React.memo with custom comparison to prevent unnecessary re-renders.
 *
 * Key optimizations:
 * - Memoized at the row level to prevent re-renders when sibling rows change
 * - Static styles extracted to CSS variables
 * - Callback props are stable references (must be passed via useCallback from parent)
 */

import React, { memo, useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import type { Resource, ResourceCategory } from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import {
  getAllocationStatusColor,
  getAvailabilityStatusColor,
  formatPercent,
  formatDays,
  type ResourceWeekAllocation,
  type ResourceCapacityResult,
} from "@/lib/gantt-tool/resource-capacity-calculator";

// ============================================================================
// Constants
// ============================================================================

const RESOURCE_ROW_HEIGHT = 44;

// Static styles to avoid object creation on each render
// PERFORMANCE: will-change hints for GPU acceleration on animated properties
const styles = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 24px 0 48px",
    height: `${RESOURCE_ROW_HEIGHT}px`,
    borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    willChange: "background-color", // GPU hint for hover transitions
    contain: "layout style", // CSS containment for isolation
  } as const,
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  } as const,
  avatarContainer: {
    position: "relative" as const,
    flexShrink: 0,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 6,
    objectFit: "contain" as const,
    backgroundColor: "#fff",
    border: "1px solid rgba(0, 0, 0, 0.06)",
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
  } as const,
  indicatorDot: {
    position: "absolute" as const,
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: "50%",
    border: "1.5px solid white",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  nameContainer: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  } as const,
  name: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--color-text-primary)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  designation: {
    fontSize: "11px",
    color: "var(--color-text-tertiary)",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

// ============================================================================
// Types
// ============================================================================

interface SubCompanyInfo {
  name: string;
  parentCompany: string;
  indicatorColor?: string;
}

interface ResourceRowProps {
  resource: Resource;
  isSelected: boolean;
  logo?: string;
  indicatorColor?: string;
  onSelect: (resourceId: string) => void;
  onEdit: (resourceId: string) => void;
}

interface ResourceCapacityRowProps {
  resource: Resource;
  isSelected: boolean;
  capacityData: ResourceCapacityResult | undefined;
  projectWeeks: { weekIdentifier: string; weekStartDate: Date; weekEndDate: Date }[];
  getPositionPercent: (date: Date) => number;
  editingCell: { resourceId: string; weekId: string } | null;
  editingCellValue: string;
  onCellClick: (resourceId: string, weekId: string, currentValue: number) => void;
  onCellValueChange: (value: string) => void;
  onCellEdit: (resourceId: string, weekId: string, value: number) => void;
  onCellEditCancel: () => void;
}

// ============================================================================
// Memoized Components
// ============================================================================

/**
 * Memoized sidebar resource row (left panel)
 */
export const ResourceRowMemoized = memo(function ResourceRowMemoized({
  resource,
  isSelected,
  logo,
  indicatorColor,
  onSelect,
  onEdit,
}: ResourceRowProps) {
  const resourceCategory = RESOURCE_CATEGORIES[resource.category] || RESOURCE_CATEGORIES.other;
  const resourceColor = resourceCategory.color;

  const handleClick = useCallback(() => {
    onEdit(resource.id);
  }, [onEdit, resource.id]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(resource.id);
  }, [onSelect, resource.id]);

  const rowStyle = useMemo(() => ({
    ...styles.row,
    backgroundColor: isSelected ? "rgba(0, 122, 255, 0.04)" : "var(--color-bg-primary)",
  }), [isSelected]);

  const checkboxStyle = useMemo(() => ({
    ...styles.checkbox,
    border: isSelected ? "2px solid var(--color-blue)" : "2px solid rgba(0, 0, 0, 0.2)",
    backgroundColor: isSelected ? "var(--color-blue)" : "transparent",
  }), [isSelected]);

  // Display role/company/category info
  const secondaryText = resource.projectRole || resource.companyName || resourceCategory.label;

  return (
    <div
      style={rowStyle}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isSelected ? "rgba(0, 122, 255, 0.04)" : "var(--color-bg-primary)";
      }}
    >
      {/* Checkbox */}
      <div onClick={handleCheckboxClick} style={checkboxStyle}>
        {isSelected && <Check size={10} style={{ color: "#fff" }} />}
      </div>

      {/* Avatar with Sub-company Indicator */}
      <div style={styles.avatarContainer}>
        {logo ? (
          <img
            src={logo}
            alt={resource.companyName || ""}
            style={styles.avatar}
          />
        ) : (
          <div style={{ ...styles.avatarPlaceholder, backgroundColor: resourceColor }}>
            {resource.name.charAt(0).toUpperCase()}
          </div>
        )}
        {indicatorColor && (
          <div style={{ ...styles.indicatorDot, backgroundColor: indicatorColor }} />
        )}
      </div>

      {/* Name & Role */}
      <div style={styles.nameContainer}>
        <div style={styles.name}>
          {resource.name}
          {resource.designation === "root" && (
            <span
              style={{
                marginLeft: 6,
                fontSize: "9px",
                fontWeight: 600,
                color: "#FF3B30",
                backgroundColor: "rgba(255, 59, 48, 0.1)",
                padding: "2px 5px",
                borderRadius: 3,
                verticalAlign: "middle",
              }}
            >
              ROOT
            </span>
          )}
        </div>
        <div style={styles.designation}>{secondaryText}</div>
      </div>

      {/* Edit indicator */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-text-tertiary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.5, flexShrink: 0 }}
      >
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
  return (
    prevProps.resource.id === nextProps.resource.id &&
    prevProps.resource.name === nextProps.resource.name &&
    prevProps.resource.projectRole === nextProps.resource.projectRole &&
    prevProps.resource.designation === nextProps.resource.designation &&
    prevProps.resource.category === nextProps.resource.category &&
    prevProps.resource.companyName === nextProps.resource.companyName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.logo === nextProps.logo &&
    prevProps.indicatorColor === nextProps.indicatorColor
  );
});

/**
 * Memoized capacity cell for a single week
 */
const CapacityCellMemoized = memo(function CapacityCellMemoized({
  week,
  resourceId,
  weekLeft,
  weekWidth,
  isEditing,
  editingCellValue,
  onCellClick,
  onCellValueChange,
  onCellEdit,
  onCellEditCancel,
}: {
  week: ResourceWeekAllocation;
  resourceId: string;
  weekLeft: number;
  weekWidth: number;
  isEditing: boolean;
  editingCellValue: string;
  onCellClick: () => void;
  onCellValueChange: (value: string) => void;
  onCellEdit: (value: number) => void;
  onCellEditCancel: () => void;
}) {
  const availableHeight = Math.min(week.availablePercent, 100);
  const allocatedHeight = Math.min(week.allocatedPercent, 100);

  // Pre-compute tooltip string only once
  const tooltipText = useMemo(() => {
    const taskDetails = week.taskAllocations.length > 0
      ? `\n${week.taskAllocations.map((t) => `• ${t.taskName}: ${t.allocationPercent}%`).join("\n")}`
      : "";
    return `${week.weekIdentifier}: ${formatPercent(week.allocatedPercent)} allocated, ${formatDays(week.availableDays)} available${taskDetails}`;
  }, [week.weekIdentifier, week.allocatedPercent, week.availableDays, week.taskAllocations]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt(editingCellValue) || 0;
      onCellEdit(Math.max(0, Math.min(200, val)));
    } else if (e.key === "Escape") {
      onCellEditCancel();
    }
  }, [editingCellValue, onCellEdit, onCellEditCancel]);

  const handleBlur = useCallback(() => {
    const val = parseInt(editingCellValue) || 0;
    onCellEdit(Math.max(0, Math.min(200, val)));
  }, [editingCellValue, onCellEdit]);

  return (
    <div
      style={{
        position: "absolute",
        left: `${weekLeft}%`,
        width: `${weekWidth}%`,
        top: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        borderRight: "1px solid rgba(0, 0, 0, 0.04)",
        cursor: "pointer",
        padding: "2px",
        // PERFORMANCE: GPU acceleration hints
        contain: "layout paint", // CSS containment for isolation
        willChange: "contents", // Hint for content changes during editing
      }}
      onClick={onCellClick}
      title={tooltipText}
    >
      {isEditing ? (
        <input
          type="number"
          min="0"
          max="200"
          value={editingCellValue}
          onChange={(e) => onCellValueChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: "100%",
            height: "28px",
            border: "2px solid var(--color-blue)",
            borderRadius: "4px",
            textAlign: "center",
            fontSize: "11px",
            fontWeight: 600,
            outline: "none",
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          {/* Stacked bar: Allocated (bottom) + Available (top) */}
          <div
            style={{
              width: "100%",
              height: "28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              borderRadius: "3px",
              overflow: "hidden",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
            }}
          >
            {/* Available portion (shows what's free) */}
            {availableHeight > 0 && (
              <div
                style={{
                  width: "100%",
                  height: `${availableHeight * 0.28}px`,
                  backgroundColor: getAvailabilityStatusColor(week.availablePercent),
                  opacity: 0.4,
                }}
              />
            )}
            {/* Allocated portion */}
            {allocatedHeight > 0 && (
              <div
                style={{
                  width: "100%",
                  height: `${Math.min(allocatedHeight * 0.28, 28)}px`,
                  backgroundColor: getAllocationStatusColor(week.allocatedPercent),
                  opacity: 0.7,
                }}
              />
            )}
          </div>
          {/* Manual override indicator */}
          {week.isManualOverride && (
            <div
              style={{
                position: "absolute",
                top: "2px",
                right: "2px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#FF9500",
              }}
            />
          )}
        </>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for capacity cell
  return (
    prevProps.week.weekIdentifier === nextProps.week.weekIdentifier &&
    prevProps.week.allocatedPercent === nextProps.week.allocatedPercent &&
    prevProps.week.availablePercent === nextProps.week.availablePercent &&
    prevProps.week.isManualOverride === nextProps.week.isManualOverride &&
    prevProps.weekLeft === nextProps.weekLeft &&
    prevProps.weekWidth === nextProps.weekWidth &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.editingCellValue === nextProps.editingCellValue
  );
});

/**
 * Memoized timeline resource row (right panel with capacity cells)
 */
export const ResourceCapacityRowMemoized = memo(function ResourceCapacityRowMemoized({
  resource,
  isSelected,
  capacityData,
  projectWeeks,
  getPositionPercent,
  editingCell,
  editingCellValue,
  onCellClick,
  onCellValueChange,
  onCellEdit,
  onCellEditCancel,
}: ResourceCapacityRowProps) {
  // Pre-calculate week positions
  const weekPositions = useMemo(() => {
    return projectWeeks.map((week) => ({
      weekIdentifier: week.weekIdentifier,
      left: getPositionPercent(week.weekStartDate),
      right: getPositionPercent(week.weekEndDate),
    }));
  }, [projectWeeks, getPositionPercent]);

  return (
    <div
      style={{
        height: `${RESOURCE_ROW_HEIGHT}px`,
        borderBottom: "1px solid rgba(0, 0, 0, 0.03)",
        position: "relative",
        backgroundColor: isSelected ? "rgba(0, 122, 255, 0.04)" : "var(--color-bg-primary)",
        display: "flex",
      }}
    >
      {/* Weekly capacity cells */}
      {capacityData?.weeks.map((week, idx) => {
        const pos = weekPositions[idx];
        if (!pos) return null;

        const isEditing = editingCell?.resourceId === resource.id && editingCell?.weekId === week.weekIdentifier;

        return (
          <CapacityCellMemoized
            key={week.weekIdentifier}
            week={week}
            resourceId={resource.id}
            weekLeft={pos.left}
            weekWidth={pos.right - pos.left}
            isEditing={isEditing}
            editingCellValue={isEditing ? editingCellValue : ""}
            onCellClick={() => onCellClick(resource.id, week.weekIdentifier, week.allocatedPercent)}
            onCellValueChange={onCellValueChange}
            onCellEdit={(value) => onCellEdit(resource.id, week.weekIdentifier, value)}
            onCellEditCancel={onCellEditCancel}
          />
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - check if we really need to re-render
  if (prevProps.resource.id !== nextProps.resource.id) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  if (prevProps.editingCell?.resourceId !== nextProps.editingCell?.resourceId) return false;
  if (prevProps.editingCell?.weekId !== nextProps.editingCell?.weekId) return false;
  if (prevProps.editingCellValue !== nextProps.editingCellValue) return false;

  // Deep compare capacity data (by reference if possible)
  if (prevProps.capacityData !== nextProps.capacityData) {
    // Check if the actual values changed
    if (!prevProps.capacityData || !nextProps.capacityData) return false;
    if (prevProps.capacityData.weeks.length !== nextProps.capacityData.weeks.length) return false;

    // Compare week allocations
    for (let i = 0; i < prevProps.capacityData.weeks.length; i++) {
      const prevWeek = prevProps.capacityData.weeks[i];
      const nextWeek = nextProps.capacityData.weeks[i];
      if (
        prevWeek.allocatedPercent !== nextWeek.allocatedPercent ||
        prevWeek.availablePercent !== nextWeek.availablePercent ||
        prevWeek.isManualOverride !== nextWeek.isManualOverride
      ) {
        return false;
      }
    }
  }

  return true;
});

// ============================================================================
// Helper to get resource display info
// ============================================================================

export function getResourceDisplayInfo(
  resource: Resource,
  companyLogos: Record<string, string>,
  subCompanies: SubCompanyInfo[]
): { logo?: string; indicatorColor?: string } {
  if (!resource.companyName) {
    return {};
  }

  const resourceSubCompany = subCompanies.find((sc) => sc.name === resource.companyName);
  const logo = resourceSubCompany
    ? companyLogos[resourceSubCompany.parentCompany]
    : companyLogos[resource.companyName];
  const indicatorColor = resourceSubCompany?.indicatorColor;

  return { logo, indicatorColor };
}
