/**
 * Goal-Seek Optimization Engine
 *
 * Provides reverse calculation capabilities to determine what input adjustments
 * are needed to achieve a target timeline or budget.
 */

import { formulaEngine } from "./formula-engine";
import type { EstimatorInputs } from "./types";

export interface GoalSeekParams {
  targetMonths?: number;
  targetMD?: number;
  currentInputs: EstimatorInputs;
  constraints: {
    maxFTE?: number;
    minFTE?: number;
    maxUtilization?: number;
    minUtilization?: number;
    fixedScope?: boolean;
    maxScopeReduction?: number; // % (0-1)
    minOverlap?: number;
  };
}

export interface OptimizationSuggestion {
  scenario: string;
  description: string;
  adjustments: Array<{
    field: string;
    label: string;
    from: number | string;
    to: number | string;
    change: string;
  }>;
  achievesGoal: boolean;
  resultingDuration: number;
  resultingEffort: number;
  costImpact: number;
  riskScore: number;
  riskFactors: string[];
  feasibility: "high" | "medium" | "low";
}

/**
 * Main goal-seek optimizer
 */
export function goalSeekOptimizer(params: GoalSeekParams): OptimizationSuggestion[] {
  const { targetMonths, targetMD, currentInputs, constraints } = params;
  const currentResult = formulaEngine.calculateTotal(currentInputs);
  const suggestions: OptimizationSuggestion[] = [];

  // Validate target
  if (!targetMonths && !targetMD) {
    throw new Error("Must specify either targetMonths or targetMD");
  }

  const target = targetMonths || targetMD! / currentResult.capacityPerMonth;

  // Strategy 1: Add Resources (Increase FTE)
  if (!constraints.maxFTE || currentInputs.fte < constraints.maxFTE) {
    const suggestion = optimizeByAddingResources(currentInputs, target, constraints);
    if (suggestion) suggestions.push(suggestion);
  }

  // Strategy 2: Increase Utilization
  if (
    !constraints.maxUtilization ||
    currentInputs.utilization < (constraints.maxUtilization || 0.9)
  ) {
    const suggestion = optimizeByUtilization(currentInputs, target, constraints);
    if (suggestion) suggestions.push(suggestion);
  }

  // Strategy 3: Reduce Scope
  if (!constraints.fixedScope) {
    const suggestion = optimizeByScopeReduction(currentInputs, target, constraints);
    if (suggestion) suggestions.push(suggestion);
  }

  // Strategy 4: Increase Phase Overlap
  if (currentInputs.overlapFactor > (constraints.minOverlap || 0.6)) {
    const suggestion = optimizeByOverlap(currentInputs, target, constraints);
    if (suggestion) suggestions.push(suggestion);
  }

  // Strategy 5: Hybrid approach
  const hybrid = optimizeHybrid(currentInputs, target, constraints);
  if (hybrid) suggestions.push(hybrid);

  // Sort by risk score (lowest risk first) and feasibility
  return suggestions.sort((a, b) => {
    if (a.feasibility !== b.feasibility) {
      const feasibilityOrder = { high: 0, medium: 1, low: 2 };
      return feasibilityOrder[a.feasibility] - feasibilityOrder[b.feasibility];
    }
    return a.riskScore - b.riskScore;
  });
}

function optimizeByAddingResources(
  currentInputs: EstimatorInputs,
  targetMonths: number,
  constraints: GoalSeekParams["constraints"]
): OptimizationSuggestion | null {
  const currentResult = formulaEngine.calculateTotal(currentInputs);

  // Calculate required capacity
  const requiredCapacity = currentResult.totalMD / targetMonths / currentInputs.overlapFactor;
  const requiredFTE = requiredCapacity / (22 * currentInputs.utilization);

  const maxAllowedFTE = constraints.maxFTE || 20;
  const finalFTE = Math.min(requiredFTE, maxAllowedFTE);

  // Test if this achieves goal
  const testInputs = { ...currentInputs, fte: finalFTE };
  const testResult = formulaEngine.calculateTotal(testInputs);
  const achieves = testResult.durationMonths <= targetMonths;

  // Calculate cost impact (assuming $150/day average rate)
  const additionalFTE = finalFTE - currentInputs.fte;
  const costImpact = additionalFTE * 22 * 150 * targetMonths;

  return {
    scenario: "Add Resources",
    description: "Increase team size to accelerate delivery",
    adjustments: [
      {
        field: "fte",
        label: "Team Size (FTE)",
        from: currentInputs.fte.toFixed(1),
        to: finalFTE.toFixed(1),
        change: `+${(finalFTE - currentInputs.fte).toFixed(1)} FTE`,
      },
    ],
    achievesGoal: achieves,
    resultingDuration: testResult.durationMonths,
    resultingEffort: testResult.totalMD,
    costImpact,
    riskScore: additionalFTE > 5 ? 6 : 3,
    riskFactors:
      additionalFTE > 5
        ? ["High coordination overhead", "Onboarding time required"]
        : ["Minimal risk if resources available"],
    feasibility: achieves && additionalFTE <= 10 ? "high" : additionalFTE <= 15 ? "medium" : "low",
  };
}

