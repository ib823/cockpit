// app/architecture/stores/architectureStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArchitectureData } from '../types';

interface ArchitectureStore {
  data: Partial<ArchitectureData>;
  currentStep: number;

  updateData: (updates: Partial<ArchitectureData>) => void;
  setStep: (step: number) => void;
  reset: () => void;
  isStepComplete: (step: number) => boolean;
}

const INITIAL_DATA: Partial<ArchitectureData> = {
  projectInfo: {
    clientName: '',
    projectName: '',
    industry: '',
    description: '',
  },
  actors: [],
  externalSystems: [],

  // AS-IS Landscape
  asIs: {
    sapModules: [],
    nonSAPSystems: [],
    integrations: [],
    database: {
      type: '',
      size: '',
      notes: '',
    },
  },

  // TO-BE Solution
  toBe: {
    sapModules: [],
    cloudSystems: [],
    integrations: [],
    database: {
      type: '',
      size: '',
      notes: '',
    },
    integrationLayer: {
      middleware: '',
      description: '',
    },
  },

  // Integration Bridge
  bridge: {
    connections: [],
  },

  // Deployment
  environments: [],
  infrastructure: {
    deploymentModel: '',
    location: '',
    backup: '',
    dr: '',
    network: '',
  },

  // Security & Sizing
  authMethods: [],
  securityControls: [],
  compliance: {
    standards: [],
    notes: '',
  },
  phases: [],
  scalability: {
    approach: '',
    limits: '',
  },
};

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      data: INITIAL_DATA,
      currentStep: 0,

      updateData: (updates) =>
        set((state) => ({
          data: { ...state.data, ...updates },
        })),

      setStep: (step) => set({ currentStep: step }),

      reset: () => set({ data: INITIAL_DATA, currentStep: 0 }),

      isStepComplete: (step) => {
        const { data } = get();

        switch (step) {
          case 0: // Business Context
            return !!(
              data.projectInfo?.clientName &&
              data.projectInfo?.projectName &&
              data.actors?.length &&
              data.externalSystems?.length
            );

          case 1: // AS-IS Landscape
            return !!(
              (data.asIs?.sapModules?.length || data.asIs?.nonSAPSystems?.length) &&
              data.asIs?.database?.type
            );

          case 2: // TO-BE Solution
            return !!(
              data.toBe?.sapModules?.length &&
              data.toBe?.database?.type
            );

          case 3: // Integration Bridge
            return (data.bridge?.connections?.length ?? 0) > 0;

          case 4: // Deployment
            return !!(
              data.environments?.length &&
              data.infrastructure?.deploymentModel
            );

          case 5: // Security & Sizing
            return !!(
              data.authMethods?.length &&
              data.securityControls?.length &&
              data.phases?.length
            );

          default:
            return false;
        }
      },
    }),
    {
      name: 'sap-rfp-architecture-storage',
    }
  )
);
