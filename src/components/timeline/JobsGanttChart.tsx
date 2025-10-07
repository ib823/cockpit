"use client";

import { useTimelineStore } from "@/stores/timeline-store";
import type { Phase } from "@/types/core";
import { addWorkingDays } from "@/data/holidays";
import { format, differenceInDays } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PROJECT_BASE_DATE = new Date(new Date().getFullYear(), 0, 1);

// SAP Activate Phases - Elegant, muted colors (Jobs would approve)
const SAP_ACTIVATE_PHASES = [
  {
    id: 'prepare',
    name: 'Prepare',
    color: 'from-blue-500/90 to-blue-600/90',
    textColor: 'text-blue-50',
    bgAccent: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'explore',
    name: 'Explore',
    color: 'from-purple-500/90 to-purple-600/90',
    textColor: 'text-purple-50',
    bgAccent: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    id: 'realize',
    name: 'Realize',
    color: 'from-emerald-500/90 to-emerald-600/90',
    textColor: 'text-emerald-50',
    bgAccent: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'deploy',
    name: 'Deploy',
    color: 'from-amber-500/90 to-amber-600/90',
    textColor: 'text-amber-50',
    bgAccent: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'run',
    name: 'Run',
    color: 'from-rose-500/90 to-rose-600/90',
    textColor: 'text-rose-50',
    bgAccent: 'bg-rose-50',
    borderColor: 'border-rose-200',
  },
] as const;

interface ActivatePhaseData {
  id: string;
  name: string;
  color: string;
  textColor: string;
  bgAccent: string;
  borderColor: string;
  phases: Phase[];
  tasks: Array<{
    id: string;
    name: string;
    workingDays: number;
    effort: number;
  }>;
  startBusinessDay: number;
  endBusinessDay: number;
  workingDays: number;
  totalEffort: number;
  teamSize: number;
}

