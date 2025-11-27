/**
 * DEPRECATED: This file has been superseded by /src/lib/team-capacity/costing.ts
 *
 * The new implementation provides:
 * - Full 7-layer costing model (vs simplified GSR/RR/NSR)
 * - Integration with ProjectCostingConfig and SubcontractorRate models
 * - Three-tier security (PUBLIC/PRESALES_AND_FINANCE/FINANCE_ONLY)
 * - Automated internal cost and subcontractor margin calculations
 *
 * Migration path:
 * - API endpoints have been updated to use /src/lib/team-capacity/costing.ts
 * - This file is kept for reference only
 * - DO NOT use this for new development
 *
 * Team Capacity - Costing Engine (LEGACY)
 *
 * Implements presales proposal costing formulas based on Excel reference (YTL Cement_RP.xlsx)
 *
 * Formula Reference:
 * - GSR (Gross Service Revenue) = Sum(Resource Std Rate × Days × Allocation%)
 * - Commercial Rate = GSR × Realization Rate (RR)
 * - NSR (Net Service Revenue) = Commercial Rate (actual billable amount)
 * - Total Cost = Internal Cost + Subcontractor Cost + OPE
 * - Gross Margin = NSR - Total Cost
 * - Margin % = (Gross Margin / NSR) × 100
 *
 * Security: Confidential - Finance team access only via RBAC
 * Performance: Optimized for batch calculations with caching
 */

import { Decimal } from "decimal.js";
import type {
  ResourceWeeklyAllocation,
  ResourceRateLookup,
  ProjectCosting,
  OutOfPocketExpense,
} from "@/types/gantt-tool";

// Configure Decimal for financial precision (12 decimal places)
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// Constants
const HOURS_PER_DAY = 8;
const WORKING_DAYS_PER_WEEK = 5;

// ============================================================================
// Input Types
// ============================================================================

export interface ResourceAllocationInput {
  resourceId: string;
  designation: string; // "Principal", "Director", "Manager", etc.
  regionCode: string; // "ABMY", "ABSG", "ABVN", "ABTH"
  weeklyAllocations: {
    weekIdentifier: string; // "2025-W03"
    allocationPercent: number; // 0-100
    workingDays: number; // Calculated days (e.g., 50% = 2.5 days)
  }[];
}

export interface CostingEngineInput {
  projectId: string;
  baseCurrency: string; // Default: "MYR"
  realizationRate: number; // e.g., 0.43 (43%) - per project, no global default

  // Resource allocations for this project
  resources: ResourceAllocationInput[];

  // Manual cost inputs (CONFIDENTIAL - Finance team only)
  internalCost?: number; // Manual entry (not auto-calculated)
  subcontractorCost?: number; // Manual entry

  // OPE breakdown (calculated from OutOfPocketExpense table)
  totalOPE?: number;
}

export interface RateLookupContext {
  // Rate lookup table (from ResourceRateLookup)
  rates: Map<string, ResourceRateLookup>; // Key: "${regionCode}_${designation}"

  // Effective date for rate lookup (defaults to current date)
  effectiveDate?: Date;
}

export interface CostingEngineOutput {
  // Revenue calculations
  grossServiceRevenue: number; // GSR
  realizationRate: number; // RR (as decimal, e.g., 0.43)
  commercialRate: number; // Commercial = GSR × RR
  netServiceRevenue: number; // NSR = Commercial (actual billable)

  // Cost breakdown
  internalCost: number; // Manual entry
  subcontractorCost: number; // Manual entry
  outOfPocketExpense: number; // OPE total
  totalCost: number; // Internal + Subcon + OPE

  // Margin analysis
  grossMargin: number; // NSR - Total Cost
  marginPercentage: number; // (Gross Margin / NSR) × 100

  // Detailed breakdown
  breakdown: {
    resourceBreakdown: Map<string, ResourceCostDetail>; // resourceId -> cost detail
    regionBreakdown: Map<string, number>; // regionCode -> total cost
    designationBreakdown: Map<string, number>; // designation -> total cost
  };

  // Metadata
  baseCurrency: string;
  calculatedAt: Date;
}

export interface ResourceCostDetail {
  resourceId: string;
  designation: string;
  regionCode: string;
  hourlyRate: number; // In base currency (MYR)
  totalDays: number; // Sum of working days across all weeks
  totalHours: number; // totalDays × 8
  totalCost: number; // totalHours × hourlyRate
}

// ============================================================================
// Core Costing Engine
// ============================================================================

/**
 * Calculate project costing with GSR/RR/NSR formulas
 * Security: This function should only be called after verifying Finance team permission
 */
