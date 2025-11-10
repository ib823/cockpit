import { Holiday } from "@/lib/timeline/date-calculations";
import type { Phase, Resource } from "@/types/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { ResourcePlan, PhaseResource, Wrapper, ResourceRole } from "@/lib/resourcing/model";
import {
  generateResourcePlan,
  updateResourceAllocation,
  addResourceToPhase,
  removeResourceFromPhase,
  updateWrapper,
  calculatePlanMargin,
  getResourceUtilization,
} from "@/lib/resourcing/calculator";

export type { Phase, Resource }; // Re-export for other modules

interface TimelineState {
  projectId: string | null;
  isLoading: boolean;
  error: string | null;
  profile: any | null;
  phases: Phase[];
  resources: Resource[];
  holidays: Holiday[];
  selectedPackages: string[];
  selectedPhaseId: string | null;
  zoomLevel: "week" | "month" | "quarter";
  clientPresentationMode: boolean;
  phaseColors: Record<string, string>;

  // M4 - Phase-Level Resourcing
  resourcePlan: ResourcePlan | null;
  region: string;

  // Actions
  loadProject: (projectId: string) => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  setProfile: (profile: any) => void;
  setPhases: (phasesData: Omit<Phase, "id" | "projectId">[]) => void;
  addPhase: (
    phaseData: Omit<Phase, "projectId" | "id" | "startBusinessDay"> & {
      id?: string;
      startBusinessDay?: number;
    }
  ) => void;
  deletePhase: (phaseId: string) => void;
  updatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  removeTaskFromPhase: (phaseId: string, taskId: string) => void;
  selectPhase: (phaseId: string | null) => void;
  addPackage: (pkg: string) => void;
  removePackage: (pkg: string) => void;
  clearPackages: () => void;
  setSelectedPackages: (packages: string[]) => void;
  setZoomLevel: (level: "week" | "month" | "quarter") => void;
  togglePresentationMode: () => void;
  reset: () => void;

  // M4 - Resourcing Actions
  generateResources: () => void;
  updatePhaseResourceAllocation: (
    phaseId: string,
    resourceId: string,
    updates: Partial<PhaseResource>
  ) => void;
  addPhaseResource: (
    phaseId: string,
    role: ResourceRole,
    region: string,
    allocation: number
  ) => void;
  removePhaseResource: (phaseId: string, resourceId: string) => void;
  updateWrapperConfig: (wrapperId: string, updates: Partial<Wrapper>) => void;
  setRegion: (region: string) => void;

  // Getters
  getProjectCost: () => number;
  getProjectStartDate: () => Date | null;
  getProjectEndDate: () => Date | null;
  getTotalWorkingDays: () => number;
  getMargin: (sellingPrice: number) => number;
  getUtilization: () => ReturnType<typeof getResourceUtilization>;
}

// --- Store ---

