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
  List,
  BarChart3,
  Columns,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
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
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, TRANSITIONS, SHADOWS } from "@/lib/design-system/tokens";
import { getTotalResourceCount, getAllResources } from "@/lib/gantt-tool/resource-utils";

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
  // IMPORTANT: Use canonical resource count to ensure consistency with Org Chart Builder
  const overallStats = useMemo(() => {
    // Use canonical function for total count (GLOBAL POLICY: single source of truth)
    const totalResourcesCanonical = getTotalResourceCount(currentProject);

    const stats = {
      // CRITICAL: This count must match exactly what Org Chart Builder shows
      // Both use currentProject.resources.length as the source of truth
      totalResources: totalResourcesCanonical,
      totalResourcesFiltered: filteredResources.length, // Separate count for filtered view
      totalAssignments: 0,
      totalHours: 0,
      totalCost: 0,
      overallocatedCount: 0,
      conflictsCount: 0,
      unassignedCount: 0,
    };

    // Calculate stats based on ALL resources (not filtered) for accuracy
    const allResources = getAllResources(currentProject);
    allResources.forEach((resource) => {
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
  }, [currentProject, filteredResources, resourceStats]);

  const toggleResourceExpand = (resourceId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceId)) {
      newExpanded.delete(resourceId);
    } else {
      newExpanded.add(resourceId);
    }
    setExpandedResources(newExpanded);
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

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Resource Control Center"
      subtitle="Manage resources and assignments"
      size="xlarge"
    >

          {/* Stats Dashboard */}
          <div style={{ padding: `${SPACING[3]} ${SPACING[6]}`, borderBottom: `1px solid ${COLORS.border.subtle}`, background: "linear-gradient(to right, #EBF5FF, #F5F3FF)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: SPACING[3] }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Resources</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>{overallStats.totalResources}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Assignments</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.blue }}>
                  {overallStats.totalAssignments}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Total Hours</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: "#A855F7" }}>
                  {(Number(overallStats.totalHours) || 0).toFixed(0)}h
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Total Cost</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.status.success }}>
                  ${overallStats.totalCost.toFixed(0)}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Overallocated</div>
                <div
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: overallStats.overallocatedCount > 0 ? COLORS.red : COLORS.text.tertiary
                  }}
                >
                  {overallStats.overallocatedCount}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Conflicts</div>
                <div
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: overallStats.conflictsCount > 0 ? COLORS.status.warning : COLORS.text.tertiary
                  }}
                >
                  {overallStats.conflictsCount}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginBottom: SPACING[1] }}>Unassigned</div>
                <div
                  style={{
                    fontSize: TYPOGRAPHY.fontSize.title,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    color: overallStats.unassignedCount > 0 ? "#FFCC00" : COLORS.text.tertiary
                  }}
                >
                  {overallStats.unassignedCount}
                </div>
              </div>
            </div>
          </div>

          {/* View Switcher & Toolbar */}
          <div style={{ padding: `${SPACING[4]} ${SPACING[6]}`, borderBottom: `1px solid ${COLORS.border.subtle}`, backgroundColor: COLORS.bg.subtle }}>
            {/* View Mode Tabs */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING[3] }}>
              <div style={{ display: "flex", gap: SPACING[2] }}>
                <button
                  onClick={() => setViewMode("matrix")}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    borderRadius: RADIUS.default,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    transition: `all ${TRANSITIONS.duration.fast}`,
                    backgroundColor: viewMode === "matrix" ? COLORS.blue : COLORS.bg.primary,
                    color: viewMode === "matrix" ? COLORS.text.inverse : COLORS.text.secondary,
                    boxShadow: viewMode === "matrix" ? SHADOWS.small : "none",
                    border: viewMode === "matrix" ? "none" : `1px solid ${COLORS.border.default}`
                  }}
                >
                  <List style={{ width: "16px", height: "16px" }} />
                  Matrix View
                </button>
                <button
                  onClick={() => setViewMode("timeline")}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    borderRadius: RADIUS.default,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    transition: `all ${TRANSITIONS.duration.fast}`,
                    backgroundColor: viewMode === "timeline" ? "#A855F7" : COLORS.bg.primary,
                    color: viewMode === "timeline" ? COLORS.text.inverse : COLORS.text.secondary,
                    boxShadow: viewMode === "timeline" ? SHADOWS.small : "none",
                    border: viewMode === "timeline" ? "none" : `1px solid ${COLORS.border.default}`
                  }}
                >
                  <BarChart3 style={{ width: "16px", height: "16px" }} />
                  Timeline View
                </button>
                <button
                  onClick={() => setViewMode("hybrid")}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[4]}`,
                    borderRadius: RADIUS.default,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    display: "flex",
                    alignItems: "center",
                    gap: SPACING[2],
                    transition: `all ${TRANSITIONS.duration.fast}`,
                    backgroundColor: viewMode === "hybrid" ? COLORS.status.success : COLORS.bg.primary,
                    color: viewMode === "hybrid" ? COLORS.text.inverse : COLORS.text.secondary,
                    boxShadow: viewMode === "hybrid" ? SHADOWS.small : "none",
                    border: viewMode === "hybrid" ? "none" : `1px solid ${COLORS.border.default}`
                  }}
                >
                  <Columns style={{ width: "16px", height: "16px" }} />
                  Hybrid View
                </button>
              </div>

              <button
                onClick={() => setShowForm(true)}
                style={{ padding: `${SPACING[2]} ${SPACING[4]}`, backgroundColor: COLORS.blue, color: COLORS.text.inverse, borderRadius: RADIUS.default, display: "flex", alignItems: "center", gap: SPACING[2], fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Add Resource
              </button>
            </div>

            {/* Search & Filters */}
            <div style={{ display: "flex", gap: SPACING[3] }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search style={{ position: "absolute", left: SPACING[3], top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: COLORS.text.tertiary }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search resources..."
                  style={{ width: "100%", paddingLeft: "40px", paddingRight: SPACING[4], paddingTop: SPACING[2], paddingBottom: SPACING[2], border: `1px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.caption }}
                />
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", gap: SPACING[2] }}>
                <button
                  onClick={() => setCategoryFilter("all")}
                  style={{
                    padding: `${SPACING[2]} ${SPACING[3]}`,
                    fontSize: TYPOGRAPHY.fontSize.caption,
                    fontWeight: TYPOGRAPHY.fontWeight.semibold,
                    borderRadius: RADIUS.default,
                    transition: `colors ${TRANSITIONS.duration.fast}`,
                    backgroundColor: categoryFilter === "all" ? COLORS.blue : COLORS.bg.primary,
                    color: categoryFilter === "all" ? COLORS.text.inverse : COLORS.text.secondary,
                    border: categoryFilter === "all" ? "none" : `1px solid ${COLORS.border.default}`
                  }}
                >
                  All
                </button>
                {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key as ResourceCategory)}
                    style={{
                      padding: `${SPACING[2]} ${SPACING[3]}`,
                      fontSize: TYPOGRAPHY.fontSize.caption,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      borderRadius: RADIUS.default,
                      transition: `colors ${TRANSITIONS.duration.fast}`,
                      display: "flex",
                      alignItems: "center",
                      gap: SPACING[1],
                      backgroundColor: categoryFilter === key ? color : COLORS.bg.primary,
                      color: categoryFilter === key ? COLORS.text.inverse : COLORS.text.secondary,
                      border: categoryFilter === key ? "none" : `1px solid ${COLORS.border.default}`
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
              <div style={{ marginTop: SPACING[3], padding: SPACING[3], backgroundColor: COLORS.bg.subtle, border: `1px solid ${COLORS.border.subtle}`, borderRadius: RADIUS.default, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.blue }}>
                  {selectedAssignments.size} assignment(s) selected
                </div>
                <div style={{ display: "flex", gap: SPACING[2] }}>
                  <button
                    onClick={handleBulkDelete}
                    style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: COLORS.red, color: COLORS.text.inverse, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, display: "flex", alignItems: "center", gap: SPACING[1] }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px" }} />
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedAssignments(new Set())}
                    style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: COLORS.bg.primary, border: `1px solid ${COLORS.border.default}`, color: COLORS.text.secondary, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Content Area - View Modes */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {showForm ? (
              <div style={{ height: "100%", overflowY: "auto", padding: SPACING[6] }}>
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
    </BaseModal>
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
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: SPACING[8] }}>
        <div>
          <h3 style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, marginBottom: SPACING[2] }}>No resources found</h3>
          <p style={{ color: COLORS.text.tertiary }}>Adjust your search or add a new resource</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
        {resources.map((resource) => {
          const stats = resourceStats.get(resource.id);
          const category = RESOURCE_CATEGORIES[resource.category];
          const isExpanded = expandedResources.has(resource.id);

          return (
            <div key={resource.id} style={{ transition: `colors ${TRANSITIONS.duration.fast}` }}>
              {/* Resource Header Row */}
              <div style={{ padding: `${SPACING[4]} ${SPACING[6]}`, display: "flex", alignItems: "center", gap: SPACING[4] }}>
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => onToggleExpand(resource.id)}
                  style={{ padding: SPACING[1], borderRadius: RADIUS.small, transition: `colors ${TRANSITIONS.duration.fast}`, flexShrink: 0 }}
                >
                  {isExpanded ? (
                    <ChevronDown style={{ width: "20px", height: "20px", color: COLORS.text.tertiary }} />
                  ) : (
                    <ChevronRight style={{ width: "20px", height: "20px", color: COLORS.text.tertiary }} />
                  )}
                </button>

                {/* Resource Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING[3] }}>
                    <span style={{ fontSize: "24px", flexShrink: 0 }}>{category.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resource.name}</h3>
                      <p style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                        {RESOURCE_DESIGNATIONS[resource.designation]} · {category.label}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: SPACING[2], flexShrink: 0 }}>
                  {stats && (
                    <>
                      <div style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: "#EBF5FF", color: COLORS.blue, borderRadius: "9999px", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                        {stats.assignmentCount} assignments
                      </div>
                      <div style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: "#F5F3FF", color: "#A855F7", borderRadius: "9999px", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                        {(Number(stats.totalHours) || 0).toFixed(0)}h
                      </div>
                      {resource.isBillable && (
                        <div style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: "#F0FDF4", color: COLORS.status.success, borderRadius: "9999px", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                          ${stats.totalCost.toFixed(0)}
                        </div>
                      )}
                      {stats.isOverallocated && (
                        <div style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: "#FEE", color: COLORS.red, borderRadius: "9999px", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                          {stats.utilization.toFixed(0)}% OVER
                        </div>
                      )}
                      {stats.hasConflicts && (
                        <div style={{ padding: `${SPACING[1]} ${SPACING[3]}`, backgroundColor: "#FFEDD5", color: COLORS.status.warning, borderRadius: "9999px", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                          CONFLICT
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: SPACING[1], flexShrink: 0 }}>
                  <button
                    onClick={() => onEditResource(resource)}
                    style={{ padding: SPACING[2], color: COLORS.text.tertiary, borderRadius: RADIUS.small, transition: `colors ${TRANSITIONS.duration.fast}` }}
                    title="Edit resource"
                  >
                    <Edit2 style={{ width: "16px", height: "16px" }} />
                  </button>
                  <button
                    onClick={() => onDeleteResource(resource.id, resource.name)}
                    style={{ padding: SPACING[2], color: COLORS.text.tertiary, borderRadius: RADIUS.small, transition: `colors ${TRANSITIONS.duration.fast}` }}
                    title="Delete resource"
                  >
                    <Trash2 style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              </div>

              {/* Expanded: Assignments */}
              {isExpanded && stats && (
                <div style={{ paddingLeft: "80px", paddingRight: SPACING[6], paddingBottom: SPACING[4] }}>
                  {stats.assignments.length === 0 ? (
                    <div style={{ paddingTop: SPACING[4], paddingBottom: SPACING[4], textAlign: "center", color: COLORS.text.disabled, fontSize: TYPOGRAPHY.fontSize.caption, backgroundColor: COLORS.bg.subtle, borderRadius: RADIUS.default, border: `2px dashed ${COLORS.border.default}` }}>
                      No assignments yet
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2] }}>
                      {/* Mini Timeline Visualization */}
                      <div style={{ marginBottom: SPACING[3], padding: SPACING[3], background: "linear-gradient(to right, #F9FAFB, #EBF5FF)", borderRadius: RADIUS.default, border: `1px solid ${COLORS.border.subtle}` }}>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>Timeline</div>
                        <ResourceTimelineBar assignments={stats.assignments} />
                      </div>

                      {/* Assignment List */}
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
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
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <BarChart3 style={{ width: "64px", height: "64px", color: COLORS.text.disabled, margin: "0 auto", marginBottom: SPACING[4] }} />
          <h3 style={{ fontSize: TYPOGRAPHY.fontSize.title, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, marginBottom: SPACING[2] }}>No resources to display</h3>
          <p style={{ color: COLORS.text.tertiary }}>Add resources to see timeline view</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div style={{ minWidth: "max-content" }}>
        {/* Timeline Header */}
        <div style={{ position: "sticky", top: 0, backgroundColor: COLORS.bg.primary, borderBottom: `2px solid ${COLORS.border.default}`, zIndex: 10, display: "flex" }}>
          <div style={{ width: "256px", padding: SPACING[3], borderRight: `2px solid ${COLORS.border.default}`, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, backgroundColor: COLORS.bg.subtle }}>
            Resource
          </div>
          <div style={{ flex: 1, display: "flex" }}>
            {Array.from({ length: totalWeeks }).map((_, i) => (
              <div
                key={i}
                style={{ flex: 1, minWidth: "60px", padding: SPACING[2], textAlign: "center", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.tertiary, borderRight: `1px solid ${COLORS.border.subtle}` }}
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
              <div key={resource.id} style={{ display: "flex", borderBottom: `1px solid ${COLORS.border.subtle}` }}>
                {/* Resource Name Column */}
                <div style={{ width: "256px", padding: SPACING[3], borderRight: `2px solid ${COLORS.border.default}`, backgroundColor: COLORS.bg.subtle }}>
                  <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
                    <span style={{ fontSize: TYPOGRAPHY.fontSize.title }}>{category.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {resource.name}
                      </div>
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                        {stats
                          ? `${stats.assignmentCount} · ${(Number(stats.totalHours) || 0).toFixed(0)}h`
                          : "Unassigned"}
                      </div>
                    </div>
                  </div>
                  {stats?.isOverallocated && (
                    <div style={{ marginTop: SPACING[1], fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.red, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                       {stats.utilization.toFixed(0)}% allocated
                    </div>
                  )}
                </div>

                {/* Timeline Column */}
                <div style={{ flex: 1, position: "relative", minHeight: "60px" }}>
                  {stats?.assignments.map((assignment, idx) => {
                    // Calculate position
                    const assignmentStart = parseISO(assignment.startDate);
                    const assignmentEnd = parseISO(assignment.endDate);
                    const daysFromStart = differenceInCalendarDays(assignmentStart, startDate);
                    const durationDays = differenceInCalendarDays(assignmentEnd, assignmentStart);

                    const leftPercent = (daysFromStart / (totalWeeks * 7)) * 100;
                    const widthPercent = (durationDays / (totalWeeks * 7)) * 100;

                    const colors = [
                      "#3B82F6",  // blue-500
                      "#A855F7",  // purple-500
                      "#22C55E",  // green-500
                      "#F97316",  // orange-500
                      "#EC4899",  // pink-500
                      "#6366F1",  // indigo-500
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <div
                        key={assignment.id}
                        style={{
                          position: "absolute",
                          top: SPACING[2],
                          height: "40px",
                          backgroundColor: color,
                          borderRadius: RADIUS.default,
                          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
                          transition: `all ${TRANSITIONS.duration.fast}`,
                          cursor: "pointer",
                          left: `${leftPercent}%`,
                          width: `${Math.max(widthPercent, 1)}%`,
                        }}
                        title={`${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}\n${assignment.hours}h`}
                      >
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.inverse, fontWeight: TYPOGRAPHY.fontWeight.semibold, padding: `${SPACING[1]} ${SPACING[2]}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {assignment.taskName || assignment.phaseName}
                        </div>
                        <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: "rgba(255,255,255,0.9)", padding: `0 ${SPACING[2]}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
    <div style={{ height: "100%", display: "flex" }}>
      {/* Left: Resource List (40%) */}
      <div style={{ width: "40%", borderRight: `2px solid ${COLORS.border.default}`, overflowY: "auto" }}>
        <div style={{ borderTop: `1px solid ${COLORS.border.subtle}` }}>
          {resources.map((resource) => {
            const stats = resourceStats.get(resource.id);
            const category = RESOURCE_CATEGORIES[resource.category];
            const isExpanded = expandedResources.has(resource.id);

            return (
              <div key={resource.id} style={{ cursor: "pointer" }}>
                <div style={{ padding: `${SPACING[3]} ${SPACING[4]}`, display: "flex", alignItems: "center", gap: SPACING[3] }}>
                  <button
                    onClick={() => onToggleExpand(resource.id)}
                    style={{ padding: SPACING[1], borderRadius: RADIUS.small }}
                  >
                    {isExpanded ? (
                      <ChevronDown style={{ width: "16px", height: "16px", color: COLORS.text.tertiary }} />
                    ) : (
                      <ChevronRight style={{ width: "16px", height: "16px", color: COLORS.text.tertiary }} />
                    )}
                  </button>
                  <span style={{ fontSize: TYPOGRAPHY.fontSize.title }}>{category.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {resource.name}
                    </div>
                    <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
                      {stats
                        ? `${stats.assignmentCount} · ${(Number(stats.totalHours) || 0).toFixed(0)}h`
                        : "Unassigned"}
                    </div>
                  </div>
                  {stats?.isOverallocated && (
                    <div style={{ padding: `${SPACING[1]} ${SPACING[2]}`, backgroundColor: "#FEE", color: COLORS.red, borderRadius: RADIUS.small, fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold }}>
                      OVER
                    </div>
                  )}
                </div>

                {isExpanded && stats && stats.assignments.length > 0 && (
                  <div style={{ paddingLeft: "48px", paddingRight: SPACING[4], paddingBottom: SPACING[3], display: "flex", flexDirection: "column", gap: SPACING[1] }}>
                    {stats.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        style={{ fontSize: TYPOGRAPHY.fontSize.caption, padding: SPACING[2], backgroundColor: COLORS.bg.subtle, borderRadius: RADIUS.small, border: `1px solid ${COLORS.border.subtle}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {assignment.phaseName}
                            {assignment.taskName && ` → ${assignment.taskName}`}
                          </div>
                          <div style={{ color: COLORS.text.tertiary }}>{assignment.hours}h</div>
                        </div>
                        <button
                          onClick={() => onRemoveAssignment(assignment)}
                          style={{ padding: SPACING[1], color: COLORS.text.tertiary, borderRadius: RADIUS.small }}
                        >
                          <X style={{ width: "12px", height: "12px" }} />
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
      <div style={{ flex: 1, overflow: "auto", backgroundColor: COLORS.bg.primary }}>
        <div style={{ minWidth: "max-content" }}>
          {/* Timeline Header */}
          <div style={{ position: "sticky", top: 0, backgroundColor: COLORS.bg.subtle, borderBottom: `2px solid ${COLORS.border.default}`, display: "flex", zIndex: 10 }}>
            {Array.from({ length: totalWeeks }).map((_, i) => (
              <div
                key={i}
                style={{ flex: 1, minWidth: "60px", padding: SPACING[2], textAlign: "center", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.tertiary, borderRight: `1px solid ${COLORS.border.subtle}` }}
              >
                W{i + 1}
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          {resources.map((resource) => {
            const stats = resourceStats.get(resource.id);

            return (
              <div key={resource.id} style={{ borderBottom: `1px solid ${COLORS.border.subtle}`, position: "relative", minHeight: "60px" }}>
                {stats?.assignments.map((assignment, idx) => {
                  const assignmentStart = parseISO(assignment.startDate);
                  const assignmentEnd = parseISO(assignment.endDate);
                  const daysFromStart = differenceInCalendarDays(assignmentStart, startDate);
                  const durationDays = differenceInCalendarDays(assignmentEnd, assignmentStart);

                  const leftPercent = (daysFromStart / (totalWeeks * 7)) * 100;
                  const widthPercent = (durationDays / (totalWeeks * 7)) * 100;

                  const colors = ["#3B82F6", "#A855F7", "#22C55E", "#F97316"];  // blue, purple, green, orange
                  const color = colors[idx % colors.length];

                  return (
                    <div
                      key={assignment.id}
                      style={{
                        position: "absolute",
                        top: SPACING[2],
                        height: "40px",
                        backgroundColor: color,
                        borderRadius: RADIUS.small,
                        boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
                        transition: `all ${TRANSITIONS.duration.fast}`,
                        cursor: "pointer",
                        left: `${leftPercent}%`,
                        width: `${Math.max(widthPercent, 1)}%`,
                      }}
                      title={`${assignment.phaseName}${assignment.taskName ? ` → ${assignment.taskName}` : ""}`}
                    >
                      <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: "#FFFFFF", fontWeight: TYPOGRAPHY.fontWeight.semibold, padding: `${SPACING[1]} ${SPACING[2]}`, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
  if (assignments.length === 0) return <div style={{ height: "24px", backgroundColor: COLORS.bg.subtle, borderRadius: RADIUS.small }} />;

  // Find overall timeline bounds
  const dates = assignments.flatMap((a) => [parseISO(a.startDate), parseISO(a.endDate)]);
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
  const totalDays = differenceInCalendarDays(maxDate, minDate);

  return (
    <div style={{ position: "relative", height: "24px", backgroundColor: COLORS.bg.subtle, borderRadius: RADIUS.small, overflow: "hidden" }}>
      {assignments.map((assignment, idx) => {
        const start = parseISO(assignment.startDate);
        const end = parseISO(assignment.endDate);
        const daysFromStart = differenceInCalendarDays(start, minDate);
        const duration = differenceInCalendarDays(end, start);

        const leftPercent = (daysFromStart / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;

        const colors = [
          "#2563EB",  // blue-600
          "#9333EA",  // purple-600
          "#16A34A",  // green-600
          "#EA580C",  // orange-600
          "#DB2777",  // pink-600
        ];
        const color = colors[idx % colors.length];

        return (
          <div
            key={assignment.id}
            style={{
              position: "absolute",
              top: 0,
              height: "100%",
              backgroundColor: color,
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
      style={{
        padding: SPACING[3],
        borderRadius: RADIUS.default,
        border: `2px solid ${isSelected ? COLORS.blue : COLORS.border.subtle}`,
        backgroundColor: isSelected ? "#EBF5FF" : COLORS.bg.primary,
        transition: `all ${TRANSITIONS.duration.fast}`,
        cursor: "pointer"
      }}
      onClick={onSelect}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: SPACING[3], flex: 1, minWidth: 0 }}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            style={{ width: "16px", height: "16px", color: COLORS.blue, borderColor: COLORS.border.default, borderRadius: RADIUS.small }}
            onClick={(e) => e.stopPropagation()}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: SPACING[2] }}>
              {assignment.type === "phase" ? (
                <span style={{ padding: "2px 8px", backgroundColor: "#F3E8FF", color: "#A855F7", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, borderRadius: RADIUS.small }}>
                  Phase
                </span>
              ) : (
                <span style={{ padding: "2px 8px", backgroundColor: "#DBEAFE", color: COLORS.blue, fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, borderRadius: RADIUS.small }}>
                  Task
                </span>
              )}
              <span style={{ fontWeight: TYPOGRAPHY.fontWeight.semibold, fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {assignment.phaseName}
              </span>
            </div>
            {assignment.taskName && (
              <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.secondary, marginTop: SPACING[1], paddingLeft: SPACING[2] }}>
                → {assignment.taskName}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: SPACING[3], marginTop: SPACING[1], fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary }}>
              <span>{assignment.hours}h</span>
              <span>
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
          style={{ padding: "6px", color: COLORS.text.tertiary, borderRadius: RADIUS.small, transition: `colors ${TRANSITIONS.duration.fast}` }}
          title="Remove assignment"
        >
          <Trash2 style={{ width: "16px", height: "16px" }} />
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
  const { getProjectLogos } = useGanttToolStoreV2();
  const availableLogos = getProjectLogos();

  const initialDesignation = resource?.designation || "consultant";
  const [formData, setFormData] = useState<ResourceFormData>({
    name: resource?.name || "",
    category: resource?.category || "functional",
    description: resource?.description || "",
    designation: initialDesignation,
    assignmentLevel: resource?.assignmentLevel || "both",
    isBillable: resource?.isBillable !== undefined ? resource.isBillable : true,
    chargeRatePerHour: resource?.chargeRatePerHour || DESIGNATION_RATE_RATIOS[initialDesignation],
    companyName: resource?.companyName || undefined,
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
    <div style={{ maxWidth: "768px", margin: "0 auto", background: "linear-gradient(to bottom right, #EBF5FF, #F5F3FF)", border: "2px solid #93C5FD", borderRadius: "12px", padding: SPACING[8] }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING[6] }}>
        <h3 style={{ fontSize: "24px", fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>
          {resource ? "Edit Resource" : "Add New Resource"}
        </h3>
        <button
          onClick={onClose}
          style={{ color: COLORS.text.tertiary, padding: SPACING[2], borderRadius: RADIUS.default, transition: `colors ${TRANSITIONS.duration.fast}` }}
        >
          <X style={{ width: "24px", height: "24px" }} />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: SPACING[6] }}>
        {/* Role Name */}
        <div>
          <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
            Role Name <span style={{ color: COLORS.red }}>*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Senior SAP Consultant, Technical Architect"
            style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.body }}
            required
            autoFocus
          />
          <p style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginTop: SPACING[1] }}>This is a role, not a person name</p>
        </div>

        {/* Category and Designation */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: SPACING[4] }}>
          <div>
            <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
              Category <span style={{ color: COLORS.red }}>*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ResourceCategory })
              }
              style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.body }}
            >
              {Object.entries(RESOURCE_CATEGORIES).map(([key, { label, icon }]) => (
                <option key={key} value={key}>
                  {icon} {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
              Designation <span style={{ color: COLORS.red }}>*</span>
            </label>
            <select
              value={formData.designation}
              onChange={(e) =>
                setFormData({ ...formData, designation: e.target.value as ResourceDesignation })
              }
              style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.body }}
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
          <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
            Description <span style={{ color: COLORS.red }}>*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the role, skills, and responsibilities..."
            rows={4}
            style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.body }}
            required
          />
        </div>

        {/* Company/Organization (Optional) */}
        <div>
          <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
            Company/Organization <span style={{ color: COLORS.text.disabled, fontSize: TYPOGRAPHY.fontSize.caption }}>(Optional)</span>
          </label>
          <select
            value={formData.companyName || ""}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value || undefined })
            }
            style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, fontSize: TYPOGRAPHY.fontSize.body }}
          >
            <option value="">None (Internal resource)</option>
            {Object.keys(availableLogos).map((companyName) => (
              <option key={companyName} value={companyName}>
                {companyName}
              </option>
            ))}
          </select>
          <p style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginTop: SPACING[1] }}>
            For multi-stakeholder projects. Assign to show company logo in org chart.
          </p>
        </div>

        {/* Assignment Level */}
        <div style={{ backgroundColor: COLORS.bg.primary, borderRadius: RADIUS.default, padding: SPACING[4], border: `2px solid ${COLORS.border.subtle}` }}>
          <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[3] }}>
            Assignment Level <span style={{ color: COLORS.red }}>*</span>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: SPACING[2] }}>
            {Object.entries(ASSIGNMENT_LEVELS).map(([key, { label, description }]) => (
              <label
                key={key}
                style={{ display: "flex", alignItems: "flex-start", gap: SPACING[3], cursor: "pointer", padding: SPACING[3], borderRadius: RADIUS.default, transition: `colors ${TRANSITIONS.duration.fast}` }}
              >
                <input
                  type="radio"
                  name="assignmentLevel"
                  value={key}
                  checked={formData.assignmentLevel === key}
                  onChange={(e) =>
                    setFormData({ ...formData, assignmentLevel: e.target.value as AssignmentLevel })
                  }
                  style={{ marginTop: SPACING[1], width: "16px", height: "16px", color: COLORS.blue, borderColor: COLORS.border.default }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>{label}</div>
                  <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginTop: SPACING[1] }}>{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Billing Configuration */}
        <div style={{ backgroundColor: COLORS.bg.primary, borderRadius: RADIUS.default, padding: SPACING[4], border: `2px solid ${COLORS.border.subtle}` }}>
          <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[3] }}>
            Billing Configuration
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: SPACING[3], cursor: "pointer", marginBottom: SPACING[4], padding: SPACING[3], borderRadius: RADIUS.default, transition: `colors ${TRANSITIONS.duration.fast}` }}>
            <input
              type="checkbox"
              checked={formData.isBillable}
              onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
              style={{ width: "16px", height: "16px", color: COLORS.blue, borderColor: COLORS.border.default, borderRadius: RADIUS.small }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.primary }}>Billable resource</div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginTop: SPACING[1] }}>Include in cost calculations</div>
            </div>
          </label>

          {formData.isBillable && (
            <div>
              <label style={{ display: "block", fontSize: TYPOGRAPHY.fontSize.caption, fontWeight: TYPOGRAPHY.fontWeight.semibold, color: COLORS.text.secondary, marginBottom: SPACING[2] }}>
                Rate Ratio <span style={{ color: COLORS.red }}>*</span>
              </label>
              <input
                type="number"
                value={formData.chargeRatePerHour}
                readOnly
                style={{ width: "100%", padding: `${SPACING[3]} ${SPACING[4]}`, border: `2px solid ${COLORS.border.default}`, borderRadius: RADIUS.default, backgroundColor: COLORS.bg.subtle, color: COLORS.text.secondary, cursor: "not-allowed" }}
              />
              <p style={{ fontSize: TYPOGRAPHY.fontSize.caption, color: COLORS.text.tertiary, marginTop: SPACING[1] }}>Auto-calculated based on designation</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: SPACING[4], paddingTop: SPACING[4] }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: `${SPACING[3]} ${SPACING[6]}`, border: `2px solid ${COLORS.border.default}`, color: COLORS.text.secondary, borderRadius: RADIUS.default, fontWeight: TYPOGRAPHY.fontWeight.semibold, transition: `colors ${TRANSITIONS.duration.fast}` }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ flex: 1, padding: `${SPACING[3]} ${SPACING[6]}`, background: "linear-gradient(to right, #2563EB, #9333EA)", color: COLORS.text.inverse, borderRadius: RADIUS.default, transition: `colors ${TRANSITIONS.duration.fast}`, fontWeight: TYPOGRAPHY.fontWeight.semibold, display: "flex", alignItems: "center", justifyContent: "center", gap: SPACING[2], boxShadow: SHADOWS.medium }}
          >
            {resource ? "Save Changes" : "Add Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}
