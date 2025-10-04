// src/hooks/useWrapperPhases.ts
import { useWrappersStore } from '@/stores/wrappers-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { useMemo, useEffect } from 'react';
import { Phase } from '@/stores/timeline-store';

/**
 * Hook to generate virtual wrapper phases for Gantt chart visualization
 * Each wrapper becomes a "phase" that runs parallel to core phases
 */
export function useWrapperPhases() {
  const { wrappers, calculations, calculateWrappers } = useWrappersStore();
  const { phases, getProjectCost } = useTimelineStore();

  // Calculate core values
  const coreEffort = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);
  const coreEffortCost = getProjectCost();

  // Ensure calculations are up-to-date
  useEffect(() => {
    calculateWrappers(coreEffort, coreEffortCost);
  }, [coreEffort, coreEffortCost, calculateWrappers]);

  // Generate wrapper phases
  const wrapperPhases = useMemo<Phase[]>(() => {
    if (phases.length === 0) return [];

    // Find timeline bounds
    const minStart = Math.min(...phases.map((p) => p.startBusinessDay || 0));
    const maxEnd = Math.max(
      ...phases.map((p) => (p.startBusinessDay || 0) + (p.workingDays || 0))
    );

    return wrappers.map((wrapper, idx) => {
      const calculation = calculations.find((c) => c.wrapperId === wrapper.id);
      const wrapperEffort = calculation?.wrapperEffort || 0;

      return {
        id: `wrapper-${wrapper.id}`,
        name: wrapper.name,
        category: 'wrapper', // Add required category field
        description: wrapper.description,
        workingDays: maxEnd - minStart, // Span entire timeline
        startBusinessDay: minStart, // Start with first core phase
        resources: [
          {
            id: `resource-${wrapper.id}`,
            name: wrapper.name,
            role: wrapper.sapActivatePhase,
            allocation: 100,
            hourlyRate: 0, // Calculated separately
          },
        ],
        dependencies: [], // No dependencies for wrappers
        color: wrapper.color,
        isWrapper: true, // Flag to distinguish from core phases
      } as unknown as Phase & { isWrapper: boolean };
    });
  }, [wrappers, calculations, phases]);

  return {
    wrapperPhases,
    hasWrappers: wrappers.length > 0,
    totalWrapperEffort: calculations.reduce((sum, c) => sum + c.wrapperEffort, 0),
    totalWrapperCost: calculations.reduce((sum, c) => sum + c.wrapperCost, 0),
  };
}
