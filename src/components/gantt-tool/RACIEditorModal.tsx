/**
 * RACIEditorModal - Manage RACI assignments for phases and tasks
 *
 * RACI Matrix:
 * - R = Responsible (does the work)
 * - A = Accountable (final approver, only 1 per item)
 * - C = Consulted (provides input)
 * - I = Informed (kept in the loop)
 *
 * Design Philosophy:
 * - Simplicity: Clear role selector per resource
 * - Validation: Max 1 Accountable per item
 * - Intelligence: Shows summary count
 * - Accessibility: Keyboard navigation
 */

"use client";

import { useState, useEffect } from "react";
import { Users, AlertCircle, Check } from "lucide-react";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import type { RACIAssignment, Resource, Phase, Task } from "@/types/gantt-tool";
import { nanoid } from "nanoid";

interface RACIEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Phase | Task;
  itemType: "phase" | "task";
  phaseId?: string; // Required if itemType is "task"
}

// Role configuration with colors
const RACI_ROLES = {
  responsible: { label: "Responsible", color: "#007AFF", shortLabel: "R" },
  accountable: { label: "Accountable", color: "#FF3B30", shortLabel: "A" },
  consulted: { label: "Consulted", color: "#FF9500", shortLabel: "C" },
  informed: { label: "Informed", color: "#8E8E93", shortLabel: "I" },
  none: { label: "No Role", color: "#F5F5F7", shortLabel: "-" },
} as const;

type RACIRole = keyof typeof RACI_ROLES | "none";

