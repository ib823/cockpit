/**
 * FTE Calculator - Convert mandays → FTE → booking recommendations
 * Aligned with SAP Activate methodology and existing phase data
 */

import { Phase, Resource } from "@/types/core";
import { getSkillsetRequirements, RoleRequirement } from "@/data/sap-activate-skillsets";
import { RATE_CARDS } from "@/data/resource-catalog";

export interface FTECalculation {
  phaseId: string;
  phaseName: string;
  sapActivatePhase: "Prepare" | "Explore" | "Realize" | "Deploy" | "Run";

  // Input
  totalEffort: number; // mandays
  phaseDuration: number; // working days

  // Calculation
  rawFTE: number; // totalEffort / phaseDuration
  adjustedFTE: number; // After utilization adjustment (85%)

  // Resource Breakdown
  resourceBookings: ResourceBooking[];

  // Metrics
  totalHeadcount: number;
  avgUtilization: number;
  totalCost: number;

  // Alerts
  warnings: string[];
  recommendations: string[];
}

export interface ResourceBooking {
  role: string;
  skillsets: string[];
  criticality: "must-have" | "recommended" | "optional";

  // Effort
  effortDays: number; // mandays required
  effortPercent: number; // % of phase effort

  // Allocation
  allocationPercent: number; // % FTE (50 = half-time)

  // Duration
  startDate?: Date;
  endDate?: Date;
  workingDays: number;

  // Booking Details
  fte: number; // Calculated: effortDays / workingDays
  headcount: number; // Rounded up: Math.ceil(fte)
  utilizationPercent: number; // Actual utilization

  // Cost
  hourlyRate: number;
  totalCost: number;

  // Booking Status
  status: "planned" | "booking_required" | "booked" | "confirmed";
}

interface CalculatorConfig {
  standardUtilization: number; // Default: 85%
  workingHoursPerDay: number; // Default: 8
  region: string; // For rate card
}

const DEFAULT_CONFIG: CalculatorConfig = {
  standardUtilization: 85,
  workingHoursPerDay: 8,
  region: "ABMY",
};

/**
 * Calculate FTE requirements for a phase
 */
export function calculateFTE(phase: Phase, config: Partial<CalculatorConfig> = {}): FTECalculation {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const totalEffort = phase.effort || 0;
  const duration = phase.workingDays || 0;

  if (duration === 0) {
    return createEmptyCalculation(phase);
  }

  // 1. Calculate raw FTE required
  const rawFTE = totalEffort / duration;

  // 2. Adjust for realistic utilization (not 100%)
  const adjustedFTE = rawFTE / (fullConfig.standardUtilization / 100);

  // 3. Extract SAP Activate phase from category
  const sapActivatePhase = extractSAPActivatePhase(phase.category);

  // 4. Extract module ID from phase
  const moduleId = extractModuleId(phase.id, phase.category);

  // 5. Get skillset requirements
  const skillsetReqs = getSkillsetRequirements(moduleId, sapActivatePhase);

  // 6. Build resource bookings
  const resourceBookings = buildResourceBookings(
    skillsetReqs,
    totalEffort,
    duration,
    fullConfig,
    phase.startDate,
    phase.endDate
  );

  // 7. Calculate totals
  const totalHeadcount = resourceBookings.reduce((sum, rb) => sum + rb.headcount, 0);
  const avgUtilization =
    resourceBookings.reduce((sum, rb) => sum + rb.utilizationPercent, 0) / resourceBookings.length;
  const totalCost = resourceBookings.reduce((sum, rb) => sum + rb.totalCost, 0);

  // 8. Generate warnings and recommendations
  const warnings = generateWarnings(adjustedFTE, duration, resourceBookings, totalHeadcount);
  const recommendations = generateRecommendations(resourceBookings, warnings);

  return {
    phaseId: phase.id,
    phaseName: phase.name,
    sapActivatePhase,
    totalEffort,
    phaseDuration: duration,
    rawFTE,
    adjustedFTE,
    resourceBookings,
    totalHeadcount,
    avgUtilization,
    totalCost,
    warnings,
    recommendations,
  };
}