function optimizeByUtilization(
  currentInputs: EstimatorInputs,
  targetMonths: number,
  constraints: GoalSeekParams["constraints"]
): OptimizationSuggestion | null {
  const maxUtilization = Math.min(constraints.maxUtilization || 0.9, 0.95);
  const currentResult = formulaEngine.calculateTotal(currentInputs);

  // Calculate required utilization
  const requiredCapacity = currentResult.totalMD / targetMonths / currentInputs.overlapFactor;
  const requiredUtilization = requiredCapacity / (currentInputs.fte * 22);

  const finalUtilization = Math.min(requiredUtilization, maxUtilization);

  const testInputs = { ...currentInputs, utilization: finalUtilization };
  const testResult = formulaEngine.calculateTotal(testInputs);
  const achieves = testResult.durationMonths <= targetMonths;

  return {
    scenario: "Intensify Schedule",
    description: "Increase team utilization rate",
    adjustments: [
      {
        field: "utilization",
        label: "Utilization Rate",
        from: `${(currentInputs.utilization * 100).toFixed(0)}%`,
        to: `${(finalUtilization * 100).toFixed(0)}%`,
        change: `+${((finalUtilization - currentInputs.utilization) * 100).toFixed(0)}%`,
      },
    ],
    achievesGoal: achieves,
    resultingDuration: testResult.durationMonths,
    resultingEffort: testResult.totalMD,
    costImpact: 0,
    riskScore: finalUtilization > 0.85 ? 7 : 4,
    riskFactors:
      finalUtilization > 0.85
        ? ["Burnout risk", "Reduced quality", "No buffer for issues"]
        : ["Sustainable if temporary"],
    feasibility: finalUtilization <= 0.9 ? "high" : "medium",
  };
}

function optimizeByScopeReduction(
  currentInputs: EstimatorInputs,
  targetMonths: number,
  constraints: GoalSeekParams["constraints"]
): OptimizationSuggestion | null {
  const currentResult = formulaEngine.calculateTotal(currentInputs);
  const maxReduction = constraints.maxScopeReduction || 0.3; // Default max 30% reduction

  // Calculate required scope reduction
  const targetCapacity =
    currentInputs.fte * 22 * currentInputs.utilization * currentInputs.overlapFactor * targetMonths;
  const requiredReduction = Math.max(0, 1 - targetCapacity / currentResult.totalMD);

  const finalReduction = Math.min(requiredReduction, maxReduction);
  const itemsToRemove = Math.floor(currentInputs.selectedL3Items.length * finalReduction);

  // Simulate by reducing L3 items
  const reducedItems = currentInputs.selectedL3Items.slice(0, -itemsToRemove);
  const testInputs = { ...currentInputs, selectedL3Items: reducedItems };

  let testResult;
  try {
    testResult = formulaEngine.calculateTotal(testInputs);
  } catch {
    return null;
  }

  const achieves = testResult.durationMonths <= targetMonths;

  return {
    scenario: "Reduce Scope",
    description: "Defer non-critical features to later phases",
    adjustments: [
      {
        field: "selectedL3Items",
        label: "L3 Scope Items",
        from: `${currentInputs.selectedL3Items.length} items`,
        to: `${reducedItems.length} items`,
        change: `-${itemsToRemove} items (${(finalReduction * 100).toFixed(0)}%)`,
      },
    ],
    achievesGoal: achieves,
    resultingDuration: testResult.durationMonths,
    resultingEffort: testResult.totalMD,
    costImpact: (-(currentResult.totalMD - testResult.totalMD) * 150 * 22) / currentResult.totalMD,
    riskScore: finalReduction > 0.2 ? 8 : 5,
    riskFactors:
      finalReduction > 0.2
        ? ["Significant functionality loss", "Stakeholder pushback", "MVP viability risk"]
        : ["Manageable if prioritized correctly"],
    feasibility: finalReduction <= 0.2 ? "medium" : "low",
  };
}

