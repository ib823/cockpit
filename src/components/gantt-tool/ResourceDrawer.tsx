/**
 * Resource Drawer - Bottom slide-up drawer for resource allocation
 *
 * Design Philosophy:
 * - Preserves context: Gantt stays visible above (dimmed)
 * - Progressive disclosure: Slide up smoothly from bottom
 * - Clear hierarchy: Always show task/phase context
 * - Visual feedback: Sliders, colors, real-time updates
 */

"use client";

import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { useState, useMemo, useEffect } from "react";
import { X, Users, Plus, Trash2, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import FocusTrap from "focus-trap-react";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  canAssignToPhase,
  canAssignToTask,
  type Resource,
  type ResourceCategory,
} from "@/types/gantt-tool";

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

// Visual slider component for allocation
function AllocationSlider({
  value,
  onChange,
  resourceName,
}: {
  value: number;
  onChange: (val: number) => void;
  resourceName: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const getColor = () => {
    if (value > 100) return "#FF3B30"; // Red
    if (value >= 80) return "#FF9500"; // Orange
    return "#007AFF"; // Blue
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-700">Time Allocation</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Math.max(0, Math.min(200, Number(e.target.value))))}
            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm font-bold" style={{ color: getColor() }}>
            %
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${getColor()} 0%, ${getColor()} ${Math.min(value, 100)}%, #e5e7eb ${Math.min(value, 100)}%, #e5e7eb 100%)`,
            transition: isDragging ? "none" : "all 0.2s ease",
          }}
        />
        {/* Visual markers */}
        <div className="flex justify-between mt-1 px-1">
          <span className="text-xs text-gray-400">0%</span>
          <span className="text-xs text-gray-500 font-medium">50%</span>
          <span className="text-xs text-gray-500 font-medium">100%</span>
          <span className="text-xs text-gray-400">200%</span>
        </div>
      </div>
      {value > 100 && (
        <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          <AlertTriangle className="w-3 h-3" />
          <span>Overallocated - {resourceName} is at {value}%</span>
        </div>
      )}
    </div>
  );
}

// Assigned resource card with visual slider
function AssignedResourceCard({
  assignment,
  resource,
  category,
  workingDays,
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
  workingDays: number;
  onAllocate: (resourceId: string, percentage: number, notes?: string) => void;
  onRemove: (resourceId: string) => void;
}) {
  const [localPercentage, setLocalPercentage] = useState(assignment.allocationPercentage);
  const [notes, setNotes] = useState(assignment.assignmentNotes);

  const allocatedDays = Math.round((workingDays * localPercentage) / 100);

  return (
    <div className="bg-white rounded-xl border-2 border-blue-100 p-4 hover:border-blue-300 transition-all shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{category.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">{resource.name}</h4>
            <p className="text-xs text-gray-500">{RESOURCE_DESIGNATIONS[resource.designation]}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-blue-600">{allocatedDays}d</div>
            <div className="text-xs text-gray-500">of {workingDays}d</div>
          </div>
        </div>
        <button
          onClick={() => onRemove(resource.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-2"
          title="Remove assignment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Allocation Slider */}
      <AllocationSlider
        value={localPercentage}
        onChange={(val) => {
          setLocalPercentage(val);
          onAllocate(resource.id, val, notes);
        }}
        resourceName={resource.name}
      />

      {/* Assignment Notes */}
      <div className="mt-3">
        <label className="text-xs font-medium text-gray-700 block mb-1">
          What will they work on?
        </label>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            onAllocate(resource.id, localPercentage, e.target.value);
          }}
          placeholder="e.g., Requirements gathering, documentation..."
          rows={2}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>
    </div>
  );
}