/**
 * Build resource bookings from skillset requirements
 */
function buildResourceBookings(
  skillsetReqs: RoleRequirement[],
  totalEffort: number,
  duration: number,
  config: CalculatorConfig,
  startDate?: Date,
  endDate?: Date
): ResourceBooking[] {
  const rateCard = RATE_CARDS[config.region as keyof typeof RATE_CARDS] || RATE_CARDS.ABMY;

  return skillsetReqs.map((req) => {
    // Calculate effort for this role
    const effortDays = (totalEffort * req.effortPercent) / 100;

    // Calculate FTE
    const fte = effortDays / duration;

    // Headcount (round up for booking)
    const headcount = Math.ceil(fte);

    // Actual utilization after rounding
    const utilizationPercent = (fte / headcount) * 100;

    // Get hourly rate
    const roleKey = req.role.toLowerCase().replace(/\s+/g, "_") as keyof typeof rateCard;
    const hourlyRate = (rateCard[roleKey as keyof typeof rateCard] as number) || 100;

    // Calculate total cost
    const totalCost = effortDays * config.workingHoursPerDay * hourlyRate;

    return {
      role: req.role,
      skillsets: req.skillsets,
      criticality: req.criticality,
      effortDays,
      effortPercent: req.effortPercent,
      allocationPercent: req.allocationPercent,
      startDate,
      endDate,
      workingDays: duration,
      fte,
      headcount,
      utilizationPercent,
      hourlyRate,
      totalCost,
      status: "planned" as const,
    };
  });
}

/**
 * Generate warnings based on FTE analysis
 */
function generateWarnings(
  adjustedFTE: number,
  duration: number,
  resourceBookings: ResourceBooking[],
  totalHeadcount: number
): string[] {
  const warnings: string[] = [];

  // Check for high FTE requirement
  if (adjustedFTE > duration * 3) {
    warnings.push(
      `High FTE requirement (${adjustedFTE.toFixed(1)} FTE) relative to duration (${duration} days) - consider parallel workstreams or extending timeline`
    );
  }

  // Check for single-person dependency
  if (totalHeadcount < 2) {
    warnings.push(
      `Single-person dependency risk detected - recommend minimum 2 resources for knowledge sharing`
    );
  }

  // Check individual resource utilization
  resourceBookings.forEach((rb) => {
    if (rb.utilizationPercent < 40 && rb.criticality === "must-have") {
      warnings.push(
        `${rb.role} is under-utilized (${rb.utilizationPercent.toFixed(0)}%) - consider part-time allocation or combining with other phases`
      );
    }

    if (rb.utilizationPercent > 95) {
      warnings.push(
        `${rb.role} is over-allocated (${rb.utilizationPercent.toFixed(0)}%) - add another resource or extend phase duration`
      );
    }
  });

  // Check for missing critical resources
  const hasMustHave = resourceBookings.some((rb) => rb.criticality === "must-have");
  if (!hasMustHave) {
    warnings.push(`No must-have roles identified - verify skillset requirements`);
  }

  return warnings;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  resourceBookings: ResourceBooking[],
  warnings: string[]
): string[] {
  const recommendations: string[] = [];

  // Check for optimization opportunities
  const underutilized = resourceBookings.filter(
    (rb) => rb.utilizationPercent < 50 && rb.criticality !== "must-have"
  );

  if (underutilized.length > 0) {
    recommendations.push(
      `Consider making these roles part-time: ${underutilized.map((r) => r.role).join(", ")}`
    );
  }

  // Check for team composition balance
  const mustHaveCount = resourceBookings.filter((rb) => rb.criticality === "must-have").length;
  const totalCount = resourceBookings.length;

  if (mustHaveCount < totalCount * 0.5) {
    recommendations.push(
      `Team has high proportion of optional roles (${totalCount - mustHaveCount}/${totalCount}) - consider if all are needed`
    );
  }

  // Duration recommendations
  if (warnings.some((w) => w.includes("over-allocated"))) {
    const overallocated = resourceBookings.filter((rb) => rb.utilizationPercent > 95);
    const additionalDays = Math.ceil(
      Math.max(...overallocated.map((rb) => rb.effortDays / 0.85 - rb.workingDays))
    );
    recommendations.push(
      `Consider extending phase by ${additionalDays} days to reduce over-allocation`
    );
  }

  // Parallel work recommendations
  if (warnings.some((w) => w.includes("parallel workstreams"))) {
    recommendations.push(
      `Split into 2-3 parallel workstreams with clear dependencies to accelerate delivery`
    );
  }

  return recommendations;
}

