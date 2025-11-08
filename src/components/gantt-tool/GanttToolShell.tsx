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
import { AlertTriangle } from 'lucide-react';
import { HexLoader } from '@/components/ui/HexLoader';
import { useColorMorph } from '@/hooks/useColorMorph';

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
    isLoading,
    saveProgress,
    syncStatus,
    lastLocalSaveAt,
    cloudSyncPending,
  } = useGanttToolStoreV2();

  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showQuickResourcePanel, setShowQuickResourcePanel] = useState(false);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [showSyncIndicator, setShowSyncIndicator] = useState(true);

  // Get morphing color for animated text
  const morphColor = useColorMorph();

  // Auto-dismiss success messages after 3 seconds (Apple-style)
  useEffect(() => {
    if (syncStatus === 'synced-cloud' && !cloudSyncPending) {
      setShowSyncIndicator(true);
      const timer = setTimeout(() => {
        setShowSyncIndicator(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (syncStatus !== 'idle') {
      setShowSyncIndicator(true);
    }
  }, [syncStatus, cloudSyncPending]);

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
        <HexLoader size="xl" />
      </div>
    );
  }

  // Main Gantt Tool Interface - Apple: "Explicit constraints at every level"
  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ width: '100vw', maxWidth: '100vw' }}
    >
      {/* Toolbar */}
      <GanttToolbar
        showContextPanel={showContextPanel}
        onToggleContextPanel={() => setShowContextPanel(!showContextPanel)}
        showQuickResourcePanel={showQuickResourcePanel}
        onToggleQuickResourcePanel={() => setShowQuickResourcePanel(!showQuickResourcePanel)}
      />

      {/* Apple-Style Floating Sync Status Indicator - Non-intrusive, doesn't affect layout */}
      {syncStatus !== 'idle' && showSyncIndicator && (
        <div
          className="fixed top-20 right-4 z-40 pointer-events-none"
          style={{
            animation: showSyncIndicator
              ? 'slideInFromTop 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'fadeOutUp 0.3s cubic-bezier(0.4, 0, 1, 1)',
          }}
        >
          <div
            className={`
              pointer-events-auto
              backdrop-blur-xl
              rounded-xl
              shadow-lg
              px-4 py-3
              flex items-center gap-3
              text-sm font-medium
              transition-all duration-300
              ${
                syncStatus === 'error'
                  ? 'bg-red-50/90 text-red-900 border border-red-200/50'
                  : syncStatus === 'synced-cloud' && !cloudSyncPending
                  ? 'bg-green-50/90 text-green-900 border border-green-200/50'
                  : 'bg-white/90 text-gray-900 border border-gray-200/50'
              }
            `}
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            {syncStatus === 'saving-local' && (
              <>
                <HexLoader size="sm" />
                <span>💾 Saving locally...</span>
              </>
            )}
            {syncStatus === 'saved-local' && (
              <>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>✓ Saved locally{!navigator.onLine && ' (will sync when online)'}</span>
              </>
            )}
            {syncStatus === 'syncing-cloud' && (
              <>
                <HexLoader size="sm" />
                {saveProgress ? (
                  <span style={{ color: morphColor }}>☁️ {saveProgress.description}</span>
                ) : (
                  <span style={{ color: morphColor }}>☁️ Syncing to cloud...</span>
                )}
              </>
            )}
            {syncStatus === 'synced-cloud' && !cloudSyncPending && (
              <>
                <svg className="w-4 h-4 flex-shrink-0 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>✓ Synced to cloud</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>⚠️ Sync error - changes saved locally</span>
              </>
            )}
            {!navigator.onLine && syncStatus !== 'error' && (
              <span className="ml-1 text-xs opacity-75">📡 Offline</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area - Jobs: "Ruthless containment - nothing escapes its bounds" */}
      <div
        className="flex-1 flex relative"
        style={{ width: '100%', overflow: 'hidden' }}
      >
        {/* Content: Gantt Canvas - Constrained to viewport, scrolls internally */}
        <div
          className="flex-1"
          style={{ overflow: 'hidden', width: '100%' }}
        >
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
