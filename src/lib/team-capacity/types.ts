/**
 * Team Capacity & Proposal Engine - TypeScript Type Definitions
 *
 * Comprehensive types for resource allocation, costing, and proposal generation
 * Aligns with Prisma schema and validated requirements from YTL Cement RP.xlsx
 */

import type {
  WeekNumberingType,
  CostVisibilityLevel,
  ResourceWeeklyAllocation,
  ProjectCostingConfig,
  SubcontractorRate,
  ResourceRateLookup,
  ProjectCosting
} from "@prisma/client";

// ============================================================================
// WEEK NUMBERING SYSTEM
// ============================================================================

export interface WeekIdentifier {
  weekNumber: number;
  weekStartDate: Date;
  weekEndDate: Date;
  displayLabel: string; // "Week 1" | "W43" | "Week 43"
  type: WeekNumberingType;
}

export interface WeekNumberingPreference {
  type: WeekNumberingType;
  projectStartDate?: Date; // Required for PROJECT_RELATIVE
}

// ============================================================================
// ALLOCATION & CAPACITY
// ============================================================================

export interface AllocationInput {
  resourceId: string;
  weekStartDate: Date;
  mandays?: number; // 0.0 to 5.0
  allocationPercent?: number; // 0 to 100
  weekNumberingType?: WeekNumberingType;
  notes?: string;
}

export interface AllocationWithConflicts extends ResourceWeeklyAllocation {
  conflicts: AllocationConflict[];
  warnings: AllocationWarning[];
}

export interface AllocationConflict {
  type: 'OVER_ALLOCATION' | 'DOUBLE_BOOKING';
  severity: 'ERROR' | 'WARNING';
  message: string;
  affectedResources: string[];
  suggestedResolution?: string;
}

export interface AllocationWarning {
  type: 'PHASE_BOUNDARY' | 'LOW_UTILIZATION' | 'HIGH_COST';
  message: string;
  details?: string;
}

// ============================================================================
// COSTING CALCULATIONS
// ============================================================================

export interface CostCalculationInput {
  resourceId: string;
  region: string;
  designation: string;
  totalMandays: number;
  isSubcontractor: boolean;
  projectCostingConfig: ProjectCostingConfig;
  subcontractorRate?: SubcontractorRate;
  onsiteDaysPercent?: number; // For OPE calculation
}

export interface CostCalculationResult {
  // Step 1: Rate Lookup
  standardRatePerHour: number;
  currency: string;
  currencyConversionToMYR: number;

  // Step 2: Daily Rate
  standardRatePerDay: number; // standardRatePerHour × 8

  // Step 3: Gross Standard Rate (GSR)
  grossStandardRate: number; // totalMandays × standardRatePerDay

  // Step 4: Realization Rate (RR)
  realizationRate: number; // From config (e.g., 0.43 = 43%)
  commercialRatePerDay: number; // standardRatePerDay × RR

  // Step 5: Net Standard Rate (NSR)
  netStandardRate: number; // commercialRatePerDay × totalMandays

  // Step 6: Internal Cost (confidential - Finance only)
  internalCostPercent: number; // From config (e.g., 0.35 = 35%)
  internalCostPerDay: number; // standardRatePerDay × internalCostPercent
  totalInternalCost: number; // internalCostPerDay × totalMandays

  // Step 7: Margin (confidential - Finance only)
  margin: number; // NSR - totalInternalCost
  marginPercent: number; // (margin / NSR) × 100

  // Step 8: OPE (Out of Pocket Expenses)
  onsiteDays?: number; // totalMandays × (onsiteDaysPercent / 100)
  opeAmount?: number; // onsiteDays × opeTotalDefaultPerDay

  // Visibility
  visibilityLevel: CostVisibilityLevel;
}

export interface SubcontractorCostResult {
  dailyCommercialRate: number; // What client pays (revenue)
  dailyCostRate: number; // What company pays subcon (cost)
  totalCommercial: number; // dailyCommercialRate × totalMandays
  totalCost: number; // dailyCostRate × totalMandays
  margin: number; // totalCommercial - totalCost (can be negative!)
  marginPercent: number; // (margin / totalCommercial) × 100
  isNegativeMargin: boolean; // Flag for strategic decisions
}

// ============================================================================
// PROJECT COSTING SUMMARY
// ============================================================================

export interface ProjectCostingSummary {
  projectId: string;
  versionNumber: number;

  // Revenue
  totalGSR: number; // Sum of all resources' GSR
  totalNSR: number; // Sum of all resources' NSR (actual billable)

  // Costs (confidential - Finance only)
  totalInternalCost: number; // Sum of internal resources' costs
  totalSubcontractorCost: number; // Sum of subcontractor costs
  totalOPE: number; // Sum of all OPE expenses
  totalIntercompanyCost?: number; // Cross-region resource costs

  // Margin (confidential - Finance only)
  grossMargin: number; // totalNSR - (totalInternalCost + totalSubcontractorCost + totalOPE)
  marginPercent: number; // (grossMargin / totalNSR) × 100

  // Breakdown by region
  byRegion: CostBreakdownByRegion[];

  // Breakdown by designation
  byDesignation: CostBreakdownByDesignation[];

  // Security
  visibilityLevel: CostVisibilityLevel;
}

export interface CostBreakdownByRegion {
  region: string; // ABMY, ABSG, ABVN, etc.
  totalMandays: number;
  totalNSR: number;
  totalCost: number; // Only visible to Finance
  margin: number; // Only visible to Finance
}

