import { Chip } from "@/types/core";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { parseRFPText } from "@/lib/chip-parser";

// --- State & Types ---

export type PresalesMode = "capture" | "decide" | "plan" | "review" | "present";

interface Completeness {
  score: number;
  gaps: string[];
  blockers: string[];
  canProceed: boolean;
}

interface PresalesState {
  projectId: string | null;
  isLoading: boolean;
  error: string | null;
  chips: Chip[];
  decisions: any; // Partial<Decisions>;
  mode: PresalesMode;
  completeness: Completeness;
  suggestions: string[];

  // Actions
  loadProject: (projectId: string) => Promise<void>;
  addChip: (chipData: Omit<Chip, "id" | "projectId" | "createdAt" | "updatedAt">) => void;
  addChips: (chipsData: Omit<Chip, "id" | "projectId" | "createdAt" | "updatedAt">[]) => void;
  removeChip: (chipId: string) => void;
  clearChips: () => void;
  setMode: (mode: PresalesMode) => void;
  updateDecision: (key: string, value: any) => void;
  generateTimeline: () => Promise<void>;
  calculateCompleteness: () => void;
  handleGapFix: (gap: string) => void;
  recordMetric: (metric: string) => void;
  parseText: (text: string) => void;
  reset: () => void;
}

// --- Store ---

export const usePresalesStore = create<PresalesState>()(
  persist(
    immer((set, get) => ({
      // --- Initial State ---
      projectId: null,
      isLoading: false,
      error: null,
      chips: [],
      decisions: {},
      mode: "capture",
      completeness: {
        score: 0,
        gaps: [],
        blockers: [],
        canProceed: false,
      },
      suggestions: [],

      // --- Actions ---

      loadProject: async (projectId) => {
        set({ isLoading: true, error: null, projectId });
        try {
          // Load from localStorage for now (client-side)
          // Note: Future enhancement - fetch from API route for server-side persistence
          const chips: Chip[] = [];
          set((state) => {
            state.chips = chips || [];
            state.isLoading = false;
          });
          get().calculateCompleteness(); // Recalculate after loading
        } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
        }
      },

      addChip: (chipData) => {
        console.log("addChip called", chipData);
        set((state) => {
          state.chips.push(chipData as Chip);
        });
        get().calculateCompleteness();
      },

      addChips: (chipsData) => {
        set((state) => {
          state.chips.push(...(chipsData as Chip[]));
        });
        get().calculateCompleteness();
      },

      removeChip: (chipId) => {
        set((state) => {
          state.chips = state.chips.filter((c: Chip) => c.id !== chipId);
        });
        get().calculateCompleteness();
      },

      clearChips: () => {
        set({ chips: [], suggestions: [] });
        get().calculateCompleteness();
      },

      calculateCompleteness: () => {
        // Dummy implementation
        console.log("Warning: calculateCompleteness is a dummy implementation.");
        set((state) => {
          state.completeness.score = state.chips.length * 10; // Example logic
        });
      },

      handleGapFix: (gap) => {
        console.log("handleGapFix called for", gap);
      },

      recordMetric: (metric) => {
        console.log("recordMetric called for", metric);
      },

      parseText: (text) => {
        console.log("[PresalesStore] Parsing RFP text:", text.substring(0, 100) + "...");
        const parsedChips = parseRFPText(text);
        console.log(`[PresalesStore] Parsed ${parsedChips.length} chips from text`);
        get().addChips(parsedChips);
      },

      setMode: (mode) => {
        set({ mode });
      },

      updateDecision: (key, value) => {
        set((state) => {
          state.decisions[key] = value;
        });
      },

      generateTimeline: async () => {
        // Dummy implementation
        console.log("generateTimeline called");
      },

      reset: () => {
        set({
          projectId: null,
          isLoading: false,
          error: null,
          chips: [],
          decisions: {},
          mode: "capture",
          completeness: { score: 0, gaps: [], blockers: [], canProceed: false },
          suggestions: [],
        });
      },
    })),
    {
      name: "cockpit-presales-storage",
      partialize: (state) => ({
        chips: state.chips,
        decisions: state.decisions,
        mode: state.mode,
      }),
      version: 1,
    }
  )
);
