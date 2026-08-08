/**
 * Architecture V3 - Complete Implementation
 * All visual styles, all options, user chooses what to export
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";
import { Users, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { AppShell } from "@/components/ds/AppShell";
import { Button } from "@/components/ds/Button";
import { Tabs } from "@/components/ds/Tabs";
import { UserMenu } from "@/components/navigation/UserMenu";
import { globalNav, toSyncChip } from "@/components/navigation/global-nav";
import { ProjectSwitcher } from "@/components/gantt-tool/ProjectSwitcher";
import { NewProjectModal } from "@/components/gantt-tool/NewProjectModal";
import { OrgChartBuilder } from "@/components/gantt-tool/OrgChartBuilder";
import { BeaconLoader } from "@/components/ds/BeaconLoader";
import type {
  DiagramSettings,
  DiagramType,
  ExportOptions,
} from "./types";
import { BusinessContextTab } from "./components/BusinessContextTab";
import { CurrentLandscapeTab } from "./components/CurrentLandscapeTab";
import { ProposedSolutionTab } from "./components/ProposedSolutionTab";
import { DiagramGenerator } from "./components/DiagramGenerator";
import { StyleSelector } from "./components/StyleSelector";
import styles from "./styles.module.css";

type Tab = "business-context" | "current-landscape" | "proposed-solution";

// The three views of this screen; ds Tabs provides the tablist semantics and
// the arrow-key/Home/End keyboard navigation.
const TABS = [
  { id: "business-context" as const, label: "Business Context" },
  { id: "current-landscape" as const, label: "Current Business Landscape" },
  { id: "proposed-solution" as const, label: "Proposed Solution" },
];

export default function ArchitectureV3Page() {
  // Session for the top bar's account cluster
  const { data: session } = useSession();

  // Gantt Tool Store Integration (shared with Timeline)
  const {
    currentProject,
    projects,
    fetchProjects,
    loadProject,
    createProject,
    updateProjectName,
    deleteProject,
    unloadCurrentProject,
    isLoading,
    lastSyncAt,
    syncStatus,
    // Architecture methods (Unified Project Model)
    updateBusinessContext,
    updateCurrentLandscape,
    updateProposedSolution,
    updateDiagramSettings,
  } = useGanttToolStore();

  const [initializing, setInitializing] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("business-context");
  const [_version, _setVersion] = useState("v1.0");
  const [isGenerated, setIsGenerated] = useState(false);
  const [currentDiagramType, setCurrentDiagramType] = useState<DiagramType>("business-context");
  const [showStyleSelector, setShowStyleSelector] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgChartWidth, setOrgChartWidth] = useState(400);
  const [isResizingOrgChart, setIsResizingOrgChart] = useState(false);

  // Data states - use store data or defaults
  const businessContext = currentProject?.businessContext || {
    entities: [],
    actors: [],
    capabilities: [],
    painPoints: "",
  };

  const currentLandscape = currentProject?.currentLandscape || {
    systems: [],
    integrations: [],
    externalSystems: [],
  };

  const proposedSolution = currentProject?.proposedSolution || {
    phases: [],
    systems: [],
    integrations: [],
    retainedExternalSystems: [],
  };

  const diagramSettings = currentProject?.diagramSettings || {
    visualStyle: "bold",
    actorDisplay: "cards",
    layoutMode: "swim-lanes",
    showLegend: true,
    showIcons: true,
  };

  // Handle org chart resize
  const handleOrgChartResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingOrgChart(true);
  }, []);

  useEffect(() => {
    if (!isResizingOrgChart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const viewportWidth = window.innerWidth;
      const newWidth = viewportWidth - e.clientX;
      const clampedWidth = Math.max(300, Math.min(600, newWidth));
      setOrgChartWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizingOrgChart(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingOrgChart]);

  // Initialize projects on mount
  // Use ref so the effect doesn't re-run when currentProject changes
  const initialProjectRef = useRef(currentProject);

  useEffect(() => {
    // If project already loaded, we're good
    if (initialProjectRef.current) {
      setInitializing(false);
      return;
    }

    // Otherwise, initialize
    const initialize = async () => {
      try {
        // Fetch projects from database
        await fetchProjects();

        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get current state after fetch
        const state = useGanttToolStore.getState();

        // If STILL no project is loaded, auto-load or create one
        if (!state.currentProject) {
          if (state.projects.length > 0) {
            // Load most recent project
            const sortedProjects = [...state.projects].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            await loadProject(sortedProjects[0].id);
          } else {
            // Create default project
            const today = format(new Date(), "yyyy-MM-dd");
            const projectName = `Project ${format(new Date(), "yyyy-MM-dd HH:mm")}`;
            await createProject(projectName, today);
          }
        }
      } catch (error) {
        logger.error("[Architecture V3] Failed to initialize:", { error });
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [fetchProjects, loadProject, createProject]); // Store actions are stable references

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    // Reset diagram view when switching tabs
    setIsGenerated(false);
  };

  const handleGenerate = () => {
    setShowStyleSelector(true);
  };

  const handleGenerateWithStyle = (settings: DiagramSettings) => {
    updateDiagramSettings(settings);
    setShowStyleSelector(false);

    // Map activeTab to DiagramType
    let diagramType: DiagramType = "business-context";
    if (activeTab === "current-landscape") {
      diagramType = "as-is";
    } else if (activeTab === "proposed-solution") {
      diagramType = "to-be";
    }

    setCurrentDiagramType(diagramType);
    setIsGenerated(true);
  };

  const handleExport = async (options: ExportOptions) => {
    // Export the currently-rendered diagram via the real element-capture exporters.
    // The active diagram container carries id="architecture-diagram-capture".
    const elementId = "architecture-diagram-capture";
    const exportName = currentProject?.name
      ? `${currentProject.name}-architecture`
      : options.filename.replace(/\.[^.]+$/, "");
    try {
      const { exportOrgChartToPDF, exportOrgChartToPNG, exportOrgChartToPPT } = await import(
        "@/lib/gantt-tool/export-utils"
      );
      if (options.format === "png") {
        await exportOrgChartToPNG(exportName, elementId);
      } else if (options.format === "ppt") {
        await exportOrgChartToPPT(exportName, elementId);
      } else {
        await exportOrgChartToPDF(exportName, elementId);
      }
    } catch (error) {
      logger.error("[Architecture V3] Export failed:", { error });
    }
  };

  const handleUpdateProjectName = async (newName: string) => {
    if (currentProject) {
      await updateProjectName(newName);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
    // If the deleted project was the current one, unload it
    if (currentProject?.id === projectId) {
      unloadCurrentProject();
    }
  };

  const handleCreateProject = async (name: string, startDate: string, _companyLogos?: Record<string, string>) => {
    await createProject(name, `Started on ${startDate}`);
    // Note: companyLogos and startDate are not currently used in the architecture store
    // They may be added in a future enhancement
  };

  // Determine if we should show loading state
  const showLoading = initializing || isLoading || !currentProject;

  return showLoading ? (
    <div className={styles.loadingContainer}>
      <BeaconLoader label="Loading architecture…" size={64} />
    </div>
  ) : (
    <AppShell
      fullBleed
      primaryNav={globalNav("/architecture/v3")}
      sync={toSyncChip(syncStatus)}
      topBarEnd={<UserMenu session={session} />}
      projectSlot={
        <ProjectSwitcher
          currentProject={currentProject}
          projects={projects}
          onSelectProject={loadProject}
          onCreateProject={() => setIsNewProjectModalOpen(true)}
          onUpdateProjectName={handleUpdateProjectName}
          onDeleteProject={handleDeleteProject}
          isLoading={isLoading}
        />
      }
    >
      <div className={styles.container}>
        {/* Tool actions: labelled ds buttons, no icon strip. */}
        <div className="ds" style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-2)", padding: "var(--ds-space-2) var(--ds-space-4)", borderBottom: "var(--ds-border-hairline) solid var(--ds-border-default)", background: "var(--ds-surface-raised)" }}>
          <span style={{ flex: "1 1 auto" }} />
          <Button
            size="sm"
            variant="ghost"
            icon={<Users size={14} aria-hidden="true" />}
            aria-pressed={showOrgChart}
            onClick={() => setShowOrgChart(!showOrgChart)}
            title="Team structure"
          >
            Team
          </Button>
        </div>

        {/* Main Layout with optional sidebar */}
        <div className={styles.workspace}>
          {/* Main Content Area: ds Tabs own the tablist semantics and keyboard
              navigation (arrow keys, Home/End). */}
          <div className={styles.mainColumn}>
            <Tabs
              tabs={TABS}
              activeId={activeTab}
              onChange={(id) => handleTabChange(id as Tab)}
              label="Architecture sections"
              className={styles.tabs}
            >
              <div className={styles.tabContent}>
                {isGenerated ? (
                  <DiagramGenerator
                    diagramType={currentDiagramType}
                    businessContext={businessContext}
                    currentLandscape={currentLandscape}
                    proposedSolution={proposedSolution}
                    settings={diagramSettings}
                    onEdit={() => setIsGenerated(false)}
                    onChangeStyle={() => setShowStyleSelector(true)}
                    onExport={handleExport}
                  />
                ) : (
                  <>
                    {activeTab === "business-context" && (
                      <BusinessContextTab
                        data={businessContext}
                        onChange={updateBusinessContext}
                        onGenerate={handleGenerate}
                      />
                    )}
                    {activeTab === "current-landscape" && (
                      <CurrentLandscapeTab
                        data={currentLandscape}
                        entities={businessContext.entities}
                        onChange={updateCurrentLandscape}
                        onGenerate={handleGenerate}
                      />
                    )}
                    {activeTab === "proposed-solution" && (
                      <ProposedSolutionTab
                        data={proposedSolution}
                        currentSystems={currentLandscape.systems}
                        externalSystems={currentLandscape.externalSystems}
                        onChange={updateProposedSolution}
                        onGenerate={handleGenerate}
                      />
                    )}
                  </>
                )}
              </div>
            </Tabs>
          </div>

          {/* Team Allocation Panel - Sidebar */}
          {showOrgChart && (
            <>
              {/* Resizable Divider */}
              <div
                role="separator"
                tabIndex={0}
                aria-label="Resize panel"
                onMouseDown={handleOrgChartResizeStart}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOrgChartResizeStart(e as unknown as React.MouseEvent); }}
                className={`${styles.resizer} ${isResizingOrgChart ? styles.resizerActive : ""}`}
              >
                {/* Grip Icon */}
                <span className={styles.resizerGrip} aria-hidden="true">
                  <GripVertical size={12} />
                </span>
              </div>

              {/* Org Chart Panel Content */}
              <div className={styles.teamPanel} style={{ width: `${orgChartWidth}px` }}>
                {/* Panel Header */}
                <div className={styles.teamPanelHeader}>
                  <h3 className={styles.teamPanelTitle}>Team Allocation</h3>
                  <p className={styles.teamPanelSubtitle}>Design your team structure</p>
                </div>

                {/* Org Chart Builder */}
                <div className={styles.teamPanelBody}>
                  <OrgChartBuilder onClose={() => setShowOrgChart(false)} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Style Selector Modal */}
        {showStyleSelector && (
          <StyleSelector
            currentSettings={diagramSettings}
            onGenerate={handleGenerateWithStyle}
            onClose={() => setShowStyleSelector(false)}
          />
        )}

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreateProject={handleCreateProject}
        />
      </div>
    </AppShell>
  );
}
