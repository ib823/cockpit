/**
 * Architecture V3 - Complete Implementation
 * All visual styles, all options, user chooses what to export
 */

"use client";

import { useState, useEffect } from "react";
import { Share2 } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { Tier2Header } from "@/components/navigation/Tier2Header";
import { NewProjectModal } from "@/components/gantt-tool/NewProjectModal";
import { HexLoader } from "@/components/ui/HexLoader";
import type {
  ArchitectureProject,
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from "./types";
import { BusinessContextTab } from "./components/BusinessContextTab";
import { CurrentLandscapeTab } from "./components/CurrentLandscapeTab";
import { ProposedSolutionTab } from "./components/ProposedSolutionTab";
import { DiagramGenerator } from "./components/DiagramGenerator";
import { StyleSelector } from "./components/StyleSelector";
import styles from "./styles.module.css";

type Tab = "business-context" | "current-landscape" | "proposed-solution" | "process-mapping";

export default function ArchitectureV3Page() {
  // Session for GlobalNav
  const { data: session } = useSession();

  // Gantt Tool Store Integration
  const {
    currentProject,
    projects,
    fetchProjects,
    loadProject,
    createProject,
    updateProjectName,
    isLoading
  } = useGanttToolStore();

  const [initializing, setInitializing] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("business-context");
  const [version, setVersion] = useState("v1.0");
  const [isGenerated, setIsGenerated] = useState(false);
  const [showStyleSelector, setShowStyleSelector] = useState(false);

  // Data states
  const [businessContext, setBusinessContext] = useState<BusinessContextData>({
    entities: [],
    actors: [],
    capabilities: [],
    painPoints: "",
  });

  const [currentLandscape, setCurrentLandscape] = useState<CurrentLandscapeData>({
    systems: [],
    integrations: [],
    externalSystems: [],
  });

  const [proposedSolution, setProposedSolution] = useState<ProposedSolutionData>({
    phases: [],
    systems: [],
    integrations: [],
    retainedExternalSystems: [],
  });

  const [diagramSettings, setDiagramSettings] = useState<DiagramSettings>({
    visualStyle: "bold",
    actorDisplay: "cards",
    layoutMode: "swim-lanes",
    showLegend: true,
    showIcons: true,
  });

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
  }, []); // Only run once on mount

  const handleGenerate = () => {
    setShowStyleSelector(true);
  };

  const handleGenerateWithStyle = (settings: DiagramSettings) => {
    setDiagramSettings(settings);
    setShowStyleSelector(false);
    setIsGenerated(true);
  };

  const handleUpdateProjectName = async (newName: string) => {
    if (currentProject) {
      await updateProjectName(newName);
    }
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
          isLoading={isLoading}
          version={version}
          rightContent={
            <button className={styles.iconButton} title="Share & Export">
              <Share2 className="w-4 h-4" />
            </button>
          }
        />

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <TabButton
          label="Business Context"
          isActive={activeTab === "business-context"}
          onClick={() => setActiveTab("business-context")}
        />
        <TabButton
          label="Current Business Landscape"
          isActive={activeTab === "current-landscape"}
          onClick={() => setActiveTab("current-landscape")}
        />
        <TabButton
          label="Proposed Solution"
          isActive={activeTab === "proposed-solution"}
          onClick={() => setActiveTab("proposed-solution")}
        />
        <TabButton
          label="Process Mapping"
          isActive={activeTab === "process-mapping"}
          onClick={() => setActiveTab("process-mapping")}
        />
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {isGenerated ? (
          <DiagramGenerator
            businessContext={businessContext}
            currentLandscape={currentLandscape}
            proposedSolution={proposedSolution}
            settings={diagramSettings}
            onEdit={() => setIsGenerated(false)}
            onChangeStyle={() => setShowStyleSelector(true)}
          />
        ) : (
          <>
            {activeTab === "business-context" && (
              <BusinessContextTab
                data={businessContext}
                onChange={setBusinessContext}
                onGenerate={handleGenerate}
              />
            )}
            {activeTab === "current-landscape" && (
              <CurrentLandscapeTab
                data={currentLandscape}
                entities={businessContext.entities}
                onChange={setCurrentLandscape}
                onGenerate={handleGenerate}
              />
            )}
            {activeTab === "proposed-solution" && (
              <ProposedSolutionTab
                data={proposedSolution}
                currentSystems={currentLandscape.systems}
                externalSystems={currentLandscape.externalSystems}
                onChange={setProposedSolution}
                onGenerate={handleGenerate}
              />
            )}
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
        onCreateProject={createProject}
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
}

function TabButton({ label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ""}`}
    >
      {label}
    </button>
  );
}
