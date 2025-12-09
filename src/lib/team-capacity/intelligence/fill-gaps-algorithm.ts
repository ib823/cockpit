/**
 * Fill Gaps Algorithm
 *
 * Automatically fills resource capacity gaps by:
 * 1. Identifying gaps from gap detector
 * 2. Finding suitable resources to fill each gap
 * 3. Distributing effort optimally
 * 4. Generating allocation proposals
 */

import type { Resource, ResourceCategory } from "@/types/gantt-tool";
import type { Gap, GapAnalysisResult } from "./gap-detector";

export interface AllocationProposal {
  resourceId: string;
  resourceName: string;
  weekId: string;
  weekNumber: number;
  currentMandays: number;
  proposedMandays: number;
  change: number;
  gapId: string;
  reason: string;
}

export interface FillGapsResult {
  proposals: AllocationProposal[];
  summary: {
    totalProposals: number;
    gapsFilled: number;
    gapsRemaining: number;
    totalMandaysAdded: number;
    estimatedCostIncrease: number;
  };
  unfillableGaps: Gap[];
}

interface LocalAllocation {
  resourceId: string;
  weekId: string;
  mandays: number;
}

/**
 * Generate proposals to fill gaps
 */
export function generateFillProposals(
  gaps: Gap[],
  resources: Resource[],
  currentAllocations: LocalAllocation[],
  options: {
    maxMandaysPerResource?: number; // Max mandays per resource per week
    preferExistingResources?: boolean; // Prefer resources already allocated
    balanceWorkload?: boolean; // Try to balance across resources
  } = {}
): FillGapsResult {
  const {
    maxMandaysPerResource = 5,
    preferExistingResources = true,
    balanceWorkload = true,
  } = options;

  const proposals: AllocationProposal[] = [];
  const unfillableGaps: Gap[] = [];
  let totalMandaysAdded = 0;
  let gapsFilled = 0;

  // Build current allocation map
  const allocationMap = new Map<string, number>();
  currentAllocations.forEach((a) => {
    const key = `${a.resourceId}-${a.weekId}`;
    allocationMap.set(key, a.mandays);
  });

  // Track proposed allocations to avoid over-allocation
  const proposedAllocations = new Map<string, number>();

  // Sort gaps by severity (critical first) and then by week
  const sortedGaps = [...gaps].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return a.weekNumber - b.weekNumber;
  });

  // Process each gap
  for (const gap of sortedGaps) {
    let remainingGap = gap.gapMandays;
    const gapProposals: AllocationProposal[] = [];

    // Find matching resources for this gap's category
    const matchingResources = findMatchingResources(resources, gap.category);

    if (matchingResources.length === 0) {
      unfillableGaps.push(gap);
      continue;
    }

    // Score and sort resources
    const scoredResources = matchingResources.map((r) => {
      const currentWeekKey = `${r.id}-${gap.weekId}`;
      const currentAllocation = allocationMap.get(currentWeekKey) || 0;
      const proposedAllocation = proposedAllocations.get(currentWeekKey) || 0;
      const totalAllocation = currentAllocation + proposedAllocation;
      const availableCapacity = Math.max(0, maxMandaysPerResource - totalAllocation);

      // Calculate score (higher is better)
      let score = availableCapacity * 10; // Base score from capacity

      if (preferExistingResources && currentAllocation > 0) {
        score += 20; // Prefer resources already working
      }

      if (balanceWorkload) {
        // Penalize resources with high total allocation
        const totalWeeklyAllocation = calculateTotalAllocation(
          r.id,
          currentAllocations,
          proposedAllocations
        );
        score -= totalWeeklyAllocation * 0.5;
      }

      return {
        resource: r,
        currentAllocation,
        proposedAllocation,
        availableCapacity,
        score,
      };
    });

    // Sort by score descending
    scoredResources.sort((a, b) => b.score - a.score);

    // Allocate to resources until gap is filled
    for (const scored of scoredResources) {
      if (remainingGap <= 0) break;
      if (scored.availableCapacity <= 0) continue;

      const mandaysToAdd = Math.min(remainingGap, scored.availableCapacity);
      const newTotal = scored.currentAllocation + scored.proposedAllocation + mandaysToAdd;

      gapProposals.push({
        resourceId: scored.resource.id,
        resourceName: scored.resource.name || `Resource ${scored.resource.id}`,
        weekId: gap.weekId,
        weekNumber: gap.weekNumber,
        currentMandays: scored.currentAllocation,
        proposedMandays: newTotal,
        change: mandaysToAdd,
        gapId: gap.id,
        reason: `Fill ${gap.category} gap in ${gap.phaseName} (Week ${gap.weekNumber})`,
      });

      // Update proposed allocations
      const key = `${scored.resource.id}-${gap.weekId}`;
      proposedAllocations.set(
        key,
        (proposedAllocations.get(key) || 0) + mandaysToAdd
      );

      remainingGap -= mandaysToAdd;
      totalMandaysAdded += mandaysToAdd;
    }

    if (gapProposals.length > 0) {
      proposals.push(...gapProposals);
      if (remainingGap <= 0.5) {
        gapsFilled++;
      }
    }

    if (remainingGap > 0.5) {
      unfillableGaps.push({
        ...gap,
        gapMandays: remainingGap,
        description: `Remaining ${remainingGap.toFixed(1)} mandays - insufficient capacity`,
      });
    }
  }

  // Estimate cost increase (rough estimate using average rate)
  const avgDailyRate = 2000; // MYR
  const estimatedCostIncrease = totalMandaysAdded * avgDailyRate;

  return {
    proposals,
    summary: {
      totalProposals: proposals.length,
      gapsFilled,
      gapsRemaining: unfillableGaps.length,
      totalMandaysAdded: Math.round(totalMandaysAdded * 10) / 10,
      estimatedCostIncrease,
    },
    unfillableGaps,
  };
}

