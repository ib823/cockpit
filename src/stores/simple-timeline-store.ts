// @ts-nocheck
'use client';

import { create } from 'zustand';

// Simple milestone interface
interface Milestone {
  id: string;
  name: string;
  type: 'deliverable' | 'decision' | 'golive' | 'review';
  businessDay: number;
  status: 'pending' | 'completed' | 'blocked';
}

// Simple phase interface  
interface Phase {
  id: string;
  name: string;
  startBusinessDay: number;
  workingDays: number;
  color: string;
}

interface TimelineState {
  phases: Phase[];
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  selectedPhaseId: string | null;
  
  // Actions
  generateTimeline: () => void;
  addMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  selectMilestone: (id: string | null) => void;
  selectPhase: (id: string | null) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  phases: [],
  milestones: [],
  selectedMilestoneId: null,
  selectedPhaseId: null,
  
  generateTimeline: () => set({
    phases: [
      {
        id: 'prepare',
        name: 'Prepare Phase',
        startBusinessDay: 0,
        workingDays: 30,
        color: '#3b82f6'
      },
      {
        id: 'explore',
        name: 'Explore Phase', 
        startBusinessDay: 30,
        workingDays: 45,
        color: '#10b981'
      },
      {
        id: 'realize',
        name: 'Realize Phase',
        startBusinessDay: 75,
        workingDays: 90,
        color: '#8b5cf6'
      }
    ]
  }),
  
  addMilestone: (milestoneData) => set(state => ({
    milestones: [...state.milestones, {
      ...milestoneData,
      id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }]
  })),
  
  selectMilestone: (id) => set({ selectedMilestoneId: id }),
  selectPhase: (id) => set({ selectedPhaseId: id })
}));

// Debug access
if (typeof window !== 'undefined') {
  (window as any).__TIMELINE_STORE__ = { 
    getState: useTimelineStore.getState, 
    setState: useTimelineStore.setState 
  };
}