function optimizeByOverlap(
  currentInputs: EstimatorInputs,
  targetMonths: number,
  constraints: GoalSeekParams["constraints"]
): OptimizationSuggestion | null {
  const minOverlap = constraints.minOverlap || 0.6;
  const currentResult = formulaEngine.calculateTotal(currentInputs);

  // Calculate required overlap
  const requiredOverlap =
    currentResult.totalMD / currentInputs.fte / 22 / currentInputs.utilization / targetMonths;
  const finalOverlap = Math.max(requiredOverlap, minOverlap);

  if (finalOverlap >= currentInputs.overlapFactor) return null; // Can't increase overlap to meet goal

  const testInputs = { ...currentInputs, overlapFactor: finalOverlap };
  const testResult = formulaEngine.calculateTotal(testInputs);
  const achieves = testResult.durationMonths <= targetMonths;

  return {
    scenario: "Aggressive Parallelization",
    description: "Increase phase overlap for faster delivery",
    adjustments: [
      {
        field: "overlapFactor",
        label: "Phase Overlap",
        from: `${(currentInputs.overlapFactor * 100).toFixed(0)}%`,
        to: `${(finalOverlap * 100).toFixed(0)}%`,
        change: `-${((currentInputs.overlapFactor - finalOverlap) * 100).toFixed(0)}%`,
      },
    ],
    achievesGoal: achieves,
    resultingDuration: testResult.durationMonths,
    resultingEffort: testResult.totalMD,
    costImpact: 0,
    riskScore: finalOverlap < 0.7 ? 9 : 6,
    riskFactors:
      finalOverlap < 0.7
        ? ["Very high coordination complexity", "Quality issues", "Rework risk"]
        : ["Requires strong PMO", "Integration challenges"],
    feasibility: finalOverlap >= 0.7 ? "medium" : "low",
  };
}

function optimizeHybrid(
  currentInputs: EstimatorInputs,
  targetMonths: number,
  constraints: GoalSeekParams["constraints"]
): OptimizationSuggestion | null {
  // Balanced approach: modest increases across multiple dimensions
  const testInputs = { ...currentInputs };
  const adjustments: OptimizationSuggestion["adjustments"] = [];
  const riskFactors: string[] = [];
  let riskScore = 2;

  // Increase FTE by 20%
  if (!constraints.maxFTE || currentInputs.fte * 1.2 <= constraints.maxFTE) {
    testInputs.fte = currentInputs.fte * 1.2;
    adjustments.push({
      field: "fte",
      label: "Team Size",
      from: currentInputs.fte.toFixed(1),
      to: testInputs.fte.toFixed(1),
      change: "+20%",
    });
    riskScore += 1;
  }

  // Increase utilization by 5%
  const newUtilization = Math.min(currentInputs.utilization + 0.05, 0.85);
  if (newUtilization > currentInputs.utilization) {
    testInputs.utilization = newUtilization;
    adjustments.push({
      field: "utilization",
      label: "Utilization",
      from: `${(currentInputs.utilization * 100).toFixed(0)}%`,
      to: `${(newUtilization * 100).toFixed(0)}%`,
      change: "+5%",
    });
    riskScore += 1;
  }

  // Reduce overlap by 5%
  const newOverlap = Math.max(currentInputs.overlapFactor - 0.05, 0.7);
  if (newOverlap < currentInputs.overlapFactor) {
    testInputs.overlapFactor = newOverlap;
    adjustments.push({
      field: "overlapFactor",
      label: "Phase Overlap",
      from: `${(currentInputs.overlapFactor * 100).toFixed(0)}%`,
      to: `${(newOverlap * 100).toFixed(0)}%`,
      change: "-5%",
    });
    riskScore += 2;
  }

  if (adjustments.length === 0) return null;

  const testResult = formulaEngine.calculateTotal(testInputs);
  const achieves = testResult.durationMonths <= targetMonths;

  const additionalFTE = testInputs.fte - currentInputs.fte;
  const costImpact = additionalFTE * 22 * 150 * targetMonths;

  return {
    scenario: "Balanced Optimization",
    description: "Modest adjustments across multiple levers",
    adjustments,
    achievesGoal: achieves,
    resultingDuration: testResult.durationMonths,
    resultingEffort: testResult.totalMD,
    costImpact,
    riskScore,
    riskFactors: ["Moderate coordination needed", "Balanced risk profile"],
    feasibility: "high",
  };
}
