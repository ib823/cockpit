// @ts-nocheck
import { EffortCalculator } from '@/lib/engine/calculation/effort-calculator';
import { ALL_SAP_MODULES } from '@/data/modules/all-modules';

// Initialize the sophisticated effort calculator
const effortCalculator = new EffortCalculator();

export function calculateEffort(
  packages: string[],
  complexity: 'standard' | 'complex' | 'extreme',
  clientProfile?: {
    size: 'small' | 'medium' | 'large' | 'enterprise';
    maturity: 'naive' | 'basic' | 'intermediate' | 'advanced';
    industry: string;
    employees: number;
    annualRevenue: number;
    region: string;
  }
): number {
  // Use the sophisticated EffortCalculator
  const context = {
    modules: packages,
    clientProfile: {
      size: clientProfile?.size || 'medium',
      complexity,
      maturity: clientProfile?.maturity || 'basic',
      industry: clientProfile?.industry || 'default',
      region: clientProfile?.region || 'ABMY',
      employees: clientProfile?.employees || 500,
      annualRevenue: clientProfile?.annualRevenue || 100000000
    },
    assumptions: [],
    risks: []
  };
  
  const breakdown = effortCalculator.calculate(context);
  
  // Log the sophisticated calculation for debugging
  console.log('Effort Calculation Breakdown:', {
    baseEffort: breakdown.baseEffort,
    complexityMultiplier: breakdown.complexityMultiplier,
    sizeMultiplier: breakdown.sizeMultiplier, 
    maturityMultiplier: breakdown.maturityMultiplier,
    industryMultiplier: breakdown.industryMultiplier,
    riskBuffer: breakdown.riskBuffer,
    totalEffort: breakdown.totalEffort,
    confidence: breakdown.confidence
  });
  
  return Math.ceil(breakdown.totalEffort);
}

export function sequencePhases(phases: any[]): any[] {
  const nodes = new Map<string, any>();
  const indegree = new Map<string, number>();
  
  phases.forEach(p => {
    nodes.set(p.id, p);
    indegree.set(p.id, 0);
  });
  
  phases.forEach(p => {
    p.dependencies?.forEach(() => {
      indegree.set(p.id, (indegree.get(p.id) || 0) + 1);
    });
  });
  
  const queue: string[] = [];
  indegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });
  
  const result: any[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const phase = nodes.get(id)!;
    result.push(phase);
    
    phases.forEach(p => {
      if (p.dependencies?.includes(id)) {
        const newDegree = (indegree.get(p.id) || 0) - 1;
        indegree.set(p.id, newDegree);
        if (newDegree === 0) queue.push(p.id);
      }
    });
  }
  
  return result;
}