/**
 * Extract SAP Activate phase from category
 * Examples: "Finance - Prepare", "SCM - Explore" → "Prepare", "Explore"
 */
function extractSAPActivatePhase(
  category: string
): "Prepare" | "Explore" | "Realize" | "Deploy" | "Run" {
  const phases = ["Prepare", "Explore", "Realize", "Deploy", "Run"] as const;

  for (const phase of phases) {
    if (category.includes(phase)) {
      return phase;
    }
  }

  return "Realize"; // Default fallback
}

/**
 * Extract module ID from phase ID or category
 * Examples: "sap-fico_Prepare_0", "Finance - Prepare" → "sap-fico"
 */
function extractModuleId(phaseId: string, category: string): string {
  // Try to extract from phase ID first
  const idMatch = phaseId.match(/^(sap-[a-z]+)/i);
  if (idMatch) {
    return idMatch[1].toLowerCase();
  }

  // Map category to module ID
  const categoryMap: Record<string, string> = {
    Finance: "sap-fico",
    Procurement: "sap-mm",
    SCM: "sap-mm",
    Sales: "sap-sd",
    Technical: "sap-basis",
    HCM: "sap-hcm",
  };

  for (const [key, moduleId] of Object.entries(categoryMap)) {
    if (category.includes(key)) {
      return moduleId;
    }
  }

  return "sap-fico"; // Default fallback
}

/**
 * Create empty calculation for invalid phase
 */
function createEmptyCalculation(phase: Phase): FTECalculation {
  return {
    phaseId: phase.id,
    phaseName: phase.name,
    sapActivatePhase: "Prepare",
    totalEffort: 0,
    phaseDuration: 0,
    rawFTE: 0,
    adjustedFTE: 0,
    resourceBookings: [],
    totalHeadcount: 0,
    avgUtilization: 0,
    totalCost: 0,
    warnings: ["Phase has no duration - cannot calculate FTE"],
    recommendations: ["Add working days to phase to enable FTE calculation"],
  };
}

/**
 * Calculate FTE for all phases in a timeline
 */
export function calculateTimelineFTE(
  phases: Phase[],
  config: Partial<CalculatorConfig> = {}
): FTECalculation[] {
  return phases.map((phase) => calculateFTE(phase, config));
}

/**
 * Get summary metrics for entire timeline
 */
export interface TimelineFTESummary {
  totalEffort: number;
  totalDuration: number;
  avgFTE: number;
  peakFTE: number;
  totalHeadcount: number;
  totalCost: number;
  warningCount: number;
}

export function calculateTimelineFTESummary(calculations: FTECalculation[]): TimelineFTESummary {
  const totalEffort = calculations.reduce((sum, c) => sum + c.totalEffort, 0);

  // Duration is NOT sum (phases may overlap), use max end date
  const maxDuration = Math.max(...calculations.map((c) => c.phaseDuration), 0);

  const avgFTE = calculations.reduce((sum, c) => sum + c.adjustedFTE, 0) / calculations.length;
  const peakFTE = Math.max(...calculations.map((c) => c.adjustedFTE), 0);

  // Deduplicate headcount by role
  const allRoles = new Set<string>();
  calculations.forEach((c) => {
    c.resourceBookings.forEach((rb) => {
      allRoles.add(rb.role);
    });
  });
  const totalHeadcount = allRoles.size;

  const totalCost = calculations.reduce((sum, c) => sum + c.totalCost, 0);
  const warningCount = calculations.reduce((sum, c) => sum + c.warnings.length, 0);

  return {
    totalEffort,
    totalDuration: maxDuration,
    avgFTE,
    peakFTE,
    totalHeadcount,
    totalCost,
    warningCount,
  };
}
