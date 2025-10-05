import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { Chip, ChipType } from "@/types/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { sanitizeChipValue } from "@/lib/input-sanitizer";
import { globalRateLimiter } from "@/lib/rate-limiter";

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
  parseText: (text: string) => void;
  updateDecision: <K extends keyof Decisions>(key: K, value: Decisions[K]) => void;
  setDecisions: (decisions: Decisions) => void;
  setDecision: (key: keyof Decisions, value: string | number) => void;
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

// SECURITY: Limits to prevent DoS attacks
const MAX_CHIPS_TOTAL = 100; // Maximum total chips allowed
const MAX_CHIP_VALUE_LENGTH = 200; // Maximum characters per chip value
const RATE_LIMIT_CHIPS = 20; // Max 20 chips per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute window

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
        const state = get();

        // SECURITY: Check rate limit
        if (!globalRateLimiter.check("add-chip", RATE_LIMIT_CHIPS, RATE_LIMIT_WINDOW)) {
          console.warn("⚠️ Rate limit exceeded: Too many chips added too quickly");
          return;
        }

        // SECURITY: Check total chip limit
        if (state.chips.length >= MAX_CHIPS_TOTAL) {
          console.warn(`⚠️ Maximum chip limit reached (${MAX_CHIPS_TOTAL})`);
          return;
        }

        // SECURITY: Sanitize chip value
        const sanitizedChip = {
          ...chip,
          value:
            typeof chip.value === "string"
              ? sanitizeChipValue(chip.value, chip.type)
              : chip.value,
        };

        set((state) => ({ chips: [...state.chips, sanitizedChip] }));
        get().calculateCompleteness();
      },

      addChips: (chips) => {
        const state = get();

        // SECURITY: Check rate limit
        if (!globalRateLimiter.check("add-chips-batch", 5, RATE_LIMIT_WINDOW)) {
          console.warn("⚠️ Rate limit exceeded: Too many batch additions");
          return;
        }

        // SECURITY: Check total chip limit
        if (state.chips.length + chips.length > MAX_CHIPS_TOTAL) {
          console.warn(
            `⚠️ Cannot add ${chips.length} chips: Would exceed limit of ${MAX_CHIPS_TOTAL}`
          );
          // Add only up to the limit
          const allowedCount = MAX_CHIPS_TOTAL - state.chips.length;
          chips = chips.slice(0, allowedCount);
        }

        // SECURITY: Sanitize all chip values
        const sanitizedChips = chips.map((chip) => ({
          ...chip,
          value:
            typeof chip.value === "string"
              ? sanitizeChipValue(chip.value, chip.type)
              : chip.value,
        }));

        set((state) => ({ chips: [...state.chips, ...sanitizedChips] }));
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
          chips: state.chips.map((c) => (c.id === id ? { ...c, validated: true } : c)),
        }));
      },

      parseText: (text: string) => {
        // Simple text parsing to extract chips from RFP text
        const lines = text.split("\n").filter((line) => line.trim());
        const extractedChips: Chip[] = [];

        lines.forEach((line, index) => {
          const lowerLine = line.toLowerCase();
          let type: ChipType = "modules";
          let confidence = 0.7;

          // Detect chip type based on keywords
          if (lowerLine.includes("employee") || lowerLine.includes("user")) {
            type = "employees";
            confidence = 0.85;
          } else if (
            lowerLine.includes("revenue") ||
            lowerLine.includes("budget") ||
            lowerLine.includes("myr") ||
            lowerLine.includes("$")
          ) {
            type = "revenue";
            confidence = 0.9;
          } else if (
            lowerLine.includes("module") ||
            lowerLine.includes("finance") ||
            lowerLine.includes("hr") ||
            lowerLine.includes("supply chain")
          ) {
            type = "modules";
            confidence = 0.95;
          } else if (
            lowerLine.includes("country") ||
            lowerLine.includes("malaysia") ||
            lowerLine.includes("singapore")
          ) {
            type = "country";
            confidence = 0.9;
          } else if (
            lowerLine.includes("industry") ||
            lowerLine.includes("manufacturing") ||
            lowerLine.includes("retail")
          ) {
            type = "industry";
            confidence = 0.85;
          } else if (
            lowerLine.includes("date") ||
            lowerLine.includes("quarter") ||
            lowerLine.includes("q1") ||
            lowerLine.includes("q2")
          ) {
            type = "timeline";
            confidence = 0.85;
          } else if (lowerLine.includes("integrate") || lowerLine.includes("integration")) {
            type = "integration";
            confidence = 0.8;
          }

          extractedChips.push({
            id: `chip-${Date.now()}-${index}`,
            type,
            value: line.trim(),
            confidence,
            source: "paste",
            validated: false,
          });
        });

        get().addChips(extractedChips);
      },

      updateDecision: (key, value) =>
        set((state) => ({
          decisions: { ...state.decisions, [key]: value },
        })),

      setDecisions: (decisions) => set({ decisions }),

      setDecision: (key, value) =>
        set((state) => ({
          decisions: { ...state.decisions, [key]: value },
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
                "legal_entities",
                "locations",
                "users",
                "data_volume",
                "country",
                "industry",
                "modules",
                "timeline",
              ],
              canProceed: false,
              blockers: ["No requirements captured - please paste RFP text"],
            },
            suggestions: [
              "Paste RFP text or upload document to extract requirements",
              "Minimum required: country, industry, modules, user count",
              "Critical factors: legal entities, locations, transaction volumes",
            ],
          });
          return;
        }

        // BALANCED SCORING: Credit for what exists + penalties for gaps
        const chipTypes = new Set(state.chips.map((c) => c.type || (c as any).kind));

        // Define scoring categories with weights
        const scoringFactors = {
          // Must-have basics (45 points)
          country: { weight: 15, severity: "high" },
          industry: { weight: 15, severity: "medium" },
          modules: { weight: 15, severity: "high" },

          // Critical complexity drivers (35 points)
          legal_entities: { weight: 15, severity: "critical" },
          locations: { weight: 12, severity: "high" },
          data_volume: { weight: 8, severity: "high" },

          // Important but not blocking (20 points)
          users: { weight: 15, severity: "medium" },
          timeline: { weight: 5, severity: "low" },
        };

        // Calculate positive score from captured chips
        let score = 0;
        const gaps: any[] = [];

        for (const [factor, config] of Object.entries(scoringFactors)) {
          if (chipTypes.has(factor as ChipType) || chipTypes.has((factor + "s") as ChipType)) {
            score += config.weight;
          } else {
            gaps.push({
              field: factor,
              severity: config.severity,
              weight: config.weight,
            });
          }
        }

        // Add bonus for having multiple chips (shows detail)
        if (state.chips.length >= 5) score += 5;
        if (state.chips.length >= 8) score += 5;

        // Penalty for vague/low-confidence chips
        const vagueChips = state.chips.filter((c) => c.confidence < 0.6).length;
        score = Math.max(0, score - vagueChips * 3);

        // Final score
        score = Math.min(100, Math.max(0, score));

        // Determine if can proceed (stricter threshold)
        const criticalGaps = gaps.filter((g) => g.severity === "critical").length;
        const canProceed = score >= 65 && criticalGaps === 0;

        // Build blockers list
        const blockers: string[] = [];
        if (criticalGaps > 0) {
          blockers.push(
            `Missing ${criticalGaps} critical factor(s): ${gaps
              .filter((g) => g.severity === "critical")
              .map((g) => g.field)
              .join(", ")}`
          );
        }
        if (score < 65 && criticalGaps === 0) {
          blockers.push("Completeness below 65% - provide more details to proceed");
        }

        // Generate suggestions
        const suggestions = generateSuggestions(gaps, score, vagueChips);

        set({
          completeness: {
            score,
            gaps: gaps.map((g) => g.field),
            canProceed,
            blockers,
          },
          suggestions,
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

          // MILESTONE 1 FIX: Actually load the generated data into timeline store
          if (result) {
            // Import timeline store dynamically to avoid circular dependencies
            import('@/stores/timeline-store').then(({ useTimelineStore }) => {
              const timelineStore = useTimelineStore.getState();

              // Set project info from profile
              if (result.profile) {
                timelineStore.setProjectInfo({
                  company: result.profile.company || '',
                  industry: result.profile.industry || 'manufacturing',
                  employees: result.profile.employees || 500,
                });
              }

              // Set selected packages
              if (result.selectedPackages && result.selectedPackages.length > 0) {
                timelineStore.setSelectedPackages(result.selectedPackages);
              }

              // Set phases
              if (result.phases && result.phases.length > 0) {
                console.log(`[PresalesStore] Loading ${result.phases.length} phases into timeline store`);
                timelineStore.setPhases(result.phases);
              } else {
                console.warn('[PresalesStore] No phases generated, attempting timeline generation');
                timelineStore.generateTimeline();
              }
            });
          }

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
        typeof window !== "undefined" ? localStorage : ({} as any)
      ),
    }
  )
);

