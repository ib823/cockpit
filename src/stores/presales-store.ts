import { Chip } from "@/types/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PresalesState {
  chips: Chip[];
  decisions: {
    moduleCombo?: string;
    bankingPath?: string;
    rateRegion?: string;
    ssoMode?: string;
    targetPrice?: number;
    targetMargin?: number;
  };
  mode: "capture" | "decide" | "plan" | "review" | "present";
  isAutoTransit: boolean;
  metrics: {
    clicks: number;
    keystrokes: number;
    timeSpent: number;
  };

  // Actions
  addChip: (chip: Chip) => void;
  clearChips: () => void;
  addChips: (chips: Chip[]) => void;
  removeChip: (id: string) => void;
  validateChip: (id: string) => void;
  updateDecision: (key: string, value: any) => void;
  setMode: (mode: PresalesState["mode"]) => void;
  toggleAutoTransit: () => void;
  recordMetric: (type: "click" | "keystroke") => void;
  reset: () => void;
  
  // Add missing methods that DecisionBar expects
  setDecisions: (decisions: PresalesState["decisions"]) => void;
  generateBaseline: () => void;
}

export const usePresalesStore = create<PresalesState>()(
  persist(
    (set, get) => ({
      chips: [],
      decisions: {},
      mode: "capture",
      isAutoTransit: true,
      metrics: {
        clicks: 0,
        keystrokes: 0,
        timeSpent: 0,
      },

      addChip: (chip) =>
        set((state) => ({
          chips: [...state.chips, chip],
        })),

      clearChips: () => set({ chips: [] }),

      addChips: (chips) =>
        set((state) => ({
          chips: [...state.chips, ...chips],
        })),

      removeChip: (id) =>
        set((state) => ({
          chips: state.chips.filter((c) => c.id !== id),
        })),

      validateChip: (id) =>
        set((state) => ({
          chips: state.chips.map((c) => (c.id === id ? { ...c, validated: true } : c)),
        })),

      updateDecision: (key, value) =>
        set((state) => ({
          decisions: {
            ...state.decisions,
            [key]: value,
          },
        })),

      setMode: (mode) => set({ mode }),

      toggleAutoTransit: () => set((state) => ({ isAutoTransit: !state.isAutoTransit })),

      recordMetric: (type) =>
        set((state) => ({
          metrics: {
            ...state.metrics,
            clicks: type === "click" ? state.metrics.clicks + 1 : state.metrics.clicks,
            keystrokes:
              type === "keystroke" ? state.metrics.keystrokes + 1 : state.metrics.keystrokes,
          },
        })),

      reset: () =>
        set({
          chips: [],
          decisions: {},
          mode: "capture",
          isAutoTransit: true,
          metrics: { clicks: 0, keystrokes: 0, timeSpent: 0 },
        }),

      // Add missing methods
      setDecisions: (decisions) => set({ decisions }),
      
      generateBaseline: () => {
        const state = get();
        console.log('Generating baseline with decisions:', state.decisions);
        // Add your baseline generation logic here
        set({ mode: "plan" });
      },
    }),
    {
      name: "presales-storage",
    }
  )
);