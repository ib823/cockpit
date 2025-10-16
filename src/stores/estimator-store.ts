/**
 * SAP Cockpit - Estimator Store
 *
 * Zustand store for managing estimator state with persistence.
 * Stores inputs, results, and warnings with localStorage persistence.
 *
 * Usage:
 *   const { inputs, setInputs, results } = useEstimatorStore();
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  EstimatorInputs,
  EstimatorResults,
  Profile,
  L3ScopeItem,
  PhaseBreakdown,
} from '@/lib/estimator/types';
import { DEFAULT_PROFILE, INPUT_CONSTRAINTS } from '@/lib/estimator/types';

/**
 * Estimator store state
 */
export interface EstimatorState {
  // ============================================
  // State
  // ============================================

  /**
   * Current estimator inputs
   */
  inputs: EstimatorInputs;

  /**
   * Calculation results (null if not yet calculated)
   */
  results: EstimatorResults | null;

  /**
   * Warnings from last calculation
   */
  warnings: string[];

  /**
   * Calculation status
   */
  calculating: boolean;

  /**
   * Last calculation error
   */
  error: Error | null;

  /**
   * Start date for phase timeline
   */
  startDate: Date;

  /**
   * Phases with calculated dates
   */
  phasesWithDates: PhaseBreakdown[] | null;

  // ============================================
  // Actions
  // ============================================

  /**
   * Set complete inputs
   */
  setInputs: (inputs: EstimatorInputs) => void;

  /**
   * Update partial inputs
   */
  updateInputs: (partial: Partial<EstimatorInputs>) => void;

  /**
   * Set profile
   */
  setProfile: (profile: Profile) => void;

  /**
   * Set selected L3 items
   */
  setSelectedL3Items: (items: L3ScopeItem[]) => void;

  /**
   * Toggle L3 item selection
   */
  toggleL3Item: (item: L3ScopeItem) => void;

  /**
   * Update integrations count
   */
  setIntegrations: (count: number) => void;

  /**
   * Update custom forms count
   */
  setCustomForms: (count: number) => void;

  /**
   * Update fit-to-standard percentage
   */
  setFitToStandard: (value: number) => void;

  /**
   * Update organizational scale
   */
  setOrgScale: (params: {
    legalEntities?: number;
    countries?: number;
    languages?: number;
  }) => void;

  /**
   * Update capacity parameters
   */
  setCapacity: (params: {
    fte?: number;
    utilization?: number;
    overlapFactor?: number;
  }) => void;

  /**
   * Set calculation results
   */
  setResults: (results: EstimatorResults, warnings: string[]) => void;

  /**
   * Set calculating status
   */
  setCalculating: (calculating: boolean) => void;

  /**
   * Set error
   */
  setError: (error: Error | null) => void;

  /**
   * Clear error
   */
  clearError: () => void;

  /**
   * Set start date
   */
  setStartDate: (date: Date) => void;

  /**
   * Set phases with dates
   */
  setPhasesWithDates: (phases: PhaseBreakdown[]) => void;

  /**
   * Reset to default state
   */
  reset: () => void;

  /**
   * Reset only inputs (keep results)
   */
  resetInputs: () => void;
}

/**
 * Default inputs
 */
const getDefaultInputs = (): EstimatorInputs => ({
  profile: DEFAULT_PROFILE,
  selectedL3Items: [],
  integrations: 0,
  customForms: INPUT_CONSTRAINTS.customForms.min,
  fitToStandard: 0.85, // 85% fit to standard
  legalEntities: 1,
  countries: 1,
  languages: 1,
  fte: 5,
  utilization: 0.8, // 80% utilization
  overlapFactor: 0.75, // 75% overlap
});

/**
 * Default state
 */
const getDefaultState = (): Omit<
  EstimatorState,
  | 'setInputs'
  | 'updateInputs'
  | 'setProfile'
  | 'setSelectedL3Items'
  | 'toggleL3Item'
  | 'setIntegrations'
  | 'setCustomForms'
  | 'setFitToStandard'
  | 'setOrgScale'
  | 'setCapacity'
  | 'setResults'
  | 'setCalculating'
  | 'setError'
  | 'clearError'
  | 'setStartDate'
  | 'setPhasesWithDates'
  | 'reset'
  | 'resetInputs'
> => ({
  inputs: getDefaultInputs(),
  results: null,
  warnings: [],
  calculating: false,
  error: null,
  startDate: new Date(),
  phasesWithDates: null,
});

/**
 * Estimator store with persistence
 */
