/**
 * Cost Calculation Engine
 *
 * Implements 7-layer costing model from YTL Cement RP.xlsx:
 * 1. Rate Lookup (region + designation → standard rate/hour)
 * 2. Daily Rate Conversion (hourly × 8)
 * 3. Gross Standard Rate (GSR) (total mandays × standard rate/day)
 * 4. Realization Rate (RR) Application (discount factor)
 * 5. Net Standard Rate (NSR) (actual billable revenue)
 * 6. Internal Cost (35% of standard rate - CONFIDENTIAL)
 * 7. Margin Calculation (NSR - Internal Cost - CONFIDENTIAL)
 *
 * Security: Three-tier visibility (PUBLIC, PRESALES_AND_FINANCE, FINANCE_ONLY)
 */

import { CostVisibilityLevel } from "@prisma/client";
import type {
  CostCalculationInput,
  CostCalculationResult,
  SubcontractorCostResult,
  ProjectCostingSummary,
} from "./types";
import { prisma } from "@/lib/db";

// ============================================================================
// CONSTANTS
// ============================================================================

const HOURS_PER_DAY = 8;
const DEFAULT_INTERNAL_COST_PERCENT = 0.35; // 35% of standard rate
const DEFAULT_REALIZATION_RATE = 0.43; // 43% discount factor

// ============================================================================
// RATE LOOKUP
// ============================================================================

/**
 * Lookup standard rate from rate card
 */
export async function lookupStandardRate(
  region: string,
  designation: string,
  effectiveDate: Date = new Date()
): Promise<{
  standardRatePerHour: number;
  currency: string;
  currencyConversionToMYR: number;
} | null> {
  const rateCard = await prisma.resourceRateLookup.findFirst({
    where: {
      regionCode: region,
      designation: designation,
      effectiveFrom: {
        lte: effectiveDate,
      },
      OR: [
        { effectiveTo: null }, // Current rate
        { effectiveTo: { gte: effectiveDate } }, // Still valid
      ],
    },
    orderBy: {
      effectiveFrom: "desc", // Get most recent rate
    },
  });

  if (!rateCard) {
    return null;
  }

  return {
    standardRatePerHour: rateCard.hourlyRate.toNumber(),
    currency: rateCard.localCurrency,
    currencyConversionToMYR: rateCard.forexRate.toNumber(),
  };
}

// ============================================================================
// INTERNAL RESOURCE COSTING (7-Layer Model)
// ============================================================================

/**
 * Calculate cost for internal resources (ABeam consultants)
 * Implements full 7-layer calculation model
 */
export async function calculateInternalResourceCost(
  input: CostCalculationInput
): Promise<CostCalculationResult> {
  // STEP 1: Rate Lookup
  const rateInfo = await lookupStandardRate(input.region, input.designation);

  if (!rateInfo) {
    throw new Error(
      `No rate card found for ${input.region} ${input.designation}`
    );
  }

  const { standardRatePerHour, currency, currencyConversionToMYR } = rateInfo;

  // STEP 2: Daily Rate Conversion
  const standardRatePerDay = standardRatePerHour * HOURS_PER_DAY;

  // STEP 3: Gross Standard Rate (GSR)
  const grossStandardRate = input.totalMandays * standardRatePerDay;

  // STEP 4: Realization Rate (RR) Application
  const realizationRate =
    input.projectCostingConfig.realizationRatePercent.toNumber() ||
    DEFAULT_REALIZATION_RATE;
  const commercialRatePerDay = standardRatePerDay * realizationRate;

  // STEP 5: Net Standard Rate (NSR)
  const netStandardRate = commercialRatePerDay * input.totalMandays;

  // STEP 6: Internal Cost (CONFIDENTIAL - Finance Only)
  const internalCostPercent =
    input.projectCostingConfig.internalCostPercent.toNumber() ||
    DEFAULT_INTERNAL_COST_PERCENT;
  const internalCostPerDay = standardRatePerDay * internalCostPercent;
  const totalInternalCost = internalCostPerDay * input.totalMandays;

  // STEP 7: Margin Calculation (CONFIDENTIAL - Finance Only)
  const margin = netStandardRate - totalInternalCost;
  const marginPercent = (margin / netStandardRate) * 100;

  // STEP 8: OPE (Out of Pocket Expenses) - Optional
  let onsiteDays: number | undefined;
  let opeAmount: number | undefined;

  if (input.onsiteDaysPercent !== undefined) {
    onsiteDays = input.totalMandays * (input.onsiteDaysPercent / 100);
    opeAmount =
      onsiteDays *
      input.projectCostingConfig.opeTotalDefaultPerDay.toNumber();
  }

  return {
    standardRatePerHour,
    currency,
    currencyConversionToMYR,
    standardRatePerDay,
    grossStandardRate,
    realizationRate,
    commercialRatePerDay,
    netStandardRate,
    internalCostPercent,
    internalCostPerDay,
    totalInternalCost,
    margin,
    marginPercent,
    onsiteDays,
    opeAmount,
    visibilityLevel: input.projectCostingConfig.costVisibilityLevel,
  };
}

