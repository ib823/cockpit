/**
 * Conflict Resolution Modal
 *
 * Displays conflicts between existing project data and imported data.
 * Allows users to choose between Total Refresh or Smart Merge strategies.
 */

"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  FileText,
  Users,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Edit2,
  X,
  RefreshCw,
  GitMerge,
} from "lucide-react";
import type {
  ConflictDetectionResult,
  ImportConflict,
  ResourceConflictDetail,
  PhaseConflictDetail,
  TaskConflictDetail,
} from "@/lib/gantt-tool/conflict-detector";
import type { GanttProject } from "@/types/gantt-tool";

// ============================================================================
// Types
// ============================================================================

export type ResolutionStrategy = "refresh" | "merge";

export interface ConflictResolution {
  strategy: ResolutionStrategy;
  customNames?: Map<string, string>; // Map of item ID to custom name (for merge strategy)
}

interface ConflictResolutionModalProps {
  conflictResult: ConflictDetectionResult;
  existingProject: GanttProject;
  importedPhaseCount: number;
  importedTaskCount: number;
  importedResourceCount: number;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function ConflictResolutionModal({
  conflictResult,
  existingProject,
  importedPhaseCount,
  importedTaskCount,
  importedResourceCount,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ResolutionStrategy>("merge");
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<Map<string, string>>(new Map());
  const [showNameEditor, setShowNameEditor] = useState(false);

  const { conflicts, summary } = conflictResult;

  // Group conflicts by type
  const conflictsByType = useMemo(() => {
    const grouped = {
      resource: conflicts.filter((c) => c.type === "resource"),
      phase: conflicts.filter((c) => c.type === "phase"),
      task: conflicts.filter((c) => c.type === "task"),
    };
    return grouped;
  }, [conflicts]);

  // Toggle conflict expansion
  const toggleConflict = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  // Handle resolution
  const handleResolve = () => {
    const resolution: ConflictResolution = {
      strategy: selectedStrategy,
      customNames: selectedStrategy === "merge" ? customNames : undefined,
    };
    onResolve(resolution);
  };

  // Count existing items to be deleted in refresh mode
  const existingCounts = {
    phases: existingProject.phases.length,
    tasks: existingProject.phases.reduce((sum, phase) => sum + phase.tasks.length, 0),
    resources: existingProject.resources.length,
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onCancel} />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-amber-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Import Conflicts Detected</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  {summary.totalErrors} error{summary.totalErrors !== 1 ? "s" : ""} ·{" "}
                  {summary.totalWarnings} warning{summary.totalWarnings !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Conflict Summary */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} found between
                    imported and existing data
                  </h3>
                  <div className="flex gap-4 text-sm">
                    {summary.resourceConflicts > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span className="text-gray-700">
                          {summary.resourceConflicts} Resource
                          {summary.resourceConflicts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {summary.phaseConflicts > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <span className="text-gray-700">
                          {summary.phaseConflicts} Phase{summary.phaseConflicts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                    {summary.taskConflicts > 0 && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        <span className="text-gray-700">
                          {summary.taskConflicts} Task{summary.taskConflicts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Conflict List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Conflict Details</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {conflicts.map((conflict) => (
                  <ConflictItem
                    key={conflict.id}
                    conflict={conflict}
                    isExpanded={expandedConflicts.has(conflict.id)}
                    onToggle={() => toggleConflict(conflict.id)}
                  />
                ))}
              </div>
            </div>

            {/* Resolution Strategy */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Resolution Strategy
              </h3>

              <div className="space-y-3">
                {/* Total Refresh Option */}
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStrategy === "refresh"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="strategy"
                      value="refresh"
                      checked={selectedStrategy === "refresh"}
                      onChange={() => setSelectedStrategy("refresh")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="w-5 h-5 text-red-600" />
                        <span className="font-semibold text-gray-900">Total Refresh</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Replace all existing data with imported data. This will completely refresh
                        your project.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-red-900 mb-1">This will delete:</p>
                            <ul className="text-red-700 space-y-0.5">
                              <li>
                                • {existingCounts.phases} existing phase
                                {existingCounts.phases !== 1 ? "s" : ""}
                              </li>
                              <li>
                                • {existingCounts.tasks} existing task
                                {existingCounts.tasks !== 1 ? "s" : ""}
                              </li>
                              <li>
                                • {existingCounts.resources} existing resource
                                {existingCounts.resources !== 1 ? "s" : ""}
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Smart Merge Option */}
                <label
                  className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStrategy === "merge"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="strategy"
                      value="merge"
                      checked={selectedStrategy === "merge"}
                      onChange={() => setSelectedStrategy("merge")}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GitMerge className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">Smart Merge</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Add imported data alongside existing data. Conflicting items will be renamed
                        automatically.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-green-900 mb-1">Suggested renames:</p>
                            <ul className="text-green-700 space-y-0.5">
                              {conflictsByType.phase.slice(0, 3).map((conflict) => {
                                const detail = conflict.detail as PhaseConflictDetail;
                                return (
                                  <li key={conflict.id} className="font-mono text-xs">
                                    • "{detail.phaseName}" → "{detail.phaseName} (2)"
                                  </li>
                                );
                              })}
                              {conflictsByType.resource.slice(0, 3).map((conflict) => {
                                const detail = conflict.detail as ResourceConflictDetail;
                                return (
                                  <li key={conflict.id} className="font-mono text-xs">
                                    • "{detail.resourceName}" → "{detail.resourceName} (2)"
                                  </li>
                                );
                              })}
                              {conflictsByType.phase.length + conflictsByType.resource.length >
                                6 && (
                                <li className="text-green-600 italic">
                                  ...and{" "}
                                  {conflictsByType.phase.length +
                                    conflictsByType.resource.length -
                                    6}{" "}
                                  more
                                </li>
                              )}
                            </ul>
                            {/* Edit Names Button */}
                            {conflicts.length > 0 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowNameEditor(!showNameEditor);
                                }}
                                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit suggested names
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Name Editor (shown when "Edit Names" is clicked) */}
            {showNameEditor && selectedStrategy === "merge" && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  Customize Renamed Items
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  You can edit the suggested names below. Leave blank to use the default suggestion.
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {conflicts.map((conflict) => {
                    const detail = conflict.detail;
                    let itemName = "";
                    let suggestedName = "";

                    if (conflict.type === "resource") {
                      const resourceDetail = detail as ResourceConflictDetail;
                      itemName = resourceDetail.resourceName;
                      suggestedName = `${resourceDetail.resourceName} (2)`;
                    } else if (conflict.type === "phase") {
                      const phaseDetail = detail as PhaseConflictDetail;
                      itemName = phaseDetail.phaseName;
                      suggestedName = `${phaseDetail.phaseName} (2)`;
                    } else {
                      const taskDetail = detail as TaskConflictDetail;
                      itemName = taskDetail.taskName;
                      suggestedName = `${taskDetail.taskName} (2)`;
                    }

                    return (
                      <div key={conflict.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600 w-32 truncate" title={itemName}>
                          {itemName}
                        </span>
                        <span className="text-gray-400">→</span>
                        <input
                          type="text"
                          placeholder={suggestedName}
                          value={customNames.get(conflict.id) || ""}
                          onChange={(e) => {
                            const newNames = new Map(customNames);
                            if (e.target.value) {
                              newNames.set(conflict.id, e.target.value);
                            } else {
                              newNames.delete(conflict.id);
                            }
                            setCustomNames(newNames);
                          }}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">You must choose a strategy to continue</div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel Import
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                {selectedStrategy === "refresh" ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Continue with Refresh
                  </>
                ) : (
                  <>
                    <GitMerge className="w-4 h-4" />
                    Continue with Merge
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Conflict Item Component
// ============================================================================

interface ConflictItemProps {
  conflict: ImportConflict;
  isExpanded: boolean;
  onToggle: () => void;
}

function ConflictItem({ conflict, isExpanded, onToggle }: ConflictItemProps) {
  const detail = conflict.detail;

  // Get icon based on type
  const getIcon = () => {
    switch (conflict.type) {
      case "resource":
        return <Users className="w-4 h-4" />;
      case "phase":
        return <FileText className="w-4 h-4" />;
      case "task":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Get color based on severity
  const getColorClasses = () => {
    if (conflict.severity === "error") {
      return {
        border: "border-red-200",
        bg: "bg-red-50",
        icon: "text-red-600",
        badge: "bg-red-100 text-red-700",
      };
    } else {
      return {
        border: "border-amber-200",
        bg: "bg-amber-50",
        icon: "text-amber-600",
        badge: "bg-amber-100 text-amber-700",
      };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`border ${colors.border} rounded-lg ${colors.bg}`}>
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <div className={colors.icon}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.badge}`}>
              {conflict.severity.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500 capitalize">{conflict.type}</span>
          </div>
          <p className="text-sm text-gray-900 font-medium">{conflict.message}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-200">
          <div className="pt-3 space-y-2 text-sm">
            {conflict.type === "resource" && (
              <ResourceConflictDetails detail={detail as ResourceConflictDetail} />
            )}
            {conflict.type === "phase" && (
              <PhaseConflictDetails detail={detail as PhaseConflictDetail} />
            )}
            {conflict.type === "task" && (
              <TaskConflictDetails detail={detail as TaskConflictDetail} />
            )}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Suggested: </span>
                {conflict.suggestedResolution}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Conflict Detail Components
// ============================================================================

function ResourceConflictDetails({ detail }: { detail: ResourceConflictDetail }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Resource:</span>
        <span className="text-gray-900">{detail.resourceName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Conflict Period:</span>
        <span className="text-gray-900">
          {new Date(detail.dateRange.start).toLocaleDateString()} -{" "}
          {new Date(detail.dateRange.end).toLocaleDateString()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="font-medium text-gray-700">Existing Allocation:</span>
          <span className="ml-2 text-gray-900">{detail.existingAllocation}%</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">Imported Allocation:</span>
          <span className="ml-2 text-gray-900">{detail.importedAllocation}%</span>
        </div>
      </div>
      {detail.totalAllocation > 100 && (
        <div className="bg-red-100 border border-red-200 rounded px-2 py-1">
          <span className="font-medium text-red-700">Total:</span>
          <span className="ml-2 text-red-900 font-bold">{detail.totalAllocation}%</span>
          <span className="ml-2 text-red-700 text-xs">(Over-allocated!)</span>
        </div>
      )}
      {detail.tasks.length > 0 && (
        <div>
          <span className="font-medium text-gray-700">Affected Tasks:</span>
          <ul className="ml-4 mt-1 space-y-0.5">
            {detail.tasks.map((task, idx) => (
              <li key={idx} className="text-gray-600 text-xs">
                • {task}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PhaseConflictDetails({ detail }: { detail: PhaseConflictDetail }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Phase Name:</span>
        <span className="text-gray-900">{detail.phaseName}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-medium text-gray-700 mb-1">Existing Phase:</div>
          <div className="text-xs text-gray-600">
            {new Date(detail.existingDateRange.start).toLocaleDateString()} -{" "}
            {new Date(detail.existingDateRange.end).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-600">{detail.taskCount.existing} tasks</div>
        </div>
        <div>
          <div className="font-medium text-gray-700 mb-1">Imported Phase:</div>
          <div className="text-xs text-gray-600">
            {new Date(detail.importedDateRange.start).toLocaleDateString()} -{" "}
            {new Date(detail.importedDateRange.end).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-600">{detail.taskCount.imported} tasks</div>
        </div>
      </div>
    </div>
  );
}

function TaskConflictDetails({ detail }: { detail: TaskConflictDetail }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Task Name:</span>
        <span className="text-gray-900">{detail.taskName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">Phase:</span>
        <span className="text-gray-900">{detail.phaseName}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="font-medium text-gray-700 mb-1">Existing Task:</div>
          <div className="text-xs text-gray-600">
            {new Date(detail.existingDateRange.start).toLocaleDateString()} -{" "}
            {new Date(detail.existingDateRange.end).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="font-medium text-gray-700 mb-1">Imported Task:</div>
          <div className="text-xs text-gray-600">
            {new Date(detail.importedDateRange.start).toLocaleDateString()} -{" "}
            {new Date(detail.importedDateRange.end).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