export function calculateProjectCosting(
  input: CostingEngineInput,
  rateLookup: RateLookupContext
): CostingEngineOutput {
  // Validate inputs
  validateCostingInput(input);

  const effectiveDate = rateLookup.effectiveDate || new Date();
  const resourceBreakdown = new Map<string, ResourceCostDetail>();
  const regionBreakdown = new Map<string, number>();
  const designationBreakdown = new Map<string, number>();

  let totalGSR = new Decimal(0);

  // Calculate GSR (Gross Service Revenue) for each resource
  for (const resource of input.resources) {
    // Look up hourly rate for this resource
    const rateKey = `${resource.regionCode}_${resource.designation}`;
    const rateLookupEntry = rateLookup.rates.get(rateKey);

    if (!rateLookupEntry) {
      throw new Error(
        `Rate not found for ${resource.designation} in ${resource.regionCode}. ` +
        `Please ensure rate lookup table is populated.`
      );
    }

    // Verify rate is effective for the calculation date
    const rateEffectiveFrom = new Date(rateLookupEntry.effectiveFrom);
    const rateEffectiveTo = rateLookupEntry.effectiveTo
      ? new Date(rateLookupEntry.effectiveTo)
      : null;

    if (effectiveDate < rateEffectiveFrom) {
      throw new Error(
        `Rate for ${resource.designation} in ${resource.regionCode} is not yet effective. ` +
        `Effective from: ${rateLookupEntry.effectiveFrom}`
      );
    }

    if (rateEffectiveTo && effectiveDate > rateEffectiveTo) {
      throw new Error(
        `Rate for ${resource.designation} in ${resource.regionCode} has expired. ` +
        `Effective until: ${rateLookupEntry.effectiveTo}`
      );
    }

    // Calculate hourly rate in base currency (apply forex conversion)
    const hourlyRateInBaseCurrency = new Decimal(rateLookupEntry.hourlyRate)
      .times(new Decimal(rateLookupEntry.forexRate))
      .toDecimalPlaces(2);

    // Calculate total working days for this resource
    const totalDays = resource.weeklyAllocations.reduce(
      (sum, week) => sum + week.workingDays,
      0
    );

    // Calculate total hours (days × 8 hours/day)
    const totalHours = totalDays * HOURS_PER_DAY;

    // Calculate cost for this resource
    const resourceCost = hourlyRateInBaseCurrency.times(new Decimal(totalHours));

    // Add to GSR
    totalGSR = totalGSR.plus(resourceCost);

    // Store breakdown
    const detail: ResourceCostDetail = {
      resourceId: resource.resourceId,
      designation: resource.designation,
      regionCode: resource.regionCode,
      hourlyRate: hourlyRateInBaseCurrency.toNumber(),
      totalDays,
      totalHours,
      totalCost: resourceCost.toNumber(),
    };

    resourceBreakdown.set(resource.resourceId, detail);

    // Aggregate by region
    const currentRegionTotal = regionBreakdown.get(resource.regionCode) || 0;
    regionBreakdown.set(
      resource.regionCode,
      currentRegionTotal + resourceCost.toNumber()
    );

    // Aggregate by designation
    const currentDesignationTotal = designationBreakdown.get(resource.designation) || 0;
    designationBreakdown.set(
      resource.designation,
      currentDesignationTotal + resourceCost.toNumber()
    );
  }

  // Apply realization rate to get commercial rate
  const realizationRateDecimal = new Decimal(input.realizationRate);
  const commercialRate = totalGSR.times(realizationRateDecimal);

  // NSR = Commercial Rate (in this model, NSR equals commercial rate)
  const netServiceRevenue = commercialRate;

  // Calculate total cost (manual entries + OPE)
  const internalCost = new Decimal(input.internalCost || 0);
  const subcontractorCost = new Decimal(input.subcontractorCost || 0);
  const outOfPocketExpense = new Decimal(input.totalOPE || 0);
  const totalCost = internalCost.plus(subcontractorCost).plus(outOfPocketExpense);

  // Calculate margin
  const grossMargin = netServiceRevenue.minus(totalCost);

  // Calculate margin percentage (avoid division by zero)
  let marginPercentage = new Decimal(0);
  if (netServiceRevenue.greaterThan(0)) {
    marginPercentage = grossMargin.dividedBy(netServiceRevenue).times(100);
  }

  return {
    grossServiceRevenue: totalGSR.toDecimalPlaces(2).toNumber(),
    realizationRate: input.realizationRate,
    commercialRate: commercialRate.toDecimalPlaces(2).toNumber(),
    netServiceRevenue: netServiceRevenue.toDecimalPlaces(2).toNumber(),

    internalCost: internalCost.toDecimalPlaces(2).toNumber(),
    subcontractorCost: subcontractorCost.toDecimalPlaces(2).toNumber(),
    outOfPocketExpense: outOfPocketExpense.toDecimalPlaces(2).toNumber(),
    totalCost: totalCost.toDecimalPlaces(2).toNumber(),

    grossMargin: grossMargin.toDecimalPlaces(2).toNumber(),
    marginPercentage: marginPercentage.toDecimalPlaces(2).toNumber(),

    breakdown: {
      resourceBreakdown,
      regionBreakdown,
      designationBreakdown,
    },

    baseCurrency: input.baseCurrency,
    calculatedAt: new Date(),
  };
}

/**
 * Calculate total OPE (Out of Pocket Expense) from monthly breakdown
 */
export function calculateTotalOPE(opeExpenses: OutOfPocketExpense[]): number {
  return opeExpenses.reduce(
    (total, ope) => new Decimal(total).plus(new Decimal(ope.totalOPECost)).toNumber(),
    0
  );
}

