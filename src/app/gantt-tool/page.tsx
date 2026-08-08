/**
 * The Timeline tool.
 *
 * The design-system Gantt canvas (layer 4a) inside the ds shell: top bar with
 * project switcher and sync chip, views as ds Tabs, and every tool action a
 * labelled button in the canvas toolbar. The legacy canvas and its icon-strip
 * chrome are gone — this is the only Gantt.
 *
 * Route: /gantt-tool
 * Keyboard: ⌘P add phase, ⌘T add task; the canvas itself owns the treegrid
 * keys (arrows, M for Move, +/- for zoom, T for today).
 */

"use client";

import dynamic from "next/dynamic";
import { logger } from "@/lib/logger";
import { GanttCanvasNext } from "@/components/gantt-tool/next/GanttCanvasNext";
// Lazy-load modals and heavy tabs (E-02: route-level code splitting)
const NewProjectModal = dynamic(() => import("@/components/gantt-tool/NewProjectModal").then(m => ({ default: m.NewProjectModal })), { ssr: false });
const ImportModal = dynamic(() => import("@/components/gantt-tool/ImportModal").then(m => ({ default: m.ImportModal })), { ssr: false });
const AddPhaseModal = dynamic(() => import("@/components/gantt-tool/AddPhaseModal").then(m => ({ default: m.AddPhaseModal })), { ssr: false });
const AddTaskModal = dynamic(() => import("@/components/gantt-tool/AddTaskModal").then(m => ({ default: m.AddTaskModal })), { ssr: false });
const LogoLibraryModal = dynamic(() => import("@/components/gantt-tool/LogoLibraryModal").then(m => ({ default: m.LogoLibraryModal })), { ssr: false });
const OrgChartPro = dynamic(() => import("@/components/gantt-tool/OrgChartPro").then(m => ({ default: m.OrgChartPro })), { ssr: false });
const ResourceDashboardModal = dynamic(() => import("@/components/gantt-tool/ResourceDashboardModal").then(m => ({ default: m.ResourceDashboardModal })), { ssr: false });
const ExportConfigModal = dynamic(() => import("@/components/gantt-tool/ExportConfigModal"), { ssr: false });
const ProjectContextTab = dynamic(() => import("@/components/gantt-tool/ProjectContextTab").then(m => ({ default: m.ProjectContextTab })), { ssr: false });
const FinancialsTab = dynamic(() => import("@/components/gantt-tool/FinancialsTab").then(m => ({ default: m.FinancialsTab })), { ssr: false });
import { useFinancialAccess } from "@/hooks/useFinancialAccess";
import { AppShell } from "@/components/ds/AppShell";
import { Button } from "@/components/ds/Button";
import { Tabs } from "@/components/ds/Tabs";
import { UserMenu } from "@/components/navigation/UserMenu";
import { globalNav, toSyncChip } from "@/components/navigation/global-nav";
import { ProjectSwitcher } from "@/components/gantt-tool/ProjectSwitcher";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { Banner } from "@/components/ds/Banner";
import { getOrphanedResourceIds } from "@/lib/gantt-tool/resource-diagnostics";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { Share2, Users, FileSpreadsheet, Flag, Layers, CheckSquare, Image as ImageIcon, BarChart3, PieChart } from "lucide-react";
import { format } from "date-fns";
import { AuthShell } from "@/components/ds/AuthShell";
import { BeaconLoader } from "@/components/ds/BeaconLoader";

type ProjectTab = "timeline" | "context" | "financials";

