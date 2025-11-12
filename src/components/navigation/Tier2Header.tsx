/**
 * Tier 2 Header - Tool-specific navigation
 * Standardized header for Timeline and Architecture tools
 * Apple HIG-compliant with design system tokens
 */

import { format } from "date-fns";
import type { GanttProject } from "@prisma/client";
import { UnifiedProjectSelector } from "@/components/gantt-tool/UnifiedProjectSelector";
import { ProjectMetrics } from "@/components/gantt-tool/ProjectMetrics";
import styles from "./Tier2Header.module.css";

interface Tier2HeaderProps {
  currentProject: GanttProject;
  projects: GanttProject[];
  onSelectProject: (projectId: string) => Promise<void>;
  onCreateProject: () => void;
  onUpdateProjectName: (name: string) => Promise<void>;
  onDeleteProject?: (projectId: string) => Promise<void>;
  isLoading: boolean;
  version?: string;
  rightContent?: React.ReactNode;
}

export function Tier2Header({
  currentProject,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProjectName,
  onDeleteProject,
  isLoading,
  version = "v1.0",
  rightContent,
}: Tier2HeaderProps) {
  return (
    <div className={styles.header}>
      {/* Left: Project Info + Metadata */}
      <div className={styles.headerLeft}>
        {/* Project Selector */}
        <UnifiedProjectSelector
          currentProject={currentProject}
          projects={projects}
          onSelectProject={onSelectProject}
          onCreateProject={onCreateProject}
          onUpdateProjectName={onUpdateProjectName}
          onDeleteProject={onDeleteProject}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className={styles.metadataDivider} />

        {/* Version & Last Save */}
        <div className={styles.metadata}>
          <span>{version}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>Saved {format(new Date(currentProject.updatedAt), "dd-MMM-yy HH:mm")}</span>
        </div>

        {/* Divider */}
        <div className={styles.metadataDivider} />

        {/* Project Summary */}
        <div className={styles.metadata}>
          <ProjectMetrics project={currentProject} />
        </div>
      </div>

      {/* Right: Tool-specific controls */}
      <div className={styles.headerRight}>
        {rightContent}
      </div>
    </div>
  );
}
