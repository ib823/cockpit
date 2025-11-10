/**
 * User Preferences Store
 * Persists user preferences to localStorage for smart defaults
 *
 * Features:
 * - Remember last selected estimator profile
 * - Remember last capacity settings (FTE, utilization, overlap)
 * - Remember last Gantt project settings
 * - Remember dashboard layout preferences
 * - Auto-save with debouncing
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserPreferences {
  // Estimator Preferences
  estimator: {
    lastProfileName?: string;
    lastFTE?: number;
    lastUtilization?: number;
    lastOverlapFactor?: number;
    lastScopeBreadth?: {
      l3Count: number;
      integrations: number;
    };
    lastProcessComplexity?: {
      customForms: number;
      fitToStandard: number;
    };
    lastOrgScale?: {
      legalEntities: number;
      countries: number;
      languages: number;
    };
  };

  // Gantt Tool Preferences
  gantt: {
    lastViewMode?: "day" | "week" | "month";
    lastZoomLevel?: number;
    showWeekends?: boolean;
    showHolidays?: boolean;
  };

  // Dashboard Preferences
  dashboard: {
    cardOrder?: string[];
    hiddenCards?: string[];
  };

  // General Preferences
  general: {
    theme?: "light" | "dark" | "auto";
    compactMode?: boolean;
    showOnboarding?: boolean;
  };
}

interface UserPreferencesStore extends UserPreferences {
  // Estimator Actions
  setEstimatorProfile: (profileName: string) => void;
  setEstimatorCapacity: (fte?: number, utilization?: number, overlapFactor?: number) => void;
  setEstimatorScopeBreadth: (l3Count: number, integrations: number) => void;
  setEstimatorProcessComplexity: (customForms: number, fitToStandard: number) => void;
  setEstimatorOrgScale: (legalEntities: number, countries: number, languages: number) => void;

  // Gantt Actions
  setGanttViewMode: (mode: "day" | "week" | "month") => void;
  setGanttZoomLevel: (level: number) => void;
  toggleGanttWeekends: () => void;
  toggleGanttHolidays: () => void;

  // Dashboard Actions
  setDashboardCardOrder: (order: string[]) => void;
  toggleDashboardCard: (cardId: string) => void;

  // General Actions
  setTheme: (theme: "light" | "dark" | "auto") => void;
  toggleCompactMode: () => void;
  setShowOnboarding: (show: boolean) => void;

  // Utility
  reset: () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  estimator: {},
  gantt: {
    lastViewMode: "week",
    lastZoomLevel: 100,
    showWeekends: false,
    showHolidays: true,
  },
  dashboard: {
    cardOrder: [],
    hiddenCards: [],
  },
  general: {
    theme: "auto",
    compactMode: false,
    showOnboarding: true,
  },
};

export const useUserPreferences = create<UserPreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,

      // Estimator Actions
      setEstimatorProfile: (profileName) =>
        set((state) => ({
          estimator: {
            ...state.estimator,
            lastProfileName: profileName,
          },
        })),

      setEstimatorCapacity: (fte, utilization, overlapFactor) =>
        set((state) => ({
          estimator: {
            ...state.estimator,
            lastFTE: fte !== undefined ? fte : state.estimator.lastFTE,
            lastUtilization:
              utilization !== undefined ? utilization : state.estimator.lastUtilization,
            lastOverlapFactor:
              overlapFactor !== undefined ? overlapFactor : state.estimator.lastOverlapFactor,
          },
        })),

      setEstimatorScopeBreadth: (l3Count, integrations) =>
        set((state) => ({
          estimator: {
            ...state.estimator,
            lastScopeBreadth: { l3Count, integrations },
          },
        })),

      setEstimatorProcessComplexity: (customForms, fitToStandard) =>
        set((state) => ({
          estimator: {
            ...state.estimator,
            lastProcessComplexity: { customForms, fitToStandard },
          },
        })),

      setEstimatorOrgScale: (legalEntities, countries, languages) =>
        set((state) => ({
          estimator: {
            ...state.estimator,
            lastOrgScale: { legalEntities, countries, languages },
          },
        })),

      // Gantt Actions
      setGanttViewMode: (mode) =>
        set((state) => ({
          gantt: {
            ...state.gantt,
            lastViewMode: mode,
          },
        })),

      setGanttZoomLevel: (level) =>
        set((state) => ({
          gantt: {
            ...state.gantt,
            lastZoomLevel: level,
          },
        })),

      toggleGanttWeekends: () =>
        set((state) => ({
          gantt: {
            ...state.gantt,
            showWeekends: !state.gantt.showWeekends,
          },
        })),

      toggleGanttHolidays: () =>
        set((state) => ({
          gantt: {
            ...state.gantt,
            showHolidays: !state.gantt.showHolidays,
          },
        })),

      // Dashboard Actions
      setDashboardCardOrder: (order) =>
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            cardOrder: order,
          },
        })),

      toggleDashboardCard: (cardId) =>
        set((state) => ({
          dashboard: {
            ...state.dashboard,
            hiddenCards: state.dashboard.hiddenCards?.includes(cardId)
              ? state.dashboard.hiddenCards.filter((id) => id !== cardId)
              : [...(state.dashboard.hiddenCards || []), cardId],
          },
        })),

      // General Actions
      setTheme: (theme) =>
        set((state) => ({
          general: {
            ...state.general,
            theme,
          },
        })),

      toggleCompactMode: () =>
        set((state) => ({
          general: {
            ...state.general,
            compactMode: !state.general.compactMode,
          },
        })),

      setShowOnboarding: (show) =>
        set((state) => ({
          general: {
            ...state.general,
            showOnboarding: show,
          },
        })),

      // Utility
      reset: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: "sap-cockpit-user-preferences",
      version: 1,
      // Migrate from old versions if needed
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from v0 to v1 (if needed in future)
          return persistedState;
        }
        return persistedState as UserPreferencesStore;
      },
    }
  )
);

/**
 * Hook to get only estimator preferences (lightweight)
 */
