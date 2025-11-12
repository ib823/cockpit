/**
 * Phase Resource Panel - Enhanced visualization for phase resources
 *
 * Displays when a phase is expanded, showing:
 * - Resource allocation breakdown
 * - FTE% summary and visualization
 * - Deliverables (tasks)
 * - Team composition
 */

"use client";

import type { GanttPhase, GanttProject } from "@/types/gantt-tool";
import { useMemo, useState } from "react";
import { OrgChartView } from "./OrgChartView";

interface PhaseResourcePanelProps {
  phase: GanttPhase;
  project: GanttProject;
  layout: 'below' | 'side' | 'row';
}

export function PhaseResourcePanel({ phase, project, layout }: PhaseResourcePanelProps) {
  const [view, setView] = useState<'allocation' | 'orgchart'>('allocation');

  // Calculate resource allocation data
  const resourceData = useMemo(() => {
    const resourceMap = new Map<string, {
      resourceName: string;
      tasks: Array<{ taskName: string; allocation: number }>;
      totalAllocation: number;
      avgAllocation: number;
    }>();

    phase.tasks?.forEach((task) => {
      task.resourceAssignments?.forEach((assignment) => {
        const resource = project.resources.find(r => r.id === assignment.resourceId);
        if (!resource) return;

        const existing = resourceMap.get(resource.id);
        if (existing) {
          existing.tasks.push({
            taskName: task.name,
            allocation: assignment.allocationPercentage,
          });
          existing.totalAllocation += assignment.allocationPercentage;
        } else {
          resourceMap.set(resource.id, {
            resourceName: resource.name,
            tasks: [{ taskName: task.name, allocation: assignment.allocationPercentage }],
            totalAllocation: assignment.allocationPercentage,
            avgAllocation: assignment.allocationPercentage,
          });
        }
      });
    });

    // Calculate averages
    resourceMap.forEach((data) => {
      data.avgAllocation = Math.round(data.totalAllocation / data.tasks.length);
    });

    return Array.from(resourceMap.values()).sort((a, b) => b.avgAllocation - a.avgAllocation);
  }, [phase, project]);

  // Get deliverables (tasks)
  const deliverables = phase.tasks?.map(t => t.name) || [];

  // Layout-specific styling
  const containerStyle: React.CSSProperties = layout === 'below'
    ? {
        backgroundColor: "rgba(0, 122, 255, 0.02)",
        border: "1px solid rgba(0, 122, 255, 0.2)",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 16px 16px 16px",
      }
    : layout === 'side'
    ? {
        position: "fixed",
        right: 0,
        top: "56px",
        bottom: 0,
        width: "400px",
        backgroundColor: "#fff",
        borderLeft: "2px solid var(--color-gray-4)",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.1)",
        padding: "24px",
        overflowY: "auto",
        zIndex: 30,
      }
    : {
        backgroundColor: "rgba(0, 122, 255, 0.05)",
        borderBottom: "1px solid rgba(0, 122, 255, 0.2)",
        padding: "12px 16px",
        display: "flex",
        gap: "24px",
        alignItems: "center",
        overflow: "auto",
      };

  if (layout === 'row') {
    // Compact horizontal layout
    return (
      <div style={containerStyle}>
        <div style={{ minWidth: "200px" }}>
          <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-caption)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "4px" }}>
            Resources ({resourceData.length})
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {resourceData.map((res, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid var(--color-gray-4)" }}>
                <span style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-caption)", fontWeight: "var(--weight-medium)" }}>{res.resourceName}</span>
                <span style={{ fontSize: "10px", fontWeight: "var(--weight-semibold)", backgroundColor: "rgba(0, 122, 255, 0.1)", color: "rgb(0, 122, 255)", padding: "2px 4px", borderRadius: "3px" }}>
                  {res.avgAllocation}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ minWidth: "200px" }}>
          <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-caption)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "4px" }}>
            Deliverables ({deliverables.length})
          </div>
          <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-caption)", opacity: 0.7 }}>
            {deliverables.slice(0, 3).join(", ")}
            {deliverables.length > 3 && ` +${deliverables.length - 3} more`}
          </div>
        </div>
      </div>
    );
  }

  // Full layout (below or side)
  return (
    <div style={containerStyle}>
      {/* Header with View Toggle */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-display-small)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "4px" }}>
              Resource Overview
            </div>
            <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", opacity: 0.6 }}>
              {phase.name} • {resourceData.length} resources • {deliverables.length} deliverables
            </div>
          </div>

          {/* View Toggle */}
          <div style={{ display: "flex", gap: "4px", backgroundColor: "rgba(0, 0, 0, 0.04)", borderRadius: "8px", padding: "4px" }}>
            <button
              onClick={() => setView('allocation')}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: view === 'allocation' ? "#fff" : "transparent",
                color: view === 'allocation' ? "#000" : "rgba(0, 0, 0, 0.6)",
                fontFamily: "var(--font-text)",
                fontSize: "var(--text-caption)",
                fontWeight: "var(--weight-semibold)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: view === 'allocation' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
              }}
            >
              Allocation
            </button>
            <button
              onClick={() => setView('orgchart')}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: view === 'orgchart' ? "#fff" : "transparent",
                color: view === 'orgchart' ? "#000" : "rgba(0, 0, 0, 0.6)",
                fontFamily: "var(--font-text)",
                fontSize: "var(--text-caption)",
                fontWeight: "var(--weight-semibold)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: view === 'orgchart' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
              }}
            >
              Org Chart
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {view === 'allocation' ? (
        <>
          {/* Resource Allocation Breakdown */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "12px" }}>
              Resource Allocation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {resourceData.map((res, idx) => (
                <div key={idx} style={{ backgroundColor: "#fff", borderRadius: "6px", border: "1px solid var(--color-gray-4)", padding: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", fontWeight: "var(--weight-medium)", color: "#000" }}>
                      {res.resourceName}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "var(--weight-semibold)", backgroundColor: "rgba(0, 122, 255, 0.1)", color: "rgb(0, 122, 255)", padding: "3px 8px", borderRadius: "4px" }}>
                      Avg: {res.avgAllocation}%
                    </span>
                  </div>

                  {/* FTE Visualization Bar */}
                  <div style={{ height: "6px", backgroundColor: "var(--color-gray-5)", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                    <div style={{ width: `${Math.min(res.avgAllocation, 100)}%`, height: "100%", backgroundColor: res.avgAllocation > 100 ? "#ff3b30" : "rgb(0, 122, 255)", transition: "width 0.3s ease" }} />
                  </div>

                  {/* Task Breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {res.tasks.map((task, taskIdx) => (
                      <div key={taskIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "var(--text-caption)", opacity: 0.8 }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.taskName}</span>
                        <span style={{ fontSize: "10px", fontWeight: "var(--weight-semibold)", marginLeft: "8px" }}>{task.allocation}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* FTE% Summary Chart */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "12px" }}>
          FTE% Distribution
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "80px" }}>
          {resourceData.map((res, idx) => {
            const maxAllocation = Math.max(...resourceData.map(r => r.avgAllocation));
            const barHeight = (res.avgAllocation / maxAllocation) * 100;
            return (
              <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end" }}>
                  <div
                    style={{
                      width: "100%",
                      height: `${barHeight}%`,
                      backgroundColor: res.avgAllocation > 100 ? "#ff3b30" : "rgb(0, 122, 255)",
                      borderRadius: "4px 4px 0 0",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      paddingTop: "4px",
                    }}
                  >
                    <span style={{ fontSize: "10px", fontWeight: "var(--weight-semibold)", color: "#fff" }}>
                      {res.avgAllocation}%
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: "var(--text-detail)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={res.resourceName}>
                  {res.resourceName.split(" ")[0]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deliverables List */}
      <div>
        <div style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", fontWeight: "var(--weight-semibold)", color: "#000", marginBottom: "12px" }}>
          Deliverables ({deliverables.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {deliverables.map((deliverable, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", backgroundColor: "#fff", borderRadius: "4px", border: "1px solid var(--color-gray-4)" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(0, 122, 255, 0.1)", color: "rgb(0, 122, 255)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-detail)", fontWeight: "var(--weight-semibold)" }}>
                {idx + 1}
              </span>
              <span style={{ fontFamily: "var(--font-text)", fontSize: "var(--text-body)", flex: 1 }}>
                {deliverable}
              </span>
            </div>
          ))}
        </div>
      </div>
        </>
      ) : (
        /* Org Chart View */
        <OrgChartView phase={phase} project={project} />
      )}
    </div>
  );
}