export default function GanttToolPage() {
  // ⚠️ IMPORTANT: All hooks must be called before any conditional returns
  const { data: session } = useSession();

  const {
    currentProject,
    projects,
    fetchProjects,
    loadProject,
    createProject,
    updateProjectName,
    deleteProject,
    deleteResource,
    unloadCurrentProject,
    isLoading,
    syncStatus
  } = useGanttToolStore();

  const [initializing, setInitializing] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTab>("timeline");
  const [isCapacityPanelExpanded, setIsCapacityPanelExpanded] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showResourceDashboard, setShowResourceDashboard] = useState(false);
  const [repairingOrphans, setRepairingOrphans] = useState(false);
  const [orphanBannerDismissed, setOrphanBannerDismissed] = useState(false);

  // Financial access check - determines if Financials tab should be shown
  const { hasAccess: hasFinancialAccess, isLoading: isFinancialAccessLoading } = useFinancialAccess(currentProject?.id);

  // Check if project is already loaded on mount
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
        logger.error("[Timeline] Failed to initialize:", { error });
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [fetchProjects, loadProject, createProject]); // Store actions are stable references

  const showLoading = initializing || isLoading || !currentProject;

  const handleUpdateProjectName = async (newName: string) => {
    if (currentProject) {
      await updateProjectName(newName);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      // If the deleted project was the current one, unload it
      if (currentProject?.id === projectId) {
        unloadCurrentProject();
      }
    } catch (error) {
      // Error surfaces through the top bar's sync chip via syncStatus
      logger.error('[Timeline] Failed to delete project:', { error });
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P for Add Phase
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p' && !e.shiftKey) {
        if (currentProject && !showAddPhaseModal && !showAddTaskModal) {
          e.preventDefault();
          setShowAddPhaseModal(true);
        }
      }

      // Cmd/Ctrl + T for Add Task
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't' && !e.shiftKey) {
        if (currentProject && currentProject.phases.length > 0 && !showAddPhaseModal && !showAddTaskModal) {
          e.preventDefault();
          setShowAddTaskModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, showAddPhaseModal, showAddTaskModal]);

  if (showLoading) {
    // The store hydrates from IndexedDB before a project exists, so this is a
    // wait rather than an error. The beacon's status line is the live region;
    // it appears only past 400ms so a fast restore never flashes chrome.
    return (
      <AuthShell title="Timeline">
        <BeaconLoader label="Loading your project…" />
      </AuthShell>
    );
  }

  // An AMS phase holds at most one task; the Task button explains rather than
  // silently refusing.
  const selectedForTask = currentProject.phases.length > 0;
  const tabs = [
    { id: "timeline", label: "Timeline" },
    { id: "context", label: "Context" },
    ...(hasFinancialAccess && !isFinancialAccessLoading
      ? [{ id: "financials", label: "Financials" }]
      : []),
  ];

  // Every action is a labelled button — the spec's toolbar has no unlabelled
  // icon strip. Icons are decorative beside their text.
  const canvasToolbar = (
    <>
      <Button
        size="sm"
        variant="secondary"
        icon={<Layers size={14} aria-hidden="true" />}
        onClick={() => setShowAddPhaseModal(true)}
        title="Add phase (⌘P)"
      >
        Phase
      </Button>
      <Button
        size="sm"
        variant="secondary"
        icon={<CheckSquare size={14} aria-hidden="true" />}
        onClick={() => setShowAddTaskModal(true)}
        disabled={!selectedForTask}
        title={selectedForTask ? "Add task (⌘T)" : "Add a phase first"}
      >
        Task
      </Button>
      <Button
        size="sm"
        variant="secondary"
        icon={<Flag size={14} aria-hidden="true" />}
        onClick={() => setShowMilestoneModal(true)}
        title="Add or edit milestones"
      >
        Milestone
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<Users size={14} aria-hidden="true" />}
        onClick={() => setShowOrgChartModal(true)}
        title="Team structure and allocation"
      >
        Team
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<BarChart3 size={14} aria-hidden="true" />}
        aria-pressed={isCapacityPanelExpanded}
        onClick={() => setIsCapacityPanelExpanded(!isCapacityPanelExpanded)}
        title="Weekly capacity per person"
      >
        Capacity
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<PieChart size={14} aria-hidden="true" />}
        onClick={() => setShowResourceDashboard(true)}
        title="Resource analytics"
      >
        Insights
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<FileSpreadsheet size={14} aria-hidden="true" />}
        onClick={() => setShowImportModal(true)}
        title="Import a plan from Excel"
      >
        Import
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<ImageIcon size={14} aria-hidden="true" />}
        onClick={() => setShowLogoLibrary(true)}
        title="Company logo library"
      >
        Logos
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={<Share2 size={14} aria-hidden="true" />}
        onClick={() => setShowExportModal(true)}
        title="Export as PNG or PDF"
      >
        Export
      </Button>
    </>
  );

  return (
    <>
      <AppShell
        fullBleed
        primaryNav={globalNav("/gantt-tool")}
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
        <div className="ds" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "var(--ds-space-4)" }}>
          {/* The orphan repair tool, rehomed from the deleted resource panel:
            * resources whose manager reference is invalid vanish from the org
            * chart, which is a data problem the user cannot see any other way. */}
          {(() => {
            const orphanedIds = getOrphanedResourceIds(currentProject);
            if (orphanedIds.length === 0 || orphanBannerDismissed) return null;
            return (
              <div style={{ marginBottom: "var(--ds-space-3)" }}>
                <Banner
                  tone="warning"
                  title={`${orphanedIds.length} resource${orphanedIds.length === 1 ? " is" : "s are"} hidden from the org chart`}
                  actions={
                    <Button
                      size="sm"
                      variant="danger"
                      loading={repairingOrphans}
                      loadingLabel="Removing…"
                      onClick={async () => {
                        setRepairingOrphans(true);
                        try {
                          for (const id of orphanedIds) {
                            await deleteResource(id);
                          }
                        } finally {
                          setRepairingOrphans(false);
                        }
                      }}
                    >
                      Remove {orphanedIds.length === 1 ? "it" : "them"}
                    </Button>
                  }
                  onDismiss={() => setOrphanBannerDismissed(true)}
                >
                  Their manager references point at people who no longer exist, so
                  they appear nowhere. Removing them deletes the records; fixing a
                  manager in Team keeps them.
                </Banner>
              </div>
            );
          })()}
          <Tabs tabs={tabs} activeId={activeTab} onChange={(id) => setActiveTab(id as ProjectTab)} label="Project views">
            {activeTab === "timeline" && (
              <GanttCanvasNext
                toolbar={canvasToolbar}
                showMilestoneModal={showMilestoneModal}
                onShowMilestoneModalChange={setShowMilestoneModal}
                showResourceCapacity={isCapacityPanelExpanded}
              />
            )}

            {activeTab === "context" && (
              <ProjectContextTab
                projectId={currentProject.id}
                initialContext={currentProject.businessContext as { painPoints?: string; skills?: string[] } | undefined}
                onSave={() => {
                  loadProject(currentProject.id);
                }}
                onNavigateToTimeline={() => setActiveTab("timeline")}
              />
            )}

            {activeTab === "financials" && hasFinancialAccess && (
              <FinancialsTab project={currentProject} />
            )}
          </Tabs>
        </div>
      </AppShell>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(name, startDate, companyLogos) => createProject(name, startDate, undefined, companyLogos)}
      />

      {/* Excel Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Add Phase Modal */}
      <AddPhaseModal
        isOpen={showAddPhaseModal}
        onClose={() => setShowAddPhaseModal(false)}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
      />

      {/* Logo Library Modal */}
      <LogoLibraryModal
        isOpen={showLogoLibrary}
        onClose={() => setShowLogoLibrary(false)}
      />

      {/* Org Chart - team structure and allocation */}
      {showOrgChartModal && currentProject && (
        <OrgChartPro
          onClose={() => setShowOrgChartModal(false)}
          project={currentProject}
          onOpenLogoLibrary={() => {
            setShowOrgChartModal(false);
            setShowLogoLibrary(true);
          }}
          hasFinancialAccess={hasFinancialAccess}
        />
      )}

      {/* Resource Dashboard Modal - Analytics and insights */}
      <ResourceDashboardModal
        isOpen={showResourceDashboard}
        onClose={() => setShowResourceDashboard(false)}
        projectName={currentProject?.name}
      />

      {/* Export Configuration Modal - real PNG/PDF export via exportGanttEnhanced */}
      {showExportModal && currentProject && (
        <ExportConfigModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          project={currentProject}
        />
      )}
    </>
  );
}
