// src/stores/wrappers-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WRAPPERS, Wrapper, WrapperCalculation, WrapperType } from "@/types/wrappers";

interface WrappersState {
  // State
  wrappers: Wrapper[];
  calculations: WrapperCalculation[];
  showReference: boolean;
  showModal: boolean;

  // Actions
  setWrapperPercentage: (id: WrapperType, percentage: number) => void;
  resetWrapper: (id: WrapperType) => void;
  resetAllWrappers: () => void;
  calculateWrappers: (coreEffort: number, coreEffortCost: number) => void;
  toggleReference: () => void;
  toggleModal: () => void;

  // Computed
  getTotalWrapperPercentage: () => number;
  getTotalWrapperEffort: () => number;
  getTotalWrapperCost: () => number;
  getGrandTotal: (coreEffort: number, coreEffortCost: number) => { effort: number; cost: number };
}

export const useWrappersStore = create<WrappersState>()(
  persist(
    (set, get) => ({
      // Initial state
      wrappers: DEFAULT_WRAPPERS,
      calculations: [],
      showReference: false,
      showModal: false,

      // Actions
      setWrapperPercentage: (id, percentage) => {
        set((state) => ({
          wrappers: state.wrappers.map((w) =>
            w.id === id ? { ...w, currentPercentage: percentage } : w
          ),
        }));
      },

      resetWrapper: (id) => {
        set((state) => ({
          wrappers: state.wrappers.map((w) =>
            w.id === id ? { ...w, currentPercentage: w.defaultPercentage } : w
          ),
        }));
      },

      resetAllWrappers: () => {
        set({ wrappers: DEFAULT_WRAPPERS });
      },

      calculateWrappers: (coreEffort, coreEffortCost) => {
        const { wrappers } = get();

        // Average hourly rate (core cost / core effort hours)
        const avgHourlyRate = coreEffort > 0 ? coreEffortCost / (coreEffort * 8) : 0;

        const calculations: WrapperCalculation[] = wrappers.map((wrapper) => {
          const wrapperEffort = coreEffort * (wrapper.currentPercentage / 100);
          const wrapperCost = wrapperEffort * 8 * avgHourlyRate;

          return {
            wrapperId: wrapper.id,
            coreEffort,
            wrapperEffort,
            wrapperCost,
          };
        });

        set({ calculations });
      },

      toggleReference: () => {
        set((state) => ({ showReference: !state.showReference }));
      },

      toggleModal: () => {
        set((state) => ({ showModal: !state.showModal }));
      },

      // Computed
      getTotalWrapperPercentage: () => {
        const { wrappers } = get();
        return wrappers.reduce((sum, w) => sum + w.currentPercentage, 0);
      },

      getTotalWrapperEffort: () => {
        const { calculations } = get();
        return calculations.reduce((sum, c) => sum + c.wrapperEffort, 0);
      },

      getTotalWrapperCost: () => {
        const { calculations } = get();
        return calculations.reduce((sum, c) => sum + c.wrapperCost, 0);
      },

      getGrandTotal: (coreEffort, coreEffortCost) => {
        const { getTotalWrapperEffort, getTotalWrapperCost } = get();
        return {
          effort: coreEffort + getTotalWrapperEffort(),
          cost: coreEffortCost + getTotalWrapperCost(),
        };
      },
    }),
    {
      name: "cockpit-wrappers-storage",
    }
  )
);
