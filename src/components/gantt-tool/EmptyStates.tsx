/**
 * Empty States for Gantt Tool
 *
 * User-friendly placeholders when no data is available
 * Following best practices: explanation + clear action
 */

"use client";

import { Plus, Search, Calendar, Filter, Inbox, Users, Upload, FileText } from "lucide-react";
import { Button } from "antd";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  Icon?: React.ComponentType<{ className?: string }>;
}

function BaseEmptyState({ title, description, action, Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>

      {/* Action */}
      {action && (
        <Button
          type="primary"
          size="large"
          icon={action.icon}
          onClick={action.onClick}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

/**
 * No Phases State
 * Shown when project has no phases
 */
export function NoPhases({ onAddPhase }: { onAddPhase: () => void }) {
  return (
    <BaseEmptyState
      Icon={Calendar}
      title="No phases yet"
      description="Get started by adding your first project phase. Phases help you organize your timeline into logical sections."
      action={{
        label: "Add First Phase",
        onClick: onAddPhase,
        icon: <Plus className="w-4 h-4" />,
      }}
    />
  );
}

/**
 * No Tasks State
 * Shown when a phase has no tasks
 */
export function NoTasks({ onAddTask, phaseName }: { onAddTask: () => void; phaseName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <Calendar className="w-12 h-12 text-gray-400 mb-3" />
      <h4 className="text-sm font-semibold text-gray-700 mb-2">No tasks in "{phaseName}"</h4>
      <p className="text-xs text-gray-600 max-w-sm mb-4">
        Add tasks to break down this phase into actionable work items.
      </p>
      <Button size="small" icon={<Plus className="w-3 h-3" />} onClick={onAddTask}>
        Add Task
      </Button>
    </div>
  );
}

/**
 * No Filtered Results State
 * Shown when filters return no results
 */
export function NoFilteredResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <BaseEmptyState
      Icon={Filter}
      title="No results found"
      description="No phases or tasks match your current filter settings. Try clearing some filters to see more results."
      action={{
        label: "Clear All Filters",
        onClick: onClearFilters,
        icon: <Search className="w-4 h-4" />,
      }}
    />
  );
}

/**
 * No Projects State
 * Shown in project selector when no projects exist
 */
export function NoProjects({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <BaseEmptyState
      Icon={Plus}
      title="No projects yet"
      description="Create your first project to start planning your timeline with phases, tasks, and milestones."
      action={{
        label: "Create Project",
        onClick: onCreateProject,
        icon: <Plus className="w-4 h-4" />,
      }}
    />
  );
}

/**
 * No Search Results State
 * Shown when search query returns no results
 */
export function NoSearchResults({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  return (
    <BaseEmptyState
      Icon={Search}
      title={`No results for "${query}"`}
      description="We couldn't find any phases, tasks, or milestones matching your search. Try a different search term."
      action={{
        label: "Clear Search",
        onClick: onClearSearch,
        icon: <Search className="w-4 h-4" />,
      }}
    />
  );
}

/**
 * No Date Range Data State
 * Shown when current viewport has no data
 */
export function NoDateRangeData({ onResetView }: { onResetView: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-blue-50 flex items-center justify-center">
        <Calendar className="w-8 h-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No data in this date range</h3>
      <p className="text-sm text-gray-600 max-w-md mb-6">
        The current timeline view doesn't contain any phases or tasks. Try zooming out or adjusting
        the date range to see your project timeline.
      </p>
      <Button
        type="primary"
        size="large"
        icon={<Search className="w-4 h-4" />}
        onClick={onResetView}
      >
        Reset to Full Timeline
      </Button>
    </div>
  );
}

/**
 * No Milestones State
 * Shown when project has no milestones
 */
export function NoMilestones({ onAddMilestone }: { onAddMilestone?: () => void }) {
  return (
    <div className="py-6 px-4 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm">
        <Inbox className="w-4 h-4" />
        <span>No milestones defined</span>
        {onAddMilestone && (
          <>
            <span className="text-purple-300">•</span>
            <button
              onClick={onAddMilestone}
              className="underline hover:text-purple-900 transition-colors"
            >
              Add milestone
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * No Resources State
 * Shown when no resources are assigned
 */
export function NoResources({ onAssignResources }: { onAssignResources?: () => void }) {
  return (
    <div className="py-4 px-4 text-center">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm">
        <Inbox className="w-4 h-4" />
        <span>No resources assigned</span>
        {onAssignResources && (
          <>
            <span className="text-amber-300">•</span>
            <button
              onClick={onAssignResources}
              className="underline hover:text-amber-900 transition-colors"
            >
              Assign resources
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * No Team Members State - For Organization Chart
 * Enhanced with specific guidance
 */
export function NoTeamMembers({ onAddTeamMember }: { onAddTeamMember: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200">
      {/* Icon */}
      <div className="w-16 h-16 mb-4 rounded-full bg-white flex items-center justify-center shadow-md">
        <Users className="w-8 h-8 text-blue-500" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Build Your Team Structure</h3>

      {/* Description */}
      <p className="text-sm text-gray-700 max-w-md mb-4">
        Start by adding your project leadership team to establish the organizational hierarchy.
      </p>

      {/* Suggested Roles */}
      <div className="bg-white rounded-lg p-4 mb-6 text-left max-w-md shadow-sm border border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
          Suggested First Steps:
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></span>
            <span>
              Add <strong>Executive Sponsor</strong> or <strong>Delivery Lead</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0"></span>
            <span>
              Add <strong>Project Manager</strong>
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
            <span>
              Add your <strong>team members</strong>
            </span>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button
          type="primary"
          size="large"
          icon={<Plus className="w-4 h-4" />}
          onClick={onAddTeamMember}
          className="shadow-md hover:shadow-lg transition-all"
        >
          Add Team Member
        </Button>
        <Button
          size="large"
          icon={<Upload className="w-4 h-4" />}
          onClick={onAddTeamMember}
          className="shadow-sm hover:shadow-md transition-all"
        >
          Import from CSV
        </Button>
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-6 max-w-md">
        Or load from existing template to get started quickly
      </p>
    </div>
  );
}

/**
 * No Level Resources State - For Empty Organization Levels
 * Used when a specific level has no team members
 */
export function NoLevelResources({
  levelName,
  levelDescription,
  onAddResources,
}: {
  levelName: string;
  levelDescription: string;
  onAddResources?: () => void;
}) {
  return (
    <div className="py-8 px-4 text-center">
      <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-lg bg-gray-50 border border-gray-200">
        <Users className="w-8 h-8 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">No {levelName} resources yet</p>
          <p className="text-xs text-gray-500">{levelDescription}</p>
        </div>
        {onAddResources && (
          <Button
            size="small"
            icon={<Plus className="w-3 h-3" />}
            onClick={onAddResources}
            className="mt-2"
          >
            Add {levelName} Resource
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Generic Empty State
 * For custom use cases
 */
export function GenericEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <BaseEmptyState
      Icon={Icon}
      title={title}
      description={description}
      action={
        actionLabel && onAction
          ? {
              label: actionLabel,
              onClick: onAction,
            }
          : undefined
      }
    />
  );
}