export const useEstimatorStore = create<EstimatorState>()(
  persist(
    (set) => ({
      // Initial state
      ...getDefaultState(),

      // Actions
      setInputs: (inputs) =>
        set({ inputs }),

      updateInputs: (partial) =>
        set((state) => ({
          inputs: { ...state.inputs, ...partial },
        })),

      setProfile: (profile) =>
        set((state) => ({
          inputs: { ...state.inputs, profile },
        })),

      setSelectedL3Items: (items) =>
        set((state) => ({
          inputs: { ...state.inputs, selectedL3Items: items },
        })),

      toggleL3Item: (item) =>
        set((state) => {
          const isSelected = state.inputs.selectedL3Items.some(
            (i) => i.l3Code === item.l3Code
          );

          const newItems = isSelected
            ? state.inputs.selectedL3Items.filter((i) => i.l3Code !== item.l3Code)
            : [...state.inputs.selectedL3Items, item];

          return {
            inputs: { ...state.inputs, selectedL3Items: newItems },
          };
        }),

      setIntegrations: (count) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            integrations: Math.max(
              INPUT_CONSTRAINTS.integrations.min,
              Math.min(INPUT_CONSTRAINTS.integrations.max, count)
            ),
          },
        })),

      setCustomForms: (count) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            customForms: Math.max(
              INPUT_CONSTRAINTS.customForms.min,
              Math.min(INPUT_CONSTRAINTS.customForms.max, count)
            ),
          },
        })),

      setFitToStandard: (value) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            fitToStandard: Math.max(
              INPUT_CONSTRAINTS.fitToStandard.min,
              Math.min(INPUT_CONSTRAINTS.fitToStandard.max, value)
            ),
          },
        })),

      setOrgScale: (params) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            ...(params.legalEntities !== undefined && {
              legalEntities: Math.max(
                INPUT_CONSTRAINTS.legalEntities.min,
                Math.min(INPUT_CONSTRAINTS.legalEntities.max, params.legalEntities)
              ),
            }),
            ...(params.countries !== undefined && {
              countries: Math.max(
                INPUT_CONSTRAINTS.countries.min,
                Math.min(INPUT_CONSTRAINTS.countries.max, params.countries)
              ),
            }),
            ...(params.languages !== undefined && {
              languages: Math.max(
                INPUT_CONSTRAINTS.languages.min,
                Math.min(INPUT_CONSTRAINTS.languages.max, params.languages)
              ),
            }),
          },
        })),

      setCapacity: (params) =>
        set((state) => ({
          inputs: {
            ...state.inputs,
            ...(params.fte !== undefined && {
              fte: Math.max(
                INPUT_CONSTRAINTS.fte.min,
                Math.min(INPUT_CONSTRAINTS.fte.max, params.fte)
              ),
            }),
            ...(params.utilization !== undefined && {
              utilization: Math.max(
                INPUT_CONSTRAINTS.utilization.min,
                Math.min(INPUT_CONSTRAINTS.utilization.max, params.utilization)
              ),
            }),
            ...(params.overlapFactor !== undefined && {
              overlapFactor: Math.max(
                INPUT_CONSTRAINTS.overlapFactor.min,
                Math.min(INPUT_CONSTRAINTS.overlapFactor.max, params.overlapFactor)
              ),
            }),
          },
        })),

      setResults: (results, warnings) =>
        set({ results, warnings, calculating: false, error: null }),

      setCalculating: (calculating) =>
        set({ calculating }),

      setError: (error) =>
        set({ error, calculating: false }),

      clearError: () =>
        set({ error: null }),

      setStartDate: (date) =>
        set({ startDate: date }),

      setPhasesWithDates: (phases) =>
        set({ phasesWithDates: phases }),

      reset: () =>
        set(getDefaultState()),

      resetInputs: () =>
        set({ inputs: getDefaultInputs() }),
    }),
    {
      name: 'estimator-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist inputs and startDate
        inputs: state.inputs,
        startDate: state.startDate,
      }),
    }
  )
);

/**
 * Selectors for derived state (use these to avoid re-renders)
 */
export const estimatorSelectors = {
  hasResults: (state: EstimatorState) => state.results !== null,
  hasWarnings: (state: EstimatorState) => state.warnings.length > 0,
  hasError: (state: EstimatorState) => state.error !== null,
  isCalculating: (state: EstimatorState) => state.calculating,
  selectedItemsCount: (state: EstimatorState) => state.inputs.selectedL3Items.length,
  hasTierDItems: (state: EstimatorState) =>
    state.inputs.selectedL3Items.some(
      (item) => item.complexityMetrics?.defaultTier === 'D'
    ),
  totalCoefficient: (state: EstimatorState) =>
    state.inputs.selectedL3Items.reduce(
      (sum, item) => sum + (item.complexityMetrics?.coefficient ?? 0),
      0
    ),
};
