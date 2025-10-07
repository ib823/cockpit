/**
 * UNIFIED PROJECT STORE
 *
 * Consolidates data from Estimator → Project → Present workflow.
 * Provides seamless data continuity across all tiers.
 *
 * Per spec: Roadmap_and_DoD.md P2-1
 *
 * Features:
 * - Single source of truth for project data
 * - Versioned schema for safe migrations
 * - Backward compatibility with legacy stores
 * - Dual-write pattern during transition
 * - Type-safe with full TypeScript support
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Chip, Phase, Resource, Task } from '@/types/core';
import type { EstimatorInputs } from '@/lib/estimator/formula-engine';

// Import legacy stores for dual-write pattern
// Conditional imports to avoid circular dependencies during initial load
let usePresalesStore: any;
let useTimelineStore: any;
let useProjectStore: any;

if (typeof window !== 'undefined') {
  import('./presales-store').then(module => {
    usePresalesStore = module.usePresalesStore;
  });
  import('./timeline-store').then(module => {
    useTimelineStore = module.useTimelineStore;
  });
  import('./project-store').then(module => {
    useProjectStore = module.useProjectStore;
  });
}

// ============================================================================
// VERSIONING
// ============================================================================

const UNIFIED_STORE_VERSION = 1;

interface StoreMetadata {
  version: number;
  createdAt: Date;
  updatedAt: Date;
  migratedFrom?: 'legacy' | 'v0';
}

// ============================================================================
// UNIFIED PROJECT INTERFACE
// ============================================================================

/**
 * Unified project data model
 * Combines data from all tiers: Estimator, Presales, Timeline, Present
 */
export interface UnifiedProject {
  // Core identity
  id: string;
  name: string;
  metadata: StoreMetadata;

  // Source tier (where project originated)
  source: 'estimator' | 'project' | 'import';

  // Tier 1: Estimator data (Quick Estimate)
  estimator: {
    inputs?: EstimatorInputs;
    result?: {
      totalEffort: number;
      duration: { weeks: number; months: number };
      fte: number;
      confidence: number;
      description: string;
    };
    completedAt?: Date;
  };

  // Tier 2: Presales data (Requirements & Decisions)
  presales: {
    chips: Chip[];
    decisions: Record<string, any>;
    completeness: {
      score: number;
      gaps: string[];
      blockers: string[];
      canProceed: boolean;
    };
    mode: 'capture' | 'decide' | 'plan' | 'review' | 'present';
  };

  // Tier 3: Timeline data (Project Plan)
  timeline: {
    profile: any | null;
    phases: Phase[];
    selectedPackages: string[];
    resources: Resource[];
    holidays: any[];
    phaseColors: Record<string, string>;
    region: string;
    zoomLevel: 'week' | 'month' | 'quarter';
    generatedAt?: Date;
  };

  // Manual edits & overrides
  overrides: {
    phaseId: string;
    field: 'duration' | 'effort' | 'resources';
    originalValue: any;
    manualValue: any;
    reason?: string;
    timestamp: Date;
  }[];

  // Presentation settings
  presentation: {
    mode: boolean; // client presentation mode
    template?: string;
    slides?: any[];
    notes?: Record<string, string>;
  };

  // UI state (panel sizes, selected items)
  ui: {
    mode: 'capture' | 'decide' | 'plan' | 'present';
    leftPanelWidth: number;
    rightPanelWidth: number;
    selectedPhaseId: string | null;
  };

  // Flags
  flags: {
    timelineIsStale: boolean;
    hasManualEdits: boolean;
  };
}

// ============================================================================
// LEGACY STORE MIGRATION
// ============================================================================

/**
 * Migrate from legacy stores to unified format
 */
