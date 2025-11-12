/**
 * Org Chart View - Apple HIG Design
 *
 * Traditional org chart with Jobs/Ive design excellence:
 * - Clean visual hierarchy
 * - Generous white space
 * - Subtle shadows and depth
 * - SF Pro typography
 * - Minimal color (System Blue)
 * - Clear reporting lines
 */

"use client";

import type { Resource, GanttPhase, GanttProject } from "@/types/gantt-tool";
import { useMemo } from "react";

interface OrgNode {
  resource: Resource;
  allocation: number; // Average FTE% for this phase
  taskCount: number;
  children: OrgNode[];
  level: number;
}

interface OrgChartViewProps {
  phase: GanttPhase;
  project: GanttProject;
}

export function OrgChartView({ phase, project }: OrgChartViewProps) {
  // Build org chart tree structure
  const orgTree = useMemo(() => {
    // Get all resources involved in this phase
    const phaseResourceMap = new Map<string, { allocation: number; taskCount: number }>();

    phase.tasks?.forEach((task) => {
      task.resourceAssignments?.forEach((assignment) => {
        const existing = phaseResourceMap.get(assignment.resourceId);
        if (existing) {
          existing.allocation += assignment.allocationPercentage;
          existing.taskCount += 1;
        } else {
          phaseResourceMap.set(assignment.resourceId, {
            allocation: assignment.allocationPercentage,
            taskCount: 1,
          });
        }
      });
    });

    // Calculate average allocations
    phaseResourceMap.forEach((data) => {
      data.allocation = Math.round(data.allocation / data.taskCount);
    });

    // Build tree from resources with manager relationships
    const nodeMap = new Map<string, OrgNode>();
    const roots: OrgNode[] = [];

    // Create all nodes
    project.resources.forEach((resource) => {
      const phaseData = phaseResourceMap.get(resource.id);
      if (!phaseData) return; // Skip resources not in this phase

      const node: OrgNode = {
        resource,
        allocation: phaseData.allocation,
        taskCount: phaseData.taskCount,
        children: [],
        level: 0,
      };
      nodeMap.set(resource.id, node);
    });

    // Build parent-child relationships
    nodeMap.forEach((node) => {
      const managerId = node.resource.managerResourceId;
      if (managerId && nodeMap.has(managerId)) {
        // Has manager in this phase
        const parent = nodeMap.get(managerId)!;
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        // Root node (no manager or manager not in phase)
        roots.push(node);
      }
    });

    // Sort children by designation (higher designation first)
    const designationOrder: Record<string, number> = { director: 0, senior: 1, mid: 2, junior: 3, intern: 4 };
    const sortNodes = (nodes: OrgNode[]) => {
      nodes.sort((a, b) => {
        const aOrder = designationOrder[a.resource.designation as string] ?? 999;
        const bOrder = designationOrder[b.resource.designation as string] ?? 999;
        return aOrder - bOrder;
      });
      nodes.forEach((node) => sortNodes(node.children));
    };
    sortNodes(roots);

    return roots;
  }, [phase, project]);

  // Render a node and its children
  const renderNode = (node: OrgNode, isLast: boolean = false) => {
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.resource.id} style={{ position: "relative" }}>
        {/* Node Card */}
        <div
          style={{
            position: "relative",
            width: "240px",
            margin: "0 auto 32px",
          }}
        >
          {/* Card */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid rgba(0, 0, 0, 0.06)",
              padding: "16px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)",
              transition: "all 0.2s ease",
            }}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(0, 122, 255, 0.1)",
                color: "rgb(0, 122, 255)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-text)",
                fontSize: "18px",
                fontWeight: "var(--weight-semibold)",
                marginBottom: "12px",
              }}
            >
              {node.resource.name.substring(0, 2).toUpperCase()}
            </div>

            {/* Name */}
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "15px",
                fontWeight: "var(--weight-semibold)",
                color: "#000",
                marginBottom: "4px",
                lineHeight: "1.3",
              }}
            >
              {node.resource.name}
            </div>

            {/* Role */}
            {node.resource.projectRole && (
              <div
                style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  fontWeight: "var(--weight-regular)",
                  color: "rgba(0, 0, 0, 0.6)",
                  marginBottom: "8px",
                }}
              >
                {node.resource.projectRole}
              </div>
            )}

            {/* Stats Row */}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {/* FTE Badge */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: node.allocation > 100 ? "rgba(255, 59, 48, 0.1)" : "rgba(0, 122, 255, 0.08)",
                  color: node.allocation > 100 ? "#ff3b30" : "rgb(0, 122, 255)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: "var(--weight-semibold)",
                  textAlign: "center",
                }}
              >
                {node.allocation}% FTE
              </div>

              {/* Task Count */}
              <div
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                  color: "rgba(0, 0, 0, 0.7)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  fontWeight: "var(--weight-medium)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {node.taskCount} task{node.taskCount !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Department Tag */}
            {node.resource.department && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "11px",
                  fontWeight: "var(--weight-medium)",
                  color: "rgba(0, 0, 0, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {node.resource.department}
              </div>
            )}
          </div>

          {/* Connection Line (to children) */}
          {hasChildren && (
            <div
              style={{
                position: "absolute",
                bottom: "-16px",
                left: "50%",
                width: "1px",
                height: "16px",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
              }}
            />
          )}
        </div>

        {/* Children Container */}
        {hasChildren && (
          <div
            style={{
              position: "relative",
              display: "flex",
              gap: "40px",
              justifyContent: "center",
              paddingLeft: node.children.length > 1 ? "20px" : "0",
              paddingRight: node.children.length > 1 ? "20px" : "0",
            }}
          >
            {/* Horizontal Line */}
            {node.children.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: `${(node.children.length - 1) * 280 + 40}px`,
                  height: "1px",
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                }}
              />
            )}

            {/* Vertical Connectors */}
            {node.children.map((child, idx) => (
              <div key={child.resource.id} style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "50%",
                    width: "1px",
                    height: "16px",
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                  }}
                />
                {renderNode(child, idx === node.children.length - 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (orgTree.length === 0) {
    return (
      <div
        style={{
          padding: "48px",
          textAlign: "center",
          fontFamily: "var(--font-text)",
          fontSize: "var(--text-body)",
          color: "rgba(0, 0, 0, 0.5)",
        }}
      >
        No resources assigned to this phase
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px 24px",
        overflowX: "auto",
        overflowY: "visible",
        minHeight: "400px",
      }}
    >
      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-medium)",
            fontWeight: "var(--weight-semibold)",
            color: "#000",
            marginBottom: "8px",
          }}
        >
          Team Structure
        </div>
        <div
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "var(--text-body)",
            color: "rgba(0, 0, 0, 0.6)",
          }}
        >
          {phase.name} • {orgTree.reduce((sum, node) => {
            const countNodes = (n: OrgNode): number => {
              return 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
            };
            return sum + countNodes(node);
          }, 0)} team member{orgTree.reduce((sum, node) => {
            const countNodes = (n: OrgNode): number => {
              return 1 + n.children.reduce((s, c) => s + countNodes(c), 0);
            };
            return sum + countNodes(node);
          }, 0) !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Org Chart Tree */}
      <div style={{ display: "flex", gap: "80px", justifyContent: "center" }}>
        {orgTree.map((root, idx) => (
          <div key={root.resource.id}>
            {renderNode(root, idx === orgTree.length - 1)}
          </div>
        ))}
      </div>
    </div>
  );
}
