/**
 * PhaseDeletionImpactModal - BaseModal-based phase deletion confirmation with comprehensive impact analysis
 *
 * Phase deletion is a CASCADE operation that affects:
 * - All tasks within the phase (permanent deletion)
 * - All resource assignments across all tasks
 * - Phase-level dependencies from other phases
 * - Task-level dependencies from tasks in other phases
 * - Project timeline and budget
 * - AMS commitments
 *
 * Uses BaseModal with size="large" for detailed impact display
 * This is a CRITICAL operation - users must understand the full scope
 */

"use client";

import { useMemo } from "react";
import { AlertTriangle, Users, Calendar, TrendingDown, Link2, Layers, DollarSign, Clock, FileText } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { GanttPhase, Resource, GanttHoliday } from "@/types/gantt-tool";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";

interface PhaseDeletionImpactModalProps {
  phase: GanttPhase;
  allPhases: GanttPhase[];
  allResources: Resource[];
  onConfirm: () => void;
  onCancel: () => void;
  holidays: GanttHoliday[];
}

export function PhaseDeletionImpactModal({
  phase,
  allPhases,
  allResources,
  onConfirm,
  onCancel,
  holidays,
}: PhaseDeletionImpactModalProps) {
  // Calculate comprehensive impact analysis
  const impact = useMemo(() => {
    const tasks = phase.tasks || [];

    // 1. Tasks that will be deleted
    const totalTasks = tasks.length;
    const taskNames = tasks.map((t) => t.name);

    // 2. Resource assignments across all tasks
    const allResourceAssignments = tasks.flatMap((task) => {
      return (task.resourceAssignments || []).map((assignment) => {
        const resource = allResources.find((r) => r.id === assignment.resourceId);
        return {
          resource,
          assignment,
          task,
        };
      });
    });

    // Calculate total resource cost
    const totalResourceCost = allResourceAssignments.reduce((sum, { resource, assignment, task }) => {
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

    // Get unique resources affected
    const uniqueResourceIds = new Set(allResourceAssignments.map(({ assignment }) => assignment.resourceId));
    const uniqueResources = Array.from(uniqueResourceIds)
      .map((id) => allResources.find((r) => r.id === id))
      .filter(Boolean);

    // 3. Phase resource assignments
    const phaseResourceAssignments = (phase.phaseResourceAssignments || []).map((assignment) => {
      const resource = allResources.find((r) => r.id === assignment.resourceId);
      return {
        resource,
        assignment,
      };
    });

    // 4. Child tasks with parent relationships
    const childTasksCount = tasks.filter((t) => t.parentTaskId).length;

    // 5. Dependencies impact
    const dependentPhases = allPhases.filter((p) => p.dependencies.includes(phase.id));
    const hasDependentPhases = dependentPhases.length > 0;

    // Tasks with dependencies from other phases
    const taskIds = new Set(tasks.map((t) => t.id));
    const allTasksInOtherPhases = allPhases
      .filter((p) => p.id !== phase.id)
      .flatMap((p) => p.tasks || []);
    const tasksWithDependenciesToThisPhase = allTasksInOtherPhases.filter((task) =>
      task.dependencies.some((depId) => taskIds.has(depId))
    );

    // 6. Timeline Impact
    const workingDays = calculateWorkingDaysInclusive(
      new Date(phase.startDate),
      new Date(phase.endDate),
      holidays
    );
    const calendarDays = differenceInDays(new Date(phase.endDate), new Date(phase.startDate)) + 1;

    // 7. AMS tasks
    const amsTasks = tasks.filter((t) => t.isAMS);
    const hasAmsTasks = amsTasks.length > 0;

    // Calculate severity
    const criticalFactors = [
      totalTasks > 10,
      uniqueResources.length > 5,
      hasDependentPhases,
      tasksWithDependenciesToThisPhase.length > 0,
      totalResourceCost > 50000,
      hasAmsTasks,
    ].filter(Boolean).length;

    const severity: "low" | "medium" | "high" | "critical" =
      criticalFactors === 0 ? "low" :
      criticalFactors <= 2 ? "medium" :
      criticalFactors <= 4 ? "high" : "critical";

    return {
      totalTasks,
      taskNames,
      allResourceAssignments,
      totalResourceCost,
      uniqueResources,
      phaseResourceAssignments,
      childTasksCount,
      dependentPhases,
      hasDependentPhases,
      tasksWithDependenciesToThisPhase,
      workingDays,
      calendarDays,
      amsTasks,
      hasAmsTasks,
      severity,
      criticalFactors,
    };
  }, [phase, allPhases, allResources, holidays]);

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
      label: "CRITICAL IMPACT",
    },
  };

  const config = severityConfig[impact.severity];

  return (
    <BaseModal
      isOpen={true}
      onClose={onCancel}
      title="Confirm Phase Deletion"
      subtitle={
        impact.severity === "critical" ? "⚠️ CRITICAL: This will have severe cascading effects on your entire project." :
        impact.severity === "high" ? "⚠️ WARNING: This will significantly affect your project timeline and resources." :
        impact.severity === "medium" ? "This action will impact multiple tasks and resources." :
        "Please review the impacts before proceeding."
      }
      icon={<AlertTriangle className="w-7 h-7" style={{ color: config.color }} />}
      size="large"
      footer={
        <>
          <ModalButton variant="secondary" onClick={onCancel}>
            Cancel & Review
          </ModalButton>
          <ModalButton
            variant="destructive"
            onClick={onConfirm}
          >
            {impact.severity === "critical" && "⚠️ Delete Anyway (Not Recommended)"}
            {impact.severity === "high" && "Delete Phase (High Risk)"}
            {impact.severity === "medium" && "Delete Phase"}
            {impact.severity === "low" && "Confirm Delete"}
          </ModalButton>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Phase Info Card */}
        <div style={{
          padding: "16px",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          border: "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: "17px",
                fontWeight: 700,
                color: "#1D1D1F",
                marginBottom: "4px",
              }}>
                {phase.name}
              </div>
              {phase.description && (
                <div style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "#86868B",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {phase.description}
                </div>
              )}
            </div>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              backgroundColor: phase.color,
              flexShrink: 0,
            }} />
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            color: "#86868B",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar className="w-4 h-4" />
              {format(new Date(phase.startDate), "MMM dd")} - {format(new Date(phase.endDate), "MMM dd, yyyy")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock className="w-4 h-4" />
              {impact.workingDays} working days
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <FileText className="w-4 h-4" />
              {impact.totalTasks} task{impact.totalTasks !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Severity Summary */}
        <div style={{
          padding: "20px",
          backgroundColor: config.bgColor,
          border: `2px solid ${config.borderColor}`,
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}>
            <h3 style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 700,
              color: config.color,
              margin: 0,
            }}>
              Impact Severity Analysis
            </h3>
            <span style={{
              padding: "6px 16px",
              borderRadius: "16px",
              fontSize: "12px",
              fontWeight: 700,
              backgroundColor: config.bgColor,
              border: `2px solid ${config.borderColor}`,
              color: config.color,
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
            }}>
              {config.label}
            </span>
          </div>
          <p style={{
            fontFamily: "var(--font-text)",
            fontSize: "13px",
            fontWeight: 500,
            color: "#1D1D1F",
            margin: 0,
          }}>
            {impact.criticalFactors === 0 && "No critical impacts detected. This phase can be deleted with minimal risk."}
            {impact.criticalFactors === 1 && "One critical impact area identified. Please review carefully."}
            {impact.criticalFactors === 2 && "Two critical impact areas identified. Proceed with caution."}
            {impact.criticalFactors >= 3 && "Multiple critical impacts detected. Strongly recommend reconsidering this deletion or consulting with project stakeholders."}
          </p>
        </div>

        {/* Tasks Deletion Impact */}
        <div style={{
          padding: "20px",
          backgroundColor: "rgba(255, 59, 48, 0.05)",
          border: "2px solid rgba(255, 59, 48, 0.2)",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            marginBottom: "12px",
          }}>
            <FileText className="w-6 h-6" style={{ color: "#FF3B30", marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "16px",
                fontWeight: 700,
                color: "#1D1D1F",
                marginBottom: "4px",
              }}>
                All Tasks Will Be Permanently Deleted
              </h3>
              <p style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#FF3B30",
                marginBottom: "12px",
              }}>
                Deleting this phase will CASCADE DELETE all {impact.totalTasks} task{impact.totalTasks !== 1 ? "s" : ""}.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div style={{
            maxHeight: "160px",
            overflow: "auto",
            backgroundColor: "#FFFFFF",
            padding: "12px",
            borderRadius: "6px",
            border: "1px solid rgba(255, 59, 48, 0.2)",
          }}>
            {impact.taskNames.map((name, index) => (
              <div key={index} style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#1D1D1F",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 0",
              }}>
                <div style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#FF3B30",
                  flexShrink: 0,
                }} />
                {name}
              </div>
            ))}
          </div>

          {impact.childTasksCount > 0 && (
            <div style={{
              marginTop: "12px",
              padding: "12px",
              backgroundColor: "rgba(255, 149, 0, 0.1)",
              border: "1px solid rgba(255, 149, 0, 0.3)",
              borderRadius: "6px",
            }}>
              <p style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1D1D1F",
                margin: 0,
              }}>
                ⚠️ {impact.childTasksCount} task{impact.childTasksCount !== 1 ? "s have" : " has"} parent-child relationships that will be lost.
              </p>
            </div>
          )}
        </div>

        {/* Resource Allocations Impact */}
        {impact.uniqueResources.length > 0 && (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(175, 82, 222, 0.05)",
            border: "2px solid rgba(175, 82, 222, 0.2)",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <Users className="w-6 h-6" style={{ color: "#AF52DE", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  Resource Allocations Will Be Lost
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#AF52DE",
                  marginBottom: "12px",
                }}>
                  {impact.uniqueResources.length} resource{impact.uniqueResources.length !== 1 ? "s" : ""} with {impact.allResourceAssignments.length} total assignment{impact.allResourceAssignments.length !== 1 ? "s" : ""} across all tasks.
                </p>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "8px",
              marginBottom: "12px",
            }}>
              {impact.uniqueResources.slice(0, 8).map((resource) => {
                if (!resource) return null;
                const assignments = impact.allResourceAssignments.filter(
                  ({ assignment }) => assignment.resourceId === resource.id
                );
                return (
                  <div key={resource.id} style={{
                    padding: "12px",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "6px",
                    border: "1px solid rgba(175, 82, 222, 0.2)",
                  }}>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#1D1D1F",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                      {resource.name}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "11px",
                      color: "#86868B",
                    }}>
                      {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>

            {impact.uniqueResources.length > 8 && (
              <div style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#AF52DE",
              }}>
                + {impact.uniqueResources.length - 8} more resource{impact.uniqueResources.length - 8 !== 1 ? "s" : ""}
              </div>
            )}

            {impact.totalResourceCost > 0 && (
              <div style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "2px solid rgba(175, 82, 222, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                }}>
                  Total Budget Impact:
                </span>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#AF52DE",
                }}>
                  ${impact.totalResourceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Dependencies Impact */}
        {(impact.hasDependentPhases || impact.tasksWithDependenciesToThisPhase.length > 0) && (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(255, 204, 0, 0.05)",
            border: "2px solid rgba(255, 204, 0, 0.3)",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              marginBottom: "12px",
            }}>
              <Link2 className="w-6 h-6" style={{ color: "#FFCC00", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  Dependencies Will Be Broken
                </h3>
              </div>
            </div>

            {impact.hasDependentPhases && (
              <div style={{ marginBottom: "12px" }}>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "8px",
                }}>
                  {impact.dependentPhases.length} phase{impact.dependentPhases.length !== 1 ? "s depend" : " depends"} on this phase:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {impact.dependentPhases.map((dependentPhase) => (
                    <div key={dependentPhase.id} style={{
                      padding: "12px",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 204, 0, 0.3)",
                    }}>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#1D1D1F",
                      }}>
                        {dependentPhase.name}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        color: "#86868B",
                        marginTop: "2px",
                      }}>
                        Phase dependency will be removed
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {impact.tasksWithDependenciesToThisPhase.length > 0 && (
              <div>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  marginBottom: "8px",
                }}>
                  {impact.tasksWithDependenciesToThisPhase.length} task{impact.tasksWithDependenciesToThisPhase.length !== 1 ? "s" : ""} in other phases depend on tasks in this phase:
                </p>
                <div style={{
                  maxHeight: "128px",
                  overflow: "auto",
                  backgroundColor: "#FFFFFF",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 204, 0, 0.3)",
                }}>
                  {impact.tasksWithDependenciesToThisPhase.map((task) => (
                    <div key={task.id} style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      color: "#1D1D1F",
                      padding: "2px 0",
                    }}>
                      • {task.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AMS Tasks Impact */}
        {impact.hasAmsTasks && (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(88, 86, 214, 0.05)",
            border: "2px solid rgba(88, 86, 214, 0.2)",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}>
              <AlertTriangle className="w-6 h-6" style={{ color: "#5856D6", marginTop: "2px" }} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#1D1D1F",
                  marginBottom: "4px",
                }}>
                  AMS Commitments Will Be Deleted
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#5856D6",
                  marginBottom: "12px",
                }}>
                  This phase contains {impact.amsTasks.length} Application Maintenance & Support task{impact.amsTasks.length !== 1 ? "s" : ""}.
                  Verify client contracts before deletion.
                </p>
                <div style={{
                  backgroundColor: "#FFFFFF",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid rgba(88, 86, 214, 0.2)",
                }}>
                  {impact.amsTasks.map((task) => (
                    <div key={task.id} style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "13px",
                      padding: "4px 0",
                    }}>
                      <span style={{ fontWeight: 600, color: "#1D1D1F" }}>{task.name}</span>
                      {task.amsConfig && (
                        <span style={{ color: "#86868B", marginLeft: "8px" }}>
                          (${task.amsConfig.fixedRate}/{task.amsConfig.rateType})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Impact */}
        <div style={{
          padding: "20px",
          backgroundColor: "rgba(0, 122, 255, 0.05)",
          border: "1px solid rgba(0, 122, 255, 0.2)",
          borderRadius: "8px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <TrendingDown className="w-6 h-6" style={{ color: "#007AFF", marginTop: "2px" }} />
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 700,
                color: "#1D1D1F",
                marginBottom: "12px",
              }}>
                Timeline Impact
              </h3>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                fontFamily: "var(--font-text)",
                fontSize: "13px",
              }}>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  border: "1px solid rgba(0, 122, 255, 0.2)",
                }}>
                  <div style={{ color: "#007AFF", fontWeight: 500, marginBottom: "4px" }}>Working Days Lost</div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1D1D1F",
                  }}>
                    {impact.workingDays}
                  </div>
                </div>
                <div style={{
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "6px",
                  border: "1px solid rgba(0, 122, 255, 0.2)",
                }}>
                  <div style={{ color: "#007AFF", fontWeight: 500, marginBottom: "4px" }}>Calendar Days</div>
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1D1D1F",
                  }}>
                    {impact.calendarDays}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
