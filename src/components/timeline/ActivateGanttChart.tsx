"use client";

import { useTimelineStore } from "@/stores/timeline-store";
import type { Phase } from "@/types/core";
import { addWorkingDays, calculateWorkingDays } from "@/data/holidays";
import { format, differenceInDays, addDays } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  Flag,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { Heading3 } from "@/components/common/Typography";
import { HolidayManagerModal } from "./HolidayManagerModal";
import { MilestoneManagerModal } from "./MilestoneManagerModal";
import { getHolidaysInRange } from "@/data/holidays";

const PROJECT_BASE_DATE = new Date(new Date().getFullYear(), 0, 1);

// SAP Activate Phases
const SAP_ACTIVATE_PHASES = [
  {
    id: 'prepare',
    name: 'Prepare',
    description: 'Project kickoff, planning, and team setup',
    color: 'bg-blue-500',
  },
  {
    id: 'explore',
    name: 'Explore',
    description: 'Requirements gathering, fit-gap analysis, and solution design',
    color: 'bg-purple-500',
  },
  {
    id: 'realize',
    name: 'Realize',
    description: 'Configuration, customization, and development',
    color: 'bg-green-500',
  },
  {
    id: 'deploy',
    name: 'Deploy',
    description: 'Testing, training, cutover, and go-live',
    color: 'bg-amber-500',
  },
  {
    id: 'run',
    name: 'Run',
    description: 'Hypercare, optimization, and continuous improvement',
    color: 'bg-red-500',
  },
] as const;

interface ActivatePhaseData {
  id: string;
  name: string;
  color: string;
  description: string;
  phases: Phase[];
  tasks: Array<{
    id: string;
    name: string;
    workingDays: number;
    effort: number;
    defaultRole: string;
  }>;
  startBusinessDay: number;
  endBusinessDay: number;
  workingDays: number;
  effort: number;
  resources: any[];
}

