// @ts-nocheck
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Phase, 
  ClientProfile, 
  Resource,
  generateTimelineFromSAPSelection,
  calculateIntelligentSequencing,
  calculateResourceRequirements
} from '@/lib/timeline/phase-generation';
import { 
  getProjectStartDate,
  getProjectEndDate
} from '@/lib/timeline/date-calculations';
import { calculateProjectCost, formatCurrency } from '@/data/resource-catalog';

interface TimelineState {
  // Core data
  profile: ClientProfile;
  selectedPackages: string[];
  phases: Phase[];
  holidays: any[];
  
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
  movePhaseOrder: (fromIndex: number, toIndex: number) => void;
  togglePhaseSelection: (id: string) => void;
  
  // Actions - Resources
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  
  // Actions - Holidays
  addHoliday: (holiday: any) => void;
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
      holidays: [],
      zoomLevel: 'weekly',
      selectedPhaseId: null,
      clientPresentationMode: false,
      
      // Profile actions
      setProfile: (updates) => set(state => ({
        profile: { ...state.profile, ...updates }
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
      
      clearPackages: () => set({ 
        selectedPackages: [], 
        phases: [] 
      }),
      
      // Phase actions
      generateTimeline: () => set(state => {
        try {
          const newPhases = generateTimelineFromSAPSelection(
            state.selectedPackages,
            state.profile
          );
          
          return {
            phases: newPhases,
            selectedPhaseId: null
          };
        } catch (error) {
          console.error('Failed to generate timeline:', error);
          return state;
        }
      }),
      
      addPhase: (phaseData = {}) => set(state => {
        const newPhase: Phase = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: phaseData.name || 'New Phase',
          category: phaseData.category || 'Custom',
          startBusinessDay: phaseData.startBusinessDay || 0,
          workingDays: phaseData.workingDays || 5,
          effort: phaseData.effort || 5,
          color: phaseData.color || '#3B82F6',
          skipHolidays: phaseData.skipHolidays ?? true,
          dependencies: phaseData.dependencies || [],
          status: phaseData.status || 'idle',
          resources: phaseData.resources || []
        };
        
        const updatedPhases = [...state.phases, newPhase];
        
        return {
          phases: calculateIntelligentSequencing(updatedPhases)
        };
      }),
      
      updatePhase: (id, updates) => set(state => {
        const updatedPhases = state.phases.map(phase => 
          phase.id === id ? { ...phase, ...updates } : phase
        );
        
        return { 
          phases: calculateIntelligentSequencing(updatedPhases)
        };
      }),
      
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
      
      movePhaseOrder: (fromIndex, toIndex) => set(state => {
        const newPhases = [...state.phases];
        const [removed] = newPhases.splice(fromIndex, 1);
        newPhases.splice(toIndex, 0, removed);
        
        return { 
          phases: calculateIntelligentSequencing(newPhases)
        };
      }),
      
      togglePhaseSelection: (id) => set(state => ({
        selectedPhaseId: state.selectedPhaseId === id ? null : id
      })),
      
      // Resource actions
      updatePhaseResources: (phaseId, resources) => set(state => ({
        phases: state.phases.map(phase => 
          phase.id === phaseId ? { ...phase, resources } : phase
        )
      })),
      
      // Holiday actions
      addHoliday: (holiday) => set(state => {
        return { holidays: [...state.holidays, holiday] };
      }),
      
      removeHoliday: (date) => set(state => ({
        holidays: state.holidays.filter((h: any) => h.date !== date)
      })),
      
      resetHolidays: () => set({ holidays: [] }),
      
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
        if (!allResources.length) return 0;
        
        let totalCost = 0;
        let totalAllocation = 0;
        
        allResources.forEach(resource => {
          const allocation = resource.allocation / 100;
          totalCost += (resource.hourlyRate || 0) * 8 * allocation;
          totalAllocation += allocation;
        });
        
        return totalAllocation > 0 ? totalCost / totalAllocation : 0;
      },
      
      getProjectStartDate: () => {
        const { phases } = get();
        return getProjectStartDate(phases);
      },
      
      getProjectEndDate: () => {
        const { phases } = get();
        return getProjectEndDate(phases);
      }
    }),
    { 
      name: 'timeline-store',
      partialize: (state) => ({
        profile: state.profile,
        selectedPackages: state.selectedPackages,
        phases: state.phases,
        holidays: state.holidays,
        zoomLevel: state.zoomLevel,
        clientPresentationMode: state.clientPresentationMode
      })
    }
  )
);

// Export commonly used selectors
export const useTimelinePhases = () => useTimelineStore(state => state.phases);
export const useTimelineProfile = () => useTimelineStore(state => state.profile);
export const useSelectedPackages = () => useTimelineStore(state => state.selectedPackages);
export const useProjectCost = () => useTimelineStore(state => state.getProjectCost());
export const useProjectDates = () => useTimelineStore(state => ({
  startDate: state.getProjectStartDate(),
  endDate: state.getProjectEndDate()
}));
