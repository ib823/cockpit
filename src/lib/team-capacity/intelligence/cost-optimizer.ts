/**
 * Cost Optimizer
 *
 * Analyzes resource allocations to find cost-saving opportunities:
 * 1. Identify over-allocated expensive resources
 * 2. Find equivalent lower-cost alternatives
 * 3. Suggest region-based savings
 * 4. Identify designation substitutions
 */

import type { Resource, ResourceCategory } from "@/types/gantt-tool";

// Daily rates by designation and region (MYR)
const DAILY_RATES: Record<string, Record<string, number>> = {
  ABMY: {
    principal: 6880,
    director: 5504,
    senior_manager: 4128,
    manager: 2752,
    senior_consultant: 2064,
    consultant: 1548,
    analyst: 1032,
    subcontractor: 1376,
  },
  ABSG: {
    principal: 7379,
    director: 5903,
    senior_manager: 4427,
    manager: 2952,
    senior_consultant: 2214,
    consultant: 1703,
    analyst: 1135,
    subcontractor: 1476,
  },
  ABVN: {
    principal: 2580,
    director: 2064,
    senior_manager: 1548,
    manager: 1032,
    senior_consultant: 774,
    consultant: 585,
    analyst: 378,
    subcontractor: 516,
  },
  ABTH: {
    principal: 3096,
    director: 2477,
    senior_manager: 1858,
    manager: 1238,
    senior_consultant: 929,
    consultant: 688,
    analyst: 464,
    subcontractor: 619,
  },
};

// Designation hierarchy (for substitution suggestions)
const DESIGNATION_HIERARCHY = [
  "principal",
  "director",
  "senior_manager",
  "manager",
  "senior_consultant",
  "consultant",
  "analyst",
];

// Task complexity that can be handled by lower designations
const TASK_COMPLEXITY_MAP: Record<string, number> = {
  // Index in DESIGNATION_HIERARCHY that can handle the task
  configuration: 4, // senior_consultant and above
  testing: 5, // consultant and above
  documentation: 6, // analyst and above
  support: 5, // consultant and above
  training: 5, // consultant and above
  development: 4, // senior_consultant and above
  architecture: 2, // senior_manager and above
  leadership: 1, // director and above
};

export interface OptimizationSuggestion {
  id: string;
  type: "designation_swap" | "region_swap" | "utilization" | "redundancy";
  resourceId: string;
  resourceName: string;
  currentCost: number;
  proposedCost: number;
  savings: number;
  savingsPercent: number;
  suggestion: string;
  details: string;
  impact: "low" | "medium" | "high";
  risk: "low" | "medium" | "high";
  action: {
    type: string;
    params: Record<string, unknown>;
  };
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  summary: {
    totalSuggestions: number;
    potentialSavings: number;
    potentialSavingsPercent: number;
    currentTotalCost: number;
    optimizedTotalCost: number;
    byType: Record<string, number>;
  };
}

interface LocalAllocation {
  resourceId: string;
  weekId: string;
  mandays: number;
}

/**
 * Analyze allocations and generate optimization suggestions
 */
