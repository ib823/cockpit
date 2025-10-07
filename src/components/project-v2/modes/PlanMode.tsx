"use client";

import { JobsGanttChart } from "@/components/timeline/JobsGanttChart";
import { cn, formatCurrency, formatDuration } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore, type Phase } from "@/stores/timeline-store";
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
  Layers
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Heading3, BodyMD } from "@/components/common/Typography";
// ResourcePanel and RicefwPanel imports removed - using placeholders for now
import type { Task } from "@/types/core";

const PROJECT_BASE_DATE = new Date(new Date().getFullYear(), 0, 1);

// Tab types for PlanMode (merged from OptimizeMode per spec: Holistic_Redesign_V2.md)
type PlanTab = 'timeline' | 'resources' | 'ricefw';

export function PlanMode() {
  const { phases, selectedPackages, getProjectCost, updatePhase } = useTimelineStore();
  const { setMode, regenerateTimeline, timelineIsStale } = useProjectStore();
  const { chips, completeness, decisions } = usePresalesStore();
  const totalCost = getProjectCost();

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [activeTab, setActiveTab] = useState<PlanTab>('timeline');

  // Auto-generate timeline if empty and we have requirements
  useEffect(() => {
    if (phases.length === 0 && chips.length > 0 && (completeness?.score || 0) >= 30) {
      regenerateTimeline(true);
    }
  }, [phases.length, chips.length, completeness?.score, regenerateTimeline]);

  const handleRegenerate = useCallback(() => {
    regenerateTimeline(true);
  }, [regenerateTimeline]);

  const totalDuration = useMemo(
    () => phases.reduce((sum, phase) => sum + phase.workingDays, 0),
    [phases]
  );

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

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setMode('present')}
              leftIcon={<Presentation className="w-4 h-4" />}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Present
            </Button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">{formatCurrency(totalCost, "MYR")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
            <Flag className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">{phases.length} Phases</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation (merged from OptimizeMode per spec: Holistic_Redesign_V2.md) */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('timeline')}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === 'timeline'
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === 'resources'
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
            )}
          >
            <UsersIcon className="w-4 h-4 inline mr-2" />
            Resources
          </button>
          <button
            onClick={() => setActiveTab('ricefw')}
            className={cn(
              "px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px",
              activeTab === 'ricefw'
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
          <div className="flex items-center gap-3">
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
        {activeTab === 'timeline' && (
          <div className="p-6">
            <JobsGanttChart onPhaseClick={(phase) => setSelectedPhase(phase)} />
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Resource Planning
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Allocate team members to phases and optimize resource utilization
              </p>
              <p className="text-xs text-gray-500">
                {phases.length} phases • Coming soon
              </p>
            </div>
          </div>
        )}

        {activeTab === 'ricefw' && (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Layers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                RICEFW Objects
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Estimate custom development objects (Reports, Interfaces, Conversions, Enhancements, Forms, Workflows)
              </p>
              <p className="text-xs text-gray-500">
                Feature available in dedicated RICEFW module
              </p>
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
              className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Panel Header */}
              <div className="shrink-0 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                      {selectedPhase.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedPhase.category}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhase(null)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-blue-900">{selectedPhase.workingDays}</div>
                    <div className="text-xs text-blue-600 mt-1">Days</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-purple-900">{selectedPhase.effort}</div>
                    <div className="text-xs text-purple-600 mt-1">Man-days</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-green-900">
                      {selectedPhase.resources?.length || 0}
                    </div>
                    <div className="text-xs text-green-600 mt-1">People</div>
                  </div>
                </div>
              </div>

              {/* Panel Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

                {/* Cost */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Investment
                  </h3>
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                    <div className="text-3xl font-semibold">
                      {formatCurrency(calculatePhaseCost(selectedPhase), "MYR")}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Phase budget</div>
                  </div>
                </div>
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
  const [editMode, setEditMode] = useState<'start' | 'end' | 'duration' | null>(null);
  const [tempValue, setTempValue] = useState("");

  const startDate = phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, 'ABMY');
  const endDate = phase.endDate || addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), 'ABMY');

  const handleSave = (field: 'start' | 'end' | 'duration') => {
    if (!updatePhase) return;

    let updatedData: Partial<Phase> = {};

    if (field === 'duration') {
      const newDuration = parseInt(tempValue, 10);
      if (isNaN(newDuration) || newDuration <= 0) return;

      const newEndDate = addWorkingDays(startDate, newDuration, 'ABMY');
      updatedData = {
        workingDays: newDuration,
        endDate: newEndDate,
      };
    } else if (field === 'start') {
      const newStartDate = parse(tempValue, 'yyyy-MM-dd', new Date());
      if (!isValid(newStartDate)) return;

      const newStartBusinessDay = calculateWorkingDays(PROJECT_BASE_DATE, newStartDate, 'ABMY');
      const newEndDate = addWorkingDays(newStartDate, phase.workingDays || 0, 'ABMY');

      updatedData = {
        startDate: newStartDate,
        startBusinessDay: newStartBusinessDay,
        endDate: newEndDate,
      };
    } else if (field === 'end') {
      const newEndDate = parse(tempValue, 'yyyy-MM-dd', new Date());
      if (!isValid(newEndDate)) return;

      const newDuration = calculateWorkingDays(startDate, newEndDate, 'ABMY');
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
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Timeline
      </h3>
      <div className="space-y-3">
        {/* Start Date */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Start Date</div>
            {editMode === 'start' ? (
              <input
                type="date"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave('start')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave('start');
                  if (e.key === 'Escape') setEditMode(null);
                }}
                autoFocus
                className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{format(startDate, 'MMM dd, yyyy')}</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode('start');
              setTempValue(format(startDate, 'yyyy-MM-dd'));
            }}
            className="ml-3 p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* End Date */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">End Date</div>
            {editMode === 'end' ? (
              <input
                type="date"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave('end')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave('end');
                  if (e.key === 'Escape') setEditMode(null);
                }}
                autoFocus
                className="w-full px-2 py-1 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{format(endDate, 'MMM dd, yyyy')}</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode('end');
              setTempValue(format(endDate, 'yyyy-MM-dd'));
            }}
            className="ml-3 p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Duration (Business Days)</div>
            {editMode === 'duration' ? (
              <input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={() => handleSave('duration')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave('duration');
                  if (e.key === 'Escape') setEditMode(null);
                }}
                autoFocus
                className="w-24 px-2 py-1 border border-blue-500 rounded text-sm"
              />
            ) : (
              <div className="font-semibold text-gray-900">{phase.workingDays} days</div>
            )}
          </div>
          <button
            onClick={() => {
              setEditMode('duration');
              setTempValue(String(phase.workingDays || 0));
            }}
            className="ml-3 p-2 hover:bg-white rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Resource Section Component
