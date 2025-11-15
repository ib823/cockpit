/**
 * TaskDeletionImpactModal - BaseModal-based deletion confirmation with impact analysis
 *
 * Comprehensive impact analysis for task deletion:
 * - Resource assignments that will be lost
 * - Child tasks that will be orphaned
 * - Dependencies that will be broken
 * - Timeline and budget impact
 * - AMS task warnings
 *
 * Uses BaseModal with size="large" for detailed impact display
 */

"use client";

import { useMemo } from "react";
import { AlertTriangle, Users, Calendar, TrendingDown, Link2, Layers, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { GanttTask, GanttPhase, Resource, GanttHoliday } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";

interface TaskDeletionImpactModalProps {
  task: GanttTask;
  phase: GanttPhase;
  allTasks: GanttTask[];
  allResources: Resource[];
  onConfirm: () => void;
  onCancel: () => void;
  holidays: GanttHoliday[];
}

export function TaskDeletionImpactModal({
  task,
  phase,
  allTasks,
  allResources,
  onConfirm,
  onCancel,
  holidays,
}: TaskDeletionImpactModalProps) {
  // Calculate comprehensive impact analysis
  const impact = useMemo(() => {
    // 1. Resource Assignments Impact
    const assignedResources = (task.resourceAssignments || []).map((assignment) => {
      const resource = allResources.find((r) => r.id === assignment.resourceId);
      return {
        resource,
        assignment,
      };
    });

    const totalResourceCost = assignedResources.reduce((sum, { resource, assignment }) => {
      if (!resource) return sum;
      const workingDays = calculateWorkingDaysInclusive(
        new Date(task.startDate),
        new Date(task.endDate),
        holidays
      );
      const hoursPerDay = 8;
      const totalHours = workingDays * hoursPerDay * (assignment.allocationPercentage / 100);
      const cost = totalHours * resource.chargeRatePerHour;
      return sum + cost;
    }, 0);

    // 2. Child Tasks Impact
    const childTasks = allTasks.filter((t) => t.parentTaskId === task.id);
    const hasChildren = childTasks.length > 0;

    // 3. Dependencies Impact
    const dependentTasks = allTasks.filter((t) => t.dependencies.includes(task.id));
    const hasDependents = dependentTasks.length > 0;

    // 4. Timeline Impact
    const workingDays = calculateWorkingDaysInclusive(
      new Date(task.startDate),
      new Date(task.endDate),
      holidays
    );

    // 5. Budget Impact
    const budgetImpact = totalResourceCost;

    // Calculate severity
    const criticalFactors = [
      hasChildren,
      hasDependents,
      assignedResources.length > 0,
      budgetImpact > 10000,
      task.isAMS,
    ].filter(Boolean).length;

    const severity: "low" | "medium" | "high" | "critical" =
      criticalFactors === 0 ? "low" :
      criticalFactors === 1 ? "medium" :
      criticalFactors === 2 ? "high" : "critical";

    return {
      assignedResources,
      totalResourceCost,
      childTasks,
      hasChildren,
      dependentTasks,
      hasDependents,
      workingDays,
      budgetImpact,
      severity,
      criticalFactors,
    };
  }, [task, allTasks, allResources, holidays]);

  const severityConfig = {
    low: {
      color: "#059669",
      bgColor: "rgba(5, 150, 105, 0.1)",
      borderColor: "rgba(5, 150, 105, 0.3)",
      label: "Low Impact",
    },
    medium: {
      color: "#D97706",
      bgColor: "rgba(217, 119, 6, 0.1)",
      borderColor: "rgba(217, 119, 6, 0.3)",
      label: "Medium Impact",
    },
    high: {
      color: "#EA580C",
      bgColor: "rgba(234, 88, 12, 0.1)",
      borderColor: "rgba(234, 88, 12, 0.3)",
      label: "High Impact",
    },
    critical: {
      color: "#DC2626",
      bgColor: "rgba(220, 38, 38, 0.1)",
      borderColor: "rgba(220, 38, 38, 0.3)",
      label: "Critical Impact",
    },
  };

  const config = severityConfig[impact.severity];

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Confirm Task Deletion"
      subtitle={
        impact.severity === "critical" ? "This action will have significant consequences and cannot be undone." :
        impact.severity === "high" ? "This action will affect multiple areas of your project." :
        impact.severity === "medium" ? "Please review the impacts before proceeding." :
        "This task can be safely deleted."
      }
      icon={<AlertTriangle className="w-6 h-6" style={{ color: config.color }} />}
      size="large"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onCancel}>
            Cancel
          </ModalButton>
          <ModalButton
            variant="destructive"
            onClick={onConfirm}
          >
            {impact.severity === "critical" || impact.severity === "high" ? "Delete Anyway" : "Confirm Delete"}
          </ModalButton>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Task Info Card */}
        <div style={{
          padding: "16px",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}>
          <div style={{
            fontFamily: "var(--font-text)",
            fontSize: "15px",
            fontWeight: 600,
            color: "#1D1D1F",
            marginBottom: "8px",
          }}>
            {task.name}
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#86868B",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Calendar className="w-4 h-4" />
              {format(new Date(task.startDate), "MMM dd")} - {format(new Date(task.endDate), "MMM dd, yyyy")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Clock className="w-4 h-4" />
              {impact.workingDays} working days
            </div>
            {task.isAMS && (
              <div style={{
                padding: "2px 8px",
                backgroundColor: "rgba(0, 122, 255, 0.1)",
                color: "#007AFF",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
              }}>
                AMS
              </div>
            )}
          </div>
        </div>

        {/* Severity Summary */}
        <div style={{
          padding: "16px",
          backgroundColor: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          borderRadius: "8px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}>
            <h3 style={{
              fontFamily: "var(--font-text)",
              fontSize: "14px",
              fontWeight: 600,
              color: config.color,
              margin: 0,
            }}>
              Impact Severity
            </h3>
            <span style={{
              padding: "4px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: config.bgColor,
              border: `1px solid ${config.borderColor}`,
              color: config.color,
            }}>
              {config.label}
            </span>
          </div>
          <p style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#1D1D1F",
            margin: 0,
          }}>
            {impact.criticalFactors === 0 && "No significant impacts detected. This task can be deleted safely."}
            {impact.criticalFactors === 1 && "One critical factor identified. Review the impact below."}
            {impact.criticalFactors === 2 && "Multiple critical factors identified. Carefully review all impacts."}
            {impact.criticalFactors >= 3 && "Severe impacts detected across multiple areas. Consider alternatives to deletion."}
          </p>
        </div>

        {/* Resource Assignments Impact */}
        {impact.assignedResources.length > 0 && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(255, 59, 48, 0.05)",
            border: "1px solid rgba(255, 59, 48, 0.2)",
            borderRadius: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <Users className="w-5 h-5" style={{ color: "#FF3B30", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  Resource Assignments Will Be Lost
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#86868B",
                  marginBottom: "12px",
                }}>
                  {impact.assignedResources.length} resource{impact.assignedResources.length > 1 ? "s" : ""} currently assigned to this task will lose their allocation.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {impact.assignedResources.map(({ resource, assignment }) => {
                if (!resource) return null;

                const workingDays = calculateWorkingDaysInclusive(
                  new Date(task.startDate),
                  new Date(task.endDate),
                  holidays
                );
                const totalHours = workingDays * 8 * (assignment.allocationPercentage / 100);
                const cost = totalHours * resource.chargeRatePerHour;

                return (
                  <div key={assignment.id} style={{
                    padding: "12px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 59, 48, 0.2)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                        }}>
                          {resource.name}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          color: "#86868B",
                        }}>
                          {resource.designation} • {resource.category}
                        </div>
                        {assignment.assignmentNotes && (
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "12px",
                            color: "#86868B",
                            marginTop: "4px",
                            fontStyle: "italic",
                          }}>
                            "{assignment.assignmentNotes}"
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                        }}>
                          {assignment.allocationPercentage}%
                        </div>
                        <div style={{
                          fontSize: "11px",
                          color: "#86868B",
                        }}>
                          {totalHours.toFixed(1)} hrs
                        </div>
                        <div style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#FF3B30",
                        }}>
                          ${cost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {impact.totalResourceCost > 0 && (
              <div style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(255, 59, 48, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                }}>
                  Total Resource Cost Lost:
                </span>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#FF3B30",
                }}>
                  ${impact.totalResourceCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Child Tasks Impact */}
        {impact.hasChildren && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(255, 149, 0, 0.05)",
            border: "1px solid rgba(255, 149, 0, 0.2)",
            borderRadius: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <Layers className="w-5 h-5" style={{ color: "#FF9500", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  Child Tasks Will Be Orphaned
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#86868B",
                  marginBottom: "12px",
                }}>
                  This task has {impact.childTasks.length} child task{impact.childTasks.length > 1 ? "s" : ""}. They will become top-level tasks after deletion.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {impact.childTasks.map((childTask) => (
                <div key={childTask.id} style={{
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 149, 0, 0.2)",
                }}>
                  <div style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                  }}>
                    {childTask.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "12px",
                    color: "#86868B",
                    marginTop: "4px",
                  }}>
                    Level {childTask.level} → Will become Level 0
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies Impact */}
        {impact.hasDependents && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(255, 204, 0, 0.05)",
            border: "1px solid rgba(255, 204, 0, 0.3)",
            borderRadius: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <Link2 className="w-5 h-5" style={{ color: "#FFCC00", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  Task Dependencies Will Be Broken
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#86868B",
                  marginBottom: "12px",
                }}>
                  {impact.dependentTasks.length} task{impact.dependentTasks.length > 1 ? "s depend" : " depends"} on this task. Deleting will break {impact.dependentTasks.length > 1 ? "these" : "this"} dependency.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {impact.dependentTasks.map((dependentTask) => (
                <div key={dependentTask.id} style={{
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 204, 0, 0.3)",
                }}>
                  <div style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                  }}>
                    {dependentTask.name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "12px",
                    color: "#86868B",
                    marginTop: "4px",
                  }}>
                    Dependency will be removed from this task
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Impact */}
        <div style={{
          padding: "16px",
          backgroundColor: "rgba(0, 122, 255, 0.05)",
          border: "1px solid rgba(0, 122, 255, 0.2)",
          borderRadius: "8px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <TrendingDown className="w-5 h-5" style={{ color: "#007AFF", marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "var(--font-text)",
                fontSize: "14px",
                fontWeight: 600,
                color: "#1D1D1F",
                marginBottom: "8px",
              }}>
                Timeline Impact
              </h3>
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#1D1D1F",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span>Working days removed:</span>
                  <span style={{ fontWeight: 600 }}>{impact.workingDays} days</span>
                </div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                  <span>Phase timeline:</span>
                  <span style={{ fontWeight: 500 }}>No change (phase dates unchanged)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Impact */}
        {impact.budgetImpact > 0 && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(175, 82, 222, 0.05)",
            border: "1px solid rgba(175, 82, 222, 0.2)",
            borderRadius: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}>
              <DollarSign className="w-5 h-5" style={{ color: "#AF52DE", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "8px",
                }}>
                  Budget Impact
                </h3>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#1D1D1F",
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span>Total cost reduction:</span>
                    <span style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "18px",
                      fontWeight: 700,
                    }}>
                      ${impact.budgetImpact.toFixed(2)}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    color: "#86868B",
                    margin: "4px 0 0 0",
                  }}>
                    Project budget estimate will be reduced by this amount.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AMS Impact */}
        {task.isAMS && (
          <div style={{
            padding: "16px",
            backgroundColor: "rgba(88, 86, 214, 0.05)",
            border: "1px solid rgba(88, 86, 214, 0.2)",
            borderRadius: "8px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}>
              <AlertTriangle className="w-5 h-5" style={{ color: "#5856D6", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  AMS Task Deletion
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#1D1D1F",
                }}>
                  This is an Application Maintenance & Support (AMS) task with ongoing commitment. Ensure client contracts are updated if this represents a service level agreement.
                </p>
                {task.amsConfig && (
                  <div style={{
                    marginTop: "8px",
                    fontFamily: "var(--font-text)",
                    fontSize: "12px",
                    color: "#86868B",
                  }}>
                    <div>Rate: ${task.amsConfig.fixedRate} per {task.amsConfig.rateType}</div>
                    {task.amsConfig.minimumDuration && (
                      <div>Minimum Duration: {task.amsConfig.minimumDuration} months</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
