/**
 * Tier 2 Header - Tool-specific navigation
 * Standardized header for Timeline and Architecture tools
 * Apple HIG-compliant with design system tokens
 */

import { format } from "date-fns";
import type { GanttProject } from "@/types/gantt-tool";
import { UnifiedProjectSelector } from "@/components/gantt-tool/UnifiedProjectSelector";
import { ProjectMetrics } from "@/components/gantt-tool/ProjectMetrics";
import styles from "./Tier2Header.module.css";

// Base project interface that both GanttProject and ArchitectureProject satisfy
interface BaseProject {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface Tier2HeaderProps<T extends BaseProject = GanttProject> {
  currentProject: T;
  projects: T[];
  onSelectProject: (projectId: string) => Promise<void>;
  onCreateProject: () => void;
  onUpdateProjectName: (name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  onSelectLogo?: (companyName: string) => Promise<void>;
  isLoading: boolean;
  version?: string;
  rightContent?: React.ReactNode;
  lastSyncAt?: Date | null;
  syncStatus?: "idle" | "saving-local" | "saved-local" | "syncing-cloud" | "synced-cloud" | "error";
  showMetrics?: boolean; // Optional - only show for Gantt projects
}

export function Tier2Header<T extends BaseProject = GanttProject>({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProjectName,
  onDeleteProject,
  onSelectLogo,
  isLoading,
  version = "v1.0",
  rightContent,
  lastSyncAt,
  syncStatus = "idle",
  showMetrics = false,
}: Tier2HeaderProps<T>) {
  // Calculate time since last save
  const getTimeSinceLastSave = () => {
    const saveTime = lastSyncAt || new Date(currentProject.updatedAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - saveTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getSaveStatusText = () => {
    switch (syncStatus) {
      case "saving-local":
      case "syncing-cloud":
        return "Saving...";
      case "saved-local":
        return `Saved ${getTimeSinceLastSave()}`;
      case "synced-cloud":
        return `Saved ${getTimeSinceLastSave()}`;
      case "error":
        return "Save failed";
      default:
        return `Saved ${getTimeSinceLastSave()}`;
    }
  };

  const getSaveStatusColor = () => {
    switch (syncStatus) {
      case "saving-local":
      case "syncing-cloud":
        return "#007AFF"; // Blue - in progress
      case "error":
        return "#FF3B30"; // Red - error
      default:
        return "#86868b"; // Gray - saved
    }
  };
  return (
    <div className={styles.header}>
      {/* Left: Project Info + Metadata */}
      <div className={styles.headerLeft}>
        {/* Project Selector */}
        <UnifiedProjectSelector
          currentProject={currentProject as unknown as GanttProject}
          projects={projects as unknown as GanttProject[]}
          onSelectProject={onSelectProject}
          onCreateProject={onCreateProject}
          onUpdateProjectName={onUpdateProjectName}
          onDeleteProject={onDeleteProject}
          onSelectLogo={onSelectLogo}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className={styles.metadataDivider} />

        {/* Version & Last Save */}
        <div className={styles.metadata}>
          <span>{version}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span
            style={{
              color: getSaveStatusColor(),
              fontWeight: syncStatus === "saving-local" || syncStatus === "syncing-cloud" ? 600 : 400,
              transition: "color 0.2s ease"
            }}
            title={lastSyncAt ? `Last saved: ${format(lastSyncAt, "dd-MMM-yy HH:mm:ss")}` : undefined}
          >
            {getSaveStatusText()}
          </span>
        </div>

        {/* Project Summary - Only for Gantt projects */}
        {showMetrics && 'phases' in currentProject && (
          <>
            <div className={styles.metadataDivider} />
            <div className={styles.metadata}>
              <ProjectMetrics project={currentProject as unknown as GanttProject} />
            </div>
          </>
        )}
      </div>

      {/* Right: Tool-specific controls */}
      <div className={styles.headerRight}>
        {rightContent}
      </div>
    </div>
  );
}
