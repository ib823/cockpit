/**
 * Collapsed Phase Preview Tooltip
 *
 * Shows task overview when hovering over collapsed phase
 * Apple HIG: Smart positioning, elegant fade-in, informative preview
 *
 * Features:
 * - Task count with progress breakdown
 * - Resource allocation summary
 * - Mini task list (top 5 tasks)
 * - Smart positioning (above/below based on viewport)
 * - Smooth fade-in animation (200ms)
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Users, CheckCircle2 } from "lucide-react";
import type { GanttPhase } from "@/types/gantt-tool";
import { DURATION } from "@/lib/design-system/animations";

interface CollapsedPhasePreviewProps {
  phase: GanttPhase;
  anchorElement: HTMLElement;
}

export function CollapsedPhasePreview({ phase, anchorElement }: CollapsedPhasePreviewProps) {
  const [position, setPosition] = useState<{ top: number; left: number; placement: "top" | "bottom" }>({
    top: 0,
    left: 0,
    placement: "bottom",
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate smart positioning
  useEffect(() => {
    if (!anchorElement || !tooltipRef.current) return;

    const updatePosition = () => {
      const anchorRect = anchorElement.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;

      // Determine placement based on available space
      const placement = spaceBelow >= tooltipRect.height + 12 || spaceBelow > spaceAbove ? "bottom" : "top";

      const left = anchorRect.left + anchorRect.width / 2;
      const top =
        placement === "bottom"
          ? anchorRect.bottom + 8
          : anchorRect.top - tooltipRect.height - 8;

      setPosition({ top, left, placement });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [anchorElement]);

  const tasks = phase.tasks || [];
  const totalTasks = tasks.length;

  // Get unique resources assigned to tasks
  const resourceIds = new Set<string>();
  tasks.forEach((task) => {
    task.resourceAssignments?.forEach((assignment) => {
      resourceIds.add(assignment.resourceId);
    });
  });
  const totalResources = resourceIds.size;

  // RACI count
  const raciCount = {
    responsible: phase.raciAssignments?.filter((a) => a.role === "responsible").length || 0,
    accountable: phase.raciAssignments?.filter((a) => a.role === "accountable").length || 0,
    consulted: phase.raciAssignments?.filter((a) => a.role === "consulted").length || 0,
    informed: phase.raciAssignments?.filter((a) => a.role === "informed").length || 0,
  };
  const totalRACIAssignments = raciCount.responsible + raciCount.accountable + raciCount.consulted + raciCount.informed;

  // Top 5 tasks to display
  const topTasks = tasks.slice(0, 5);
  const hasMoreTasks = tasks.length > 5;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={{
          initial: { opacity: 0, scale: 0.95, y: position.placement === "bottom" ? -10 : 10 },
          animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              duration: DURATION.fast,
              ease: [0.34, 1.56, 0.64, 1],
            },
          },
          exit: {
            opacity: 0,
            scale: 0.95,
            transition: {
              duration: DURATION.instant,
            },
          },
        }}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: "translateX(-50%)",
          zIndex: 10000,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            padding: "16px",
            minWidth: "280px",
            maxWidth: "320px",
          }}
        >
          {/* Header */}
          <div
            style={{
              marginBottom: "12px",
              paddingBottom: "12px",
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 600,
                color: "#1d1d1f",
                marginBottom: "4px",
              }}
            >
              {phase.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#86868b",
              }}
            >
              {totalTasks} task{totalTasks !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Summary Info */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {/* Total Tasks */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 className="w-4 h-4" style={{ color: "#007aff", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1d1d1f",
                  }}
                >
                  {totalTasks}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    color: "#86868b",
                  }}
                >
                  Tasks
                </div>
              </div>
            </div>

            {/* Resources */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              <Users className="w-4 h-4" style={{ color: "#ff9500", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1d1d1f",
                  }}
                >
                  {totalResources}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    color: "#86868b",
                  }}
                >
                  Resources
                </div>
              </div>
            </div>

            {/* Duration */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock className="w-4 h-4" style={{ color: "#34c759", flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#1d1d1f",
                  }}
                >
                  {Math.ceil((new Date(phase.endDate).getTime() - new Date(phase.startDate).getTime()) / (1000 * 60 * 60 * 24))}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    color: "#86868b",
                  }}
                >
                  Days
                </div>
              </div>
            </div>
          </div>

          {/* RACI Summary */}
          {totalRACIAssignments > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#86868b",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                RACI Matrix
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {raciCount.responsible > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-text)",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(0, 122, 255, 0.1)",
                        color: "#007AFF",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      R
                    </div>
                    <span style={{ color: "#1d1d1f" }}>{raciCount.responsible}</span>
                  </div>
                )}
                {raciCount.accountable > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-text)",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(255, 59, 48, 0.1)",
                        color: "#FF3B30",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      A
                    </div>
                    <span style={{ color: "#1d1d1f" }}>{raciCount.accountable}</span>
                  </div>
                )}
                {raciCount.consulted > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-text)",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(255, 149, 0, 0.1)",
                        color: "#FF9500",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      C
                    </div>
                    <span style={{ color: "#1d1d1f" }}>{raciCount.consulted}</span>
                  </div>
                )}
                {raciCount.informed > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-text)",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        backgroundColor: "rgba(142, 142, 147, 0.1)",
                        color: "#8E8E93",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      I
                    </div>
                    <span style={{ color: "#1d1d1f" }}>{raciCount.informed}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mini Task List */}
          {topTasks.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#86868b",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Tasks
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {topTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {/* Bullet dot */}
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: "#007aff",
                          flexShrink: 0,
                        }}
                      />
                      {/* Task name */}
                      <div
                        style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          color: "#1d1d1f",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                        title={task.name}
                      >
                        {task.name}
                      </div>
                      {/* Resource count */}
                      {task.resourceAssignments && task.resourceAssignments.length > 0 && (
                        <div
                          style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "11px",
                            color: "#86868b",
                            flexShrink: 0,
                          }}
                        >
                          {new Set(task.resourceAssignments.map(a => a.resourceId)).size} res
                        </div>
                      )}
                    </div>
                  );
                })}
                {hasMoreTasks && (
                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "12px",
                      color: "#86868b",
                      fontStyle: "italic",
                      paddingLeft: "16px",
                    }}
                  >
                    +{tasks.length - 5} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Arrow pointer */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              [position.placement === "bottom" ? "top" : "bottom"]: "-6px",
              width: "12px",
              height: "12px",
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRight: position.placement === "bottom" ? "none" : undefined,
              borderBottom: position.placement === "bottom" ? "none" : undefined,
              borderTop: position.placement === "top" ? "none" : undefined,
              borderLeft: position.placement === "top" ? "none" : undefined,
              transform: `translateX(-50%) rotate(${position.placement === "bottom" ? "45deg" : "-135deg"})`,
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
