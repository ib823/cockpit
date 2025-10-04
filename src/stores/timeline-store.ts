// src/stores/timeline-store.ts
import { calculateProjectCost } from "@/data/resource-catalog";
import {
  businessDayToDate,
  Holiday,
  calculateProjectStartDate as calcProjectStart,
  calculateProjectEndDate as calcProjectEnd,
} from "@/lib/timeline/date-calculations";
import {
  calculateIntelligentSequencing,
  ClientProfile,
  generateTimelineFromSAPSelection,
  Phase,
  Resource,
} from "@/lib/timeline/phase-generation";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export types for convenience
export type { Phase, Resource, ClientProfile };

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TimelineState {
  // Core data
  profile: ClientProfile;
  selectedPackages: string[];
  phases: Phase[];
  holidays: Holiday[];
  phaseColors: Record<string, string>;

  // View state
  zoomLevel: "daily" | "weekly" | "biweekly" | "monthly";
  selectedPhaseId: string | null;
  clientPresentationMode: boolean;

  // Actions - Profile
  setProfile: (profile: Partial<ClientProfile>) => void;
  resetProfile: () => void;

  // Actions - Packages
  addPackage: (packageId: string) => void;
  removePackage: (packageId: string) => void;
  clearPackages: () => void;
  setSelectedPackages: (packages: string[]) => void;

  // Actions - Phases
  setPhases: (phases: Phase[]) => void;
  generateTimeline: () => void;
  addPhase: (phase?: Partial<Phase>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  movePhase: (id: string, newStartDay: number) => void;
  movePhaseOrder: (fromIndex: number, toIndex: number) => void;
  togglePhaseSelection: (id: string) => void;
  setPhaseColor: (phaseId: string, color: string) => void;
  updatePhaseColor: (phaseId: string, color: string) => void;

  // Actions - Resources
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;

  // Actions - Holidays
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  resetHolidays: () => void;

  // Actions - View
  setZoomLevel: (level: "daily" | "weekly" | "biweekly" | "monthly") => void;
  selectPhase: (id: string | null) => void;
  togglePresentationMode: () => void;

  // Actions - Reset
  reset: () => void;

  // Computed values
  getProjectCost: () => number;
  getBlendedRate: () => number;
  getTotalEffort: () => number;
  getProjectStartDate: () => Date | null;
  getProjectEndDate: () => Date | null;
  getTotalPhases: () => number;
  getTotalWorkingDays: () => number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultProfile: ClientProfile = {
  company: "",
  industry: "manufacturing",
  size: "medium",
  complexity: "standard",
  timelinePreference: "normal",
  region: "ABMY",
  employees: 500,
  annualRevenue: 100000000,
};

const PROJECT_BASE_DATE = new Date("2024-01-01");

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format effort values to avoid floating point errors
 * @param effort - Raw effort value in person-days
 * @returns Formatted effort rounded to 1 decimal place
 */
export function formatEffort(effort: number): number {
  return Math.round(effort * 10) / 10;
}

/**
 * Format currency values to avoid floating point errors
 * @param amount - Raw currency amount
 * @returns Formatted amount rounded to 2 decimal places
 */
export function formatCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate project start date from phases
 */
function calculateProjectStartDate(phases: Phase[], holidays: Holiday[]): Date | null {
  if (phases.length === 0) return null;

  try {
    const earliestPhase = phases.reduce((earliest, current) =>
      current.startBusinessDay < earliest.startBusinessDay ? current : earliest
    );

    const startDate = businessDayToDate(
      PROJECT_BASE_DATE,
      earliestPhase.startBusinessDay,
      holidays
    );

    if (isNaN(startDate.getTime())) {
      console.error("Invalid start date calculated");
      return null;
    }

    return startDate;
  } catch (error) {
    console.error("Error calculating start date:", error);
    return null;
  }
}

/**
 * Calculate project end date from phases
 */
function calculateProjectEndDate(phases: Phase[], holidays: Holiday[]): Date | null {
  if (phases.length === 0) return null;

  try {
    const latestPhase = phases.reduce((latest, current) => {
      const currentEnd = current.startBusinessDay + current.workingDays;
      const latestEnd = latest.startBusinessDay + latest.workingDays;
      return currentEnd > latestEnd ? current : latest;
    });

    const endBusinessDay = latestPhase.startBusinessDay + latestPhase.workingDays;

    const endDate = businessDayToDate(PROJECT_BASE_DATE, endBusinessDay, holidays);

    if (isNaN(endDate.getTime())) {
      console.error("Invalid end date calculated");
      return null;
    }

    return endDate;
  } catch (error) {
    console.error("Error calculating end date:", error);
    return null;
  }
}

/**
 * Validate phase data before processing
 */
function validatePhase(phase: Partial<Phase>): boolean {
  if (!phase.name || phase.name.trim().length === 0) return false;
  if (phase.workingDays !== undefined && phase.workingDays <= 0) return false;
  if (phase.effort !== undefined && phase.effort < 0) return false;
  return true;
}

/**
 * Migrate old store state to new format
 */
function migrateTimelineState(persistedState: any, version: number): any {
  if (version === 0) {
    const state = persistedState as any;

    const phaseColors: Record<string, string> = {};
    if (state.phases && Array.isArray(state.phases)) {
      state.phases.forEach((phase: any) => {
        if (phase.id && phase.color) {
          phaseColors[phase.id] = phase.color;
        }
      });
    }

    return {
      ...state,
      phaseColors: phaseColors || {},
    };
  }

  return persistedState;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // INITIAL STATE
      // ========================================================================
      profile: defaultProfile,
      selectedPackages: [],
      phases: [],
      holidays: [],
      phaseColors: {},
      zoomLevel: "weekly",
      selectedPhaseId: null,
      clientPresentationMode: false,

      // ========================================================================
      // PROFILE ACTIONS
      // ========================================================================

      setProfile: (updates: Partial<ClientProfile>) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
      },

      resetProfile: () => {
        set({ profile: defaultProfile });
      },

      // ========================================================================
      // PACKAGE ACTIONS
      // ========================================================================

      addPackage: (packageId: string) => {
        set((state) => {
          if (state.selectedPackages.includes(packageId)) {
            return state;
          }
          return {
            selectedPackages: [...state.selectedPackages, packageId],
          };
        });
      },

      removePackage: (packageId: string) => {
        set((state) => ({
          selectedPackages: state.selectedPackages.filter((id) => id !== packageId),
        }));
      },

      clearPackages: () => {
        set({
          selectedPackages: [],
          phases: [],
          phaseColors: {},
        });
      },

      setSelectedPackages: (packages: string[]) => {
        console.log(`[TimelineStore] Setting ${packages.length} selected packages`);
        set({ selectedPackages: packages });
      },

      // ========================================================================
      // PHASE ACTIONS
      // ========================================================================

      setPhases: (newPhases: Phase[]) => {
        console.log(`[TimelineStore] Setting ${newPhases.length} phases`);

        const newColors: Record<string, string> = {};
        newPhases.forEach((phase) => {
          if (phase.color) {
            newColors[phase.id] = phase.color;
          }
        });

        set({
          phases: newPhases,
          phaseColors: newColors,
          selectedPhaseId: null,
        });
      },

      generateTimeline: () => {
        set((state) => {
          try {
            if (state.selectedPackages.length === 0) {
              console.warn("No packages selected for timeline generation");
              return state;
            }

            const newPhases = generateTimelineFromSAPSelection(
              state.selectedPackages,
              state.profile
            );

            if (!newPhases || newPhases.length === 0) {
              console.error("Failed to generate phases from packages");
              return state;
            }

            console.log("Generated phases:", newPhases.length);
            console.log("First phase sample:", newPhases[0]);

            const newColors: Record<string, string> = {};
            newPhases.forEach((phase) => {
              if (phase.color) {
                newColors[phase.id] = phase.color;
              }
            });

            return {
              phases: newPhases,
              phaseColors: newColors,
              selectedPhaseId: null,
            };
          } catch (error) {
            console.error("Failed to generate timeline:", error);
            return state;
          }
        });
      },

      addPhase: (phaseData: Partial<Phase> = {}) => {
        set((state) => {
          if (!validatePhase(phaseData)) {
            console.error("Invalid phase data:", phaseData);
            return state;
          }

          const newPhaseId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const color = phaseData.color || "#3B82F6";

          const newPhase: Phase = {
            id: newPhaseId,
            name: phaseData.name || "New Phase",
            category: phaseData.category || "Custom",
            startBusinessDay: phaseData.startBusinessDay || 0,
            workingDays: phaseData.workingDays || 5,
            effort: phaseData.effort || 5,
            color: color,
            skipHolidays: phaseData.skipHolidays ?? true,
            dependencies: phaseData.dependencies || [],
            status: phaseData.status || "idle",
            resources: phaseData.resources || [],
          };

          const updatedPhases = [...state.phases, newPhase];
          const updatedColors = { ...state.phaseColors, [newPhaseId]: color };

          return {
            phases: calculateIntelligentSequencing(updatedPhases),
            phaseColors: updatedColors,
          };
        });
      },

      updatePhase: (id: string, updates: Partial<Phase>) => {
        set((state) => {
          const phaseExists = state.phases.some((p) => p.id === id);
          if (!phaseExists) {
            console.error(`Phase ${id} not found`);
            return state;
          }

          const updatedPhases = state.phases.map((phase) =>
            phase.id === id ? { ...phase, ...updates } : phase
          );

          let updatedColors = state.phaseColors;
          if (updates.color) {
            updatedColors = { ...state.phaseColors, [id]: updates.color };
          }

          return {
            phases: calculateIntelligentSequencing(updatedPhases),
            phaseColors: updatedColors,
          };
        });
      },

      deletePhase: (id: string) => {
        set((state) => {
          const updatedPhases = state.phases.filter((phase) => phase.id !== id);
          const { [id]: removed, ...updatedColors } = state.phaseColors;

          return {
            phases: updatedPhases,
            phaseColors: updatedColors,
            selectedPhaseId: state.selectedPhaseId === id ? null : state.selectedPhaseId,
          };
        });
      },

      movePhase: (id: string, newStartDay: number) => {
        set((state) => {
          if (newStartDay < 0) {
            console.error("Invalid start day:", newStartDay);
            return state;
          }

          const updatedPhases = state.phases.map((phase) =>
            phase.id === id ? { ...phase, startBusinessDay: newStartDay } : phase
          );

          return {
            phases: calculateIntelligentSequencing(updatedPhases),
          };
        });
      },

      movePhaseOrder: (fromIndex: number, toIndex: number) => {
        set((state) => {
          if (
            fromIndex < 0 ||
            fromIndex >= state.phases.length ||
            toIndex < 0 ||
            toIndex >= state.phases.length
          ) {
            console.error("Invalid indices:", fromIndex, toIndex);
            return state;
          }

          const newPhases = [...state.phases];
          const [removed] = newPhases.splice(fromIndex, 1);
          newPhases.splice(toIndex, 0, removed);

          return {
            phases: calculateIntelligentSequencing(newPhases),
          };
        });
      },

      togglePhaseSelection: (id: string) => {
        set((state) => ({
          selectedPhaseId: state.selectedPhaseId === id ? null : id,
        }));
      },

      setPhaseColor: (phaseId: string, color: string) => {
        set((state) => {
          const phaseExists = state.phases.some((p) => p.id === phaseId);
          if (!phaseExists) {
            console.error(`Phase ${phaseId} not found`);
            return state;
          }

          const updatedPhases = state.phases.map((phase) =>
            phase.id === phaseId ? { ...phase, color } : phase
          );

          const updatedColors = { ...state.phaseColors, [phaseId]: color };

          console.log(`[Store] Setting phase ${phaseId} color to ${color}`);

          return {
            phases: updatedPhases,
            phaseColors: updatedColors,
          };
        });
      },

      // FIX: Implement the missing updatePhaseColor method
      updatePhaseColor: (phaseId: string, color: string) => {
        // This is an alias for setPhaseColor to maintain API compatibility
        get().setPhaseColor(phaseId, color);
      },

      // ========================================================================
      // RESOURCE ACTIONS
      // ========================================================================

      updatePhaseResources: (phaseId: string, resources: Resource[]) => {
        set((state) => {
          const validResources = resources.filter(
            (r) => r.name && r.role && r.allocation >= 0 && r.allocation <= 150
          );

          if (validResources.length !== resources.length) {
            console.warn("Some resources were invalid and filtered out");
          }

          return {
            phases: state.phases.map((phase) =>
              phase.id === phaseId ? { ...phase, resources: validResources } : phase
            ),
          };
        });
      },

      // ========================================================================
      // HOLIDAY ACTIONS
      // ========================================================================

      addHoliday: (holiday: Holiday) => {
        set((state) => {
          if (!holiday.date || !holiday.name) {
            console.error("Invalid holiday:", holiday);
            return state;
          }

          const exists = state.holidays.some((h) => h.date === holiday.date);
          if (exists) {
            console.warn("Holiday already exists:", holiday.date);
            return state;
          }

          return {
            holidays: [...state.holidays, holiday],
          };
        });
      },

      removeHoliday: (date: string) => {
        set((state) => ({
          holidays: state.holidays.filter((h) => h.date !== date),
        }));
      },

      resetHolidays: () => {
        set({ holidays: [] });
      },

      // ========================================================================
      // VIEW ACTIONS
      // ========================================================================

      setZoomLevel: (level: "daily" | "weekly" | "biweekly" | "monthly") => {
        set({ zoomLevel: level });
      },

      selectPhase: (id: string | null) => {
        set({ selectedPhaseId: id });
      },

      togglePresentationMode: () => {
        set((state) => ({
          clientPresentationMode: !state.clientPresentationMode,
        }));
      },

      // ========================================================================
      // RESET
      // ========================================================================

      reset: () => {
        set({
          profile: defaultProfile,
          selectedPackages: [],
          phases: [],
          holidays: [],
          phaseColors: {},
          zoomLevel: "weekly",
          selectedPhaseId: null,
          clientPresentationMode: false,
        });
      },

      // ========================================================================
      // COMPUTED VALUES
      // ========================================================================

      getProjectCost: (): number => {
        const { phases } = get();

        // Early return for performance
        if (!phases || phases.length === 0) {
          return 0;
        }

        try {
          const phasesWithResources = phases.map((p) => ({
            ...p,
            resources: p.resources || [],
          }));

          const cost = calculateProjectCost(phasesWithResources);

          if (typeof cost === "number" && !isNaN(cost) && cost >= 0) {
            return cost;
          }
        } catch (originalError) {
          console.warn("Original calculateProjectCost failed, using fallback:", originalError);
        }

        // Fallback: Manual calculation
        try {
          let totalCost = 0;

          for (const phase of phases) {
            const resources = phase.resources || [];
            const workingDays = phase.workingDays || 0;

            if (resources.length === 0) continue;

            for (const resource of resources) {
              if (!resource) continue;

              const hourlyRate = typeof resource.hourlyRate === "number" ? resource.hourlyRate : 0;
              const allocation =
                typeof resource.allocation === "number" ? resource.allocation : 100;

              if (hourlyRate === 0) {
                console.warn(
                  `Resource ${resource.name || "unnamed"} has no hourly rate in phase ${phase.name}`
                );
                continue;
              }

              const allocationDecimal = allocation / 100;
              const hours = workingDays * 8 * allocationDecimal;
              const resourceCost = hourlyRate * hours;

              if (isNaN(resourceCost)) {
                console.error("NaN detected:", {
                  phase: phase.name,
                  resource: resource.name || "unnamed",
                  hourlyRate,
                  allocation,
                  workingDays,
                  calculation: `${hourlyRate} * ${hours}`,
                });
                continue;
              }

              totalCost += resourceCost;
            }
          }

          const finalCost = formatCurrency(totalCost);

          if (isNaN(finalCost)) {
            console.error("Final cost is NaN after calculation");
            return 0;
          }

          return finalCost;
        } catch (error) {
          console.error("Critical error calculating project cost:", error);
          return 0;
        }
      },

      getBlendedRate: (): number => {
        const { phases } = get();

        try {
          const allResources = phases.flatMap((p) => p.resources || []);
          if (allResources.length === 0) return 0;

          let totalCost = 0;
          let totalAllocation = 0;

          allResources.forEach((resource) => {
            const allocation = (resource.allocation || 0) / 100;
            const rate = resource.hourlyRate || 0;

            totalCost += rate * 8 * allocation;
            totalAllocation += allocation;
          });

          const blendedRate = totalAllocation > 0 ? totalCost / totalAllocation : 0;

          if (isNaN(blendedRate) || blendedRate < 0) {
            console.error("Invalid blended rate calculated");
            return 0;
          }

          return formatCurrency(blendedRate);
        } catch (error) {
          console.error("Error calculating blended rate:", error);
          return 0;
        }
      },

      getTotalEffort: (): number => {
        const { phases } = get();

        try {
          const totalEffort = phases.reduce((sum, phase) => {
            return sum + (phase.effort || 0);
          }, 0);

          return formatEffort(totalEffort);
        } catch (error) {
          console.error("Error calculating total effort:", error);
          return 0;
        }
      },

      getProjectStartDate: (): Date | null => {
        const { phases, holidays } = get();
        return calculateProjectStartDate(phases, holidays);
      },

      getProjectEndDate: (): Date | null => {
        const { phases, holidays } = get();
        return calculateProjectEndDate(phases, holidays);
      },

      getTotalPhases: (): number => {
        const { phases } = get();
        return phases.length;
      },

      getTotalWorkingDays: (): number => {
        const { phases } = get();

        try {
          const totalDays = phases.reduce((sum, phase) => {
            return sum + (phase.workingDays || 0);
          }, 0);

          return totalDays;
        } catch (error) {
          console.error("Error calculating total working days:", error);
          return 0;
        }
      },
    }),
    {
      name: "timeline-store",
      version: 1,
      migrate: migrateTimelineState,
      partialize: (state) => ({
        profile: state.profile,
        selectedPackages: state.selectedPackages,
        phases: state.phases,
        holidays: state.holidays,
        phaseColors: state.phaseColors,
        zoomLevel: state.zoomLevel,
        clientPresentationMode: state.clientPresentationMode,
      }),
    }
  )
);

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

export const useTimelinePhases = () => useTimelineStore((state) => state.phases);
export const useTimelineProfile = () => useTimelineStore((state) => state.profile);
export const useSelectedPackages = () => useTimelineStore((state) => state.selectedPackages);
export const useProjectCost = () => useTimelineStore((state) => state.getProjectCost());
export const useTotalEffort = () => useTimelineStore((state) => state.getTotalEffort());
export const useProjectDates = () =>
  useTimelineStore((state) => ({
    startDate: state.getProjectStartDate(),
    endDate: state.getProjectEndDate(),
  }));
export const usePhaseColors = () => useTimelineStore((state) => state.phaseColors);
export const useSelectedPhase = () =>
  useTimelineStore((state) => state.phases.find((p) => p.id === state.selectedPhaseId));
export const usePresentationMode = () => useTimelineStore((state) => state.clientPresentationMode);