// Helper: Check for critical chip combinations
function checkCriticalCombinations(chips: Chip[]): boolean {
  const chipTypes = new Set(chips.map((c) => c.type || (c as any).kind));

  // Must have at least: country OR industry, AND (employees OR users), AND modules
  const hasLocation = chipTypes.has("country" as any) || chipTypes.has("locations" as any);
  const hasIndustry = chipTypes.has("industry" as any);
  const hasSize = chipTypes.has("employees" as any) || chipTypes.has("users" as any);
  const hasModules = chipTypes.has("modules" as any);

  return (hasLocation || hasIndustry) && hasSize && hasModules;
}

// Helper: Generate intelligent suggestions based on gaps
function generateSuggestions(gaps: any[], score: number, vagueCount: number): string[] {
  const suggestions: string[] = [];

  if (score === 0) {
    return [
      "Start by pasting RFP text or uploading the requirement document",
      "We need at minimum: country, industry, modules, and user count",
    ];
  }

  if (gaps.length === 0) {
    suggestions.push("✅ All critical information captured - ready to generate timeline");
  } else {
    // Add top 3 gap questions
    const topGaps = gaps
      .filter((g: any) => g.severity === "critical" || g.severity === "high")
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
    suggestions.push(`📊 ${score}% complete - provide more details to reach 70% minimum`);
  }

  return suggestions.slice(0, 4); // Max 4 suggestions
}
