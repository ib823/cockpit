/**
 * Empty State Component
 *
 * Beautiful empty state designs for different scenarios
 * Replaces generic "no data" messages with engaging, actionable designs
 */

"use client";

import { ReactNode } from "react";
import { Button } from "antd";
import {
  FileText,
  FolderOpen,
  Users,
  Calendar,
  CheckSquare,
  Package,
  AlertCircle,
  Search,
  PlusCircle,
  Inbox,
  Database,
  FileQuestion,
} from "lucide-react";
/** Apple HIG-aligned color scheme for empty states */
const HIG_COLORS = {
  blue: { main: "#007AFF", bg: "rgba(0, 122, 255, 0.06)", ring: "rgba(0, 122, 255, 0.12)", light: "rgba(0, 122, 255, 0.08)" },
  purple: { main: "#AF52DE", bg: "rgba(175, 82, 222, 0.06)", ring: "rgba(175, 82, 222, 0.12)", light: "rgba(175, 82, 222, 0.08)" },
  cyan: { main: "#5AC8FA", bg: "rgba(90, 200, 250, 0.06)", ring: "rgba(90, 200, 250, 0.12)" },
  green: { main: "#34C759", bg: "rgba(52, 199, 89, 0.06)", ring: "rgba(52, 199, 89, 0.12)" },
  red: { main: "#FF3B30", bg: "rgba(255, 59, 48, 0.06)", ring: "rgba(255, 59, 48, 0.12)" },
  orange: { main: "#FF9500", bg: "rgba(255, 149, 0, 0.06)", ring: "rgba(255, 149, 0, 0.12)" },
  gray: { main: "#8E8E93", bg: "#F2F2F7", ring: "#E5E5EA", light: "#AEAEB2" },
} as const;

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Icon mapping for different empty states
const ICON_MAP = {
  projects: FolderOpen,
  phases: Calendar,
  tasks: CheckSquare,
  resources: Users,
  files: FileText,
  search: Search,
  error: AlertCircle,
  generic: Inbox,
  data: Database,
  unknown: FileQuestion,
} as const;

export type EmptyStateType = keyof typeof ICON_MAP;