export interface CostBreakdownByDesignation {
  designation: string; // Principal, Director, Manager, etc.
  count: number; // Number of resources
  totalMandays: number;
  totalNSR: number;
  averageUtilization: number; // Percentage
}

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

export interface ProjectVersionInfo {
  versionNumber: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  createdBy: string;
  reason?: string;
  allocationsCount: number;
  costingSummary?: ProjectCostingSummary;
}

export interface VersionComparisonResult {
  version1: ProjectVersionInfo;
  version2: ProjectVersionInfo;
  changes: VersionChange[];
  costImpact?: CostImpactAnalysis;
}

export interface VersionChange {
  type: 'TIMELINE' | 'ALLOCATION' | 'COSTING' | 'RESOURCE';
  description: string;
  before: unknown;
  after: unknown;
}

export interface CostImpactAnalysis {
  nsrDelta: number; // version2.NSR - version1.NSR
  nsrDeltaPercent: number;
  marginDelta: number; // version2.margin - version1.margin (Finance only)
  marginDeltaPercent: number;
  mandaysDelta: number;
  resourceCountDelta: number;
}

// ============================================================================
// RESOURCE POOLING & CAPACITY DASHBOARDS
// ============================================================================

export interface ResourcePoolingSummary {
  // Executive KPIs
  pipelineValue: number; // Total NSR of all active + presales projects
  projectCount: {
    active: number;
    presales: number;
    total: number;
  };
  overallUtilization: number; // Percentage (0-100)
  capacityHealth: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  availableCapacityPercent: number;
  hiringNeed: HiringRecommendation[];
  riskExposure: RiskAlert[];

  // Capacity Forecast (12-month)
  capacityForecast: MonthlyCapacityForecast[];

  // Resource Heatmap
  resourceHeatmap: ResourceUtilizationByDesignation[];

  // AI Recommendations
  recommendations: AIRecommendation[];
}

export interface MonthlyCapacityForecast {
  month: Date;
  demand: number; // Total FTE needed
  supply: number; // Total FTE available
  gap: number; // supply - demand (negative = shortage)
  gapPercent: number;
  criticalInsights: string[];
  actionRequired: string[];
}

export interface ResourceUtilizationByDesignation {
  designation: string;
  region: string;
  totalResources: number;
  allocated: number;
  utilization: number; // Percentage
  status: 'AVAILABLE' | 'AT_CAPACITY' | 'OVER_ALLOCATED'; // 🟢 <80%, 🟡 80-100%, 🔴 >100%
  monthByMonth: MonthlyUtilization[];
}

export interface MonthlyUtilization {
  month: Date;
  utilization: number; // Percentage
  status: 'AVAILABLE' | 'AT_CAPACITY' | 'OVER_ALLOCATED';
}

export interface HiringRecommendation {
  designation: string;
  region: string;
  count: number; // Number of hires needed
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  quarter: string; // "Q1 2026"
  rationale: string;
}

export interface RiskAlert {
  type: 'OVER_ALLOCATION' | 'SKILL_GAP' | 'TIMELINE_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedProjects: string[];
  description: string;
  impact: string;
  mitigation: string[];
}

export interface AIRecommendation {
  category: 'OPPORTUNITY' | 'RISK' | 'TREND' | 'OPTIMIZATION';
  title: string;
  description: string;
  expectedImpact: string; // e.g., "+RM 500K revenue" or "-15% costs"
  actionItems: string[];
  confidence: number; // 0-100 percentage
}

// ============================================================================
// EXPORT & PROPOSAL GENERATION
// ============================================================================

export interface ProposalExportOptions {
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'LINK';
  includeOrgChart: boolean;
  includeTimeline: boolean;
  includeCostBreakdown: boolean;
  includeResourceList: boolean;
  visibilityLevel: CostVisibilityLevel; // Controls what's shown in export
  recipientEmail?: string; // For read-only link sharing
  expiryDays?: number; // For read-only links (default: 7)
}

export interface ProposalExportResult {
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'LINK';
  downloadUrl?: string; // For PDF/Excel/PowerPoint
  shareUrl?: string; // For read-only links
  expiresAt?: Date; // For read-only links
  generatedAt: Date;
  fileSize?: number; // In bytes
}

// ============================================================================
// VALIDATION & ERROR TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: unknown;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateAllocationRequest {
  projectId: string;
  versionId?: string; // Optional, defaults to latest version
  allocations: AllocationInput[];
}

export interface CreateAllocationResponse {
  created: ResourceWeeklyAllocation[];
  conflicts: AllocationConflict[];
  warnings: AllocationWarning[];
}

export interface CalculateCostingRequest {
  projectId: string;
  versionNumber?: number; // Optional, defaults to latest
  includeSubcontractors: boolean;
  includeOPE: boolean;
}

export interface CalculateCostingResponse {
  summary: ProjectCostingSummary;
  byResource: CostCalculationResult[];
  calculatedAt: Date;
  calculatedBy: string;
}

export interface CreateVersionRequest {
  projectId: string;
  reason: string;
  portAllocations: boolean; // Auto-port compatible allocations from previous version
}

export interface CreateVersionResponse {
  version: ProjectVersionInfo;
  ported: ResourceWeeklyAllocation[];
  conflicts: AllocationConflict[];
}
