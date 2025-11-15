/**
 * RACIMatrix - Visual RACI matrix display component
 *
 * Shows resources in rows, deliverables/tasks in columns
 * Click cells to assign R/A/C/I roles
 *
 * Design Philosophy:
 * - Clarity: Color-coded roles for quick scanning
 * - Interactivity: Click to toggle roles
 * - Validation: Visual warning for multiple Accountables
 * - Accessibility: Keyboard navigation support
 */

"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import type { RACIAssignment, Resource, Phase, Task } from "@/types/gantt-tool";

interface RACIMatrixProps {
  /** Resources (rows) */
  resources: Resource[];

  /** Items (columns) - can be phases or tasks */
  items: Array<{ id: string; name: string; raciAssignments?: RACIAssignment[] }>;

  /** Label for items */
  itemLabel?: string;

  /** Callback when a role is toggled */
  onRoleToggle?: (itemId: string, resourceId: string, role: RACIRole | null) => void;

  /** Read-only mode (no editing) */
  readOnly?: boolean;
}

// Role configuration
const RACI_ROLES = {
  R: { label: "Responsible", color: "#007AFF", bgColor: "rgba(0, 122, 255, 0.1)" },
  A: { label: "Accountable", color: "#FF3B30", bgColor: "rgba(255, 59, 48, 0.1)" },
  C: { label: "Consulted", color: "#FF9500", bgColor: "rgba(255, 149, 0, 0.1)" },
  I: { label: "Informed", color: "#8E8E93", bgColor: "rgba(142, 142, 147, 0.1)" },
} as const;

type RACIRole = keyof typeof RACI_ROLES;

export function RACIMatrix({
  resources,
  items,
  itemLabel = "Item",
  onRoleToggle,
  readOnly = false,
}: RACIMatrixProps) {
  // Get role for a specific resource-item pair
  const getRole = (itemId: string, resourceId: string): RACIRole | null => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.raciAssignments) return null;

    const assignment = item.raciAssignments.find((a) => a.resourceId === resourceId);
    if (!assignment) return null;

    // Convert full role name to shorthand
    const roleMap: Record<string, RACIRole> = {
      responsible: "R",
      accountable: "A",
      consulted: "C",
      informed: "I",
    };

    return roleMap[assignment.role] || null;
  };

  // Toggle role in a cell
  const handleCellClick = (itemId: string, resourceId: string) => {
    if (readOnly || !onRoleToggle) return;

    const currentRole = getRole(itemId, resourceId);

    // Cycle through: null -> R -> A -> C -> I -> null
    const roleOrder: Array<RACIRole | null> = [null, "R", "A", "C", "I"];
    const currentIndex = currentRole ? roleOrder.indexOf(currentRole) : 0;
    const nextIndex = (currentIndex + 1) % roleOrder.length;
    const nextRole = roleOrder[nextIndex];

    onRoleToggle(itemId, resourceId, nextRole);
  };

  // Validate: check for multiple Accountables per item
  const getValidationWarnings = () => {
    const warnings: Array<{ itemId: string; itemName: string }> = [];

    items.forEach((item) => {
      const accountableCount = resources.filter(
        (resource) => getRole(item.id, resource.id) === "A"
      ).length;

      if (accountableCount > 1) {
        warnings.push({ itemId: item.id, itemName: item.name });
      }
    });

    return warnings;
  };

  const validationWarnings = getValidationWarnings();

  if (resources.length === 0 || items.length === 0) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#86868B",
          fontFamily: "var(--font-text)",
          fontSize: "14px",
          backgroundColor: "#F5F5F7",
          borderRadius: "8px",
        }}
      >
        {resources.length === 0
          ? "No resources available. Add resources to the project first."
          : "No items to display."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(255, 59, 48, 0.1)",
            border: "1px solid rgba(255, 59, 48, 0.3)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <AlertCircle className="w-5 h-5" style={{ color: "#FF3B30", flexShrink: 0, marginTop: "2px" }} />
          <div
            style={{
              fontFamily: "var(--font-text)",
              fontSize: "13px",
              color: "#1D1D1F",
              lineHeight: "1.5",
            }}
          >
            <strong>Multiple Accountables detected:</strong>
            <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
              {validationWarnings.map((warning) => (
                <li key={warning.itemId}>{warning.itemName}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Matrix */}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-text)",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#FAFAFA" }}>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "#1D1D1F",
                  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#FAFAFA",
                  zIndex: 2,
                }}
              >
                Resource
              </th>
              {items.map((item) => (
                <th
                  key={item.id}
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#1D1D1F",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    minWidth: "120px",
                    maxWidth: "200px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.name}
                >
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((resource, rowIndex) => (
              <tr
                key={resource.id}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    fontWeight: 500,
                    color: "#1D1D1F",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    position: "sticky",
                    left: 0,
                    backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#FAFAFA",
                    zIndex: 1,
                  }}
                >
                  <div>{resource.name}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#86868B",
                      marginTop: "2px",
                    }}
                  >
                    {resource.description}
                  </div>
                </td>
                {items.map((item) => {
                  const role = getRole(item.id, resource.id);
                  const config = role ? RACI_ROLES[role] : null;

                  return (
                    <td
                      key={`${resource.id}-${item.id}`}
                      style={{
                        padding: "8px",
                        textAlign: "center",
                        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                        cursor: readOnly ? "default" : "pointer",
                      }}
                      onClick={() => handleCellClick(item.id, resource.id)}
                    >
                      {role && config ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            backgroundColor: config.bgColor,
                            color: config.color,
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.15s ease",
                          }}
                          title={config.label}
                        >
                          {role}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            backgroundColor: readOnly ? "transparent" : "#F5F5F7",
                            color: "#D1D1D6",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          padding: "12px 16px",
          backgroundColor: "#F5F5F7",
          borderRadius: "8px",
          fontFamily: "var(--font-text)",
          fontSize: "12px",
        }}
      >
        {(Object.entries(RACI_ROLES) as Array<[RACIRole, typeof RACI_ROLES[RACIRole]]>).map(
          ([key, config]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: config.bgColor,
                  color: config.color,
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                }}
              >
                {key}
              </div>
              <span style={{ color: "#1D1D1F", fontWeight: 500 }}>{config.label}</span>
            </div>
          )
        )}
      </div>

      {/* Help Text */}
      {!readOnly && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            color: "#86868B",
            textAlign: "center",
          }}
        >
          Click cells to cycle through roles: None → R → A → C → I → None
        </div>
      )}
    </div>
  );
}

export default RACIMatrix;
