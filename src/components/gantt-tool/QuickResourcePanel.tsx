/**
 * Quick Resource Panel - Revolutionary UX for Resource Assignment
 *
 * Steve Jobs Principle: "Make the common operation effortless"
 * Jony Ive Principle: "Obvious, simple, delightful"
 *
 * Features:
 * - Always-visible collapsible panel
 * - Drag-and-drop resources onto task bars
 * - One-click quick assign with smart defaults
 * - Visual feedback of resource utilization
 * - Bulk operations
 */

"use client";

import { useState, useMemo } from "react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import {
  Users,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Target,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from "@/types/gantt-tool";
import type { Resource } from "@/types/gantt-tool";

interface QuickResourcePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickResourcePanel({ isOpen, onClose }: QuickResourcePanelProps) {
  const { currentProject, assignResourceToTask } = useGanttToolStoreV2();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [quickAssignMode, setQuickAssignMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial only on first visit
    if (typeof window !== "undefined") {
      return !localStorage.getItem("quickResourcePanelTutorialSeen");
    }
    return false;
  });

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Filter resources
  const filteredResources = useMemo(() => {
    if (!currentProject) return [];
    const resources = currentProject.resources || [];
    if (!searchQuery) return resources;
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentProject, searchQuery]);

  // Dismiss tutorial
  const dismissTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("quickResourcePanelTutorialSeen", "true");
    }
  };

  // NOW safe to return early after all hooks are called
  // Jobs/Ive principle: Panel should be completely dismissible, not always present
  if (!isOpen || !currentProject) return null;

  // Calculate resource utilization
  const getResourceUtilization = (resourceId: string) => {
    let assignmentCount = 0;
    currentProject.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        if (task.resourceAssignments?.some((a) => a.resourceId === resourceId)) {
          assignmentCount++;
        }
      });
    });
    return assignmentCount;
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, resource: Resource) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: "resource",
        resourceId: resource.id,
        resourceName: resource.name,
      })
    );
    setSelectedResourceId(resource.id);
  };

  const handleDragEnd = () => {
    setSelectedResourceId(null);
  };

  // Toggle panel - Jobs/Ive: Collapsed state still shows a minimal tab
  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-[100px] bg-white shadow-lg rounded-l-lg border border-gray-200 z-30">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-3 hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-semibold text-gray-700"
          title="Expand Resource Panel"
        >
          <ChevronLeft className="w-4 h-4" />
          <div className="flex flex-col items-center">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-xs mt-1">Resources</span>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-[100px] bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-30 flex flex-col">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="absolute inset-0 bg-purple-900/95 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Resource Assignment</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Revolutionary one-step resource assignment
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                  1
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Drag & Drop</div>
                  <div className="text-xs text-gray-600">Drag resources onto task bars</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                  2
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Auto-Assign</div>
                  <div className="text-xs text-gray-600">80% allocation with smart defaults</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                  3
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Quick Mode</div>
                  <div className="text-xs text-gray-600">
                    Enable Quick Assign for click-to-assign
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={dismissTutorial}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="text-sm font-bold text-gray-900">Quick Assign</h3>
            <p className="text-xs text-gray-600">Drag onto tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-white rounded transition-colors"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-50 rounded transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4 text-gray-600 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Quick Assign Mode Toggle */}
      <div className="px-4 py-2 bg-purple-50 border-b border-purple-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={quickAssignMode}
            onChange={(e) => setQuickAssignMode(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex-1">
            <span className="text-xs font-semibold text-purple-900">Quick Assign Mode</span>
            <p className="text-xs text-purple-700">Click tasks to assign selected resource</p>
          </div>
        </label>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Resource List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredResources.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">
              {currentProject.resources?.length === 0
                ? "No resources yet"
                : "No matching resources"}
            </p>
            {currentProject.resources?.length === 0 && (
              <button className="mt-3 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 mx-auto">
                <Plus className="w-3 h-3" />
                Add Resource
              </button>
            )}
          </div>
        ) : (
          filteredResources.map((resource) => {
            const category = RESOURCE_CATEGORIES[resource.category];
            const utilization = getResourceUtilization(resource.id);
            const isSelected = selectedResourceId === resource.id;

            return (
              <div
                key={resource.id}
                draggable
                onDragStart={(e) => handleDragStart(e, resource)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (quickAssignMode) {
                    setSelectedResourceId(resource.id === selectedResourceId ? null : resource.id);
                  }
                }}
                className={`
                  p-3 rounded-lg border-2 transition-all cursor-move
                  ${
                    isSelected
                      ? "bg-purple-50 border-purple-500 shadow-md scale-105"
                      : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                  }
                  ${quickAssignMode ? "cursor-pointer" : "cursor-move"}
                `}
                title={
                  quickAssignMode
                    ? "Click to select, then click tasks to assign"
                    : "Drag onto task bars to assign"
                }
              >
                {/* Resource Header */}
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xl flex-shrink-0">{category.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {resource.name}
                      </h4>
                      {isSelected && quickAssignMode && (
                        <Target className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="text-xs text-gray-600">
                        {RESOURCE_DESIGNATIONS[resource.designation]}
                      </div>
                      {resource.category === "pm" && (
                        <div className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded flex items-center gap-0.5 border border-orange-200">
                          <span className="text-[0.625rem]"></span>
                          <span>Phase-level</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Utilization Badge */}
                <div className="flex items-center gap-2 text-xs">
                  {utilization === 0 ? (
                    <div className="flex items-center gap-1 text-gray-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>Not assigned</span>
                    </div>
                  ) : utilization <= 3 ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>
                        {utilization} task{utilization > 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Clock className="w-3 h-3" />
                      <span>{utilization} tasks (busy)</span>
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                {resource.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-1">{resource.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Help */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <Target className="w-3 h-3 mt-0.5 flex-shrink-0 text-purple-600" />
          <div>
            <p className="font-semibold text-gray-900 mb-1">How to use:</p>
            <ul className="space-y-0.5">
              <li>• Drag resources onto task bars</li>
              <li>• Or enable Quick Assign mode above</li>
              <li>• Resources auto-assign with smart defaults</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
