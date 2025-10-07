/**
 * UNIFIED PROJECT STORE
 *
 * Single source of truth for all project data across tiers.
 * Replaces: presales-store, project-store, timeline-store
 *
 * Features:
 * - Version-controlled localStorage
 * - Backward compatible migrations
 * - Type-safe data access
 * - Simplified data flow
 *
 * Per spec: Roadmap_and_DoD.md (P2-1)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Chip, Phase, Resource } from '@/types/core';
import type { Holiday } from '@/lib/timeline/date-calculations';
import type { ResourcePlan } from '@/lib/resourcing/model';

// --- Version Control ---

export const STORE_VERSION = 1;

// --- Unified Types ---

export type ProjectTier = 'estimator' | 'presales' | 'timeline';
export type ProjectMode = 'capture' | 'decide' | 'plan' | 'present';

export interface Completeness {
  score: number;
  gaps: string[];
  blockers: string[];
  canProceed: boolean;
}

export interface ManualOverride {
  phaseId: string;
  field: 'duration' | 'effort' | 'resources';
  originalValue: any;
  manualValue: any;
  reason?: string;
  timestamp: Date;
}

/**
 * UnifiedProject - Core project data structure
 * Contains all data from estimator → presales → timeline
 */
export interface UnifiedProject {
  // Meta
  id: string;
  name: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  tier: ProjectTier;

  // Estimator Data (Tier 1)
  estimator: {
    profileId?: string;
    profileName?: string;
    totalEffort?: number; // MD
    totalCost?: number;
    duration?: {
      weeks: number;
      months: number;
    };
    confidence?: number;
    inputs?: any; // EstimatorInputs
  } | null;

  // Presales Data (Tier 2)
  presales: {
    chips: Chip[];
    decisions: Record<string, any>;
    completeness: Completeness;
    suggestions: string[];
  };

  // Timeline Data (Tier 3)
  timeline: {
    profile: any | null;
    phases: Phase[];
    resources: Resource[];
    holidays: Holiday[];
    selectedPackages: string[];
    selectedPhaseId: string | null;
    resourcePlan: ResourcePlan | null;
    region: string;
    phaseColors: Record<string, string>;
  };

  // Workflow State
  mode: ProjectMode;
  timelineIsStale: boolean;
  lastGeneratedAt: Date | null;
  manualOverrides: ManualOverride[];

  // UI State
  ui: {
    zoomLevel: 'week' | 'month' | 'quarter';
    clientPresentationMode: boolean;
    leftPanelWidth: number;
    rightPanelWidth: number;
  };
}

// --- Store State ---

interface UnifiedProjectState {
  // Current project (null = no active project)
  currentProject: UnifiedProject | null;

  // All projects (for future multi-project support)
  projects: Record<string, UnifiedProject>;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // --- Project Management Actions ---
  createProject: (name: string, tier?: ProjectTier) => string;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  updateProjectName: (projectId: string, name: string) => void;

  // --- Estimator Actions ---
  setEstimatorData: (data: UnifiedProject['estimator']) => void;

  // --- Presales Actions ---
  addChip: (chip: Omit<Chip, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void;
  addChips: (chips: Omit<Chip, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]) => void;
  removeChip: (chipId: string) => void;
  clearChips: () => void;
  updateDecision: (key: string, value: any) => void;
  calculateCompleteness: () => void;

  // --- Timeline Actions ---
  setProfile: (profile: any) => void;
  setPhases: (phases: Phase[]) => void;
  addPhase: (phase: Omit<Phase, 'id' | 'projectId'>) => void;
  updatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  deletePhase: (phaseId: string) => void;
  setSelectedPackages: (packages: string[]) => void;

  // --- Workflow Actions ---
  setMode: (mode: ProjectMode) => void;
  markTimelineStale: () => void;
  regenerateTimeline: (force?: boolean) => void;
  addManualOverride: (override: Omit<ManualOverride, 'timestamp'>) => void;
  clearManualOverrides: () => void;

  // --- UI Actions ---
  setZoomLevel: (level: 'week' | 'month' | 'quarter') => void;
  togglePresentationMode: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;

