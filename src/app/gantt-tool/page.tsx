/**
 * Gantt Tool V3 - Apple HIG Specification Page
 *
 * This page showcases the revamped Gantt chart following UI_suggestion.md exactly.
 * Uses the same data store as the original Gantt for real-time sync.
 *
 * Access: /gantt-tool
 */

"use client";

import { GanttCanvasV3 } from "@/components/gantt-tool/GanttCanvasV3";
import { NewProjectModal } from "@/components/gantt-tool/NewProjectModal";
import { OrgChartBuilderV2 } from "@/components/gantt-tool/OrgChartBuilderV2";
import { ImportModalV2 } from "@/components/gantt-tool/ImportModalV2";
import { AddPhaseModal } from "@/components/gantt-tool/AddPhaseModal";
import { AddTaskModal } from "@/components/gantt-tool/AddTaskModal";
import { LogoLibraryModal } from "@/components/gantt-tool/LogoLibraryModal";
import { ViewModeSelector, type ZoomMode } from "@/components/gantt-tool/ViewModeSelector";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { Tier2Header } from "@/components/navigation/Tier2Header";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Share2, Users, GripHorizontal, GripVertical, Briefcase, FileSpreadsheet, Flag, Layers, CheckSquare, Image as ImageIcon, Columns2 } from "lucide-react";
import { ResourceIcon } from "@/lib/resource-icons";
import { HexLoader } from "@/components/ui/HexLoader";
import { format } from "date-fns";

