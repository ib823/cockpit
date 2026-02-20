/**
 * Gantt Tool V3 - Apple HIG Specification Page
 *
 * This page showcases the revamped Gantt chart following UI_suggestion.md exactly.
 * Uses the unified project store for Timeline and Architecture data.
 *
 * Route: /gantt-tool
 * Features: Timeline Gantt chart view with intelligent zoom modes
 * Keyboard shortcuts: ⌘P (Add Phase), ⌘T (Add Task)
 */

"use client";

import dynamic from "next/dynamic";
import { GanttCanvasV3 } from "@/components/gantt-tool/GanttCanvasV3";
// Lazy-load modals and heavy tabs (E-02: route-level code splitting)
const NewProjectModal = dynamic(() => import("@/components/gantt-tool/NewProjectModal").then(m => ({ default: m.NewProjectModal })), { ssr: false });
const ImportModal = dynamic(() => import("@/components/gantt-tool/ImportModal").then(m => ({ default: m.ImportModal })), { ssr: false });
const AddPhaseModal = dynamic(() => import("@/components/gantt-tool/AddPhaseModal").then(m => ({ default: m.AddPhaseModal })), { ssr: false });
const AddTaskModal = dynamic(() => import("@/components/gantt-tool/AddTaskModal").then(m => ({ default: m.AddTaskModal })), { ssr: false });
const LogoLibraryModal = dynamic(() => import("@/components/gantt-tool/LogoLibraryModal").then(m => ({ default: m.LogoLibraryModal })), { ssr: false });
const OrgChartPro = dynamic(() => import("@/components/gantt-tool/OrgChartPro").then(m => ({ default: m.OrgChartPro })), { ssr: false });
const ResourceDashboardModal = dynamic(() => import("@/components/gantt-tool/ResourceDashboardModal").then(m => ({ default: m.ResourceDashboardModal })), { ssr: false });
// ResourceCapacityPanel is now integrated directly into GanttCanvasV3
import { ViewModeSelector, type ZoomMode } from "@/components/gantt-tool/ViewModeSelector";
import { ProjectTabNavigation, type ProjectTab } from "@/components/gantt-tool/ProjectTabNavigation";
const ProjectContextTab = dynamic(() => import("@/components/gantt-tool/ProjectContextTab").then(m => ({ default: m.ProjectContextTab })), { ssr: false });
const FinancialsTab = dynamic(() => import("@/components/gantt-tool/FinancialsTab").then(m => ({ default: m.FinancialsTab })), { ssr: false });
import { useFinancialAccess } from "@/hooks/useFinancialAccess";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { Tier2Header } from "@/components/navigation/Tier2Header";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Share2, Users, GripHorizontal, GripVertical, FileSpreadsheet, Flag, Layers, CheckSquare, Image as ImageIcon } from "lucide-react";
import { HexLoader } from "@/components/ui/HexLoader";
import { format } from "date-fns";
import { getTotalResourceCount } from "@/lib/gantt-tool/resource-utils";
import { getOrphanedResourceIds } from "@/lib/gantt-tool/resource-diagnostics";

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
    deleteResource,
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
  const [showOrgChartModal, setShowOrgChartModal] = useState(false);
  const [orgChartHeight, setOrgChartHeight] = useState(400); // Default 400px (also used for sidebar width)
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [isResizingOrgChart, setIsResizingOrgChart] = useState(false);
  const [resourcePanelLayout, setResourcePanelLayout] = useState<'sidebar' | 'bottom'>('sidebar'); // User preference
  const [_resourcePanelView, _setResourcePanelView] = useState<'category' | 'orgchart'>('orgchart'); // View mode - always org chart
  const [activeTab, setActiveTab] = useState<ProjectTab>('timeline'); // Project view tabs
  const [isCapacityPanelExpanded, setIsCapacityPanelExpanded] = useState(false); // Capacity panel below Gantt

  // Financial access check - determines if Financials tab should be shown
  const { hasAccess: hasFinancialAccess, isLoading: isFinancialAccessLoading } = useFinancialAccess(currentProject?.id);

  // Milestone modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  // Resource Dashboard modal state
  const [showResourceDashboard, setShowResourceDashboard] = useState(false);

  // Selection state for resources, phases, and tasks
  const [_selectedResourceId, _setSelectedResourceId] = useState<string | null>(null);
  const [selectedPhaseId, _setSelectedPhaseId] = useState<string | null>(null);
  const [_selectedTaskId, _setSelectedTaskId] = useState<string | null>(null);

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

  // Check if project is already loaded on mount
  useEffect(() => {
    // If project already loaded, we're good
    if (currentProject) {
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
    try {
      await deleteProject(projectId);
      // If the deleted project was the current one, unload it
      if (currentProject?.id === projectId) {
        unloadCurrentProject();
      }
    } catch (error) {
      // Error is already stored in syncError state by the store
      // The error will be displayed via the syncStatus in the header
      console.error('[GanttTool] Failed to delete project:', error);
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

  return showLoading ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <HexLoader size="xl" />
    </div>
  ) : (
    <>
      {/* Global Navigation - Tier 1 */}
      <GlobalNav session={session} />

      {/* Jobs/Ive: "It just works" - Support any zoom level, any screen size */}
      {/* WCAG 2.1: Content must be usable at 200% zoom without horizontal scrolling */}
      <div
        className="flex flex-col bg-white"
        style={{
          minHeight: "calc(100vh - 56px)", // Minimum height, but allows growth
          maxHeight: "none", // No maximum height restriction
        }}
      >
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
              {/* Timeline View Selector - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
                <ViewModeSelector
                  zoomMode={zoomMode}
                  activeZoomMode={activeZoomMode}
                  onZoomModeChange={setZoomMode}
                />
              )}

              {/* Add Phase Button - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
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
              )}

              {/* Add Task Button - Only show on Timeline tab */}
              {activeTab === 'timeline' && (() => {
                // Check if selected phase is AMS with max tasks (1)
                const selectedPhase = currentProject?.phases.find(p => p.id === selectedPhaseId);
                const isAMSPhaseAtLimit = selectedPhase?.phaseType === 'ams' && (selectedPhase?.tasks?.length ?? 0) >= 1;
                const isDisabled = !currentProject || currentProject.phases.length === 0 || isAMSPhaseAtLimit;

                let tooltipText = "Add Task (⌘T)";
                if (!currentProject || currentProject.phases.length === 0) {
                  tooltipText = "Add a phase first";
                } else if (isAMSPhaseAtLimit) {
                  tooltipText = "AMS phases can only have one task";
                }

                return (
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(true)}
                    disabled={isDisabled}
                    aria-label="Add task (⌘T)"
                    title={tooltipText}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "44px",
                      height: "44px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      backgroundColor: "transparent",
                      color: !isDisabled ? "var(--color-text-secondary)" : "var(--color-gray-3)",
                      cursor: !isDisabled ? "pointer" : "not-allowed",
                      opacity: !isDisabled ? 1 : 0.5,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                  >
                    <CheckSquare className="w-4 h-4" aria-hidden="true" />
                  </button>
                );
              })()}

              {/* Add Milestone Button - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
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
              )}

              {/* Import Excel Button - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
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
              )}

              {/* Manage Logos Button - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
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
              )}

              {/* Resource Allocation Panel Toggle - Only show on Timeline tab */}
              {activeTab === 'timeline' && (
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
              )}

              {/* Share Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
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

        {/* Project Tab Navigation */}
        {currentProject && (
          <ProjectTabNavigation
            activeTab={activeTab}
            onTabChange={setActiveTab}
            disabled={!currentProject}
            showFinancialsTab={hasFinancialAccess && !isFinancialAccessLoading}
          />
        )}

      {/* Main Content Area - Tab Content */}
      {/* Jobs: "No artificial constraints" - Let content breathe */}
      {activeTab === 'timeline' && (
        <div
        className="flex-1 flex"
        style={{
          flexDirection: resourcePanelLayout === 'sidebar' ? 'row' : 'column',
          overflow: 'visible', // Allow content to be visible at any zoom
          minHeight: 0, // Flexbox fix for scroll containers
        }}
      >
        {/* Timeline View - GanttCanvasV3 handles everything including resource capacity */}
        <div className="flex-1" style={{ minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <GanttCanvasV3
            zoomMode={activeZoomMode}
            showMilestoneModal={showMilestoneModal}
            onShowMilestoneModalChange={setShowMilestoneModal}
            showResourceCapacity={isCapacityPanelExpanded}
            onToggleResourceCapacity={() => setIsCapacityPanelExpanded(!isCapacityPanelExpanded)}
            hasFinancialAccess={hasFinancialAccess}
          />
        </div>

        {/* Resource Panel - Sidebar or Bottom based on user choice */}
        {showOrgChart && (
          <>
            {/* Resizable Divider */}
            <div
              role="separator"
              tabIndex={0}
              aria-label="Resize panel"
              onMouseDown={handleOrgChartResizeStart}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOrgChartResizeStart(e as unknown as React.MouseEvent); }}
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
                      {/* GLOBAL POLICY: Use canonical function for consistency */}
                      {getTotalResourceCount(currentProject)} people • Organizational hierarchy
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

                {/* Simplified Resource Panel - Jobs/Ive: Ruthless simplicity */}
                {(() => {
                  const totalResourcesCanonical = getTotalResourceCount(currentProject);
                  const orphanedIds = getOrphanedResourceIds(currentProject);

                  return (
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      padding: "24px",
                    }}>
                      {/* Total Resources - Single source of truth */}
                      <div style={{
                        textAlign: "center",
                        padding: "32px 24px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        border: "2px solid #007AFF",
                      }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "48px",
                          fontWeight: 700,
                          color: "#007AFF",
                          lineHeight: 1,
                          marginBottom: "8px",
                        }}>
                          {totalResourcesCanonical}
                        </div>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#1D1D1F",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Total Resources
                        </div>
                      </div>

                      {/* Orphaned Resources Warning - Only show if issues exist */}
                      {orphanedIds.length > 0 && (
                        <div style={{
                          padding: "16px",
                          backgroundColor: "#FFF3E0",
                          borderRadius: "8px",
                          border: "1px solid #FF9500",
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "12px",
                          }}>
                            <div style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#FF9500",
                            }} />
                            <div style={{
                              fontFamily: "var(--font-text)",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#1D1D1F",
                            }}>
                              {orphanedIds.length} {orphanedIds.length === 1 ? 'resource' : 'resources'} need attention
                            </div>
                          </div>
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "12px",
                            color: "#E65100",
                            lineHeight: "1.5",
                            marginBottom: "12px",
                          }}>
                            Not visible in org chart due to invalid manager references
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <button
                              onClick={async () => {
                                const confirmed = window.confirm(
                                  `Delete ${orphanedIds.length} orphaned resource${orphanedIds.length > 1 ? 's' : ''}?\n\nThis action cannot be undone.`
                                );
                                if (confirmed) {
                                  const _resources = currentProject.resources || [];
                                  for (const id of orphanedIds) {
                                    await deleteResource(id);
                                  }
                                  alert(`Successfully deleted ${orphanedIds.length} orphaned resource${orphanedIds.length > 1 ? 's' : ''}.`);
                                }
                              }}
                              style={{
                                padding: "10px 16px",
                                width: "100%",
                                backgroundColor: "#FF3B30",
                                border: "none",
                                borderRadius: "8px",
                                color: "#FFFFFF",
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "background-color 100ms",
                                fontFamily: "var(--font-text)",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D70015")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF3B30")}
                            >
                              Delete Orphaned Resources
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Primary Actions - Jobs/Ive: Clear hierarchy of actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button
                          onClick={() => setShowOrgChartModal(true)}
                          style={{
                            padding: "16px 20px",
                            backgroundColor: "#007AFF",
                            border: "none",
                            borderRadius: "12px",
                            color: "#FFFFFF",
                            fontFamily: "var(--font-text)",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
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
                          Open Org Chart
                        </button>

                        <button
                          onClick={() => setShowResourceDashboard(true)}
                          style={{
                            padding: "16px 20px",
                            backgroundColor: "#FFFFFF",
                            border: "2px solid #E5E5EA",
                            borderRadius: "12px",
                            color: "#1D1D1F",
                            fontFamily: "var(--font-text)",
                            fontSize: "15px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#007AFF";
                            e.currentTarget.style.backgroundColor = "rgba(0, 122, 255, 0.05)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#E5E5EA";
                            e.currentTarget.style.backgroundColor = "#FFFFFF";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          Resource Dashboard
                        </button>
                      </div>

                      {/* Info Text - Jobs/Ive: Subtle guidance */}
                      <div style={{
                        padding: "16px",
                        backgroundColor: "rgba(0, 0, 0, 0.03)",
                        borderRadius: "8px",
                        textAlign: "center",
                      }}>
                        <div style={{
                          fontFamily: "var(--font-text)",
                          fontSize: "12px",
                          color: "#86868B",
                          lineHeight: "1.5",
                        }}>
                          Manage your team structure in Org Chart.
                          <br />
                          View detailed analytics in Resource Dashboard.
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        )}
        </div>
      )}

      {/* Context Tab View */}
      {activeTab === 'context' && currentProject && (
        <div className="flex-1 overflow-auto bg-gray-50">
          <ProjectContextTab
            projectId={currentProject.id}
            initialContext={currentProject.businessContext as { painPoints?: string; skills?: string[] } | undefined}
            onSave={() => {
              loadProject(currentProject.id);
            }}
            onNavigateToTimeline={() => setActiveTab('timeline')}
          />
        </div>
      )}

      {/* Financials Tab View - Protected, only shown for authorized users */}
      {activeTab === 'financials' && currentProject && hasFinancialAccess && (
        <div className="flex-1 overflow-auto bg-gray-50">
          <FinancialsTab project={currentProject} />
        </div>
      )}

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
        preselectedPhaseId={selectedPhaseId || undefined}
      />

      {/* Logo Library Modal */}
      <LogoLibraryModal
        isOpen={showLogoLibrary}
        onClose={() => setShowLogoLibrary(false)}
      />

      {/* Org Chart Builder Modal - Apple UX: Instant access, no page navigation */}
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
    </>
  );
}
