// Extracted from Timeline MVP - Resource Catalog and Rate Cards

export interface Role {
  title: string;
  rate: number;
  currency: string;
  level: number;
}

export interface RegionCatalog {
  name: string;
  currency: string;
  positions: Record<string, Role>;
}

export const RESOURCE_CATALOG: Record<string, RegionCatalog> = {
  ABMY: {
    name: 'Malaysia',
    currency: 'MYR',
    positions: {
      Partner: { title: 'Partner', rate: 5200, currency: 'MYR', level: 7 },
      Director: { title: 'Director', rate: 4400, currency: 'MYR', level: 6 },
      'Senior Manager': { title: 'Senior Manager', rate: 3600, currency: 'MYR', level: 5 },
      Manager: { title: 'Manager', rate: 2800, currency: 'MYR', level: 4 },
      'Senior Consultant': { title: 'Senior Consultant', rate: 2400, currency: 'MYR', level: 3 },
      Consultant: { title: 'Consultant', rate: 1800, currency: 'MYR', level: 2 },
      Analyst: { title: 'Analyst', rate: 1200, currency: 'MYR', level: 1 }
    }
  },
  
  ABSG: {
    name: 'Singapore',
    currency: 'SGD',
    positions: {
      Partner: { title: 'Partner', rate: 2080, currency: 'SGD', level: 7 },
      Director: { title: 'Director', rate: 1760, currency: 'SGD', level: 6 },
      'Senior Manager': { title: 'Senior Manager', rate: 1440, currency: 'SGD', level: 5 },
      Manager: { title: 'Manager', rate: 1120, currency: 'SGD', level: 4 },
      'Senior Consultant': { title: 'Senior Consultant', rate: 960, currency: 'SGD', level: 3 },
      Consultant: { title: 'Consultant', rate: 720, currency: 'SGD', level: 2 },
      Analyst: { title: 'Analyst', rate: 480, currency: 'SGD', level: 1 }
    }
  },
  
  ABVN: {
    name: 'Vietnam',
    currency: 'VND',
    positions: {
      Partner: { title: 'Partner', rate: 31200000, currency: 'VND', level: 7 },
      Director: { title: 'Director', rate: 26400000, currency: 'VND', level: 6 },
      'Senior Manager': { title: 'Senior Manager', rate: 21600000, currency: 'VND', level: 5 },
      Manager: { title: 'Manager', rate: 16800000, currency: 'VND', level: 4 },
      'Senior Consultant': { title: 'Senior Consultant', rate: 14400000, currency: 'VND', level: 3 },
      Consultant: { title: 'Consultant', rate: 10800000, currency: 'VND', level: 2 },
      Analyst: { title: 'Analyst', rate: 7200000, currency: 'VND', level: 1 }
    }
  }
};

// Team composition templates
export const TEAM_TEMPLATES = {
  'finance-standard': {
    name: 'Finance Team (Standard)',
    resources: [
      { role: 'Manager', allocation: 50 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 80 },
      { role: 'Analyst', allocation: 60 }
    ]
  },
  'scm-standard': {
    name: 'SCM Team (Standard)',
    resources: [
      { role: 'Senior Manager', allocation: 40 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 80 },
      { role: 'Consultant', allocation: 60 }
    ]
  },
  'technical-heavy': {
    name: 'Technical Team (Heavy)',
    resources: [
      { role: 'Manager', allocation: 30 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 80 },
      { role: 'Analyst', allocation: 60 }
    ]
  }
};

// Calculate blended rate
export function calculateBlendedRate(
  resources: Array<{ role: string; region: string; allocation: number }>,
  dailyHours: number = 8
): number {
  if (!resources.length) return 0;
  
  const totalWeighted = resources.reduce((sum, r) => {
    const rate = RESOURCE_CATALOG[r.region]?.positions[r.role]?.rate || 0;
    return sum + (rate * r.allocation / 100);
  }, 0);
  
  const avgAllocation = resources.reduce((sum, r) => sum + r.allocation, 0) / resources.length;
  
  return Math.round(totalWeighted * dailyHours / avgAllocation);
}

// Format currency
export function formatCurrency(
  amount: number,
  region: string,
  options: { abbreviate?: boolean } = {}
): string {
  const catalog = RESOURCE_CATALOG[region];
  if (!catalog) return amount.toString();
  
  const { currency } = catalog;
  
  if (options.abbreviate && amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (options.abbreviate && amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(0)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Calculate project cost
export function calculateProjectCost(
  phases: Array<{ workingDays: number; resources: any[] }>,
  dailyHours: number = 8
): number {
  return phases.reduce((total, phase) => {
    const phaseCost = (phase.resources || []).reduce((sum, r) => {
      const rate = r.hourlyRate || 0;
      const days = phase.workingDays || 0;
      const allocation = r.allocation || 0;
      return sum + (rate * dailyHours * days * allocation / 100);
    }, 0);
    return total + phaseCost;
  }, 0);
}

// Compute optimal team size based on effort
export function computeTeamSize(
  totalEffort: number,
  duration: number,
  utilizationTarget: number = 0.8
): number {
  const availableDays = duration * utilizationTarget;
  return Math.ceil(totalEffort / availableDays);
}







