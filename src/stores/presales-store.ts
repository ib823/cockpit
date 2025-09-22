import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Chip } from "@/types/core";

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
  addChips: (chips: Chip[]) => void;
  removeChip: (id: string) => void;
  validateChip: (id: string) => void;
  updateDecision: (key: string, value: any) => void;
  setMode: (mode: PresalesState["mode"]) => void;
  toggleAutoTransit: () => void;
  recordMetric: (type: "click" | "keystroke") => void;
  reset: () => void;
}

export const usePresalesStore = create<PresalesState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: "presales-storage",
    }
  )
);