export function ActivateGanttChart({
  phases: phasesProp,
  onPhaseClick
}: {
  phases?: Phase[];
  onPhaseClick?: (phase: Phase) => void;
}) {
  const storePhases = useTimelineStore((state) => state.phases);
  const updatePhase = useTimelineStore((state) => state.updatePhase);

  const rawPhases = Array.isArray(phasesProp)
    ? phasesProp
    : Array.isArray(storePhases)
    ? storePhases
    : [];

  // State
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState<'ABMY' | 'ABSG' | 'ABVN'>('ABMY');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; date: Date; color: string }>>([]);

  // Group phases by SAP Activate methodology
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activatePhases = useMemo((): ActivatePhaseData[] => {
    return SAP_ACTIVATE_PHASES.map((activatePhase, index) => {
      // Get phases that belong to this activate phase
      const phasesInActivate = rawPhases.filter(p => {
        const category = p.category?.toLowerCase() || '';
        return category.includes(activatePhase.id);
      });

      // If no phases match, create placeholder
      if (phasesInActivate.length === 0) {
        const startDay = index * 30; // Default spacing
        return {
          id: activatePhase.id,
          name: activatePhase.name,
          color: activatePhase.color,
          description: activatePhase.description,
          phases: [],
          tasks: [
            { id: `${activatePhase.id}-task-1`, name: 'Planning & Setup', workingDays: 10, effort: 10, defaultRole: 'Consultant' },
            { id: `${activatePhase.id}-task-2`, name: 'Execution', workingDays: 15, effort: 15, defaultRole: 'Consultant' },
            { id: `${activatePhase.id}-task-3`, name: 'Review & Handover', workingDays: 5, effort: 5, defaultRole: 'Consultant' },
          ],
          startBusinessDay: startDay,
          endBusinessDay: startDay + 30,
          workingDays: 30,
          effort: 30,
          resources: [],
        };
      }

      // Calculate aggregate data
      const startBusinessDay = Math.min(...phasesInActivate.map(p => p.startBusinessDay || 0));
      const endBusinessDay = Math.max(...phasesInActivate.map(p => (p.startBusinessDay || 0) + (p.workingDays || 0)));
      const workingDays = endBusinessDay - startBusinessDay;
      const effort = phasesInActivate.reduce((sum, p) => sum + (p.effort || 0), 0);

      // Get all resources across phases
      const allResources = phasesInActivate.flatMap(p => p.resources || []);

      // Create 3 key tasks from the phases
      const tasks = phasesInActivate.slice(0, 3).map((p, idx) => ({
        id: p.id,
        name: p.name,
        workingDays: p.workingDays || 0,
        effort: p.effort || 0,
        defaultRole: p.resources?.[0]?.role || 'Consultant',
      }));

      // Fill to ensure 3 tasks
      while (tasks.length < 3) {
        tasks.push({
          id: `${activatePhase.id}-task-${tasks.length + 1}`,
          name: `Task ${tasks.length + 1}`,
          workingDays: Math.floor(workingDays / 3),
          effort: Math.floor(effort / 3),
          defaultRole: 'Consultant',
        });
      }

      return {
        id: activatePhase.id,
        name: activatePhase.name,
        color: activatePhase.color,
        description: activatePhase.description,
        phases: phasesInActivate,
        tasks: tasks.slice(0, 3), // Ensure exactly 3 tasks
        startBusinessDay,
        endBusinessDay,
        workingDays,
        effort,
        resources: allResources,
      };
    });
  }, [rawPhases]);

  // Calculate timeline bounds
  const { minDate, maxDate, totalDays, totalBusinessDays } = useMemo(() => {
    if (activatePhases.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 180),
        totalDays: 180,
        totalBusinessDays: 180,
      };
    }

    const start = Math.min(...activatePhases.map(p => p.startBusinessDay));
    const end = Math.max(...activatePhases.map(p => p.endBusinessDay));

    const minD = addWorkingDays(PROJECT_BASE_DATE, start, selectedRegion);
    const maxD = addWorkingDays(PROJECT_BASE_DATE, end, selectedRegion);

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: differenceInDays(maxD, minD),
      totalBusinessDays: end - start,
    };
  }, [activatePhases, selectedRegion]);

  // Get holidays
  const visibleHolidays = useMemo(() => {
    return getHolidaysInRange(minDate, maxDate, selectedRegion);
  }, [minDate, maxDate, selectedRegion]);

  // Toggle phase expansion
  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedPhases(new Set(activatePhases.map(p => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedPhases(new Set());
  };

  // Resource avatars
  const renderResourceAvatars = (resources: any[]) => {
    if (resources.length === 0) return null;

    const visibleCount = Math.min(3, resources.length);
    const remainingCount = resources.length - visibleCount;

    return (
      <div className="flex items-center gap-1 mt-1 absolute bottom-1 left-2">
        {resources.slice(0, visibleCount).map((resource, idx) => {
          const initials =
            resource.name
              ?.split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "??";

          return (
            <div
              key={idx}
              className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-semibold text-white backdrop-blur-sm"
              title={`${resource.name} - ${resource.role} (${resource.allocation}%)`}
            >
              {initials}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-[10px] font-semibold text-white backdrop-blur-sm"
            title={`${remainingCount} more team member${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Utilization bar
  const renderUtilizationBar = (resources: any[]) => {
    if (resources.length === 0) return null;

    const avgAllocation =
      resources.reduce((sum, r) => sum + (r.allocation || 0), 0) / resources.length;

    const barColor =
      avgAllocation > 100
        ? "bg-red-400"
        : avgAllocation >= 80
        ? "bg-orange-400"
        : "bg-green-400";

    return (
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(100, avgAllocation)}%` }}
        />
      </div>
    );
  };

  if (activatePhases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center shadow-sm">
        <p className="text-gray-500">
          No timeline generated yet. Select packages and generate a timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto bg-white rounded-lg shadow-lg p-8">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Heading3>SAP Activate Timeline</Heading3>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExpandAll}
              leftIcon={<Maximize2 className="w-4 h-4" />}
            >
              Expand All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCollapseAll}
              leftIcon={<Minimize2 className="w-4 h-4" />}
            >
              Collapse All
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select region"
          >
            <option value="ABMY">🇲🇾 Malaysia</option>
            <option value="ABSG">🇸🇬 Singapore</option>
            <option value="ABVN">🇻🇳 Vietnam</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHolidayModal(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Holidays ({visibleHolidays.length})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMilestoneModal(true)}
            leftIcon={<Flag className="w-4 h-4" />}
          >
            Milestones ({milestones.length})
          </Button>
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-600 mb-1">Start Date</div>
          <div className="font-semibold text-gray-900">{format(minDate, 'MMM dd, yyyy')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">End Date</div>
          <div className="font-semibold text-gray-900">{format(maxDate, 'MMM dd, yyyy')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Total Duration</div>
          <div className="font-semibold text-gray-900">{totalBusinessDays} days</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Holidays</div>
          <div className="font-semibold text-gray-900">{visibleHolidays.length} days</div>
        </div>
      </div>

      {/* Month Headers */}
      <div className="flex border-b-2 border-gray-200 pb-3 mb-4">
        <div className="w-64 font-semibold text-gray-700 text-sm">SAP Activate Phase</div>
        <div className="flex-1 relative h-6">
          {generateMonthMarkers(minDate, maxDate, totalDays).map((marker, idx) => (
            <div
              key={idx}
              className="absolute text-xs font-medium text-gray-600"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </div>
          ))}
        </div>
      </div>

      {/* SAP Activate Phases */}
      <div className="space-y-4">
        {activatePhases.map((activatePhase) => {
          const isExpanded = expandedPhases.has(activatePhase.id);
          const startPercent = ((activatePhase.startBusinessDay || 0) / totalBusinessDays) * 100;
          const widthPercent = ((activatePhase.workingDays || 0) / totalBusinessDays) * 100;

          return (
            <div key={activatePhase.id} className="mb-2">
              {/* Phase Row */}
              <div className="flex items-center mb-2 group/phase">
                <div className="w-64 pr-4 flex items-center">
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <button
                      onClick={() => togglePhase(activatePhase.id)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      aria-label={isExpanded ? "Collapse tasks" : "Expand tasks"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{activatePhase.name}</div>
                      <div className="text-xs text-gray-500">{activatePhase.workingDays}d • {activatePhase.effort}md</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative h-16">
                  {/* Phase Bar */}
                  <div
                    className={`absolute top-2 h-12 rounded-lg ${activatePhase.color} hover:shadow-xl hover:brightness-110 transition-all cursor-pointer`}
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    onClick={() => togglePhase(activatePhase.id)}
                  >
                    {/* Phase Content */}
                    <div className="p-2 h-full flex flex-col justify-between">
                      {/* Dates */}
                      <div className="flex justify-between text-[10px] text-white/80 font-medium gap-1">
                        <span>
                          {format(addWorkingDays(PROJECT_BASE_DATE, activatePhase.startBusinessDay, selectedRegion), 'MMM dd')}
                        </span>
                        <span>
                          {format(addWorkingDays(PROJECT_BASE_DATE, activatePhase.endBusinessDay, selectedRegion), 'MMM dd')}
                        </span>
                      </div>

                      {/* Duration */}
                      <div className="text-center">
                        <span className="text-xs font-bold text-white px-2 py-0.5 bg-black/20 rounded">
                          {activatePhase.workingDays}d
                        </span>
                      </div>
                    </div>

                    {/* Avatars */}
                    {renderResourceAvatars(activatePhase.resources)}

                    {/* Utilization */}
                    {renderUtilizationBar(activatePhase.resources)}
                  </div>
                </div>
              </div>

              {/* Tasks - Shown when expanded */}
              {isExpanded && activatePhase.tasks.length > 0 && (
                <div className="ml-12 space-y-1 mb-2">
                  {activatePhase.tasks.map((task, idx) => {
                    const taskStartPercent = startPercent + (widthPercent * (activatePhase.tasks.slice(0, idx).reduce((sum, t) => sum + t.workingDays, 0) / activatePhase.workingDays));
                    const taskWidthPercent = widthPercent * (task.workingDays / activatePhase.workingDays);

                    return (
                      <div key={task.id} className="flex items-center text-xs">
                        <div className="w-52 pr-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">└</span>
                            <span className="truncate">{task.name}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 ml-4">
                            {task.workingDays}d • {task.effort}md • {task.defaultRole}
                          </div>
                        </div>
                        <div className="flex-1 relative h-8">
                          <div
                            className={`absolute top-1 h-6 rounded ${activatePhase.color} opacity-40 hover:opacity-60 transition-opacity`}
                            style={{
                              left: `${taskStartPercent}%`,
                              width: `${taskWidthPercent}%`,
                            }}
                            title={`${task.name} - ${task.defaultRole}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showHolidayModal && (
        <HolidayManagerModal
          region={selectedRegion}
          onClose={() => setShowHolidayModal(false)}
        />
      )}

      {showMilestoneModal && (
        <MilestoneManagerModal
          milestones={milestones}
          onUpdate={(updated) => {
            setMilestones(updated);
            setShowMilestoneModal(false);
          }}
          onClose={() => setShowMilestoneModal(false)}
        />
      )}
    </div>
  );
}

// Helper: Generate month markers
function generateMonthMarkers(startDate: Date, endDate: Date, totalDays: number): Array<{ position: number; label: string }> {
  const markers: Array<{ position: number; label: string }> = [];

  let current = new Date(startDate);
  current.setDate(1);

  while (current <= endDate) {
    const offset = differenceInDays(current, startDate);
    const position = (offset / totalDays) * 100;

    markers.push({
      position: Math.max(0, position),
      label: format(current, 'MMM yyyy'),
    });

    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return markers;
}
