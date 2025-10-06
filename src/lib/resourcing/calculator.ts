/**
 * Resource Calculator
 *
 * High-level calculator functions for resource planning
 */

import {
  PhaseAllocation,
  PhaseResource,
  ResourcePlan,
  Wrapper,
  calculateResourcePlan,
  createDefaultPhaseResources,
  createDefaultWrappers,
  calculateMargin,
  getDefaultRate,
  ResourceRole,
} from './model';
import { Phase } from '@/types/core';

/**
 * Generate complete resource plan from phases
 */
export function generateResourcePlan(
  phases: Phase[],
  region: string = 'US-East',
  projectId: string = 'default'
): ResourcePlan {
  // Create phase allocations with default resources
  const phaseAllocations: Omit<PhaseAllocation, 'totalCost' | 'averageRate'>[] = phases.map(
    (phase) => ({
      phaseId: phase.id,
      phaseName: phase.name,
      category: (phase.category || 'prepare') as 'prepare' | 'explore' | 'realize' | 'deploy' | 'run',
      baseEffort: phase.effort || 0,
      resources: createDefaultPhaseResources(phase.id, phase.name, phase.effort || 0, region),
    })
  );

  // Create default wrappers
  const wrappers = createDefaultWrappers(
    projectId,
    phases.map((p) => p.id)
  ).map(w => ({ ...w, calculatedEffort: 0, calculatedCost: 0 }));

  // Calculate plan
  return calculateResourcePlan(phaseAllocations, wrappers);
}

/**
 * Update resource allocation and recalculate
 */
export function updateResourceAllocation(
  plan: ResourcePlan,
  phaseId: string,
  resourceId: string,
  updates: Partial<PhaseResource>
): ResourcePlan {
  const updatedPhases = plan.phases.map((phase) => {
    if (phase.phaseId !== phaseId) return phase;

    return {
      ...phase,
      resources: phase.resources.map((resource) =>
        resource.id === resourceId ? { ...resource, ...updates } : resource
      ),
    };
  });

  return calculateResourcePlan(
    updatedPhases,
    plan.wrappers.map(w => ({ ...w, calculatedEffort: 0, calculatedCost: 0 }))
  );
}

/**
 * Add resource to phase
 */
export function addResourceToPhase(
  plan: ResourcePlan,
  phaseId: string,
  role: ResourceRole,
  region: string,
  allocation: number = 50
): ResourcePlan {
  const phase = plan.phases.find((p) => p.phaseId === phaseId);
  if (!phase) return plan;

  const newResource: Omit<PhaseResource, 'calculatedHours' | 'calculatedCost'> = {
    id: `${phaseId}-${role}-${Date.now()}`,
    phaseId,
    phaseName: phase.phaseName,
    role,
    region,
    allocation,
    hourlyRate: getDefaultRate(role, region),
    phaseEffort: phase.baseEffort,
  };

  const updatedPhases = plan.phases.map((p) => {
    if (p.phaseId !== phaseId) return p;
    return {
      ...p,
      resources: [...p.resources, newResource as PhaseResource],
    };
  });

  return calculateResourcePlan(
    updatedPhases,
    plan.wrappers.map(w => ({ ...w, calculatedEffort: 0, calculatedCost: 0 }))
  );
}

/**
 * Remove resource from phase
 */
export function removeResourceFromPhase(
  plan: ResourcePlan,
  phaseId: string,
  resourceId: string
): ResourcePlan {
  const updatedPhases = plan.phases.map((phase) => {
    if (phase.phaseId !== phaseId) return phase;

    return {
      ...phase,
      resources: phase.resources.filter((r) => r.id !== resourceId),
    };
  });

  return calculateResourcePlan(
    updatedPhases,
    plan.wrappers.map(w => ({ ...w, calculatedEffort: 0, calculatedCost: 0 }))
  );
}

/**
 * Update wrapper configuration
 */
export function updateWrapper(
  plan: ResourcePlan,
  wrapperId: string,
  updates: Partial<Wrapper>
): ResourcePlan {
  const updatedWrappers = plan.wrappers.map((wrapper) =>
    wrapper.id === wrapperId
      ? { ...wrapper, ...updates, calculatedEffort: 0, calculatedCost: 0 }
      : { ...wrapper, calculatedEffort: 0, calculatedCost: 0 }
  );

  return calculateResourcePlan(plan.phases, updatedWrappers);
}

/**
 * Calculate margin for a given selling price
 */
export function calculatePlanMargin(plan: ResourcePlan, sellingPrice: number): number {
  return calculateMargin(plan.totals.totalCost, sellingPrice);
}

/**
 * Get resource utilization breakdown
 */
export function getResourceUtilization(plan: ResourcePlan): {
  byRole: Record<ResourceRole, { hours: number; cost: number; percentage: number }>;
  byPhase: Record<string, { hours: number; cost: number; percentage: number }>;
} {
  const byRole: Record<string, { hours: number; cost: number }> = {};
  const byPhase: Record<string, { hours: number; cost: number }> = {};

  let totalHours = 0;
  let totalCost = 0;

  // Aggregate by role and phase
  plan.phases.forEach((phase) => {
    const phaseHours = phase.resources.reduce((sum, r) => sum + r.calculatedHours, 0);
    const phaseCost = phase.totalCost;

    byPhase[phase.phaseName] = {
      hours: phaseHours,
      cost: phaseCost,
    };

    totalHours += phaseHours;
    totalCost += phaseCost;

    phase.resources.forEach((resource) => {
      if (!byRole[resource.role]) {
        byRole[resource.role] = { hours: 0, cost: 0 };
      }
      byRole[resource.role].hours += resource.calculatedHours;
      byRole[resource.role].cost += resource.calculatedCost;
    });
  });

  // Calculate percentages
  // Calculate percentages
  const byRoleWithPercentage: Record<ResourceRole, { hours: number; cost: number; percentage: number }> = {} as any;
  Object.keys(byRole).forEach((role) => {
    byRoleWithPercentage[role as ResourceRole] = {
      ...byRole[role],
      percentage: (byRole[role].cost / totalCost) * 100,
    };
  });

  const byPhaseWithPercentage: Record<string, { hours: number; cost: number; percentage: number }> = {};
  Object.keys(byPhase).forEach((phase) => {
    byPhaseWithPercentage[phase] = {
      ...byPhase[phase],
      percentage: (byPhase[phase].cost / totalCost) * 100,
    };
  });

  return {
    byRole: byRoleWithPercentage,
    byPhase: byPhaseWithPercentage,
  };
}
