/**
 * Phase/Task Resource Allocation Modal
 *
 * Steve Jobs: "Simple can be harder than complex... But it's worth it."
 * Jony Ive: "We don't just make products, we craft experiences."
 *
 * Revolutionary UX for resource allocation:
 * - Horizontal sliders for % allocation
 * - Structured view of all resources
 * - Smart defaults and visual feedback
 * - One-click assign with instant preview
 */

"use client";

import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar, Users } from "lucide-react";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  canAssignToPhase,
  canAssignToTask,
  type Resource,
  type ResourceCategory,
} from "@/types/gantt-tool";
import { BaseModal, ModalButton } from "@/components/ui/BaseModal";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS } from "@/lib/design-system/tokens";

interface Props {
  itemId: string;
  itemType: "phase" | "task";
  onClose: () => void;
}

interface ResourceAllocation {
  resourceId: string;
  allocationPercentage: number;
  assignmentNotes: string;
}

// Separate component to fix React Hooks violation
function AssignedResourceCard({
  assignment,
  resource,
  category,
  onAllocate,
  onRemove,
}: {
  assignment: {
    resourceId: string;
    allocationPercentage: number;
    assignmentNotes: string;
    assignmentId?: string;
  };
  resource: Resource;
  category: { label: string; color: string; icon: string };
  onAllocate: (resourceId: string, percentage: number, notes?: string) => void;
  onRemove: (resourceId: string) => void;
}) {
  const [localPercentage, setLocalPercentage] = useState(assignment.allocationPercentage);

  return (
    <div style={{ backgroundColor: COLORS.bg.primary, borderRadius: RADIUS.default, border: `2px solid ${COLORS.blueLight}`, padding: SPACING[4] }}>
      {/* Resource Info */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: SPACING[3] }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING[2], flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: TYPOGRAPHY.fontSize.title, flexShrink: 0 }}>{category.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resource.name}</h4>
            <p style={{ fontSize: "11px", color: COLORS.text.tertiary }}>{RESOURCE_DESIGNATIONS[resource.designation]}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(resource.id)}
          style={{ padding: SPACING[1], color: COLORS.text.tertiary, borderRadius: RADIUS.small, transition: `colors ${TRANSITIONS.duration.fast}`, flexShrink: 0 }} onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.red; e.currentTarget.style.backgroundColor = "#FEE"; }} onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.text.tertiary; e.currentTarget.style.backgroundColor = "transparent"; }}
          title="Remove assignment"
        >
          <Trash2 style={{ width: "16px", height: "16px" }} />
        </button>
      </div>

      {/* Allocation Slider */}
      <div style={{ marginBottom: SPACING[3] }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING[2] }}>
          <label style={{ fontSize: "11px", fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>Allocation</label>
          <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
            <input
              type="number"
              value={localPercentage}
              onChange={(e) => {
                const val = Math.max(1, Math.min(100, Number(e.target.value)));
                setLocalPercentage(val);
                onAllocate(resource.id, val);
              }}
              min="1"
              max="100"
              style={{ width: "64px", padding: `${SPACING[1]} ${SPACING[2]}`, fontSize: "11px", border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.small, textAlign: "center" }}
            />
            <span style={{ fontSize: "11px", fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>%</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={localPercentage}
          onChange={(e) => {
            const val = Number(e.target.value);
            setLocalPercentage(val);
            onAllocate(resource.id, val);
          }}
          style={{ width: "100%", height: "8px", borderRadius: RADIUS.default, appearance: "none", cursor: "pointer", accentColor: COLORS.blue, background: `linear-gradient(to right, #2563eb 0%, #2563eb ${localPercentage}%, #e5e7eb ${localPercentage}%, #e5e7eb 100%)` }}
        />
      </div>

      {/* Assignment Notes */}
      <div>
        <label style={{ fontSize: "11px", fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, display: "block", marginBottom: SPACING[1] }}>Notes</label>
        <textarea
          value={assignment.assignmentNotes}
          onChange={(e) => onAllocate(resource.id, localPercentage, e.target.value)}
          placeholder="What will they work on?"
          rows={2}
          style={{ width: "100%", padding: `${SPACING[1]} ${SPACING[2]}`, fontSize: "11px", border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, outline: "none" }} onFocus={(e) => { e.target.style.borderColor = COLORS.blue; e.target.style.boxShadow = `0 0 0 2px ${COLORS.blueLight}`; }} onBlur={(e) => { e.target.style.borderColor = COLORS.border.default; e.target.style.boxShadow = "none"; }}
        />
      </div>
    </div>
  );
}

export function PhaseTaskResourceAllocationModal({ itemId, itemType, onClose }: Props) {
  const {
    currentProject,
    assignResourceToPhase,
    assignResourceToTask,
    unassignResourceFromPhase,
    unassignResourceFromTask,
    updatePhaseResourceAssignment,
    updateTaskResourceAssignment,
  } = useGanttToolStoreV2();

  // PERMANENT FIX: Cleanup body styles on unmount
  useEffect(() => {
    // Prevent body scroll while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      // Restore original styles on unmount
      document.body.style.overflow = originalOverflow;
      document.body.style.pointerEvents = "";
    };
  }, []);

  // Find the item (phase or task)
  const item = useMemo(() => {
    if (!currentProject) return null;

    if (itemType === "phase") {
      return currentProject.phases.find((p) => p.id === itemId);
    } else {
      // Find task across all phases
      for (const phase of currentProject.phases) {
        const task = phase.tasks.find((t) => t.id === itemId);
        if (task) {
          return { ...task, phaseId: phase.id, phaseName: phase.name };
        }
      }
    }
    return null;
  }, [currentProject, itemId, itemType]);

  // Get currently assigned resources
  const currentAssignments = useMemo(() => {
    if (!item) return [];

    if (itemType === "phase" && "phaseResourceAssignments" in item) {
      return (item.phaseResourceAssignments || []).map((a) => ({
        resourceId: a.resourceId,
        allocationPercentage: a.allocationPercentage,
        assignmentNotes: a.assignmentNotes,
        assignmentId: a.id,
      }));
    } else if (itemType === "task" && "resourceAssignments" in item) {
      return (item.resourceAssignments || []).map((a) => ({
        resourceId: a.resourceId,
        allocationPercentage: a.allocationPercentage,
        assignmentNotes: a.assignmentNotes,
        assignmentId: a.id,
      }));
    }
    return [];
  }, [item, itemType]);

  // State for pending allocations (not yet saved)
  const [pendingAllocations, setPendingAllocations] = useState<ResourceAllocation[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<ResourceCategory>>(new Set());

  // Group resources by category
  const resourcesByCategory = useMemo(() => {
    if (!currentProject) return {};

    const grouped: Record<ResourceCategory, Resource[]> = {
      leadership: [],
      functional: [],
      technical: [],
      basis: [],
      security: [],
      pm: [],
      change: [],
      qa: [],
      client: [],
      other: [],
    };

    (currentProject.resources || []).forEach((resource) => {
      // Safeguard: only push if category exists in grouped object
      if (resource.category && grouped[resource.category]) {
        grouped[resource.category].push(resource);
      } else {
        // Fallback to 'other' if category is invalid or missing
        console.warn(`Resource "${resource.name}" has invalid category: ${resource.category}`);
        grouped.other.push(resource);
      }
    });

    return grouped;
  }, [currentProject]);

  // Check if resource is already assigned
  const isAssigned = (resourceId: string) => {
    return (
      currentAssignments.some((a) => a.resourceId === resourceId) ||
      pendingAllocations.some((a) => a.resourceId === resourceId)
    );
  };

  // Get current allocation for resource
  const getCurrentAllocation = (resourceId: string): number => {
    const current = currentAssignments.find((a) => a.resourceId === resourceId);
    if (current) return current.allocationPercentage;

    const pending = pendingAllocations.find((a) => a.resourceId === resourceId);
    if (pending) return pending.allocationPercentage;

    return 80; // Default
  };

  // Get current notes for resource
  const getCurrentNotes = (resourceId: string): string => {
    const current = currentAssignments.find((a) => a.resourceId === resourceId);
    if (current) return current.assignmentNotes;

    const pending = pendingAllocations.find((a) => a.resourceId === resourceId);
    if (pending) return pending.assignmentNotes;

    return "";
  };

  // Handle adding/updating allocation
  const handleAllocate = (resourceId: string, percentage: number, notes?: string) => {
    const resource = currentProject?.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    // Check if resource can be assigned to phase
    if (itemType === "phase" && !canAssignToPhase(resource)) {
      alert(
        `This resource cannot be assigned at the phase level.\n\n${resource.name} is configured for ${resource.assignmentLevel === "task" ? "task-level assignments only" : "assignments"}.\n\nTo enable phase-level assignment, edit the resource and change its "Assignment Level" setting to "Phase" or "Both".`
      );
      return;
    }

    // Check if resource can be assigned to task
    if (itemType === "task" && !canAssignToTask(resource)) {
      alert(
        `This resource cannot be assigned at the task level.\n\n${resource.name} is configured for ${resource.assignmentLevel === "phase" ? "phase-level assignments only" : "assignments"}.\n\nTo enable task-level assignment, edit the resource and change its "Assignment Level" setting to "Task" or "Both".`
      );
      return;
    }

    const existingIndex = currentAssignments.findIndex((a) => a.resourceId === resourceId);
    const designation = RESOURCE_DESIGNATIONS[resource.designation];

    if (existingIndex >= 0) {
      // Update existing assignment
      const assignment = currentAssignments[existingIndex];
      const finalNotes = notes !== undefined ? notes : assignment.assignmentNotes;

      if (itemType === "phase") {
        updatePhaseResourceAssignment(itemId, assignment.assignmentId, finalNotes, percentage);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = item as any;
        updateTaskResourceAssignment(
          itemId,
          task.phaseId,
          assignment.assignmentId,
          finalNotes,
          percentage
        );
      }
    } else {
      // New assignment
      const smartNotes =
        notes ||
        (itemType === "phase"
          ? `${designation} overseeing ${item?.name}`
          : `${designation} assigned to ${item?.name}`);

      if (itemType === "phase") {
        assignResourceToPhase(itemId, resourceId, smartNotes, percentage);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = item as any;
        assignResourceToTask(itemId, task.phaseId, resourceId, smartNotes, percentage);
      }
    }
  };

  // Handle removing allocation
  const handleRemove = (resourceId: string) => {
    const assignment = currentAssignments.find((a) => a.resourceId === resourceId);
    if (!assignment) {
      // Remove from pending
      setPendingAllocations((prev) => prev.filter((a) => a.resourceId !== resourceId));
      return;
    }

    const resource = currentProject?.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    if (confirm(`Remove ${resource.name} from this ${itemType}?`)) {
      if (itemType === "phase") {
        unassignResourceFromPhase(itemId, assignment.assignmentId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = item as any;
        unassignResourceFromTask(itemId, task.phaseId, assignment.assignmentId);
      }
    }
  };

  // Toggle category collapse
  const toggleCategory = (category: ResourceCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (!currentProject || !item) return null;

  const modalTitle = `Allocating Resources to ${itemType === "phase" ? "Phase" : "Task"}`;
  const subtitle = itemType === "task" && "phaseName" in item
    ? `${item.name} (Phase: ${item.phaseName})`
    : item.name;

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={modalTitle}
      subtitle={subtitle}
      size="xlarge"
      footer={
        <ModalButton onClick={onClose} variant="primary">
          Done
        </ModalButton>
      }
    >
      {/* Info Banner */}
      {itemType === "phase" && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: "8px",
          marginBottom: "24px",
        }}>
          <p style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            color: "#1E40AF",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{ fontWeight: 600 }}>ℹ️ Phase-Level Assignment:</span>
            Only resources configured for "Phase" or "Both" assignment levels can be assigned here.
          </p>
        </div>
      )}

      {/* CONTENT AREA */}
      <div>
            {/* Currently Assigned Resources */}
            {currentAssignments.length > 0 && (
              <div style={{ padding: `${SPACING[4]} ${SPACING[6]}`, borderBottom: `2px solid ${COLORS.border.default}`, backgroundColor: COLORS.bg.subtle }}>
                <h3 style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, marginBottom: SPACING[3], display: "flex", alignItems: "center", gap: SPACING[2] }}>
                  <Users style={{ width: "16px", height: "16px", color: COLORS.blue }} />
                  Currently Assigned ({currentAssignments.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2] }}>
                  {currentAssignments.map((assignment) => {
                    const resource = currentProject.resources.find(
                      (r) => r.id === assignment.resourceId
                    );
                    if (!resource) return null;

                    const category = RESOURCE_CATEGORIES[resource.category];

                    return (
                      <AssignedResourceCard
                        key={assignment.resourceId}
                        assignment={assignment}
                        resource={resource}
                        category={category}
                        onAllocate={handleAllocate}
                        onRemove={handleRemove}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Resources */}
            <div style={{ padding: SPACING[6] }}>
            <h3 style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, marginBottom: SPACING[3], display: "flex", alignItems: "center", gap: SPACING[2] }}>
              <Plus style={{ width: "16px", height: "16px", color: COLORS.status.success }} />
              Available Resources
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: SPACING[3] }}>
              {Object.entries(resourcesByCategory).map(([categoryKey, resources]) => {
                const category = RESOURCE_CATEGORIES[categoryKey as ResourceCategory];
                const isCollapsed = collapsedCategories.has(categoryKey as ResourceCategory);
                const availableResources = (resources as Resource[]).filter((r) => {
                  // Filter by assignment level
                  if (itemType === "phase") {
                    return canAssignToPhase(r) && !isAssigned(r.id);
                  }
                  return canAssignToTask(r) && !isAssigned(r.id);
                });

                if (availableResources.length === 0) return null;

                return (
                  <div
                    key={categoryKey}
                    style={{ border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, overflow: "hidden" }}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(categoryKey as ResourceCategory)}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${SPACING[3]} ${SPACING[4]}`, backgroundColor: COLORS.bg.subtle, transition: `background-color ${TRANSITIONS.duration.fast}` }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#E5E5EA"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.bg.subtle}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
                        {isCollapsed ? (
                          <ChevronRight style={{ width: "16px", height: "16px" }} />
                        ) : (
                          <ChevronDown style={{ width: "16px", height: "16px" }} />
                        )}
                        <span style={{ fontSize: TYPOGRAPHY.fontSize.heading }}>{category.icon}</span>
                        <span style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: category.color }}>
                          {category.label}
                        </span>
                        <span style={{ fontSize: "11px", color: COLORS.text.tertiary }}>
                          ({availableResources.length} available)
                        </span>
                      </div>
                    </button>

                    {/* Resources List */}
                    {!isCollapsed && (
                      <div style={{ padding: SPACING[3], display: "flex", flexDirection: "column", gap: SPACING[2], backgroundColor: COLORS.bg.primary }}>
                        {availableResources.map((resource) => (
                          <div
                            key={resource.id}
                            style={{ padding: SPACING[3], border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, transition: `all ${TRANSITIONS.duration.fast}` }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.blueLight; e.currentTarget.style.boxShadow = COLORS.shadow; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border.default; e.currentTarget.style.boxShadow = "none"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING[2] }}>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.primary }}>
                                  {resource.name}
                                </h4>
                                <p style={{ fontSize: "11px", color: COLORS.text.tertiary }}>
                                  {RESOURCE_DESIGNATIONS[resource.designation]}
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleAllocate(resource.id, itemType === "phase" ? 20 : 80)
                                }
                                style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: COLORS.blue, color: "#FFFFFF", fontSize: "11px", fontWeight: TYPOGRAPHY.fontWeight.semibold, borderRadius: RADIUS.default, transition: `background-color ${TRANSITIONS.duration.fast}`, display: "flex", alignItems: "center", gap: SPACING[1], border: "none", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#0051D5"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.blue}
                              >
                                <Plus style={{ width: "12px", height: "12px" }} />
                                Assign
                              </button>
                            </div>
                            {resource.description && (
                              <p style={{ fontSize: "11px", color: COLORS.text.secondary, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                {resource.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {Object.values(resourcesByCategory).every(
              (resources) =>
                (resources as Resource[]).filter((r) =>
                  itemType === "phase"
                    ? canAssignToPhase(r) && !isAssigned(r.id)
                    : canAssignToTask(r) && !isAssigned(r.id)
                ).length === 0
            ) && (
              <div style={{ textAlign: "center", padding: `${SPACING[12]} 0` }}>
                <Users style={{ width: "64px", height: "64px", color: COLORS.text.tertiary, margin: `0 auto ${SPACING[4]} auto` }} />
                <h3 style={{ fontSize: TYPOGRAPHY.fontSize.heading, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, marginBottom: SPACING[2] }}>
                  {currentAssignments.length > 0
                    ? "All resources assigned!"
                    : "No available resources"}
                </h3>
                <p style={{ color: COLORS.text.secondary, marginBottom: SPACING[4] }}>
                  {itemType === "phase"
                    ? "All resources configured for phase-level assignment are already assigned to this phase."
                    : currentAssignments.length > 0
                      ? "All project resources are assigned. Remove existing assignments or add more resources."
                      : "Add resources to your project first, then assign them here."}
                </p>
              </div>
            )}
            </div>
      </div>
    </BaseModal>
  );
}
