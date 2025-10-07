/**
 * RICEFW Calculator
 *
 * High-level functions for RICEFW management and calculations
 */

import {
  RicefwItem,
  RicefwType,
  Complexity,
  Phase,
  calculateRicefwItem,
  getRicefwEffortByPhase,
  BASE_EFFORT,
} from './model';

/**
 * Create new RICEFW item with calculated effort
 */
export function createRicefwItem(
  projectId: string,
  type: RicefwType,
  name: string,
  complexity: Complexity,
  count: number,
  phase: Phase,
  description?: string
): RicefwItem {
  const item: Omit<RicefwItem, 'totalEffort'> = {
    id: `ricefw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    type,
    name,
    description,
    complexity,
    count,
    effortPerItem: BASE_EFFORT[type][complexity],
    phase,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return calculateRicefwItem(item);
}

/**
 * Update RICEFW item and recalculate
 */
export function updateRicefwItem(
  item: RicefwItem,
  updates: Partial<Omit<RicefwItem, 'id' | 'projectId' | 'totalEffort' | 'createdAt'>>
): RicefwItem {
  const updated = { ...item, ...updates, updatedAt: new Date() };

  // Recalculate effortPerItem if type or complexity changed
  if (updates.type || updates.complexity) {
    updated.effortPerItem = BASE_EFFORT[updated.type][updated.complexity];
  }

  return calculateRicefwItem(updated);
}

/**
 * Bulk create RICEFW items from a quick-entry list
 */
export function bulkCreateRicefwItems(
  projectId: string,
  entries: Array<{
    type: RicefwType;
    name: string;
    complexity: Complexity;
    count: number;
    phase?: Phase;
    description?: string;
  }>
): RicefwItem[] {
  return entries.map((entry) =>
    createRicefwItem(
      projectId,
      entry.type,
      entry.name,
      entry.complexity,
      entry.count,
      entry.phase || 'realize',
      entry.description
    )
  );
}

/**
 * Calculate effort impact on phases
 */
export function calculateRicefwPhaseImpact(
  items: RicefwItem[]
): {
  explore: number;
  realize: number;
  deploy: number;
  total: number;
} {
  const byPhase = getRicefwEffortByPhase(items);

  return {
    explore: byPhase.explore,
    realize: byPhase.realize,
    deploy: byPhase.deploy,
    total: byPhase.explore + byPhase.realize + byPhase.deploy,
  };
}

/**
 * Get RICEFW recommendations based on scope
 */
export function getRicefwRecommendations(scope: {
  countries: number;
  legalEntities: number;
  modules: string[];
  industry: string;
}): Array<{
  type: RicefwType;
  name: string;
  complexity: Complexity;
  count: number;
  rationale: string;
}> {
  const recommendations: Array<{
    type: RicefwType;
    name: string;
    complexity: Complexity;
    count: number;
    rationale: string;
  }> = [];

  // Multi-country reports
  if (scope.countries > 1) {
    recommendations.push({
      type: 'report',
      name: 'Statutory Reports by Country',
      complexity: 'M',
      count: scope.countries,
      rationale: 'Each country requires localized statutory reporting',
    });
  }

  // Legal entity consolidation
  if (scope.legalEntities > 1) {
    recommendations.push({
      type: 'report',
      name: 'Consolidated Financial Reports',
      complexity: 'L',
      count: Math.ceil(scope.legalEntities / 3),
      rationale: 'Multi-entity consolidation requires complex reporting',
    });
  }

  // Module-specific interfaces
  if (scope.modules.includes('SCM')) {
    recommendations.push({
      type: 'interface',
      name: 'WMS Integration',
      complexity: 'M',
      count: 1,
      rationale: 'SCM typically requires warehouse management integration',
    });
  }

  if (scope.modules.includes('Sales')) {
    recommendations.push({
      type: 'interface',
      name: 'E-commerce Integration',
      complexity: 'L',
      count: 1,
      rationale: 'Sales module often integrates with e-commerce platforms',
    });
  }

  // Industry-specific
  if (scope.industry === 'Manufacturing') {
    recommendations.push({
      type: 'interface',
      name: 'MES/SCADA Integration',
      complexity: 'L',
      count: 1,
      rationale: 'Manufacturing requires shop floor system integration',
    });
  }

  // Standard forms
  recommendations.push({
    type: 'form',
    name: 'Purchase Order Template',
    complexity: 'S',
    count: scope.countries,
    rationale: 'Localized PO templates per country',
  });

  recommendations.push({
    type: 'form',
    name: 'Invoice Template',
    complexity: 'M',
    count: scope.countries,
    rationale: 'Country-specific invoice requirements',
  });

  return recommendations;
}

/**
 * Calculate complexity distribution
 */
export function getComplexityDistribution(items: RicefwItem[]): {
  simple: number;
  medium: number;
  large: number;
  averageComplexity: number;
} {
  const distribution = items.reduce(
    (acc, item) => {
      acc[item.complexity] += item.count;
      return acc;
    },
    { S: 0, M: 0, L: 0 }
  );

  const total = distribution.S + distribution.M + distribution.L;

  // Weight: S=1, M=2, L=3
  const weighted = distribution.S * 1 + distribution.M * 2 + distribution.L * 3;
  const averageComplexity = total > 0 ? weighted / total : 0;

  return {
    simple: distribution.S,
    medium: distribution.M,
    large: distribution.L,
    averageComplexity: Math.round(averageComplexity * 10) / 10,
  };
}

/**
 * Optimize RICEFW scope to hit target effort
 */
export function optimizeRicefwScope(
  items: RicefwItem[],
  targetEffort: number
): {
  optimized: RicefwItem[];
  removed: RicefwItem[];
  achievedEffort: number;
} {
  const currentEffort = items.reduce((sum, item) => sum + item.totalEffort, 0);

  if (currentEffort <= targetEffort) {
    return {
      optimized: items,
      removed: [],
      achievedEffort: currentEffort,
    };
  }

  // Sort by effort (descending) and remove until target is met
  const sorted = [...items].sort((a, b) => b.totalEffort - a.totalEffort);
  const optimized: RicefwItem[] = [];
  const removed: RicefwItem[] = [];
  let achievedEffort = 0;

  for (const item of sorted) {
    if (achievedEffort + item.totalEffort <= targetEffort) {
      optimized.push(item);
      achievedEffort += item.totalEffort;
    } else {
      removed.push(item);
    }
  }

  return {
    optimized,
    removed,
    achievedEffort: Math.round(achievedEffort * 10) / 10,
  };
}
