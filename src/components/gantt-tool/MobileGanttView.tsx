/**
 * Mobile Gantt View - Timeline & Resource Allocation Tool
 *
 * NOT a checklist. This is a planning and scheduling tool.
 *
 * Design Principles:
 * - Jobs: "Show WHEN and WHO, not done/not done"
 * - Ive: "Timeline is the primary information hierarchy"
 * - Focus: Dates, duration, resources, deadlines
 * - NOT: Checkboxes, completion toggles, todo-list patterns
 *
 * Key Features:
 * - Timeline-first design (dates, duration)
 * - Resource allocation visibility
 * - Schedule planning and adjustments
 * - Progress tracking (visual, not interactive checkbox)
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Calendar, Users, Clock, Edit3 } from "lucide-react";
import type { GanttPhase, GanttTask, GanttProject } from "@/types/gantt-tool";
import { format, differenceInDays, isAfter, isBefore, isToday, addDays } from "date-fns";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";

interface MobileGanttViewProps {
  project: GanttProject;
  onTaskClick: (taskId: string, phaseId: string) => void;
  onPhaseClick: (phaseId: string) => void;
  onToggleComplete: (taskId: string, phaseId: string, isComplete: boolean) => void;
  onUpdateProgress: (taskId: string, phaseId: string, progress: number) => void;
  onAddTask: (phaseId: string) => void;
}

/**
 * Get timeline status color and label
 * Jobs: "Status should be glanceable"
 */
function getTimelineStatus(startDate: Date, endDate: Date) {
  const now = new Date();

  if (isAfter(now, endDate)) {
    return { color: '#FF3B30', label: 'Overdue', bg: 'rgba(255, 59, 48, 0.1)' };
  }

  if (isBefore(now, startDate)) {
    return { color: '#8E8E93', label: 'Upcoming', bg: 'rgba(142, 142, 147, 0.1)' };
  }

  // Check if due soon (within 3 days)
  const daysUntilEnd = differenceInDays(endDate, now);
  if (daysUntilEnd <= 3) {
    return { color: '#FF9500', label: 'Due Soon', bg: 'rgba(255, 149, 0, 0.1)' };
  }

  return { color: '#34C759', label: 'Active', bg: 'rgba(52, 199, 89, 0.1)' };
}

/**
 * Format duration for mobile display
 * Ive: "Clear, concise, human-readable"
 */
