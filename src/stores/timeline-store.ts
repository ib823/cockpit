import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ClientProfile, Phase, Holiday, Resource } from '@/types/core';
import { generatePhases } from '@/lib/timeline/phase-generator';
import { SAP_CATALOG } from '@/data/sap-catalog';
import { RESOURCE_CATALOG } from '@/data/resource-catalog';

interface TimelineStore {
  profile: Partial<ClientProfile>;
  selectedPackages: string[];
  phases: Phase[];
  holidays: Holiday[];
  selectedPhaseId: string | null;
  clientPresentationMode: boolean;
  phaseColors: Record<string, string>;

  setProfile: (updates: Partial<ClientProfile>) => void;
  addPackage: (packageId: string) => void;
  removePackage: (packageId: string) => void;
  generateTimeline: () => void;
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  selectPhase: (phaseId: string | null) => void;
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  movePhaseOrder: (fromIndex: number, toIndex: number) => void;
  togglePresentationMode: () => void;
  setPhaseColor: (phaseId: string, color: string) => void;

  getProjectStartDate: () => Date | null;
  getProjectEndDate: () => Date | null;
  getProjectCost: () => number;
}

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => ({
      profile: {
        company: '',
        complexity: 'standard',
        region: 'MY',
      },
      selectedPackages: [],
      phases: [],
      holidays: [],
      selectedPhaseId: null,
      clientPresentationMode: false,
      phaseColors: {},

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      addPackage: (packageId) =>
        set((state) => ({
          selectedPackages: [...state.selectedPackages, packageId],
        })),

      removePackage: (packageId) =>
        set((state) => ({
          selectedPackages: state.selectedPackages.filter((id) => id !== packageId),
        })),

      generateTimeline: () => {
        const { profile, selectedPackages, holidays } = get();
        const phases = generatePhases(
          selectedPackages,
          profile.complexity || 'standard',
          holidays
        );
        set({ phases });
      },

      addHoliday: (holiday) =>
        set((state) => ({
          holidays: [...state.holidays, holiday],
        })),

      removeHoliday: (date) =>
        set((state) => ({
          holidays: state.holidays.filter((h) => h.date !== date),
        })),

      selectPhase: (phaseId) =>
        set({ selectedPhaseId: phaseId }),

      updatePhaseResources: (phaseId, resources) =>
        set((state) => ({
          phases: state.phases.map((phase) =>
            phase.id === phaseId ? { ...phase, resources } : phase
          ),
        })),

      movePhaseOrder: (fromIndex, toIndex) =>
        set((state) => {
          const newPhases = [...state.phases];
          const [movedPhase] = newPhases.splice(fromIndex, 1);
          newPhases.splice(toIndex, 0, movedPhase);
          return { phases: newPhases };
        }),

      togglePresentationMode: () =>
        set((state) => ({
          clientPresentationMode: !state.clientPresentationMode,
        })),

      setPhaseColor: (phaseId, color) =>
        set((state) => ({
          phaseColors: { ...state.phaseColors, [phaseId]: color },
        })),

      getProjectStartDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        const earliestPhase = phases.reduce((min, phase) =>
          phase.startBusinessDay < min.startBusinessDay ? phase : min
        );
        const baseDate = new Date('2024-01-01');
        baseDate.setDate(baseDate.getDate() + earliestPhase.startBusinessDay);
        return baseDate;
      },

      getProjectEndDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        const latestPhase = phases.reduce((max, phase) => {
          const phaseEnd = phase.startBusinessDay + phase.workingDays;
          const maxEnd = max.startBusinessDay + max.workingDays;
          return phaseEnd > maxEnd ? phase : max;
        });
        const baseDate = new Date('2024-01-01');
        baseDate.setDate(baseDate.getDate() + latestPhase.startBusinessDay + latestPhase.workingDays);
        return baseDate;
      },

      getProjectCost: () => {
        const { phases, profile } = get();
        let totalCost = 0;
        phases.forEach((phase) => {
          if (phase.resources) {
            phase.resources.forEach((resource) => {
              const dailyRate = resource.hourlyRate * 8;
              const phaseCost = dailyRate * phase.workingDays * (resource.allocation / 100);
              totalCost += phaseCost;
            });
          }
        });
        return totalCost;
      },
    }),
    {
      name: 'timeline-store',
    }
  )
);
