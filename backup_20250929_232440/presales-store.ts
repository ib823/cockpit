import { identifyCriticalGaps } from "@/lib/enhanced-chip-parser";
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
  chips: Chip[];
  decisions: Decisions;
  completeness: Completeness;
  suggestions: string[];
  mode: Mode;
  isAutoTransit: boolean;
  metrics: Metrics;

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

const initialCompleteness: Completeness = {
  score: 0,
  gaps: [],
  canProceed: false,
  blockers: [],
};

export const usePresalesStore = create<PresalesState>()(
  persist(
    (set, get) => ({
      chips: [],
      decisions: {},
      completeness: initialCompleteness,
      suggestions: [],
      mode: "capture",
      isAutoTransit: true,
      metrics: { clicks: 0, keystrokes: 0, timeSpent: 0 },

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
            clicks: type === "click" ? state.metrics.clicks + 1 : state.metrics.clicks,
            keystrokes: type === "keystroke" ? state.metrics.keystrokes + 1 : state.metrics.keystrokes,
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
        
        // CRITICAL: Empty input = 0% score with all gaps
        if (state.chips.length === 0) {
          set({
            completeness: {
              score: 0,
              gaps: [
                'legal_entities',
                'locations',
                'users',
                'data_volume',
                'country',
                'industry',
                'modules',
                'timeline'
              ],
              canProceed: false,
              blockers: ['No requirements captured - please paste RFP text']
            },
            suggestions: [
              'Paste RFP text or upload document to extract requirements',
              'Minimum required: country, industry, modules, user count',
              'Critical factors: legal entities, locations, transaction volumes'
            ]
          });
          return;
        }

        // Identify critical gaps using enhanced parser
        const gaps = identifyCriticalGaps(state.chips as any);
        const criticalGaps = gaps.filter((g: any) => g.severity === 'critical').length;
        const highGaps = gaps.filter((g: any) => g.severity === 'high').length;
        const mediumGaps = gaps.filter((g: any) => g.severity === 'medium').length;
        
        // AGGRESSIVE PENALTIES (was 30/15/10, now 40/20/10)
        const maxScore = 100;
        const criticalPenalty = 40;  // Increased from 30
        const highPenalty = 20;      // Increased from 15
        const mediumPenalty = 10;
        
        // Calculate score with aggressive penalties
        let score = maxScore - 
          (criticalGaps * criticalPenalty) - 
          (highGaps * highPenalty) - 
          (mediumGaps * mediumPenalty);
        
        // Check for vague/low-confidence chips
        const vagueChips = state.chips.filter(c => c.confidence < 0.6).length;
        const vaguePenalty = vagueChips * 5; // 5 points per vague chip
        score = Math.max(0, score - vaguePenalty);
        
        // Additional penalty for missing critical combinations
        const hasCriticalCombos = checkCriticalCombinations(state.chips);
        if (!hasCriticalCombos) {
          score = Math.max(0, score - 15); // Additional 15-point penalty
        }
        
        // Final score
        score = Math.max(0, score);
        
        // Stricter proceed threshold (was 60, now 70)
        const canProceed = score >= 70 && criticalGaps === 0;
        
        // Clear blockers list
        const blockers: string[] = [];
        
        if (criticalGaps > 0) {
          blockers.push(
            ...gaps
              .filter((g: any) => g.severity === 'critical')
              .map((g: any) => g.message || g.field)
          );
        }
        
        if (score < 70 && criticalGaps === 0) {
          blockers.push('Completeness below 70% - missing important requirements');
        }

        // Generate intelligent suggestions
        const suggestions = generateSuggestions(gaps, score, vagueChips);

        set({
          completeness: { 
            score, 
            gaps: gaps.map((g: any) => g.field),
            canProceed, 
            blockers 
          },
          suggestions
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

// Helper: Check for critical chip combinations
function checkCriticalCombinations(chips: Chip[]): boolean {
  const chipTypes = new Set(chips.map(c => c.type || (c as any).kind));
  
  // Must have at least: country OR industry, AND (employees OR users), AND modules
  const hasLocation = chipTypes.has('country') || chipTypes.has('state') || chipTypes.has('city');
  const hasIndustry = chipTypes.has('industry');
  const hasSize = chipTypes.has('employees') || chipTypes.has('users');
  const hasModules = chipTypes.has('modules');
  
  return (hasLocation || hasIndustry) && hasSize && hasModules;
}

// Helper: Generate intelligent suggestions based on gaps
function generateSuggestions(gaps: any[], score: number, vagueCount: number): string[] {
  const suggestions: string[] = [];
  
  if (score === 0) {
    return [
      'Start by pasting RFP text or uploading the requirement document',
      'We need at minimum: country, industry, modules, and user count'
    ];
  }
  
  if (gaps.length === 0) {
    suggestions.push('✅ All critical information captured - ready to generate timeline');
  } else {
    // Add top 3 gap questions
    const topGaps = gaps
      .filter((g: any) => g.severity === 'critical' || g.severity === 'high')
      .slice(0, 3);
    
    topGaps.forEach((gap: any) => {
      suggestions.push(gap.question || `Please specify ${gap.field}`);
    });
  }
  
  if (vagueCount > 0) {
    suggestions.push(
      `⚠️ ${vagueCount} vague requirement(s) detected - please provide specific numbers`
    );
  }
  
  if (score < 70 && score > 0) {
    suggestions.push(
      `📊 ${score}% complete - provide more details to reach 70% minimum`
    );
  }
  
  return suggestions.slice(0, 4); // Max 4 suggestions
}