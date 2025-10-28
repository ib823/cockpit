/**
 * Keystone - Estimator Type Definitions
 *
 * Core types for the L3-based estimation engine based on SAP Activate methodology
 */

// ============================================
// L3 Scope Item Types
// ============================================

/**
 * L3 Scope Item from SAP Process Navigator
 */
export interface L3ScopeItem {
  id: string;
  l3Code: string;
  l3Name: string;
  lobName: string;
  module: string | null;
  processNavigatorUrl: string;
  releaseTag: string;
  complexityMetrics: ComplexityMetrics | null;
  integrationDetails: IntegrationDetails | null;
}

/**
 * Complexity metrics for effort calculation
 */
export interface ComplexityMetrics {
  defaultTier: 'A' | 'B' | 'C' | 'D';
  coefficient: number | null; // NULL for Tier D
  tierRationale: string;
  crossModuleTouches: string | null; // e.g., "FI↔CO"
  localizationFlag: boolean;
  extensionRisk: 'Low' | 'Med' | 'High';
}

/**
 * Integration details for each L3 item
 */
export interface IntegrationDetails {
  integrationPackageAvailable: 'Yes' | 'No' | 'NA';
  testScriptExists: boolean;
}

// ============================================
// Profile Types
// ============================================

/**
 * Pre-configured profile with baseline effort values
 */
export interface Profile {
  name: string;
  baseFT: number; // Baseline functional/technical MD
  basis: number; // Fixed Basis MD
  securityAuth: number; // Fixed Security MD
  description?: string;
  region?: string;
}

/**
 * Default profile for Malaysia Mid-Market
 */
export const DEFAULT_PROFILE: Profile = {
  name: 'Malaysia Mid-Market',
  baseFT: 378,
  basis: 24,
  securityAuth: 8,
  description: 'Standard FI+MM for Public Cloud',
  region: 'Malaysia',
};

/**
 * Available profiles
 */
export const AVAILABLE_PROFILES: Profile[] = [
  DEFAULT_PROFILE,
  {
    name: 'Singapore Enterprise',
    baseFT: 550,
    basis: 36,
    securityAuth: 12,
    description: 'Enterprise deployment with FI+MM+SD',
    region: 'Singapore',
  },
  {
    name: 'Vietnam SME',
    baseFT: 280,
    basis: 18,
    securityAuth: 6,
    description: 'Small-medium enterprise basic setup',
    region: 'Vietnam',
  },
];

// ============================================
// Estimator Input Types
// ============================================

/**
 * Complete set of inputs for estimation
 */
export interface EstimatorInputs {
  // Profile
  profile: Profile;

  // Scope Breadth (Sb)
  selectedL3Items: L3ScopeItem[];
  integrations: number; // Count of system integrations

  // Process Complexity (Pc)
  customForms: number; // Number of custom forms
  fitToStandard: number; // 0.0 to 1.0 (0% to 100%)

  // Organizational Scale (Os)
  legalEntities: number;
  countries: number;
  languages: number;

  // Capacity
  fte: number; // Full-time equivalents
  utilization: number; // 0.0 to 1.0 (0% to 100%)
  overlapFactor: number; // 0.0 to 1.0 (0% to 100%)
}

/**
 * Validation constraints for inputs
 */
export const INPUT_CONSTRAINTS = {
  integrations: { min: 0, max: 50 },
  customForms: { min: 0, max: 200 },
  fitToStandard: { min: 0.5, max: 1.0 }, // 50% to 100%
  legalEntities: { min: 1, max: 100 },
  countries: { min: 1, max: 50 },
  languages: { min: 1, max: 30 },
  fte: { min: 1, max: 100 },
  utilization: { min: 0.5, max: 0.95 }, // 50% to 95%
  overlapFactor: { min: 0.5, max: 0.85 }, // 50% to 85%
} as const;

// ============================================
// Estimator Output Types
// ============================================

/**
 * Phase breakdown following SAP Activate methodology
 */
export interface PhaseBreakdown {
  phaseName: 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run';
  effortMD: number; // Effort in man-days
  durationMonths: number; // Duration in calendar months
  startDate?: Date;
  endDate?: Date;
}

/**
 * SAP Activate phase distribution weights
 */
export const PHASE_WEIGHTS: Record<PhaseBreakdown['phaseName'], number> = {
  Prepare: 0.10,
  Explore: 0.25,
  Realize: 0.45,
  Deploy: 0.15,
  Run: 0.05,
} as const;

/**
 * Complete estimation results
 */
export interface EstimatorResults {
  // Totals
  totalMD: number; // Total effort in man-days
  durationMonths: number; // Total duration in calendar months
  pmoMD: number; // PMO overhead in man-days

  // Phase distribution
  phases: PhaseBreakdown[];

  // Coefficients (for transparency)
  coefficients: {
    Sb: number; // Scope Breadth
    Pc: number; // Process Complexity
    Os: number; // Organizational Scale
  };

  // Capacity metrics
  capacityPerMonth: number; // MD per month

  // Intermediate calculations (for formula transparency)
  intermediateValues?: {
    E_FT: number; // Functional/Technical effort
    E_fixed: number; // Fixed effort (Basis + Security)
    D_raw: number; // Raw duration before overlap
  };
}

