// src/lib/estimation-guardrails.ts
import { ScenarioPlan } from '@/types/core';

export interface GuardrailViolation {
  level: 'error' | 'warning';
  message: string;
  fix: string;
}

export function validateEstimation(plan: ScenarioPlan): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  // Rule 1: Total effort should be > 0
  if (plan.totalEffort <= 0 || isNaN(plan.totalEffort)) {
    violations.push({
      level: 'error',
      message: 'Total effort is zero or invalid - calculation failed',
      fix: 'Check that chips have enough information (country, modules, employees)'
    });
  }

  // Rule 2: Finance module should be >= 200 PD minimum
  const configurationEffort = plan.phases
    .filter(p => p.name.includes('Configuration'))
    .reduce((sum, p) => sum + (p.effort || 0), 0);

  if (configurationEffort > 0 && configurationEffort < 200) {
    violations.push({
      level: 'warning',
      message: 'Configuration effort seems too small (< 200 PD)',
      fix: 'Verify scope is complete - SAP implementations typically need 200+ PD for configuration'
    });
  }

  // Rule 3: Duration should be reasonable (convert to months for checking)
  const durationMonths = plan.duration / 20; // Assuming 20 business days per month

  if (durationMonths < 3) {
    violations.push({
      level: 'error',
      message: 'Timeline is too aggressive (< 3 months)',
      fix: 'SAP implementations need minimum 3 months - adjust timeline'
    });
  }

  if (durationMonths > 24) {
    violations.push({
      level: 'warning',
      message: 'Timeline is very long (> 24 months)',
      fix: 'Consider phasing the implementation into multiple waves'
    });
  }

  // Rule 4: Team size should be reasonable (calculate from phases)
  const avgFTE = plan.duration > 0
    ? plan.totalEffort / (plan.duration / 20) // totalPD / months
    : 0;

  if (avgFTE < 3 && plan.totalEffort > 200) {
    violations.push({
      level: 'warning',
      message: `Team size is very small (${avgFTE.toFixed(1)} FTE avg)`,
      fix: 'May not have enough capacity - consider increasing team size'
    });
  }

  if (avgFTE > 20) {
    violations.push({
      level: 'warning',
      message: `Team size is very large (${avgFTE.toFixed(1)} FTE avg)`,
      fix: 'Consider splitting into waves or reducing scope'
    });
  }

  // Rule 5: Cost should be reasonable per PD
  const costPerPD = plan.totalEffort > 0 ? plan.totalCost / plan.totalEffort : 0;

  if (costPerPD > 0 && costPerPD < 1500) {
    violations.push({
      level: 'error',
      message: `Cost per PD is too low (MYR ${costPerPD.toFixed(0)})`,
      fix: 'Check rate card is applied correctly - should be MYR 1,500-3,500 per PD'
    });
  }

  if (costPerPD > 3500) {
    violations.push({
      level: 'warning',
      message: `Cost per PD is high (MYR ${costPerPD.toFixed(0)})`,
      fix: 'May have too many senior resources - review team composition'
    });
  }

  // Rule 6: Phases should have non-zero effort
  const emptyPhases = plan.phases.filter(p => !p.effort || p.effort <= 0);
  if (emptyPhases.length === plan.phases.length) {
    violations.push({
      level: 'error',
      message: 'All phases have zero effort',
      fix: 'Check estimation engine is calculating effort correctly'
    });
  }

  // Rule 7: Check for reasonable phase distribution
  if (plan.phases.length > 0) {
    const realizePhases = plan.phases.filter(p => p.category === 'Realize');
    const realizeEffort = realizePhases.reduce((sum, p) => sum + (p.effort || 0), 0);
    const realizePercent = (realizeEffort / plan.totalEffort) * 100;

    // Realize should be ~40-50% of total effort
    if (realizePercent < 30) {
      violations.push({
        level: 'warning',
        message: `Realize phase is only ${realizePercent.toFixed(0)}% of effort (expected 40-50%)`,
        fix: 'Check phase distribution - Realize is typically the largest phase'
      });
    }

    if (realizePercent > 60) {
      violations.push({
        level: 'warning',
        message: `Realize phase is ${realizePercent.toFixed(0)}% of effort (expected 40-50%)`,
        fix: 'Too much effort in Realize - may need more Explore or Deploy activities'
      });
    }
  }

  // Rule 8: Resources should be allocated
  const phasesWithoutResources = plan.phases.filter(p => !p.resources || p.resources.length === 0);
  if (phasesWithoutResources.length > 0) {
    violations.push({
      level: 'warning',
      message: `${phasesWithoutResources.length} phases have no resources allocated`,
      fix: 'Check resource allocation logic'
    });
  }

  return violations;
}

/**
 * Get summary statistics for a plan (useful for debugging)
 */
export function getPlanSummary(plan: ScenarioPlan): {
  totalEffort: number;
  totalCost: number;
  durationMonths: number;
  avgFTE: number;
  costPerPD: number;
  phaseCount: number;
  streamCount: number;
  realizePct: number;
} {
  const durationMonths = plan.duration / 20;
  const avgFTE = durationMonths > 0 ? plan.totalEffort / durationMonths : 0;
  const costPerPD = plan.totalEffort > 0 ? plan.totalCost / plan.totalEffort : 0;

  const streams = new Set(plan.phases.map(p => p.name.split(' - ')[1] || ''));
  const realizeEffort = plan.phases
    .filter(p => p.category === 'Realize')
    .reduce((sum, p) => sum + (p.effort || 0), 0);
  const realizePct = (realizeEffort / plan.totalEffort) * 100;

  return {
    totalEffort: plan.totalEffort,
    totalCost: plan.totalCost,
    durationMonths,
    avgFTE,
    costPerPD,
    phaseCount: plan.phases.length,
    streamCount: streams.size,
    realizePct
  };
}
