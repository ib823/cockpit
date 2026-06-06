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
  CostBreakdownByRegion,
  CostBreakdownByDesignation,
} from "./types";
import { prisma } from "@/lib/db";
import { RATE_CARD_DATA } from "./rate-card-data";

// ============================================================================
// CONSTANTS
// ============================================================================

const HOURS_PER_DAY = 8;
const DEFAULT_INTERNAL_COST_PERCENT = 0.35; // 35% of standard rate
const DEFAULT_REALIZATION_RATE = 0.43; // 43% discount factor

/** Safe percentage: avoids NaN/Infinity when the denominator is zero. */
function pct(numerator: number, denominator: number): number {
  return denominator !== 0 ? (numerator / denominator) * 100 : 0;
}

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
    // Fall back to the canonical baseline so costing still works against an
    // unseeded / partially-seeded DB (and tolerates designation gaps).
    const fallback = RATE_CARD_DATA[region]?.[designation];
    if (!fallback) {
      return null;
    }
    return {
      standardRatePerHour: fallback.standardRatePerHour,
      currency: fallback.currency,
      currencyConversionToMYR: fallback.forexRate,
    };
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
 * Pure 7-layer cost computation for a single internal resource.
 *
 * Extracted from the DB lookup so the math is unit-testable without a database.
 * All monetary outputs are in the base currency (MYR): the local standard rate
 * is converted via `forexToMYR` BEFORE any downstream calculation.
 *
 * NOTE: the rate is treated as hourly and multiplied by HOURS_PER_DAY (8) to get
 * a day rate, matching the seeded rate cards. Confirm this hourly basis with Finance.
 */
export function computeInternalCost(params: {
  standardRatePerHourLocal: number;
  currency: string;
  forexToMYR: number;
  totalMandays: number;
  realizationRate: number;
  internalCostPercent: number;
  opePerDay?: number;
  onsiteDaysPercent?: number;
  visibilityLevel: CostVisibilityLevel;
}): CostCalculationResult {
  // STEP 1 + 2: Convert local rate to MYR, then to a daily rate
  const standardRatePerHour = params.standardRatePerHourLocal * params.forexToMYR;
  const standardRatePerDay = standardRatePerHour * HOURS_PER_DAY;

  // STEP 3: Gross Standard Rate (GSR)
  const grossStandardRate = params.totalMandays * standardRatePerDay;

  // STEP 4: Realization Rate (RR) Application
  const realizationRate = params.realizationRate || DEFAULT_REALIZATION_RATE;
  const commercialRatePerDay = standardRatePerDay * realizationRate;

  // STEP 5: Net Standard Rate (NSR)
  const netStandardRate = commercialRatePerDay * params.totalMandays;

  // STEP 6: Internal Cost (CONFIDENTIAL - Finance Only)
  const internalCostPercent =
    params.internalCostPercent || DEFAULT_INTERNAL_COST_PERCENT;
  const internalCostPerDay = standardRatePerDay * internalCostPercent;
  const totalInternalCost = internalCostPerDay * params.totalMandays;

  // STEP 7: Margin Calculation (CONFIDENTIAL - Finance Only), guarded vs zero NSR
  const margin = netStandardRate - totalInternalCost;
  const marginPercent = pct(margin, netStandardRate);

  // STEP 8: OPE (Out of Pocket Expenses) - Optional
  let onsiteDays: number | undefined;
  let opeAmount: number | undefined;
  if (params.onsiteDaysPercent !== undefined && params.opePerDay !== undefined) {
    onsiteDays = params.totalMandays * (params.onsiteDaysPercent / 100);
    opeAmount = onsiteDays * params.opePerDay;
  }

  return {
    standardRatePerHour, // in MYR (base currency)
    currency: params.currency, // original local currency, for reference
    currencyConversionToMYR: params.forexToMYR,
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
    visibilityLevel: params.visibilityLevel,
  };
}