export function JobsGanttChart({
  phases: phasesProp,
  onPhaseClick
}: {
  phases?: Phase[];
  onPhaseClick?: (phase: Phase) => void;
}) {
  const storePhases = useTimelineStore((state) => state.phases);

  const rawPhases = Array.isArray(phasesProp)
    ? phasesProp
    : Array.isArray(storePhases)
    ? storePhases
    : [];

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedRegion] = useState<'ABMY' | 'ABSG' | 'ABVN'>('ABMY');

  // Group phases by SAP Activate methodology
  const activatePhases = useMemo((): ActivatePhaseData[] => {
    return SAP_ACTIVATE_PHASES.map((activatePhase, index) => {
      const phasesInActivate = rawPhases.filter(p => {
        const category = p.category?.toLowerCase() || '';
        return category.includes(activatePhase.id);
      });

      if (phasesInActivate.length === 0) {
        const startDay = index * 30;
        return {
          ...activatePhase,
          phases: [],
          tasks: [
            { id: `${activatePhase.id}-task-1`, name: 'Planning & Setup', workingDays: 10, effort: 80 },
            { id: `${activatePhase.id}-task-2`, name: 'Execution', workingDays: 15, effort: 120 },
            { id: `${activatePhase.id}-task-3`, name: 'Review & Handover', workingDays: 5, effort: 40 },
          ],
          startBusinessDay: startDay,
          endBusinessDay: startDay + 30,
          workingDays: 30,
          totalEffort: 240,
          teamSize: 0,
        };
      }

      const startBusinessDay = Math.min(...phasesInActivate.map(p => p.startBusinessDay || 0));
      const endBusinessDay = Math.max(...phasesInActivate.map(p => (p.startBusinessDay || 0) + (p.workingDays || 0)));
      const workingDays = endBusinessDay - startBusinessDay;
      const totalEffort = phasesInActivate.reduce((sum, p) => sum + (p.effort || 0), 0);
      const allResources = phasesInActivate.flatMap(p => p.resources || []);
      const teamSize = new Set(allResources.map(r => r.name)).size;

      const tasks = phasesInActivate.slice(0, 3).map((p) => ({
        id: p.id,
        name: p.name,
        workingDays: p.workingDays || 0,
        effort: p.effort || 0,
      }));

      while (tasks.length < 3) {
        tasks.push({
          id: `${activatePhase.id}-task-${tasks.length + 1}`,
          name: `Task ${tasks.length + 1}`,
          workingDays: Math.floor(workingDays / 3),
          effort: Math.floor(totalEffort / 3),
        });
      }

      return {
        ...activatePhase,
        phases: phasesInActivate,
        tasks: tasks.slice(0, 3),
        startBusinessDay,
        endBusinessDay,
        workingDays,
        totalEffort,
        teamSize,
      };
    });
  }, [rawPhases]);

  const { minDate, maxDate, totalBusinessDays, totalDuration } = useMemo(() => {
    const start = Math.min(...activatePhases.map(p => p.startBusinessDay));
    const end = Math.max(...activatePhases.map(p => p.endBusinessDay));

    const minD = addWorkingDays(PROJECT_BASE_DATE, start, selectedRegion);
    const maxD = addWorkingDays(PROJECT_BASE_DATE, end, selectedRegion);

    const totalDays = end - start;
    const months = Math.floor(totalDays / 20);
    const weeks = Math.floor(totalDays / 5);

    // Show in most appropriate unit
    let durationDisplay;
    if (totalDays < 10) {
      durationDisplay = `${totalDays} days`;
    } else if (totalDays < 60) {
      durationDisplay = `${weeks} weeks`;
    } else {
      durationDisplay = `${months} months`;
    }

    return {
      minDate: minD,
      maxDate: maxD,
      totalBusinessDays: totalDays,
      totalDuration: durationDisplay,
    };
  }, [activatePhases, selectedRegion]);

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

  if (activatePhases.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-lg text-gray-600 font-medium">Your timeline will appear here</p>
          <p className="text-sm text-gray-400 mt-2">Generate a timeline to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white h-full overflow-y-auto">
      {/* Minimal, elegant header - Jobs would approve */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Project Timeline</h2>
            <p className="text-xs text-gray-500 mt-1">
              {format(minDate, 'MMM dd, yyyy')} — {format(maxDate, 'MMM dd, yyyy')} · {totalDuration}
            </p>
          </div>

          {/* Visual timeline overview - at a glance */}
          <div className="flex items-center gap-2">
            {SAP_ACTIVATE_PHASES.map((phase, idx) => (
              <div key={phase.id} className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => togglePhase(phase.id)}>
                <div className={`w-10 h-1 rounded-full bg-gradient-to-r ${phase.color} transition-all group-hover:h-1.5`} />
                <span className="text-[9px] font-medium text-gray-400 group-hover:text-gray-700 transition-colors">{phase.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline - Pure, clean, focused */}
      <div className="px-6 py-4">
        <div className="space-y-4">
          {activatePhases.map((activatePhase, phaseIndex) => {
            const isExpanded = expandedPhases.has(activatePhase.id);
            const startPercent = ((activatePhase.startBusinessDay || 0) / totalBusinessDays) * 100;
            const widthPercent = ((activatePhase.workingDays || 0) / totalBusinessDays) * 100;

            return (
              <motion.div
                key={activatePhase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIndex * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group"
              >
                {/* Phase Card - Beautiful, tactile */}
                <div
                  className="relative cursor-pointer"
                  onClick={(e) => {
                    // If clicking on the bar itself, open panel. If clicking elsewhere, toggle expansion
                    const target = e.target as HTMLElement;
                    const isBarClick = target.closest('.timeline-bar');

                    if (isBarClick && onPhaseClick && activatePhase.phases[0]) {
                      onPhaseClick(activatePhase.phases[0]);
                    } else {
                      togglePhase(activatePhase.id);
                    }
                  }}
                >
                  {/* Phase name & metadata */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{activatePhase.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">{activatePhase.workingDays} days</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs text-gray-500">{activatePhase.totalEffort} hours</span>
                          {activatePhase.teamSize > 0 && (
                            <>
                              <span className="text-xs text-gray-400">·</span>
                              <span className="text-xs text-gray-500">{activatePhase.teamSize} people</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Dates - subtle but accessible */}
                    <div className="text-right text-xs text-gray-400">
                      <div>{format(addWorkingDays(PROJECT_BASE_DATE, activatePhase.startBusinessDay, selectedRegion), 'MMM dd')}</div>
                      <div className="text-[10px]">to</div>
                      <div>{format(addWorkingDays(PROJECT_BASE_DATE, activatePhase.endBusinessDay, selectedRegion), 'MMM dd')}</div>
                    </div>
                  </div>

                  {/* The Timeline Bar - Hero element, beautiful gradient */}
                  <div className="relative h-12 rounded-xl overflow-hidden timeline-bar">
                    {/* Background track */}
                    <div className="absolute inset-0 bg-gray-50" />

                    {/* Phase progress bar */}
                    <motion.div
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: phaseIndex * 0.1 + 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute inset-y-0 bg-gradient-to-r ${activatePhase.color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      {/* Glass effect overlay */}
                      <div className="absolute inset-0 bg-white/10" />

                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  </div>
                </div>

                {/* Expanded Tasks - Elegant reveal */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 ml-6 space-y-2">
                        {activatePhase.tasks.map((task, taskIndex) => {
                          const taskStartPercent = startPercent + (widthPercent * (activatePhase.tasks.slice(0, taskIndex).reduce((sum, t) => sum + t.workingDays, 0) / activatePhase.workingDays));
                          const taskWidthPercent = widthPercent * (task.workingDays / activatePhase.workingDays);

                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: taskIndex * 0.1, duration: 0.3 }}
                              className="group/task"
                            >
                              <div className="flex items-center gap-3 mb-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${activatePhase.color}`} />
                                <span className="text-sm text-gray-700">{task.name}</span>
                                <span className="text-xs text-gray-400">{task.workingDays}d</span>
                              </div>

                              {/* Subtle task bar - aligned within phase timeline only */}
                              <div className="relative h-2 rounded-full bg-gray-100 ml-4" style={{ width: `calc(100% - 1rem)` }}>
                                <motion.div
                                  initial={{ scaleX: 0, originX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  transition={{ delay: taskIndex * 0.1 + 0.2, duration: 0.5 }}
                                  className={`absolute inset-y-0 bg-gradient-to-r ${activatePhase.color} rounded-full opacity-40 group-hover/task:opacity-60 transition-opacity`}
                                  style={{
                                    left: `${(taskIndex === 0 ? 0 : activatePhase.tasks.slice(0, taskIndex).reduce((sum, t) => sum + t.workingDays, 0) / activatePhase.workingDays * 100)}%`,
                                    width: `${(task.workingDays / activatePhase.workingDays) * 100}%`,
                                  }}
                                />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Minimal footer - context when needed */}
      <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>SAP Activate Methodology</span>
          <span>Click any phase to expand details</span>
        </div>
      </div>
    </div>
  );
}