/**
 * Calculate OPE for a single resource for a single month
 * Based on Excel Auto_OPE structure: Flights + Hotel + Parking/Toll + Mileage
 */
export function calculateMonthlyOPE(input: {
  totalMandays: number;
  onsitePercentage: number; // 0-100
  flightCount: number;
  flightRate: number;
  hotelRate: number;
  parkingTollRate: number;
  mileageKm: number;
  mileageRate: number;
}): {
  onsiteDays: number;
  totalFlightCost: number;
  totalHotelCost: number;
  totalParkingTollCost: number;
  totalMileageCost: number;
  totalOPECost: number;
} {
  // Validate inputs
  if (input.onsitePercentage < 0 || input.onsitePercentage > 100) {
    throw new Error(`Onsite percentage must be between 0-100, got: ${input.onsitePercentage}`);
  }

  // Calculate onsite days
  const onsiteDays = new Decimal(input.totalMandays)
    .times(new Decimal(input.onsitePercentage))
    .dividedBy(100)
    .toDecimalPlaces(2);

  // Calculate component costs
  const flightCost = new Decimal(input.flightCount).times(new Decimal(input.flightRate));
  const hotelCost = new Decimal(input.hotelRate).times(onsiteDays);
  const parkingTollCost = new Decimal(input.parkingTollRate).times(onsiteDays);
  const mileageCost = new Decimal(input.mileageKm).times(new Decimal(input.mileageRate));

  // Total OPE = sum of all components
  const totalOPE = flightCost.plus(hotelCost).plus(parkingTollCost).plus(mileageCost);

  return {
    onsiteDays: onsiteDays.toNumber(),
    totalFlightCost: flightCost.toDecimalPlaces(2).toNumber(),
    totalHotelCost: hotelCost.toDecimalPlaces(2).toNumber(),
    totalParkingTollCost: parkingTollCost.toDecimalPlaces(2).toNumber(),
    totalMileageCost: mileageCost.toDecimalPlaces(2).toNumber(),
    totalOPECost: totalOPE.toDecimalPlaces(2).toNumber(),
  };
}

// ============================================================================
// Validation
// ============================================================================

function validateCostingInput(input: CostingEngineInput): void {
  // Validate realization rate
  if (input.realizationRate < 0 || input.realizationRate > 1) {
    throw new Error(
      `Realization rate must be between 0 and 1 (e.g., 0.43 for 43%), got: ${input.realizationRate}`
    );
  }

  // Validate resource allocations
  if (!input.resources || input.resources.length === 0) {
    throw new Error("At least one resource allocation is required for costing calculation");
  }

  // Validate each resource
  for (const resource of input.resources) {
    if (!resource.resourceId) {
      throw new Error("Resource ID is required");
    }

    if (!resource.designation) {
      throw new Error(`Designation is required for resource ${resource.resourceId}`);
    }

    if (!resource.regionCode) {
      throw new Error(`Region code is required for resource ${resource.resourceId}`);
    }

    if (!resource.weeklyAllocations || resource.weeklyAllocations.length === 0) {
      throw new Error(`At least one weekly allocation is required for resource ${resource.resourceId}`);
    }

    // Validate weekly allocations
    for (const week of resource.weeklyAllocations) {
      if (week.allocationPercent < 0 || week.allocationPercent > 100) {
        throw new Error(
          `Allocation percentage must be between 0-100 for resource ${resource.resourceId}, ` +
          `week ${week.weekIdentifier}, got: ${week.allocationPercent}`
        );
      }

      if (week.workingDays < 0 || week.workingDays > 5) {
        throw new Error(
          `Working days must be between 0-5 for resource ${resource.resourceId}, ` +
          `week ${week.weekIdentifier}, got: ${week.workingDays}`
        );
      }
    }
  }

  // Validate manual cost inputs (must be non-negative)
  if (input.internalCost !== undefined && input.internalCost < 0) {
    throw new Error(`Internal cost cannot be negative, got: ${input.internalCost}`);
  }

  if (input.subcontractorCost !== undefined && input.subcontractorCost < 0) {
    throw new Error(`Subcontractor cost cannot be negative, got: ${input.subcontractorCost}`);
  }

  if (input.totalOPE !== undefined && input.totalOPE < 0) {
    throw new Error(`Total OPE cannot be negative, got: ${input.totalOPE}`);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build rate lookup map from ResourceRateLookup array
 */
export function buildRateLookupMap(rates: ResourceRateLookup[]): Map<string, ResourceRateLookup> {
  const map = new Map<string, ResourceRateLookup>();

  for (const rate of rates) {
    const key = `${rate.regionCode}_${rate.designation}`;

    // If multiple rates exist for same region/designation, keep the one with latest effectiveFrom
    const existing = map.get(key);
    if (existing) {
      const existingDate = new Date(existing.effectiveFrom);
      const newDate = new Date(rate.effectiveFrom);

      if (newDate > existingDate) {
        map.set(key, rate);
      }
    } else {
      map.set(key, rate);
    }
  }

  return map;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = "MYR"): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