export function useEstimatorPreferences() {
  return useUserPreferences((state) => ({
    lastProfileName: state.estimator.lastProfileName,
    lastFTE: state.estimator.lastFTE,
    lastUtilization: state.estimator.lastUtilization,
    lastOverlapFactor: state.estimator.lastOverlapFactor,
    lastScopeBreadth: state.estimator.lastScopeBreadth,
    lastProcessComplexity: state.estimator.lastProcessComplexity,
    lastOrgScale: state.estimator.lastOrgScale,
    setProfile: state.setEstimatorProfile,
    setCapacity: state.setEstimatorCapacity,
    setScopeBreadth: state.setEstimatorScopeBreadth,
    setProcessComplexity: state.setEstimatorProcessComplexity,
    setOrgScale: state.setEstimatorOrgScale,
  }));
}

/**
 * Hook to get only gantt preferences (lightweight)
 */
export function useGanttPreferences() {
  return useUserPreferences((state) => ({
    lastViewMode: state.gantt.lastViewMode,
    lastZoomLevel: state.gantt.lastZoomLevel,
    showWeekends: state.gantt.showWeekends,
    showHolidays: state.gantt.showHolidays,
    setViewMode: state.setGanttViewMode,
    setZoomLevel: state.setGanttZoomLevel,
    toggleWeekends: state.toggleGanttWeekends,
    toggleHolidays: state.toggleGanttHolidays,
  }));
}

/**
 * Hook to get only dashboard preferences (lightweight)
 */
export function useDashboardPreferences() {
  return useUserPreferences((state) => ({
    cardOrder: state.dashboard.cardOrder,
    hiddenCards: state.dashboard.hiddenCards,
    setCardOrder: state.setDashboardCardOrder,
    toggleCard: state.toggleDashboardCard,
  }));
}

/**
 * Hook to get only general preferences (lightweight)
 */
export function useGeneralPreferences() {
  return useUserPreferences((state) => ({
    theme: state.general.theme,
    compactMode: state.general.compactMode,
    showOnboarding: state.general.showOnboarding,
    setTheme: state.setTheme,
    toggleCompactMode: state.toggleCompactMode,
    setShowOnboarding: state.setShowOnboarding,
  }));
}
