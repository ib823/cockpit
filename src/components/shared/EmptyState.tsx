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
import { colorValues, getElevationShadow, withOpacity } from "@/lib/design-system";

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

  // Color scheme based on type
  const colorScheme = {
    projects: {
      bg: colorValues.primary[50],
      icon: colorValues.primary[500],
      ring: colorValues.primary[100],
    },
    phases: {
      bg: colorValues.accent[50],
      icon: colorValues.accent[500],
      ring: colorValues.accent[100],
    },
    tasks: { bg: colorValues.info[50], icon: colorValues.info[500], ring: colorValues.info[100] },
    resources: {
      bg: colorValues.success[50],
      icon: colorValues.success[500],
      ring: colorValues.success[100],
    },
    files: { bg: colorValues.gray[100], icon: colorValues.gray[500], ring: colorValues.gray[200] },
    search: {
      bg: colorValues.primary[50],
      icon: colorValues.primary[400],
      ring: colorValues.primary[100],
    },
    error: {
      bg: colorValues.error[50],
      icon: colorValues.error[500],
      ring: colorValues.error[100],
    },
    generic: {
      bg: colorValues.gray[100],
      icon: colorValues.gray[400],
      ring: colorValues.gray[200],
    },
    data: {
      bg: colorValues.accent[50],
      icon: colorValues.accent[400],
      ring: colorValues.accent[100],
    },
    unknown: {
      bg: colorValues.warning[50],
      icon: colorValues.warning[500],
      ring: colorValues.warning[100],
    },
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
        <h3 className={`${config.title} font-semibold`} style={{ color: colorValues.gray[900] }}>
          {title}
        </h3>

        {description && (
          <p className={`${config.description}`} style={{ color: colorValues.gray[600] }}>
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
              boxShadow: `0 4px 12px ${withOpacity(colors.icon, 0.25)}`,
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