// ============================================================================
// SUBCONTRACTOR COSTING
// ============================================================================

/**
 * Calculate cost for subcontractors
 * Simplified model: commercial rate vs cost rate (can have negative margins)
 */
export function calculateSubcontractorCost(
  totalMandays: number,
  subcontractorRate: {
    dailyCommercialRate: number;
    dailyCostRate: number;
  }
): SubcontractorCostResult {
  const dailyCommercialRate = subcontractorRate.dailyCommercialRate;
  const dailyCostRate = subcontractorRate.dailyCostRate;

  const totalCommercial = dailyCommercialRate * totalMandays;
  const totalCost = dailyCostRate * totalMandays;
  const margin = totalCommercial - totalCost;
  const marginPercent = (margin / totalCommercial) * 100;

  return {
    dailyCommercialRate,
    dailyCostRate,
    totalCommercial,
    totalCost,
    margin,
    marginPercent,
    isNegativeMargin: margin < 0,
  };
}

// ============================================================================
// PROJECT-LEVEL COSTING SUMMARY
// ============================================================================

/**
 * Calculate comprehensive project costing summary
 * Aggregates all resources (internal + subcontractors) with security filtering
 */
export async function calculateProjectCostingSummary(
  projectId: string,
  versionNumber?: number,
  visibilityLevel: CostVisibilityLevel = "FINANCE_ONLY"
): Promise<ProjectCostingSummary> {
  // Get project version (latest if not specified)
  const project = await prisma.ganttProject.findUnique({
    where: { id: projectId },
    include: {
      costingConfig: true,
      weeklyAllocations: {
        include: {
          resource: {
            include: {
              subcontractorRates: true,
            },
          },
        },
      },
      opeExpenses: true,
    },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  if (!project.costingConfig) {
    throw new Error(`Costing config not found for project: ${projectId}`);
  }

  // Aggregate allocations by resource
  const resourceAllocations = aggregateAllocationsByResource(
    project.weeklyAllocations
  );

  // Calculate costs for each resource
  const resourceCosts: CostCalculationResult[] = [];
  let totalGSR = 0;
  let totalNSR = 0;
  let totalInternalCost = 0;
  let totalSubcontractorCost = 0;

  for (const [resourceId, allocation] of Object.entries(resourceAllocations)) {
    const resource = project.weeklyAllocations.find(
      (a) => a.resourceId === resourceId
    )?.resource;

    if (!resource) continue;

    if (resource.isSubcontractor) {
      // Subcontractor costing
      const subconRate = resource.subcontractorRates[0];
      if (subconRate) {
        const result = calculateSubcontractorCost(allocation.totalMandays, {
          dailyCommercialRate: subconRate.dailyCommercialRate.toNumber(),
          dailyCostRate: subconRate.dailyCostRate.toNumber(),
        });
        totalNSR += result.totalCommercial;
        totalSubcontractorCost += result.totalCost;
      }
    } else {
      // Internal resource costing
      if (resource.regionCode && resource.designation) {
        const costResult = await calculateInternalResourceCost({
          resourceId: resource.id,
          region: resource.regionCode,
          designation: resource.designation,
          totalMandays: allocation.totalMandays,
          isSubcontractor: false,
          projectCostingConfig: project.costingConfig,
        });

        resourceCosts.push(costResult);
        totalGSR += costResult.grossStandardRate;
        totalNSR += costResult.netStandardRate;
        totalInternalCost += costResult.totalInternalCost;
      }
    }
  }

  // Calculate total OPE
  const totalOPE = project.opeExpenses.reduce(
    (sum, ope) => sum + ope.totalOPECost.toNumber(),
    0
  );

  // Calculate gross margin (CONFIDENTIAL - Finance only)
  const grossMargin =
    totalNSR - (totalInternalCost + totalSubcontractorCost + totalOPE);
  const marginPercent = (grossMargin / totalNSR) * 100;

  // Breakdown by region
  const byRegion = calculateCostBreakdownByRegion(
    project.weeklyAllocations,
    resourceCosts,
    visibilityLevel
  );

  // Breakdown by designation
  const byDesignation = calculateCostBreakdownByDesignation(
    project.weeklyAllocations,
    resourceCosts
  );

  return {
    projectId: project.id,
    versionNumber: versionNumber || project.version,
    totalGSR,
    totalNSR,
    totalInternalCost:
      visibilityLevel === "FINANCE_ONLY" ? totalInternalCost : 0,
    totalSubcontractorCost:
      visibilityLevel === "FINANCE_ONLY" ? totalSubcontractorCost : 0,
    totalOPE: visibilityLevel === "FINANCE_ONLY" ? totalOPE : 0,
    grossMargin: visibilityLevel === "FINANCE_ONLY" ? grossMargin : 0,
    marginPercent: visibilityLevel === "FINANCE_ONLY" ? marginPercent : 0,
    byRegion,
    byDesignation,
    visibilityLevel,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Aggregate weekly allocations by resource
 */
function aggregateAllocationsByResource(
  allocations: Array<{
    resourceId: string;
    workingDays: any;
    mandays: any | null;
  }>
): Record<string, { totalMandays: number }> {
  const aggregated: Record<string, { totalMandays: number }> = {};

  for (const allocation of allocations) {
    if (!aggregated[allocation.resourceId]) {
      aggregated[allocation.resourceId] = { totalMandays: 0 };
    }

    // Use mandays if available, otherwise workingDays
    const mandays = allocation.mandays
      ? allocation.mandays.toNumber()
      : allocation.workingDays.toNumber();

    aggregated[allocation.resourceId].totalMandays += mandays;
  }

  return aggregated;
}

/**
 * Calculate cost breakdown by region (with security filtering)
 */
function calculateCostBreakdownByRegion(
  allocations: any[],
  costs: CostCalculationResult[],
  visibilityLevel: CostVisibilityLevel
): any[] {
  // Implementation would group by region
  // Simplified for now
  return [];
}

/**
 * Calculate cost breakdown by designation
 */
function calculateCostBreakdownByDesignation(
  allocations: any[],
  costs: CostCalculationResult[]
): any[] {
  // Implementation would group by designation
  // Simplified for now
  return [];
}

// ============================================================================
// SECURITY & VISIBILITY
// ============================================================================

/**
 * Filter cost data based on visibility level
 */
export function applyCostVisibilityFilter(
  costData: CostCalculationResult,
  userVisibilityLevel: CostVisibilityLevel
): Partial<CostCalculationResult> {
  // PUBLIC: Only allocation data, no costs
  if (userVisibilityLevel === "PUBLIC") {
    return {
      standardRatePerHour: 0,
      currency: costData.currency,
      currencyConversionToMYR: 1,
      standardRatePerDay: 0,
      grossStandardRate: 0,
      realizationRate: 0,
      commercialRatePerDay: 0,
      netStandardRate: 0,
      internalCostPercent: 0,
      internalCostPerDay: 0,
      totalInternalCost: 0,
      margin: 0,
      marginPercent: 0,
      visibilityLevel: userVisibilityLevel,
    };
  }

  // PRESALES_AND_FINANCE: Rates and NSR, but not internal costs/margins
  if (userVisibilityLevel === "PRESALES_AND_FINANCE") {
    return {
      ...costData,
      internalCostPercent: 0,
      internalCostPerDay: 0,
      totalInternalCost: 0,
      margin: 0,
      marginPercent: 0,
      visibilityLevel: userVisibilityLevel,
    };
  }

  // FINANCE_ONLY: Full access
  return costData;
}

/**
 * Check if user has permission to view cost data
 */
export function canViewCostData(
  userRole: string,
  requiredLevel: CostVisibilityLevel
): boolean {
  const roleLevels: Record<string, number> = {
    PUBLIC: 0,
    PRESALES_AND_FINANCE: 1,
    FINANCE_ONLY: 2,
  };

  const userLevel = roleLevels[userRole] || 0;
  const requiredLevelNum = roleLevels[requiredLevel] || 2;

  return userLevel >= requiredLevelNum;
}
