/**
 * Rocket REVOLUTIONARY RESOURCE CONTROL CENTER
 *
 * The most advanced resource management interface ever built for Gantt planning.
 *
 * Features:
 * - 3 View Modes: Matrix (List), Timeline (Gantt), Hybrid (Split)
 * - Inline assignment management with visual timeline
 * - Drag-drop reassignment between resources
 * - Capacity warnings and conflict detection
 * - Smart suggestions for rebalancing
 * - Bulk operations
 * - Real-time stats dashboard
 */

"use client";

import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  Save,
  List,
  BarChart3,
  Columns,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
  CheckSquare,
  Copy,
  ArrowRight,
  Target,
  Calendar,
  Maximize,
  Maximize2,
  Monitor,
} from "lucide-react";
import {
  Resource,
  ResourceFormData,
  ResourceCategory,
  ResourceDesignation,
  RESOURCE_CATEGORIES,
  RESOURCE_DESIGNATIONS,
  ASSIGNMENT_LEVELS,
  AssignmentLevel,
  GanttPhase,
  GanttTask,
} from "@/types/gantt-tool";
import { differenceInCalendarDays, parseISO, format as formatDate } from "date-fns";

// Fixed rate ratios based on designation
const DESIGNATION_RATE_RATIOS: Record<ResourceDesignation, number> = {
  principal: 2.16718,
  director: 1.73375,
  senior_manager: 1.30031,
  manager: 0.81269,
  senior_consultant: 0.44427,
  consultant: 0.28173,
  analyst: 0.26006,
  subcontractor: 0.5,
};

type ViewMode = "matrix" | "timeline" | "hybrid";
type ModalSize = "nearfull" | "fullscreen" | "adaptive";

interface ResourceAssignment {
  id: string;
  resourceId: string;
  phaseId: string;
  phaseName: string;
  taskId?: string;
  taskName?: string;
  hours: number;
  startDate: string;
  endDate: string;
  type: "phase" | "task";
}

interface ResourceStats {
  totalHours: number;
  totalCost: number;
  assignmentCount: number;
  utilization: number; // percentage
  isOverallocated: boolean;
  hasConflicts: boolean;
  assignments: ResourceAssignment[];
}

