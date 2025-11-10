/**
 * Unified Project Store
 * Single source of truth for project state across all tiers
 * Fixes date fragmentation and NaN bugs
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════

export interface TimelinePhase {
  id: string;
  name: string;
  startBD: number; // Business days from project start
  durationBD: number; // Duration in business days
  progress?: number; // 0-100
  critical?: boolean;
  baseline?: {
    startBD: number;
    durationBD: number;
  };
  dependsOn?: string[]; // Phase IDs (finish-to-start dependencies)
  color?: string;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  allocation: number; // 0-100%
  costPerDay?: number;
}

export interface EstimateData {
  projectName: string;
  projectType: string;
  complexity: string;
  timeline: number;
  budget?: number;
  modules: string[];
  customizations: string[];
}

export interface PresalesData {
  chips: Array<{
    id: string;
    name: string;
    category: string;
    effortMD: number;
    selected: boolean;
  }>;
  decisions: Record<string, any>;
}

export interface TimelineData {
  startDateISO: string; // ISO date string '2025-01-06'
  phases: TimelinePhase[];
  resources: Resource[];
  holidays: string[]; // ISO date strings
}

interface ProjectState {
  // Core state
  activeProjectId: string | null;
  clientSafe: boolean;

  // Tier 1: Estimator
  estimate: EstimateData | null;

  // Tier 2: Presales (Decide)
  presales: PresalesData;

  // Tier 3: Timeline (Plan)
  timeline: TimelineData;

  // Actions
  setActiveProject: (id: string | null) => void;
  setClientSafe: (enabled: boolean) => void;

  // Estimate actions
  setEstimate: (estimate: EstimateData | null) => void;

  // Presales actions
  addChip: (chip: PresalesData["chips"][0]) => void;
  removeChip: (chipId: string) => void;
  toggleChip: (chipId: string) => void;
  setDecision: (key: string, value: any) => void;

  // Timeline actions
  setTimelineStart: (dateISO: string) => void;
  addPhase: (phase: TimelinePhase) => void;
  updatePhase: (phaseId: string, updates: Partial<TimelinePhase>) => void;
  removePhase: (phaseId: string) => void;
  addResource: (resource: Resource) => void;
  updateResource: (resourceId: string, updates: Partial<Resource>) => void;
  removeResource: (resourceId: string) => void;
  addHoliday: (dateISO: string) => void;
  removeHoliday: (dateISO: string) => void;

  // Reset
  reset: () => void;
}

// ════════════════════════════════════════════════════════════════════
// Initial State
// ════════════════════════════════════════════════════════════════════

const initialState = {
  activeProjectId: null,
  clientSafe: false,
  estimate: null,
  presales: {
    chips: [],
    decisions: {},
  },
  timeline: {
    startDateISO: new Date().toISOString().split("T")[0], // Today
    phases: [],
    resources: [],
    holidays: [],
  },
};

// ════════════════════════════════════════════════════════════════════
// Store
// ════════════════════════════════════════════════════════════════════

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        // Core actions
        setActiveProject: (id) =>
          set((state) => {
            state.activeProjectId = id;
          }),

        setClientSafe: (enabled) =>
          set((state) => {
            state.clientSafe = enabled;
          }),

        // Estimate actions
        setEstimate: (estimate) =>
          set((state) => {
            state.estimate = estimate;
          }),

        // Presales actions
        addChip: (chip) =>
          set((state) => {
            state.presales.chips.push(chip);
          }),

        removeChip: (chipId) =>
          set((state) => {
            state.presales.chips = state.presales.chips.filter((c) => c.id !== chipId);
          }),

        toggleChip: (chipId) =>
          set((state) => {
            const chip = state.presales.chips.find((c) => c.id === chipId);
            if (chip) {
              chip.selected = !chip.selected;
            }
          }),

        setDecision: (key, value) =>
          set((state) => {
            state.presales.decisions[key] = value;
          }),

        // Timeline actions
        setTimelineStart: (dateISO) =>
          set((state) => {
            state.timeline.startDateISO = dateISO;
          }),

        addPhase: (phase) =>
          set((state) => {
            state.timeline.phases.push(phase);
          }),

        updatePhase: (phaseId, updates) =>
          set((state) => {
            const phase = state.timeline.phases.find((p) => p.id === phaseId);
            if (phase) {
              Object.assign(phase, updates);
            }
          }),

        removePhase: (phaseId) =>
          set((state) => {
            state.timeline.phases = state.timeline.phases.filter((p) => p.id !== phaseId);
          }),

        addResource: (resource) =>
          set((state) => {
            state.timeline.resources.push(resource);
          }),

        updateResource: (resourceId, updates) =>
          set((state) => {
            const resource = state.timeline.resources.find((r) => r.id === resourceId);
            if (resource) {
              Object.assign(resource, updates);
            }
          }),

        removeResource: (resourceId) =>
          set((state) => {
            state.timeline.resources = state.timeline.resources.filter((r) => r.id !== resourceId);
          }),

        addHoliday: (dateISO) =>
          set((state) => {
            if (!state.timeline.holidays.includes(dateISO)) {
              state.timeline.holidays.push(dateISO);
            }
          }),

        removeHoliday: (dateISO) =>
          set((state) => {
            state.timeline.holidays = state.timeline.holidays.filter((h) => h !== dateISO);
          }),

        // Reset
        reset: () => set(initialState),
      })),
      {
        name: "project-store",
        partialize: (state) => ({
          activeProjectId: state.activeProjectId,
          clientSafe: state.clientSafe,
          estimate: state.estimate,
          presales: state.presales,
          timeline: state.timeline,
        }),
      }
    )
  )
);
