"use client";

/**
 * Resource Dashboard Modal
 *
 * Full-screen modal providing comprehensive resource analytics:
 * - Summary KPIs (Total Resources, Utilization, Overallocated, Effort Days)
 * - Utilization Heatmap (Resources × Weeks)
 * - Category & Designation Breakdowns
 * - At-Risk Resources Table
 *
 * Design: Apple HIG compliant, minimal, enterprise-grade
 * Policy: No emojis, no decorative icons, typography-driven hierarchy
 */

import React, { useState, useMemo, useCallback } from "react";
import { X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import {
  useResourceMetrics,
  useResourceMetricsWithTimeline,
  useCategoryMetrics,
  useDesignationMetrics,
  useResourceAnalyticsSummary,
  type ResourceMetrics,
  type ResourceWithTimeline,
  type CategoryMetrics,
  type DesignationMetrics,
} from "@/stores/resource-analytics-selectors";

// ============================================================================
// Types
// ============================================================================

interface ResourceDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

type TabId = "overview" | "utilization" | "breakdown";

// ============================================================================
// Design Tokens (Apple HIG compliant)
// ============================================================================

const TOKENS = {
  colors: {
    text: {
      primary: "#1D1D1F",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
    },
    border: "#E5E7EB",
    borderFocus: "#007AFF",
    surface: "#F9FAFB",
    blue: "#007AFF",
    green: "#34C759",
    orange: "#FF9500",
    red: "#FF3B30",
    // Heatmap colors
    heatmap: {
      empty: "#F3F4F6",
      low: "#DBEAFE",      // 1-30%
      medium: "#93C5FD",   // 31-60%
      healthy: "#34C759",  // 61-80%
      atRisk: "#FF9500",   // 81-100%
      over: "#FF3B30",     // >100%
    },
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

function getUtilizationColor(percent: number): string {
  if (percent === 0) return TOKENS.colors.heatmap.empty;
  if (percent <= 30) return TOKENS.colors.heatmap.low;
  if (percent <= 60) return TOKENS.colors.heatmap.medium;
  if (percent <= 80) return TOKENS.colors.heatmap.healthy;
  if (percent <= 100) return TOKENS.colors.heatmap.atRisk;
  return TOKENS.colors.heatmap.over;
}

function getUtilizationLabel(percent: number): string {
  if (percent === 0) return "Unallocated";
  if (percent <= 30) return "Light";
  if (percent <= 60) return "Moderate";
  if (percent <= 80) return "Healthy";
  if (percent <= 100) return "At Risk";
  return "Overallocated";
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatDays(value: number): string {
  if (value === 0) return "0";
  if (value < 1) return value.toFixed(1);
  return Math.round(value).toString();
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Summary KPI Card
 */
function KPICard({
  label,
  value,
  sublabel,
  status,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  status?: "normal" | "warning" | "danger";
}) {
  const statusColor =
    status === "danger"
      ? TOKENS.colors.red
      : status === "warning"
      ? TOKENS.colors.orange
      : TOKENS.colors.text.primary;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: `1px solid ${TOKENS.colors.border}`,
        borderRadius: TOKENS.radius.md,
        padding: TOKENS.spacing.lg,
        minWidth: "140px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: TOKENS.colors.text.tertiary,
          marginBottom: TOKENS.spacing.sm,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "28px",
          fontWeight: 600,
          color: statusColor,
          lineHeight: 1.1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: "12px",
            color: TOKENS.colors.text.secondary,
            marginTop: TOKENS.spacing.xs,
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

/**
 * Tab Navigation
 */
function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "utilization", label: "Utilization" },
    { id: "breakdown", label: "Breakdown" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: TOKENS.spacing.xs,
        padding: TOKENS.spacing.xs,
        backgroundColor: TOKENS.colors.surface,
        borderRadius: TOKENS.radius.md,
        marginBottom: TOKENS.spacing.xl,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
            fontSize: "13px",
            fontWeight: 500,
            border: "none",
            borderRadius: TOKENS.radius.sm,
            cursor: "pointer",
            transition: "all 0.15s ease",
            backgroundColor: activeTab === tab.id ? "#FFFFFF" : "transparent",
            color:
              activeTab === tab.id
                ? TOKENS.colors.text.primary
                : TOKENS.colors.text.secondary,
            boxShadow:
              activeTab === tab.id
                ? "0 1px 3px rgba(0, 0, 0, 0.1)"
                : "none",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Section Header
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <h3
      style={{
        fontSize: "14px",
        fontWeight: 600,
        color: TOKENS.colors.text.primary,
        marginBottom: TOKENS.spacing.lg,
        paddingBottom: TOKENS.spacing.sm,
        borderBottom: `1px solid ${TOKENS.colors.border}`,
      }}
    >
      {title}
    </h3>
  );
}

/**
 * Utilization Heatmap Legend
 */
function HeatmapLegend() {
  const items = [
    { color: TOKENS.colors.heatmap.empty, label: "0%" },
    { color: TOKENS.colors.heatmap.low, label: "1-30%" },
    { color: TOKENS.colors.heatmap.medium, label: "31-60%" },
    { color: TOKENS.colors.heatmap.healthy, label: "61-80%" },
    { color: TOKENS.colors.heatmap.atRisk, label: "81-100%" },
    { color: TOKENS.colors.heatmap.over, label: ">100%" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: TOKENS.spacing.lg,
        flexWrap: "wrap",
        marginBottom: TOKENS.spacing.lg,
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.xs }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "2px",
              backgroundColor: item.color,
              border: `1px solid ${TOKENS.colors.border}`,
            }}
          />
          <span style={{ fontSize: "11px", color: TOKENS.colors.text.secondary }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Utilization Heatmap Grid
 */
function UtilizationHeatmap({
  resources,
}: {
  resources: ResourceWithTimeline[];
}) {
  if (resources.length === 0) {
    return (
      <div
        style={{
          padding: TOKENS.spacing.xxl,
          textAlign: "center",
          color: TOKENS.colors.text.secondary,
        }}
      >
        No resource data available. Assign resources to tasks to see utilization.
      </div>
    );
  }

  // Get all unique weeks across all resources
  const allWeeks = resources[0]?.timeline || [];
  const maxWeeksToShow = 12; // Limit for readability
  const weeksToShow = allWeeks.slice(0, maxWeeksToShow);

  return (
    <div style={{ overflowX: "auto" }}>
      <HeatmapLegend />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `160px repeat(${weeksToShow.length}, minmax(50px, 1fr))`,
          gap: "2px",
          fontSize: "11px",
        }}
      >
        {/* Header Row */}
        <div
          style={{
            padding: TOKENS.spacing.sm,
            fontWeight: 600,
            color: TOKENS.colors.text.secondary,
            backgroundColor: TOKENS.colors.surface,
            borderRadius: `${TOKENS.radius.sm} 0 0 0`,
          }}
        >
          Resource
        </div>
        {weeksToShow.map((week, idx) => (
          <div
            key={week.weekLabel}
            style={{
              padding: TOKENS.spacing.sm,
              textAlign: "center",
              fontWeight: 500,
              color: TOKENS.colors.text.secondary,
              backgroundColor: TOKENS.colors.surface,
              borderRadius: idx === weeksToShow.length - 1 ? `0 ${TOKENS.radius.sm} 0 0` : "0",
            }}
          >
            {week.weekLabel}
          </div>
        ))}

        {/* Data Rows */}
        {resources.map((resource) => (
          <React.Fragment key={resource.resourceId}>
            <div
              style={{
                padding: TOKENS.spacing.sm,
                color: TOKENS.colors.text.primary,
                backgroundColor: "#FFFFFF",
                borderBottom: `1px solid ${TOKENS.colors.border}`,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "flex",
                alignItems: "center",
                gap: TOKENS.spacing.xs,
              }}
              title={resource.resourceName}
            >
              {resource.peakAllocation > 100 && (
                <AlertTriangle
                  size={12}
                  style={{ color: TOKENS.colors.red, flexShrink: 0 }}
                />
              )}
              <span>{resource.resourceName}</span>
            </div>
            {resource.timeline.slice(0, maxWeeksToShow).map((week) => (
              <div
                key={`${resource.resourceId}-${week.weekLabel}`}
                style={{
                  padding: TOKENS.spacing.xs,
                  textAlign: "center",
                  backgroundColor: getUtilizationColor(week.allocation),
                  color:
                    week.allocation > 60
                      ? "#FFFFFF"
                      : TOKENS.colors.text.primary,
                  fontWeight: week.allocation > 0 ? 500 : 400,
                  borderBottom: `1px solid ${TOKENS.colors.border}`,
                  cursor: "default",
                  minHeight: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title={`${resource.resourceName}: ${week.allocation}% (${getUtilizationLabel(week.allocation)})`}
              >
                {week.allocation > 0 ? formatPercent(week.allocation) : "-"}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      {allWeeks.length > maxWeeksToShow && (
        <div
          style={{
            marginTop: TOKENS.spacing.md,
            fontSize: "12px",
            color: TOKENS.colors.text.secondary,
            textAlign: "center",
          }}
        >
          Showing first {maxWeeksToShow} of {allWeeks.length} weeks
        </div>
      )}
    </div>
  );
}

/**
 * Category Breakdown Bar Chart
 */
function CategoryBreakdown({ categories }: { categories: CategoryMetrics[] }) {
  if (categories.length === 0) {
    return (
      <div style={{ color: TOKENS.colors.text.secondary, fontSize: "13px" }}>
        No category data available.
      </div>
    );
  }

  const maxEffort = Math.max(...categories.map((c) => c.totalEffortDays));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.md }}>
      {categories.map((category) => {
        const percentage = maxEffort > 0 ? (category.totalEffortDays / maxEffort) * 100 : 0;
        return (
          <div key={category.category}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: TOKENS.spacing.xs,
              }}
            >
              <span style={{ fontSize: "13px", color: TOKENS.colors.text.primary }}>
                {category.category}
              </span>
              <span style={{ fontSize: "13px", color: TOKENS.colors.text.secondary }}>
                {formatDays(category.totalEffortDays)} days ({category.resourceCount} resources)
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: TOKENS.colors.surface,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor: TOKENS.colors.blue,
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Designation Breakdown
 */
function DesignationBreakdown({
  designations,
}: {
  designations: DesignationMetrics[];
}) {
  if (designations.length === 0) {
    return (
      <div style={{ color: TOKENS.colors.text.secondary, fontSize: "13px" }}>
        No designation data available.
      </div>
    );
  }

  const maxEffort = Math.max(...designations.map((d) => d.totalEffortDays));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.md }}>
      {designations.map((designation) => {
        const percentage =
          maxEffort > 0 ? (designation.totalEffortDays / maxEffort) * 100 : 0;
        return (
          <div key={designation.designation}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: TOKENS.spacing.xs,
              }}
            >
              <span style={{ fontSize: "13px", color: TOKENS.colors.text.primary }}>
                {designation.designation}
              </span>
              <span style={{ fontSize: "13px", color: TOKENS.colors.text.secondary }}>
                {formatDays(designation.totalEffortDays)} days ({designation.resourceCount})
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: TOKENS.colors.surface,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${percentage}%`,
                  backgroundColor: TOKENS.colors.green,
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * At-Risk Resources Table
 */
function AtRiskResourcesTable({ resources }: { resources: ResourceMetrics[] }) {
  const atRiskResources = resources.filter((r) => r.peakAllocation > 80);

  if (atRiskResources.length === 0) {
    return (
      <div
        style={{
          padding: TOKENS.spacing.xl,
          textAlign: "center",
          color: TOKENS.colors.text.secondary,
          backgroundColor: TOKENS.colors.surface,
          borderRadius: TOKENS.radius.md,
        }}
      >
        No resources at risk or overallocated.
      </div>
    );
  }

  return (
    <div
      style={{
        border: `1px solid ${TOKENS.colors.border}`,
        borderRadius: TOKENS.radius.md,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
        <thead>
          <tr style={{ backgroundColor: TOKENS.colors.surface }}>
            <th
              style={{
                padding: TOKENS.spacing.md,
                textAlign: "left",
                fontWeight: 600,
                color: TOKENS.colors.text.secondary,
                borderBottom: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              Resource
            </th>
            <th
              style={{
                padding: TOKENS.spacing.md,
                textAlign: "left",
                fontWeight: 600,
                color: TOKENS.colors.text.secondary,
                borderBottom: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              Category
            </th>
            <th
              style={{
                padding: TOKENS.spacing.md,
                textAlign: "right",
                fontWeight: 600,
                color: TOKENS.colors.text.secondary,
                borderBottom: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              Peak Allocation
            </th>
            <th
              style={{
                padding: TOKENS.spacing.md,
                textAlign: "right",
                fontWeight: 600,
                color: TOKENS.colors.text.secondary,
                borderBottom: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              Effort Days
            </th>
            <th
              style={{
                padding: TOKENS.spacing.md,
                textAlign: "center",
                fontWeight: 600,
                color: TOKENS.colors.text.secondary,
                borderBottom: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {atRiskResources.map((resource) => {
            const isOverallocated = resource.peakAllocation > 100;
            return (
              <tr
                key={resource.resourceId}
                style={{
                  backgroundColor: "#FFFFFF",
                }}
              >
                <td
                  style={{
                    padding: TOKENS.spacing.md,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    fontWeight: 500,
                  }}
                >
                  {resource.resourceName}
                </td>
                <td
                  style={{
                    padding: TOKENS.spacing.md,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    color: TOKENS.colors.text.secondary,
                  }}
                >
                  {resource.category}
                </td>
                <td
                  style={{
                    padding: TOKENS.spacing.md,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    textAlign: "right",
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                    color: isOverallocated
                      ? TOKENS.colors.red
                      : TOKENS.colors.orange,
                  }}
                >
                  {formatPercent(resource.peakAllocation)}
                </td>
                <td
                  style={{
                    padding: TOKENS.spacing.md,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatDays(resource.totalEffortDays)}
                </td>
                <td
                  style={{
                    padding: TOKENS.spacing.md,
                    borderBottom: `1px solid ${TOKENS.colors.border}`,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                      borderRadius: TOKENS.radius.sm,
                      fontSize: "11px",
                      fontWeight: 600,
                      backgroundColor: isOverallocated
                        ? "rgba(255, 59, 48, 0.1)"
                        : "rgba(255, 149, 0, 0.1)",
                      color: isOverallocated
                        ? TOKENS.colors.red
                        : TOKENS.colors.orange,
                    }}
                  >
                    {isOverallocated ? "OVERALLOCATED" : "AT RISK"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ResourceDashboardModal({
  isOpen,
  onClose,
  projectName,
}: ResourceDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Fetch analytics data using existing hooks
  const metrics = useResourceMetrics();
  const metricsWithTimeline = useResourceMetricsWithTimeline();
  const categories = useCategoryMetrics();
  const designations = useDesignationMetrics();
  const summary = useResourceAnalyticsSummary();

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Add/remove event listener
  useMemo(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: TOKENS.spacing.lg,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: TOKENS.radius.xl,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="resource-dashboard-title"
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.xl}`,
            borderBottom: `1px solid ${TOKENS.colors.border}`,
          }}
        >
          <div>
            <h2
              id="resource-dashboard-title"
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: TOKENS.colors.text.primary,
                margin: 0,
              }}
            >
              Resource Dashboard
            </h2>
            {projectName && (
              <div
                style={{
                  fontSize: "13px",
                  color: TOKENS.colors.text.secondary,
                  marginTop: TOKENS.spacing.xs,
                }}
              >
                {projectName}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: TOKENS.colors.text.secondary,
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = TOKENS.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            aria-label="Close dashboard"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: TOKENS.spacing.xl,
          }}
        >
          {/* Summary KPIs - Always visible */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: TOKENS.spacing.lg,
              marginBottom: TOKENS.spacing.xl,
            }}
          >
            <KPICard
              label="Total Resources"
              value={summary.totalResources}
              sublabel={`${summary.activeResources} assigned`}
            />
            <KPICard
              label="Avg Utilization"
              value={formatPercent(summary.averageUtilization)}
              sublabel="across all resources"
              status={
                summary.averageUtilization > 90
                  ? "danger"
                  : summary.averageUtilization > 75
                  ? "warning"
                  : "normal"
              }
            />
            <KPICard
              label="Overallocated"
              value={summary.overallocatedResources}
              sublabel="peak > 100%"
              status={summary.overallocatedResources > 0 ? "danger" : "normal"}
            />
            <KPICard
              label="Total Effort"
              value={formatDays(summary.totalEffortDays)}
              sublabel="person-days"
            />
          </div>

          {/* Tab Navigation */}
          <TabNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: TOKENS.spacing.xl,
              }}
            >
              {/* Category Breakdown */}
              <div>
                <SectionHeader title="Effort by Category" />
                <CategoryBreakdown categories={categories} />
              </div>

              {/* Designation Breakdown */}
              <div>
                <SectionHeader title="Effort by Designation" />
                <DesignationBreakdown designations={designations} />
              </div>

              {/* At-Risk Resources */}
              <div style={{ gridColumn: "1 / -1" }}>
                <SectionHeader title="At-Risk Resources" />
                <AtRiskResourcesTable resources={metrics} />
              </div>
            </div>
          )}

          {activeTab === "utilization" && (
            <div>
              <SectionHeader title="Weekly Utilization Heatmap" />
              <UtilizationHeatmap resources={metricsWithTimeline} />
            </div>
          )}

          {activeTab === "breakdown" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: TOKENS.spacing.xl,
              }}
            >
              {/* Category Breakdown - Full view */}
              <div>
                <SectionHeader title="Category Distribution" />
                <CategoryBreakdown categories={categories} />
                <div
                  style={{
                    marginTop: TOKENS.spacing.xl,
                    padding: TOKENS.spacing.lg,
                    backgroundColor: TOKENS.colors.surface,
                    borderRadius: TOKENS.radius.md,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: TOKENS.spacing.md,
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <span style={{ color: TOKENS.colors.text.secondary }}>
                        Total Categories
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: TOKENS.spacing.xs,
                        }}
                      >
                        {categories.length}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: TOKENS.colors.text.secondary }}>
                        Avg Utilization
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: TOKENS.spacing.xs,
                        }}
                      >
                        {formatPercent(
                          categories.reduce((sum, c) => sum + c.averageUtilization, 0) /
                            (categories.length || 1)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Designation Breakdown - Full view */}
              <div>
                <SectionHeader title="Designation Distribution" />
                <DesignationBreakdown designations={designations} />
                <div
                  style={{
                    marginTop: TOKENS.spacing.xl,
                    padding: TOKENS.spacing.lg,
                    backgroundColor: TOKENS.colors.surface,
                    borderRadius: TOKENS.radius.md,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: TOKENS.spacing.md,
                      fontSize: "12px",
                    }}
                  >
                    <div>
                      <span style={{ color: TOKENS.colors.text.secondary }}>
                        Total Designations
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: TOKENS.spacing.xs,
                        }}
                      >
                        {designations.length}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: TOKENS.colors.text.secondary }}>
                        Avg Utilization
                      </span>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "16px",
                          marginTop: TOKENS.spacing.xs,
                        }}
                      >
                        {formatPercent(
                          designations.reduce((sum, d) => sum + d.averageUtilization, 0) /
                            (designations.length || 1)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResourceDashboardModal;