export function RACIEditorModal({
  isOpen,
  onClose,
  item,
  itemType,
  phaseId,
}: RACIEditorModalProps) {
  const { currentProject, updatePhaseRaci, updateTaskRaci } = useGanttToolStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Local state: map resourceId -> role
  const [resourceRoles, setResourceRoles] = useState<Record<string, RACIRole>>({});

  // Initialize from existing assignments
  useEffect(() => {
    if (isOpen && currentProject) {
      const existingAssignments = item.raciAssignments || [];
      const initialRoles: Record<string, RACIRole> = {};

      // Set all resources to "none" first
      currentProject.resources.forEach((resource) => {
        initialRoles[resource.id] = "none";
      });

      // Override with existing assignments
      existingAssignments.forEach((assignment) => {
        initialRoles[assignment.resourceId] = assignment.role;
      });

      setResourceRoles(initialRoles);
      setValidationError(null);
    }
  }, [isOpen, item, currentProject]);

  if (!currentProject) return null;

  const resources = currentProject.resources || [];

  // Calculate summary counts
  const summary = {
    responsible: Object.values(resourceRoles).filter((r) => r === "responsible").length,
    accountable: Object.values(resourceRoles).filter((r) => r === "accountable").length,
    consulted: Object.values(resourceRoles).filter((r) => r === "consulted").length,
    informed: Object.values(resourceRoles).filter((r) => r === "informed").length,
  };

  // Validation
  const validate = (): boolean => {
    // Check: Max 1 Accountable
    if (summary.accountable > 1) {
      setValidationError("Only one resource can be Accountable. Please select one.");
      return false;
    }

    // Warning: No Accountable (not blocking)
    if (summary.accountable === 0) {
      setValidationError("Warning: No Accountable assigned. Consider assigning one.");
      // Don't block save
    } else {
      setValidationError(null);
    }

    return true;
  };

  // Handle role change
  const handleRoleChange = (resourceId: string, role: RACIRole) => {
    setResourceRoles((prev) => ({ ...prev, [resourceId]: role }));

    // Clear validation error when user makes changes
    setValidationError(null);
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Convert resourceRoles map to RACIAssignment array (exclude "none")
      const assignments: RACIAssignment[] = Object.entries(resourceRoles)
        .filter(([_, role]) => role !== "none")
        .map(([resourceId, role]) => ({
          id: `raci-${Date.now()}-${nanoid()}`,
          resourceId,
          role: role as "responsible" | "accountable" | "consulted" | "informed",
        }));

      // Save to store
      if (itemType === "phase") {
        await updatePhaseRaci(item.id, assignments);
      } else if (itemType === "task" && phaseId) {
        await updateTaskRaci(item.id, phaseId, assignments);
      }

      onClose();
    } catch (error) {
      console.error("Failed to update RACI:", error);
      setValidationError("Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit RACI Matrix"
      subtitle={`${itemType === "phase" ? "Phase" : "Task"}: ${item.name}`}
      icon={<Users className="w-5 h-5" />}
      size="large"
      footer={
        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: "12px" }}>
          <ModalButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </ModalButton>
          <ModalButton variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save RACI"}
          </ModalButton>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Summary Card */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "8px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#86868B",
                marginBottom: "4px",
              }}
            >
              Responsible
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                color: RACI_ROLES.responsible.color,
              }}
            >
              {summary.responsible}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#86868B",
                marginBottom: "4px",
              }}
            >
              Accountable
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                color: RACI_ROLES.accountable.color,
              }}
            >
              {summary.accountable}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#86868B",
                marginBottom: "4px",
              }}
            >
              Consulted
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                color: RACI_ROLES.consulted.color,
              }}
            >
              {summary.consulted}
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#86868B",
                marginBottom: "4px",
              }}
            >
              Informed
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                fontWeight: 600,
                color: RACI_ROLES.informed.color,
              }}
            >
              {summary.informed}
            </div>
          </div>
        </div>

        {/* Validation Warning */}
        {validationError && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor:
                summary.accountable > 1
                  ? "rgba(255, 59, 48, 0.1)"
                  : "rgba(255, 149, 0, 0.1)",
              border: `1px solid ${summary.accountable > 1 ? "rgba(255, 59, 48, 0.3)" : "rgba(255, 149, 0, 0.3)"}`,
              borderRadius: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <AlertCircle
              className="w-5 h-5"
              style={{
                color: summary.accountable > 1 ? "#FF3B30" : "#FF9500",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "13px",
                color: "#1D1D1F",
                lineHeight: "1.5",
              }}
            >
              {validationError}
            </div>
          </div>
        )}

        {/* Resource List */}
        {resources.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "#86868B",
              fontFamily: "var(--font-text)",
              fontSize: "14px",
            }}
          >
            No resources available. Add resources to the project first.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Header Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "16px",
                padding: "12px 16px",
                backgroundColor: "#FAFAFA",
                borderRadius: "8px",
                fontFamily: "var(--font-text)",
                fontSize: "12px",
                fontWeight: 600,
                color: "#86868B",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              <div>Resource</div>
              <div style={{ minWidth: "200px" }}>RACI Role</div>
            </div>

            {/* Resource Rows */}
            {resources.map((resource) => {
              const currentRole = resourceRoles[resource.id] || "none";
              return (
                <div
                  key={resource.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "16px",
                    padding: "12px 16px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0, 0, 0, 0.06)",
                    borderRadius: "8px",
                    alignItems: "center",
                  }}
                >
                  {/* Resource Info */}
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1D1D1F",
                        marginBottom: "2px",
                      }}
                    >
                      {resource.name}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "12px",
                        color: "#86868B",
                      }}
                    >
                      {resource.description}
                    </div>
                  </div>

                  {/* Role Selector */}
                  <div style={{ display: "flex", gap: "8px", minWidth: "200px" }}>
                    {(["responsible", "accountable", "consulted", "informed", "none"] as const).map(
                      (role) => {
                        const isSelected = currentRole === role;
                        const config = RACI_ROLES[role];

                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleRoleChange(resource.id, role)}
                            aria-label={`Set ${resource.name} as ${config.label}`}
                            style={{
                              flex: 1,
                              minWidth: "36px",
                              height: "36px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isSelected ? config.color : "transparent",
                              color: isSelected ? "#FFFFFF" : config.color,
                              border: `2px solid ${isSelected ? config.color : "rgba(0, 0, 0, 0.1)"}`,
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontFamily: "var(--font-display)",
                              fontSize: "14px",
                              fontWeight: 600,
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = `${config.color}20`;
                                e.currentTarget.style.borderColor = config.color;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.1)";
                              }
                            }}
                          >
                            {config.shortLabel}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        <div
          style={{
            padding: "16px",
            backgroundColor: "#F5F5F7",
            borderRadius: "8px",
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            color: "#86868B",
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: "#1D1D1F" }}>RACI Matrix Guide:</strong>
          <ul style={{ margin: "8px 0 0 20px", padding: 0 }}>
            <li>
              <strong style={{ color: RACI_ROLES.responsible.color }}>Responsible (R)</strong>: Does
              the work to complete the task
            </li>
            <li>
              <strong style={{ color: RACI_ROLES.accountable.color }}>Accountable (A)</strong>: Final
              approver, ultimate ownership (only 1)
            </li>
            <li>
              <strong style={{ color: RACI_ROLES.consulted.color }}>Consulted (C)</strong>: Provides
              input and expertise
            </li>
            <li>
              <strong style={{ color: RACI_ROLES.informed.color }}>Informed (I)</strong>: Kept in the
              loop, receives updates
            </li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
}

export default RACIEditorModal;