/**
 * Calculate cost for internal resources (PartnerCo consultants).
 * Looks up the rate card, then runs the pure 7-layer model (forex-converted to MYR).
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

  return computeInternalCost({
    standardRatePerHourLocal: rateInfo.standardRatePerHour,
    currency: rateInfo.currency,
    forexToMYR: rateInfo.currencyConversionToMYR,
    totalMandays: input.totalMandays,
    realizationRate:
      input.projectCostingConfig.realizationRatePercent?.toNumber() ?? DEFAULT_REALIZATION_RATE,
    internalCostPercent:
      input.projectCostingConfig.internalCostPercent?.toNumber() ?? DEFAULT_INTERNAL_COST_PERCENT,
    opePerDay: input.projectCostingConfig.opeTotalDefaultPerDay?.toNumber(),
    onsiteDaysPercent: input.onsiteDaysPercent,
    visibilityLevel: input.projectCostingConfig.costVisibilityLevel,
  });
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
  const marginPercent = pct(margin, totalCommercial);

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

  // Auto-create default costing config if not exists
  let costingConfig = project.costingConfig;
  if (!costingConfig) {
    costingConfig = await prisma.projectCostingConfig.create({
      data: {
        projectId,
        // Default values are defined in the Prisma schema
      },
    });
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
  const unratedResources: string[] = [];

  // Breakdown accumulators (built inline — region/designation are available here)
  const regionMap = new Map<
    string,
    { region: string; totalMandays: number; totalNSR: number; totalCost: number; margin: number }
  >();
  const designationMap = new Map<
    string,
    { designation: string; resourceIds: Set<string>; totalMandays: number; totalNSR: number }
  >();

  const addRegion = (region: string, mandays: number, nsr: number, cost: number) => {
    const r = regionMap.get(region) ?? { region, totalMandays: 0, totalNSR: 0, totalCost: 0, margin: 0 };
    r.totalMandays += mandays;
    r.totalNSR += nsr;
    r.totalCost += cost;
    r.margin = r.totalNSR - r.totalCost;
    regionMap.set(region, r);
  };
  const addDesignation = (designation: string, resourceId: string, mandays: number, nsr: number) => {
    const d =
      designationMap.get(designation) ??
      { designation, resourceIds: new Set<string>(), totalMandays: 0, totalNSR: 0 };
    d.resourceIds.add(resourceId);
    d.totalMandays += mandays;
    d.totalNSR += nsr;
    designationMap.set(designation, d);
  };

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
        if (resource.regionCode) {
          addRegion(resource.regionCode, allocation.totalMandays, result.totalCommercial, result.totalCost);
        }
        if (resource.designation) {
          addDesignation(resource.designation, resource.id, allocation.totalMandays, result.totalCommercial);
        }
      }
    } else if (resource.regionCode && resource.designation) {
      // Internal resource costing. A single missing rate card must not abort the
      // entire calculation — record the resource and continue.
      try {
        const costResult = await calculateInternalResourceCost({
          resourceId: resource.id,
          region: resource.regionCode,
          designation: resource.designation,
          totalMandays: allocation.totalMandays,
          isSubcontractor: false,
          projectCostingConfig: costingConfig,
        });

        resourceCosts.push(costResult);
        totalGSR += costResult.grossStandardRate;
        totalNSR += costResult.netStandardRate;
        totalInternalCost += costResult.totalInternalCost;
        addRegion(resource.regionCode, allocation.totalMandays, costResult.netStandardRate, costResult.totalInternalCost);
        addDesignation(resource.designation, resource.id, allocation.totalMandays, costResult.netStandardRate);
      } catch {
        unratedResources.push(`${resource.regionCode}/${resource.designation}`);
      }
    }
  }

  // Calculate total OPE
  const totalOPE = project.opeExpenses.reduce(
    (sum, ope) => sum + ope.totalOPECost.toNumber(),
    0
  );

  // Calculate gross margin (CONFIDENTIAL - Finance only), guarded vs zero NSR
  const grossMargin =
    totalNSR - (totalInternalCost + totalSubcontractorCost + totalOPE);
  const marginPercent = pct(grossMargin, totalNSR);

  const realizationRate =
    costingConfig.realizationRatePercent?.toNumber() || DEFAULT_REALIZATION_RATE;

  // Breakdown by region (cost/margin gated to FINANCE_ONLY)
  const byRegion: CostBreakdownByRegion[] = Array.from(regionMap.values()).map((r) => ({
    region: r.region,
    totalMandays: r.totalMandays,
    totalNSR: r.totalNSR,
    totalCost: visibilityLevel === "FINANCE_ONLY" ? r.totalCost : 0,
    margin: visibilityLevel === "FINANCE_ONLY" ? r.margin : 0,
  }));

  // Breakdown by designation (averageUtilization needs capacity context — left at 0)
  const byDesignation: CostBreakdownByDesignation[] = Array.from(designationMap.values()).map((d) => ({
    designation: d.designation,
    count: d.resourceIds.size,
    totalMandays: d.totalMandays,
    totalNSR: d.totalNSR,
    averageUtilization: 0,
  }));

  return {
    projectId: project.id,
    versionNumber: versionNumber || project.version,
    totalGSR,
    totalNSR,
    realizationRate,
    totalInternalCost:
      visibilityLevel === "FINANCE_ONLY" ? totalInternalCost : 0,
    totalSubcontractorCost:
      visibilityLevel === "FINANCE_ONLY" ? totalSubcontractorCost : 0,
    totalOPE: visibilityLevel === "FINANCE_ONLY" ? totalOPE : 0,
    grossMargin: visibilityLevel === "FINANCE_ONLY" ? grossMargin : 0,
    marginPercent: visibilityLevel === "FINANCE_ONLY" ? marginPercent : 0,
    byRegion,
    byDesignation,
    unratedResources,
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
    workingDays: { toNumber: () => number };
    mandays: { toNumber: () => number } | null;
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
