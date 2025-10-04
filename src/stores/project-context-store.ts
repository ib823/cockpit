// src/stores/project-context-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BusinessContext,
  StrategyDriver,
  ExternalSystem,
  SAPSupplement,
  DEFAULT_BUSINESS_CONTEXT,
  DEFAULT_STRATEGY_DRIVERS,
  DEFAULT_EXTERNAL_SYSTEMS,
  DEFAULT_SAP_SUPPLEMENTS,
} from '@/types/project-context';

interface ProjectContextState {
  // State
  businessContext: BusinessContext;
  strategyDrivers: StrategyDriver[];
  externalSystems: ExternalSystem[];
  sapSupplements: SAPSupplement[];

  // Actions
  setBusinessContext: (context: Partial<BusinessContext>) => void;
  addStrategyDriver: (driver: StrategyDriver) => void;
  removeStrategyDriver: (id: string) => void;
  addExternalSystem: (system: ExternalSystem) => void;
  removeExternalSystem: (id: string) => void;
  addSAPSupplement: (supplement: SAPSupplement) => void;
  removeSAPSupplement: (id: string) => void;

  // Computed
  getTotalIntegrationEffort: () => number;
  getTotalSupplementEffort: () => number;
  getTotalExternalSystemsCount: () => number;
  getCriticalDrivers: () => StrategyDriver[];

  // Reset
  resetToDefaults: () => void;
}

export const useProjectContextStore = create<ProjectContextState>()(
  persist(
    (set, get) => ({
      // Initial state
      businessContext: DEFAULT_BUSINESS_CONTEXT,
      strategyDrivers: DEFAULT_STRATEGY_DRIVERS,
      externalSystems: DEFAULT_EXTERNAL_SYSTEMS,
      sapSupplements: DEFAULT_SAP_SUPPLEMENTS,

      // Set business context
      setBusinessContext: (context) => {
        set((state) => ({
          businessContext: { ...state.businessContext, ...context },
        }));
      },

      // Strategy drivers
      addStrategyDriver: (driver) => {
        set((state) => ({
          strategyDrivers: [...state.strategyDrivers, driver],
        }));
      },

      removeStrategyDriver: (id) => {
        set((state) => ({
          strategyDrivers: state.strategyDrivers.filter((d) => d.id !== id),
        }));
      },

      // External systems
      addExternalSystem: (system) => {
        set((state) => ({
          externalSystems: [...state.externalSystems, system],
        }));
      },

      removeExternalSystem: (id) => {
        set((state) => ({
          externalSystems: state.externalSystems.filter((s) => s.id !== id),
        }));
      },

      // SAP supplements
      addSAPSupplement: (supplement) => {
        set((state) => ({
          sapSupplements: [...state.sapSupplements, supplement],
        }));
      },

      removeSAPSupplement: (id) => {
        set((state) => ({
          sapSupplements: state.sapSupplements.filter((s) => s.id !== id),
        }));
      },

      // Computed: Total integration effort
      getTotalIntegrationEffort: () => {
        const { externalSystems } = get();
        return externalSystems.reduce(
          (total, system) =>
            total +
            system.interfaces.reduce((sum, iface) => sum + iface.estimatedEffort, 0),
          0
        );
      },

      // Computed: Total supplement effort
      getTotalSupplementEffort: () => {
        const { sapSupplements } = get();
        return sapSupplements.reduce((total, supp) => total + supp.effort, 0);
      },

      // Computed: Total external systems count
      getTotalExternalSystemsCount: () => {
        const { externalSystems } = get();
        return externalSystems.length;
      },

      // Computed: Critical drivers
      getCriticalDrivers: () => {
        const { strategyDrivers } = get();
        return strategyDrivers.filter((d) => d.priority === 'critical');
      },

      // Reset to defaults
      resetToDefaults: () => {
        set({
          businessContext: DEFAULT_BUSINESS_CONTEXT,
          strategyDrivers: DEFAULT_STRATEGY_DRIVERS,
          externalSystems: DEFAULT_EXTERNAL_SYSTEMS,
          sapSupplements: DEFAULT_SAP_SUPPLEMENTS,
        });
      },
    }),
    {
      name: 'cockpit-project-context-storage',
      partialize: (state) => ({
        businessContext: state.businessContext,
        strategyDrivers: state.strategyDrivers,
        externalSystems: state.externalSystems,
        sapSupplements: state.sapSupplements,
      }),
    }
  )
);