interface EmptyStateProps {
  type: EmptyStateType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  illustration?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  type,
  title,
  description,
  action,
  illustration,
  size = "md",
}: EmptyStateProps) {
  const Icon = ICON_MAP[type];

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "py-8",
      iconSize: "w-12 h-12",
      iconBg: "w-20 h-20",
      title: "text-lg",
      description: "text-sm",
      gap: "gap-3",
    },
    md: {
      container: "py-12",
      iconSize: "w-16 h-16",
      iconBg: "w-28 h-28",
      title: "text-xl",
      description: "text-base",
      gap: "gap-4",
    },
    lg: {
      container: "py-16",
      iconSize: "w-20 h-20",
      iconBg: "w-32 h-32",
      title: "text-2xl",
      description: "text-lg",
      gap: "gap-5",
    },
  };

  const config = sizeConfig[size];

  // Color scheme based on type (Apple HIG)
  const colorScheme = {
    projects: { bg: HIG_COLORS.blue.bg, icon: HIG_COLORS.blue.main, ring: HIG_COLORS.blue.ring },
    phases: { bg: HIG_COLORS.purple.bg, icon: HIG_COLORS.purple.main, ring: HIG_COLORS.purple.ring },
    tasks: { bg: HIG_COLORS.cyan.bg, icon: HIG_COLORS.cyan.main, ring: HIG_COLORS.cyan.ring },
    resources: { bg: HIG_COLORS.green.bg, icon: HIG_COLORS.green.main, ring: HIG_COLORS.green.ring },
    files: { bg: HIG_COLORS.gray.bg, icon: HIG_COLORS.gray.main, ring: HIG_COLORS.gray.ring },
    search: { bg: HIG_COLORS.blue.bg, icon: HIG_COLORS.blue.light!, ring: HIG_COLORS.blue.ring },
    error: { bg: HIG_COLORS.red.bg, icon: HIG_COLORS.red.main, ring: HIG_COLORS.red.ring },
    generic: { bg: HIG_COLORS.gray.bg, icon: HIG_COLORS.gray.light, ring: HIG_COLORS.gray.ring },
    data: { bg: HIG_COLORS.purple.bg, icon: HIG_COLORS.purple.light!, ring: HIG_COLORS.purple.ring },
    unknown: { bg: HIG_COLORS.orange.bg, icon: HIG_COLORS.orange.main, ring: HIG_COLORS.orange.ring },
  };

  const colors = colorScheme[type];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${config.container} px-6`}
    >
      {/* Icon or Illustration */}
      <div className="relative mb-6">
        {illustration ? (
          <div className="mb-4">{illustration}</div>
        ) : (
          <div
            className={`${config.iconBg} rounded-full flex items-center justify-center relative`}
            style={{
              backgroundColor: colors.bg,
              boxShadow: `0 0 0 12px ${colors.ring}`,
            }}
          >
            {/* Animated rings */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{
                backgroundColor: colors.icon,
                animationDuration: "3s",
              }}
            />

            <Icon className={config.iconSize} style={{ color: colors.icon }} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`max-w-md ${config.gap} flex flex-col items-center`}>
        <h3 className={`${config.title} font-semibold`} style={{ color: "#1D1D1F" }}>
          {title}
        </h3>

        {description && (
          <p className={`${config.description}`} style={{ color: "#636366" }}>
            {description}
          </p>
        )}

        {action && (
          <Button
            type="primary"
            size="large"
            icon={action.icon || <PlusCircle className="w-4 h-4" />}
            onClick={action.onClick}
            className="mt-4"
            style={{
              backgroundColor: colors.icon,
              borderColor: colors.icon,
              boxShadow: `0 4px 12px ${hexToRgba(colors.icon, 0.25)}`,
            }}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Preset Empty States for common scenarios
 */

export function NoProjectsEmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <EmptyState
      type="projects"
      title="No Projects Yet"
      description="Create your first project to start planning timelines, allocating resources, and generating proposals."
      action={{
        label: "Create Project",
        onClick: onCreateProject,
      }}
    />
  );
}

export function NoPhasesEmptyState({ onAddPhase }: { onAddPhase: () => void }) {
  return (
    <EmptyState
      type="phases"
      title="No Phases Defined"
      description="Break down your project into phases to organize work and track progress effectively."
      action={{
        label: "Add First Phase",
        onClick: onAddPhase,
        icon: <Calendar className="w-4 h-4" />,
      }}
      size="sm"
    />
  );
}

export function NoTasksEmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <EmptyState
      type="tasks"
      title="No Tasks Yet"
      description="Add tasks to this phase to define specific deliverables and assign resources."
      action={{
        label: "Add Task",
        onClick: onAddTask,
        icon: <CheckSquare className="w-4 h-4" />,
      }}
      size="sm"
    />
  );
}

export function NoResourcesEmptyState({ onAddResource }: { onAddResource: () => void }) {
  return (
    <EmptyState
      type="resources"
      title="No Team Members"
      description="Add resources to define your team structure, roles, and track capacity across projects."
      action={{
        label: "Add Resource",
        onClick: onAddResource,
        icon: <Users className="w-4 h-4" />,
      }}
    />
  );
}

export function NoSearchResultsEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      type="search"
      title="No Results Found"
      description={`No items match "${query}". Try adjusting your search terms or filters.`}
      size="sm"
    />
  );
}

export function ErrorEmptyState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      type="error"
      title="Something Went Wrong"
      description={message || "We encountered an error loading this content. Please try again."}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

/**
 * Loading State Placeholder (for empty state while loading)
 */
export function LoadingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
      <p className="text-gray-600">Loading...</p>
    </div>
  );
}