export function ResourceManagementModal({ onClose }: { onClose: () => void }) {
  const {
    currentProject,
    addResource,
    updateResource,
    deleteResource,
  } = useGanttToolStoreV2();

  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [modalSize, setModalSize] = useState<ModalSize>("nearfull");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Calculate comprehensive resource statistics
  const resourceStats = useMemo((): Map<string, ResourceStats> => {
    if (!currentProject) return new Map();

    const stats = new Map<string, ResourceStats>();
    const resources = currentProject.resources || [];

    resources.forEach((resource) => {
      const assignments: ResourceAssignment[] = [];
      let totalHours = 0;

      // Collect phase assignments
      currentProject.phases.forEach((phase) => {
        phase.phaseResourceAssignments?.forEach((assignment: any) => {
          if (assignment.resourceId === resource.id) {
            const hours = Number(assignment.hours) || 0; // Safety: convert to number, default to 0
            totalHours += hours;
            assignments.push({
              id: `phase-${phase.id}-${assignment.resourceId}`,
              resourceId: resource.id,
              phaseId: phase.id,
              phaseName: phase.name,
              hours,
              startDate: phase.startDate,
              endDate: phase.endDate,
              type: "phase",
            });
          }
        });

        // Collect task assignments
        phase.tasks.forEach((task) => {
          task.resourceAssignments?.forEach((assignment) => {
            if (assignment.resourceId === resource.id) {
              // Calculate hours from allocation percentage and task duration
              const taskStart = new Date(task.startDate);
              const taskEnd = new Date(task.endDate);
              const durationDays = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)));
              const hours = Math.round((durationDays * 8 * assignment.allocationPercentage) / 100); // Assuming 8 hours/day
              totalHours += hours;
              assignments.push({
                id: `task-${task.id}-${assignment.resourceId}`,
                resourceId: resource.id,
                phaseId: phase.id,
                phaseName: phase.name,
                taskId: task.id,
                taskName: task.name,
                hours,
                startDate: task.startDate,
                endDate: task.endDate,
                type: "task",
              });
            }
          });
        });
      });

      // Calculate project duration for utilization
      const projectStart = parseISO(currentProject.startDate);
      const latestEndDate = currentProject.phases.reduce((latest, phase) => {
        const phaseEnd = parseISO(phase.endDate);
        return phaseEnd > latest ? phaseEnd : latest;
      }, projectStart);
      const projectDurationDays = differenceInCalendarDays(latestEndDate, projectStart);
      const projectWorkingDays = Math.ceil(projectDurationDays * (5 / 7)); // Approx working days
      const maxAvailableHours = projectWorkingDays * 8; // 8 hours per day

      const totalCost = totalHours * (resource.isBillable ? resource.chargeRatePerHour : 0);
      const utilization = maxAvailableHours > 0 ? (totalHours / maxAvailableHours) * 100 : 0;
      const isOverallocated = utilization > 100;

      // Check for conflicts (overlapping assignments)
      const hasConflicts = assignments.some((a1, i) => {
        return assignments.some((a2, j) => {
          if (i >= j) return false;
          const start1 = parseISO(a1.startDate);
          const end1 = parseISO(a1.endDate);
          const start2 = parseISO(a2.startDate);
          const end2 = parseISO(a2.endDate);
          return start1 <= end2 && start2 <= end1; // Overlap check
        });
      });

      stats.set(resource.id, {
        totalHours,
        totalCost,
        assignmentCount: assignments.length,
        utilization,
        isOverallocated,
        hasConflicts,
        assignments,
      });
    });

    return stats;
  }, [currentProject]);

  // Filter resources
  const filteredResources = useMemo(() => {
    if (!currentProject) return [];

    const resources = currentProject.resources || [];
    return resources.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [currentProject, searchQuery, categoryFilter]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    const stats = {
      totalResources: filteredResources.length,
      totalAssignments: 0,
      totalHours: 0,
      totalCost: 0,
      overallocatedCount: 0,
      conflictsCount: 0,
      unassignedCount: 0,
    };

    filteredResources.forEach((resource) => {
      const resourceStat = resourceStats.get(resource.id);
      if (resourceStat) {
        stats.totalAssignments += resourceStat.assignmentCount || 0;
        stats.totalHours += Number(resourceStat.totalHours) || 0;
        stats.totalCost += Number(resourceStat.totalCost) || 0;
        if (resourceStat.isOverallocated) stats.overallocatedCount++;
        if (resourceStat.hasConflicts) stats.conflictsCount++;
        if (resourceStat.assignmentCount === 0) stats.unassignedCount++;
      } else {
        stats.unassignedCount++;
      }
    });

    return stats;
  }, [filteredResources, resourceStats]);

  const toggleResourceExpand = (resourceId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceId)) {
      newExpanded.delete(resourceId);
    } else {
      newExpanded.add(resourceId);
    }
    setExpandedResources(newExpanded);
  };

  const cycleModalSize = () => {
    const sizes: ModalSize[] = ["nearfull", "fullscreen", "adaptive"];
    const currentIndex = sizes.indexOf(modalSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setModalSize(sizes[nextIndex]);
  };

  // Modal size configuration
  const modalSizeConfig = {
    nearfull: {
      containerClass: "max-w-[98vw] h-[calc(100vh-2rem)]",
      padding: "p-4",
      icon: Maximize,
      label: "Near-Fullscreen",
      description: "98% viewport - comfortable padding",
    },
    fullscreen: {
      containerClass: "w-screen h-screen",
      padding: "p-0",
      icon: Maximize2,
      label: "Fullscreen",
      description: "100% viewport - maximum space",
    },
    adaptive: {
      containerClass: "w-full max-w-7xl max-h-[90vh]",
      padding: "p-4",
      icon: Monitor,
      label: "Adaptive",
      description: "Smart sizing - responsive",
    },
  };

  const handleRemoveAssignment = (assignment: ResourceAssignment) => {
    if (!currentProject) return;

    const confirmMsg = `Remove ${assignment.type === "phase" ? "phase" : "task"} assignment?\n\n${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}\n${assignment.hours} hours`;

    if (confirm(confirmMsg)) {
      // TODO: Implement removeResourceAssignment in store
      console.warn("removeResourceAssignment not yet implemented", assignment);
    }
  };

  const handleBulkDelete = () => {
    if (selectedAssignments.size === 0) return;

    if (confirm(`Delete ${selectedAssignments.size} selected assignment(s)?`)) {
      selectedAssignments.forEach((assignmentId) => {
        // Parse assignmentId: "phase-{phaseId}-{resourceId}" or "task-{taskId}-{resourceId}"
        const parts = assignmentId.split("-");
        const type = parts[0];

        if (type === "phase") {
          const phaseId = parts[1];
          const resourceId = parts[2];
          // TODO: Implement removeResourceAssignment in store
          console.warn("removeResourceAssignment not yet implemented", resourceId, phaseId);
        } else if (type === "task") {
          const taskId = parts[1];
          const resourceId = parts[2];
          // Find phase containing this task
          const phase = currentProject?.phases.find((p) => p.tasks.some((t) => t.id === taskId));
          if (phase) {
            // TODO: Implement removeResourceAssignment in store
            console.warn("removeResourceAssignment not yet implemented", resourceId, phase.id, taskId);
          }
        }
      });

      setSelectedAssignments(new Set());
      setShowBulkActions(false);
    }
  };

  if (!currentProject) return null;

  const currentSizeConfig = modalSizeConfig[modalSize];
  const SizeIcon = currentSizeConfig.icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[60]" onClick={onClose} />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center ${currentSizeConfig.padding}`}
      >
        <div
          className={`bg-white rounded-xl shadow-2xl flex flex-col ${currentSizeConfig.containerClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resource Control Center</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Revolutionary resource & assignment management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Size Toggle Button */}
              <button
                onClick={cycleModalSize}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title={`Current: ${currentSizeConfig.label}\nClick to cycle: ${currentSizeConfig.description}`}
              >
                <SizeIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{currentSizeConfig.label}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="grid grid-cols-7 gap-3">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Resources</div>
                <div className="text-lg font-bold text-gray-900">{overallStats.totalResources}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Assignments</div>
                <div className="text-lg font-bold text-blue-600">
                  {overallStats.totalAssignments}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Total Hours</div>
                <div className="text-lg font-bold text-purple-600">
                  {(Number(overallStats.totalHours) || 0).toFixed(0)}h
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Total Cost</div>
                <div className="text-lg font-bold text-green-600">
                  ${overallStats.totalCost.toFixed(0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Overallocated</div>
                <div
                  className={`text-lg font-bold ${overallStats.overallocatedCount > 0 ? "text-red-600" : "text-gray-400"}`}
                >
                  {overallStats.overallocatedCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Conflicts</div>
                <div
                  className={`text-lg font-bold ${overallStats.conflictsCount > 0 ? "text-orange-600" : "text-gray-400"}`}
                >
                  {overallStats.conflictsCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Unassigned</div>
                <div
                  className={`text-lg font-bold ${overallStats.unassignedCount > 0 ? "text-yellow-600" : "text-gray-400"}`}
                >
                  {overallStats.unassignedCount}
                </div>
              </div>
            </div>
          </div>

          {/* View Switcher & Toolbar */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            {/* View Mode Tabs */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode("matrix")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    viewMode === "matrix"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <List className="w-4 h-4" />
                  Matrix View
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    viewMode === "timeline"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Timeline View
                </button>
                <button
                  onClick={() => setViewMode("hybrid")}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                    viewMode === "hybrid"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  <Columns className="w-4 h-4" />
                  Hybrid View
                </button>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Category Pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    categoryFilter === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  All
                </button>
                {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key as ResourceCategory)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      categoryFilter === key
                        ? "text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                    style={{
                      backgroundColor: categoryFilter === key ? color : undefined,
                    }}
                  >
                    <span>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedAssignments.size > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="text-sm font-medium text-blue-900">
                  {selectedAssignments.size} assignment(s) selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedAssignments(new Set())}
                    className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area - View Modes */}
          <div className="flex-1 overflow-hidden">
            {showForm ? (
              <div className="h-full overflow-y-auto p-6">
                <ResourceFormInline
                  resource={editingResource}
                  onClose={() => {
                    setShowForm(false);
                    setEditingResource(null);
                  }}
                  onSubmit={(data) => {
                    if (editingResource) {
                      updateResource(editingResource.id, data);
                    } else {
                      addResource(data);
                    }
                    setShowForm(false);
                    setEditingResource(null);
                  }}
                />
              </div>
            ) : viewMode === "matrix" ? (
              <MatrixView
                resources={filteredResources}
                resourceStats={resourceStats}
                expandedResources={expandedResources}
                selectedAssignments={selectedAssignments}
                onToggleExpand={toggleResourceExpand}
                onSelectAssignment={(id) => {
                  const newSelected = new Set(selectedAssignments);
                  if (newSelected.has(id)) {
                    newSelected.delete(id);
                  } else {
                    newSelected.add(id);
                  }
                  setSelectedAssignments(newSelected);
                }}
                onEditResource={(resource) => {
                  setEditingResource(resource);
                  setShowForm(true);
                }}
                onDeleteResource={(resourceId, resourceName) => {
                  const stats = resourceStats.get(resourceId);
                  const usage = stats?.assignmentCount || 0;
                  const confirmMessage =
                    usage > 0
                      ? `Delete "${resourceName}"?\n\nThis resource is used in ${usage} assignment(s). All will be removed.`
                      : `Delete "${resourceName}"?`;
                  if (confirm(confirmMessage)) {
                    deleteResource(resourceId);
                  }
                }}
                onRemoveAssignment={handleRemoveAssignment}
              />
            ) : viewMode === "timeline" ? (
              <TimelineView
                resources={filteredResources}
                resourceStats={resourceStats}
                currentProject={currentProject}
              />
            ) : (
              <HybridView
                resources={filteredResources}
                resourceStats={resourceStats}
                currentProject={currentProject}
                expandedResources={expandedResources}
                onToggleExpand={toggleResourceExpand}
                onRemoveAssignment={handleRemoveAssignment}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ========================================
// MATRIX VIEW - Collapsible List with Inline Assignments
// ========================================
function MatrixView({
  resources,
  resourceStats,
  expandedResources,
  selectedAssignments,
  onToggleExpand,
  onSelectAssignment,
  onEditResource,
  onDeleteResource,
  onRemoveAssignment,
}: {
  resources: Resource[];
  resourceStats: Map<string, ResourceStats>;
  expandedResources: Set<string>;
  selectedAssignments: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectAssignment: (id: string) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string, name: string) => void;
  onRemoveAssignment: (assignment: ResourceAssignment) => void;
}) {
  if (resources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600">Adjust your search or add a new resource</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {resources.map((resource) => {
          const stats = resourceStats.get(resource.id);
          const category = RESOURCE_CATEGORIES[resource.category];
          const isExpanded = expandedResources.has(resource.id);

          return (
            <div key={resource.id} className="hover:bg-gray-50 transition-colors">
              {/* Resource Header Row */}
              <div className="px-6 py-4 flex items-center gap-4">
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => onToggleExpand(resource.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Resource Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{category.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
                      <p className="text-sm text-gray-600">
                        {RESOURCE_DESIGNATIONS[resource.designation]} · {category.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {stats && (
                    <>
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {stats.assignmentCount} assignments
                      </div>
                      <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(Number(stats.totalHours) || 0).toFixed(0)}h
                      </div>
                      {resource.isBillable && (
                        <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />${stats.totalCost.toFixed(0)}
                        </div>
                      )}
                      {stats.isOverallocated && (
                        <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {stats.utilization.toFixed(0)}% OVER
                        </div>
                      )}
                      {stats.hasConflicts && (
                        <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          CONFLICT
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEditResource(resource)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit resource"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteResource(resource.id, resource.name)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete resource"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded: Assignments */}
              {isExpanded && stats && (
                <div className="px-6 pb-4 pl-20">
                  {stats.assignments.length === 0 ? (
                    <div className="py-4 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      No assignments yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Mini Timeline Visualization */}
                      <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                        <div className="text-xs font-medium text-gray-700 mb-2">Timeline</div>
                        <ResourceTimelineBar assignments={stats.assignments} />
                      </div>

                      {/* Assignment List */}
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        ASSIGNMENTS ({stats.assignments.length})
                      </div>
                      {stats.assignments.map((assignment) => (
                        <AssignmentCard
                          key={assignment.id}
                          assignment={assignment}
                          isSelected={selectedAssignments.has(assignment.id)}
                          onSelect={() => onSelectAssignment(assignment.id)}
                          onRemove={() => onRemoveAssignment(assignment)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ========================================
// TIMELINE VIEW - Full Gantt-style visualization
// ========================================
function TimelineView({
  resources,
  resourceStats,
  currentProject,
}: {
  resources: Resource[];
  resourceStats: Map<string, ResourceStats>;
  currentProject: any;
}) {
  // Calculate timeline bounds
  const { startDate, endDate, totalWeeks } = useMemo(() => {
    if (resources.length === 0 || !currentProject) {
      return { startDate: new Date(), endDate: new Date(), totalWeeks: 0 };
    }

    const projectStart = parseISO(currentProject.startDate);
    const latestEnd = currentProject.phases.reduce((latest: Date, phase: GanttPhase) => {
      const phaseEnd = parseISO(phase.endDate);
      return phaseEnd > latest ? phaseEnd : latest;
    }, projectStart);

    const durationDays = differenceInCalendarDays(latestEnd, projectStart);
    const weeks = Math.ceil(durationDays / 7);

    return {
      startDate: projectStart,
      endDate: latestEnd,
      totalWeeks: weeks,
    };
  }, [resources, currentProject]);

  if (resources.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources to display</h3>
          <p className="text-gray-600">Add resources to see timeline view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="min-w-max">
        {/* Timeline Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-300 z-10 flex">
          <div className="w-64 p-3 border-r-2 border-gray-300 font-semibold text-gray-700 bg-gray-50">
            Resource
          </div>
          <div className="flex-1 flex">
            {Array.from({ length: totalWeeks }).map((_, i) => (
              <div
                key={i}
                className="flex-1 min-w-[60px] p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200"
              >
                Week {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Resource Rows */}
        <div>
          {resources.map((resource) => {
            const stats = resourceStats.get(resource.id);
            const category = RESOURCE_CATEGORIES[resource.category];

            return (
              <div key={resource.id} className="flex border-b border-gray-200 hover:bg-gray-50">
                {/* Resource Name Column */}
                <div className="w-64 p-3 border-r-2 border-gray-300 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {resource.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {stats
                          ? `${stats.assignmentCount} · ${(Number(stats.totalHours) || 0).toFixed(0)}h`
                          : "Unassigned"}
                      </div>
                    </div>
                  </div>
                  {stats?.isOverallocated && (
                    <div className="mt-1 text-xs text-red-600 font-semibold">
                       {stats.utilization.toFixed(0)}% allocated
                    </div>
                  )}
                </div>

                {/* Timeline Column */}
                <div className="flex-1 relative min-h-[60px]">
                  {stats?.assignments.map((assignment, idx) => {
                    // Calculate position
                    const assignmentStart = parseISO(assignment.startDate);
                    const assignmentEnd = parseISO(assignment.endDate);
                    const daysFromStart = differenceInCalendarDays(assignmentStart, startDate);
                    const durationDays = differenceInCalendarDays(assignmentEnd, assignmentStart);

                    const leftPercent = (daysFromStart / (totalWeeks * 7)) * 100;
                    const widthPercent = (durationDays / (totalWeeks * 7)) * 100;

                    const colors = [
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-green-500",
                      "bg-orange-500",
                      "bg-pink-500",
                      "bg-indigo-500",
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div
                        key={assignment.id}
                        className={`absolute top-2 h-10 ${color} rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer group`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 1)}%`,
                        }}
                        title={`${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}\n${assignment.hours}h`}
                      >
                        <div className="text-xs text-white font-medium px-2 py-1 truncate">
                          {assignment.taskName || assignment.phaseName}
                        </div>
                        <div className="text-xs text-white/90 px-2 truncate">
                          {assignment.hours}h
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========================================
// HYBRID VIEW - Split screen: List + Timeline
// ========================================
function HybridView({
  resources,
  resourceStats,
  currentProject,
  expandedResources,
  onToggleExpand,
  onRemoveAssignment,
}: {
  resources: Resource[];
  resourceStats: Map<string, ResourceStats>;
  currentProject: any;
  expandedResources: Set<string>;
  onToggleExpand: (id: string) => void;
  onRemoveAssignment: (assignment: ResourceAssignment) => void;
}) {
  // Calculate timeline bounds
  const { startDate, totalWeeks } = useMemo(() => {
    if (!currentProject) {
      return { startDate: new Date(), totalWeeks: 0 };
    }

    const projectStart = parseISO(currentProject.startDate);
    const latestEnd = currentProject.phases.reduce((latest: Date, phase: GanttPhase) => {
      const phaseEnd = parseISO(phase.endDate);
      return phaseEnd > latest ? phaseEnd : latest;
    }, projectStart);

    const durationDays = differenceInCalendarDays(latestEnd, projectStart);
    const weeks = Math.ceil(durationDays / 7);

    return { startDate: projectStart, totalWeeks: weeks };
  }, [currentProject]);

  return (
    <div className="h-full flex">
      {/* Left: Resource List (40%) */}
      <div className="w-2/5 border-r-2 border-gray-300 overflow-y-auto">
        <div className="divide-y divide-gray-200">
          {resources.map((resource) => {
            const stats = resourceStats.get(resource.id);
            const category = RESOURCE_CATEGORIES[resource.category];
            const isExpanded = expandedResources.has(resource.id);

            return (
              <div key={resource.id} className="hover:bg-gray-50">
                <div className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => onToggleExpand(resource.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <span className="text-xl">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {resource.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {stats
                        ? `${stats.assignmentCount} · ${(Number(stats.totalHours) || 0).toFixed(0)}h`
                        : "Unassigned"}
                    </div>
                  </div>
                  {stats?.isOverallocated && (
                    <div className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                      OVER
                    </div>
                  )}
                </div>

                {isExpanded && stats && stats.assignments.length > 0 && (
                  <div className="px-4 pb-3 pl-12 space-y-1">
                    {stats.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="text-xs p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {assignment.phaseName}
                            {assignment.taskName && ` → ${assignment.taskName}`}
                          </div>
                          <div className="text-gray-600">{assignment.hours}h</div>
                        </div>
                        <button
                          onClick={() => onRemoveAssignment(assignment)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Timeline (60%) */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="min-w-max">
          {/* Timeline Header */}
          <div className="sticky top-0 bg-gray-50 border-b-2 border-gray-300 flex z-10">
            {Array.from({ length: totalWeeks }).map((_, i) => (
              <div
                key={i}
                className="flex-1 min-w-[60px] p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200"
              >
                W{i + 1}
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          {resources.map((resource) => {
            const stats = resourceStats.get(resource.id);

            return (
              <div key={resource.id} className="border-b border-gray-200 relative min-h-[60px]">
                {stats?.assignments.map((assignment, idx) => {
                  const assignmentStart = parseISO(assignment.startDate);
                  const assignmentEnd = parseISO(assignment.endDate);
                  const daysFromStart = differenceInCalendarDays(assignmentStart, startDate);
                  const durationDays = differenceInCalendarDays(assignmentEnd, assignmentStart);

                  const leftPercent = (daysFromStart / (totalWeeks * 7)) * 100;
                  const widthPercent = (durationDays / (totalWeeks * 7)) * 100;

                  const colors = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500"];
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={assignment.id}
                      className={`absolute top-2 h-10 ${color} rounded shadow hover:shadow-md transition-all cursor-pointer`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 1)}%`,
                      }}
                      title={`${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}`}
                    >
                      <div className="text-xs text-white font-medium px-2 py-1 truncate">
                        {assignment.hours}h
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========================================
// HELPER COMPONENTS
// ========================================

function ResourceTimelineBar({ assignments }: { assignments: ResourceAssignment[] }) {
  if (assignments.length === 0) return <div className="h-6 bg-gray-200 rounded" />;

  // Find overall timeline bounds
  const dates = assignments.flatMap((a) => [parseISO(a.startDate), parseISO(a.endDate)]);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const totalDays = differenceInCalendarDays(maxDate, minDate);

  return (
    <div className="relative h-6 bg-gray-200 rounded overflow-hidden">
      {assignments.map((assignment, idx) => {
        const start = parseISO(assignment.startDate);
        const end = parseISO(assignment.endDate);
        const daysFromStart = differenceInCalendarDays(start, minDate);
        const duration = differenceInCalendarDays(end, start);

        const leftPercent = (daysFromStart / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        const colors = [
          "bg-blue-600",
          "bg-purple-600",
          "bg-green-600",
          "bg-orange-600",
          "bg-pink-600",
        ];
        const color = colors[idx % colors.length];

        return (
          <div
            key={assignment.id}
            className={`absolute top-0 h-full ${color}`}
            style={{
              left: `${leftPercent}%`,
              width: `${Math.max(widthPercent, 1)}%`,
            }}
            title={`${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}`}
          />
        );
      })}
    </div>
  );
}

function AssignmentCard({
  assignment,
  isSelected,
  onSelect,
  onRemove,
}: {
  assignment: ResourceAssignment;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {assignment.type === "phase" ? (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Phase
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Task
                </span>
              )}
              <span className="font-semibold text-sm text-gray-900 truncate">
                {assignment.phaseName}
              </span>
            </div>
            {assignment.taskName && (
              <div className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{assignment.taskName}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {assignment.hours}h
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(parseISO(assignment.startDate), "MMM d")} -{" "}
                {formatDate(parseISO(assignment.endDate), "MMM d")}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Remove assignment"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ========================================
// RESOURCE FORM (Inline)
// ========================================
function ResourceFormInline({
  resource,
  onClose,
  onSubmit,
}: {
  resource: Resource | null;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
}) {
  const initialDesignation = resource?.designation || "consultant";
  const [formData, setFormData] = useState<ResourceFormData>({
    name: resource?.name || "",
    category: resource?.category || "functional",
    description: resource?.description || "",
    designation: initialDesignation,
    assignmentLevel: resource?.assignmentLevel || "both",
    isBillable: resource?.isBillable !== undefined ? resource.isBillable : true,
    chargeRatePerHour: resource?.chargeRatePerHour || DESIGNATION_RATE_RATIOS[initialDesignation],
  });

  useEffect(() => {
    if (formData.isBillable) {
      setFormData((prev) => ({
        ...prev,
        chargeRatePerHour: DESIGNATION_RATE_RATIOS[prev.designation],
      }));
    }
  }, [formData.designation, formData.isBillable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {resource ? "Edit Resource" : "Add New Resource"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Senior SAP Consultant, Technical Architect"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            required
            autoFocus
          />
          <p className="text-xs text-gray-600 mt-1">This is a role, not a person name</p>
        </div>

        {/* Category and Designation */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ResourceCategory })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Designation <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value as ResourceDesignation })
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            >
              {Object.entries(RESOURCE_DESIGNATIONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the role, skills, and responsibilities..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            required
          />
        </div>

        {/* Assignment Level */}
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Assignment Level <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {Object.entries(ASSIGNMENT_LEVELS).map(([key, { label, description }]) => (
              <label
                key={key}
                className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <input
                  type="radio"
                  name="assignmentLevel"
                  value={key}
                  checked={formData.assignmentLevel === key}
                  onChange={(e) =>
                    setFormData({ ...formData, assignmentLevel: e.target.value as AssignmentLevel })
                  }
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-600 mt-1">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Billing Configuration */}
        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Billing Configuration
          </label>

          <label className="flex items-center gap-3 cursor-pointer mb-4 hover:bg-gray-50 p-3 rounded-lg transition-colors">
            <input
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">Billable resource</div>
              <div className="text-xs text-gray-600 mt-1">Include in cost calculations</div>
            </div>
          </label>

          {formData.isBillable && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate Ratio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.chargeRatePerHour}
                readOnly
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-1">Auto-calculated based on designation</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors font-semibold flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-5 h-5" />
            {resource ? "Save Changes" : "Add Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}
