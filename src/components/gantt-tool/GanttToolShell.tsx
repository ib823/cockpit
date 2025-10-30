/**
 * Gantt Tool - Main Shell Component
 *
 * Main container that orchestrates all sub-components.
 * Handles project initialization and overall layout.
 */

'use client';

import { useEffect, useState } from 'react';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { GanttToolbar } from './GanttToolbar';
import { GanttCanvas } from './GanttCanvas';
import { GanttSidePanel } from './GanttSidePanel';
import { QuickResourcePanel } from './QuickResourcePanel';
import { MissionControlModal } from './MissionControlModal';
import { format } from 'date-fns';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { GhostLoader } from '@/components/common';

export function GanttToolShell() {
  const {
    currentProject,
    projects,
    createProject,
    loadProject,
    fetchProjects,
    openSidePanel,
    manuallyUnloaded,
    undo,
    redo,
    isSyncing,
    syncError,
    isLoading,
  } = useGanttToolStoreV2();

  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showQuickResourcePanel, setShowQuickResourcePanel] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const { undo } = useGanttToolStoreV2.getState();
        undo();
      }
      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        const { redo } = useGanttToolStoreV2.getState();
        redo();
      }
      // Ctrl+Y or Cmd+Y for redo (alternative)
      else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        const { redo } = useGanttToolStoreV2.getState();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies - get functions from store directly

  // Fetch projects from database on mount
  useEffect(() => {
    const loadInitialProjects = async () => {
      try {
        await fetchProjects();
      } catch (error) {
        console.error('[GanttToolShell] Initial fetch failed:', error);
      } finally {
        setInitialFetchDone(true);
      }
    };
    loadInitialProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-load the most recent project or create a default one
  useEffect(() => {
    // CRITICAL: Only run after initial fetch is complete
    // This prevents race conditions where we try to create a project while still loading the projects list
    if (initialFetchDone && !isLoading && !currentProject && !manuallyUnloaded && !autoLoadError) {
      const autoLoad = async () => {
        try {
          if (projects.length > 0) {
            // Load the most recently updated project
            const sortedProjects = [...projects].sort(
              (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
            await loadProject(sortedProjects[0].id);
          } else {
            // Create a default project with unique name if none exist
            const today = format(new Date(), 'yyyy-MM-dd');
            const timestamp = Date.now();
            const projectName = `Project ${format(new Date(), 'yyyy-MM-dd HH:mm')}`;
            await createProject(projectName, today);
          }
        } catch (error) {
          console.error('[GanttToolShell] Auto-load failed:', error);
          setAutoLoadError(error instanceof Error ? error.message : 'Failed to load project');
        }
      };

      autoLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFetchDone, isLoading, projects.length, currentProject, manuallyUnloaded, autoLoadError])

  // Error State - Show when auto-load fails
  if (autoLoadError && !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Project</h2>
          <p className="text-gray-600 mb-6">{autoLoadError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setAutoLoadError(null);
                setInitialFetchDone(false);
                fetchProjects().finally(() => setInitialFetchDone(true));
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setAutoLoadError(null);
                const today = format(new Date(), 'yyyy-MM-dd');
                const projectName = `New Project ${format(new Date(), 'MMM dd, HH:mm')}`;
                createProject(projectName, today).catch((err) => {
                  setAutoLoadError(err instanceof Error ? err.message : 'Failed to create project');
                });
              }}
              className="w-full px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Create New Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading State - Show while loading or when project is being auto-created
  if (isLoading || !currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <GhostLoader />
          <p className="mt-4 text-gray-600 text-lg">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  // Main Gantt Tool Interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <GanttToolbar
        showContextPanel={showContextPanel}
        onToggleContextPanel={() => setShowContextPanel(!showContextPanel)}
        showQuickResourcePanel={showQuickResourcePanel}
        onToggleQuickResourcePanel={() => setShowQuickResourcePanel(!showQuickResourcePanel)}
      />

      {/* Sync Error Banner */}
      {syncError && (
        <div className="bg-red-50 border-b-2 border-red-200 px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">Sync Error</p>
                <p className="text-sm text-red-700">{syncError}</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Clear sync error in store
                const store = useGanttToolStoreV2.getState();
                store.saveProject(); // Retry save
              }}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving changes...</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Content: Gantt Canvas */}
        <div className="flex-1 overflow-auto">
          <GanttCanvas />
        </div>

        {/* Quick Resource Panel - Jobs/Ive: Only visible when summoned */}
        <QuickResourcePanel
          isOpen={showQuickResourcePanel}
          onClose={() => setShowQuickResourcePanel(false)}
        />

        {/* Side Panel (Add/Edit Forms) */}
        <GanttSidePanel />
      </div>

      {/* Mission Control - Full-screen command center for deep analysis */}
      <MissionControlModal
        isOpen={showContextPanel}
        onClose={() => setShowContextPanel(false)}
      />
    </div>
  );
}
