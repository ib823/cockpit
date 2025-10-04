// src/types/wrappers.ts
export type WrapperType =
  | 'project-management'
  | 'change-management'
  | 'data-migration'
  | 'testing'
  | 'cutover-hypercare';

export interface Wrapper {
  id: WrapperType;
  name: string;
  description: string;
  defaultPercentage: number; // % of core effort
  currentPercentage: number; // User-adjusted
  color: string;
  icon: string; // Lucide icon name
  sapActivatePhase: 'prepare' | 'explore' | 'realize' | 'deploy' | 'run';
}

export interface WrapperCalculation {
  wrapperId: WrapperType;
  coreEffort: number; // Total effort from timeline phases
  wrapperEffort: number; // Calculated wrapper effort
  wrapperCost: number; // Calculated wrapper cost
}

export const DEFAULT_WRAPPERS: Wrapper[] = [
  {
    id: 'project-management',
    name: 'Project Management',
    description: 'Project planning, governance, steering, and coordination',
    defaultPercentage: 15,
    currentPercentage: 15,
    color: '#3b82f6', // blue-500
    icon: 'Briefcase',
    sapActivatePhase: 'prepare',
  },
  {
    id: 'change-management',
    name: 'Change Management',
    description: 'Organizational change, training, communication, and adoption',
    defaultPercentage: 12,
    currentPercentage: 12,
    color: '#8b5cf6', // purple-500
    icon: 'Users',
    sapActivatePhase: 'explore',
  },
  {
    id: 'data-migration',
    name: 'Data Migration',
    description: 'Data extraction, transformation, loading, and validation',
    defaultPercentage: 25,
    currentPercentage: 25,
    color: '#10b981', // green-500
    icon: 'Database',
    sapActivatePhase: 'realize',
  },
  {
    id: 'testing',
    name: 'Testing',
    description: 'Unit, integration, UAT, performance, and regression testing',
    defaultPercentage: 30,
    currentPercentage: 30,
    color: '#f59e0b', // amber-500
    icon: 'CheckCircle',
    sapActivatePhase: 'realize',
  },
  {
    id: 'cutover-hypercare',
    name: 'Cutover & Hypercare',
    description: 'Go-live preparation, cutover execution, and post-go-live support',
    defaultPercentage: 12,
    currentPercentage: 12,
    color: '#ef4444', // red-500
    icon: 'Rocket',
    sapActivatePhase: 'deploy',
  },
];

export const SAP_ACTIVATE_PHASES = [
  {
    id: 'prepare',
    name: 'Prepare',
    description: 'Project kickoff, planning, and team setup',
    color: '#3b82f6',
  },
  {
    id: 'explore',
    name: 'Explore',
    description: 'Requirements gathering, fit-gap analysis, and solution design',
    color: '#8b5cf6',
  },
  {
    id: 'realize',
    name: 'Realize',
    description: 'Configuration, customization, and development',
    color: '#10b981',
  },
  {
    id: 'deploy',
    name: 'Deploy',
    description: 'Testing, training, cutover, and go-live',
    color: '#f59e0b',
  },
  {
    id: 'run',
    name: 'Run',
    description: 'Hypercare, optimization, and continuous improvement',
    color: '#ef4444',
  },
] as const;