export default function GanttToolV3Page() {
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
    unloadCurrentProject,
    isLoading,
    lastSyncAt,
    syncStatus
  } = useGanttToolStore();

  const [initializing, setInitializing] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLogoLibrary, setShowLogoLibrary] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgChartHeight, setOrgChartHeight] = useState(400); // Default 400px (also used for sidebar width)
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isResizingOrgChart, setIsResizingOrgChart] = useState(false);
  const [resourcePanelLayout, setResourcePanelLayout] = useState<'sidebar' | 'bottom'>('sidebar'); // User preference
  const [resourcePanelView, setResourcePanelView] = useState<'category' | 'orgchart'>('orgchart'); // View mode - always org chart

  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Main view state: Timeline or Architecture
  const [mainView, setMainView] = useState<'timeline' | 'architecture'>('timeline');

  // Selection persistence across views
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Split view mode (power user feature)
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);

  // View transition feedback (Apple-style toast)
  const [viewTransitionToast, setViewTransitionToast] = useState<{
    visible: boolean;
    message: string;
  }>({ visible: false, message: "" });

  // Intelligent zoom levels - semantic, not arbitrary percentages
  const [zoomMode, setZoomMode] = useState<ZoomMode>('auto');

  // Calculate intelligent zoom based on TOTAL project timeline span (phases AND tasks)
  const getAutoZoomMode = (): Exclude<ZoomMode, 'auto'> => {
    if (!currentProject || currentProject.phases.length === 0) return 'month';

    // Find earliest start and latest end across ALL phases AND tasks
    let earliestStart = new Date(currentProject.phases[0].startDate);
    let latestEnd = new Date(currentProject.phases[0].endDate);

    currentProject.phases.forEach(phase => {
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      if (phaseStart < earliestStart) earliestStart = phaseStart;
      if (phaseEnd > latestEnd) latestEnd = phaseEnd;

      // Also check all tasks within the phase
      if (phase.tasks && phase.tasks.length > 0) {
        phase.tasks.forEach(task => {
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);
          if (taskStart < earliestStart) earliestStart = taskStart;
          if (taskEnd > latestEnd) latestEnd = taskEnd;
        });
      }
    });

    // Calculate TOTAL project span in days
    const totalDays = Math.abs(latestEnd.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24);

    // Intelligent view selection
    if (totalDays <= 60) return 'week';       // <= 2 months: weekly
    if (totalDays <= 365) return 'month';     // <= 1 year: monthly
    if (totalDays <= 1095) return 'quarter';  // <= 3 years: quarterly
    return 'year';                             // > 3 years: yearly
  };

  const activeZoomMode = zoomMode === 'auto' ? getAutoZoomMode() : zoomMode;

  // Handle org chart resize
  const handleOrgChartResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingOrgChart(true);
  }, []);

  useEffect(() => {
    if (!isResizingOrgChart) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resourcePanelLayout === 'sidebar') {
        // Calculate width from right edge of viewport
        const viewportWidth = window.innerWidth;
        const newWidth = viewportWidth - e.clientX;
        // Clamp between 300px and 600px
        const clampedWidth = Math.max(300, Math.min(600, newWidth));
        setOrgChartHeight(clampedWidth);
      } else {
        // Bottom layout: calculate height from bottom
        const viewportHeight = window.innerHeight;
        const headerHeight = 56;
        const footerHeight = 40;
        const availableHeight = viewportHeight - headerHeight - footerHeight;
        const newHeight = viewportHeight - e.clientY - footerHeight;
        // Clamp between 200px and 70% of available height
        const clampedHeight = Math.max(200, Math.min(availableHeight * 0.7, newHeight));
        setOrgChartHeight(clampedHeight);
      }
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
  }, [isResizingOrgChart, resourcePanelLayout]);

  // Show view transition feedback (Apple-style)
  useEffect(() => {
    if (splitViewEnabled) {
      setViewTransitionToast({
        visible: true,
        message: "Split View Enabled"
      });
    } else {
      const viewName = mainView === 'timeline' ? 'Timeline' : 'Architecture';
      setViewTransitionToast({
        visible: true,
        message: `Switched to ${viewName} View`
      });
    }

    // Auto-hide after 1.5 seconds
    const timer = setTimeout(() => {
      setViewTransitionToast(prev => ({ ...prev, visible: false }));
    }, 1500);

    return () => clearTimeout(timer);
  }, [mainView, splitViewEnabled]);

  // Check if project is already loaded on mount
  useEffect(() => {
    console.log("[V3] Mount - currentProject:", currentProject?.id);

    // If project already loaded, we're good
    if (currentProject) {
      console.log("[V3] Project already loaded:", currentProject.id);
      setInitializing(false);
      return;
    }

    // Otherwise, initialize
    const initialize = async () => {
      try {
        console.log("[V3] No project loaded, starting initialization...");

        // Fetch projects from database
        await fetchProjects();
        console.log("[V3] Projects fetched");

        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get current state after fetch
        const state = useGanttToolStore.getState();
        console.log("[V3] After fetch - Current project:", state.currentProject?.id, "Projects count:", state.projects.length);

        // If STILL no project is loaded, auto-load or create one
        if (!state.currentProject) {
          if (state.projects.length > 0) {
            // Load most recent project
            const sortedProjects = [...state.projects].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            console.log("[V3] Loading project:", sortedProjects[0].id);
            await loadProject(sortedProjects[0].id);
          } else {
            // Create default project
            const today = format(new Date(), "yyyy-MM-dd");
            const projectName = `Project ${format(new Date(), "yyyy-MM-dd HH:mm")}`;
            console.log("[V3] Creating new project:", projectName);
            await createProject(projectName, today);
          }
        }

        console.log("[V3] Initialization complete");
      } catch (error) {
        console.error("[V3] Failed to initialize:", error);
      } finally {
        setInitializing(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Determine if we should show loading state
  const showLoading = initializing || isLoading || !currentProject;

  // Handle project name update
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

  // Global keyboard shortcuts - Apple pattern: ⌘1-9 for views, ⌘K for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘1 - Switch to Timeline view (like Calendar.app ⌘1 for Day view)
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setMainView('timeline');
        return;
      }

      // ⌘2 - Switch to Architecture view (like Calendar.app ⌘2 for Week view)
      if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setMainView('architecture');
        return;
      }

      // ⌘\ - Toggle split view (like Xcode ⌘⌥Enter for assistant editor)
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setSplitViewEnabled(!splitViewEnabled);
        return;
      }

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
  }, [currentProject, showAddPhaseModal, showAddTaskModal, splitViewEnabled]);

  return showLoading ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <HexLoader size="xl" />
    </div>
  ) : (
    <>
      {/* Global Navigation - Tier 1 */}
      <GlobalNav session={session} />

      <div className="h-screen flex flex-col bg-white" style={{ height: "calc(100vh - 56px)" }}>
        {/* Tool Navigation Bar - Tier 2 (Tool-specific controls) */}
        <Tier2Header
          currentProject={currentProject}
          projects={projects}
          onSelectProject={loadProject}
          onCreateProject={() => setIsNewProjectModalOpen(true)}
          onUpdateProjectName={handleUpdateProjectName}
          onDeleteProject={handleDeleteProject}
          isLoading={isLoading}
          version="v1.0"
          lastSyncAt={lastSyncAt}
          syncStatus={syncStatus}
          rightContent={
            <>
              {/* Main View Switcher - Timeline vs Architecture */}
              <div style={{
                display: "flex",
                backgroundColor: "var(--color-gray-6)",
                borderRadius: "6px",
                padding: "2px",
                border: "1px solid var(--line)",
              }}>
                <button
                  onClick={() => setMainView('timeline')}
                  aria-label="Show Timeline view"
                  aria-pressed={mainView === 'timeline'}
                  title="Timeline View (⌘1)"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: mainView === 'timeline' ? "#fff" : "transparent",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: mainView === 'timeline' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                    color: mainView === 'timeline' ? "#000" : "#666",
                  }}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setMainView('architecture')}
                  aria-label="Show Architecture view"
                  aria-pressed={mainView === 'architecture'}
                  title="Architecture View (⌘2)"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: mainView === 'architecture' ? "#fff" : "transparent",
                    fontFamily: "var(--font-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: mainView === 'architecture' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                    color: mainView === 'architecture' ? "#000" : "#666",
                  }}
                >
                  Architecture
                </button>
              </div>

              {/* Split View Toggle - Xcode-style assistant editor */}
              <button
                type="button"
                onClick={() => setSplitViewEnabled(!splitViewEnabled)}
                aria-label={splitViewEnabled ? "Exit split view" : "Enable split view"}
                aria-pressed={splitViewEnabled}
                title={`Split View (⌘\\) - ${splitViewEnabled ? 'Single view' : 'Timeline + Architecture side-by-side'}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: splitViewEnabled ? "var(--color-blue-light)" : "transparent",
                  color: splitViewEnabled ? "var(--color-blue)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!splitViewEnabled) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { if (!splitViewEnabled) e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Columns2 className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Timeline View Selector - Show in Timeline view OR in split view */}
              {(mainView === 'timeline' || splitViewEnabled) && (
                <ViewModeSelector
                  zoomMode={zoomMode}
                  activeZoomMode={activeZoomMode}
                  onZoomModeChange={setZoomMode}
                />
              )}

              {/* Add Phase Button */}
              <button
                type="button"
                onClick={() => setShowAddPhaseModal(true)}
                disabled={!currentProject}
                aria-label="Add phase (⌘P)"
                title="Add Phase (⌘P)"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: currentProject ? "var(--color-text-secondary)" : "var(--color-gray-3)",
                  cursor: currentProject ? "pointer" : "not-allowed",
                  opacity: currentProject ? 1 : 0.5,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (currentProject) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Layers className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Add Task Button */}
              <button
                type="button"
                onClick={() => setShowAddTaskModal(true)}
                disabled={!currentProject || currentProject.phases.length === 0}
                aria-label="Add task (⌘T)"
                title={currentProject && currentProject.phases.length === 0 ? "Add a phase first" : "Add Task (⌘T)"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: currentProject && currentProject.phases.length > 0 ? "var(--color-text-secondary)" : "var(--color-gray-3)",
                  cursor: currentProject && currentProject.phases.length > 0 ? "pointer" : "not-allowed",
                  opacity: currentProject && currentProject.phases.length > 0 ? 1 : 0.5,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (currentProject && currentProject.phases.length > 0) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Add Milestone Button */}
              <button
                type="button"
                onClick={() => setShowMilestoneModal(true)}
                aria-label="Add milestone to timeline"
                title="Add Milestone"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Flag className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                aria-label="Import project from Excel"
                title="Import from Excel"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Manage Logos Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogoLibrary(true);
                }}
                title="Upload and manage company logos"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Plan Resources Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMainView('architecture');
                }}
                title="Switch to Architecture view to design team structure"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Briefcase className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Resource Allocation Panel Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOrgChart(!showOrgChart);
                }}
                aria-label={showOrgChart ? "Hide resource allocation panel" : "Show resource allocation panel"}
                aria-pressed={showOrgChart}
                title="Toggle Resource Allocation Panel"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: showOrgChart ? "var(--color-blue-light)" : "transparent",
                  color: showOrgChart ? "var(--color-blue)" : "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  position: "relative",
                  zIndex: 1025,
                  pointerEvents: "auto",
                }}
                onMouseEnter={(e) => { if (!showOrgChart) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { if (!showOrgChart) e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Users className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Share button clicked - Export functionality coming soon');
                  alert('Share & Export functionality coming soon!\n\nThis will allow you to:\n• Export to PNG/PDF\n• Share project link\n• Export to Excel');
                }}
                title="Share & export project"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          }
          showMetrics={true}
        />

      {/* Main Content Area - Timeline, Architecture, or Split View */}
      <div className="flex-1 overflow-hidden flex" style={{ flexDirection: resourcePanelLayout === 'sidebar' ? 'row' : 'column' }}>
        {/* Main View Area */}
        <div className="flex-1 overflow-hidden" style={{
          display: "flex",
          flexDirection: "row",
          position: "relative",
        }}>
          {/* Timeline View */}
          {(mainView === 'timeline' || splitViewEnabled) && (
            <div style={{
              flex: splitViewEnabled ? 1 : "auto",
              width: splitViewEnabled ? "50%" : "100%",
              height: "100%",
              overflow: "hidden",
              borderRight: splitViewEnabled ? "1px solid var(--color-gray-4)" : "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: 1,
            }}>
              <GanttCanvasV3
                zoomMode={activeZoomMode}
                showMilestoneModal={showMilestoneModal}
                onShowMilestoneModalChange={setShowMilestoneModal}
              />
            </div>
          )}

          {/* Architecture View */}
          {(mainView === 'architecture' || splitViewEnabled) && (
            <div style={{
              flex: splitViewEnabled ? 1 : "auto",
              width: splitViewEnabled ? "50%" : "100%",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: 1,
            }}>
              {/* Wrapper to make modal component work as full-page view */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}>
                <OrgChartBuilderV2
                  onClose={() => splitViewEnabled ? setSplitViewEnabled(false) : setMainView('timeline')}
                  project={currentProject}
                />
              </div>
            </div>
          )}
        </div>

        {/* Resource Panel - Sidebar or Bottom based on user choice */}
        {showOrgChart && (
          <>
            {/* Resizable Divider */}
            <div
              onMouseDown={handleOrgChartResizeStart}
              style={{
                width: resourcePanelLayout === 'sidebar' ? "6px" : "100%",
                height: resourcePanelLayout === 'sidebar' ? "100%" : "6px",
                cursor: resourcePanelLayout === 'sidebar' ? "col-resize" : "row-resize",
                backgroundColor: isResizingOrgChart ? "var(--color-blue)" : "transparent",
                borderLeft: resourcePanelLayout === 'sidebar' ? "1px solid var(--color-gray-4)" : "none",
                borderRight: resourcePanelLayout === 'sidebar' ? "1px solid var(--color-gray-4)" : "none",
                borderTop: resourcePanelLayout === 'bottom' ? "1px solid var(--color-gray-4)" : "none",
                borderBottom: resourcePanelLayout === 'bottom' ? "1px solid var(--color-gray-4)" : "none",
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
                  padding: resourcePanelLayout === 'sidebar' ? "8px 2px" : "2px 8px",
                  backgroundColor: isResizingOrgChart ? "var(--color-blue)" : "rgba(0, 122, 255, 0.15)",
                  borderRadius: "4px",
                  pointerEvents: "none",
                  opacity: isResizingOrgChart ? 1 : 0.6,
                  transition: "opacity 0.15s ease",
                }}
              >
                {resourcePanelLayout === 'sidebar' ? (
                  <GripVertical className="w-3 h-3" style={{ color: isResizingOrgChart ? "#fff" : "var(--color-blue)" }} />
                ) : (
                  <GripHorizontal className="w-4 h-4" style={{ color: isResizingOrgChart ? "#fff" : "var(--color-blue)" }} />
                )}
              </div>
            </div>

            {/* Resource Panel Content */}
            <div
              style={{
                width: resourcePanelLayout === 'sidebar' ? `${orgChartHeight}px` : "100%",
                height: resourcePanelLayout === 'sidebar' ? "100%" : `${orgChartHeight}px`,
                minWidth: resourcePanelLayout === 'sidebar' ? "300px" : "auto",
                maxWidth: resourcePanelLayout === 'sidebar' ? "600px" : "none",
                backgroundColor: "var(--color-bg-primary)",
                overflow: "auto",
                animation: resourcePanelLayout === 'sidebar' ? "slideInRight 0.3s ease" : "slideUp 0.3s ease",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Resource Panel Header - Jobs/Ive: Clear, Purposeful */}
              <div style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--color-gray-4)",
                backgroundColor: "#fff",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#000",
                      marginBottom: "4px",
                    }}>
                      Resource Panel
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "12px",
                      color: "#666",
                      lineHeight: "1.4",
                    }}>
                      {currentProject.resources?.length || 0} people • Organizational hierarchy
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Layout Toggle */}
                    <div style={{
                      display: "flex",
                      backgroundColor: "var(--color-gray-6)",
                      borderRadius: "6px",
                      padding: "2px",
                    }}>
                      <button
                        onClick={() => setResourcePanelLayout('sidebar')}
                        aria-label="Display resource panel on the side"
                        aria-pressed={resourcePanelLayout === 'sidebar'}
                        title="Side panel layout"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "none",
                          backgroundColor: resourcePanelLayout === 'sidebar' ? "#fff" : "transparent",
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: resourcePanelLayout === 'sidebar' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                          color: resourcePanelLayout === 'sidebar' ? "#000" : "#666",
                        }}
                      >
                        Side
                      </button>
                      <button
                        onClick={() => setResourcePanelLayout('bottom')}
                        aria-label="Display resource panel at the bottom"
                        aria-pressed={resourcePanelLayout === 'bottom'}
                        title="Bottom panel layout"
                        style={{
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "none",
                          backgroundColor: resourcePanelLayout === 'bottom' ? "#fff" : "transparent",
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: resourcePanelLayout === 'bottom' ? "0 1px 3px rgba(0, 0, 0, 0.1)" : "none",
                          color: resourcePanelLayout === 'bottom' ? "#000" : "#666",
                        }}
                      >
                        Bottom
                      </button>
                    </div>

                    {/* Hide Button */}
                    <button
                      onClick={() => setShowOrgChart(false)}
                      aria-label="Hide resource panel"
                      title="Hide panel"
                      style={{
                        padding: "8px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-gray-4)",
                        backgroundColor: "transparent",
                        fontFamily: "var(--font-text)",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-gray-6)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      Hide
                    </button>
                  </div>
                </div>

                {/* Three-Tier Resource Breakdown - Apple UX: Clear categorization */}
                {(() => {
                  const resources = currentProject.resources || [];

                  // Tier 1: In Org Chart (resources with manager relationships)
                  const orgChartResources = resources.filter(r => r.managerResourceId !== undefined && r.managerResourceId !== null);

                  // Tier 2: Resource Pool (resources without manager assigned)
                  const poolResources = resources.filter(r => !r.managerResourceId);

                  // Tier 3: Calculate assigned resources (in tasks/phases)
                  const assignedResourceIds = new Set<string>();
                  currentProject.phases?.forEach(phase => {
                    phase.phaseResourceAssignments?.forEach(assignment => {
                      assignedResourceIds.add(assignment.resourceId);
                    });
                    phase.tasks?.forEach(task => {
                      task.resourceAssignments?.forEach(assignment => {
                        assignedResourceIds.add(assignment.resourceId);
                      });
                    });
                  });

                  const assignedCount = assignedResourceIds.size;
                  const utilization = resources.length > 0
                    ? Math.round((assignedCount / resources.length) * 100)
                    : 0;

                  // Determine utilization color (Apple HIG)
                  const getUtilizationColor = (util: number) => {
                    if (util >= 80) return '#34C759'; // Green - high utilization
                    if (util >= 50) return '#FF9500'; // Orange - medium utilization
                    return '#8E8E93'; // Gray - low utilization
                  };

                  return (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}>
                      {/* Tier 1: In Org Chart */}
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#F5F5F7",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}>
                            In Org Chart
                          </div>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#007AFF",
                          }}>
                            {orgChartResources.length}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          color: "#86868B",
                          lineHeight: "1.4",
                        }}>
                          Resources with reporting structure
                        </div>

                        {/* Category breakdown for org chart resources */}
                        <div style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px",
                          marginTop: "12px",
                        }}>
                          {(['leadership', 'pm', 'technical', 'functional', 'change', 'qa', 'basis', 'security'] as const).map(category => {
                            const count = orgChartResources.filter(r => r.category === category).length;
                            if (count === 0) return null;
                            return (
                              <div key={category} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                color: "#666",
                              }}>
                                <ResourceIcon category={category} className="w-3 h-3" color="#007AFF" />
                                <span style={{ flex: 1, textTransform: "capitalize" }}>
                                  {category === 'pm' ? 'PM' : category}
                                </span>
                                <span style={{ fontWeight: 600, color: "#000" }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tier 2: Resource Pool */}
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#FAFAFA",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 0, 0, 0.06)",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}>
                            Resource Pool
                          </div>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "18px",
                            fontWeight: 600,
                            color: "#8E8E93",
                          }}>
                            {poolResources.length}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          color: "#86868B",
                          lineHeight: "1.4",
                        }}>
                          Unassigned to org structure
                        </div>
                      </div>

                      {/* Tier 3: Assignment & Utilization */}
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "rgba(0, 122, 255, 0.08)",
                        borderRadius: "8px",
                        border: "1px solid rgba(0, 122, 255, 0.15)",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}>
                            In Tasks/Phases
                          </div>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "18px",
                            fontWeight: 600,
                            color: getUtilizationColor(utilization),
                          }}>
                            {assignedCount}
                          </div>
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                          color: "#86868B",
                          lineHeight: "1.4",
                          marginBottom: "10px",
                        }}>
                          Currently assigned resources
                        </div>

                        {/* Utilization bar */}
                        <div style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: "#E5E5EA",
                          borderRadius: "3px",
                          overflow: "hidden",
                          marginBottom: "6px",
                        }}>
                          <div style={{
                            width: `${utilization}%`,
                            height: "100%",
                            backgroundColor: getUtilizationColor(utilization),
                            borderRadius: "3px",
                            transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)", // Apple easing
                          }} />
                        </div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "var(--font-text)",
                          fontSize: "11px",
                        }}>
                          <span style={{ color: "#86868B" }}>Utilization</span>
                          <span style={{
                            fontWeight: 600,
                            color: getUtilizationColor(utilization),
                          }}>
                            {utilization}%
                          </span>
                        </div>
                      </div>

                      {/* Total - Summary */}
                      <div style={{
                        padding: "12px 16px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "8px",
                        border: "2px solid #007AFF",
                        marginTop: "4px",
                      }}>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#1D1D1F",
                          }}>
                            Total Resources
                          </div>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "24px",
                            fontWeight: 700,
                            color: "#007AFF",
                          }}>
                            {resources.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Resource Content Area */}
              <div style={{
                flex: 1,
                padding: "24px",
                overflow: "auto",
              }}>
                {/* Org Chart View - Visual hierarchy */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "24px",
                }}>
                  <div style={{
                    textAlign: "center",
                    maxWidth: "400px",
                  }}>
                    <div style={{
                      fontSize: "48px",
                      marginBottom: "16px",
                    }}>🏢</div>
                    <h3 style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#1d1d1f",
                      marginBottom: "12px",
                    }}>
                      {currentProject.resources && currentProject.resources.length > 0
                        ? "Build Your Org Chart"
                        : "No Team Structure Yet"}
                    </h3>
                    <p style={{
                      fontFamily: "var(--font-text)",
                      fontSize: "14px",
                      color: "#666",
                      lineHeight: "1.6",
                      marginBottom: "24px",
                    }}>
                      {currentProject.resources && currentProject.resources.length > 0
                        ? "Click 'Plan Resources' to create your organizational hierarchy with reporting relationships."
                        : "Add resources first, then use 'Plan Resources' to define your team structure with managers and reporting lines."}
                    </p>
                    <button
                      onClick={() => setMainView('architecture')}
                      aria-label={currentProject.resources && currentProject.resources.length > 0
                        ? "Switch to Architecture view to define team hierarchy"
                        : "Add resources before building organizational chart"}
                      disabled={!currentProject.resources || currentProject.resources.length === 0}
                      title={currentProject.resources && currentProject.resources.length > 0
                        ? "Switch to Architecture View"
                        : "Add resources first"}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#007AFF",
                        color: "#fff",
                        fontFamily: "var(--font-text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: "0 2px 8px rgba(0, 122, 255, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#0051D5";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 122, 255, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#007AFF";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 122, 255, 0.3)";
                      }}
                    >
                      {currentProject.resources && currentProject.resources.length > 0
                        ? "Open Org Chart Builder"
                        : "Add Resources First"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div> {/* End main content */}
      </div> {/* End h-screen container */}

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Plan Resources Button - Robust styling */
        .plan-resources-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 0 12px;
          min-height: 44px;
          border-radius: 6px;
          border: 1px solid var(--color-blue);
          background-color: var(--color-blue-light);
          font-family: var(--font-text);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-blue);
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          user-select: none;
          outline: none;
          position: relative;
          z-index: 1025; /* Above GlobalNav sticky (1020) and dropdowns (1000) */
        }

        .plan-resources-btn:hover {
          background-color: var(--color-blue);
          color: #ffffff;
        }

        .plan-resources-btn:active {
          transform: scale(0.98);
        }

        .plan-resources-btn:focus-visible {
          outline: 2px solid var(--color-blue);
          outline-offset: 2px;
        }

        .plan-resources-icon,
        .plan-resources-text {
          pointer-events: none; /* Prevent child elements from capturing clicks */
          display: flex;
          align-items: center;
        }

        /* ============================================================================
           RESPONSIVE DESIGN - GANTT TOOL V3
           Mobile-first optimizations following Apple HIG
           ============================================================================ */

        /* Tablet and below (1024px) */
        @media (max-width: 1024px) {
          /* Force resource panel to bottom on tablets */
          .flex-1.overflow-hidden.flex {
            flex-direction: column !important;
          }
        }

        /* Mobile devices (768px) */
        @media (max-width: 768px) {
          /* Compact button sizes */
          .plan-resources-btn {
            min-width: 44px;
            min-height: 44px;
            padding: 0 10px;
            font-size: 12px;
          }

          /* Resource panel adjustments */
          .flex-1.overflow-hidden.flex > div:last-child {
            max-height: 50vh; /* Limit bottom panel height on mobile */
          }

          /* Compact stats grid on mobile */
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)) !important;
            gap: 6px !important;
          }
        }

        /* Small mobile devices (640px) */
        @media (max-width: 640px) {
          /* Even more compact buttons */
          .plan-resources-btn {
            padding: 0 8px;
            gap: 4px;
          }

          /* Single column for very small screens */
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }

          /* Reduce font sizes in resource cards */
          div[style*="fontSize: '14px'"][style*="fontWeight: 600"] {
            font-size: 13px !important;
          }

          div[style*="fontSize: '12px'"] {
            font-size: 11px !important;
          }

          /* Compact resource panel header */
          div[style*="padding: '20px 24px'"] {
            padding: 16px 12px !important;
          }

          /* Reduce panel padding */
          div[style*="padding: '24px'"][style*="flex: 1"] {
            padding: 16px !important;
          }
        }

        /* Touch device optimizations */
        @media (pointer: coarse) {
          /* Ensure minimum touch target size */
          button, a[role="button"] {
            min-height: 44px;
            min-width: 44px;
          }

          /* Larger tap areas for resource cards */
          div[draggable="true"] {
            padding: 14px !important;
          }

          /* Increase interactive element spacing */
          .plan-resources-btn,
          button[aria-label*="Toggle"],
          button[aria-label*="Import"] {
            margin: 2px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .plan-resources-btn {
            border-width: 2px;
          }

          /* Enhance resource card borders */
          div[draggable="true"] {
            border-width: 2px !important;
          }
        }

        /* Landscape orientation optimizations for mobile */
        @media (max-width: 768px) and (orientation: landscape) {
          /* Reduce vertical padding in landscape */
          div[style*="height: '100%'"] {
            max-height: 80vh;
          }

          /* More compact resource panel header in landscape */
          div[style*="padding: '20px 24px'"] {
            padding: 12px 16px !important;
          }
        }

        /* Print styles */
        @media print {
          /* Hide interactive elements when printing */
          .plan-resources-btn,
          button[aria-label*="Toggle"],
          button[aria-label*="Share"] {
            display: none !important;
          }

          /* Expand all content for printing */
          .flex-1.overflow-hidden {
            overflow: visible !important;
          }
        }
      `}</style>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={(name, startDate, companyLogos) => createProject(name, startDate, undefined, companyLogos)}
      />

      {/* Excel Import Modal */}
      {showImportModal && (
        <ImportModalV2
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
        />
      )}

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

      {/* View Transition Toast - Apple-style feedback */}
      {viewTransitionToast.visible && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            color: "#ffffff",
            borderRadius: "12px",
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
            zIndex: 10000,
            pointerEvents: "none",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            animation: "toast-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {viewTransitionToast.message}
        </div>
      )}

      {/* Toast Animation */}
      <style jsx>{`
        @keyframes toast-slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