export function migrateFromLegacyStores(
  presalesData: any,
  timelineData: any,
  projectData: any
): UnifiedProject {
  const now = new Date();

  return {
    id: projectData?.projectId || 'migrated-project',
    name: 'Migrated Project',
    metadata: {
      version: UNIFIED_STORE_VERSION,
      createdAt: now,
      updatedAt: now,
      migratedFrom: 'legacy',
    },
    source: 'project',
    estimator: {
      inputs: undefined,
      result: undefined,
    },
    presales: {
      chips: presalesData?.chips || [],
      decisions: presalesData?.decisions || {},
      completeness: presalesData?.completeness || {
        score: 0,
        gaps: [],
        blockers: [],
        canProceed: false,
      },
      mode: presalesData?.mode || 'capture',
    },
    timeline: {
      profile: timelineData?.profile || null,
      phases: timelineData?.phases || [],
      selectedPackages: timelineData?.selectedPackages || [],
      resources: timelineData?.resources || [],
      holidays: timelineData?.holidays || [],
      phaseColors: timelineData?.phaseColors || {},
      region: timelineData?.region || 'ABMY',
      zoomLevel: timelineData?.zoomLevel || 'month',
      generatedAt: projectData?.lastGeneratedAt,
    },
    overrides: projectData?.manualOverrides || [],
    presentation: {
      mode: timelineData?.clientPresentationMode || false,
      template: undefined,
      slides: undefined,
      notes: {},
    },
    ui: {
      mode: projectData?.mode || 'capture',
      leftPanelWidth: projectData?.leftPanelWidth || 320,
      rightPanelWidth: projectData?.rightPanelWidth || 384,
      selectedPhaseId: timelineData?.selectedPhaseId || null,
    },
    flags: {
      timelineIsStale: projectData?.timelineIsStale || false,
      hasManualEdits: (projectData?.manualOverrides || []).length > 0,
    },
  };
}

/**
 * Convert EstimatorInputs to UnifiedProject
 */
export function createFromEstimator(
  inputs: EstimatorInputs,
  result: any,
  projectName: string
): UnifiedProject {
  const now = new Date();
  const projectId = `est-${Date.now()}`;

  return {
    id: projectId,
    name: projectName,
    metadata: {
      version: UNIFIED_STORE_VERSION,
      createdAt: now,
      updatedAt: now,
    },
    source: 'estimator',
    estimator: {
      inputs,
      result,
      completedAt: now,
    },
    presales: {
      chips: [],
      decisions: {},
      completeness: {
        score: 0,
        gaps: [],
        blockers: [],
        canProceed: false,
      },
      mode: 'capture',
    },
    timeline: {
      profile: inputs.profile,
      phases: [],
      selectedPackages: [],
      resources: [],
      holidays: [],
      phaseColors: {},
      region: 'ABMY',
      zoomLevel: 'month',
    },
    overrides: [],
    presentation: {
      mode: false,
    },
    ui: {
      mode: 'plan',
      leftPanelWidth: 320,
      rightPanelWidth: 384,
      selectedPhaseId: null,
    },
    flags: {
      timelineIsStale: false,
      hasManualEdits: false,
    },
  };
}

// ============================================================================
// UNIFIED STORE
// ============================================================================

interface UnifiedProjectState {
  // Current active project
  currentProject: UnifiedProject | null;

  // Recent projects list
  recentProjects: Array<{
    id: string;
    name: string;
    updatedAt: Date;
    source: string;
  }>;

  // Actions
  loadProject: (projectId: string) => void;
  saveProject: (project: UnifiedProject) => void;
  createProject: (name: string, source: UnifiedProject['source']) => void;
  updateProject: (updates: Partial<UnifiedProject>) => void;
  deleteProject: (projectId: string) => void;

  // Tier-specific updates
  updateEstimator: (data: Partial<UnifiedProject['estimator']>) => void;
  updatePresales: (data: Partial<UnifiedProject['presales']>) => void;
  updateTimeline: (data: Partial<UnifiedProject['timeline']>) => void;
  updateUI: (data: Partial<UnifiedProject['ui']>) => void;

  // Migration helpers
  migrateFromLegacy: () => void;
  getVersion: () => number;

  // Sync with legacy stores (dual-write pattern)
  syncToLegacyStores: () => void;
  syncFromLegacyStores: () => void;
}

