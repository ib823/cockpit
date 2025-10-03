import { Resource, Phase } from '@/types/core';

// Default team composition for scenarios
export const DEFAULT_TEAM_COMPOSITION = {
  architect: 1,
  developer: 3,
  consultant: 2,
  projectManager: 1
} as const;

// Standard team composition (alias for backward compatibility)
export const STANDARD_TEAM_COMPOSITION = DEFAULT_TEAM_COMPOSITION;

// Rate cards by region
export const RATE_CARDS = {
  'ABMY': { // Asia Pacific - Malaysia
    architect: 150,
    developer: 100,
    consultant: 120,
    projectManager: 140,
    currency: 'USD'
  },
  'APSG': { // Asia Pacific - Singapore
    architect: 180,
    developer: 120,
    consultant: 140,
    projectManager: 160,
    currency: 'USD'
  },
  'NA': { // North America
    architect: 200,
    developer: 150,
    consultant: 180,
    projectManager: 190,
    currency: 'USD'
  },
  'EU': { // Europe
    architect: 180,
    developer: 130,
    consultant: 160,
    projectManager: 170,
    currency: 'EUR'
  },
  'default': {
    architect: 150,
    developer: 100,
    consultant: 120,
    projectManager: 140,
    currency: 'USD'
  }
} as const;

/**
 * Generate resource requirements based on effort and region
 */
export function generateResourceRequirements(
  effortDays: number,
  region: string = 'ABMY'
): Resource[] {
  const rateCard = RATE_CARDS[region as keyof typeof RATE_CARDS] || RATE_CARDS.default;

  // Calculate team size based on effort
  const teamMultiplier = Math.max(1, Math.ceil(effortDays / 60)); // 1 team per ~3 months

  const resources: Resource[] = [
    {
      id: `architect-${region}`,
      name: 'Solution Architect',
      role: 'architect',
      allocation: DEFAULT_TEAM_COMPOSITION.architect * teamMultiplier * 0.5, // Part-time
      region: region,
      hourlyRate: rateCard.architect
    },
    {
      id: `developer-${region}`,
      name: 'Developer',
      role: 'developer',
      allocation: DEFAULT_TEAM_COMPOSITION.developer * teamMultiplier,
      region: region,
      hourlyRate: rateCard.developer
    },
    {
      id: `consultant-${region}`,
      name: 'Functional Consultant',
      role: 'consultant',
      allocation: DEFAULT_TEAM_COMPOSITION.consultant * teamMultiplier,
      region: region,
      hourlyRate: rateCard.consultant
    },
    {
      id: `pm-${region}`,
      name: 'Project Manager',
      role: 'projectManager',
      allocation: DEFAULT_TEAM_COMPOSITION.projectManager * teamMultiplier * 0.5, // Part-time
      region: region,
      hourlyRate: rateCard.projectManager
    }
  ];

  return resources;
}

/**
 * Calculate total project cost from phases
 */
export function calculateProjectCost(phases: Phase[]): {
  totalCost: number;
  breakdown: Record<string, number>;
  currency: string;
} {
  let totalCost = 0;
  const breakdown: Record<string, number> = {};
  const currency = 'USD';

  phases.forEach(phase => {
    if (!phase.resources || !phase.workingDays) return;

    phase.resources.forEach(resource => {
      const phaseCost = resource.allocation * resource.hourlyRate * phase.workingDays * 8; // 8 hours per day
      totalCost += phaseCost;

      const key = resource.role;
      breakdown[key] = (breakdown[key] || 0) + phaseCost;
    });
  });

  return {
    totalCost,
    breakdown,
    currency
  };
}