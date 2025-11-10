"use client";

import { JobsGanttChart } from "@/components/timeline/JobsGanttChart";
import { cn, formatCurrency, formatDuration } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore, type Phase, type Resource } from "@/stores/timeline-store";
import { addWorkingDays, calculateWorkingDays } from "@/data/holidays";
import { format, parse, isValid, isBefore, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { showError, showWarning } from "@/lib/toast";
import {
  Calendar,
  DollarSign,
  Eye,
  Flag,
  Plus,
  Presentation,
  Sparkles,
  ArrowLeft,
  Clock,
  TrendingUp,
  Users as UsersIcon,
  AlertCircle,
  Edit2,
  X,
  Trash2,
  CheckCircle2,
  Layers,
  BarChart3,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Heading3, BodyMD } from "@/components/common/Typography";
import { ExportButton } from "@/components/export/ExportButton";
import { BenchmarkPanel } from "@/components/benchmarks/BenchmarkPanel";
// ResourcePanel and RicefwPanel imports removed - using placeholders for now
import type { Task } from "@/types/core";

const PROJECT_BASE_DATE = new Date(new Date().getFullYear(), 0, 1);

// Tab types for PlanMode (merged from OptimizeMode per spec: Holistic_Redesign_V2.md)
type PlanTab = "timeline" | "resources" | "ricefw" | "benchmarks";

export function PlanMode() {
  const { phases, selectedPackages, getProjectCost, updatePhase } = useTimelineStore();
  const { setMode, regenerateTimeline, timelineIsStale } = useProjectStore();
  const { chips, completeness, decisions } = usePresalesStore();
  const totalCost = getProjectCost();

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [activeTab, setActiveTab] = useState<PlanTab>("timeline");

  // Auto-generate timeline if empty and we have requirements
  useEffect(() => {
    if (phases.length === 0 && chips.length > 0 && (completeness?.score || 0) >= 30) {
      regenerateTimeline(true);
    }
  }, [phases.length, chips.length, completeness?.score, regenerateTimeline]);

  const handleRegenerate = useCallback(() => {
    regenerateTimeline(true);
  }, [regenerateTimeline]);

  const totalDuration = useMemo(() => {
    if (phases.length === 0) return 0;

    // Calculate actual project duration (start of first phase to end of last phase)
    const sortedPhases = [...phases].sort((a, b) => a.startBusinessDay - b.startBusinessDay);
    const firstPhase = sortedPhases[0];
    const lastPhase = sortedPhases[sortedPhases.length - 1];

    const projectStart = firstPhase.startBusinessDay;
    const projectEnd = lastPhase.startBusinessDay + lastPhase.workingDays;

    return projectEnd - projectStart;
  }, [phases]);

  // Empty state
  if (phases.length === 0) {
    const hasEnoughData = chips.length > 0 && (completeness?.score || 0) >= 30;

    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-6" />
          <Heading3 className="mb-4">
            {hasEnoughData ? "Ready to Generate Timeline" : "Need More Requirements"}
          </Heading3>
          <BodyMD className="mb-8">
            {hasEnoughData
              ? `You have ${chips.length} requirements captured (${completeness?.score || 0}% complete). Click below to generate your project timeline.`
              : `Add more requirements in Capture mode. Currently at ${completeness?.score || 0}% (need 30% minimum).`}
          </BodyMD>

          {hasEnoughData ? (
            <button
              onClick={() => regenerateTimeline(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              🚀 Generate Timeline Now
            </button>
          ) : (
            <button
              onClick={() => setMode("capture")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Capture Mode
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Toolbar - Fixed height, no scrolling */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode("decide")}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>

            <div className="w-px h-6 bg-gray-300" />

            <Button variant="secondary" size="sm" onClick={handleRegenerate}>
              Regenerate
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <ExportButton variant="secondary" size="sm" />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMode("present")}
              leftIcon={<Presentation className="w-4 h-4" />}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Present
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {formatDuration(totalDuration)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">
              {formatCurrency(totalCost, "MYR")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg">
            <Flag className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">{phases.length} Phases</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation (merged from OptimizeMode per spec: Holistic_Redesign_V2.md) */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("timeline")}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === "timeline"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab("benchmarks")}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === "benchmarks"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Benchmarks
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === "resources"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <UsersIcon className="w-4 h-4 inline mr-2" />
            Resources
          </button>
          <button
            onClick={() => setActiveTab("ricefw")}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === "ricefw"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <Layers className="w-4 h-4 inline mr-2" />
            RICEFW
          </button>
        </div>
      </div>

      {/* Stale warning */}
      {timelineIsStale && (
        <div className="shrink-0 bg-yellow-50 border-b border-yellow-200 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yellow-900">
              Timeline outdated - decisions changed
            </span>
          </div>
          <Button
            variant="primary"
            size="xs"
            onClick={handleRegenerate}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Regenerate
          </Button>
        </div>
      )}

      {/* Tab Content - Fills remaining space, internal scrolling */}
      <div className="flex-1 min-h-0 overflow-auto bg-gray-50">
        {activeTab === "timeline" && (
          <div className="p-6">
            <JobsGanttChart onPhaseClick={(phase) => setSelectedPhase(phase)} />
          </div>
        )}

        {activeTab === "benchmarks" && <BenchmarkPanel />}

        {activeTab === "resources" && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resource Planning</h3>
              <p className="text-sm text-gray-600 mb-4">
                Allocate team members to phases and optimize resource utilization
              </p>
              <p className="text-xs text-gray-500">{phases.length} phases • Coming soon</p>
            </div>
          </div>
        )}

        {activeTab === "ricefw" && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">RICEFW Objects</h3>
              <p className="text-sm text-gray-600 mb-4">
                Estimate custom development objects (Reports, Interfaces, Conversions, Enhancements,
                Forms, Workflows)
              </p>
              <p className="text-xs text-gray-500">Feature available in dedicated RICEFW module</p>
            </div>
          </div>
        )}
      </div>

      {/* Phase Details Panel - Right slide-over with edit controls */}
      <AnimatePresence>
        {selectedPhase && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setSelectedPhase(null)}
            />

            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-sm md:max-w-md lg:w-[480px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="shrink-0 p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight truncate">
                      {selectedPhase.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 truncate">{selectedPhase.category}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPhase(null)}
                    className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0 ml-2"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-blue-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-900">
                      {selectedPhase.workingDays}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-600 mt-1">Days</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-purple-900">
                      {selectedPhase.effort}
                    </div>
                    <div className="text-xs sm:text-sm text-purple-600 mt-1">Effort</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2.5 sm:p-3 text-center">
                    <div className="text-lg sm:text-xl font-bold text-green-900">
                      {selectedPhase.resources?.length || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-green-600 mt-1">People</div>
                  </div>
                </div>
              </div>

              {/* Panel Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Edit Dates */}
                <PhaseEditSection phase={selectedPhase} updatePhase={updatePhase} />

                {/* Tasks/Milestones */}
                <TaskSection
                  phase={selectedPhase}
                  updatePhase={updatePhase}
                  onTaskUpdate={(tasks) => {
                    updatePhase(selectedPhase.id, { tasks });
                    setSelectedPhase({ ...selectedPhase, tasks });
                  }}
                />

                {/* Resources */}
                <ResourceSection
                  phase={selectedPhase}
                  decisions={decisions}
                  updatePhase={updatePhase}
                  onResourceUpdate={(resources) => {
                    updatePhase(selectedPhase.id, { resources });
                    setSelectedPhase({ ...selectedPhase, resources });
                  }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Phase Edit Section Component
function PhaseEditSection({ phase, updatePhase }: { phase: Phase; updatePhase: any }) {
  const [editMode, setEditMode] = useState<"start" | "end" | "duration" | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startDate =
    phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, "ABMY");
  const endDate =
    phase.endDate ||
    addWorkingDays(
      PROJECT_BASE_DATE,
      (phase.startBusinessDay || 0) + (phase.workingDays || 0),
      "ABMY"
    );

  const handleSave = (field: "start" | "end" | "duration") => {
    if (!updatePhase) return;

    let updatedData: Partial<Phase> = {};

    if (field === "duration") {
      const newDuration = parseInt(tempValue, 10);
      if (isNaN(newDuration) || newDuration <= 0) return;

      const newEndDate = addWorkingDays(startDate, newDuration, "ABMY");
      updatedData = {
        workingDays: newDuration,
        endDate: newEndDate,
      };
    } else if (field === "start") {
      const newStartDate = parse(tempValue, "yyyy-MM-dd", new Date());
      if (!isValid(newStartDate)) return;

      const newStartBusinessDay = calculateWorkingDays(PROJECT_BASE_DATE, newStartDate, "ABMY");
      const newEndDate = addWorkingDays(newStartDate, phase.workingDays || 0, "ABMY");

      updatedData = {
        startDate: newStartDate,
        startBusinessDay: newStartBusinessDay,
        endDate: newEndDate,
      };
    } else if (field === "end") {
      const newEndDate = parse(tempValue, "yyyy-MM-dd", new Date());
      if (!isValid(newEndDate)) return;

      const newDuration = calculateWorkingDays(startDate, newEndDate, "ABMY");
      if (newDuration <= 0) return;

      updatedData = {
        endDate: newEndDate,
        workingDays: newDuration,
      };
    }

    updatePhase(phase.id, updatedData);
    setEditMode(null);
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Timeline
      </h3>
      <div className="space-y-4">
        {/* Start Date */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Start Date</div>
            {editMode === "start" ? (
              <input
                type="date"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave("start")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("start");
                  if (e.key === "Escape") setEditMode(null);
                }}
                autoFocus
                className="w-full px-3 py-2.5 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{format(startDate, "MMM dd, yyyy")}</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode("start");
              setTempValue(format(startDate, "yyyy-MM-dd"));
            }}
            className="ml-4 p-2.5 hover:bg-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* End Date */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">End Date</div>
            {editMode === "end" ? (
              <input
                type="date"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave("end")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("end");
                  if (e.key === "Escape") setEditMode(null);
                }}
                autoFocus
                className="w-full px-3 py-2.5 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{format(endDate, "MMM dd, yyyy")}</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode("end");
              setTempValue(format(endDate, "yyyy-MM-dd"));
            }}
            className="ml-4 p-2.5 hover:bg-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Duration (Business Days)</div>
            {editMode === "duration" ? (
              <input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave("duration")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave("duration");
                  if (e.key === "Escape") setEditMode(null);
                }}
                autoFocus
                className="w-24 px-3 py-2.5 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{phase.workingDays} days</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode("duration");
              setTempValue(String(phase.workingDays || 0));
            }}
            className="ml-4 p-2.5 hover:bg-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick Team Templates for fast allocation
const TEAM_TEMPLATES = {
  lite: {
    name: "Lite Team",
    description: "Small project, 2-3 people",
    members: [
      { role: "consultant", count: 1, allocation: 100 },
      { role: "developer", count: 1, allocation: 100 },
      { role: "projectManager", count: 1, allocation: 50 },
    ],
  },
  standard: {
    name: "Standard Team",
    description: "Medium project, 4-6 people",
    members: [
      { role: "architect", count: 1, allocation: 50 },
      { role: "consultant", count: 2, allocation: 100 },
      { role: "developer", count: 2, allocation: 100 },
      { role: "projectManager", count: 1, allocation: 75 },
    ],
  },
  enterprise: {
    name: "Enterprise Team",
    description: "Large project, 8+ people",
    members: [
      { role: "architect", count: 1, allocation: 100 },
      { role: "consultant", count: 3, allocation: 100 },
      { role: "developer", count: 4, allocation: 100 },
      { role: "projectManager", count: 1, allocation: 100 },
      { role: "basis", count: 1, allocation: 50 },
    ],
  },
};

const ROLE_CONFIG: Record<string, { name: string; icon: string; baseRate: number; color: string }> =
  {
    architect: { name: "Solution Architect", icon: "🏗️", baseRate: 180, color: "blue" },
    consultant: { name: "Functional Consultant", icon: "💼", baseRate: 140, color: "purple" },
    developer: { name: "Developer", icon: "💻", baseRate: 120, color: "green" },
    projectManager: { name: "Project Manager", icon: "📊", baseRate: 160, color: "orange" },
    basis: { name: "Basis Admin", icon: "⚙️", baseRate: 155, color: "gray" },
    security: { name: "Security Specialist", icon: "🔒", baseRate: 150, color: "red" },
  };

// Resource Section Component - Redesigned for speed and efficiency
function ResourceSection({
  phase,
  decisions,
  updatePhase,
  onResourceUpdate,
}: {
  phase: Phase;
  decisions: any;
  updatePhase: any;
  onResourceUpdate: (resources: Resource[]) => void;
}) {
  const resources = phase.resources || [];
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const applyTemplate = (templateKey: keyof typeof TEAM_TEMPLATES) => {
    const template = TEAM_TEMPLATES[templateKey];
    const newResources = template.members.flatMap((member) => {
      const roleConfig = ROLE_CONFIG[member.role];
      return Array.from({ length: member.count }, (_, i) => ({
        id: `resource-${Date.now()}-${member.role}-${i}`,
        name: `${roleConfig.name} ${i + 1}`,
        role: member.role,
        allocation: member.allocation,
        region: "ABMY" as const,
        hourlyRate: roleConfig.baseRate,
      }));
    });
    onResourceUpdate(newResources);
    setShowQuickAdd(false);
  };

  const updateResourceAllocation = (idx: number, allocation: number) => {
    const updated = [...resources];
    updated[idx] = { ...updated[idx], allocation };
    onResourceUpdate(updated);
  };

  const deleteResource = (idx: number) => {
    onResourceUpdate(resources.filter((_, i) => i !== idx));
  };

  const totalCost = resources.reduce((sum, r) => {
    const hours = (phase.workingDays || 0) * 8 * (r.allocation / 100);
    return sum + hours * r.hourlyRate;
  }, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Team ({resources.length})
          </h3>
          {totalCost > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">Cost: {formatCurrency(totalCost, "MYR")}</p>
          )}
        </div>
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Sparkles className="w-3 h-3" />}
          onClick={() => setShowQuickAdd(!showQuickAdd)}
        >
          Quick Team
        </Button>
      </div>

      {/* Quick Team Templates */}
      {showQuickAdd && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl space-y-2">
          <div className="text-sm font-semibold text-gray-700 mb-3">Choose a team template:</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TEAM_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key as keyof typeof TEAM_TEMPLATES)}
                className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all text-left group min-h-[48px]"
              >
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 truncate">
                  {template.name}
                </div>
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {template.description}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {template.members.reduce((sum, m) => sum + m.count, 0)} people
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team Members - Fast adjustment with sliders */}
      {resources.length > 0 ? (
        <div className="space-y-3">
          {resources.map((resource, idx) => {
            const roleConfig = ROLE_CONFIG[resource.role] || {
              name: resource.role,
              icon: "👤",
              color: "gray",
            };
            const hours = (phase.workingDays || 0) * 8 * (resource.allocation / 100);
            const cost = hours * resource.hourlyRate;

            return (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 group hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg flex-shrink-0">{roleConfig.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {roleConfig.name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {formatCurrency(cost, "MYR")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteResource(idx)}
                    className="p-3 hover:bg-red-50 rounded transition-all min-w-[48px] min-h-[48px] flex items-center justify-center flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Quick allocation slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Allocation</span>
                    <span className="font-semibold text-gray-900">{resource.allocation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="25"
                    value={resource.allocation}
                    onChange={(e) => updateResourceAllocation(idx, parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <UsersIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No team assigned</p>
          <p className="text-sm text-gray-400 mt-1">Use Quick Team to get started</p>
        </div>
      )}
    </div>
  );
}

// Task Section Component
function TaskSection({
  phase,
  updatePhase,
  onTaskUpdate,
}: {
  phase: Phase;
  updatePhase: unknown;
  onTaskUpdate: (tasks: Task[]) => void;
}) {
  const tasks = phase.tasks || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    workingDays: 1,
    description: "",
  });

  const phaseStartDate =
    phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, "ABMY");
  const phaseEndDate =
    phase.endDate ||
    addWorkingDays(
      PROJECT_BASE_DATE,
      (phase.startBusinessDay || 0) + (phase.workingDays || 0),
      "ABMY"
    );

  const handleAddTask = () => {
    if (!newTask.name || !newTask.workingDays) return;

    // Default task dates to phase start
    const taskStartDate = newTask.startDate || phaseStartDate;
    const taskEndDate =
      newTask.endDate || addWorkingDays(taskStartDate, newTask.workingDays, "ABMY");

    // Validate dates are within phase boundaries
    if (isBefore(taskStartDate, phaseStartDate) || isAfter(taskEndDate, phaseEndDate)) {
      showWarning("Task dates must be within phase dates");
      return;
    }

    const task: Task = {
      id: `task-${Date.now()}`,
      name: newTask.name,
      startDate: taskStartDate,
      endDate: taskEndDate,
      workingDays: newTask.workingDays,
      description: newTask.description,
      status: "not_started",
    };

    const updatedTasks = [...tasks, task];
    onTaskUpdate(updatedTasks);
    setIsAdding(false);
    setNewTask({ name: "", workingDays: 1, description: "" });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    onTaskUpdate(updatedTasks);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id !== taskId) return t;

      const merged = { ...t, ...updates };

      // Validate date constraints
      if (merged.startDate && isBefore(merged.startDate, phaseStartDate)) {
        showWarning("Task start date cannot be before phase start date");
        return t;
      }

      if (merged.endDate && isAfter(merged.endDate, phaseEndDate)) {
        showWarning("Task end date cannot be after phase end date");
        return t;
      }

      // Recalculate working days if dates changed
      if (merged.startDate && merged.endDate) {
        merged.workingDays = calculateWorkingDays(merged.startDate, merged.endDate, "ABMY");
      }

      return merged;
    });

    onTaskUpdate(updatedTasks);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Tasks / Milestones ({tasks.length})
        </h3>
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus className="w-3 h-3" />}
          onClick={() => setIsAdding(true)}
        >
          Add Task
        </Button>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-4">
          <input
            type="text"
            placeholder="Task name"
            value={newTask.name || ""}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            className="w-full px-3 py-2.5 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={
                  newTask.startDate
                    ? format(newTask.startDate, "yyyy-MM-dd")
                    : format(phaseStartDate, "yyyy-MM-dd")
                }
                min={format(phaseStartDate, "yyyy-MM-dd")}
                max={format(phaseEndDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  const date = parse(e.target.value, "yyyy-MM-dd", new Date());
                  if (isValid(date)) {
                    setNewTask({ ...newTask, startDate: date });
                  }
                }}
                className="w-full px-3 py-2.5 border border-blue-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Duration (days)</label>
              <input
                type="number"
                min="1"
                value={newTask.workingDays || 1}
                onChange={(e) => {
                  const days = parseInt(e.target.value, 10);
                  const startDate = newTask.startDate || phaseStartDate;
                  const endDate = addWorkingDays(startDate, days, "ABMY");
                  setNewTask({ ...newTask, workingDays: days, endDate });
                }}
                className="w-full px-3 py-2.5 border border-blue-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Description (optional)</label>
            <textarea
              placeholder="What needs to be done in this task..."
              value={newTask.description || ""}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-blue-300 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="xs" onClick={handleAddTask}>
              Add Task
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setIsAdding(false);
                setNewTask({ name: "", workingDays: 1, effort: 1 });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              phase={phase}
              onUpdate={(updates) => handleUpdateTask(task.id, updates)}
              onDelete={() => handleDeleteTask(task.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Flag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No tasks added yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Break down this phase into smaller milestones
          </p>
        </div>
      )}
    </div>
  );
}

// Task Row Component
function TaskRow({
  task,
  phase,
  onUpdate,
  onDelete,
}: {
  task: Task;
  phase: Phase;
  onUpdate: (updates: Partial<Task>) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const phaseStartDate =
    phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, "ABMY");
  const phaseEndDate =
    phase.endDate ||
    addWorkingDays(
      PROJECT_BASE_DATE,
      (phase.startBusinessDay || 0) + (phase.workingDays || 0),
      "ABMY"
    );

  // Calculate task position within phase (for visual bar)
  const taskStart = task.startDate || phaseStartDate;
  const taskEnd = task.endDate || addWorkingDays(taskStart, task.workingDays || 1, "ABMY");
  const phaseDuration = calculateWorkingDays(phaseStartDate, phaseEndDate, "ABMY");
  const taskOffsetDays = calculateWorkingDays(phaseStartDate, taskStart, "ABMY");
  const taskPositionPercent = (taskOffsetDays / phaseDuration) * 100;
  const taskWidthPercent = ((task.workingDays || 1) / phaseDuration) * 100;

  // Status color mapping
  const statusConfig = {
    not_started: {
      bg: "bg-gray-100",
      border: "border-gray-300",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
    in_progress: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    completed: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      dot: "bg-green-500",
    },
  };

  const status = task.status || "not_started";
  const config = statusConfig[status];

  return (
    <div
      className={`p-3 rounded-xl border ${config.border} ${config.bg} hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
            <div className="font-medium text-gray-900 text-sm truncate">{task.name}</div>
          </div>
          <div className="text-sm text-gray-500 ml-4">
            {task.startDate && task.endDate ? (
              <>
                {format(task.startDate, "MMM dd")} → {format(task.endDate, "MMM dd")}
              </>
            ) : (
              <>
                {task.workingDays || 1} day{(task.workingDays || 1) > 1 ? "s" : ""}
              </>
            )}
          </div>
          {task.description && (
            <div className="text-sm text-gray-600 ml-4 mt-1 italic line-clamp-2">
              {task.description}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-3 hover:bg-white rounded transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-3 hover:bg-red-50 rounded transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Granular timeline visualization - mini Gantt within phase */}
      <div className="space-y-1.5">
        {/* Timeline ruler */}
        <div className="flex items-center justify-between text-sm text-gray-400 px-1">
          <span className="truncate">{format(phaseStartDate, "MMM dd")}</span>
          <span className="text-xs text-gray-300 px-2">Duration: {phase.workingDays}d</span>
          <span className="truncate">{format(phaseEndDate, "MMM dd")}</span>
        </div>

        {/* Task bar on timeline */}
        <div className="relative w-full h-6 bg-gray-200/50 rounded-lg overflow-hidden">
          <div
            className={cn(
              "absolute top-0 h-full rounded-lg shadow-sm flex items-center justify-center",
              status === "not_started" && "bg-gradient-to-r from-gray-400 to-gray-600",
              status === "in_progress" && "bg-gradient-to-r from-blue-500 to-blue-700",
              status === "completed" && "bg-gradient-to-r from-green-500 to-green-700"
            )}
            style={{
              left: `${Math.max(0, taskPositionPercent)}%`,
              width: `${Math.min(100 - Math.max(0, taskPositionPercent), taskWidthPercent)}%`,
            }}
          >
            <div className="text-xs font-semibold text-white px-2 truncate">
              {task.workingDays || 1} day{(task.workingDays || 1) > 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={task.startDate ? format(task.startDate, "yyyy-MM-dd") : ""}
                min={format(phaseStartDate, "yyyy-MM-dd")}
                max={format(phaseEndDate, "yyyy-MM-dd")}
                onChange={(e) => {
                  const date = parse(e.target.value, "yyyy-MM-dd", new Date());
                  if (isValid(date)) {
                    const newEndDate = addWorkingDays(date, task.workingDays || 1, "ABMY");
                    onUpdate({ startDate: date, endDate: newEndDate });
                  }
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-xs"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Duration (days)</label>
              <input
                type="number"
                min="1"
                value={task.workingDays}
                onChange={(e) => {
                  const days = parseInt(e.target.value, 10);
                  const startDate = task.startDate || phaseStartDate;
                  const endDate = addWorkingDays(startDate, days, "ABMY");
                  onUpdate({ workingDays: days, endDate });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Status</label>
            <select
              value={task.status || "not_started"}
              onChange={(e) => onUpdate({ status: e.target.value as any })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Description</label>
            <textarea
              value={task.description || ""}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
              rows={2}
            />
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={() => setIsEditing(false)}
            className="w-full"
          >
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper to calculate phase cost
function calculatePhaseCost(phase: Phase): number {
  if (!phase.resources || phase.resources.length === 0) return 0;
  return phase.resources.reduce((sum, resource) => {
    const hours = phase.workingDays * 8 * (resource.allocation / 100);
    return sum + hours * resource.hourlyRate;
  }, 0);
}
