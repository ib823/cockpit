// src/stores/project-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { usePresalesStore } from "./presales-store";
import { useTimelineStore } from "./timeline-store";
import { convertPresalesToTimeline } from "@/lib/presales-to-timeline-bridge";
import { debounce } from "lodash";

export type ProjectMode = "capture" | "decide" | "plan" | "present";

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
        set({ mode });

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
          // Has manual edits - warn user
          const confirmRegenerate = window.confirm(
            `You have ${manualOverrides.length} manual edit(s). Regenerating will preserve them but may cause inconsistencies. Continue?`
          );
          if (!confirmRegenerate) return;
        }

        // Get fresh data from presales store
        const presales = usePresalesStore.getState();
        const result = convertPresalesToTimeline(presales.chips, presales.decisions);

        if (!result || result.totalEffort === 0) {
          console.error("[Project] Timeline regeneration failed");
          return;
        }

        // Apply manual overrides on top of new baseline
        const phasesWithOverrides = get().applyOverridesToPhases(result.phases);

        // Update timeline store - clear existing phases and add new ones
        const timelineStore = useTimelineStore.getState();

        // Clear existing phases by setting empty array
        useTimelineStore.setState({ phases: [] });

        // Add each phase with overrides
        phasesWithOverrides.forEach((phase) => {
          timelineStore.addPhase(phase);
        });

        set({
          timelineIsStale: false,
          lastGeneratedAt: new Date(),
        });

        console.log(
          "[Project] ✅ Timeline regenerated with",
          manualOverrides.length,
          "overrides preserved"
        );
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
