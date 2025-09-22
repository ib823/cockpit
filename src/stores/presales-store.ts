// Presales Store - State management using Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Chip, 
  Decision, 
  ScenarioPlan, 
  ClientProfile,
  Override,
  Guardrail 
} from '@/types/core';
import { parseChips, identifyGaps } from '@/lib/chip-parser';
import { generateBaselineScenario } from '@/lib/scenario-generator';

interface PresalesState {
  // Core data
  chips: Chip[];
  decisions: Decision[];
  scenarios: ScenarioPlan[];
  activeScenarioId: string | null;
  clientProfile: ClientProfile | null;
  overrides: Override[];
  guardrails: Guardrail[];
  
  // UI state
  mode: 'capture' | 'decide' | 'plan' | 'review' | 'present';
  isAutoTransit: boolean;
  showMetrics: boolean;
  
  // Metrics
  metrics: {
    clicks: number;
    keystrokes: number;
    timeSpent: number;
    lastAction: string;
  };
  
  // Actions
  addChips: (text: string) => void;
  updateChip: (id: string, updates: Partial<Chip>) => void;
  removeChip: (id: string) => void;
  validateChip: (id: string) => void;
  clearChips: () => void;
  
  makeDecision: (decision: Decision) => void;
  updateDecision: (id: string, updates: Partial<Decision>) => void;
  
  generateBaseline: () => void;
  createScenario: (name: string) => void;
  updateScenario: (id: string, updates: Partial<ScenarioPlan>) => void;
  setActiveScenario: (id: string) => void;
  
  addOverride: (override: Override) => void;
  removeOverride: (id: string) => void;
  
  updateGuardrails: () => void;
  
  setMode: (mode: PresalesState['mode']) => void;
  toggleAutoTransit: () => void;
  toggleMetrics: () => void;
  
  recordMetric: (type: 'click' | 'key', action: string) => void;
  
  reset: () => void;
  exportData: () => string;
  importData: (data: string) => void;
}

const initialState = {
  chips: [],
  decisions: [],
  scenarios: [],
  activeScenarioId: null,
  clientProfile: null,
  overrides: [],
  guardrails: [],
  mode: 'capture' as const,
  isAutoTransit: true,
  showMetrics: false,
  metrics: {
    clicks: 0,
    keystrokes: 0,
    timeSpent: 0,
    lastAction: '',
  },
};

// Helper to check if a chip already exists
function isDuplicateChip(existingChips: Chip[], newChip: Chip): boolean {
  return existingChips.some(chip => {
    if (chip.kind === newChip.kind) {
      // For string values, compare normalized
      if (typeof chip.parsed.value === 'string' && typeof newChip.parsed.value === 'string') {
        return chip.parsed.value.toLowerCase() === newChip.parsed.value.toLowerCase();
      }
      // For numeric values, compare the actual number
      return chip.parsed.value === newChip.parsed.value;
    }
    return false;
  });
}

