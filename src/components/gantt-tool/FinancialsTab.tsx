"use client";

/**
 * Financials Tab - Protected Cost & Revenue Analysis
 *
 * SECURITY: Three-tier visibility model (server-enforced)
 * - PUBLIC: No access (tab not rendered)
 * - PRESALES_AND_FINANCE: Revenue data only (GSR, NSR)
 * - FINANCE_ONLY: Full access (margins, costs, internal rates)
 *
 * Design Philosophy (Jobs/Ive):
 * - Clean, minimal interface showing only what matters
 * - Numbers at-a-glance with clear visual hierarchy
 * - No clutter - information density matches authorization level
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  BarChart3,
  PieChart,
  Calculator,
} from "lucide-react";
import type { GanttProject } from "@/types/gantt-tool";
import { CostVisibilityLevel } from "@prisma/client";

// Design tokens - Apple HIG compliant
const TOKENS = {
  colors: {
    text: {
      primary: "#1D1D1F",
      secondary: "#6B7280",
      tertiary: "#9CA3AF",
      onBlue: "#FFFFFF",
    },
    border: "#E5E7EB",
    borderLight: "#F3F4F6",
    success: "#34C759",
    warning: "#FF9500",
    danger: "#FF3B30",
    blue: "#007AFF",
    purple: "#AF52DE",
    green: "#30D158",
    teal: "#5AC8FA",
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
  typography: {
    fontFamily:
      'var(--font-text), -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: "11px",
      sm: "13px",
      md: "15px",
      lg: "17px",
      xl: "20px",
      xxl: "28px",
      xxxl: "34px",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

interface FinancialsTabProps {
  project: GanttProject;
}

interface CostingData {
  projectId: string;
  versionNumber: number;
  // Revenue (PRESALES_AND_FINANCE+)
  grossServiceRevenue?: number;
  netServiceRevenue?: number;
  // Confidential (FINANCE_ONLY)
  internalCost?: number;
  subcontractorCost?: number;
  outOfPocketExpense?: number;
  grossMargin?: number;
  marginPercentage?: number;
  visibilityLevel: CostVisibilityLevel;
}

interface BreakdownData {
  byRegion?: Array<{
    region: string;
    totalMandays: number;
    totalNSR: number;
    totalCost?: number;
    margin?: number;
  }>;
  byDesignation?: Array<{
    designation: string;
    count: number;
    totalMandays: number;
    totalNSR: number;
    averageUtilization: number;
  }>;
}

export function FinancialsTab({ project }: FinancialsTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costingData, setCostingData] = useState<CostingData | null>(null);
  const [breakdownData, setBreakdownData] = useState<BreakdownData | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [visibilityLevel, setVisibilityLevel] = useState<CostVisibilityLevel>("PUBLIC");

  // Fetch costing data
  const fetchCostingData = useCallback(async () => {
    if (!project?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gantt-tool/team-capacity/costing?projectId=${project.id}`
      );

      if (response.status === 403) {
        setError("You don't have permission to view financial data for this project.");
        setVisibilityLevel("PUBLIC");
        return;
      }

      if (response.status === 404) {
        // No costing data yet - offer to calculate
        setError(null);
        setCostingData(null);
        // Still fetch visibility level from a calculation
        await recalculateCosting();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch costing data");
      }

      const data = await response.json();
      setCostingData(data.costing);
      setVisibilityLevel(data.visibilityLevel || "PUBLIC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [project?.id]);

  // Recalculate costing
  const recalculateCosting = useCallback(async () => {
    if (!project?.id) return;

    setIsRecalculating(true);
    setError(null);

    try {
      const response = await fetch("/api/gantt-tool/team-capacity/costing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          includeSubcontractors: true,
          includeOPE: true,
          saveToDatabase: true,
        }),
      });

      if (response.status === 403) {
        setError("You don't have permission to calculate costs for this project.");
        setVisibilityLevel("PUBLIC");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to calculate costing");
      }

      const data = await response.json();
      setCostingData(data.costing);
      setBreakdownData(data.breakdown || null);
      setVisibilityLevel(data.costing?.visibilityLevel || "PUBLIC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRecalculating(false);
      setIsLoading(false);
    }
  }, [project?.id]);

  // Initial load
  useEffect(() => {
    fetchCostingData();
  }, [fetchCostingData]);

  // Format currency
  const formatCurrency = (value: number | undefined, decimals = 0): string => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return "-";
    return `${value.toFixed(1)}%`;
  };

  // Determine what can be shown based on visibility level
  const canSeeRevenue =
    visibilityLevel === "PRESALES_AND_FINANCE" || visibilityLevel === "FINANCE_ONLY";
  const canSeeMargins = visibilityLevel === "FINANCE_ONLY";

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!costingData) return null;

    const totalCost =
      (costingData.internalCost || 0) +
      (costingData.subcontractorCost || 0) +
      (costingData.outOfPocketExpense || 0);

    return {
      totalCost,
      realizationRate:
        costingData.grossServiceRevenue && costingData.netServiceRevenue
          ? (costingData.netServiceRevenue / costingData.grossServiceRevenue) * 100
          : 0,
    };
  }, [costingData]);

  // Loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "400px",
          padding: TOKENS.spacing.xxl,
          textAlign: "center",
        }}
      >
        <Loader2
          size={32}
          style={{
            color: TOKENS.colors.blue,
            animation: "spin 1s linear infinite",
            marginBottom: TOKENS.spacing.lg,
          }}
        />
        <p
          style={{
            fontSize: TOKENS.typography.fontSize.md,
            color: TOKENS.colors.text.secondary,
          }}
        >
          Loading financial data...
        </p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state (no access)
  if (error && visibilityLevel === "PUBLIC") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "400px",
          padding: TOKENS.spacing.xxl,
          textAlign: "center",
        }}
      >
        <Lock
          size={48}
          style={{ color: TOKENS.colors.text.tertiary, marginBottom: TOKENS.spacing.lg }}
        />
        <h2
          style={{
            fontSize: TOKENS.typography.fontSize.xl,
            fontWeight: TOKENS.typography.fontWeight.semibold,
            color: TOKENS.colors.text.primary,
            marginBottom: TOKENS.spacing.sm,
          }}
        >
          Access Restricted
        </h2>
        <p
          style={{
            fontSize: TOKENS.typography.fontSize.md,
            color: TOKENS.colors.text.secondary,
            maxWidth: "400px",
            lineHeight: 1.5,
          }}
        >
          Financial data is restricted to authorized personnel. Contact your project owner or
          administrator if you need access.
        </p>
      </div>
    );
  }

  // No data yet - offer to calculate
  if (!costingData && !error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: "400px",
          padding: TOKENS.spacing.xxl,
          textAlign: "center",
        }}
      >
        <Calculator
          size={48}
          style={{ color: TOKENS.colors.blue, marginBottom: TOKENS.spacing.lg }}
        />
        <h2
          style={{
            fontSize: TOKENS.typography.fontSize.xl,
            fontWeight: TOKENS.typography.fontWeight.semibold,
            color: TOKENS.colors.text.primary,
            marginBottom: TOKENS.spacing.sm,
          }}
        >
          No Financial Data
        </h2>
        <p
          style={{
            fontSize: TOKENS.typography.fontSize.md,
            color: TOKENS.colors.text.secondary,
            maxWidth: "400px",
            lineHeight: 1.5,
            marginBottom: TOKENS.spacing.xl,
          }}
        >
          Financial data hasn't been calculated for this project yet. Calculate now to see revenue,
          costs, and margin analysis.
        </p>
        <button
          onClick={recalculateCosting}
          disabled={isRecalculating}
          style={{
            display: "flex",
            alignItems: "center",
            gap: TOKENS.spacing.sm,
            padding: `${TOKENS.spacing.md} ${TOKENS.spacing.xl}`,
            backgroundColor: TOKENS.colors.blue,
            color: TOKENS.colors.text.onBlue,
            border: "none",
            borderRadius: TOKENS.radius.md,
            fontSize: TOKENS.typography.fontSize.md,
            fontWeight: TOKENS.typography.fontWeight.semibold,
            cursor: isRecalculating ? "wait" : "pointer",
            opacity: isRecalculating ? 0.7 : 1,
            transition: "all 0.15s ease",
          }}
        >
          {isRecalculating ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              Calculating...
            </>
          ) : (
            <>
              <Calculator size={16} />
              Calculate Financials
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "#FAFAFA",
        fontFamily: TOKENS.typography.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.xl}`,
          borderBottom: `1px solid ${TOKENS.colors.border}`,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: TOKENS.spacing.md,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.sm }}>
              <h2
                style={{
                  fontSize: TOKENS.typography.fontSize.xl,
                  fontWeight: TOKENS.typography.fontWeight.bold,
                  color: TOKENS.colors.text.primary,
                  margin: 0,
                }}
              >
                Financials
              </h2>
              {/* Visibility badge */}
              <span
                style={{
                  padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                  backgroundColor:
                    visibilityLevel === "FINANCE_ONLY" ? "#E8F5E9" : "#FFF3E0",
                  color: visibilityLevel === "FINANCE_ONLY" ? "#2E7D32" : "#E65100",
                  borderRadius: TOKENS.radius.sm,
                  fontSize: TOKENS.typography.fontSize.xs,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {visibilityLevel === "FINANCE_ONLY" ? "Full Access" : "Revenue Only"}
              </span>
            </div>
            <p
              style={{
                fontSize: TOKENS.typography.fontSize.sm,
                color: TOKENS.colors.text.secondary,
                margin: 0,
                marginTop: TOKENS.spacing.xs,
              }}
            >
              {canSeeMargins
                ? "Complete financial overview with margins and cost breakdown"
                : "Revenue metrics and billing summary"}
            </p>
          </div>

          {/* Recalculate button */}
          <button
            onClick={recalculateCosting}
            disabled={isRecalculating}
            style={{
              display: "flex",
              alignItems: "center",
              gap: TOKENS.spacing.xs,
              padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
              backgroundColor: "transparent",
              color: TOKENS.colors.blue,
              border: `1px solid ${TOKENS.colors.blue}`,
              borderRadius: TOKENS.radius.md,
              fontSize: TOKENS.typography.fontSize.sm,
              fontWeight: TOKENS.typography.fontWeight.medium,
              cursor: isRecalculating ? "wait" : "pointer",
              opacity: isRecalculating ? 0.7 : 1,
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: isRecalculating ? "spin 1s linear infinite" : "none" }}
            />
            {isRecalculating ? "Recalculating..." : "Recalculate"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: TOKENS.spacing.xl,
        }}
      >
        {/* Primary KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: canSeeMargins
              ? "repeat(auto-fit, minmax(200px, 1fr))"
              : "repeat(auto-fit, minmax(280px, 1fr))",
            gap: TOKENS.spacing.lg,
            marginBottom: TOKENS.spacing.xl,
          }}
        >
          {/* Gross Service Revenue */}
          {canSeeRevenue && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: TOKENS.radius.lg,
                padding: TOKENS.spacing.xl,
                border: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: TOKENS.spacing.sm,
                  marginBottom: TOKENS.spacing.md,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: TOKENS.radius.sm,
                    backgroundColor: "#E3F2FD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BarChart3 size={18} style={{ color: TOKENS.colors.blue }} />
                </div>
                <span
                  style={{
                    fontSize: TOKENS.typography.fontSize.sm,
                    color: TOKENS.colors.text.secondary,
                    fontWeight: TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Gross Service Revenue
                </span>
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xxxl,
                  fontWeight: TOKENS.typography.fontWeight.bold,
                  color: TOKENS.colors.text.primary,
                  lineHeight: 1,
                }}
              >
                {formatCurrency(costingData?.grossServiceRevenue)}
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xs,
                  color: TOKENS.colors.text.tertiary,
                  marginTop: TOKENS.spacing.sm,
                }}
              >
                Total standard rate value
              </div>
            </div>
          )}

          {/* Net Service Revenue */}
          {canSeeRevenue && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: TOKENS.radius.lg,
                padding: TOKENS.spacing.xl,
                border: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: TOKENS.spacing.sm,
                  marginBottom: TOKENS.spacing.md,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: TOKENS.radius.sm,
                    backgroundColor: "#E8F5E9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DollarSign size={18} style={{ color: TOKENS.colors.green }} />
                </div>
                <span
                  style={{
                    fontSize: TOKENS.typography.fontSize.sm,
                    color: TOKENS.colors.text.secondary,
                    fontWeight: TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Net Service Revenue
                </span>
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xxxl,
                  fontWeight: TOKENS.typography.fontWeight.bold,
                  color: TOKENS.colors.green,
                  lineHeight: 1,
                }}
              >
                {formatCurrency(costingData?.netServiceRevenue)}
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xs,
                  color: TOKENS.colors.text.tertiary,
                  marginTop: TOKENS.spacing.sm,
                }}
              >
                Actual billable amount
              </div>
            </div>
          )}

          {/* Realization Rate */}
          {canSeeRevenue && derivedMetrics && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: TOKENS.radius.lg,
                padding: TOKENS.spacing.xl,
                border: `1px solid ${TOKENS.colors.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: TOKENS.spacing.sm,
                  marginBottom: TOKENS.spacing.md,
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: TOKENS.radius.sm,
                    backgroundColor: "#F3E5F5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PieChart size={18} style={{ color: TOKENS.colors.purple }} />
                </div>
                <span
                  style={{
                    fontSize: TOKENS.typography.fontSize.sm,
                    color: TOKENS.colors.text.secondary,
                    fontWeight: TOKENS.typography.fontWeight.medium,
                  }}
                >
                  Realization Rate
                </span>
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xxxl,
                  fontWeight: TOKENS.typography.fontWeight.bold,
                  color: TOKENS.colors.purple,
                  lineHeight: 1,
                }}
              >
                {formatPercent(derivedMetrics.realizationRate)}
              </div>
              <div
                style={{
                  fontSize: TOKENS.typography.fontSize.xs,
                  color: TOKENS.colors.text.tertiary,
                  marginTop: TOKENS.spacing.sm,
                }}
              >
                NSR / GSR ratio
              </div>
            </div>
          )}
        </div>

        {/* Margin Section - FINANCE_ONLY */}
        {canSeeMargins && (
          <>
            <h3
              style={{
                fontSize: TOKENS.typography.fontSize.lg,
                fontWeight: TOKENS.typography.fontWeight.semibold,
                color: TOKENS.colors.text.primary,
                marginBottom: TOKENS.spacing.lg,
                display: "flex",
                alignItems: "center",
                gap: TOKENS.spacing.sm,
              }}
            >
              <Lock size={16} style={{ color: TOKENS.colors.text.tertiary }} />
              Confidential Financials
            </h3>

            {/* Margin KPI */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: TOKENS.spacing.lg,
                marginBottom: TOKENS.spacing.xl,
              }}
            >
              {/* Gross Margin */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: TOKENS.radius.lg,
                  padding: TOKENS.spacing.xl,
                  border: `2px solid ${
                    (costingData?.marginPercentage || 0) >= 20
                      ? TOKENS.colors.green
                      : (costingData?.marginPercentage || 0) >= 10
                      ? TOKENS.colors.warning
                      : TOKENS.colors.danger
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: TOKENS.spacing.sm,
                    marginBottom: TOKENS.spacing.md,
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: TOKENS.radius.sm,
                      backgroundColor:
                        (costingData?.marginPercentage || 0) >= 20
                          ? "#E8F5E9"
                          : (costingData?.marginPercentage || 0) >= 10
                          ? "#FFF3E0"
                          : "#FFEBEE",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {(costingData?.marginPercentage || 0) >= 0 ? (
                      <TrendingUp
                        size={18}
                        style={{
                          color:
                            (costingData?.marginPercentage || 0) >= 20
                              ? TOKENS.colors.green
                              : (costingData?.marginPercentage || 0) >= 10
                              ? TOKENS.colors.warning
                              : TOKENS.colors.danger,
                        }}
                      />
                    ) : (
                      <TrendingDown size={18} style={{ color: TOKENS.colors.danger }} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: TOKENS.typography.fontSize.sm,
                      color: TOKENS.colors.text.secondary,
                      fontWeight: TOKENS.typography.fontWeight.medium,
                    }}
                  >
                    Gross Margin
                  </span>
                </div>
                <div
                  style={{
                    fontSize: TOKENS.typography.fontSize.xxxl,
                    fontWeight: TOKENS.typography.fontWeight.bold,
                    color:
                      (costingData?.marginPercentage || 0) >= 20
                        ? TOKENS.colors.green
                        : (costingData?.marginPercentage || 0) >= 10
                        ? TOKENS.colors.warning
                        : TOKENS.colors.danger,
                    lineHeight: 1,
                  }}
                >
                  {formatCurrency(costingData?.grossMargin)}
                </div>
                <div
                  style={{
                    fontSize: TOKENS.typography.fontSize.md,
                    fontWeight: TOKENS.typography.fontWeight.semibold,
                    color: TOKENS.colors.text.secondary,
                    marginTop: TOKENS.spacing.sm,
                  }}
                >
                  {formatPercent(costingData?.marginPercentage)} margin
                </div>
              </div>

              {/* Total Costs */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: TOKENS.radius.lg,
                  padding: TOKENS.spacing.xl,
                  border: `1px solid ${TOKENS.colors.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: TOKENS.typography.fontSize.sm,
                    color: TOKENS.colors.text.secondary,
                    fontWeight: TOKENS.typography.fontWeight.medium,
                    marginBottom: TOKENS.spacing.md,
                  }}
                >
                  Cost Breakdown
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: TOKENS.spacing.sm,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        color: TOKENS.colors.text.secondary,
                      }}
                    >
                      Internal Cost
                    </span>
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        fontWeight: TOKENS.typography.fontWeight.semibold,
                        color: TOKENS.colors.text.primary,
                      }}
                    >
                      {formatCurrency(costingData?.internalCost)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        color: TOKENS.colors.text.secondary,
                      }}
                    >
                      Subcontractor Cost
                    </span>
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        fontWeight: TOKENS.typography.fontWeight.semibold,
                        color: TOKENS.colors.text.primary,
                      }}
                    >
                      {formatCurrency(costingData?.subcontractorCost)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        color: TOKENS.colors.text.secondary,
                      }}
                    >
                      Out-of-Pocket Expenses
                    </span>
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        fontWeight: TOKENS.typography.fontWeight.semibold,
                        color: TOKENS.colors.text.primary,
                      }}
                    >
                      {formatCurrency(costingData?.outOfPocketExpense)}
                    </span>
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${TOKENS.colors.border}`,
                      paddingTop: TOKENS.spacing.sm,
                      marginTop: TOKENS.spacing.xs,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.sm,
                        fontWeight: TOKENS.typography.fontWeight.semibold,
                        color: TOKENS.colors.text.primary,
                      }}
                    >
                      Total Cost
                    </span>
                    <span
                      style={{
                        fontSize: TOKENS.typography.fontSize.md,
                        fontWeight: TOKENS.typography.fontWeight.bold,
                        color: TOKENS.colors.danger,
                      }}
                    >
                      {formatCurrency(derivedMetrics?.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Info Footer */}
        <div
          style={{
            marginTop: TOKENS.spacing.xl,
            padding: TOKENS.spacing.lg,
            backgroundColor: "#FFFFFF",
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${TOKENS.colors.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: TOKENS.spacing.md,
            }}
          >
            <AlertCircle size={16} style={{ color: TOKENS.colors.text.tertiary, marginTop: "2px" }} />
            <div>
              <p
                style={{
                  fontSize: TOKENS.typography.fontSize.sm,
                  color: TOKENS.colors.text.secondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {canSeeMargins
                  ? "This data is confidential and for internal use only. Margin and cost figures should not be shared externally."
                  : "You are viewing revenue data only. Contact your administrator for access to margin and cost analysis."}
              </p>
              {costingData && (
                <p
                  style={{
                    fontSize: TOKENS.typography.fontSize.xs,
                    color: TOKENS.colors.text.tertiary,
                    margin: 0,
                    marginTop: TOKENS.spacing.xs,
                  }}
                >
                  Version {costingData.versionNumber} • Based on current resource allocations
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
