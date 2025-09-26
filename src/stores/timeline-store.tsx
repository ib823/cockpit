'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Phase, Resource, Holiday, ClientProfile } from '@/types/timeline';

interface TimelineState {
  // Core data
  phases: Phase[];
  resources: Resource[];
  holidays: Holiday[];
  profile: ClientProfile;
  selectedPackages: string[];
  
  // View state
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  selectedPhaseId: string | null;
  clientPresentationMode: boolean;
  
  // Actions - Phase management
  addPhase: (phase: Phase) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  movePhase: (draggedId: string, targetIndex: number) => void;
  
  // Actions - Resource management
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  
  // Actions - Holiday management
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  
  // Actions - View controls
  setZoomLevel: (level: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void;
  selectPhase: (id: string | null) => void;
  togglePresentationMode: () => void;
  
  // Actions - Timeline generation
  generateTimeline: () => void;
  
  // Computed
  getProjectStartDate: () => Date | null;
  getProjectEndDate: () => Date | null;
  getProjectCost: () => number;
  getResourceAllocation: () => Map<string, number>;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Initial state
      phases: [],
      resources: [],
      holidays: [
        { date: '2024-01-01', name: 'New Year' },
        { date: '2024-02-10', name: 'Chinese New Year' },
        { date: '2024-05-01', name: 'Labour Day' },
        { date: '2024-08-31', name: 'Merdeka Day' }
      ],
      profile: {
        company: '',
        industry: 'manufacturing',
        size: 'medium',
        complexity: 'standard',
        region: 'ABMY'
      },
      selectedPackages: [],
      zoomLevel: 'weekly',
      selectedPhaseId: null,
      clientPresentationMode: false,

      // Phase management
      addPhase: (phase) => set(state => ({
        phases: [...state.phases, phase]
      })),

      updatePhase: (id, updates) => set(state => ({
        phases: state.phases.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      deletePhase: (id) => set(state => ({
        phases: state.phases.filter(p => p.id !== id),
        selectedPhaseId: state.selectedPhaseId === id ? null : state.selectedPhaseId
      })),

      movePhase: (draggedId, targetIndex) => set(state => {
        const phases = [...state.phases];
        const draggedIndex = phases.findIndex(p => p.id === draggedId);
        
        if (draggedIndex === -1) return state;
        
        const [draggedPhase] = phases.splice(draggedIndex, 1);
        phases.splice(targetIndex, 0, draggedPhase);
        
        // Recalculate start days
        let currentDay = 0;
        phases.forEach(phase => {
          phase.startBusinessDay = currentDay;
          currentDay += phase.workingDays;
        });
        
        return { phases };
      }),

      // Resource management
      updatePhaseResources: (phaseId, resources) => set(state => ({
        phases: state.phases.map(p => 
          p.id === phaseId ? { ...p, resources } : p
        )
      })),

      // Holiday management  
      addHoliday: (holiday) => set(state => ({
        holidays: [...state.holidays, holiday]
      })),

      removeHoliday: (date) => set(state => ({
        holidays: state.holidays.filter(h => h.date !== date)
      })),

      // View controls
      setZoomLevel: (level) => set({ zoomLevel: level }),
      selectPhase: (id) => set({ selectedPhaseId: id }),
      togglePresentationMode: () => set(state => ({ 
        clientPresentationMode: !state.clientPresentationMode 
      })),

      // Timeline generation
      generateTimeline: () => {
        const { selectedPackages, profile } = get();
        // Implementation from your existing phase-generation.ts
        // This would generate phases based on selected packages
      },

      // Computed values
      getProjectStartDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        return new Date('2024-01-01'); // Base date
      },

      getProjectEndDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        const totalDays = phases.reduce((sum, p) => sum + p.workingDays, 0);
        const start = new Date('2024-01-01');
        const end = new Date(start);
        end.setDate(end.getDate() + totalDays);
        return end;
      },

      getProjectCost: () => {
        const { phases } = get();
        return phases.reduce((total, phase) => {
          const phaseCost = phase.resources?.reduce((sum, resource) => {
            const dailyRate = (resource.hourlyRate || 400) * 8;
            const cost = dailyRate * phase.workingDays * (resource.allocation / 100);
            return sum + cost;
          }, 0) || 0;
          return total + phaseCost;
        }, 0);
      },

      getResourceAllocation: () => {
        const { phases } = get();
        const allocation = new Map<string, number>();
        
        phases.forEach(phase => {
          phase.resources?.forEach(resource => {
            const current = allocation.get(resource.id) || 0;
            allocation.set(resource.id, current + resource.allocation);
          });
        });
        
        return allocation;
      }
    }),
    {
      name: 'timeline-store-complete'
    }
  )
);