export const usePresalesStore = create<PresalesState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Chip actions
        addChips: (text: string) => {
          const newChips = parseChips(text);
          const existingChips = get().chips;
          
          // Filter out duplicates
          const uniqueNewChips = newChips.filter(
            newChip => !isDuplicateChip(existingChips, newChip)
          );
          
          set((state) => ({
            chips: [...state.chips, ...uniqueNewChips],
            metrics: {
              ...state.metrics,
              lastAction: `Added ${uniqueNewChips.length} new chips (${newChips.length - uniqueNewChips.length} duplicates filtered)`,
            },
          }));
          
          // Auto-transit if enabled
          if (get().isAutoTransit && uniqueNewChips.length > 0) {
            const gaps = identifyGaps(get().chips);
            if (gaps.length === 0) {
              set({ mode: 'decide' });
            }
          }
        },
        
        updateChip: (id: string, updates: Partial<Chip>) =>
          set((state) => ({
            chips: state.chips.map((chip) =>
              chip.id === id ? { ...chip, ...updates } : chip
            ),
          })),
        
        removeChip: (id: string) =>
          set((state) => ({
            chips: state.chips.filter((chip) => chip.id !== id),
          })),
        
        validateChip: (id: string) =>
          set((state) => ({
            chips: state.chips.map((chip) =>
              chip.id === id ? { ...chip, validated: true } : chip
            ),
          })),
          
        clearChips: () =>
          set({ chips: [] }),
        
        // Decision actions
        makeDecision: (decision: Decision) => {
          set((state) => ({
            decisions: [...state.decisions, decision],
            metrics: {
              ...state.metrics,
              lastAction: `Made decision: ${decision.type}`,
            },
          }));
          
          // Auto-transit if all key decisions made
          const requiredDecisions = [
            'module_combo',
            'rate_region',
            'pricing_target',
          ];
          const madDecisions = get().decisions.map((d) => d.type);
          const hasAll = requiredDecisions.every((req) =>
            madDecisions.includes(req)
          );
          
          if (get().isAutoTransit && hasAll) {
            get().generateBaseline();
            set({ mode: 'plan' });
          }
        },
        
        updateDecision: (id: string, updates: Partial<Decision>) =>
          set((state) => ({
            decisions: state.decisions.map((decision) =>
              decision.id === id ? { ...decision, ...updates } : decision
            ),
          })),
        
        // Scenario actions
        generateBaseline: () => {
          const { chips, decisions } = get();
          const baseline = generateBaselineScenario(chips, decisions);
          
          set((state) => ({
            scenarios: [baseline],
            activeScenarioId: baseline.id,
            metrics: {
              ...state.metrics,
              lastAction: 'Generated baseline scenario',
            },
          }));
        },
        
        createScenario: (name: string) => {
          const activeScenario = get().scenarios.find(
            (s) => s.id === get().activeScenarioId
          );
          
          if (!activeScenario) return;
          
          const newScenario: ScenarioPlan = {
            ...activeScenario,
            id: `scenario_${Date.now()}`,
            name,
          };
          
          set((state) => ({
            scenarios: [...state.scenarios, newScenario],
            activeScenarioId: newScenario.id,
          }));
        },
        
        updateScenario: (id: string, updates: Partial<ScenarioPlan>) =>
          set((state) => ({
            scenarios: state.scenarios.map((scenario) =>
              scenario.id === id ? { ...scenario, ...updates } : scenario
            ),
          })),
        
        setActiveScenario: (id: string) =>
          set({ activeScenarioId: id }),
        
        // Override actions
        addOverride: (override: Override) =>
          set((state) => ({
            overrides: [...state.overrides, override],
            metrics: {
              ...state.metrics,
              lastAction: `Added override to ${override.field}`,
            },
          })),
        
        removeOverride: (id: string) =>
          set((state) => ({
            overrides: state.overrides.filter((o) => o.id !== id),
          })),
        
        // Guardrail actions
        updateGuardrails: () => {
          const { scenarios, activeScenarioId } = get();
          const activeScenario = scenarios.find(
            (s) => s.id === activeScenarioId
          );
          
          if (!activeScenario) return;
          
          const guardrails: Guardrail[] = [];
          
          // Check testing floor (10% of Realize)
          const realizePhases = activeScenario.phases.filter(
            (p) => p.sapActivatePhase === 'Realize'
          );
          const realizeEffort = realizePhases.reduce(
            (sum, p) => sum + p.effort,
            0
          );
          const testingEffort = activeScenario.phases
            .filter((p) => p.stream === 'Testing')
            .reduce((sum, p) => sum + p.effort, 0);
          
          if (testingEffort < realizeEffort * 0.1) {
            guardrails.push({
              id: 'testing_floor',
              type: 'testing_floor',
              status: 'block',
              message: 'Testing effort below 10% of Realize phase',
              action: 'Increase testing allocation',
            });
          }
          
          // Check deploy window (minimum 3 weeks if >3 streams)
          const streams = new Set(activeScenario.phases.map((p) => p.stream));
          const deployDuration = activeScenario.phases
            .filter((p) => p.sapActivatePhase === 'Deploy')
            .reduce((max, p) => Math.max(max, p.duration), 0);
          
          if (streams.size > 3 && deployDuration < 15) {
            guardrails.push({
              id: 'deploy_window',
              type: 'deploy_window',
              status: 'warn',
              message: 'Deploy window may be too short for complex project',
              action: 'Consider extending deploy phase',
            });
          }
          
          set({ guardrails });
        },
        
        // UI actions
        setMode: (mode: PresalesState['mode']) =>
          set({ mode }),
        
        toggleAutoTransit: () =>
          set((state) => ({ isAutoTransit: !state.isAutoTransit })),
        
        toggleMetrics: () =>
          set((state) => ({ showMetrics: !state.showMetrics })),
        
        // Metrics
        recordMetric: (type: 'click' | 'key', action: string) =>
          set((state) => ({
            metrics: {
              ...state.metrics,
              clicks: type === 'click' ? state.metrics.clicks + 1 : state.metrics.clicks,
              keystrokes: type === 'key' ? state.metrics.keystrokes + 1 : state.metrics.keystrokes,
              lastAction: action,
            },
          })),
        
        // Data management
        reset: () => set(initialState),
        
        exportData: () => {
          const state = get();
          const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            chips: state.chips,
            decisions: state.decisions,
            scenarios: state.scenarios,
            activeScenarioId: state.activeScenarioId,
            clientProfile: state.clientProfile,
            overrides: state.overrides,
          };
          return JSON.stringify(exportData, null, 2);
        },
        
        importData: (data: string) => {
          try {
            const imported = JSON.parse(data);
            set({
              chips: imported.chips || [],
              decisions: imported.decisions || [],
              scenarios: imported.scenarios || [],
              activeScenarioId: imported.activeScenarioId || null,
              clientProfile: imported.clientProfile || null,
              overrides: imported.overrides || [],
            });
          } catch (error) {
            console.error('Failed to import data:', error);
          }
        },
      }),
      {
        name: 'presales-storage',
        partialize: (state) => ({
          chips: state.chips,
          decisions: state.decisions,
          scenarios: state.scenarios,
          activeScenarioId: state.activeScenarioId,
          clientProfile: state.clientProfile,
          overrides: state.overrides,
        }),
      }
    )
  )
);