/**
 * Find resources matching a category
 */
function findMatchingResources(
  resources: Resource[],
  category: ResourceCategory
): Resource[] {
  // Direct category match
  const directMatches = resources.filter((r) => r.category === category);
  if (directMatches.length > 0) return directMatches;

  // Fallback to related categories
  const categoryFallbacks: Record<ResourceCategory, ResourceCategory[]> = {
    leadership: ["pm"],
    functional: ["technical", "change"],
    technical: ["functional", "basis"],
    basis: ["technical", "security"],
    security: ["basis", "technical"],
    pm: ["leadership", "functional"],
    change: ["functional", "pm"],
    qa: ["functional", "technical"],
    client: [], // Client resources are placeholders - no fallback
    other: ["functional"],
  };

  const fallbacks = categoryFallbacks[category] || [];
  for (const fallbackCategory of fallbacks) {
    const matches = resources.filter((r) => r.category === fallbackCategory);
    if (matches.length > 0) return matches;
  }

  // Return all resources as last resort
  return resources;
}

/**
 * Calculate total allocation for a resource across all weeks
 */
function calculateTotalAllocation(
  resourceId: string,
  currentAllocations: LocalAllocation[],
  proposedAllocations: Map<string, number>
): number {
  let total = 0;

  // Current allocations
  currentAllocations
    .filter((a) => a.resourceId === resourceId)
    .forEach((a) => {
      total += a.mandays;
    });

  // Proposed allocations
  proposedAllocations.forEach((mandays, key) => {
    if (key.startsWith(`${resourceId}-`)) {
      total += mandays;
    }
  });

  return total;
}

/**
 * Apply proposals to allocations (creates new allocation array)
 */
export function applyProposals(
  currentAllocations: LocalAllocation[],
  proposals: AllocationProposal[]
): LocalAllocation[] {
  // Create a copy of current allocations
  const newAllocations = [...currentAllocations];
  const allocationMap = new Map<string, number>();

  // Build map from current
  newAllocations.forEach((a, idx) => {
    const key = `${a.resourceId}-${a.weekId}`;
    allocationMap.set(key, idx);
  });

  // Apply proposals
  for (const proposal of proposals) {
    const key = `${proposal.resourceId}-${proposal.weekId}`;
    const existingIdx = allocationMap.get(key);

    if (existingIdx !== undefined) {
      // Update existing allocation
      newAllocations[existingIdx] = {
        ...newAllocations[existingIdx],
        mandays: proposal.proposedMandays,
      };
    } else {
      // Add new allocation
      newAllocations.push({
        resourceId: proposal.resourceId,
        weekId: proposal.weekId,
        mandays: proposal.proposedMandays,
      });
    }
  }

  return newAllocations;
}

/**
 * Quick fill for a single gap
 */
export function quickFillGap(
  gap: Gap,
  resources: Resource[],
  currentAllocations: LocalAllocation[]
): AllocationProposal | null {
  const result = generateFillProposals([gap], resources, currentAllocations, {
    maxMandaysPerResource: 5,
    preferExistingResources: true,
  });

  return result.proposals[0] || null;
}