function ResourceSection({
  phase,
  decisions,
  updatePhase,
  onResourceUpdate,
}: {
  phase: Phase;
  decisions: any;
  updatePhase: any;
  onResourceUpdate: (resources: any[]) => void;
}) {
  const resources = phase.resources || [];
  const [isAdding, setIsAdding] = useState(false);

  // Get skillsets from decisions (connected to planning/decide)
  const requiredSkillsets = useMemo(() => {
    const skillsets = new Set<string>();

    // Based on module combo decision
    if (decisions?.moduleCombo) {
      const combo = decisions.moduleCombo;
      if (combo.includes('SuccessFactors')) skillsets.add('SF Consultant');
      if (combo.includes('S/4HANA')) skillsets.add('S4 Consultant');
      if (combo.includes('Ariba')) skillsets.add('Ariba Specialist');
    }

    // Based on SSO decision
    if (decisions?.ssoMode && decisions.ssoMode !== 'none') {
      skillsets.add('Security Architect');
    }

    // Always need project management
    skillsets.add('Project Manager');
    skillsets.add('Business Analyst');

    return Array.from(skillsets);
  }, [decisions]);

  const handleAddResource = (resource: any) => {
    const updatedResources = [...resources, resource];
    onResourceUpdate(updatedResources);
    setIsAdding(false);
  };

  const handleDeleteResource = (index: number) => {
    const updatedResources = resources.filter((_, idx) => idx !== index);
    onResourceUpdate(updatedResources);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Team ({resources.length})
        </h3>
        <Button
          variant="secondary"
          size="xs"
          leftIcon={<Plus className="w-3 h-3" />}
          onClick={() => setIsAdding(true)}
        >
          Add Resource
        </Button>
      </div>

      {/* Required Skillsets (from decisions) */}
      {requiredSkillsets.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-medium text-blue-900 mb-2">Required Skills (from your decisions):</div>
          <div className="flex flex-wrap gap-2">
            {requiredSkillsets.map((skill) => (
              <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {isAdding && (
        <AddResourceModal
          phase={phase}
          requiredSkills={requiredSkillsets}
          onAdd={handleAddResource}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {/* Assigned Resources */}
      {resources.length > 0 ? (
        <div className="space-y-2">
          {resources.map((resource, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {(resource.name || resource.role).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{resource.name || resource.role}</div>
                <div className="text-sm text-gray-500">{resource.role} • {resource.region}</div>
                <div className="text-xs text-gray-400 mt-1">
                  ${resource.hourlyRate}/hr • {((phase.workingDays || 0) * 8 * (resource.allocation / 100)).toFixed(1)} hours
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{resource.allocation}%</div>
                <div className="text-xs text-gray-500">allocation</div>
                <div className="text-xs font-semibold text-green-700 mt-1">
                  ${(((phase.workingDays || 0) * 8 * (resource.allocation / 100)) * resource.hourlyRate).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleDeleteResource(idx)}
                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                title="Remove resource"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <UsersIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No team members assigned yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Click &quot;Add Resource&quot; to allocate people to this phase
          </p>
        </div>
      )}
    </div>
  );
}

// Add Resource Modal Component
function AddResourceModal({
  phase,
  requiredSkills,
  onAdd,
  onCancel,
}: {
  phase: Phase;
  requiredSkills: string[];
  onAdd: (resource: any) => void;
  onCancel: () => void;
}) {
  const [newResource, setNewResource] = useState({
    name: "",
    role: requiredSkills[0] || "",
    allocation: 100,
    region: "ABMY" as "ABMY" | "ABSG" | "ABVN",
    hourlyRate: 150,
  });

  // Region-specific rates (MYR)
  const regionRates = {
    ABMY: { min: 100, max: 300, default: 150 },
    ABSG: { min: 150, max: 400, default: 200 },
    ABVN: { min: 50, max: 150, default: 80 },
  };

  // Role-based rate multipliers
  const roleMultipliers: Record<string, number> = {
    "Project Manager": 1.5,
    "Business Analyst": 1.2,
    "SF Consultant": 1.3,
    "S4 Consultant": 1.4,
    "Ariba Specialist": 1.3,
    "Security Architect": 1.6,
    "Developer": 1.0,
    "Tester": 0.9,
  };

  // Calculate suggested rate
  const suggestedRate = useMemo(() => {
    const baseRate = regionRates[newResource.region].default;
    const multiplier = roleMultipliers[newResource.role] || 1.0;
    return Math.round(baseRate * multiplier);
  }, [newResource.role, newResource.region, regionRates, roleMultipliers]);

  // Calculate cost insights
  const totalHours = (phase.workingDays || 0) * 8 * (newResource.allocation / 100);
  const estimatedCost = totalHours * newResource.hourlyRate;

  const handleAdd = () => {
    if (!newResource.name || !newResource.role) {
      showError("Please fill in all required fields");
      return;
    }

    onAdd({
      id: `resource-${Date.now()}`,
      ...newResource,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Add Team Member</h2>
              <p className="text-sm text-gray-500 mt-1">Allocate resources to {phase.name}</p>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cost Insight Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Estimated Cost Impact</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ${estimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {totalHours.toFixed(1)} hours @ ${newResource.hourlyRate}/hr
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                value={newResource.name}
                onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role * {requiredSkills.includes(newResource.role) && <span className="text-blue-600">(Required skill)</span>}
              </label>
              <select
                value={newResource.role}
                onChange={(e) => setNewResource({ ...newResource, role: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {requiredSkills.length > 0 && (
                  <optgroup label="Required Skills (from decisions)">
                    {requiredSkills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill} ⭐
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Other Roles">
                  <option value="Developer">Developer</option>
                  <option value="Tester">Tester</option>
                  <option value="Solution Architect">Solution Architect</option>
                  <option value="Technical Lead">Technical Lead</option>
                </optgroup>
              </select>
            </div>

            {/* Region and Allocation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  value={newResource.region}
                  onChange={(e) => {
                    const region = e.target.value as any;
                    setNewResource({
                      ...newResource,
                      region,
                      hourlyRate: regionRates[region].default * (roleMultipliers[newResource.role] || 1.0),
                    });
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ABMY">🇲🇾 Malaysia (MYR)</option>
                  <option value="ABSG">🇸🇬 Singapore (SGD)</option>
                  <option value="ABVN">🇻🇳 Vietnam (VND)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allocation (%)
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={newResource.allocation}
                    onChange={(e) => setNewResource({ ...newResource, allocation: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-center mt-2">
                    <span className="text-2xl font-bold text-gray-900">{newResource.allocation}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (MYR)
                <span className="text-sm text-gray-500 ml-2">
                  Suggested: ${suggestedRate}/hr
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  min={regionRates[newResource.region].min}
                  max={regionRates[newResource.region].max}
                  step="10"
                  value={newResource.hourlyRate}
                  onChange={(e) => setNewResource({ ...newResource, hourlyRate: parseInt(e.target.value) })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>Min: ${regionRates[newResource.region].min}</span>
                <span>Max: ${regionRates[newResource.region].max}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            This will add <span className="font-semibold">${estimatedCost.toLocaleString()}</span> to phase cost
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Add to Team
            </Button>
          </div>
        </div>
      </motion.div>
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
  updatePhase: any;
  onTaskUpdate: (tasks: Task[]) => void;
}) {
  const tasks = phase.tasks || [];
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    name: "",
    workingDays: 1,
    effort: 1,
  });

  const phaseStartDate = phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, 'ABMY');
  const phaseEndDate = phase.endDate || addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), 'ABMY');

  const availableResources = phase.resources || [];
  const allocatedEffort = tasks.reduce((sum, task) => sum + (task.effort || 0), 0);
  const remainingEffort = (phase.effort || 0) - allocatedEffort;

  const handleAddTask = () => {
    if (!newTask.name || !newTask.workingDays || !newTask.effort) return;

    // Default task dates to phase start
    const taskStartDate = newTask.startDate || phaseStartDate;
    const taskEndDate = newTask.endDate || addWorkingDays(taskStartDate, newTask.workingDays, 'ABMY');

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
      effort: newTask.effort,
      defaultRole: newTask.defaultRole,
      description: newTask.description,
      status: "not_started",
    };

    const updatedTasks = [...tasks, task];
    onTaskUpdate(updatedTasks);
    setIsAdding(false);
    setNewTask({ name: "", workingDays: 1, effort: 1 });
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
        merged.workingDays = calculateWorkingDays(merged.startDate, merged.endDate, 'ABMY');
      }

      return merged;
    });

    onTaskUpdate(updatedTasks);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
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

      {/* Effort Budget Indicator */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">Effort Allocated</span>
          <span className={`text-sm font-semibold ${remainingEffort < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {allocatedEffort} / {phase.effort || 0} man-days
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              remainingEffort < 0 ? 'bg-red-500' : remainingEffort === 0 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, (allocatedEffort / (phase.effort || 1)) * 100)}%` }}
          />
        </div>
        {remainingEffort < 0 && (
          <p className="text-xs text-red-600 mt-1">⚠️ Over-allocated by {Math.abs(remainingEffort)} man-days</p>
        )}
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
          <input
            type="text"
            placeholder="Task name"
            value={newTask.name || ""}
            onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={newTask.startDate ? format(newTask.startDate, 'yyyy-MM-dd') : format(phaseStartDate, 'yyyy-MM-dd')}
                min={format(phaseStartDate, 'yyyy-MM-dd')}
                max={format(phaseEndDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
                  if (isValid(date)) {
                    setNewTask({ ...newTask, startDate: date });
                  }
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
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
                  const endDate = addWorkingDays(startDate, days, 'ABMY');
                  setNewTask({ ...newTask, workingDays: days, endDate });
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Effort (man-days)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                max={remainingEffort > 0 ? remainingEffort : undefined}
                value={newTask.effort || 1}
                onChange={(e) => setNewTask({ ...newTask, effort: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Role</label>
              <select
                value={newTask.defaultRole || ""}
                onChange={(e) => setNewTask({ ...newTask, defaultRole: e.target.value })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
              >
                <option value="">Select role...</option>
                {availableResources.map((r, idx) => (
                  <option key={idx} value={r.role}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>
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
          <p className="text-xs text-gray-400 mt-1">Break down this phase into smaller milestones</p>
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

  const phaseStartDate = phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, 'ABMY');
  const phaseEndDate = phase.endDate || addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), 'ABMY');

  // Calculate task position within phase (for visual bar)
  const taskStart = task.startDate || phaseStartDate;
  const taskEnd = task.endDate || addWorkingDays(taskStart, task.workingDays, 'ABMY');
  const phaseDuration = calculateWorkingDays(phaseStartDate, phaseEndDate, 'ABMY');
  const taskOffsetDays = calculateWorkingDays(phaseStartDate, taskStart, 'ABMY');
  const taskPositionPercent = (taskOffsetDays / phaseDuration) * 100;
  const taskWidthPercent = (task.workingDays / phaseDuration) * 100;

  return (
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{task.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            {task.startDate && task.endDate ? (
              <>
                {format(task.startDate, 'MMM dd')} → {format(task.endDate, 'MMM dd')} • {task.workingDays}d • {task.effort}md
              </>
            ) : (
              <>
                {task.workingDays}d • {task.effort}md
              </>
            )}
            {task.defaultRole && <> • {task.defaultRole}</>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 hover:bg-white rounded transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Task visual bar (within phase) */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{
            marginLeft: `${taskPositionPercent}%`,
            width: `${taskWidthPercent}%`,
          }}
        />
      </div>

      {/* Edit Mode */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
              <input
                type="date"
                value={task.startDate ? format(task.startDate, 'yyyy-MM-dd') : ''}
                min={format(phaseStartDate, 'yyyy-MM-dd')}
                max={format(phaseEndDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const date = parse(e.target.value, 'yyyy-MM-dd', new Date());
                  if (isValid(date)) {
                    const newEndDate = addWorkingDays(date, task.workingDays, 'ABMY');
                    onUpdate({ startDate: date, endDate: newEndDate });
                  }
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
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
                  const endDate = addWorkingDays(startDate, days, 'ABMY');
                  onUpdate({ workingDays: days, endDate });
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Effort (man-days)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={task.effort}
                onChange={(e) => onUpdate({ effort: parseFloat(e.target.value) })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              />
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
