/**
 * ProjectInsightsDashboard - Professional Analytics Dashboard
 *
 * Apple HIG-compliant dashboard providing decision-support insights for
 * presales and project teams. Helps design and make informed decisions.
 *
 * Key Insights:
 * - Project Health Score (composite metric)
 * - Resource Utilization Analysis
 * - Cost Projections & Estimates
 * - Gap Analysis & Recommendations
 * - Timeline Health Indicators
 * - Risk Assessment
 *
 * Design Philosophy:
 * - Data-driven decision support
 * - Clean, scannable layouts
 * - Progressive disclosure of details
 * - Actionable recommendations
 */

"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Target, BarChart3, Activity, Zap } from "lucide-react";
import type { GanttProject } from "@/types/gantt-tool";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";
import { differenceInDays, differenceInWeeks, isAfter, isBefore, parseISO } from "date-fns";

interface ProjectInsightsDashboardProps {
  project: GanttProject;
}

interface InsightMetric {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  status: "good" | "warning" | "critical" | "neutral";
  description?: string;
}

interface Recommendation {
  type: "action" | "warning" | "info";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export function ProjectInsightsDashboard({ project }: ProjectInsightsDashboardProps) {
  // Calculate project metrics
  const metrics = useMemo(() => {
    const phases = project.phases || [];
    const resources = project.resources || [];
    const milestones = project.milestones || [];

    // Timeline analysis
    let earliestStart = new Date();
    let latestEnd = new Date();
    let totalTasks = 0;

    phases.forEach((phase) => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      if (isBefore(phaseStart, earliestStart)) earliestStart = phaseStart;
      if (isAfter(phaseEnd, latestEnd)) latestEnd = phaseEnd;
      totalTasks += (phase.tasks?.length || 0) + 1; // +1 for phase itself
    });

    const projectDurationDays = differenceInDays(latestEnd, earliestStart);
    const projectDurationWeeks = differenceInWeeks(latestEnd, earliestStart);

    // Resource analysis
    const totalResources = resources.length;
    const resourcesByCategory = resources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate resource allocations
    const allocations = project.weeklyAllocations || [];
    const totalAllocatedMandays = allocations.reduce((sum, a) => sum + (a.mandays || 0), 0);

    // Calculate effort estimates (simplified)
    const estimatedEffortMandays = totalTasks * 5; // Rough estimate: 5 days per task
    const resourceUtilization = totalResources > 0 && projectDurationWeeks > 0
      ? (totalAllocatedMandays / (totalResources * projectDurationWeeks * 5)) * 100
      : 0;

    // Health score calculation (0-100)
    let healthScore = 100;
    const healthFactors: string[] = [];

    // Deduct for missing resources
    if (totalResources === 0) {
      healthScore -= 30;
      healthFactors.push("No resources assigned");
    } else if (totalResources < 3) {
      healthScore -= 15;
      healthFactors.push("Limited team size");
    }

    // Deduct for missing phases
    if (phases.length === 0) {
      healthScore -= 25;
      healthFactors.push("No phases defined");
    }

    // Deduct for missing milestones
    if (milestones.length === 0) {
      healthScore -= 10;
      healthFactors.push("No milestones set");
    }

    // Deduct for low utilization
    if (resourceUtilization < 50 && totalResources > 0) {
      healthScore -= 15;
      healthFactors.push("Low resource utilization");
    }

    // Cap at 0
    healthScore = Math.max(0, healthScore);

    return {
      healthScore,
      healthFactors,
      projectDurationDays,
      projectDurationWeeks,
      totalPhases: phases.length,
      totalTasks,
      totalResources,
      totalMilestones: milestones.length,
      resourcesByCategory,
      resourceUtilization: Math.min(100, resourceUtilization),
      totalAllocatedMandays,
      estimatedEffortMandays,
      earliestStart,
      latestEnd,
    };
  }, [project]);

  // Generate recommendations
  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = [];

    if (metrics.totalResources === 0) {
      recs.push({
        type: "action",
        title: "Assign Resources",
        description: "No resources have been assigned. Add team members to enable capacity planning.",
        priority: "high",
      });
    }

    if (metrics.totalPhases === 0) {
      recs.push({
        type: "action",
        title: "Define Project Phases",
        description: "Create phases to structure the project timeline and enable tracking.",
        priority: "high",
      });
    }

    if (metrics.totalMilestones === 0) {
      recs.push({
        type: "warning",
        title: "Set Key Milestones",
        description: "Milestones help track progress and communicate status to stakeholders.",
        priority: "medium",
      });
    }

    if (metrics.resourceUtilization < 50 && metrics.totalResources > 0) {
      recs.push({
        type: "info",
        title: "Review Resource Allocation",
        description: `Current utilization is ${metrics.resourceUtilization.toFixed(0)}%. Consider adjusting allocations for better efficiency.`,
        priority: "medium",
      });
    }

