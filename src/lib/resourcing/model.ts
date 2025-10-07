/**
 * Phase-Level Resource Allocation Model
 *
 * Deterministic, pure-function resource model that:
 * - Attaches resources to phases (not tasks)
 * - Supports multiple teams/modules per phase
 * - Calculates costs and margins
 * - Avoids MD explosion
 */

export interface PhaseResource {
  id: string;
  phaseId: string;
  phaseName: string;
  role: ResourceRole;
  region: string;
  allocation: number; // Percentage 0-100
  hourlyRate: number;
  phaseEffort: number; // Total PD for this phase
  calculatedHours: number; // Derived: (phaseEffort * 8 * allocation / 100)
  calculatedCost: number; // Derived: (calculatedHours * hourlyRate)
}

export type ResourceRole =
  | 'PM'
  | 'Technical'
  | 'Functional'
  | 'Architect'
  | 'Basis'
  | 'Security'
  | 'ChangeManagement'
  | 'Testing'
  | 'Training';

export interface Wrapper {
  id: string;
  type: WrapperType;
  phases: string[]; // Phase IDs this wrapper covers
  effortPercentage: number; // Percentage of total technical effort
  calculatedEffort: number; // Derived PD
  calculatedCost: number; // Derived cost
  description: string;
}

export type WrapperType =
  | 'projectManagement'
  | 'basis'
  | 'security'
  | 'testing'
  | 'training'
  | 'changeManagement';

export interface PhaseAllocation {
  phaseId: string;
  phaseName: string;
  category: 'prepare' | 'explore' | 'realize' | 'deploy' | 'run';
  baseEffort: number; // Technical effort (PD)
  resources: PhaseResource[];
  totalCost: number; // Sum of all resource costs
  averageRate: number; // Weighted average hourly rate
}

export interface ResourcePlan {
  phases: PhaseAllocation[];
  wrappers: Wrapper[];
  totals: {
    technicalEffort: number; // Sum of phase base efforts
    wrapperEffort: number; // Sum of wrapper efforts
    totalEffort: number; // Technical + wrapper
    totalCost: number; // Sum of all costs
    averageRate: number; // Weighted average
    margin: number; // Calculated margin %
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_HOURLY_RATES: Record<string, Record<ResourceRole, number>> = {
  'US-East': {
    PM: 175,
    Technical: 165,
    Functional: 155,
    Architect: 195,
    Basis: 175,
    Security: 185,
    ChangeManagement: 145,
    Testing: 135,
    Training: 125,
  },
  'Asia-Pacific': {
    PM: 125,
    Technical: 115,
    Functional: 105,
    Architect: 145,
    Basis: 125,
    Security: 135,
    ChangeManagement: 95,
    Testing: 85,
    Training: 75,
  },
};

export const WRAPPER_DEFAULTS: Record<WrapperType, {
  percentage: number;
  phases: Array<'prepare' | 'explore' | 'realize' | 'deploy' | 'run'>;
  description: string;
}> = {
  projectManagement: {
    percentage: 15,
    phases: ['prepare', 'explore', 'realize', 'deploy', 'run'],
    description: 'Project planning, coordination, governance, and reporting',
  },
  basis: {
    percentage: 8,
    phases: ['prepare', 'explore', 'realize', 'deploy', 'run'],
    description: 'Landscape management, transports, monitoring, and support',
  },
  security: {
    percentage: 6,
    phases: ['explore', 'realize', 'deploy'],
    description: 'Role design, authorization objects, GRC, and security testing',
  },
  testing: {
    percentage: 20,
    phases: ['realize', 'deploy'],
    description: 'Test planning, script creation, execution, and defect management',
  },
  training: {
    percentage: 8,
    phases: ['realize', 'deploy', 'run'],
    description: 'Training material creation, train-the-trainer, and end-user training',
  },
  changeManagement: {
    percentage: 10,
    phases: ['prepare', 'explore', 'realize', 'deploy', 'run'],
    description: 'Stakeholder engagement, communication, and adoption activities',
  },
};

// ============================================================================
// PURE FUNCTIONS - RESOURCE CALCULATIONS
// ============================================================================

/**
 * Calculate derived fields for a single phase resource
 */
export function calculatePhaseResource(
  resource: Omit<PhaseResource, 'calculatedHours' | 'calculatedCost'>
): PhaseResource {
  const calculatedHours = (resource.phaseEffort * 8 * resource.allocation) / 100;
  const calculatedCost = calculatedHours * resource.hourlyRate;

  return {
    ...resource,
    calculatedHours: Math.round(calculatedHours * 10) / 10,
    calculatedCost: Math.round(calculatedCost * 100) / 100,
  };
}

/**
 * Calculate totals for a phase allocation
 */
export function calculatePhaseAllocation(
  phase: Omit<PhaseAllocation, 'totalCost' | 'averageRate'>
): PhaseAllocation {
  const resources = phase.resources.map(calculatePhaseResource);

  const totalCost = resources.reduce((sum, r) => sum + r.calculatedCost, 0);

  const totalHours = resources.reduce((sum, r) => sum + r.calculatedHours, 0);
  const averageRate = totalHours > 0 ? totalCost / totalHours : 0;

  return {
    ...phase,
    resources,
    totalCost: Math.round(totalCost * 100) / 100,
    averageRate: Math.round(averageRate * 100) / 100,
  };
}

/**
 * Calculate wrapper effort based on technical effort
 */
export function calculateWrapper(
  wrapper: Omit<Wrapper, 'calculatedEffort' | 'calculatedCost'>,
  technicalEffort: number,
  averageRate: number
): Wrapper {
  const calculatedEffort = (technicalEffort * wrapper.effortPercentage) / 100;
  const calculatedCost = calculatedEffort * 8 * averageRate;

  return {
    ...wrapper,
    calculatedEffort: Math.round(calculatedEffort * 10) / 10,
    calculatedCost: Math.round(calculatedCost * 100) / 100,
  };
}

/**
 * Calculate complete resource plan with all derived values
 */
export function calculateResourcePlan(
  phases: Omit<PhaseAllocation, 'totalCost' | 'averageRate'>[],
  wrappers: Omit<Wrapper, 'calculatedEffort' | 'calculatedCost'>[]
): ResourcePlan {
  // Calculate phase allocations
  const calculatedPhases = phases.map(calculatePhaseAllocation);

  // Calculate totals
  const technicalEffort = calculatedPhases.reduce((sum, p) => sum + p.baseEffort, 0);
  const technicalCost = calculatedPhases.reduce((sum, p) => sum + p.totalCost, 0);

  const technicalHours = technicalEffort * 8;
  const averageRate = technicalHours > 0 ? technicalCost / technicalHours : 0;

  // Calculate wrappers
  const calculatedWrappers = wrappers.map(w =>
    calculateWrapper(w, technicalEffort, averageRate)
  );

  const wrapperEffort = calculatedWrappers.reduce((sum, w) => sum + w.calculatedEffort, 0);
  const wrapperCost = calculatedWrappers.reduce((sum, w) => sum + w.calculatedCost, 0);

  const totalEffort = technicalEffort + wrapperEffort;
  const totalCost = technicalCost + wrapperCost;

  return {
    phases: calculatedPhases,
    wrappers: calculatedWrappers,
    totals: {
      technicalEffort: Math.round(technicalEffort * 10) / 10,
      wrapperEffort: Math.round(wrapperEffort * 10) / 10,
      totalEffort: Math.round(totalEffort * 10) / 10,
      totalCost: Math.round(totalCost * 100) / 100,
      averageRate: Math.round(averageRate * 100) / 100,
      margin: 0, // To be calculated separately based on pricing
    },
  };
}

/**
 * Calculate margin based on selling price
 */
export function calculateMargin(totalCost: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - totalCost) / sellingPrice) * 100;
}