export const useTimelineStore = create<TimelineState>()(
  persist(
    immer((set, get) => ({
      // --- Initial State ---
      projectId: null,
      isLoading: false,
      error: null,
      profile: null,
      phases: [],
      resources: [],
      holidays: [],
      selectedPackages: [],
      selectedPhaseId: null,
      zoomLevel: "month",
      clientPresentationMode: false,
      phaseColors: {},

      // M4 - Resourcing State
      resourcePlan: null,
      region: "US-East",

      // --- Getters ---
      getProjectCost: () => {
        return get().phases.reduce((total, phase) => {
          const phaseCost = (phase.resources || []).reduce((sum, resource) => {
            // Cost = workingDays × 8 hours/day × hourlyRate × (allocation/100)
            const resourceCost =
              (phase.workingDays || 0) * 8 * resource.hourlyRate * (resource.allocation / 100);
            return sum + resourceCost;
          }, 0);
          return total + phaseCost;
        }, 0);
      },
      getProjectStartDate: () => {
        const { phases } = get();
        if (phases.length === 0) return null;
        const startDays = phases.map((p) => p.startBusinessDay);
        const minDay = Math.min(...startDays);
        // This is a dummy date calculation
        return new Date(Date.now() + minDay * 24 * 60 * 60 * 1000);
      },
      getProjectEndDate: () => {
        const { phases } = get();
        if (phases.length === 0) return null;
        const endDays = phases.map((p) => p.startBusinessDay + p.workingDays);
        const maxDay = Math.max(...endDays);
        return new Date(Date.now() + maxDay * 24 * 60 * 60 * 1000);
      },
      getTotalWorkingDays: () => {
        return get().phases.reduce((sum, p) => sum + p.workingDays, 0);
      },

      // --- Actions ---

      loadProject: async (projectId) => {
        set({ isLoading: true, error: null, projectId });
        try {
          // Load from localStorage for now (client-side)
          // Note: Future enhancement - fetch from API route for server-side persistence
          const phases: Phase[] = [];
          const resources: Resource[] = [];
          set((state) => {
            state.phases = phases || [];
            state.resources = resources || [];
            state.isLoading = false;
          });
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      updateProfile: async (profileData) => {
        console.log("Dummy updateProfile called", profileData);
      },

      setProfile: (profile) => {
        set({ profile });
      },

      setPhases: (phasesData) => {
        console.log(`[TimelineStore] Setting ${phasesData.length} phases`);
        set((state) => {
          state.phases = phasesData as Phase[];
        });
      },

      addPhase: (phaseData) => {
        set((state) => {
          const newPhase = {
            ...phaseData,
            id: phaseData.id || `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            startBusinessDay: phaseData.startBusinessDay ?? 0,
          } as Phase;
          state.phases.push(newPhase);
        });
      },

      deletePhase: (phaseId) => {
        set((state) => {
          state.phases = state.phases.filter((p: Phase) => p.id !== phaseId);
        });
      },

      updatePhase: (phaseId, updates) => {
        set((state) => {
          const phase = state.phases.find((p: Phase) => p.id === phaseId);
          if (phase) {
            Object.assign(phase, updates);
          }
        });
      },

      updatePhaseResources: (phaseId, resources) => {
        set((state) => {
          const phase = state.phases.find((p: Phase) => p.id === phaseId);
          if (phase) {
            // Validate resources: filter out invalid allocations
            const validResources = resources.filter(
              (r: Resource) => r.allocation >= 0 && r.allocation <= 150
            );
            phase.resources = validResources;
          }
        });
      },

      removeTaskFromPhase: (phaseId, taskId) => {
        set((state) => {
          const phase = state.phases.find((p: Phase) => p.id === phaseId);
          if (phase && phase.tasks) {
            phase.tasks = phase.tasks.filter((t) => t.id !== taskId);
          }
        });
      },

      selectPhase: (phaseId) => {
        set({ selectedPhaseId: phaseId });
      },

      addPackage: (pkg) => {
        set((state) => {
          if (!state.selectedPackages.includes(pkg)) {
            state.selectedPackages.push(pkg);
          }
        });
      },

      removePackage: (pkg) => {
        set((state) => {
          state.selectedPackages = state.selectedPackages.filter((p: string) => p !== pkg);
        });
      },

      clearPackages: () => {
        set({ selectedPackages: [] });
      },

      setSelectedPackages: (packages) => {
        set({ selectedPackages: packages });
      },

      setZoomLevel: (level) => {
        set({ zoomLevel: level });
      },

      togglePresentationMode: () => {
        set((state) => ({ clientPresentationMode: !state.clientPresentationMode }));
      },

      // --- M4 Resourcing Actions ---

      generateResources: () => {
        const { phases, region, projectId } = get();
        if (phases.length === 0) return;

        const plan = generateResourcePlan(phases, region, projectId || "default");
        set({ resourcePlan: plan });
      },

      updatePhaseResourceAllocation: (phaseId, resourceId, updates) => {
        const { resourcePlan } = get();
        if (!resourcePlan) return;

        const updatedPlan = updateResourceAllocation(resourcePlan, phaseId, resourceId, updates);
        set({ resourcePlan: updatedPlan });
      },

      addPhaseResource: (phaseId, role, region, allocation) => {
        const { resourcePlan } = get();
        if (!resourcePlan) return;

        const updatedPlan = addResourceToPhase(resourcePlan, phaseId, role, region, allocation);
        set({ resourcePlan: updatedPlan });
      },

      removePhaseResource: (phaseId, resourceId) => {
        const { resourcePlan } = get();
        if (!resourcePlan) return;

        const updatedPlan = removeResourceFromPhase(resourcePlan, phaseId, resourceId);
        set({ resourcePlan: updatedPlan });
      },

      updateWrapperConfig: (wrapperId, updates) => {
        const { resourcePlan } = get();
        if (!resourcePlan) return;

        const updatedPlan = updateWrapper(resourcePlan, wrapperId, updates);
        set({ resourcePlan: updatedPlan });
      },

      setRegion: (region) => {
        set({ region });
        get().generateResources();
      },

      getMargin: (sellingPrice) => {
        const { resourcePlan } = get();
        if (!resourcePlan) return 0;
        return calculatePlanMargin(resourcePlan, sellingPrice);
      },

      getUtilization: () => {
        const { resourcePlan } = get();
        if (!resourcePlan) {
          return { byRole: {}, byPhase: {} } as ReturnType<typeof getResourceUtilization>;
        }
        return getResourceUtilization(resourcePlan);
      },

      reset: () => {
        set({
          projectId: null,
          isLoading: false,
          error: null,
          profile: null,
          phases: [],
          resources: [],
          holidays: [],
          selectedPackages: [],
          selectedPhaseId: null,
          zoomLevel: "month",
          phaseColors: {},
          clientPresentationMode: false,
          resourcePlan: null,
          region: "US-East",
        });
      },
    })),
    {
      name: "cockpit-timeline-storage",
      partialize: (state) => ({
        phases: state.phases,
        selectedPackages: state.selectedPackages,
        zoomLevel: state.zoomLevel,
        clientPresentationMode: state.clientPresentationMode,
        region: state.region,
        selectedPhaseId: state.selectedPhaseId,
        phaseColors: state.phaseColors,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        console.log(`[TimelineStore Migration] Starting from v${version}`);

        if (version === 0) {
          // Handle v0 data structure where state was nested
          const oldState = persistedState.state || persistedState;

          return {
            // Preserve all existing data
            phases: oldState.phases || [],
            selectedPackages: oldState.selectedPackages || [],
            zoomLevel: oldState.zoomLevel || "month",
            clientPresentationMode: oldState.clientPresentationMode || false,
            region: oldState.region || "US-East",
            selectedPhaseId: oldState.selectedPhaseId || null,

            // Add new v1 fields with defaults
            phaseColors: oldState.phaseColors || {},
          };
        }

        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log("[TimelineStore] Hydration complete:", {
            phases: state.phases?.length || 0,
            packages: state.selectedPackages?.length || 0,
          });
        }
      },
    }
  )
);