// ============================================
// Resource Allocation Types
// ============================================

/**
 * Resource allocation for timeline planning
 */
export interface ResourceAllocation {
  role: string; // e.g., "Functional Consultant", "Technical Architect"
  fte: number; // Full-time equivalent allocation
  ratePerDay: number; // Daily rate in currency
  phases: PhaseBreakdown['phaseName'][]; // Which phases this role is active
  totalCost: number; // Calculated total cost
}

/**
 * Default rate card (Malaysia rates in USD)
 */
export const DEFAULT_RATE_CARD: Record<string, number> = {
  'Project Manager': 180,
  'Functional Consultant': 150,
  'Technical Architect': 160,
  'Basis Administrator': 140,
  'Change Management': 120,
  'QA Tester': 100,
} as const;

// ============================================
// Constants
// ============================================

/**
 * Formula constants from specification
 */
export const FORMULA_CONSTANTS = {
  PMO_MONTHLY_RATE: 16.25, // MD per month
  WORKING_DAYS_PER_MONTH: 22,
  MAX_PMO_ITERATIONS: 5,
  PMO_CONVERGENCE_THRESHOLD: 0.01, // months

  // Coefficient multipliers from specification
  INTEGRATION_FACTOR: 0.02, // Per integration
  EXTRA_FORM_FACTOR: 0.01, // Per extra form beyond baseline
  FIT_GAP_FACTOR: 0.25, // Applied to (1 - fitToStandard)
  ENTITY_FACTOR: 0.03, // Per additional entity
  COUNTRY_FACTOR: 0.05, // Per additional country
  LANGUAGE_FACTOR: 0.02, // Per additional language

  // Baselines
  BASELINE_FORMS: 4,
} as const;

// ============================================
// Validation & Error Types
// ============================================

/**
 * Validation error for input constraints
 */
export interface ValidationError {
  field: keyof EstimatorInputs;
  message: string;
  constraint: {
    min?: number;
    max?: number;
    expected?: string;
  };
}

/**
 * Calculate validation errors for inputs
 */
export function validateInputs(inputs: EstimatorInputs): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate integrations
  if (inputs.integrations < INPUT_CONSTRAINTS.integrations.min || inputs.integrations > INPUT_CONSTRAINTS.integrations.max) {
    errors.push({
      field: 'integrations',
      message: `Integrations must be between ${INPUT_CONSTRAINTS.integrations.min} and ${INPUT_CONSTRAINTS.integrations.max}`,
      constraint: INPUT_CONSTRAINTS.integrations,
    });
  }

  // Validate FTE
  if (inputs.fte < INPUT_CONSTRAINTS.fte.min || inputs.fte > INPUT_CONSTRAINTS.fte.max) {
    errors.push({
      field: 'fte',
      message: `FTE must be between ${INPUT_CONSTRAINTS.fte.min} and ${INPUT_CONSTRAINTS.fte.max}`,
      constraint: INPUT_CONSTRAINTS.fte,
    });
  }

  // Validate utilization (0-1 range)
  if (inputs.utilization < INPUT_CONSTRAINTS.utilization.min || inputs.utilization > INPUT_CONSTRAINTS.utilization.max) {
    errors.push({
      field: 'utilization',
      message: `Utilization must be between ${INPUT_CONSTRAINTS.utilization.min * 100}% and ${INPUT_CONSTRAINTS.utilization.max * 100}%`,
      constraint: { min: INPUT_CONSTRAINTS.utilization.min * 100, max: INPUT_CONSTRAINTS.utilization.max * 100 },
    });
  }

  // Validate fit-to-standard (0-1 range)
  if (inputs.fitToStandard < INPUT_CONSTRAINTS.fitToStandard.min || inputs.fitToStandard > INPUT_CONSTRAINTS.fitToStandard.max) {
    errors.push({
      field: 'fitToStandard',
      message: `Fit-to-standard must be between ${INPUT_CONSTRAINTS.fitToStandard.min * 100}% and ${INPUT_CONSTRAINTS.fitToStandard.max * 100}%`,
      constraint: { min: INPUT_CONSTRAINTS.fitToStandard.min * 100, max: INPUT_CONSTRAINTS.fitToStandard.max * 100 },
    });
  }

  return errors;
}

// ============================================
// Scenario Types (for saving/loading)
// ============================================

/**
 * Saved scenario with complete state
 */
export interface Scenario {
  id: string;
  userId: string;
  organizationId?: string;
  name: string;

  inputs: EstimatorInputs;
  results: EstimatorResults;

  // Timeline data (optional)
  startDate?: Date;
  resources?: ResourceAllocation[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scenario version for audit trail
 */
export interface ScenarioVersion {
  id: string;
  scenarioId: string;
  versionNumber: number;
  label?: string;
  snapshot: Scenario;
  changes?: Array<{
    field: string;
    before: unknown;
    after: unknown;
    impact: {
      durationDelta: number;
      costDelta: number;
    };
  }>;
  changeReason?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// Helper Types
// ============================================

/**
 * Calculation metadata for transparency
 */
export interface CalculationMetadata {
  timestamp: Date;
  version: string; // Formula version
  profile: string; // Profile used
  selectedL3Count: number;
  warnings: string[];
}