/**
 * Get default hourly rate for role and region
 */
export function getDefaultRate(role: ResourceRole, region: string): number {
  const regionRates = DEFAULT_HOURLY_RATES[region] || DEFAULT_HOURLY_RATES['US-East'];
  return regionRates[role] || 150;
}

/**
 * Create default resource allocation for a phase
 */
export function createDefaultPhaseResources(
  phaseId: string,
  phaseName: string,
  phaseEffort: number,
  region: string = 'US-East'
): PhaseResource[] {
  // Default mix: 70% Technical, 20% Functional, 10% Architect
  return [
    {
      id: `${phaseId}-tech`,
      phaseId,
      phaseName,
      role: 'Technical',
      region,
      allocation: 70,
      hourlyRate: getDefaultRate('Technical', region),
      phaseEffort,
      calculatedHours: 0,
      calculatedCost: 0,
    },
    {
      id: `${phaseId}-func`,
      phaseId,
      phaseName,
      role: 'Functional',
      region,
      allocation: 20,
      hourlyRate: getDefaultRate('Functional', region),
      phaseEffort,
      calculatedHours: 0,
      calculatedCost: 0,
    },
    {
      id: `${phaseId}-arch`,
      phaseId,
      phaseName,
      role: 'Architect',
      region,
      allocation: 10,
      hourlyRate: getDefaultRate('Architect', region),
      phaseEffort,
      calculatedHours: 0,
      calculatedCost: 0,
    },
  ].map((r) => calculatePhaseResource(r as Omit<PhaseResource, 'calculatedHours' | 'calculatedCost'>));
}

/**
 * Create default wrappers for a project
 */
export function createDefaultWrappers(projectId: string, phaseIds: string[]): Wrapper[] {
  return Object.entries(WRAPPER_DEFAULTS).map(([type, config]) => ({
    id: `${projectId}-wrapper-${type}`,
    type: type as WrapperType,
    phases: phaseIds,
    effortPercentage: config.percentage,
    description: config.description,
    calculatedEffort: 0,
    calculatedCost: 0,
  }));
}