    if (metrics.totalResources > 0 && metrics.totalAllocatedMandays === 0) {
      recs.push({
        type: "action",
        title: "Plan Resource Effort",
        description: "Resources are assigned but no effort has been allocated. Go to Team Capacity to plan weekly allocations.",
        priority: "high",
      });
    }

    return recs;
  }, [metrics]);

  // Get health status color
  const getHealthColor = (score: number) => {
    if (score >= 80) return COLORS.status.success;
    if (score >= 60) return COLORS.status.warning;
    return COLORS.status.error;
  };

  // Get status color
  const getStatusColor = (status: InsightMetric["status"]) => {
    switch (status) {
      case "good":
        return COLORS.status.success;
      case "warning":
        return COLORS.status.warning;
      case "critical":
        return COLORS.status.error;
      default:
        return COLORS.text.secondary;
    }
  };

  // Insight cards data
  const insightCards: InsightMetric[] = [
    {
      label: "Project Duration",
      value: `${metrics.projectDurationWeeks} weeks`,
      status: metrics.projectDurationWeeks > 0 ? "neutral" : "warning",
      description: `${metrics.projectDurationDays} days total`,
    },
    {
      label: "Team Size",
      value: metrics.totalResources,
      status: metrics.totalResources > 0 ? "good" : "critical",
      description: `${Object.keys(metrics.resourcesByCategory).length} categories`,
    },
    {
      label: "Phases",
      value: metrics.totalPhases,
      status: metrics.totalPhases > 0 ? "good" : "warning",
      description: `${metrics.totalTasks} total items`,
    },
    {
      label: "Milestones",
      value: metrics.totalMilestones,
      status: metrics.totalMilestones > 0 ? "good" : "warning",
      description: "Key checkpoints",
    },
  ];

  return (
    <div
      style={{
        padding: SPACING[6],
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: SPACING[6] }}>
        <h1
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.display,
            fontSize: TYPOGRAPHY.fontSize.display,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.primary,
            marginBottom: SPACING[2],
          }}
        >
          Project Insights
        </h1>
        <p
          style={{
            fontFamily: TYPOGRAPHY.fontFamily.text,
            fontSize: TYPOGRAPHY.fontSize.body,
            color: COLORS.text.secondary,
          }}
        >
          Analytics and recommendations to help you make informed decisions
        </p>
      </div>

      {/* Health Score Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: SPACING[5],
          marginBottom: SPACING[6],
        }}
      >
        {/* Health Score */}
        <div
          style={{
            padding: SPACING[5],
            backgroundColor: COLORS.bg.primary,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: RADIUS.large,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
              marginBottom: SPACING[4],
            }}
          >
            <Activity
              style={{ width: "20px", height: "20px", color: COLORS.blue }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.caption,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.secondary,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Project Health
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: SPACING[2],
              marginBottom: SPACING[3],
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.display,
                fontSize: "56px",
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: getHealthColor(metrics.healthScore),
                lineHeight: 1,
              }}
            >
              {metrics.healthScore}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.title,
                color: COLORS.text.tertiary,
              }}
            >
              / 100
            </span>
          </div>

          {/* Health bar */}
          <div
            style={{
              height: "8px",
              backgroundColor: COLORS.border.default,
              borderRadius: RADIUS.full,
              overflow: "hidden",
              marginBottom: SPACING[3],
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${metrics.healthScore}%`,
                backgroundColor: getHealthColor(metrics.healthScore),
                borderRadius: RADIUS.full,
                transition: `width ${TRANSITIONS.duration.slow}`,
              }}
            />
          </div>

          {/* Health factors */}
          {metrics.healthFactors.length > 0 && (
            <div style={{ marginTop: SPACING[3] }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.label,
                  color: COLORS.text.tertiary,
                  display: "block",
                  marginBottom: SPACING[2],
                }}
              >
                Areas for improvement:
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: SPACING[1] }}>
                {metrics.healthFactors.map((factor, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      color: COLORS.status.warning,
                    }}
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: SPACING[4],
          }}
        >
          {insightCards.map((card, idx) => (
            <div
              key={idx}
              style={{
                padding: SPACING[4],
                backgroundColor: COLORS.bg.primary,
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: RADIUS.default,
              }}
            >
              <div
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: COLORS.text.secondary,
                  marginBottom: SPACING[2],
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: SPACING[2],
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.display,
                    fontSize: TYPOGRAPHY.fontSize.display,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: getStatusColor(card.status),
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </span>
              </div>
              {card.description && (
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.label,
                    color: COLORS.text.tertiary,
                    marginTop: SPACING[1],
                  }}
                >
                  {card.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resource Distribution */}
      {metrics.totalResources > 0 && (
        <div
          style={{
            padding: SPACING[5],
            backgroundColor: COLORS.bg.primary,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: RADIUS.large,
            marginBottom: SPACING[5],
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
              marginBottom: SPACING[4],
            }}
          >
            <Users
              style={{ width: "20px", height: "20px", color: COLORS.blue }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.subtitle,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
              }}
            >
              Resource Distribution
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: SPACING[3],
            }}
          >
            {Object.entries(metrics.resourcesByCategory).map(([category, count]) => (
              <div
                key={category}
                style={{
                  padding: `${SPACING[2]} ${SPACING[3]}`,
                  backgroundColor: COLORS.bg.subtle,
                  borderRadius: RADIUS.default,
                  display: "flex",
                  alignItems: "center",
                  gap: SPACING[2],
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    color: COLORS.text.secondary,
                    textTransform: "capitalize",
                  }}
                >
                  {category.replace(/_/g, " ")}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.body,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: COLORS.blue,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>

          {/* Utilization Bar */}
          <div style={{ marginTop: SPACING[4] }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: SPACING[2],
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  color: COLORS.text.secondary,
                }}
              >
                Resource Utilization
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.fontFamily.text,
                  fontSize: TYPOGRAPHY.fontSize.caption,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
                  color: metrics.resourceUtilization >= 70 ? COLORS.status.success : COLORS.status.warning,
                }}
              >
                {metrics.resourceUtilization.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: "8px",
                backgroundColor: COLORS.border.default,
                borderRadius: RADIUS.full,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${metrics.resourceUtilization}%`,
                  backgroundColor: metrics.resourceUtilization >= 70 ? COLORS.status.success : COLORS.status.warning,
                  borderRadius: RADIUS.full,
                  transition: `width ${TRANSITIONS.duration.slow}`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div
          style={{
            padding: SPACING[5],
            backgroundColor: COLORS.bg.primary,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: RADIUS.large,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: SPACING[2],
              marginBottom: SPACING[4],
            }}
          >
            <Zap
              style={{ width: "20px", height: "20px", color: COLORS.status.warning }}
            />
            <span
              style={{
                fontFamily: TYPOGRAPHY.fontFamily.text,
                fontSize: TYPOGRAPHY.fontSize.subtitle,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
              }}
            >
              Recommendations
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SPACING[3],
            }}
          >
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: SPACING[4],
                  backgroundColor: rec.type === "action"
                    ? COLORS.blueLight
                    : rec.type === "warning"
                    ? COLORS.redLight
                    : COLORS.bg.subtle,
                  borderRadius: RADIUS.default,
                  borderLeft: `4px solid ${
                    rec.type === "action"
                      ? COLORS.blue
                      : rec.type === "warning"
                      ? COLORS.red
                      : COLORS.text.tertiary
                  }`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    marginBottom: SPACING[1],
                  }}
                >
                  {rec.type === "action" ? (
                    <Target style={{ width: "16px", height: "16px", color: COLORS.blue }} />
                  ) : rec.type === "warning" ? (
                    <AlertTriangle style={{ width: "16px", height: "16px", color: COLORS.red }} />
                  ) : (
                    <CheckCircle style={{ width: "16px", height: "16px", color: COLORS.text.tertiary }} />
                  )}
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.body,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.primary,
                    }}
                  >
                    {rec.title}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      padding: `${SPACING[1]} ${SPACING[2]}`,
                      backgroundColor: rec.priority === "high"
                        ? COLORS.redLight
                        : rec.priority === "medium"
                        ? `${COLORS.status.warning}20`
                        : COLORS.bg.subtle,
                      borderRadius: RADIUS.small,
                      fontFamily: TYPOGRAPHY.fontFamily.text,
                      fontSize: TYPOGRAPHY.fontSize.label,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: rec.priority === "high"
                        ? COLORS.red
                        : rec.priority === "medium"
                        ? COLORS.status.warning
                        : COLORS.text.tertiary,
                      textTransform: "uppercase",
                    }}
                  >
                    {rec.priority}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: TYPOGRAPHY.fontFamily.text,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    color: COLORS.text.secondary,
                    margin: 0,
                    paddingLeft: "24px",
                  }}
                >
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && metrics.healthScore >= 80 && (
        <div
          style={{
            padding: SPACING[6],
            backgroundColor: `${COLORS.status.success}10`,
            borderRadius: RADIUS.large,
            textAlign: "center",
          }}
        >
          <CheckCircle
            style={{
              width: "48px",
              height: "48px",
              color: COLORS.status.success,
              marginBottom: SPACING[3],
            }}
          />
          <h3
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.display,
              fontSize: TYPOGRAPHY.fontSize.title,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              marginBottom: SPACING[2],
            }}
          >
            Project is Well-Configured
          </h3>
          <p
            style={{
              fontFamily: TYPOGRAPHY.fontFamily.text,
              fontSize: TYPOGRAPHY.fontSize.body,
              color: COLORS.text.secondary,
              maxWidth: "400px",
              margin: "0 auto",
            }}
          >
            Your project has a healthy configuration. Continue monitoring progress and update allocations as needed.
          </p>
        </div>
      )}
    </div>
  );
}
