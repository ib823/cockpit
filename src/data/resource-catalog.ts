// @ts-nocheck
import { RateCard, Resource } from '@/types/chip-override';

// Regional rate cards with hourly rates in local currencies
export const RESOURCE_CATALOG: RateCard[] = [
  // Malaysia (MYR)
  { role: 'Partner', region: 'ABMY', hourlyRate: 800, includeOPE: true },
  { role: 'Director', region: 'ABMY', hourlyRate: 650, includeOPE: true },
  { role: 'Senior Manager', region: 'ABMY', hourlyRate: 500, includeOPE: true },
  { role: 'Manager', region: 'ABMY', hourlyRate: 400, includeOPE: true },
  { role: 'Senior Consultant', region: 'ABMY', hourlyRate: 300, includeOPE: true },
  { role: 'Consultant', region: 'ABMY', hourlyRate: 200, includeOPE: true },
  { role: 'Analyst', region: 'ABMY', hourlyRate: 150, includeOPE: true },

  // Singapore (SGD)
  { role: 'Partner', region: 'ABSG', hourlyRate: 900, includeOPE: true },
  { role: 'Director', region: 'ABSG', hourlyRate: 750, includeOPE: true },
  { role: 'Senior Manager', region: 'ABSG', hourlyRate: 600, includeOPE: true },
  { role: 'Manager', region: 'ABSG', hourlyRate: 480, includeOPE: true },
  { role: 'Senior Consultant', region: 'ABSG', hourlyRate: 360, includeOPE: true },
  { role: 'Consultant', region: 'ABSG', hourlyRate: 240, includeOPE: true },
  { role: 'Analyst', region: 'ABSG', hourlyRate: 180, includeOPE: true },

  // Vietnam (VND) - rates in thousands
  { role: 'Partner', region: 'ABVN', hourlyRate: 1200, includeOPE: true },
  { role: 'Director', region: 'ABVN', hourlyRate: 1000, includeOPE: true },
  { role: 'Senior Manager', region: 'ABVN', hourlyRate: 800, includeOPE: true },
  { role: 'Manager', region: 'ABVN', hourlyRate: 650, includeOPE: true },
  { role: 'Senior Consultant', region: 'ABVN', hourlyRate: 500, includeOPE: true },
  { role: 'Consultant', region: 'ABVN', hourlyRate: 350, includeOPE: true },
  { role: 'Analyst', region: 'ABVN', hourlyRate: 250, includeOPE: true },
];

// Standard team composition ratios
export const STANDARD_TEAM_COMPOSITION = {
  'Partner': 0.05,         // 5%
  'Director': 0.10,        // 10%
  'Senior Manager': 0.15,   // 15%
  'Manager': 0.20,         // 20%
  'Senior Consultant': 0.25, // 25%
  'Consultant': 0.20,      // 20%
  'Analyst': 0.05          // 5%
};

// Currency formatting by region
export const CURRENCY_FORMATTERS = {
  'ABMY': (amount: number) => `MYR ${amount.toLocaleString()}`,
  'ABSG': (amount: number) => `SGD ${amount.toLocaleString()}`,
  'ABVN': (amount: number) => `VND ${(amount * 1000).toLocaleString()}`
};

// Utility functions
export const getRateCard = (role: string, region: string): RateCard | undefined => {
  return RESOURCE_CATALOG.find(card => card.role === role && card.region === region);
};

export const calculateBlendedRate = (resources: Resource[], hoursPerDay: number = 8): number => {
  if (!resources.length) return 0;
  
  let totalCost = 0;
  let totalAllocation = 0;
  
  resources.forEach(resource => {
    const rateCard = getRateCard(resource.role, resource.region);
    if (rateCard) {
      const allocation = resource.allocation / 100;
      totalCost += rateCard.hourlyRate * hoursPerDay * allocation;
      totalAllocation += allocation;
    }
  });
  
  return totalAllocation > 0 ? totalCost / totalAllocation : 0;
};

export const calculateProjectCost = (phases: any[], hoursPerDay: number = 8): number => {
  return phases.reduce((total, phase) => {
    if (!phase.resources || !phase.resources.length) return total;
    
    const phaseCost = phase.resources.reduce((phaseTotal: number, resource: any) => {
      const rateCard = getRateCard(resource.role, resource.region);
      if (!rateCard) return phaseTotal;
      
      const allocation = resource.allocation / 100;
      const dailyCost = rateCard.hourlyRate * hoursPerDay * allocation;
      const resourceCost = dailyCost * phase.workingDays;
      
      return phaseTotal + resourceCost;
    }, 0);
    
    return total + phaseCost;
  }, 0);
};

export const formatCurrency = (amount: number, region: string): string => {
  const formatter = CURRENCY_FORMATTERS[region as keyof typeof CURRENCY_FORMATTERS];
  return formatter ? formatter(amount) : amount.toLocaleString();
};

export const generateResourceRequirements = (
  effort: number, 
  region: string = 'ABMY',
  teamComposition = STANDARD_TEAM_COMPOSITION
): Resource[] => {
  const resources: Resource[] = [];
  let resourceId = 1;
  
  Object.entries(teamComposition).forEach(([role, percentage]) => {
    const allocation = Math.round(percentage * 100);
    const rateCard = getRateCard(role, region);
    
    resources.push({
      id: `res_${resourceId++}`,
      name: `${role} 1`,
      role: role as any,
      region: region as any,
      allocation,
      hourlyRate: rateCard?.hourlyRate || 0,
      includeOPE: rateCard?.includeOPE || false
    });
  });
  
  return resources;
};

// Export commonly used values
export const ROLES = [
  'Partner',
  'Director', 
  'Senior Manager',
  'Manager',
  'Senior Consultant',
  'Consultant',
  'Analyst'
] as const;

export const REGIONS = ['ABMY', 'ABSG', 'ABVN'] as const;