export function ResourceDrawer({ itemId, itemType, onClose }: Props) {
  const {
    currentProject,
    assignResourceToPhase,
    assignResourceToTask,
    unassignResourceFromPhase,
    unassignResourceFromTask,
    updatePhaseResourceAssignment,
    updateTaskResourceAssignment,
    updateResource,
  } = useGanttToolStoreV2();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  // Animate in on mount
  useEffect(() => {
    setIsAnimatingIn(true);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Find the item (phase or task)
  const item = useMemo(() => {
    if (!currentProject) return null;

    if (itemType === "phase") {
      return currentProject.phases.find((p) => p.id === itemId);
    } else {
      for (const phase of currentProject.phases) {
        const task = phase.tasks.find((t) => t.id === itemId);
        if (task) {
          return { ...task, phaseId: phase.id, phaseName: phase.name };
        }
      }
    }
    return null;
  }, [currentProject, itemId, itemType]);

  // Calculate working days
  const workingDays = useMemo(() => {
    if (!item) return 0;
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }, [item]);

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

  // Calculate total allocation
  const totalAllocation = currentAssignments.reduce(
    (sum, a) => sum + a.allocationPercentage,
    0
  );

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
      if (resource.category && grouped[resource.category]) {
        // Filter by search term
        if (
          searchTerm &&
          !resource.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !RESOURCE_DESIGNATIONS[resource.designation]
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        ) {
          return;
        }
        grouped[resource.category].push(resource);
      } else {
        grouped.other.push(resource);
      }
    });

    return grouped;
  }, [currentProject, searchTerm]);

  // Check if resource is already assigned
  const isAssigned = (resourceId: string) =>
    currentAssignments.some((a) => a.resourceId === resourceId);

  // Handle allocation
  const handleAllocate = async (resourceId: string, percentage: number, notes?: string) => {
    const resource = currentProject?.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    // Check assignment level and auto-fix if needed
    if (itemType === "phase" && !canAssignToPhase(resource)) {
      const shouldFix = window.confirm(
        `${resource.name} is currently configured for task-level assignments only.\n\nWould you like to update their settings to allow phase-level assignments?\n\n(This will change their assignment level to "Both")`
      );

      if (!shouldFix) return;

      // Auto-fix: Update resource to allow both levels
      await updateResource(resourceId, { assignmentLevel: "both" });
    }

    if (itemType === "task" && !canAssignToTask(resource)) {
      const shouldFix = window.confirm(
        `${resource.name} is currently configured for phase-level assignments only.\n\nWould you like to update their settings to allow task-level assignments?\n\n(This will change their assignment level to "Both")`
      );

      if (!shouldFix) return;

      // Auto-fix: Update resource to allow both levels
      await updateResource(resourceId, { assignmentLevel: "both" });
    }

    const existingIndex = currentAssignments.findIndex((a) => a.resourceId === resourceId);

    if (existingIndex >= 0) {
      // Update existing
      const assignment = currentAssignments[existingIndex];
      const finalNotes = notes !== undefined ? notes : assignment.assignmentNotes;

      if (itemType === "phase") {
        updatePhaseResourceAssignment(itemId, assignment.assignmentId!, finalNotes, percentage);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = item as any;
        updateTaskResourceAssignment(
          itemId,
          task.phaseId,
          assignment.assignmentId!,
          finalNotes,
          percentage
        );
      }
    } else {
      // New assignment
      const defaultNotes = notes || "";
      if (itemType === "phase") {
        assignResourceToPhase(itemId, resourceId, defaultNotes, percentage);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const task = item as any;
        assignResourceToTask(task.phaseId, itemId, resourceId, defaultNotes, percentage);
      }
    }
  };

  // Handle remove
  const handleRemove = (resourceId: string) => {
    const assignment = currentAssignments.find((a) => a.resourceId === resourceId);
    if (!assignment) return;

    if (itemType === "phase") {
      unassignResourceFromPhase(itemId, assignment.assignmentId!);
    } else {
      const task = item as any;
      unassignResourceFromTask(itemId, task.phaseId, assignment.assignmentId!);
    }
  };

  // Handle close with animation
  const handleClose = () => {
    setIsAnimatingIn(false);
    setTimeout(onClose, 200); // Wait for animation
  };

  if (!currentProject || !item) return null;

  return (
    <>
      {/* Backdrop - dims the Gantt view */}
      <div
        className="fixed inset-0 bg-black/30 z-[80] transition-opacity duration-200"
        style={{ opacity: isAnimatingIn ? 1 : 0 }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer with Focus Trap */}
      <FocusTrap active={isAnimatingIn}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-drawer-title"
          aria-describedby="resource-drawer-description"
          className="fixed inset-x-0 bottom-0 z-[90] transition-transform duration-300 ease-out"
          style={{
            transform: isAnimatingIn ? "translateY(0)" : "translateY(100%)",
            maxHeight: "85vh",
          }}
        >
          <div className="bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] mx-auto max-w-7xl">
          {/* Header - FIXED */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-3xl">
            <div className="px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span id="resource-drawer-description" className="text-sm font-medium text-white/80">
                      Allocating Resources to
                    </span>
                    <span className="px-2 py-0.5 bg-white/25 rounded text-xs font-bold text-white backdrop-blur-sm">
                      {itemType === "phase" ? "PHASE" : "TASK"}
                    </span>
                  </div>
                  <h2 id="resource-drawer-title" className="text-2xl font-bold text-white truncate">{item.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    {itemType === "task" && "phaseName" in item && (
                      <span className="text-sm text-white/90 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Phase: {item.phaseName}
                      </span>
                    )}
                    <span className="text-sm text-white/90 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {workingDays} working days
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close resource allocation drawer"
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" aria-hidden="true" />
              </button>
            </div>

            {/* Summary bar */}
            {currentAssignments.length > 0 && (
              <div className="px-8 pb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="text-xs text-white/80">Assigned Resources</div>
                      <div className="text-xl font-bold text-white">
                        {new Set(currentAssignments.map(a => a.resourceId)).size}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-white/30" />
                    <div>
                      <div className="text-xs text-white/80">Total Allocation</div>
                      <div
                        className="text-xl font-bold"
                        style={{
                          color: totalAllocation > 100 ? "#FF3B30" : "white",
                        }}
                      >
                        {totalAllocation}%
                      </div>
                    </div>
                  </div>
                  {totalAllocation > 100 && (
                    <div className="flex items-center gap-2 text-sm text-white bg-red-500/30 px-3 py-1 rounded-full">
                      <AlertTriangle className="w-4 h-4" />
                      Overallocated
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            {/* Assigned Resources */}
            {currentAssignments.length > 0 && (
              <div className="p-8 bg-gray-50 border-b-2 border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Assigned Resources ({new Set(currentAssignments.map(a => a.resourceId)).size})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                        workingDays={workingDays}
                        onAllocate={handleAllocate}
                        onRemove={handleRemove}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Resources */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Available Resources
                </h3>
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                />
              </div>

              <div className="space-y-4">
                {Object.entries(resourcesByCategory).map(([categoryKey, resources]) => {
                  const category = RESOURCE_CATEGORIES[categoryKey as ResourceCategory];
                  const availableResources = (resources as Resource[]).filter((r) => {
                    if (itemType === "phase") {
                      return canAssignToPhase(r) && !isAssigned(r.id);
                    }
                    return canAssignToTask(r) && !isAssigned(r.id);
                  });

                  if (availableResources.length === 0) return null;

                  return (
                    <div key={categoryKey} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{category.icon}</span>
                        <span
                          className="font-semibold text-sm"
                          style={{ color: category.color }}
                        >
                          {category.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({availableResources.length} available)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {availableResources.map((resource) => (
                          <button
                            key={resource.id}
                            onClick={() =>
                              handleAllocate(resource.id, itemType === "phase" ? 20 : 80)
                            }
                            className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-blue-600">
                                  {resource.name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {RESOURCE_DESIGNATIONS[resource.designation]}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty state */}
              {Object.values(resourcesByCategory).every(
                (resources) =>
                  (resources as Resource[]).filter((r) =>
                    itemType === "phase"
                      ? canAssignToPhase(r) && !isAssigned(r.id)
                      : canAssignToTask(r) && !isAssigned(r.id)
                  ).length === 0
              ) && (
                <div className="text-center py-16 px-8">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-12 max-w-md mx-auto">
                    <Users className="w-20 h-20 text-blue-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {searchTerm
                        ? "No matching resources"
                        : currentAssignments.length > 0
                          ? "All resources assigned!"
                          : "No resources yet"}
                    </h3>
                    <p className="text-gray-600 mb-6 text-base leading-relaxed">
                      {searchTerm
                        ? "Try adjusting your search term or add new resources to your project"
                        : currentAssignments.length > 0
                          ? "Great work! All available resources have been assigned to this " + itemType
                          : "Add team members, consultants, or other resources to your project to get started"}
                    </p>
                    {!searchTerm && currentAssignments.length === 0 && (
                      <button
                        onClick={() => {
                          handleClose();
                          // Navigate to resources management
                          window.location.href = '/gantt-tool#resources';
                        }}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        Add Your First Resource
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
              aria-label="Close drawer and save resource allocations"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-sm shadow-lg hover:shadow-xl"
            >
              Done
            </button>
          </div>
        </div>
      </div>
      </FocusTrap>
    </>
  );
}