  // --- Utility Actions ---
  reset: () => void;
  migrateFromLegacy: () => void;
}

// --- Initial State Helper ---

function createEmptyProject(name: string, tier: ProjectTier = 'presales'): UnifiedProject {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    version: STORE_VERSION,
    createdAt: new Date(),
    updatedAt: new Date(),
    tier,

    estimator: null,

    presales: {
      chips: [],
      decisions: {},
      completeness: {
        score: 0,
        gaps: [],
        blockers: [],
        canProceed: false,
      },
      suggestions: [],
    },

    timeline: {
      profile: null,
      phases: [],
      resources: [],
      holidays: [],
      selectedPackages: [],
      selectedPhaseId: null,
      resourcePlan: null,
      region: 'US-East',
      phaseColors: {},
    },

    mode: 'capture',
    timelineIsStale: false,
    lastGeneratedAt: null,
    manualOverrides: [],

    ui: {
      zoomLevel: 'month',
      clientPresentationMode: false,
      leftPanelWidth: 320,
      rightPanelWidth: 384,
    },
  };
}

// --- Store Implementation ---

export const useUnifiedProjectStore = create<UnifiedProjectState>()(
    persist((set, get) => ({
      // Initial state
      currentProject: null,
      projects: {},
      isLoading: false,
      error: null,

      // --- Project Management ---

      createProject: (name, tier = 'presales') => {
        const project = createEmptyProject(name, tier);

        set((state) => ({
          projects: {
            ...state.projects,
            [project.id]: project,
          },
          currentProject: project,
        }));

        return project.id;
      },

      loadProject: (projectId) => {
        const project = get().projects[projectId];

        if (project) {
          set({ currentProject: project });
        } else {
          set({ error: `Project ${projectId} not found` });
        }
      },

      deleteProject: (projectId) => {
        const { projects, currentProject } = get();
        const { [projectId]: deleted, ...remainingProjects } = projects;

        set({
          projects: remainingProjects,
          currentProject: currentProject?.id === projectId ? null : currentProject,
        });
      },

      updateProjectName: (projectId, name) => {
        const { projects } = get();
        const project = projects[projectId];

        if (project) {
          set({
            projects: {
              ...projects,
              [projectId]: {
                ...project,
                name,
                updatedAt: new Date(),
              },
            },
          });
        }
      },

      // --- Estimator Actions ---

      setEstimatorData: (data) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            estimator: data,
            tier: 'estimator' as ProjectTier,
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      // --- Presales Actions ---

      addChip: (chipData) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const chip = chipData as Chip;
          chip.id = chip.id || `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              chips: [...currentProject.presales.chips, chip],
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          get().calculateCompleteness();
          get().markTimelineStale();
        }
      },

      addChips: (chipsData) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const chips = chipsData.map((chipData) => {
            const chip = chipData as Chip;
            chip.id = chip.id || `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return chip;
          });

          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              chips: [...currentProject.presales.chips, ...chips],
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          get().calculateCompleteness();
          get().markTimelineStale();
        }
      },

      removeChip: (chipId) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              chips: currentProject.presales.chips.filter((c) => c.id !== chipId),
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          get().calculateCompleteness();
          get().markTimelineStale();
        }
      },

      clearChips: () => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              chips: [],
              suggestions: [],
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          get().calculateCompleteness();
          get().markTimelineStale();
        }
      },

      updateDecision: (key, value) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              decisions: {
                ...currentProject.presales.decisions,
                [key]: value,
              },
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          get().markTimelineStale();
        }
      },

      calculateCompleteness: () => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const chipCount = currentProject.presales.chips.length;
          const score = Math.min(chipCount * 10, 100);

          const updated = {
            ...currentProject,
            presales: {
              ...currentProject.presales,
              completeness: {
                score,
                gaps: chipCount < 5 ? ['Need more requirements'] : [],
                blockers: [],
                canProceed: score >= 65,
              },
            },
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      // --- Timeline Actions ---

      setProfile: (profile) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            timeline: {
              ...currentProject.timeline,
              profile,
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      setPhases: (phases) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            timeline: {
              ...currentProject.timeline,
              phases: phases.map((p, idx) => ({
                ...p,
                id: p.id || `phase-${idx}`,
                projectId: currentProject.id,
              })),
            },
            timelineIsStale: false,
            lastGeneratedAt: new Date(),
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      addPhase: (phaseData) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const phase = {
            ...phaseData,
            id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            projectId: currentProject.id,
          } as Phase;

          const updated = {
            ...currentProject,
            timeline: {
              ...currentProject.timeline,
              phases: [...currentProject.timeline.phases, phase],
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      updatePhase: (phaseId, updates) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const phaseIndex = currentProject.timeline.phases.findIndex((p) => p.id === phaseId);

          if (phaseIndex !== -1) {
            const updated = {
              ...currentProject,
              timeline: {
                ...currentProject.timeline,
                phases: currentProject.timeline.phases.map((p, idx) =>
                  idx === phaseIndex ? { ...p, ...updates } : p
                ),
              },
              updatedAt: new Date(),
            };

            set({
              currentProject: updated,
              projects: {
                ...projects,
                [currentProject.id]: updated,
              },
            });
          }
        }
      },

      deletePhase: (phaseId) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            timeline: {
              ...currentProject.timeline,
              phases: currentProject.timeline.phases.filter((p) => p.id !== phaseId),
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      setSelectedPackages: (packages) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            timeline: {
              ...currentProject.timeline,
              selectedPackages: packages,
            },
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      // --- Workflow Actions ---

      setMode: (mode) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            mode,
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });

          // Auto-regenerate when switching to plan mode
          if (mode === 'plan' && updated.timelineIsStale) {
            get().regenerateTimeline();
          }
        }
      },

      markTimelineStale: () => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            timelineIsStale: true,
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      regenerateTimeline: (force = false) => {
        const { currentProject, projects } = get();

        if (!currentProject) {
          console.warn('[UnifiedStore] No current project');
          return;
        }

        if (!force && currentProject.manualOverrides.length > 0) {
          const confirmRegenerate = window.confirm(
            `You have ${currentProject.manualOverrides.length} manual edit(s). Regenerating will preserve them but may cause inconsistencies. Continue?`
          );
          if (!confirmRegenerate) return;
        }

        console.log('[UnifiedStore] 🔄 Timeline regeneration triggered');
        // Actual regeneration logic will be handled by bridge/generator
        // For now, just mark as not stale

        const updated = {
          ...currentProject,
          timelineIsStale: false,
          lastGeneratedAt: new Date(),
        };

        set({
          currentProject: updated,
          projects: {
            ...projects,
            [currentProject.id]: updated,
          },
        });
      },

      addManualOverride: (override) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            manualOverrides: [
              ...currentProject.manualOverrides,
              {
                ...override,
                timestamp: new Date(),
              },
            ],
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      clearManualOverrides: () => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            manualOverrides: [],
            updatedAt: new Date(),
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      // --- UI Actions ---

      setZoomLevel: (level) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            ui: {
              ...currentProject.ui,
              zoomLevel: level,
            },
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      togglePresentationMode: () => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            ui: {
              ...currentProject.ui,
              clientPresentationMode: !currentProject.ui.clientPresentationMode,
            },
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      setLeftPanelWidth: (width) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            ui: {
              ...currentProject.ui,
              leftPanelWidth: Math.max(240, Math.min(480, width)),
            },
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      setRightPanelWidth: (width) => {
        const { currentProject, projects } = get();

        if (currentProject) {
          const updated = {
            ...currentProject,
            ui: {
              ...currentProject.ui,
              rightPanelWidth: Math.max(300, Math.min(600, width)),
            },
          };

          set({
            currentProject: updated,
            projects: {
              ...projects,
              [currentProject.id]: updated,
            },
          });
        }
      },

      // --- Utility Actions ---

      reset: () => {
        set({
          currentProject: null,
          projects: {},
          isLoading: false,
          error: null,
        });
      },

      migrateFromLegacy: () => {
        // Migration utility will be implemented separately
        console.log('[UnifiedStore] Migration from legacy stores not yet implemented');
      },
    }),
    {
      name: 'unified-project-storage',
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentProject: state.currentProject,
        projects: state.projects,
      }),
    }
  )
);
