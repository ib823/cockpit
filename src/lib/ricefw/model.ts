/**
 * RICEFW Model
 *
 * Defines structure and calculation logic for RICEFW objects:
 * - Reports (R)
 * - Interfaces (I)
 * - Conversions (C)
 * - Enhancements (E)
 * - Forms (F)
 * - Workflows (W)
 */

export type RicefwType = 'report' | 'interface' | 'conversion' | 'enhancement' | 'form' | 'workflow';
export type Complexity = 'S' | 'M' | 'L';
export type Phase = 'explore' | 'realize' | 'deploy';

export interface RicefwItem {
  id: string;
  projectId: string;
  type: RicefwType;
  name: string;
  description?: string;
  complexity: Complexity;
  count: number;
  effortPerItem: number; // Base effort in PD per item
  totalEffort: number; // Derived: count * effortPerItem * complexityMultiplier
  phase: Phase;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormItem {
  id: string;
  projectId: string;
  name: string;
  type: 'po' | 'invoice' | 'deliveryNote' | 'custom';
  languages: string[]; // e.g., ['en', 'de', 'fr']
  complexity: Complexity;
  effort: number; // Total PD
  createdAt?: Date;
}

export interface IntegrationItem {
  id: string;
  projectId: string;
  name: string;
  type: 'api' | 'file' | 'database' | 'realtime' | 'batch';
  source: string;
  target: string;
  complexity: Complexity;
  volume: 'low' | 'medium' | 'high';
  effort: number; // Total PD
  createdAt?: Date;
}

export interface RicefwSummary {
  reports: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  interfaces: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  conversions: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  enhancements: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  forms: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  workflows: {
    count: number;
    effort: number;
    cost: number;
    byComplexity: Record<Complexity, number>;
  };
  totals: {
    count: number;
    effort: number;
    cost: number;
  };
}

// ============================================================================
// EFFORT MULTIPLIERS BY COMPLEXITY
// ============================================================================

export const COMPLEXITY_MULTIPLIERS: Record<Complexity, number> = {
  S: 1.0, // Simple: baseline effort
  M: 1.5, // Medium: 50% more effort
  L: 2.5, // Large: 150% more effort
};

// ============================================================================
// BASE EFFORT BY RICEFW TYPE (in Person-Days)
// ============================================================================

export const BASE_EFFORT: Record<RicefwType, Record<Complexity, number>> = {
  report: {
    S: 3.5,  // Simple report: 3.5 PD
    M: 5.0,  // Medium report: 5 PD
    L: 7.0,  // Complex report: 7 PD
  },
  interface: {
    S: 8.0,   // Simple interface: 8 PD
    M: 12.0,  // Medium interface: 12 PD
    L: 18.0,  // Complex interface: 18 PD
  },
  conversion: {
    S: 2.0,   // Simple conversion: 2 PD
    M: 3.5,   // Medium conversion: 3.5 PD
    L: 5.0,   // Complex conversion: 5 PD
  },
  enhancement: {
    S: 5.0,   // Simple enhancement: 5 PD
    M: 8.0,   // Medium enhancement: 8 PD
    L: 12.0,  // Complex enhancement: 12 PD
  },
  form: {
    S: 2.5,   // Simple form: 2.5 PD
    M: 4.0,   // Medium form: 4 PD
    L: 6.0,   // Complex form: 6 PD
  },
  workflow: {
    S: 6.0,   // Simple workflow: 6 PD
    M: 10.0,  // Medium workflow: 10 PD
    L: 15.0,  // Complex workflow: 15 PD
  },
};

// ============================================================================
// PHASE DISTRIBUTION
// ============================================================================

export const PHASE_DISTRIBUTION: Record<RicefwType, Record<Phase, number>> = {
  report: {
    explore: 0.15,  // 15% in Explore (design)
    realize: 0.70,  // 70% in Realize (build + unit test)
    deploy: 0.15,   // 15% in Deploy (UAT + hypercare)
  },
  interface: {
    explore: 0.20,  // 20% in Explore (design)
    realize: 0.65,  // 65% in Realize (build + unit test)
    deploy: 0.15,   // 15% in Deploy (UAT + hypercare)
  },
  conversion: {
    explore: 0.10,  // 10% in Explore (mapping)
    realize: 0.50,  // 50% in Realize (scripts)
    deploy: 0.40,   // 40% in Deploy (execution + validation)
  },
  enhancement: {
    explore: 0.20,  // 20% in Explore (design)
    realize: 0.70,  // 70% in Realize (development)
    deploy: 0.10,   // 10% in Deploy (UAT)
  },
  form: {
    explore: 0.10,  // 10% in Explore (requirements)
    realize: 0.70,  // 70% in Realize (development)
    deploy: 0.20,   // 20% in Deploy (UAT + training)
  },
  workflow: {
    explore: 0.25,  // 25% in Explore (design)
    realize: 0.60,  // 60% in Realize (development)
    deploy: 0.15,   // 15% in Deploy (UAT)
  },
};

// ============================================================================
// PURE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate total effort for a RICEFW item
 */
export function calculateRicefwEffort(
  type: RicefwType,
  complexity: Complexity,
  count: number
): number {
  const baseEffort = BASE_EFFORT[type][complexity];
  const totalEffort = baseEffort * count;
  return Math.round(totalEffort * 10) / 10;
}

/**
 * Calculate effort distribution across phases
 */
export function calculatePhaseDistribution(
  type: RicefwType,
  totalEffort: number
): Record<Phase, number> {
  const distribution = PHASE_DISTRIBUTION[type];
  return {
    explore: Math.round(totalEffort * distribution.explore * 10) / 10,
    realize: Math.round(totalEffort * distribution.realize * 10) / 10,
    deploy: Math.round(totalEffort * distribution.deploy * 10) / 10,
  };
}

/**
 * Calculate complete RICEFW item with derived values
 */
export function calculateRicefwItem(
  item: Omit<RicefwItem, 'totalEffort'>
): RicefwItem {
  const totalEffort = calculateRicefwEffort(item.type, item.complexity, item.count);

  return {
    ...item,
    totalEffort,
  };
}

/**
 * Calculate RICEFW summary from list of items
 */
export function calculateRicefwSummary(
  items: RicefwItem[],
  averageHourlyRate: number = 150
): RicefwSummary {
  const summary: RicefwSummary = {
    reports: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    interfaces: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    conversions: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    enhancements: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    forms: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    workflows: { count: 0, effort: 0, cost: 0, byComplexity: { S: 0, M: 0, L: 0 } },
    totals: { count: 0, effort: 0, cost: 0 },
  };

  items.forEach((item) => {
    const category = item.type === 'report' ? 'reports'
      : item.type === 'interface' ? 'interfaces'
      : item.type === 'conversion' ? 'conversions'
      : item.type === 'enhancement' ? 'enhancements'
      : item.type === 'form' ? 'forms'
      : 'workflows';

    summary[category].count += item.count;
    summary[category].effort += item.totalEffort;
    summary[category].cost += item.totalEffort * 8 * averageHourlyRate;
    summary[category].byComplexity[item.complexity] += item.count;

    summary.totals.count += item.count;
    summary.totals.effort += item.totalEffort;
    summary.totals.cost += item.totalEffort * 8 * averageHourlyRate;
  });

  // Round values
  Object.keys(summary).forEach((key) => {
    if (key === 'totals') {
      summary.totals.effort = Math.round(summary.totals.effort * 10) / 10;
      summary.totals.cost = Math.round(summary.totals.cost * 100) / 100;
    } else {
      const category = summary[key as keyof Omit<RicefwSummary, 'totals'>];
      category.effort = Math.round(category.effort * 10) / 10;
      category.cost = Math.round(category.cost * 100) / 100;
    }
  });

  return summary;
}

/**
 * Get effort by phase for all RICEFW items
 */
export function getRicefwEffortByPhase(
  items: RicefwItem[]
): Record<Phase, number> {
  const result: Record<Phase, number> = {
    explore: 0,
    realize: 0,
    deploy: 0,
  };

  items.forEach((item) => {
    const distribution = calculatePhaseDistribution(item.type, item.totalEffort);
    result.explore += distribution.explore;
    result.realize += distribution.realize;
    result.deploy += distribution.deploy;
  });

  return {
    explore: Math.round(result.explore * 10) / 10,
    realize: Math.round(result.realize * 10) / 10,
    deploy: Math.round(result.deploy * 10) / 10,
  };
}

/**
 * Validate RICEFW item
 */
export function validateRicefwItem(item: Partial<RicefwItem>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!item.type) {
    errors.push('Type is required');
  }

  if (!item.complexity) {
    errors.push('Complexity is required');
  }

  if (item.count === undefined || item.count < 0) {
    errors.push('Count must be >= 0');
  }

  if (item.count && item.count > 1000) {
    errors.push('Count exceeds maximum (1000)');
  }

  if (!item.phase) {
    errors.push('Phase is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