export function analyzeOptimizations(
  resources: Resource[],
  allocations: LocalAllocation[]
): OptimizationResult {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 1;

  // Calculate current costs per resource
  const resourceCosts = new Map<string, { mandays: number; cost: number }>();

  for (const alloc of allocations) {
    const resource = resources.find((r) => r.id === alloc.resourceId);
    if (!resource) continue;

    const current = resourceCosts.get(resource.id) || { mandays: 0, cost: 0 };
    const dailyRate = getDailyRate(resource.designation, resource.regionCode);

    resourceCosts.set(resource.id, {
      mandays: current.mandays + alloc.mandays,
      cost: current.cost + alloc.mandays * dailyRate,
    });
  }

  // 1. Check for designation downgrade opportunities
  for (const resource of resources) {
    const usage = resourceCosts.get(resource.id);
    if (!usage || usage.mandays === 0) continue;

    const downgradeOption = findDesignationDowngrade(resource);
    if (downgradeOption) {
      const currentRate = getDailyRate(resource.designation, resource.regionCode);
      const newRate = getDailyRate(downgradeOption.designation, resource.regionCode);
      const savings = usage.mandays * (currentRate - newRate);

      if (savings > 1000) { // Only suggest if savings are significant
        suggestions.push({
          id: `opt-${suggestionId++}`,
          type: "designation_swap",
          resourceId: resource.id,
          resourceName: resource.name || `Resource ${resource.id}`,
          currentCost: usage.cost,
          proposedCost: usage.cost - savings,
          savings,
          savingsPercent: Math.round((savings / usage.cost) * 100),
          suggestion: `Consider ${downgradeOption.designation.replace("_", " ")} instead of ${resource.designation.replace("_", " ")}`,
          details: downgradeOption.reason,
          impact: savings > 10000 ? "high" : savings > 5000 ? "medium" : "low",
          risk: "medium",
          action: {
            type: "change_designation",
            params: {
              resourceId: resource.id,
              newDesignation: downgradeOption.designation,
            },
          },
        });
      }
    }
  }

  // 2. Check for region optimization
  for (const resource of resources) {
    const usage = resourceCosts.get(resource.id);
    if (!usage || usage.mandays === 0) continue;

    const regionOption = findCheaperRegion(resource);
    if (regionOption) {
      const currentRate = getDailyRate(resource.designation, resource.regionCode);
      const newRate = getDailyRate(resource.designation, regionOption.region);
      const savings = usage.mandays * (currentRate - newRate);

      if (savings > 2000) { // Higher threshold for region changes
        suggestions.push({
          id: `opt-${suggestionId++}`,
          type: "region_swap",
          resourceId: resource.id,
          resourceName: resource.name || `Resource ${resource.id}`,
          currentCost: usage.cost,
          proposedCost: usage.cost - savings,
          savings,
          savingsPercent: Math.round((savings / usage.cost) * 100),
          suggestion: `Consider ${regionOption.region} resource instead of ${resource.regionCode || "ABMY"}`,
          details: `${regionOption.region} rates are ${regionOption.savingsPercent}% lower for equivalent work`,
          impact: savings > 20000 ? "high" : savings > 10000 ? "medium" : "low",
          risk: "medium", // Region changes involve timezone/communication considerations
          action: {
            type: "change_region",
            params: {
              resourceId: resource.id,
              newRegion: regionOption.region,
            },
          },
        });
      }
    }
  }

  // 3. Check for low utilization
  const weeksCount = new Set(allocations.map((a) => a.weekId)).size;
  for (const resource of resources) {
    const usage = resourceCosts.get(resource.id);
    if (!usage) continue;

    const maxPossible = weeksCount * 5;
    const utilization = (usage.mandays / maxPossible) * 100;

    if (utilization < 30 && usage.mandays > 0) {
      // Low utilization - suggest consolidation
      const currentRate = getDailyRate(resource.designation, resource.regionCode);
      const potentialSavings = usage.cost * 0.3; // Estimate 30% savings through consolidation

      suggestions.push({
        id: `opt-${suggestionId++}`,
        type: "utilization",
        resourceId: resource.id,
        resourceName: resource.name || `Resource ${resource.id}`,
        currentCost: usage.cost,
        proposedCost: usage.cost - potentialSavings,
        savings: potentialSavings,
        savingsPercent: 30,
        suggestion: `Consider consolidating work with another ${resource.category} resource`,
        details: `Current utilization is only ${utilization.toFixed(0)}%. Work could be absorbed by another resource.`,
        impact: potentialSavings > 5000 ? "medium" : "low",
        risk: "low",
        action: {
          type: "consolidate",
          params: {
            resourceId: resource.id,
            category: resource.category,
          },
        },
      });
    }
  }

  // 4. Check for potential redundancy
  const categoryResources = new Map<ResourceCategory, Resource[]>();
  for (const resource of resources) {
    const list = categoryResources.get(resource.category) || [];
    list.push(resource);
    categoryResources.set(resource.category, list);
  }

  for (const [category, categoryList] of categoryResources.entries()) {
    if (categoryList.length > 3) {
      // Many resources in same category - potential for consolidation
      const categoryMandays = categoryList.reduce((sum, r) => {
        const usage = resourceCosts.get(r.id);
        return sum + (usage?.mandays || 0);
      }, 0);

      const avgUtilization = (categoryMandays / (categoryList.length * weeksCount * 5)) * 100;

      if (avgUtilization < 50) {
        const potentialReduction = Math.floor(categoryList.length * 0.25);
        if (potentialReduction > 0) {
          const avgCostPerResource = categoryList.reduce((sum, r) => {
            const usage = resourceCosts.get(r.id);
            return sum + (usage?.cost || 0);
          }, 0) / categoryList.length;

          suggestions.push({
            id: `opt-${suggestionId++}`,
            type: "redundancy",
            resourceId: category,
            resourceName: `${category} team`,
            currentCost: avgCostPerResource * categoryList.length,
            proposedCost: avgCostPerResource * (categoryList.length - potentialReduction),
            savings: avgCostPerResource * potentialReduction,
            savingsPercent: Math.round((potentialReduction / categoryList.length) * 100),
            suggestion: `Consider reducing ${category} team by ${potentialReduction} resource(s)`,
            details: `Average utilization is ${avgUtilization.toFixed(0)}%. Work could be distributed among fewer resources.`,
            impact: "high",
            risk: "medium",
            action: {
              type: "reduce_team",
              params: {
                category,
                reduction: potentialReduction,
              },
            },
          });
        }
      }
    }
  }

  // Sort by savings (highest first)
  suggestions.sort((a, b) => b.savings - a.savings);

  // Calculate summary
  const currentTotalCost = Array.from(resourceCosts.values()).reduce(
    (sum, v) => sum + v.cost,
    0
  );
  const potentialSavings = suggestions.reduce((sum, s) => sum + s.savings, 0);

  const byType: Record<string, number> = {};
  for (const s of suggestions) {
    byType[s.type] = (byType[s.type] || 0) + s.savings;
  }

  return {
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      potentialSavings,
      potentialSavingsPercent: currentTotalCost > 0
        ? Math.round((potentialSavings / currentTotalCost) * 100)
        : 0,
      currentTotalCost,
      optimizedTotalCost: currentTotalCost - potentialSavings,
      byType,
    },
  };
}

