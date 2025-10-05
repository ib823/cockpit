import { Phase } from '@/types/core';

export const RATES_BY_REGION_ROLE = {
  ABMY: {
    Partner: 450,
    Director: 380,
    'Senior Manager': 320,
    Manager: 240,
    'Senior Consultant': 180,
    Consultant: 140,
    Analyst: 100,
  },
  ABSG: {
    Partner: 520,
    Director: 440,
    'Senior Manager': 380,
    Manager: 280,
    'Senior Consultant': 210,
    Consultant: 165,
    Analyst: 120,
  },
  ABVN: {
    Partner: 380,
    Director: 320,
    'Senior Manager': 270,
    Manager: 200,
    'Senior Consultant': 150,
    Consultant: 115,
    Analyst: 85,
  },
} as const;

export type Region = keyof typeof RATES_BY_REGION_ROLE;
export type Role = keyof typeof RATES_BY_REGION_ROLE.ABMY;

export function calculatePhaseCost(phase: Phase, region: Region = 'ABMY'): number {
  if (!phase.resources || phase.resources.length === 0) {
    return 0;
  }
  
  return phase.resources.reduce((total, resource) => {
    const role = (resource.role || 'Consultant') as Role;
    const hourlyRate = RATES_BY_REGION_ROLE[region][role] || resource.hourlyRate || 150;
    const hours = (phase.effort || phase.workingDays || 0) * 8;
    const allocation = (resource.allocation || 100) / 100;
    
    const resourceCost = hourlyRate * hours * allocation;
    return total + resourceCost;
  }, 0);
}

export function calculateProjectCost(
  phases: Phase[],
  region: Region = 'ABMY'
): {
  totalCost: number;
  costByPhase: Record<string, number>;
  currency: string;
} {
  const costByPhase: Record<string, number> = {};
  let totalCost = 0;
  
  phases.forEach(phase => {
    const phaseCost = calculatePhaseCost(phase, region);
    costByPhase[phase.id] = phaseCost;
    totalCost += phaseCost;
  });
  
  const currency = region === 'ABSG' ? 'SGD' : region === 'ABVN' ? 'VND' : 'MYR';
  
  return {
    totalCost,
    costByPhase,
    currency,
  };
}

export function formatCurrency(amount: number, region: Region = 'ABMY'): string {
  const currency = region === 'ABSG' ? 'SGD' : region === 'ABVN' ? 'VND' : 'MYR';
  
  if (region === 'ABVN') {
    return `${amount.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ${currency}`;
  }
  
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}