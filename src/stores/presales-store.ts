import { identifyGaps } from "@/lib/chip-parser";
import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { Chip } from "@/types/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Types
export type Mode = "capture" | "decide" | "plan" | "review" | "present";

interface Decisions {
  moduleCombo?: string;
  bankingPath?: string;
  rateRegion?: string;
  ssoMode?: string;
  targetPrice?: number;
  targetMargin?: number;
}

interface Completeness {
  score: number;
  gaps: string[];
  canProceed: boolean;
  blockers: string[];
}

interface Metrics {
  clicks: number;
  keystrokes: number;
  timeSpent: number;
}

interface PresalesState {
  // State
  chips: Chip[];
  decisions: Decisions;
  completeness: Completeness;
  suggestions: string[];
  mode: Mode;
  isAutoTransit: boolean;
  metrics: Metrics;

  // Actions
  addChip: (chip: Chip) => void;
  addChips: (chips: Chip[]) => void;
  clearChips: () => void;
  removeChip: (id: string) => void;
  validateChip: (id: string) => void;
  updateDecision: <K extends keyof Decisions>(key: K, value: Decisions[K]) => void;
  setDecisions: (decisions: Decisions) => void;

  setMode: (mode: Mode) => void;
  toggleAutoTransit: () => void;

  recordMetric: (type: "click" | "keystroke") => void;
  reset: () => void;

  calculateCompleteness: () => void;
  handleGapFix: (action: unknown) => void;

  generateBaseline: () => void;
  generateTimelineFromPresales: () => unknown | null;
}

// Initial completeness
const initialCompleteness: Completeness = {
  score: 0,
  gaps: [],
  canProceed: false,
  blockers: [],
};

export const usePresalesStore = create<PresalesState>()(
  persist(
    (set, get) => ({
      // ---- State ----
      chips: [],
      decisions: {},
      completeness: initialCompleteness,
      suggestions: [],
      mode: "capture",
      isAutoTransit: true,
      metrics: { clicks: 0, keystrokes: 0, timeSpent: 0 },

      // ---- Actions ----
      addChip: (chip) => {
        set((state) => ({ chips: [...state.chips, chip] }));
        get().calculateCompleteness();
      },

      addChips: (chips) => {
        set((state) => ({ chips: [...state.chips, ...chips] }));
        get().calculateCompleteness();
      },

      clearChips: () => {
        set({
          chips: [],
          completeness: { ...initialCompleteness },
          suggestions: [],
        });
      },

      removeChip: (id) => {
        set((state) => ({ chips: state.chips.filter((c) => c.id !== id) }));
        get().calculateCompleteness();
      },

      validateChip: (id) => {
        set((state) => ({
          chips: state.chips.map((c) =>
            c.id === id ? { ...c, validated: true } : c
          ),
        }));
      },

      updateDecision: (key, value) =>
        set((state) => ({
          decisions: { ...state.decisions, [key]: value },
        })),

      setDecisions: (decisions) => set({ decisions }),

      setMode: (mode) => set({ mode }),
      toggleAutoTransit: () =>
        set((state) => ({ isAutoTransit: !state.isAutoTransit })),

      recordMetric: (type) =>
        set((state) => ({
          metrics: {
            ...state.metrics,
            clicks:
              type === "click" ? state.metrics.clicks + 1 : state.metrics.clicks,
            keystrokes:
              type === "keystroke"
                ? state.metrics.keystrokes + 1
                : state.metrics.keystrokes,
          },
        })),

      reset: () =>
        set({
          chips: [],
          decisions: {},
          completeness: { ...initialCompleteness },
          suggestions: [],
          mode: "capture",
          isAutoTransit: true,
          metrics: { clicks: 0, keystrokes: 0, timeSpent: 0 },
        }),

      calculateCompleteness: () => {
        const state = get();
        const gaps = (identifyGaps(state.chips) ?? []) as string[];
        const gapCount = gaps.length;

        const score = Math.max(0, Math.min(100, ((10 - gapCount) / 10) * 100));
        const canProceed = score >= 60;
        const blockers = gaps.filter((g) =>
          g.match(/country|modules|timeline/i)
        );

        set({
          completeness: { score, gaps, canProceed, blockers },
          suggestions:
            gaps.length > 0
              ? [`Add ${gaps.slice(0, 2).join(" and ")} to improve completeness`]
              : [],
        });
      },

      handleGapFix: (action) => {
        console.log("Handling gap fix:", action);
      },

      generateBaseline: () => {
        const state = get();
        console.log("Generating baseline with decisions:", state.decisions);
        state.generateTimelineFromPresales();
        set({ mode: "plan" });
      },

      generateTimelineFromPresales: () => {
        const { chips, decisions } = get();
        try {
          const result = convertPresalesToTimeline(chips, decisions);
          console.log("Timeline generation result:", result);
          set({ mode: "plan" });
          return result;
        } catch (err) {
          console.error("Failed to generate timeline:", err);
          return null;
        }
      },
    }),
    {
      name: "presales-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
    }
  )
);