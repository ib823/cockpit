/**
 * Gantt Mobile List View
 *
 * Simplified list view for Gantt charts on mobile devices (< 768px)
 * Replaces horizontal timeline with vertical task/phase list
 * Features: Task hierarchy, progress indicators, date ranges, touch-friendly
 */

"use client";

import { useState } from "react";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import {
  ChevronDown,
  ChevronRight,
  Flag,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { GanttPhase, GanttTask } from "@/types/gantt-tool";
import { formatGanttDate, formatDuration } from "@/lib/gantt-tool/date-utils";
import { Progress, Tag, Badge } from "antd";
import { calculateWorkingDaysInclusive } from "@/lib/gantt-tool/working-days";
import { GANTT_STATUS_COLORS, GANTT_STATUS_LABELS, type GanttStatus } from "@/lib/design-system";
import { differenceInDays } from "date-fns";

/**
 * Calculate status based on dates and progress
 */
const calculateItemStatus = (
  startDate: string,
  endDate: string,
  progress: number = 0
): GanttStatus => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "notStarted";
  if (progress === 100) return "completed";
  if (now > end && progress < 100) return "blocked";

  const totalDays = differenceInDays(end, start);
  const elapsedDays = differenceInDays(now, start);
  const expectedProgress = (elapsedDays / totalDays) * 100;

  if (progress < expectedProgress - 20) return "atRisk";
  return "inProgress";
};

/**
 * Phase Card Component
 */
function PhaseCard({ phase }: { phase: GanttPhase }) {
  const [expanded, setExpanded] = useState(true);
  const currentProject = useGanttToolStore((state) => state.currentProject);

  const workingDays = calculateWorkingDaysInclusive(
    new Date(phase.startDate),
    new Date(phase.endDate),
    currentProject?.holidays || []
  );

  const completedTasks = phase.tasks.filter((t) => t.progress === 100).length;
  const totalTasks = phase.tasks.length;
  const phaseProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const status = calculateItemStatus(phase.startDate, phase.endDate, phaseProgress);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3">
      {/* Phase Header */}
      <div
        role="button"
        tabIndex={0}
        className="p-4 cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded(!expanded); }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
              {expanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-base truncate">{phase.name}</h3>
            </div>
          </div>
          <Tag color={GANTT_STATUS_COLORS[status]} className="flex-shrink-0 ml-2">
            {GANTT_STATUS_LABELS[status]}
          </Tag>
        </div>

        {/* Phase Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatGanttDate(phase.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatDuration(workingDays)}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {completedTasks} of {totalTasks} tasks
            </span>
            <span>{Math.round(phaseProgress)}%</span>
          </div>
          <Progress
            percent={phaseProgress}
            size="small"
            status={
              status === "blocked" ? "exception" : status === "completed" ? "success" : "active"
            }
            showInfo={false}
          />
        </div>
      </div>

      {/* Tasks List */}
      {expanded && phase.tasks.length > 0 && (
        <div className="border-t border-gray-100">
          {phase.tasks
            .sort((a, b) => a.order - b.order)
            .map((task) => (
              <TaskItem key={task.id} task={task} phaseColor={phase.color} />
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * Task Item Component
 */
function TaskItem({ task, phaseColor }: { task: GanttTask; phaseColor: string }) {
  const currentProject = useGanttToolStore((state) => state.currentProject);

  const workingDays = calculateWorkingDaysInclusive(
    new Date(task.startDate),
    new Date(task.endDate),
    currentProject?.holidays || []
  );

  const status = calculateItemStatus(task.startDate, task.endDate, task.progress);
  const hasResources = task.resourceAssignments && task.resourceAssignments.length > 0;
  const resourceCount = task.resourceAssignments?.length || 0;

  // Indentation for hierarchy
  const indentClass = task.level > 0 ? `ml-${task.level * 4}` : "";

  return (
    <div
      className={`p-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors ${indentClass}`}
      style={{
        borderLeft: task.level === 0 ? `3px solid ${phaseColor}` : undefined,
        paddingLeft: task.level > 0 ? `${task.level * 16 + 12}px` : undefined,
      }}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm truncate">{task.name}</h4>
            {status === "atRisk" && (
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatGanttDate(task.startDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(workingDays)}
            </span>
            {hasResources && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {resourceCount}
              </span>
            )}
          </div>
        </div>
        <Tag color={GANTT_STATUS_COLORS[status]} className="flex-shrink-0 ml-2 text-xs">
          {task.progress}%
        </Tag>
      </div>

      {/* Progress Bar */}
      <Progress
        percent={task.progress}
        size="small"
        status={status === "blocked" ? "exception" : status === "completed" ? "success" : "active"}
        showInfo={false}
        strokeColor={status === "atRisk" ? "#f59e0b" : undefined}
      />

      {/* Description if present */}
      {task.description && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{task.description}</p>
      )}
    </div>
  );
}

/**
 * Milestones Section
 */
function MilestonesSection() {
  const currentProject = useGanttToolStore((state) => state.currentProject);

  if (!currentProject?.milestones || currentProject.milestones.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-3 p-4">
      <h3 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
        <Flag className="w-5 h-5 text-purple-600" />
        Milestones
      </h3>
      <div className="space-y-2">
        {currentProject.milestones
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Flag className="w-4 h-4 flex-shrink-0" style={{ color: milestone.color }} />
                <span className="text-sm font-medium text-gray-900 truncate">{milestone.name}</span>
              </div>
              <span className="text-xs text-gray-600 flex-shrink-0 ml-2">
                {formatGanttDate(milestone.date)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Main Mobile List View Component
 */
export function GanttMobileListView() {
  const currentProject = useGanttToolStore((state) => state.currentProject);

  if (!currentProject) {
    return (
      <div data-testid="gantt-mobile-list" className="flex items-center justify-center min-h-[400px] text-gray-400">
        <div className="text-center">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No project loaded</p>
        </div>
      </div>
    );
  }

  const sortedPhases = [...currentProject.phases].sort((a, b) => a.order - b.order);

  return (
    <div data-testid="gantt-mobile-list" className="p-4 bg-gray-50 min-h-screen">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{currentProject.name}</h2>
        {currentProject.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{currentProject.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatGanttDate(currentProject.startDate)}
          </span>
          <Badge count={sortedPhases.length} showZero color="blue" />
          <span>phases</span>
        </div>
      </div>

      {/* Milestones */}
      <MilestonesSection />

      {/* Phases & Tasks */}
      {sortedPhases.length > 0 ? (
        sortedPhases.map((phase) => <PhaseCard key={phase.id} phase={phase} />)
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">No phases added yet</p>
        </div>
      )}
    </div>
  );
}
