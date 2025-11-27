/**
 * Architecture V3 - Complete Implementation
 * All visual styles, all options, user chooses what to export
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Share2, Users, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { Tier2Header } from "@/components/navigation/Tier2Header";
import { NewProjectModal } from "@/components/gantt-tool/NewProjectModal";
import { OrgChartBuilder } from "@/components/gantt-tool/OrgChartBuilder";
import { HexLoader } from "@/components/ui/HexLoader";
import type {
  ArchitectureProject,
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
  DiagramType,
  ExportOptions,
} from "./types";
import { BusinessContextTab } from "./components/BusinessContextTab";
import { CurrentLandscapeTab } from "./components/CurrentLandscapeTab";
import { ProposedSolutionTab } from "./components/ProposedSolutionTab";
import { DiagramGenerator } from "./components/DiagramGenerator";
import { StyleSelector } from "./components/StyleSelector";
import { useTabKeyboardNavigation } from "./hooks/useKeyboardNavigation";
import styles from "./styles.module.css";

type Tab = "business-context" | "current-landscape" | "proposed-solution" | "process-mapping";

// Tab definitions for keyboard navigation
const TABS = [
  { id: "business-context" as const, label: "Business Context" },
  { id: "current-landscape" as const, label: "Current Business Landscape" },
  { id: "proposed-solution" as const, label: "Proposed Solution" },
  { id: "process-mapping" as const, label: "Process Mapping" },
];

export default function ArchitectureV3Page() {
  // Session for GlobalNav
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
  const [version, setVersion] = useState("v1.0");
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

  // Keyboard navigation for tabs
  const { containerRef: tabsContainerRef, handleKeyDown: handleTabKeyDown } = useTabKeyboardNavigation(
    TABS,
    activeTab,
    (tabId) => setActiveTab(tabId as Tab)
  );

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
  useEffect(() => {
    console.log("[Architecture V3] Mount - currentProject:", currentProject?.id);

    // If project already loaded, we're good
    if (currentProject) {
      console.log("[Architecture V3] Project already loaded:", currentProject.id);
      setInitializing(false);
      return;
    }

    // Otherwise, initialize
    const initialize = async () => {
      try {
        console.log("[Architecture V3] No project loaded, starting initialization...");

        // Fetch projects from database
        await fetchProjects();
        console.log("[Architecture V3] Projects fetched");

        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get current state after fetch
        const state = useGanttToolStore.getState();
        console.log("[Architecture V3] After fetch - Current project:", state.currentProject?.id, "Projects count:", state.projects.length);

        // If STILL no project is loaded, auto-load or create one
        if (!state.currentProject) {
          if (state.projects.length > 0) {
            // Load most recent project
            const sortedProjects = [...state.projects].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            console.log("[Architecture V3] Loading project:", sortedProjects[0].id);
            await loadProject(sortedProjects[0].id);
          } else {
            // Create default project
            const today = format(new Date(), "yyyy-MM-dd");
            const projectName = `Project ${format(new Date(), "yyyy-MM-dd HH:mm")}`;
            console.log("[Architecture V3] Creating new project:", projectName);
            await createProject(projectName, today);
          }
        }

        console.log("[Architecture V3] Initialization complete");
      } catch (error) {
        console.error("[Architecture V3] Failed to initialize:", error);
      } finally {
        setInitializing(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // TODO: Implement actual export functionality
    console.log("Export requested:", options);
    alert(`Export functionality coming soon!\nFormat: ${options.format}\nFilename: ${options.filename}`);
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

  const handleCreateProject = async (name: string, startDate: string, companyLogos?: Record<string, string>) => {
    await createProject(name, `Started on ${startDate}`);
    // Note: companyLogos and startDate are not currently used in the architecture store
    // They may be added in a future enhancement
  };

  // Determine if we should show loading state
  const showLoading = initializing || isLoading || !currentProject;

  return showLoading ? (
    <div className={styles.loadingContainer}>
      <HexLoader size="xl" />
    </div>
  ) : (
    <>
      {/* Global Navigation - Tier 1 */}
      <GlobalNav session={session} />

      <div className={styles.container}>
        {/* Tool Navigation - Tier 2 */}
        <Tier2Header
          currentProject={currentProject}
          projects={projects}
          onSelectProject={loadProject}
          onCreateProject={() => setIsNewProjectModalOpen(true)}
          onUpdateProjectName={handleUpdateProjectName}
          onDeleteProject={handleDeleteProject}
          isLoading={isLoading}
          version="v3.0"
          lastSyncAt={lastSyncAt}
          syncStatus={syncStatus}
          showMetrics={false}
          rightContent={
            <>
              {/* Team Allocation Panel Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOrgChart(!showOrgChart);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: showOrgChart ? "var(--color-blue-light)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!showOrgChart) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { if (!showOrgChart) e.currentTarget.style.backgroundColor = "transparent" }}
                aria-label={showOrgChart ? "Close team allocation panel" : "Open team allocation panel"}
                aria-pressed={showOrgChart}
              >
                <Users className="w-4 h-4" style={{ color: showOrgChart ? "var(--color-blue)" : "var(--color-text-secondary)" }} aria-hidden="true" />
              </button>

              {/* Share & Export */}
              <button
                className={styles.iconButton}
                aria-label="Share and export architecture diagram"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          }
        />

      {/* Main Layout with optional sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div
            ref={tabsContainerRef}
            className={styles.tabsContainer}
            role="tablist"
            aria-label="Architecture sections"
          >
            <TabButton
              label="Business Context"
              isActive={activeTab === "business-context"}
              onClick={() => handleTabChange("business-context")}
              onKeyDown={handleTabKeyDown}
              id="tab-business-context"
              controls="panel-business-context"
            />
            <TabButton
              label="Current Business Landscape"
              isActive={activeTab === "current-landscape"}
              onClick={() => handleTabChange("current-landscape")}
              onKeyDown={handleTabKeyDown}
              id="tab-current-landscape"
              controls="panel-current-landscape"
            />
            <TabButton
              label="Proposed Solution"
              isActive={activeTab === "proposed-solution"}
              onClick={() => handleTabChange("proposed-solution")}
              onKeyDown={handleTabKeyDown}
              id="tab-proposed-solution"
              controls="panel-proposed-solution"
            />
            <TabButton
              label="Process Mapping"
              isActive={activeTab === "process-mapping"}
              onClick={() => handleTabChange("process-mapping")}
              onKeyDown={handleTabKeyDown}
              id="tab-process-mapping"
              controls="panel-process-mapping"
            />
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
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
            <div
              role="tabpanel"
              id="panel-business-context"
              aria-labelledby="tab-business-context"
              hidden={activeTab !== "business-context"}
            >
              {activeTab === "business-context" && (
                <BusinessContextTab
                  data={businessContext}
                  onChange={updateBusinessContext}
                  onGenerate={handleGenerate}
                />
              )}
            </div>
            <div
              role="tabpanel"
              id="panel-current-landscape"
              aria-labelledby="tab-current-landscape"
              hidden={activeTab !== "current-landscape"}
            >
              {activeTab === "current-landscape" && (
                <CurrentLandscapeTab
                  data={currentLandscape}
                  entities={businessContext.entities}
                  onChange={updateCurrentLandscape}
                  onGenerate={handleGenerate}
                />
              )}
            </div>
            <div
              role="tabpanel"
              id="panel-proposed-solution"
              aria-labelledby="tab-proposed-solution"
              hidden={activeTab !== "proposed-solution"}
            >
              {activeTab === "proposed-solution" && (
                <ProposedSolutionTab
                  data={proposedSolution}
                  currentSystems={currentLandscape.systems}
                  externalSystems={currentLandscape.externalSystems}
                  onChange={updateProposedSolution}
                  onGenerate={handleGenerate}
                />
              )}
            </div>
            <div
              role="tabpanel"
              id="panel-process-mapping"
              aria-labelledby="tab-process-mapping"
              hidden={activeTab !== "process-mapping"}
            >
              {activeTab === "process-mapping" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "400px",
                  padding: "48px 32px",
                  maxWidth: "1400px",
                  margin: "0 auto",
                }}>
                  <div style={{ textAlign: "center", maxWidth: "600px" }}>
                    <h2 style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#000",
                      marginBottom: "16px",
                    }}>
                      Process Mapping Canvas (Coming Soon)
                    </h2>
                    <p style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "16px",
                      color: "#666",
                      lineHeight: 1.6,
                      marginBottom: "24px",
                    }}>
                      This optional canvas will allow you to map business processes with flowcharts, swimlanes, and workflow diagrams - perfect for documenting AS-IS and TO-BE processes.
                    </p>
                    <div style={{
                      padding: "16px",
                      backgroundColor: "#E3F2FD",
                      borderRadius: "8px",
                      border: "1px solid #2196F3",
                    }}>
                      <p style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        color: "#1565C0",
                        margin: 0,
                      }}>
                        <strong>Planned Features:</strong> Drag-and-drop process nodes, swimlane diagrams, status flows, system integrations, role assignments, and workflow automation mapping
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
          </div>
        </div>

        {/* Team Allocation Panel - Sidebar */}
        {showOrgChart && (
          <>
            {/* Resizable Divider */}
            <div
              onMouseDown={handleOrgChartResizeStart}
              style={{
                width: "6px",
                height: "100%",
                cursor: "col-resize",
                backgroundColor: isResizingOrgChart ? "var(--color-blue)" : "transparent",
                borderLeft: "1px solid var(--color-gray-4)",
                borderRight: "1px solid var(--color-gray-4)",
                transition: isResizingOrgChart ? "none" : "background-color 0.15s ease",
                position: "relative",
                flexShrink: 0,
                userSelect: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={(e) => {
                if (!isResizingOrgChart) e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                if (!isResizingOrgChart) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* Grip Icon */}
              <div
                style={{
                  padding: "8px 2px",
                  backgroundColor: isResizingOrgChart ? "var(--color-blue)" : "rgba(0, 122, 255, 0.15)",
                  borderRadius: "4px",
                  pointerEvents: "none",
                  opacity: isResizingOrgChart ? 1 : 0.6,
                  transition: "opacity 0.15s ease",
                }}
              >
                <GripVertical className="w-3 h-3" style={{ color: isResizingOrgChart ? "#fff" : "var(--color-blue)" }} />
              </div>
            </div>

            {/* Org Chart Panel Content */}
            <div
              style={{
                width: `${orgChartWidth}px`,
                height: "100%",
                minWidth: "300px",
                maxWidth: "600px",
                backgroundColor: "var(--color-bg-primary)",
                overflow: "auto",
                animation: "slideInRight 0.3s ease",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Panel Header */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--line)",
                backgroundColor: "var(--color-bg-primary)",
              }}>
                <h3 style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "17px",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}>
                  Team Allocation
                </h3>
                <p style={{
                  fontFamily: "var(--font-text)",
                  fontSize: "13px",
                  color: "var(--color-text-secondary)",
                  margin: "4px 0 0 0",
                }}>
                  Design your team structure
                </p>
              </div>

              {/* Org Chart Builder */}
              <div style={{ flex: 1, overflow: "auto" }}>
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
    </>
  );
}

/**
 * Tab Button
 */
interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  id: string;
  controls: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function TabButton({ label, isActive, onClick, id, controls, onKeyDown }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={controls}
      id={id}
      tabIndex={isActive ? 0 : -1}
    >
      {label}
    </button>
  );
}