function formatDuration(days: number): string {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  const months = Math.round(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
}

export function MobileGanttView({
  project,
  onTaskClick,
  onPhaseClick,
  onToggleComplete,
  onUpdateProgress,
  onAddTask,
}: MobileGanttViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(project.phases.map(p => p.id)) // All expanded by default
  );

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Calculate project timeline - include ALL activities (phases + tasks), exclude AMS end dates
  const nonAmsPhases = project.phases.filter(p => p.phaseType !== "ams");

  // Start dates: all phase starts + all task starts
  const phaseStartDates = project.phases.map(p => new Date(p.startDate));
  const taskStartDates = project.phases.flatMap(p =>
    (p.tasks || []).map(t => new Date(t.startDate))
  );
  const allStartDates = [...phaseStartDates, ...taskStartDates];

  // End dates: non-AMS phase ends + all non-AMS task ends + AMS phase task ends
  const nonAmsPhaseEndDates = nonAmsPhases.map(p => new Date(p.endDate));
  const nonAmsTaskEndDates = nonAmsPhases.flatMap(p =>
    (p.tasks || []).map(t => new Date(t.endDate))
  );
  const amsPhaseTaskEndDates = project.phases
    .filter(p => p.phaseType === "ams")
    .flatMap(p => (p.tasks || []).map(t => new Date(t.endDate)));
  const allEndDates = [...nonAmsPhaseEndDates, ...nonAmsTaskEndDates, ...amsPhaseTaskEndDates];

  // Combine for timeline bounds
  const allDates = allEndDates.length > 0
    ? [...allStartDates, ...allEndDates]
    : allStartDates;

  const projectStart = allDates.length > 0
    ? new Date(Math.min(...allDates.map(d => d.getTime())))
    : new Date();
  const projectEnd = allDates.length > 0
    ? new Date(Math.max(...allDates.map(d => d.getTime())))
    : new Date();

  const projectDuration = differenceInDays(projectEnd, projectStart) + 1;
  const totalResources = project.resources?.length || 0;

  return (
    <div
      className="flex flex-col bg-[#F2F2F7]"
      style={{
        minHeight: '100%',
        height: 'auto',
      }}
    >
      {/* Header - Timeline Focus */}
      <div className="bg-white border-b border-black/[0.08] sticky top-0 z-20">
        <div className="px-4 py-3">
          <h1 className="text-[22px] font-bold text-black mb-3">
            {project.name}
          </h1>

          {/* Timeline Overview - Jobs: "Essential info, always visible" */}
          <div className="space-y-2">
            {/* Date Range */}
            <div className="flex items-center gap-2 text-[15px]">
              <Calendar className="w-4 h-4 text-[#007AFF]" />
              <span className="text-black font-medium">
                {format(projectStart, 'MMM d')} – {format(projectEnd, 'MMM d, yyyy')}
              </span>
            </div>

            {/* Duration & Resources */}
            <div className="flex items-center gap-4 text-[15px] text-[#8E8E93]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(projectDuration)}</span>
              </div>
              {totalResources > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{totalResources} {totalResources === 1 ? 'person' : 'people'}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span>{project.phases.length} {project.phases.length === 1 ? 'phase' : 'phases'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phases & Tasks - Timeline Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {project.phases.map((phase, phaseIndex) => {
            const isExpanded = expandedPhases.has(phase.id);
            const tasks = phase.tasks || [];

            const phaseStart = new Date(phase.startDate);
            const phaseEnd = new Date(phase.endDate);
            const phaseDays = differenceInDays(phaseEnd, phaseStart) + 1;
            const phaseStatus = phase.phaseType === "ams"
              ? { color: '#007AFF', label: 'Ongoing', bg: 'rgba(0, 122, 255, 0.1)' }
              : getTimelineStatus(phaseStart, phaseEnd);

            // Count resources
            const phaseResourceCount = phase.phaseResourceAssignments?.length || 0;
            const taskResourceCount = tasks.reduce((sum, task) =>
              sum + (task.resourceAssignments?.length || 0), 0
            );
            const totalPhaseResources = Math.max(phaseResourceCount, taskResourceCount);

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: phaseIndex * 0.05 }}
                className="bg-white rounded-xl shadow-sm overflow-hidden"
              >
                {/* Phase Header - Timeline Info */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full px-4 py-4 flex items-start gap-3 active:bg-black/5"
                >
                  <div className="mt-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-[#8E8E93]" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-[#8E8E93]" />
                    )}
                  </div>

                  <div className="flex-1 text-left space-y-2.5">
                    {/* Phase Name */}
                    <div className="flex items-center gap-2">
                      <h2 className="text-[20px] font-semibold text-black">
                        {phase.name}
                      </h2>
                      {phase.phaseType === "ams" && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: "600",
                            backgroundColor: "#FF6B35",
                            color: "#fff",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                          aria-label="Application Management Services"
                        >
                          AMS
                        </span>
                      )}
                    </div>

                    {/* Timeline Status Badge */}
                    <div
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-medium"
                      style={{
                        color: phaseStatus.color,
                        backgroundColor: phaseStatus.bg,
                      }}
                    >
                      {phaseStatus.label}
                    </div>

                    {/* Phase Timeline */}
                    <div className="flex items-center gap-2 text-[15px] text-black">
                      <Calendar className="w-4 h-4 text-[#007AFF]" />
                      {phase.phaseType === "ams" ? (
                        <span className="font-medium">
                          AMS starts {format(phaseStart, 'dd-MMM-yy (EEE)')}
                        </span>
                      ) : (
                        <>
                          <span className="font-medium">
                            {format(phaseStart, 'MMM d')} – {format(phaseEnd, 'MMM d')}
                          </span>
                          <span className="text-[#8E8E93]">
                            • {formatDuration(phaseDays)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Resources & Tasks Count */}
                    <div className="flex items-center gap-3 text-[13px] text-[#8E8E93]">
                      {totalPhaseResources > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          <span>{totalPhaseResources} assigned</span>
                        </div>
                      )}
                      <span>{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded Tasks - Timeline Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-black/[0.06]"
                    >
                      <div className="p-2 space-y-2">
                        {tasks.map((task, taskIndex) => {
                          const taskStart = new Date(task.startDate);
                          const taskEnd = new Date(task.endDate);
                          const taskDays = differenceInDays(taskEnd, taskStart) + 1;
                          const taskStatus = getTimelineStatus(taskStart, taskEnd);
                          const taskResources = task.resourceAssignments?.length || 0;
                          const progress = task.progress || 0;

                          return (
                            <motion.button
                              key={task.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: taskIndex * 0.03 }}
                              onClick={() => onTaskClick(task.id, phase.id)}
                              className="w-full bg-[#F9F9F9] rounded-lg overflow-hidden active:opacity-70 transition-opacity"
                            >
                              <div className="px-4 py-3 space-y-2.5">
                                {/* Task Name & Edit Icon */}
                                <div className="flex items-start justify-between gap-3">
                                  <h3 className="text-[17px] font-semibold text-black text-left flex-1">
                                    {task.name}
                                  </h3>
                                  <Edit3 className="w-4 h-4 text-[#007AFF] flex-shrink-0 mt-0.5" />
                                </div>

                                {/* Timeline Status Badge */}
                                <div
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium"
                                  style={{
                                    color: taskStatus.color,
                                    backgroundColor: taskStatus.bg,
                                  }}
                                >
                                  {taskStatus.label}
                                </div>

                                {/* Task Timeline */}
                                <div className="flex items-center gap-2 text-[15px]">
                                  <Calendar className="w-4 h-4 text-[#007AFF]" />
                                  <span className="text-black font-medium">
                                    {format(taskStart, 'MMM d')} – {format(taskEnd, 'MMM d')}
                                  </span>
                                </div>

                                {/* Duration & Resources */}
                                <div className="flex items-center gap-3 text-[13px] text-[#8E8E93]">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatDuration(taskDays)}</span>
                                  </div>
                                  {taskResources > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3.5 h-3.5" />
                                      <span>{taskResources} assigned</span>
                                    </div>
                                  )}
                                </div>

                                {/* Progress Bar - Visual Only (Not Interactive) */}
                                {progress > 0 && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-[12px]">
                                      <span className="text-[#8E8E93]">Progress</span>
                                      <span className="font-semibold text-black">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#E5E5EA] rounded-full overflow-hidden">
                                      <div
                                        style={{ width: `${progress}%` }}
                                        className="h-full bg-[#34C759] rounded-full transition-all duration-300"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.button>
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
    </div>
  );
}