export const useUnifiedProjectStore = create<UnifiedProjectState>()(
  persist(
    (set, get) => ({
      currentProject: null,
      recentProjects: [],

      loadProject: (projectId) => {
        // TODO: Load from localStorage or API
        console.log('[UnifiedStore] Loading project:', projectId);
      },

      saveProject: (project) => {
        set({
          currentProject: {
            ...project,
            metadata: {
              ...project.metadata,
              updatedAt: new Date(),
            },
          },
        });

        // Add to recent projects
        const recent = get().recentProjects.filter((p) => p.id !== project.id);
        recent.unshift({
          id: project.id,
          name: project.name,
          updatedAt: new Date(),
          source: project.source,
        });

        set({ recentProjects: recent.slice(0, 10) }); // Keep last 10
      },

      createProject: (name, source) => {
        const now = new Date();
        const project: UnifiedProject = {
          id: `proj-${Date.now()}`,
          name,
          metadata: {
            version: UNIFIED_STORE_VERSION,
            createdAt: now,
            updatedAt: now,
          },
          source,
          estimator: {},
          presales: {
            chips: [],
            decisions: {},
            completeness: {
              score: 0,
              gaps: [],
              blockers: [],
              canProceed: false,
            },
            mode: 'capture',
          },
          timeline: {
            profile: null,
            phases: [],
            selectedPackages: [],
            resources: [],
            holidays: [],
            phaseColors: {},
            region: 'ABMY',
            zoomLevel: 'month',
          },
          overrides: [],
          presentation: {
            mode: false,
          },
          ui: {
            mode: 'capture',
            leftPanelWidth: 320,
            rightPanelWidth: 384,
            selectedPhaseId: null,
          },
          flags: {
            timelineIsStale: false,
            hasManualEdits: false,
          },
        };

        get().saveProject(project);
      },

      updateProject: (updates) => {
        const current = get().currentProject;
        if (!current) return;

        get().saveProject({
          ...current,
          ...updates,
        });

        // Dual-write to legacy stores during transition
        get().syncToLegacyStores();
      },

      deleteProject: (projectId) => {
        set({
          recentProjects: get().recentProjects.filter((p) => p.id !== projectId),
        });

        if (get().currentProject?.id === projectId) {
          set({ currentProject: null });
        }
      },

      updateEstimator: (data) => {
        const current = get().currentProject;
        if (!current) return;

        get().updateProject({
          estimator: {
            ...current.estimator,
            ...data,
          },
        });
      },

      updatePresales: (data) => {
        const current = get().currentProject;
        if (!current) return;

        get().updateProject({
          presales: {
            ...current.presales,
            ...data,
          },
        });
      },

      updateTimeline: (data) => {
        const current = get().currentProject;
        if (!current) return;

        get().updateProject({
          timeline: {
            ...current.timeline,
            ...data,
            generatedAt: new Date(),
          },
          flags: {
            ...current.flags,
            timelineIsStale: false,
          },
        });
      },

      updateUI: (data) => {
        const current = get().currentProject;
        if (!current) return;

        get().updateProject({
          ui: {
            ...current.ui,
            ...data,
          },
        });
      },

      migrateFromLegacy: () => {
        try {
          // Read from legacy stores (localStorage)
          // Zustand persist middleware wraps state in { state: { ... } }
          const presalesStorage = JSON.parse(
            localStorage.getItem('presales-storage') || '{}'
          );
          const timelineStorage = JSON.parse(
            localStorage.getItem('timeline-storage') || '{}'
          );
          const projectStorage = JSON.parse(
            localStorage.getItem('project-storage') || '{}'
          );

          // Unwrap the state from Zustand's persist structure
          const presalesData = presalesStorage.state || presalesStorage;
          const timelineData = timelineStorage.state || timelineStorage;
          const projectData = projectStorage.state || projectStorage;

          if (!presalesData && !timelineData && !projectData) {
            console.log('[UnifiedStore] No legacy data to migrate');
            return;
          }

          const migratedProject = migrateFromLegacyStores(
            presalesData,
            timelineData,
            projectData
          );

          get().saveProject(migratedProject);

          console.log('[UnifiedStore] ✅ Migration complete:', migratedProject.id);
        } catch (error) {
          console.error('[UnifiedStore] ❌ Migration failed:', error);
        }
      },

      getVersion: () => UNIFIED_STORE_VERSION,

      syncToLegacyStores: () => {
        // Dual-write: Update legacy stores when unified store changes
        // This ensures backward compatibility during transition
        const project = get().currentProject;
        if (!project) return;

        console.log('[UnifiedStore] Syncing to legacy stores...');

        if (typeof window === 'undefined') return;

        try {
          // Wait for stores to be loaded
          if (!usePresalesStore || !useTimelineStore || !useProjectStore) {
            console.warn('[UnifiedStore] ⚠️ Legacy stores not loaded yet, skipping sync');
            return;
          }

          // Update presales-store
          usePresalesStore.setState({
            chips: project.presales.chips,
            decisions: project.presales.decisions,
            mode: project.presales.mode,
            completeness: project.presales.completeness,
          });

          // Update timeline-store
          useTimelineStore.setState({
            profile: project.timeline.profile,
            phases: project.timeline.phases,
            selectedPackages: project.timeline.selectedPackages,
            resources: project.timeline.resources,
            holidays: project.timeline.holidays,
            phaseColors: project.timeline.phaseColors,
            region: project.timeline.region,
            zoomLevel: project.timeline.zoomLevel,
            selectedPhaseId: project.ui.selectedPhaseId,
            clientPresentationMode: project.presentation.mode,
          });

          // Update project-store
          useProjectStore.setState({
            mode: project.ui.mode,
            projectId: project.id,
            timelineIsStale: project.flags.timelineIsStale,
            lastGeneratedAt: project.timeline.generatedAt || null,
            manualOverrides: project.overrides,
            leftPanelWidth: project.ui.leftPanelWidth,
            rightPanelWidth: project.ui.rightPanelWidth,
          });

          console.log('[UnifiedStore] ✅ Legacy stores updated');
        } catch (error) {
          console.error('[UnifiedStore] ❌ Failed to sync to legacy stores:', error);
        }
      },

      syncFromLegacyStores: () => {
        // Read from legacy stores and update unified store
        // Used when legacy components make changes
        console.log('[UnifiedStore] Syncing from legacy stores...');

        if (typeof window === 'undefined') return;

        try {
          // Wait for stores to be loaded
          if (!usePresalesStore || !useTimelineStore || !useProjectStore) {
            console.warn('[UnifiedStore] ⚠️ Legacy stores not loaded yet, skipping sync');
            return;
          }

          const presalesState = usePresalesStore.getState();
          const timelineState = useTimelineStore.getState();
          const projectState = useProjectStore.getState();

          const current = get().currentProject;

          // If no current project, perform full migration
          if (!current) {
            get().migrateFromLegacy();
            return;
          }

          // Update current project with changes from legacy stores
          get().updateProject({
            presales: {
              chips: presalesState.chips || current.presales.chips,
              decisions: presalesState.decisions || current.presales.decisions,
              completeness: presalesState.completeness || current.presales.completeness,
              mode: presalesState.mode || current.presales.mode,
            },
            timeline: {
              ...current.timeline,
              profile: timelineState.profile,
              phases: timelineState.phases,
              selectedPackages: timelineState.selectedPackages,
              resources: timelineState.resources,
              holidays: timelineState.holidays,
              phaseColors: timelineState.phaseColors,
              region: timelineState.region,
              zoomLevel: timelineState.zoomLevel,
            },
            ui: {
              ...current.ui,
              mode: projectState.mode || current.ui.mode,
              leftPanelWidth: projectState.leftPanelWidth || current.ui.leftPanelWidth,
              rightPanelWidth: projectState.rightPanelWidth || current.ui.rightPanelWidth,
              selectedPhaseId: timelineState.selectedPhaseId,
            },
            flags: {
              ...current.flags,
              timelineIsStale: projectState.timelineIsStale,
              hasManualEdits: (projectState.manualOverrides || []).length > 0,
            },
            overrides: projectState.manualOverrides || current.overrides,
            presentation: {
              ...current.presentation,
              mode: timelineState.clientPresentationMode,
            },
          });

          console.log('[UnifiedStore] ✅ Synced from legacy stores');
        } catch (error) {
          console.error('[UnifiedStore] ❌ Failed to sync from legacy stores:', error);
        }
      },
    }),
    {
      name: 'unified-project-storage',
      version: UNIFIED_STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProject: state.currentProject,
        recentProjects: state.recentProjects,
      }),
      migrate: (persistedState: any, version: number) => {
        console.log(`[UnifiedStore] Migrating from version ${version} to ${UNIFIED_STORE_VERSION}`);

        if (version < UNIFIED_STORE_VERSION) {
          // Handle version migrations here
          // For now, just return the persisted state
          return persistedState;
        }

        return persistedState;
      },
    }
  )
);

// ============================================================================
// HOOKS & SELECTORS
// ============================================================================

/**
 * Hook to get current project data
 */
export function useCurrentProject() {
  return useUnifiedProjectStore((state) => state.currentProject);
}

/**
 * Hook to get specific tier data
 */
export function useEstimatorData() {
  return useUnifiedProjectStore((state) => state.currentProject?.estimator);
}

export function usePresalesData() {
  return useUnifiedProjectStore((state) => state.currentProject?.presales);
}

export function useTimelineData() {
  return useUnifiedProjectStore((state) => state.currentProject?.timeline);
}

/**
 * Hook to check if project has unsaved changes
 */
export function useHasUnsavedChanges() {
  return useUnifiedProjectStore((state) => {
    const project = state.currentProject;
    if (!project) return false;

    // Check if updated within last 5 seconds (auto-save indicator)
    const timeSinceUpdate = Date.now() - new Date(project.metadata.updatedAt).getTime();
    return timeSinceUpdate < 5000;
  });
}
