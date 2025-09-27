// Enhanced Presales Store with Completeness Validation
import { Chip } from "@/types/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  calculateCompleteness,
  shouldAutoTransit,
  getCompletionSuggestions,
  CompletenessResult,
  GapCard
} from "@/lib/completeness-validator";

interface PresalesState {
  // === EXISTING STATE ===
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

  // === NEW: COMPLETENESS VALIDATION ===
  completeness: CompletenessResult;
  suggestions: string[];
  lastValidation: Date | null;

  // === EXISTING ACTIONS ===
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
  setDecisions: (decisions: PresalesState["decisions"]) => void;
  generateBaseline: () => void;

  // === NEW: COMPLETENESS ACTIONS ===
  calculateCompleteness: () => void;
  forceRecalculate: () => void;
  getGaps: () => GapCard[];
  getBlockers: () => string[];
  canProceed: () => boolean;
  handleGapFix: (gapId: string, action: string) => void;
  checkAutoTransit: () => void;
  
  // === NEW: VALIDATION HELPERS ===
  isFieldComplete: (fieldKey: string) => boolean;
  getCompletionScore: () => number;
  getCategoryScore: (category: string) => number;
}

// Default completeness result
const defaultCompleteness: CompletenessResult = {
  score: 0,
  gaps: [],
  blockers: [],
  warnings: [],
  canProceed: false
};

export const usePresalesStore = create<PresalesState>()(
  persist(
    (set, get) => ({
      // === EXISTING STATE ===
      chips: [],
      decisions: {},
      mode: "capture",
      isAutoTransit: true,
      metrics: {
        clicks: 0,
        keystrokes: 0,
        timeSpent: 0,
      },

      // === NEW STATE ===
      completeness: defaultCompleteness,
      suggestions: [],
      lastValidation: null,

      // === EXISTING ACTIONS (ENHANCED) ===
      addChip: (chip) => {
        set((state) => ({
          chips: [...state.chips, chip],
        }));
        // Trigger validation after chip addition
        setTimeout(() => get().calculateCompleteness(), 0);
      },

      clearChips: () => {
        set({ chips: [] });
        setTimeout(() => get().calculateCompleteness(), 0);
      },

      addChips: (chips) => {
        set((state) => ({
          chips: [...state.chips, ...chips],
        }));
        setTimeout(() => get().calculateCompleteness(), 0);
      },

      removeChip: (id) => {
        set((state) => ({
          chips: state.chips.filter((c) => c.id !== id),
        }));
        setTimeout(() => get().calculateCompleteness(), 0);
      },

      validateChip: (id) =>
        set((state) => ({
          chips: state.chips.map((c) => (c.id === id ? { ...c, validated: true } : c)),
        })),

      updateDecision: (key, value) => {
        set((state) => ({
          decisions: {
            ...state.decisions,
            [key]: value,
          },
        }));
        // Trigger validation after decision update
        setTimeout(() => get().calculateCompleteness(), 0);
      },

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

      reset: () => {
        set({
          chips: [],
          decisions: {},
          mode: "capture",
          isAutoTransit: true,
          metrics: { clicks: 0, keystrokes: 0, timeSpent: 0 },
          completeness: defaultCompleteness,
          suggestions: [],
          lastValidation: null,
        });
      },

      setDecisions: (decisions) => {
        set({ decisions });
        setTimeout(() => get().calculateCompleteness(), 0);
      },

      generateBaseline: () => {
        const state = get();
        console.log('Generating baseline with decisions:', state.decisions);
        console.log('Completeness score:', state.completeness.score);
        
        // Enhanced baseline generation with validation
        if (state.completeness.canProceed) {
          set({ mode: "plan" });
        } else {
          console.warn('Cannot generate baseline - completeness requirements not met');
          console.log('Missing:', state.completeness.blockers);
        }
      },

      // === NEW: COMPLETENESS ACTIONS ===
      calculateCompleteness: () => {
        const state = get();
        const result = calculateCompleteness(state.chips, state.decisions);
        const suggestions = getCompletionSuggestions(state.chips, state.decisions);
        
        set({
          completeness: result,
          suggestions,
          lastValidation: new Date()
        });

        // Check for auto-transit if enabled
        if (state.isAutoTransit) {
          get().checkAutoTransit();
        }
      },

      forceRecalculate: () => {
        get().calculateCompleteness();
      },

      getGaps: () => {
        return get().completeness.gaps;
      },

      getBlockers: () => {
        return get().completeness.blockers;
      },

      canProceed: () => {
        return get().completeness.canProceed;
      },

      handleGapFix: (gapId: string, action: string) => {
        // Handle specific gap fixes
        switch (gapId) {
          case 'country':
            console.log('Fix action for country:', action);
            // Could open a modal or guide user to add country info
            break;
          case 'employees':
            console.log('Fix action for employees:', action);
            // Could prompt for employee count
            break;
          case 'moduleCombo':
            console.log('Fix action for module combo:', action);
            // Could auto-focus the module combo decision
            break;
          case 'rateRegion':
            console.log('Fix action for rate region:', action);
            // Could auto-focus the rate region decision
            break;
          default:
            console.log(`Fix action for ${gapId}:`, action);
        }
        
        // Record metric
        get().recordMetric('click');
      },

      checkAutoTransit: () => {
        const state = get();
        const transitResult = shouldAutoTransit(state.completeness, state.mode);
        
        if (transitResult.shouldTransit && transitResult.nextMode) {
          console.log(`Auto-transit: ${state.mode} → ${transitResult.nextMode}`);
          console.log(`Reason: ${transitResult.reason}`);
          
          set({ mode: transitResult.nextMode as any });
          
          // Could show a toast notification here
          // toast.success(`Advanced to ${transitResult.nextMode} mode: ${transitResult.reason}`);
        }
      },

      // === NEW: VALIDATION HELPERS ===
      isFieldComplete: (fieldKey: string) => {
        const state = get();
        return !state.completeness.gaps.some(gap => gap.id === fieldKey);
      },

      getCompletionScore: () => {
        return get().completeness.score;
      },

      getCategoryScore: (category: string) => {
        // Implementation would depend on adding category scoring to validator
        return 0; // Placeholder
      },
    }),
    {
      name: "presales-storage",
      // Only persist essential state, not computed values
      partialize: (state) => ({
        chips: state.chips,
        decisions: state.decisions,
        mode: state.mode,
        isAutoTransit: state.isAutoTransit,
        metrics: state.metrics,
      }),
    }
  )
);

// Enhanced selectors
export const usePresalesCompleteness = () => usePresalesStore(state => state.completeness);
export const usePresalesGaps = () => usePresalesStore(state => state.completeness.gaps);
export const usePresalesCanProceed = () => usePresalesStore(state => state.completeness.canProceed);
export const usePresalesScore = () => usePresalesStore(state => state.completeness.score);
export const usePresalesSuggestions = () => usePresalesStore(state => state.suggestions);

// Initialize completeness calculation on first load
if (typeof window !== 'undefined') {
  // Trigger initial calculation after store is ready
  setTimeout(() => {
    const store = usePresalesStore.getState();
    store.calculateCompleteness();
  }, 100);
}