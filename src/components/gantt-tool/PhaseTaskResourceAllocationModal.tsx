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

'use client';

import { useGanttToolStore } from '@/stores/gantt-tool-store';
import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Users,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import {
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  type Resource,
  type ResourceCategory,
} from '@/types/gantt-tool';

interface Props {
  itemId: string;
  itemType: 'phase' | 'task';
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
  assignment: { resourceId: string; allocationPercentage: number; assignmentNotes: string; assignmentId?: string };
  resource: Resource;
  category: { label: string; color: string; icon: string };
  onAllocate: (resourceId: string, percentage: number, notes?: string) => void;
  onRemove: (resourceId: string) => void;
}) {
  const [localPercentage, setLocalPercentage] = useState(assignment.allocationPercentage);

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-4">
      {/* Resource Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xl flex-shrink-0">{category.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 truncate">{resource.name}</h4>
            <p className="text-xs text-gray-500">{RESOURCE_DESIGNATIONS[resource.designation]}</p>
          </div>
        </div>
        <button
          onClick={() => onRemove(resource.id)}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
          title="Remove assignment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Allocation Slider */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">Allocation</label>
          <div className="flex items-center gap-2">
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
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded text-center"
            />
            <span className="text-xs font-bold text-gray-900">%</span>
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
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${localPercentage}%, #e5e7eb ${localPercentage}%, #e5e7eb 100%)`
          }}
        />
      </div>

      {/* Assignment Notes */}
      <div>
        <label className="text-xs font-medium text-gray-700 block mb-1">Notes</label>
        <textarea
          value={assignment.assignmentNotes}
          onChange={(e) => onAllocate(resource.id, localPercentage, e.target.value)}
          placeholder="What will they work on?"
          rows={2}
          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
  } = useGanttToolStore();

  // Find the item (phase or task)
  const item = useMemo(() => {
    if (!currentProject) return null;

    if (itemType === 'phase') {
      return currentProject.phases.find(p => p.id === itemId);
    } else {
      // Find task across all phases
      for (const phase of currentProject.phases) {
        const task = phase.tasks.find(t => t.id === itemId);
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

    if (itemType === 'phase' && 'phaseResourceAssignments' in item) {
      return (item.phaseResourceAssignments || []).map(a => ({
        resourceId: a.resourceId,
        allocationPercentage: a.allocationPercentage,
        assignmentNotes: a.assignmentNotes,
        assignmentId: a.id,
      }));
    } else if (itemType === 'task' && 'resourceAssignments' in item) {
      return (item.resourceAssignments || []).map(a => ({
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
      functional: [],
      technical: [],
      basis: [],
      security: [],
      pm: [],
      change: [],
      qa: [],
      other: [],
    };

    (currentProject.resources || []).forEach(resource => {
      grouped[resource.category].push(resource);
    });

    return grouped;
  }, [currentProject]);

  // Check if resource is already assigned
  const isAssigned = (resourceId: string) => {
    return currentAssignments.some(a => a.resourceId === resourceId) ||
           pendingAllocations.some(a => a.resourceId === resourceId);
  };

  // Get current allocation for resource
  const getCurrentAllocation = (resourceId: string): number => {
    const current = currentAssignments.find(a => a.resourceId === resourceId);
    if (current) return current.allocationPercentage;

    const pending = pendingAllocations.find(a => a.resourceId === resourceId);
    if (pending) return pending.allocationPercentage;

    return 80; // Default
  };

  // Get current notes for resource
  const getCurrentNotes = (resourceId: string): string => {
    const current = currentAssignments.find(a => a.resourceId === resourceId);
    if (current) return current.assignmentNotes;

    const pending = pendingAllocations.find(a => a.resourceId === resourceId);
    if (pending) return pending.assignmentNotes;

    return '';
  };

  // Handle adding/updating allocation
  const handleAllocate = (resourceId: string, percentage: number, notes?: string) => {
    const resource = currentProject?.resources.find(r => r.id === resourceId);
    if (!resource) return;

    // PM-only validation for phases
    if (itemType === 'phase' && resource.category !== 'pm') {
      alert(`Only Project Management resources can be assigned to phases.\n\n${resource.name} is a ${RESOURCE_CATEGORIES[resource.category].label} resource.`);
      return;
    }

    const existingIndex = currentAssignments.findIndex(a => a.resourceId === resourceId);
    const designation = RESOURCE_DESIGNATIONS[resource.designation];

    if (existingIndex >= 0) {
      // Update existing assignment
      const assignment = currentAssignments[existingIndex];
      const finalNotes = notes !== undefined ? notes : assignment.assignmentNotes;

      if (itemType === 'phase') {
        updatePhaseResourceAssignment(itemId, assignment.assignmentId, finalNotes, percentage);
      } else {
        const task = item as any;
        updateTaskResourceAssignment(itemId, task.phaseId, assignment.assignmentId, finalNotes, percentage);
      }
    } else {
      // New assignment
      const smartNotes = notes || (itemType === 'phase'
        ? `${designation} overseeing ${item?.name}`
        : `${designation} assigned to ${item?.name}`);

      if (itemType === 'phase') {
        assignResourceToPhase(itemId, resourceId, smartNotes, percentage);
      } else {
        const task = item as any;
        assignResourceToTask(itemId, task.phaseId, resourceId, smartNotes, percentage);
      }
    }
  };

  // Handle removing allocation
  const handleRemove = (resourceId: string) => {
    const assignment = currentAssignments.find(a => a.resourceId === resourceId);
    if (!assignment) {
      // Remove from pending
      setPendingAllocations(prev => prev.filter(a => a.resourceId !== resourceId));
      return;
    }

    const resource = currentProject?.resources.find(r => r.id === resourceId);
    if (!resource) return;

    if (confirm(`Remove ${resource.name} from this ${itemType}?`)) {
      if (itemType === 'phase') {
        unassignResourceFromPhase(itemId, assignment.assignmentId);
      } else {
        const task = item as any;
        unassignResourceFromTask(itemId, task.phaseId, assignment.assignmentId);
      }
    }
  };

  // Toggle category collapse
  const toggleCategory = (category: ResourceCategory) => {
    setCollapsedCategories(prev => {
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

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[80]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900">Resource Allocation</h2>
                <p className="text-sm text-gray-600 mt-0.5 truncate">
                  {itemType === 'phase' ? '📊 Phase:' : '✓ Task:'} {item.name}
                </p>
                {itemType === 'task' && 'phaseName' in item && (
                  <p className="text-xs text-gray-500">
                    Phase: {item.phaseName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Banner */}
          {itemType === 'phase' && (
            <div className="px-6 py-3 bg-orange-50 border-b border-orange-100">
              <p className="text-sm text-orange-900 flex items-center gap-2">
                <span className="font-semibold">⚠️ Phase-Level Resources:</span>
                Only Project Management (PM) resources can be assigned to phases.
              </p>
            </div>
          )}

          {/* Currently Assigned Resources */}
          {currentAssignments.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Currently Assigned ({currentAssignments.length})
              </h3>
              <div className="space-y-2">
                {currentAssignments.map((assignment) => {
                  const resource = currentProject.resources.find(r => r.id === assignment.resourceId);
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
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              Available Resources
            </h3>

            <div className="space-y-3">
              {Object.entries(resourcesByCategory).map(([categoryKey, resources]) => {
                const category = RESOURCE_CATEGORIES[categoryKey as ResourceCategory];
                const isCollapsed = collapsedCategories.has(categoryKey as ResourceCategory);
                const availableResources = (resources as Resource[]).filter(r => {
                  // PM-only filter for phases
                  if (itemType === 'phase') {
                    return r.category === 'pm' && !isAssigned(r.id);
                  }
                  return !isAssigned(r.id);
                });

                if (availableResources.length === 0) return null;

                return (
                  <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(categoryKey as ResourceCategory)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-semibold text-sm" style={{ color: category.color }}>
                          {category.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({availableResources.length} available)
                        </span>
                      </div>
                    </button>

                    {/* Resources List */}
                    {!isCollapsed && (
                      <div className="p-3 space-y-2 bg-white">
                        {availableResources.map(resource => (
                          <div
                            key={resource.id}
                            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-900">{resource.name}</h4>
                                <p className="text-xs text-gray-500">{RESOURCE_DESIGNATIONS[resource.designation]}</p>
                              </div>
                              <button
                                onClick={() => handleAllocate(resource.id, itemType === 'phase' ? 20 : 80)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Assign
                              </button>
                            </div>
                            {resource.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">{resource.description}</p>
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
            {Object.values(resourcesByCategory).every(resources =>
              (resources as Resource[]).filter(r => itemType === 'phase' ? r.category === 'pm' && !isAssigned(r.id) : !isAssigned(r.id)).length === 0
            ) && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {currentAssignments.length > 0 ? 'All resources assigned!' : 'No available resources'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {itemType === 'phase'
                    ? 'All PM resources are already assigned to this phase.'
                    : currentAssignments.length > 0
                    ? 'All project resources are assigned. Remove existing assignments or add more resources.'
                    : 'Add resources to your project first, then assign them here.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
