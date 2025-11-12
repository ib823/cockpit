/**
 * Gantt Tool V3 - Apple HIG Specification Page
 *
 * This page showcases the revamped Gantt chart following UI_suggestion.md exactly.
 * Uses the same data store as the original Gantt for real-time sync.
 *
 * Access: /gantt-tool/v3
 */

"use client";

import { GanttCanvasV3 } from "@/components/gantt-tool/GanttCanvasV3";
import { NewProjectModal } from "@/components/gantt-tool/NewProjectModal";
import { OrgChartBuilder } from "@/components/gantt-tool/OrgChartBuilder";
import { ImportModalV2 } from "@/components/gantt-tool/ImportModalV2";
import { ViewModeSelector, type ZoomMode } from "@/components/gantt-tool/ViewModeSelector";
import { GlobalNav } from "@/components/navigation/GlobalNav";
import { Tier2Header } from "@/components/navigation/Tier2Header";
import { useGanttToolStoreV2 as useGanttToolStore } from "@/stores/gantt-tool-store-v2";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { Share2, Users, GripHorizontal, GripVertical, Briefcase, FileSpreadsheet } from "lucide-react";
import { HexLoader } from "@/components/ui/HexLoader";

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
    isLoading
  } = useGanttToolStore();

  const [initializing, setInitializing] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showResourcePlanning, setShowResourcePlanning] = useState(false);
  const [showOrgChart, setShowOrgChart] = useState(false);
  const [orgChartHeight, setOrgChartHeight] = useState(400); // Default 400px (also used for sidebar width)
  const [isResizingOrgChart, setIsResizingOrgChart] = useState(false);
  const [resourcePanelLayout, setResourcePanelLayout] = useState<'sidebar' | 'bottom'>('sidebar'); // User preference

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
          rightContent={
            <>
              {/* Timeline View Selector */}
              <ViewModeSelector
                zoomMode={zoomMode}
                activeZoomMode={activeZoomMode}
                onZoomModeChange={setZoomMode}
              />

              {/* Import Excel Button */}
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                title="Import from Excel"
              >
                <FileSpreadsheet className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
              </button>

              {/* Plan Resources Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Plan Resources clicked');
                  setShowResourcePlanning(true);
                }}
                className="plan-resources-btn"
                title="Design team structure and calculate costs"
              >
                <span className="plan-resources-icon">
                  <Briefcase className="w-4 h-4" />
                </span>
                <span className="plan-resources-text">Plan Resources</span>
              </button>

              {/* Resource Panel Toggle */}
              <button
                type="button"
                onClick={() => setShowOrgChart(!showOrgChart)}
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
                title="Toggle Resource Panel"
              >
                <Users className="w-4 h-4" style={{ color: showOrgChart ? "var(--color-blue)" : "var(--color-text-secondary)" }} />
              </button>

              {/* Share */}
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--color-gray-6)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                title="Share & Export"
              >
                <Share2 className="w-4 h-4" style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </>
          }
        />

      {/* Main Gantt Canvas - Dynamic layout based on user preference */}
      <div className="flex-1 overflow-hidden flex" style={{ flexDirection: resourcePanelLayout === 'sidebar' ? 'row' : 'column' }}>
        {/* Timeline Area */}
        <div className="flex-1 overflow-hidden">
          <GanttCanvasV3 zoomMode={activeZoomMode} />
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
                      {currentProject.resources?.length || 0} people • {resourcePanelLayout === 'sidebar' ? 'Click or drag' : 'Tap or drag'} to assign
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
                        title="Side panel layout"
                      >
                        Side
                      </button>
                      <button
                        onClick={() => setResourcePanelLayout('bottom')}
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
                        title="Bottom panel layout"
                      >
                        Bottom
                      </button>
                    </div>

                    {/* Hide Button */}
                    <button
                      onClick={() => setShowOrgChart(false)}
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

                {/* Quick Stats - Jobs/Ive: Glanceable Information */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}>
                  <div style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--color-gray-6)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    fontWeight: 500,
                    textAlign: "center",
                  }}>
                    <div style={{ color: "#666", marginBottom: "2px" }}>PM</div>
                    <div style={{ color: "#000", fontWeight: 600, fontSize: "14px" }}>
                      {currentProject.resources?.filter(r => r.category === 'manager').length || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--color-gray-6)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    fontWeight: 500,
                    textAlign: "center",
                  }}>
                    <div style={{ color: "#666", marginBottom: "2px" }}>Consultants</div>
                    <div style={{ color: "#000", fontWeight: 600, fontSize: "14px" }}>
                      {currentProject.resources?.filter(r => r.category === 'technical' || r.category === 'functional').length || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--color-gray-6)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    fontWeight: 500,
                    textAlign: "center",
                  }}>
                    <div style={{ color: "#666", marginBottom: "2px" }}>QA</div>
                    <div style={{ color: "#000", fontWeight: 600, fontSize: "14px" }}>
                      {currentProject.resources?.filter(r => r.category === 'qa').length || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: "8px 10px",
                    backgroundColor: "rgba(0, 122, 255, 0.1)",
                    borderRadius: "6px",
                    fontFamily: "var(--font-text)",
                    fontSize: "11px",
                    fontWeight: 500,
                    textAlign: "center",
                  }}>
                    <div style={{ color: "#666", marginBottom: "2px" }}>Total</div>
                    <div style={{ color: "var(--color-blue)", fontWeight: 600, fontSize: "14px" }}>
                      {currentProject.resources?.length || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Cards - Grouped by Role */}
              <div style={{
                flex: 1,
                padding: "24px",
                overflow: "auto",
              }}>
                {currentProject.resources && currentProject.resources.length > 0 ? (
                  <>
                    {/* Group resources by category */}
                    {['manager', 'technical', 'functional', 'qa'].map((category) => {
                      const categoryResources = currentProject.resources.filter(r => r.category === category);
                      if (categoryResources.length === 0) return null;

                      const categoryLabel = {
                        'manager': 'Project Managers',
                        'technical': 'Technical Consultants',
                        'functional': 'Functional Consultants',
                        'qa': 'Quality Assurance'
                      }[category] || category;

                      return (
                        <div key={category} style={{ marginBottom: "32px" }}>
                          {/* Category Header */}
                          <div style={{
                            fontFamily: "var(--font-text)",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#000",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            marginBottom: "12px",
                            opacity: 0.6,
                          }}>
                            {categoryLabel} ({categoryResources.length})
                          </div>

                          {/* Resource Cards - Responsive grid */}
                          <div style={{
                            display: resourcePanelLayout === 'sidebar' ? "flex" : "grid",
                            flexDirection: resourcePanelLayout === 'sidebar' ? "column" : undefined,
                            gridTemplateColumns: resourcePanelLayout === 'bottom' ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
                            gap: resourcePanelLayout === 'sidebar' ? "10px" : "12px",
                          }}>
                            {categoryResources.map((resource) => {
                              // Calculate utilization (mock for now - will be real data later)
                              const utilization = Math.floor(Math.random() * 100);
                              const isOverloaded = utilization > 80;
                              const isAvailable = utilization < 50;

                              return (
                                <div
                                  key={resource.id}
                                  draggable
                                  style={{
                                    padding: "12px",
                                    borderRadius: "6px",
                                    border: `2px solid ${isOverloaded ? '#FF3B30' : isAvailable ? '#34C759' : 'var(--color-gray-4)'}`,
                                    backgroundColor: "#fff",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    position: "relative",
                                    touchAction: "none", // Enable touch handling
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 122, 255, 0.15)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                    e.currentTarget.style.transform = "translateY(0)";
                                  }}
                                  onDragStart={(e) => {
                                    e.currentTarget.style.opacity = "0.5";
                                    e.dataTransfer.effectAllowed = "copy";
                                    e.dataTransfer.setData("resourceId", resource.id);
                                    e.dataTransfer.setData("resourceName", resource.name);
                                  }}
                                  onDragEnd={(e) => {
                                    e.currentTarget.style.opacity = "1";
                                  }}
                                  onClick={() => {
                                    // Future: Open resource details or quick-assign modal
                                    console.log(`Selected resource: ${resource.name} (${resource.id})`);
                                  }}
                                  onTouchStart={(e) => {
                                    // Touch support for mobile
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 122, 255, 0.15)";
                                  }}
                                  onTouchEnd={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                  title={`${resource.name} - ${isAvailable ? "Available" : isOverloaded ? "Over capacity" : "Partially allocated"} (${utilization}%)`}
                                >
                                  {/* Status Badge */}
                                  <div style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: isOverloaded ? '#FF3B30' : isAvailable ? '#34C759' : '#FF9500',
                                  }} title={isOverloaded ? "Overloaded" : isAvailable ? "Available" : "Partially allocated"} />

                                  {/* Name & Role */}
                                  <div style={{
                                    fontFamily: "var(--font-text)",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    color: "#000",
                                    marginBottom: "2px",
                                    paddingRight: "20px",
                                  }}>
                                    {resource.name}
                                  </div>
                                  <div style={{
                                    fontFamily: "var(--font-text)",
                                    fontSize: "12px",
                                    color: "#666",
                                    marginBottom: "10px",
                                  }}>
                                    {resource.designation}
                                  </div>

                                  {/* Capacity Bar */}
                                  <div style={{
                                    marginBottom: "8px",
                                  }}>
                                    <div style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: "4px",
                                    }}>
                                      <span style={{
                                        fontFamily: "var(--font-text)",
                                        fontSize: "11px",
                                        color: "#999",
                                        fontWeight: 500,
                                      }}>
                                        Capacity
                                      </span>
                                      <span style={{
                                        fontFamily: "var(--font-text)",
                                        fontSize: "11px",
                                        color: isOverloaded ? '#FF3B30' : isAvailable ? '#34C759' : '#000',
                                        fontWeight: 600,
                                      }}>
                                        {utilization}%
                                      </span>
                                    </div>
                                    <div style={{
                                      width: "100%",
                                      height: "4px",
                                      backgroundColor: "var(--color-gray-6)",
                                      borderRadius: "2px",
                                      overflow: "hidden",
                                    }}>
                                      <div style={{
                                        width: `${utilization}%`,
                                        height: "100%",
                                        backgroundColor: isOverloaded ? '#FF3B30' : isAvailable ? '#34C759' : '#FF9500',
                                        transition: "width 0.3s ease",
                                      }} />
                                    </div>
                                  </div>

                                  {/* Quick Info */}
                                  <div style={{
                                    fontFamily: "var(--font-text)",
                                    fontSize: "11px",
                                    color: "#999",
                                    fontStyle: "italic",
                                  }}>
                                    {isAvailable ? "Available now" : isOverloaded ? "Over capacity" : "Partially allocated"}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div style={{
                    padding: "48px",
                    textAlign: "center",
                    fontFamily: "var(--font-text)",
                    fontSize: "14px",
                    color: "#999",
                  }}>
                    No resources found. Add resources to start planning your team.
                  </div>
                )}
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
          height: 36px;
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

        /* Responsive styles handled by Tier2Header and ViewModeSelector components */
      `}</style>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={createProject}
      />

      {/* Excel Import Modal */}
      {showImportModal && (
        <ImportModalV2
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Org Chart Builder Modal */}
      {showResourcePlanning && (
        <OrgChartBuilder
          onClose={() => setShowResourcePlanning(false)}
        />
      )}
    </>
  );
}
