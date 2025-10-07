// src/stores/project-store.ts
import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { track } from "@/lib/analytics";
import { debounce } from "lodash";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePresalesStore } from "./presales-store";
import { useTimelineStore } from "./timeline-store";

export type ProjectMode = 'capture' | 'decide' | 'plan' | 'present';

interface ManualOverride {
  phaseId: string;
  field: "duration" | "effort" | "resources";
  originalValue: any;
  manualValue: any;
  reason?: string;
  timestamp: Date;
}

interface ProjectState {
  // Core state
  mode: ProjectMode;
  projectId: string;

  // Timeline state
  timelineIsStale: boolean;
  lastGeneratedAt: Date | null;
  manualOverrides: ManualOverride[];

  // Panel sizes
  leftPanelWidth: number;
  rightPanelWidth: number;

  // Actions
  setMode: (mode: ProjectMode) => void;
  regenerateTimeline: (force?: boolean) => void;
  markTimelineStale: () => void;
  addManualOverride: (override: ManualOverride) => void;
  clearManualOverrides: () => void;
  applyOverridesToPhases: (phases: any[]) => any[];
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  reset: () => void;

  // Internal
  _debouncedRegenerate: (() => void) | null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: "capture",
      projectId: "default",
      timelineIsStale: false,
      lastGeneratedAt: null,
      manualOverrides: [],
      leftPanelWidth: 320,
      rightPanelWidth: 384,
      _debouncedRegenerate: null,

      setMode: (mode) => {
        const prevMode = get().mode;
        set({ mode });

        // Track mode transition
        if (prevMode !== mode) {
          track("mode_transition", { from: prevMode, to: mode });
        }

        // Auto-regenerate when switching to plan mode
        if (mode === "plan" && get().timelineIsStale) {
          get().regenerateTimeline();
        }
      },

      markTimelineStale: () => {
        set({ timelineIsStale: true });

        // Trigger debounced regenerate (500ms after last change)
        if (!get()._debouncedRegenerate) {
          const debouncedFn = debounce(() => {
            if (get().mode === "plan") {
              get().regenerateTimeline();
            }
          }, 500);
          set({ _debouncedRegenerate: debouncedFn });
        }

        get()._debouncedRegenerate?.();
      },

      regenerateTimeline: (force = false) => {
        const { manualOverrides } = get();

        if (!force && manualOverrides.length > 0) {
          const confirmRegenerate = window.confirm(
            `You have ${manualOverrides.length} manual edit(s). Regenerating will preserve them but may cause inconsistencies. Continue?`
          );
          if (!confirmRegenerate) return;
        }

        console.log("[ProjectStore] 🔄 Starting timeline regeneration...");

        const presalesStore = usePresalesStore.getState();
        const timelineStore = useTimelineStore.getState();

        const chips = presalesStore.chips;
        const decisions = presalesStore.decisions;

        console.log(`[ProjectStore] Input: ${chips.length} chips, decisions:`, decisions);

        if (chips.length === 0) {
          console.warn("[ProjectStore] ⚠️ No chips available - cannot generate timeline");
          return;
        }

        // Convert presales data to timeline
        const result = convertPresalesToTimeline(chips, decisions);

        console.log(`[ProjectStore] ✅ Conversion result:`, {
          phases: result.phases.length,
          packages: result.selectedPackages.length,
          effort: result.totalEffort,
        });

        // **CRITICAL FIX**: Update timeline store with generated data
        if (result.phases && result.phases.length > 0) {
          timelineStore.setPhases(result.phases);
          timelineStore.setSelectedPackages(result.selectedPackages);
          timelineStore.setProfile(result.profile);

          console.log(`[ProjectStore] ✅ Timeline store updated with ${result.phases.length} phases`);

          // Track timeline generation
          track("timeline_generated", {
            phaseCount: result.phases.length,
            chipCount: chips.length,
            totalEffort: result.totalEffort || 0,
          });

          set({
            timelineIsStale: false,
            lastGeneratedAt: new Date(),
          });
        } else {
          console.error("[ProjectStore] ❌ No phases generated from conversion");
        }
      },

      addManualOverride: (override) => {
        set((state) => ({
          manualOverrides: [...state.manualOverrides, { ...override, timestamp: new Date() }],
        }));
        console.log("[Project] Manual override added:", override);
      },

      clearManualOverrides: () => {
        set({ manualOverrides: [] });
      },

      applyOverridesToPhases: (phases) => {
        const { manualOverrides } = get();

        return phases.map((phase) => {
          const overrides = manualOverrides.filter((o) => o.phaseId === phase.id);

          const modifiedPhase = { ...phase };
          overrides.forEach((override) => {
            modifiedPhase[override.field] = override.manualValue;
            modifiedPhase._hasManualOverride = true;
            modifiedPhase._overrideReason = override.reason;
          });

          return modifiedPhase;
        });
      },

      setLeftPanelWidth: (width) => {
        set({ leftPanelWidth: Math.max(240, Math.min(480, width)) });
      },

      setRightPanelWidth: (width) => {
        set({ rightPanelWidth: Math.max(300, Math.min(600, width)) });
      },

      reset: () => {
        set({
          mode: "capture",
          projectId: "default",
          timelineIsStale: false,
          lastGeneratedAt: null,
          manualOverrides: [],
          leftPanelWidth: 320,
          rightPanelWidth: 384,
        });
      },
    }),
    {
      name: "project-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        projectId: state.projectId,
        leftPanelWidth: state.leftPanelWidth,
        rightPanelWidth: state.rightPanelWidth,
        // Don't persist stale state or overrides
      }),
    }
  )
);

// Hook into presales store changes
if (typeof window !== "undefined") {
  usePresalesStore.subscribe((state, prevState) => {
    // Check if chips or decisions changed
    if (state.chips !== prevState.chips || state.decisions !== prevState.decisions) {
      useProjectStore.getState().markTimelineStale();
    }
  });
}
