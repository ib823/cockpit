
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Phase, 
  ClientProfile, 
  generateTimelineFromSAPSelection,
  calculateIntelligentSequencing,
  calculateResourceRequirements 
} from '@/lib/timeline/phase-generation';
import { Holiday, DEFAULT_HOLIDAYS } from '@/lib/timeline/date-calculations';
import { calculateProjectCost, calculateBlendedRate } from '@/data/resource-catalog';

export interface Resource {
  id: string;
  name: string;
  role: string;
  region: string;
  allocation: number;
  hourlyRate?: number;
  includeOPE?: boolean;
}

interface TimelineState {
  // Core data
  profile: ClientProfile;
  selectedPackages: string[];
  phases: Phase[];
  holidays: Holiday[];
  
  // View state
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  selectedPhaseId: string | null;
  clientPresentationMode: boolean;
  
  // Actions - Profile
  setProfile: (profile: Partial<ClientProfile>) => void;
  resetProfile: () => void;
  
  // Actions - Packages
  addPackage: (packageId: string) => void;
  removePackage: (packageId: string) => void;
  clearPackages: () => void;
  
  // Actions - Phases
  generateTimeline: () => void;
  addPhase: (phase?: Partial<Phase>) => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  deletePhase: (id: string) => void;
  movePhase: (id: string, newStartDay: number) => void;
  
  // Actions - Resources
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  
  // Actions - Holidays
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  resetHolidays: () => void;
  
  // Actions - View
  setZoomLevel: (level: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void;
  selectPhase: (id: string | null) => void;
  togglePresentationMode: () => void;
  
  // Computed values
  getProjectCost: () => number;
  getBlendedRate: () => number;
  getProjectStartDate: () => Date | null;
  getProjectEndDate: () => Date | null;
}

const defaultProfile: ClientProfile = {
  company: '',
  industry: 'manufacturing',
  size: 'medium',
  complexity: 'standard',
  timelinePreference: 'normal',
  region: 'ABMY',
  employees: 500,
  annualRevenue: 100000000
};

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: defaultProfile,
      selectedPackages: [],
      phases: [],
      holidays: DEFAULT_HOLIDAYS,
      zoomLevel: 'daily',
      selectedPhaseId: null,
      clientPresentationMode: false,
      
      // Profile actions
      setProfile: (profile) => set(state => ({
        profile: { ...state.profile, ...profile }
      })),
      
      resetProfile: () => set({ profile: defaultProfile }),
      
      // Package actions
      addPackage: (packageId) => set(state => {
        if (!state.selectedPackages.includes(packageId)) {
          return { selectedPackages: [...state.selectedPackages, packageId] };
        }
        return state;
      }),
      
      removePackage: (packageId) => set(state => ({
        selectedPackages: state.selectedPackages.filter(id => id !== packageId)
      })),
      
      clearPackages: () => set({ selectedPackages: [], phases: [] }),
      
      // Phase actions
      generateTimeline: () => {
        const { selectedPackages, profile } = get();
        if (selectedPackages.length === 0) return;
        
        const phases = generateTimelineFromSAPSelection(selectedPackages, profile);
        
        // Add default resources to each phase
        const phasesWithResources = phases.map(phase => ({
          ...phase,
          resources: calculateResourceRequirements(phase, profile)
        }));
        
        set({ phases: phasesWithResources });
      },
      
      addPhase: (phaseData) => set(state => {
        const newPhase: Phase = {
          id: `phase-${Date.now()}`,
          name: phaseData?.name || 'New Phase',
          status: 'idle',
          startBusinessDay: phaseData?.startBusinessDay || 0,
          workingDays: phaseData?.workingDays || 10,
          color: phaseData?.color || '#007AFF',
          category: phaseData?.category || 'Custom',
          dependencies: phaseData?.dependencies || [],
          description: phaseData?.description || '',
          skipHolidays: true,
          resources: []
        };
        
        return { phases: [...state.phases, newPhase] };
      }),
      
      updatePhase: (id, updates) => set(state => ({
        phases: state.phases.map(phase => 
          phase.id === id ? { ...phase, ...updates } : phase
        )
      })),
      
      deletePhase: (id) => set(state => ({
        phases: state.phases.filter(phase => phase.id !== id),
        selectedPhaseId: state.selectedPhaseId === id ? null : state.selectedPhaseId
      })),
      
      movePhase: (id, newStartDay) => set(state => {
        const updatedPhases = state.phases.map(phase => 
          phase.id === id ? { ...phase, startBusinessDay: newStartDay } : phase
        );
        return { phases: calculateIntelligentSequencing(updatedPhases) };
      }),
      
      // Resource actions
      updatePhaseResources: (phaseId, resources) => set(state => ({
        phases: state.phases.map(phase => 
          phase.id === phaseId ? { ...phase, resources } : phase
        )
      })),
      
      // Holiday actions
      addHoliday: (holiday) => set(state => {
        if (!state.holidays.find(h => h.date === holiday.date)) {
          return { holidays: [...state.holidays, holiday] };
        }
        return state;
      }),
      
      removeHoliday: (date) => set(state => ({
        holidays: state.holidays.filter(h => h.date !== date)
      })),
      
      resetHolidays: () => set({ holidays: DEFAULT_HOLIDAYS }),
      
      // View actions
      setZoomLevel: (level) => set({ zoomLevel: level }),
      selectPhase: (id) => set({ selectedPhaseId: id }),
      togglePresentationMode: () => set(state => ({
        clientPresentationMode: !state.clientPresentationMode
      })),
      
      // Computed values
      getProjectCost: () => {
        const { phases } = get();
        return calculateProjectCost(phases.map(p => ({ ...p, resources: p.resources || [] })), 8);
      },
      
      getBlendedRate: () => {
        const { phases } = get();
        const allResources = phases.flatMap(p => p.resources || []);
        return calculateBlendedRate(allResources, 8);
      },
      
      getProjectStartDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        
        const earliestPhase = phases.reduce((earliest, phase) => 
          phase.startBusinessDay < earliest.startBusinessDay ? phase : earliest
        );
        
        // Convert business day to actual date
        const baseDate = new Date('2024-01-01');
        const startDate = new Date(baseDate);
        startDate.setDate(startDate.getDate() + earliestPhase.startBusinessDay);
        return startDate;
      },
      
      getProjectEndDate: () => {
        const { phases } = get();
        if (!phases.length) return null;
        
        const latestEnd = Math.max(...phases.map(p => 
          p.startBusinessDay + p.workingDays
        ));
        
        // Convert business day to actual date
        const baseDate = new Date('2024-01-01');
        const endDate = new Date(baseDate);
        endDate.setDate(endDate.getDate() + latestEnd);
        return endDate;
      }
    }),
    { 
      name: 'timeline-store',
      partialize: (state) => ({
        profile: state.profile,
        selectedPackages: state.selectedPackages,
        phases: state.phases,
        holidays: state.holidays
      })
    }
  )
);
