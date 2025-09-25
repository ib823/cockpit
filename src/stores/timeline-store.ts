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
  Holiday, 
  DEFAULT_HOLIDAYS,
  getProjectStartDate,
  getProjectEndDate
} from '@/lib/timeline/date-calculations';
import { getRateCard } from '@/data/resource-catalog';

interface TimelineState {
  // Core data
  profile: ClientProfile;
  selectedPackages: string[];
  phases: Phase[];
  holidays: Holiday[];
  phaseColors: Record<string, string>;
  
  // View state
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  selectedPhaseId: string | null;
  clientPresentationMode: boolean;
  
  // Actions - Profile
  setProfile: (profile: Partial<ClientProfile>) => void;
  
  // Actions - Packages
  addPackage: (packageId: string) => void;
  removePackage: (packageId: string) => void;
  
  // Actions - Phases
  generateTimeline: () => void;
  updatePhase: (id: string, updates: Partial<Phase>) => void;
  updatePhaseResources: (phaseId: string, resources: Resource[]) => void;
  
  // Actions - Holidays
  addHoliday: (holiday: Holiday) => void;
  removeHoliday: (date: string) => void;
  
  // Actions - View
  selectPhase: (id: string | null) => void;
  togglePresentationMode: () => void;
  setPhaseColor: (phaseId: string, color: string) => void;
  
  // Computed values
  getProjectCost: () => number;
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

const PHASE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6'];

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: defaultProfile,
      selectedPackages: [],
      phases: [],
      holidays: DEFAULT_HOLIDAYS,
      phaseColors: {},
      zoomLevel: 'weekly',
      selectedPhaseId: null,
      clientPresentationMode: false,
      
      // Actions
      setProfile: (profile) => set(state => ({
        profile: { ...state.profile, ...profile }
      })),
      
      addPackage: (packageId) => set(state => ({
        selectedPackages: state.selectedPackages.includes(packageId) 
          ? state.selectedPackages
          : [...state.selectedPackages, packageId]
      })),
      
      removePackage: (packageId) => set(state => ({
        selectedPackages: state.selectedPackages.filter(id => id !== packageId)
      })),
      
      generateTimeline: () => set(state => {
        if (!state.selectedPackages.length) return state;
        
        try {
          const generatedPhases = generateTimelineFromSAPSelection(
            state.selectedPackages, 
            state.profile
          );
          
          const sequencedPhases = calculateIntelligentSequencing(generatedPhases);
          
          const phasesWithResources = sequencedPhases.map((phase, index) => {
            const resources = calculateResourceRequirements(phase, state.profile.region);
            
            const resourcesWithRates = resources.map(resource => {
              const rateCard = getRateCard(resource.role, resource.region);
              return {
                ...resource,
                hourlyRate: rateCard?.hourlyRate || 400,
                includeOPE: false
              };
            });

            const phaseColor = PHASE_COLORS[index % PHASE_COLORS.length];
            
            return {
              ...phase,
              resources: resourcesWithRates,
              color: phaseColor
            };
          });

          const newPhaseColors = phasesWithResources.reduce((colors, phase) => {
            colors[phase.id] = phase.color;
            return colors;
          }, {} as Record<string, string>);
          
          return { 
            phases: phasesWithResources,
            phaseColors: newPhaseColors
          };
        } catch (error) {
          console.error('Timeline generation failed:', error);
          return state;
        }
      }),

      updatePhase: (id, updates) => set(state => ({
        phases: state.phases.map(phase => 
          phase.id === id ? { ...phase, ...updates } : phase
        )
      })),
      
      updatePhaseResources: (phaseId, resources) => set(state => ({
        phases: state.phases.map(phase => 
          phase.id === phaseId ? { ...phase, resources } : phase
        )
      })),
      
      addHoliday: (holiday) => set(state => {
        if (!state.holidays.find(h => h.date === holiday.date)) {
          return { holidays: [...state.holidays, holiday] };
        }
        return state;
      }),
      
      removeHoliday: (date) => set(state => ({
        holidays: state.holidays.filter(h => h.date !== date)
      })),
      
      selectPhase: (id) => set({ selectedPhaseId: id }),
      
      togglePresentationMode: () => set(state => ({
        clientPresentationMode: !state.clientPresentationMode
      })),

      setPhaseColor: (phaseId, color) => set(state => ({
        phaseColors: { ...state.phaseColors, [phaseId]: color },
        phases: state.phases.map(phase => 
          phase.id === phaseId ? { ...phase, color } : phase
        )
      })),
      
      getProjectCost: () => {
        const { phases } = get();
        if (!phases.length) return 0;
        
        return phases.reduce((total, phase) => {
          if (!phase.resources || !phase.resources.length) return total;
          
          const phaseCost = phase.resources.reduce((phaseTotal, resource) => {
            const hourlyRate = resource.hourlyRate || 0;
            const allocation = resource.allocation || 0;
            const dailyRate = hourlyRate * 8;
            const resourceCost = dailyRate * phase.workingDays * (allocation / 100);
            
            return phaseTotal + resourceCost;
          }, 0);
          
          return total + phaseCost;
        }, 0);
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
      name: 'timeline-store'
    }
  )
);
