"use client";

/**
 * Resource Capacity Panel - Integrated below Gantt Timeline
 *
 * Design intent:
 * - System-level performance and data consistency
 * - Accessible touch targets and semantic color usage
 *
 * Features:
 * - Resource list matches OrgChartPro format (avatars, ROOT badges, hierarchy)
 * - Timeline cells align with GanttCanvasV3 timeline (no duplicate header)
 * - Double-click cells to open allocation modal
 * - Mobile responsive with horizontal scroll
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Users, AlertTriangle, X } from "lucide-react";
import type { GanttProject, Resource, ResourceCategory, GanttPhase } from "@/types/gantt-tool";
import { RESOURCE_CATEGORIES } from "@/types/gantt-tool";
import {
  differenceInDays,
  format,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  eachDayOfInterval,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  getMonth,
  addDays,
} from "date-fns";
import { getTotalResourceCount } from "@/lib/gantt-tool/resource-utils";

// Category priority order (same as OrgChartPro)
const CATEGORY_SORT_ORDER: Record<ResourceCategory, number> = {
  leadership: 0,
  pm: 1,
  change: 2,
  functional: 3,
  technical: 4,
  security: 5,
  basis: 6,
  qa: 7,
  client: 8,
  other: 9,
};

// Design tokens - Apple HIG compliant (matching OrgChartPro)
const TOKENS = {
  colors: {
    capacity: {
      0: "#F9FAFB",
      1: "#DBEAFE",
      2: "#BFDBFE",
      3: "#93C5FD",
      4: "#60A5FA",
      5: "#3B82F6",
    } as Record<number, string>,
    overAllocated: "#FEE2E2",
    text: {
      primary: "#1D1D1F",
      secondary: "#86868B",
      tertiary: "#AEAEB2",
      onBlue: "#FFFFFF",
    },
    border: {
      default: "#E5E5EA",
      subtle: "#F2F2F7",
    },
    accent: {
      blue: "#007AFF",
      green: "#34C759",
      red: "#FF3B30",
    },
    bg: {
      primary: "#FFFFFF",
      secondary: "#F5F5F7",
    },
  },
  typography: {
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    size: { xs: 11, sm: 13, md: 15 },
    weight: { regular: 400, medium: 500, semibold: 600 },
  },
  breakpoints: {
    mobile: 600,
    tablet: 900,
    desktop: 1280,
  },
};

// Row height - 44px minimum for touch targets per WCAG 2.5.5
const ROW_HEIGHT = 56; // Taller to accommodate multi-line resource info

type ZoomMode = "day" | "week" | "month" | "quarter" | "year";

// Sub-company info type (matching OrgChartPro)
interface SubCompanyInfo {
  name: string;
  parentCompany: string;
  indicatorColor?: string;
}

interface AllocationData {
  resourceId: string;
  phaseId?: string;
  taskId?: string;
  weekStart: string;
  percentage: number; // 0-100
}

interface ResourceCapacityPanelProps {
  project: GanttProject;
  zoomMode: ZoomMode;
  isExpanded: boolean;
  onToggleExpand: () => void;
  sidebarWidth: number;
}

// Hook for responsive behavior
function useResponsive() {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowWidth < TOKENS.breakpoints.mobile,
    isTablet: windowWidth >= TOKENS.breakpoints.mobile && windowWidth < TOKENS.breakpoints.tablet,
    windowWidth,
  };
}

// Allocation Edit Modal Component
function AllocationEditModal({
  isOpen,
  onClose,
  resource,
  phases,
  weekStart,
  currentAllocation,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  phases: GanttPhase[];
  weekStart: string;
  currentAllocation?: AllocationData;
  onSave: (allocation: AllocationData) => void;
}) {
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(currentAllocation?.phaseId || "");
  const [selectedTaskId, setSelectedTaskId] = useState<string>(currentAllocation?.taskId || "");
  const [percentage, setPercentage] = useState<number>(currentAllocation?.percentage || 100);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);
  const tasks = selectedPhase?.tasks || [];
  const presets = [20, 40, 50, 60, 80, 100];

  const handleSave = () => {
    onSave({
      resourceId: resource.id,
      phaseId: selectedPhaseId || undefined,
      taskId: selectedTaskId || undefined,
      weekStart,
      percentage,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: TOKENS.colors.bg.primary,
          borderRadius: 12,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: TOKENS.typography.size.md,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
                margin: 0,
                fontFamily: TOKENS.typography.family,
              }}
            >
              Allocate Resource
            </h3>
            <p
              style={{
                fontSize: TOKENS.typography.size.xs,
                color: TOKENS.colors.text.tertiary,
                margin: 0,
                marginTop: 2,
                fontFamily: TOKENS.typography.family,
              }}
            >
              {resource.name} - Week of {format(new Date(weekStart), "dd MMM yyyy")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} style={{ color: TOKENS.colors.text.secondary }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Phase Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.primary,
                marginBottom: 8,
                fontFamily: TOKENS.typography.family,
              }}
            >
              Phase
            </label>
            <select
              value={selectedPhaseId}
              onChange={(e) => {
                setSelectedPhaseId(e.target.value);
                setSelectedTaskId("");
              }}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: `1px solid ${TOKENS.colors.border.default}`,
                fontSize: TOKENS.typography.size.sm,
                backgroundColor: TOKENS.colors.bg.primary,
                minHeight: 44,
                fontFamily: TOKENS.typography.family,
              }}
            >
              <option value="">Select Phase...</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Selection */}
          {selectedPhaseId && tasks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: TOKENS.typography.size.sm,
                  fontWeight: TOKENS.typography.weight.medium,
                  color: TOKENS.colors.text.primary,
                  marginBottom: 8,
                  fontFamily: TOKENS.typography.family,
                }}
              >
                Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: `1px solid ${TOKENS.colors.border.default}`,
                  fontSize: TOKENS.typography.size.sm,
                  backgroundColor: TOKENS.colors.bg.primary,
                  minHeight: 44,
                  fontFamily: TOKENS.typography.family,
                }}
              >
                <option value="">All phase tasks</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Percentage */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.medium,
                color: TOKENS.colors.text.primary,
                marginBottom: 8,
                fontFamily: TOKENS.typography.family,
              }}
            >
              Allocation Percentage
            </label>

            {/* Preset buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {presets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setPercentage(preset)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px solid ${percentage === preset ? TOKENS.colors.accent.blue : TOKENS.colors.border.default}`,
                    backgroundColor: percentage === preset ? TOKENS.colors.accent.blue : TOKENS.colors.bg.primary,
                    color: percentage === preset ? "#FFFFFF" : TOKENS.colors.text.primary,
                    fontSize: TOKENS.typography.size.sm,
                    fontWeight: TOKENS.typography.weight.medium,
                    cursor: "pointer",
                    minWidth: 48,
                    minHeight: 36,
                    fontFamily: TOKENS.typography.family,
                  }}
                >
                  {preset}%
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min="0"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: `1px solid ${TOKENS.colors.border.default}`,
                  fontSize: TOKENS.typography.size.sm,
                  minHeight: 44,
                  fontFamily: TOKENS.typography.family,
                }}
              />
              <span style={{ color: TOKENS.colors.text.secondary, fontSize: TOKENS.typography.size.sm }}>%</span>
            </div>

            {/* Visual indicator */}
            <div
              style={{
                marginTop: 12,
                height: 8,
                backgroundColor: TOKENS.colors.border.subtle,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  backgroundColor: TOKENS.colors.accent.blue,
                  transition: "width 0.2s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: TOKENS.typography.size.xs,
                color: TOKENS.colors.text.tertiary,
                marginTop: 4,
                fontFamily: TOKENS.typography.family,
              }}
            >
              {percentage}% = {((percentage / 100) * 5).toFixed(1)} man-days per week
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${TOKENS.colors.border.default}`,
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: `1px solid ${TOKENS.colors.border.default}`,
              backgroundColor: TOKENS.colors.bg.primary,
              color: TOKENS.colors.text.primary,
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.medium,
              cursor: "pointer",
              minHeight: 44,
              fontFamily: TOKENS.typography.family,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: TOKENS.colors.accent.blue,
              color: "#FFFFFF",
              fontSize: TOKENS.typography.size.sm,
              fontWeight: TOKENS.typography.weight.medium,
              cursor: "pointer",
              minHeight: 44,
              fontFamily: TOKENS.typography.family,
            }}
          >
            Save Allocation
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResourceCapacityPanel({
  project,
  zoomMode,
  isExpanded,
  onToggleExpand,
  sidebarWidth,
}: ResourceCapacityPanelProps) {
  const { isMobile, isTablet } = useResponsive();

  // Local state
  const [allocations, setAllocations] = useState<AllocationData[]>([]);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    resource: Resource | null;
    weekStart: string;
    currentAllocation?: AllocationData;
  }>({ isOpen: false, resource: null, weekStart: "" });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const resources = project.resources || [];
  const phases = project.phases || [];
  const totalResources = getTotalResourceCount(project);

  // Company logos and sub-companies from OrgChartPro (single source of truth)
  const companyLogos = project.orgChartPro?.companyLogos || {};
  const subCompanies = project.orgChartPro?.subCompanies || [];

  // Responsive sidebar width
  const effectiveSidebarWidth = isMobile ? 200 : isTablet ? Math.min(sidebarWidth, 350) : sidebarWidth;

  // Calculate timeline bounds (same logic as GanttCanvasV3)
  const timelineBounds = useMemo(() => {
    if (!phases || phases.length === 0) return null;

    let earliestStart = new Date(phases[0].startDate);
    let latestEnd = new Date(phases[0].endDate);

    phases.forEach((phase) => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      if (phaseStart < earliestStart) earliestStart = phaseStart;
      if (phaseEnd > latestEnd) latestEnd = phaseEnd;

      phase.tasks?.forEach((task) => {
        const taskStart = new Date(task.startDate);
        const taskEnd = new Date(task.endDate);
        if (taskStart < earliestStart) earliestStart = taskStart;
        if (taskEnd > latestEnd) latestEnd = taskEnd;
      });
    });

    return { startDate: earliestStart, endDate: latestEnd };
  }, [phases]);

  // Calculate extended duration (same as GanttCanvasV3)
  const extendedDuration = useMemo(() => {
    if (!timelineBounds) return 0;

    const { startDate: start, endDate: end } = timelineBounds;

    let extendedEnd: Date;
    switch (zoomMode) {
      case "day":
        extendedEnd = addDays(end, 7);
        break;
      case "week":
        extendedEnd = addDays(end, 7);
        break;
      case "month":
        extendedEnd = endOfMonth(end);
        break;
      case "quarter":
        extendedEnd = endOfQuarter(end);
        break;
      case "year":
        extendedEnd = endOfYear(end);
        break;
      default:
        extendedEnd = endOfMonth(end);
    }

    return differenceInDays(extendedEnd, start) + 1;
  }, [timelineBounds, zoomMode]);

  // Generate time markers (same as GanttCanvasV3)
  const timeMarkers = useMemo(() => {
    if (!timelineBounds) return [];

    const { startDate: start, endDate: end } = timelineBounds;

    let extendedEnd: Date;
    switch (zoomMode) {
      case "day":
        extendedEnd = addDays(end, 7);
        break;
      case "week":
        extendedEnd = addDays(end, 7);
        break;
      case "month":
        extendedEnd = endOfMonth(end);
        break;
      case "quarter":
        extendedEnd = endOfQuarter(end);
        break;
      case "year":
        extendedEnd = endOfYear(end);
        break;
      default:
        extendedEnd = endOfMonth(end);
    }

    let dates: Date[] = [];
    switch (zoomMode) {
      case "day":
        dates = eachDayOfInterval({ start, end: extendedEnd });
        break;
      case "week":
        dates = eachWeekOfInterval({ start, end: extendedEnd }, { weekStartsOn: 1 });
        break;
      case "month":
        dates = eachMonthOfInterval({ start, end: extendedEnd });
        break;
      case "quarter":
        dates = eachQuarterOfInterval({ start, end: extendedEnd });
        break;
      case "year":
        dates = eachYearOfInterval({ start, end: extendedEnd });
        break;
      default:
        dates = eachMonthOfInterval({ start, end: extendedEnd });
    }

    return dates;
  }, [timelineBounds, zoomMode]);

  // Get position percent (same as GanttCanvasV3)
  const getPositionPercent = useCallback(
    (date: Date) => {
      if (!timelineBounds || !extendedDuration) return 0;
      const dayOffset = differenceInDays(date, timelineBounds.startDate);
      return (dayOffset / extendedDuration) * 100;
    },
    [timelineBounds, extendedDuration]
  );

  // Sort resources like OrgChartPro
  const sortedResources = useMemo(() => {
    return [...resources].sort((a, b) => {
      const aIsRoot = !a.managerResourceId ? 0 : 1;
      const bIsRoot = !b.managerResourceId ? 0 : 1;
      if (aIsRoot !== bIsRoot) return aIsRoot - bIsRoot;

      const aCategoryOrder = CATEGORY_SORT_ORDER[a.category] ?? 8;
      const bCategoryOrder = CATEGORY_SORT_ORDER[b.category] ?? 8;
      if (aCategoryOrder !== bCategoryOrder) return aCategoryOrder - bCategoryOrder;

      return a.name.localeCompare(b.name);
    });
  }, [resources]);

  // Get allocation for a cell
  const getAllocation = useCallback(
    (resourceId: string, weekKey: string): number => {
      const allocation = allocations.find(
        (a) => a.resourceId === resourceId && a.weekStart === weekKey
      );
      return allocation ? (allocation.percentage / 100) * 5 : 0;
    },
    [allocations]
  );

  // Handle cell double-click
  const handleCellDoubleClick = useCallback(
    (resource: Resource, weekStart: string) => {
      const existing = allocations.find(
        (a) => a.resourceId === resource.id && a.weekStart === weekStart
      );
      setEditModal({
        isOpen: true,
        resource,
        weekStart,
        currentAllocation: existing,
      });
    },
    [allocations]
  );

  // Handle cell single click (quick toggle)
  const handleCellClick = useCallback((resourceId: string, weekKey: string) => {
    setAllocations((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.resourceId === resourceId && a.weekStart === weekKey
      );
      if (existingIdx >= 0) {
        return prev.filter((_, i) => i !== existingIdx);
      } else {
        return [...prev, { resourceId, weekStart: weekKey, percentage: 100 }];
      }
    });
  }, []);

  // Save allocation from modal
  const handleSaveAllocation = useCallback((allocation: AllocationData) => {
    setAllocations((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.resourceId === allocation.resourceId && a.weekStart === allocation.weekStart
      );
      if (allocation.percentage === 0) {
        return existingIdx >= 0 ? prev.filter((_, i) => i !== existingIdx) : prev;
      }
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = allocation;
        return updated;
      }
      return [...prev, allocation];
    });
  }, []);

  // Calculate total allocated man-days
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, a) => sum + (a.percentage / 100) * 5, 0);
  }, [allocations]);

  if (resources.length === 0 || !timelineBounds) {
    return null;
  }

  return (
    <>
      {/* No outer container border - integrates seamlessly with GanttCanvasV3 above */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-primary)', // Same CSS variable as GanttCanvasV3
          fontFamily: TOKENS.typography.family,
          marginTop: -1, // Slight overlap to eliminate any visual seam with GanttCanvasV3
        }}
      >
        {/* Panel Header - NO border, seamless continuation of Gantt chart */}
        <button
          onClick={onToggleExpand}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: isMobile ? "12px" : "8px 16px",
            backgroundColor: 'var(--color-bg-primary)', // Same CSS variable as GanttCanvasV3
            border: "none",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isExpanded ? (
              <ChevronDown size={16} style={{ color: TOKENS.colors.text.secondary }} />
            ) : (
              <ChevronRight size={16} style={{ color: TOKENS.colors.text.secondary }} />
            )}
            <Users size={16} style={{ color: TOKENS.colors.accent.blue }} />
            <span
              style={{
                fontSize: TOKENS.typography.size.sm,
                fontWeight: TOKENS.typography.weight.semibold,
                color: TOKENS.colors.text.primary,
              }}
            >
              Resource Capacity
            </span>
            <span
              style={{
                fontSize: TOKENS.typography.size.xs,
                color: TOKENS.colors.text.tertiary,
              }}
            >
              {totalResources} resources | {totalAllocated.toFixed(1)} man-days allocated
            </span>
          </div>
          {!isMobile && (
            <span style={{ fontSize: TOKENS.typography.size.xs, color: TOKENS.colors.text.tertiary }}>
              {isExpanded ? "Collapse" : "Expand"} | Double-click cells to edit
            </span>
          )}
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div style={{ display: "flex", maxHeight: 400, overflow: "hidden" }}>
            {/* Fixed Resource Names Column - OrgChart Style */}
            <div
              style={{
                width: effectiveSidebarWidth,
                flexShrink: 0,
                borderRight: `1px solid ${TOKENS.colors.border.default}`,
                backgroundColor: TOKENS.colors.bg.primary,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {sortedResources.map((resource) => {
                const category = RESOURCE_CATEGORIES[resource.category] || RESOURCE_CATEGORIES.other;
                const manager = resources.find((r) => r.id === resource.managerResourceId);

                // Company logo logic (same as OrgChartPro - single source of truth)
                const resourceSubCompany = resource.companyName
                  ? subCompanies.find((sc: SubCompanyInfo) => sc.name === resource.companyName)
                  : undefined;
                const logo = resource.companyName
                  ? (resourceSubCompany ? companyLogos[resourceSubCompany.parentCompany] : companyLogos[resource.companyName])
                  : undefined;
                const indicatorColor = resourceSubCompany?.indicatorColor;

                return (
                  <div
                    key={resource.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      height: ROW_HEIGHT,
                      padding: "8px 16px",
                      borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                    }}
                  >
                    {/* Avatar with company logo or category initial */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {logo ? (
                        <img
                          src={logo}
                          alt={resource.companyName || ""}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            objectFit: "contain",
                            backgroundColor: "#fff",
                            border: `1px solid ${TOKENS.colors.border.subtle}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: category.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          {resource.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Sub-company indicator dot */}
                      {indicatorColor && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: indicatorColor,
                            border: "1.5px solid white",
                          }}
                        />
                      )}
                    </div>

                    {/* Name & Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: TOKENS.typography.size.sm,
                            fontWeight: TOKENS.typography.weight.semibold,
                            color: TOKENS.colors.text.primary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {resource.name}
                        </span>
                        {/* ROOT badge */}
                        {!resource.managerResourceId && (
                          <span
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              backgroundColor: "rgba(52, 199, 89, 0.12)",
                              color: TOKENS.colors.accent.green,
                              fontSize: 9,
                              fontWeight: TOKENS.typography.weight.semibold,
                              textTransform: "uppercase",
                              letterSpacing: 0.3,
                              flexShrink: 0,
                            }}
                          >
                            Root
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: TOKENS.typography.size.xs,
                          color: TOKENS.colors.text.secondary,
                          marginTop: 2,
                        }}
                      >
                        {category.label}
                      </div>
                      {/* Reports To */}
                      {manager && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            style={{ flexShrink: 0, opacity: 0.6 }}
                          >
                            <path
                              d="M5 2V6M5 6L3 4M5 6L7 4M2 8H8"
                              stroke={TOKENS.colors.text.tertiary}
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            style={{
                              fontSize: 10,
                              color: TOKENS.colors.text.tertiary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            Reports to{" "}
                            <span style={{ color: TOKENS.colors.text.secondary, fontWeight: 500 }}>
                              {manager.name}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Grid - Aligned with Gantt */}
            <div
              ref={scrollContainerRef}
              style={{
                flex: 1,
                overflowX: "auto",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {/* No timeline header - it's provided by GanttCanvasV3 above */}
              <div style={{ position: "relative", width: "100%" }}>
                {sortedResources.map((resource) => (
                  <div
                    key={resource.id}
                    style={{
                      height: ROW_HEIGHT,
                      borderBottom: `1px solid ${TOKENS.colors.border.subtle}`,
                      position: "relative",
                    }}
                  >
                    {timeMarkers.map((markerDate, idx) => {
                      const left = getPositionPercent(markerDate);
                      let width: number;
                      if (idx < timeMarkers.length - 1) {
                        width = getPositionPercent(timeMarkers[idx + 1]) - left;
                      } else {
                        width = 100 - left;
                      }

                      const weekKey = format(markerDate, "yyyy-MM-dd");
                      const mandays = getAllocation(resource.id, weekKey);
                      const mandaysRounded = Math.round(mandays);
                      const bgColor =
                        mandays > 5
                          ? TOKENS.colors.overAllocated
                          : TOKENS.colors.capacity[mandaysRounded] || TOKENS.colors.capacity[0];
                      const textColor =
                        mandaysRounded >= 4 ? TOKENS.colors.text.onBlue : TOKENS.colors.text.primary;

                      return (
                        <div
                          key={weekKey}
                          onClick={() => handleCellClick(resource.id, weekKey)}
                          onDoubleClick={() => handleCellDoubleClick(resource, weekKey)}
                          style={{
                            position: "absolute",
                            left: `${left}%`,
                            width: `${width}%`,
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: bgColor,
                            borderRight: `1px solid ${TOKENS.colors.border.subtle}`,
                            cursor: "pointer",
                            boxSizing: "border-box",
                            transition: "background-color 0.15s ease",
                          }}
                          title={`${resource.name}: ${mandays.toFixed(1)} man-days\nDouble-click to edit`}
                        >
                          {mandays > 0 && (
                            <span
                              style={{
                                fontSize: TOKENS.typography.size.xs,
                                fontWeight: TOKENS.typography.weight.semibold,
                                color: textColor,
                              }}
                            >
                              {mandays.toFixed(1)}
                            </span>
                          )}
                          {mandays > 5 && (
                            <AlertTriangle
                              size={10}
                              style={{ color: TOKENS.colors.accent.red, marginLeft: 2 }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Allocation Edit Modal */}
      {editModal.resource && (
        <AllocationEditModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, resource: null, weekStart: "" })}
          resource={editModal.resource}
          phases={phases}
          weekStart={editModal.weekStart}
          currentAllocation={editModal.currentAllocation}
          onSave={handleSaveAllocation}
        />
      )}
    </>
  );
}