/**
 * Get daily rate for designation and region
 */
function getDailyRate(designation: string, regionCode?: string | null): number {
  const region = regionCode || "ABMY";
  const regionRates = DAILY_RATES[region] || DAILY_RATES.ABMY;
  return regionRates[designation] || regionRates.consultant;
}

/**
 * Find potential designation downgrade
 */
function findDesignationDowngrade(
  resource: Resource
): { designation: string; reason: string } | null {
  const currentIdx = DESIGNATION_HIERARCHY.indexOf(resource.designation);
  if (currentIdx === -1 || currentIdx >= DESIGNATION_HIERARCHY.length - 1) {
    return null;
  }

  // Check if work type allows downgrade
  // For simplicity, suggest one level down for most roles
  const nextIdx = currentIdx + 1;
  const nextDesignation = DESIGNATION_HIERARCHY[nextIdx];

  // Don't downgrade architects or leads
  if (
    resource.name?.toLowerCase().includes("architect") ||
    resource.name?.toLowerCase().includes("lead") ||
    resource.designation === "principal" ||
    resource.designation === "director"
  ) {
    return null;
  }

  return {
    designation: nextDesignation,
    reason: `A ${nextDesignation.replace("_", " ")} can typically handle similar work at lower cost`,
  };
}

/**
 * Find cheaper region alternative
 */
function findCheaperRegion(
  resource: Resource
): { region: string; savingsPercent: number } | null {
  const currentRegion = resource.regionCode || "ABMY";
  const currentRate = getDailyRate(resource.designation, currentRegion);

  // Check Vietnam and Thailand as alternatives
  const alternatives = ["ABVN", "ABTH"];
  let bestAlternative: { region: string; savingsPercent: number } | null = null;

  for (const altRegion of alternatives) {
    if (altRegion === currentRegion) continue;

    const altRate = getDailyRate(resource.designation, altRegion);
    const savingsPercent = Math.round(((currentRate - altRate) / currentRate) * 100);

    if (savingsPercent > 20) {
      if (!bestAlternative || savingsPercent > bestAlternative.savingsPercent) {
        bestAlternative = { region: altRegion, savingsPercent };
      }
    }
  }

  return bestAlternative;
}

/**
 * Quick cost analysis - returns total cost and potential savings
 */
export function quickCostAnalysis(
  resources: Resource[],
  allocations: LocalAllocation[]
): {
  totalCost: number;
  potentialSavings: number;
  topOpportunity: string | null;
} {
  const result = analyzeOptimizations(resources, allocations);

  return {
    totalCost: result.summary.currentTotalCost,
    potentialSavings: result.summary.potentialSavings,
    topOpportunity: result.suggestions[0]?.suggestion || null,
  };
}
