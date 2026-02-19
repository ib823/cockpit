/**
 * Gantt Tool - Type Definitions
 *
 * UNIFIED PROJECT MODEL (Phase 1 Complete):
 * One project entity that can be viewed as Timeline OR Architecture
 * - Timeline view: Gantt chart with phases, tasks, milestones
 * - Architecture view: Business context, AS-IS/TO-BE diagrams
 *
 * Features: Phases, Tasks, Milestones, Holidays, Drag-and-drop, Export to PNG/Excel/PDF
 */

// Architecture type imports for unified project model
import type {
  BusinessContextData,
  CurrentLandscapeData,
  ProposedSolutionData,
  DiagramSettings,
} from '@/app/architecture/v3/types';

// Explicit peer relationship in org chart
// Created when user drags a resource and drops it on LEFT/RIGHT zone of another resource
export interface PeerLink {
  id: string; // Unique ID for the link
  resource1Id: string; // First resource ID
  resource2Id: string; // Second resource ID (order doesn't matter)
  createdAt: string; // When this peer link was created
}

/**
 * Unified Project Model - combines Timeline and Architecture data
 * Apple UX: "One project, multiple perspectives"
 */
export interface GanttProject {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO 8601 format

  // TIMELINE DATA (existing)
  phases: GanttPhase[];
  milestones: GanttMilestone[];
  holidays: GanttHoliday[];
  resources: Resource[]; // Resource library for this project
  viewSettings: GanttViewSettings;
  createdAt: string;
  updatedAt: string;

  // Budget and cost tracking
  budget?: ProjectBudget;

  // Organization chart data
  orgChartPro?: {
    companyLogos?: Record<string, string>; // company name -> base64 logo URL
    selectedLogoCompanyName?: string; // Currently selected logo to display
    peerLinks?: PeerLink[]; // Explicit peer relationships (only appear when user creates them via drag-drop)
    [key: string]: any; // Other org chart data
  };

  // ARCHITECTURE DATA (Phase 1: Unified Project Model)
  // Enable viewing same project as architecture diagrams
  businessContext?: BusinessContextData; // Business entities, actors, capabilities
  currentLandscape?: CurrentLandscapeData; // AS-IS systems and integrations
  proposedSolution?: ProposedSolutionData; // TO-BE solution architecture
  diagramSettings?: DiagramSettings; // Visual styling for diagrams
  architectureVersion?: string; // Track architecture version (e.g., "1.0")
  lastArchitectureEdit?: string; // ISO 8601 timestamp of last architecture update
}

export interface RACIAssignment {
  id: string;
  resourceId: string;
  role: "responsible" | "accountable" | "consulted" | "informed";
}

export interface GanttPhase {
  id: string;
  name: string;
  description?: string;
  deliverables?: string; // Optional deliverables description
  color: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  tasks: GanttTask[];
  collapsed: boolean;
  dependencies: string[]; // Phase IDs that this phase depends on
  phaseResourceAssignments?: PhaseResourceAssignment[]; // PM resources assigned at phase level
  raciAssignments?: RACIAssignment[]; // RACI matrix assignments for this phase
  order: number; // Display order of phases
  phaseType?: "standard" | "ams"; // Phase type: standard project phase or AMS (Application Management Services)
  amsDuration?: 1 | 2 | 3; // AMS duration in years (only applicable for AMS phases)
}

export interface GanttTask {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  deliverables?: string; // Optional deliverables description
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  dependencies: string[]; // Task IDs that this task depends on
  assignee?: string;
  progress: number; // 0-100
  resourceAssignments?: TaskResourceAssignment[]; // Assigned resources
  raciAssignments?: RACIAssignment[]; // RACI matrix assignments for this task
  order: number; // Display order of tasks within phase

  // Task Hierarchy (Work Breakdown Structure)
  parentTaskId?: string | null; // ID of parent task (null for top-level tasks)
  level: number; // Nesting level (0 = top-level, 1 = first level subtask, etc.)
  collapsed: boolean; // UI state: if true, children are hidden
  isParent: boolean; // True if this task has child tasks
  childTasks?: GanttTask[]; // Child tasks (populated when needed)

  // AMS (Application Maintenance & Support) Configuration
  isAMS?: boolean; // Flag indicating this is an AMS task
  amsConfig?: {
    rateType: "daily" | "manda"; // Costing rate type
    fixedRate: number; // Fixed rate amount
    isOngoing: true; // AMS tasks are always ongoing
    minimumDuration?: number; // Minimum subscription duration in months (e.g., 12)
    notes?: string; // Additional AMS-specific notes
  };

  // Strategic Planning Metadata (for RACI context and governance)
  priority?: "high" | "medium" | "low"; // Timeline priority level
  isCritical?: boolean; // Critical path - blocks go-live if delayed
  estimatedEffort?: number; // Estimated working days (for resource planning and cost estimation)
  requiredSkillCategories?: ResourceCategory[]; // Skills needed for this task (for skill matching in RACI)
}

// Type aliases for convenience
export type Phase = GanttPhase;
export type Task = GanttTask;

export interface GanttMilestone {
  id: string;
  name: string;
  description?: string;
  date: string; // ISO 8601 format
  icon: string;
  color: string;
}

export interface GanttHoliday {
  id: string;
  name: string;
  date: string; // ISO 8601 format
  region: string;
  type: "public" | "company" | "custom";
}

export interface GanttViewSettings {
  zoomLevel: "day" | "week" | "month" | "quarter" | "half-year" | "year";
  showWeekends: boolean;
  showHolidays: boolean;
  showMilestones: boolean;
  showTaskDependencies: boolean;
  showCriticalPath: boolean;
  showTitles?: boolean; // Phase/task title display mode (default: true = visible)
  barDurationDisplay?: "wd" | "cd" | "resource" | "dates" | "all" | "clean"; // What to show on bars (default: 'all')
  timelineStart?: string; // Override project start date for viewport
  timelineEnd?: string; // Override calculated end date for viewport
}

// UI State Types
export interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemType: "phase" | "task" | "milestone" | null;
  dragMode: "move" | "resize-start" | "resize-end" | null;
  startX: number;
  startY: number;
  ghostElement?: {
    x: number;
    y: number;
    width: number;
  };
}

export interface SelectionState {
  selectedItemId: string | null;
  selectedItemType: "phase" | "task" | "milestone" | null;
}

export interface SidePanelState {
  isOpen: boolean;
  mode: "view" | "add" | "edit";
  itemType: "phase" | "task" | "milestone" | "holiday" | null;
  itemId?: string;
}

// Form Types for Adding/Editing Items
export interface PhaseFormData {
  name: string;
  description?: string;
  deliverables?: string;
  color: string;
  startDate: string;
  endDate: string;
  phaseType?: "standard" | "ams";
  amsDuration?: 1 | 2 | 3;
}

export interface TaskFormData {
  name: string;
  description?: string;
  deliverables?: string;
  phaseId: string;
  startDate: string;
  endDate: string;
  assignee?: string;
  dependencies?: string[];
  parentTaskId?: string | null;

  // AMS Configuration
  isAMS?: boolean;
  amsRateType?: "daily" | "manda";
  amsFixedRate?: number;
  amsMinimumDuration?: number;
  amsNotes?: string;

  // Strategic Planning
  priority?: "high" | "medium" | "low";
  isCritical?: boolean;
  estimatedEffort?: number;
  requiredSkillCategories?: ResourceCategory[];
}

export interface MilestoneFormData {
  name: string;
  description?: string;
  date: string;
  icon: string;
  color: string;
}

export interface HolidayFormData {
  name: string;
  date: string;
  region: string;
  type: "public" | "company" | "custom";
}

// Export Types
export type ExportFormat = "png" | "pdf" | "excel" | "json";

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeHolidays: boolean;
  includeMilestones: boolean;
  paperSize?: "A4" | "A3" | "Letter";
  orientation?: "portrait" | "landscape";
}

// Enhanced Export Configuration for Optimized Snapshots
export type ExportSizePreset = "presentation" | "document" | "print" | "custom";
export type ExportQuality = "standard" | "high" | "print";

export interface EnhancedExportConfig {
  // Format and quality
  format: "png" | "pdf" | "svg";
  quality: ExportQuality; // standard=150dpi, high=225dpi, print=300dpi

  // Size presets for consistency
  sizePreset: ExportSizePreset;
  customWidth?: number; // in pixels (only for custom preset)
  customHeight?: number; // in pixels (only for custom preset)

  // Phase filtering
  exportScope: "all" | "selected-phases";
  selectedPhaseIds?: string[]; // Required when exportScope is 'selected-phases'

  // Content optimization
  contentOptions: {
    hideUIControls: boolean; // Hide buttons, handles, etc.
    hidePhaseNames: boolean; // Hide phase titles above bars
    hideTaskNames: boolean; // Hide task names on bars
    showOnlyBars: boolean; // Minimal view - just bars and timeline
    includeLegend: boolean; // Add phase/task legend
    includeHeader: boolean; // Project name and date range
    includeFooter: boolean; // Export metadata (date, page numbers)
  };

  // Spacing and margins
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Background and styling
  backgroundColor: string;
  transparentBackground: boolean;
}

// Export Size Presets (in pixels at 72 DPI baseline)
export const EXPORT_SIZE_PRESETS: Record<
  ExportSizePreset,
  { width: number; height: number; description: string }
> = {
  presentation: {
    width: 1920,
    height: 1080,
    description: "PowerPoint/Google Slides (16:9)",
  },
  document: {
    width: 2100,
    height: 1400,
    description: "Word/PDF Documents (3:2)",
  },
  print: {
    width: 3300,
    height: 2550,
    description: "Print A4 Landscape (300 DPI)",
  },
  custom: {
    width: 1920,
    height: 1080,
    description: "Custom dimensions",
  },
};

// Export Quality Settings (DPI scale multipliers)
export const EXPORT_QUALITY_SETTINGS: Record<
  ExportQuality,
  { scale: number; description: string }
> = {
  standard: { scale: 2, description: "150 DPI - Good for screen viewing" },
  high: { scale: 3, description: "225 DPI - High quality for presentations" },
  print: { scale: 4, description: "300 DPI - Print quality" },
};

// Default Export Configuration
export const DEFAULT_EXPORT_CONFIG: EnhancedExportConfig = {
  format: "png",
  quality: "high",
  sizePreset: "presentation",
  exportScope: "all",
  contentOptions: {
    hideUIControls: true,
    hidePhaseNames: false,
    hideTaskNames: false,
    showOnlyBars: false,
    includeLegend: false,
    includeHeader: true,
    includeFooter: false,
  },
  padding: {
    top: 40,
    right: 40,
    bottom: 40,
    left: 40,
  },
  backgroundColor: "#ffffff",
  transparentBackground: false,
};

// Color Presets
export const PHASE_COLOR_PRESETS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Orange
] as const;

export const MILESTONE_COLOR_PRESETS = [
  "#10B981", // Green (Start/Success)
  "#3B82F6", // Blue (Milestone)
  "#F59E0B", // Orange (Warning)
] as const;

// Resource Management Types
export type ResourceCategory =
  | "leadership"
  | "functional"
  | "technical"
  | "basis"
  | "security"
  | "pm"
  | "change"
  | "qa"
  | "other";
export type ResourceDesignation =
  | "principal"
  | "director"
  | "senior_manager"
  | "manager"
  | "senior_consultant"
  | "consultant"
  | "analyst"
  | "subcontractor";

export interface Resource {
  id: string;
  name: string; // Role name (not person name)
  category: ResourceCategory;
  description: string; // Role description
  designation: ResourceDesignation;
  createdAt: string;

  // Organization hierarchy fields
  managerResourceId?: string | null; // ID of manager resource (reporting relationship)
  email?: string; // Contact email for this resource
  department?: string; // Department or team name
  location?: string; // Physical or virtual location
  projectRole?: string; // Specific role on this project (optional override)
  companyName?: string; // Company/organization affiliation (for multi-stakeholder projects)

  // Assignment level control
  assignmentLevel: "phase" | "task" | "both"; // Where this resource can be assigned

  // Cost tracking fields
  isBillable: boolean; // Whether this resource is billable to client
  chargeRatePerHour: number; // Hourly billing rate in project currency
  currency?: string; // Currency code (USD, EUR, GBP, MYR, etc.) - Default: "MYR"
  utilizationTarget?: number; // Target utilization percentage (0-100)
  regionCode?: string; // Multi-region support (ABMY, ABSG, ABVN, ABTH, etc.)

  // Deprecated fields (kept for backward compatibility during migration)
  rateType?: "hourly" | "daily" | "fixed"; // DEPRECATED: Use chargeRatePerHour instead
  hourlyRate?: number; // DEPRECATED: Use chargeRatePerHour instead
  dailyRate?: number; // DEPRECATED: Use chargeRatePerHour instead
}

export interface TaskResourceAssignment {
  id: string;
  resourceId: string;
  assignmentNotes: string; // What they do on THIS specific task
  allocationPercentage: number; // Percentage of task duration (0-100)
  assignedAt: string;
}

export interface PhaseResourceAssignment {
  id: string;
  resourceId: string;
  assignmentNotes: string; // What they oversee for THIS phase
  allocationPercentage: number; // Percentage of phase duration (0-100)
  assignedAt: string;
}

export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  conflictingTaskId: string;
  conflictingTaskName: string;
  conflictStartDate: string;
  conflictEndDate: string;
}

// Resource Form Data
export interface ResourceFormData {
  name: string;
  category: ResourceCategory;
  description: string;
  designation: ResourceDesignation;
  managerResourceId?: string | null;
  email?: string;
  department?: string;
  location?: string;
  projectRole?: string;
  companyName?: string; // Company/organization affiliation (for multi-stakeholder projects)

  // Assignment and billing configuration
  assignmentLevel: "phase" | "task" | "both";
  isBillable: boolean;
  chargeRatePerHour: number;
  currency?: string;
  utilizationTarget?: number;
  regionCode?: string; // Multi-region support
}

// Utility Types
export type DateString = string; // ISO 8601
export type ColorHex = string; // #RRGGBB

// Calculate working days between two dates (excluding weekends and holidays)
export interface WorkingDaysCalculation {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
}

// Resource Category Labels and Colors
/**
 * Resource Categories - Simplified Color System (Jobs/Ive Principle)
 *
 * Icons provide visual distinction, colors are semantic by skill level:
 * - Leadership/Management: Purple (#7E22CE) - Strategic roles
 * - Technical/Delivery: Blue (#2563EB) - Execution roles
 * - Support/Other: Gray (#6B7280) - General roles
 *
 * This eliminates arbitrary colors (orange, pink, cyan) and ensures
 * colors have meaning rather than decoration.
 */
export const RESOURCE_CATEGORIES: Record<
  ResourceCategory,
  { label: string; color: string; icon: string }
> = {
  leadership: { label: "Leadership", color: "#7E22CE", icon: "🎯" }, // Purple - Strategic
  pm: { label: "Project Management", color: "#7E22CE", icon: "📊" }, // Purple - Strategic
  change: { label: "Change Management", color: "#7E22CE", icon: "🔄" }, // Purple - Strategic
  functional: { label: "Functional", color: "#2563EB", icon: "📘" }, // Blue - Technical
  technical: { label: "Technical", color: "#2563EB", icon: "🔧" }, // Blue - Technical
  basis: { label: "Basis/Infrastructure", color: "#2563EB", icon: "🏗️" }, // Blue - Technical
  security: { label: "Security & Authorization", color: "#2563EB", icon: "🔒" }, // Blue - Technical
  qa: { label: "Quality Assurance", color: "#2563EB", icon: "✅" }, // Blue - Technical
  other: { label: "Other/General", color: "#6B7280", icon: "👤" }, // Gray - Support
};

export const RESOURCE_DESIGNATIONS: Record<ResourceDesignation, string> = {
  principal: "Principal",
  director: "Director",
  senior_manager: "Senior Manager",
  manager: "Manager",
  senior_consultant: "Senior Consultant",
  consultant: "Consultant",
  analyst: "Analyst",
  subcontractor: "SubContractor",
};

// Assignment Level Configuration
export const ASSIGNMENT_LEVELS = {
  phase: {
    label: "Phase Level Only",
    description: "Can only be assigned to phases for oversight/coordination",
  },
  task: { label: "Task Level Only", description: "Can only be assigned to tasks for execution" },
  both: { label: "Phase & Task Levels", description: "Can be assigned to both phases and tasks" },
} as const;

export type AssignmentLevel = keyof typeof ASSIGNMENT_LEVELS;

// Budget and Cost Tracking Types
export interface ProjectBudget {
  totalBudget: number; // Total budget amount
  currency: string; // Currency code (USD, EUR, GBP, etc.)
  budgetAlerts: BudgetAlert[]; // Alert thresholds
  contingencyPercentage: number; // Contingency reserve (0-100)
  approvedBy?: string; // Who approved the budget
  approvedAt?: string; // When was it approved
  baselineDate?: string; // Budget baseline date
}

export interface BudgetAlert {
  id: string;
  threshold: number; // Percentage of budget (0-100)
  type: "warning" | "critical";
  triggered: boolean;
  triggeredAt?: string;
  message?: string;
}

export interface CostCalculation {
  totalCost: number; // Total calculated cost
  laborCost: number; // Cost from resource assignments
  contingency: number; // Contingency reserve amount
  remainingBudget: number; // Budget - Total Cost
  budgetUtilization: number; // Percentage of budget used (0-100)
  costByPhase: Map<string, number>; // Cost per phase
  costByResource: Map<string, number>; // Cost per resource
  costByCategory: Map<ResourceCategory, number>; // Cost per category
  isOverBudget: boolean;
  variance: number; // Budget - Actual Cost (negative = over budget)
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  // Scenario-specific resource rate overrides
  resourceRateOverrides: Map<string, { hourlyRate?: number; dailyRate?: number }>;
  // Scenario-specific allocation overrides
  allocationOverrides: Map<string, number>; // Task/Resource assignment ID -> new allocation %
  // Calculated results
  projectedCost?: number;
  costDifference?: number; // vs baseline
  budgetUtilization?: number;
}

// ============================================================================
// TEAM CAPACITY & PROPOSAL ENGINE TYPES
// ============================================================================

/**
 * Allocation Pattern Types
 * - STEADY: Constant percentage throughout the phase
 * - CUSTOM: Week-by-week manual allocation (future)
 */
export type AllocationPattern = "STEADY" | "CUSTOM";

/**
 * Distribution Pattern Types for Intent-Driven Allocation
 * Defines how total effort is spread across the allocation period
 */
export type DistributionPattern =
  | "STEADY"      // Flat line - equal effort each week
  | "FRONT_LOAD"  // Heavy start (70% first half), taper off
  | "BACK_LOAD"   // Light start, ramp up (70% second half)
  | "BELL_CURVE"  // Peak in middle, taper at ends
  | "RAMP_UP"     // Linear increase from min to max
  | "RAMP_DOWN"   // Linear decrease from max to min
  | "CUSTOM";     // Manual week-by-week control

/**
 * Distribution Pattern Configuration
 * Metadata for UI display and algorithm selection
 */
export const DISTRIBUTION_PATTERNS: Record<
  DistributionPattern,
  { label: string; description: string; curve: number[] }
> = {
  STEADY: {
    label: "Steady",
    description: "Equal effort each week",
    curve: [1, 1, 1, 1, 1, 1, 1, 1], // Normalized weights
  },
  FRONT_LOAD: {
    label: "Front Load",
    description: "Heavy start, taper off",
    curve: [1, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2],
  },
  BACK_LOAD: {
    label: "Back Load",
    description: "Light start, ramp up",
    curve: [0.2, 0.3, 0.4, 0.5, 0.7, 0.8, 0.9, 1],
  },
  BELL_CURVE: {
    label: "Bell Curve",
    description: "Peak in middle",
    curve: [0.3, 0.5, 0.8, 1, 1, 0.8, 0.5, 0.3],
  },
  RAMP_UP: {
    label: "Ramp Up",
    description: "Linear increase",
    curve: [0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0.95, 1],
  },
  RAMP_DOWN: {
    label: "Ramp Down",
    description: "Linear decrease",
    curve: [1, 0.95, 0.9, 0.8, 0.65, 0.5, 0.35, 0.2],
  },
  CUSTOM: {
    label: "Custom",
    description: "Manual week-by-week",
    curve: [1, 1, 1, 1, 1, 1, 1, 1],
  },
};

/**
 * Intensity Level - Quick presets for allocation density
 */
export type IntensityLevel = "light" | "medium" | "heavy" | "full";

export const INTENSITY_LEVELS: Record<
  IntensityLevel,
  { label: string; maxDaysPerWeek: number; description: string }
> = {
  light: { label: "Light", maxDaysPerWeek: 1.5, description: "1-1.5 days/week" },
  medium: { label: "Medium", maxDaysPerWeek: 3, description: "2-3 days/week" },
  heavy: { label: "Heavy", maxDaysPerWeek: 4, description: "3-4 days/week" },
  full: { label: "Full-time", maxDaysPerWeek: 5, description: "5 days/week" },
};

/**
 * Resource Intent - Declarative resource allocation at project level
 * User declares "what" they need, system figures out "how" to distribute
 */
export interface ResourceIntent {
  id: string;
  projectId: string;
  resourceId: string;

  // Intent declaration
  totalEffortDays: number; // Total days needed (e.g., 40 days)
  distributionPattern: DistributionPattern;
  intensityLevel: IntensityLevel;

  // Time constraints
  startWeek: string; // ISO week format "2025-W03"
  endWeek: string; // ISO week format "2025-W15"
  maxDaysPerWeek: number; // Cap per week (default from intensity)

  // Generation state
  isGenerated: boolean; // True once allocations are generated
  generatedAt?: string; // ISO timestamp of last generation
  manualOverrides: number; // Count of weeks manually adjusted after generation

  // Calculated preview (before generation)
  previewWeeklyDays?: number[]; // Preview of distribution

  // Audit
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Intent Generation Result - Output from distribution algorithm
 */
export interface IntentGenerationResult {
  success: boolean;
  weeklyAllocations: Array<{
    weekIdentifier: string;
    weekStartDate: string;
    allocationDays: number;
    allocationPercent: number;
  }>;
  totalDaysAllocated: number;
  warnings?: string[]; // e.g., "Capped at 5 days in week 5"
}

/**
 * Visual Allocation Bar - For timeline view (Phase 2)
 * Represents a resource's allocation as a draggable bar
 */
export interface VisualAllocationBar {
  id: string;
  resourceId: string;
  resourceName: string;

  // Time span
  startWeek: string; // "2025-W03"
  endWeek: string; // "2025-W15"
  durationWeeks: number;

  // Intensity metrics
  totalEffortDays: number;
  avgDaysPerWeek: number;
  peakDaysPerWeek: number;
  intensityLevel: IntensityLevel;

  // Visual properties (derived)
  barColor: string;
  barHeight: number; // 0-100% based on intensity

  // Source tracking
  sourceIntentId?: string; // If generated from intent
  hasManualOverrides: boolean;

  // Underlying data reference
  weeklyAllocationIds: string[];
}

/**
 * Resource Weekly Allocation - Week-by-week resource allocation detail
 * Critical for cross-project conflict detection and capacity planning
 */
export interface ResourceWeeklyAllocation {
  id: string;
  projectId: string;
  resourceId: string;

  // Week identification (ISO 8601 format: "2025-W03")
  weekIdentifier: string; // ISO week format for storage
  weekStartDate: string; // Monday of the week (ISO 8601)
  weekEndDate: string; // Sunday of the week (ISO 8601)

  // Allocation data (0-100% of resource capacity)
  allocationPercent: number; // 0-100 percentage
  workingDays: number; // Calculated: allocationPercent * 5 / 100

  // Source tracking (for pattern regeneration)
  sourcePhaseId?: string; // Which phase this allocation belongs to
  sourcePattern?: AllocationPattern; // "STEADY" | "CUSTOM"
  isManualOverride: boolean; // True if user manually edited

  // Audit fields
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Resource Rate Lookup - Multi-region, multi-designation hourly rates
 * Supports forex conversion and effective date ranges
 */
export interface ResourceRateLookup {
  id: string;

  // Rate identification
  regionCode: string; // "ABMY", "ABSG", "ABVN", "ABTH", etc.
  designation: string; // "Principal", "Director", "Manager", etc.

  // Rate data
  hourlyRate: number; // In local currency
  localCurrency: string; // "MYR", "SGD", "VND", "THB"

  // Forex conversion to base currency (MYR)
  forexRate: number; // Conversion rate to MYR
  baseCurrency: string; // Default: "MYR"

  // Effective date range (for rate history)
  effectiveFrom: string; // ISO 8601 date
  effectiveTo?: string; // ISO 8601 date (null = current active rate)

  // Audit fields
  createdAt: string;
  updatedAt: string;
  updatedBy?: string; // Admin user ID who set this rate
}

/**
 * Project Costing - Calculated revenue, costs, and margin analysis
 * CONFIDENTIAL: Access restricted to Finance team via RBAC
 */
export interface ProjectCosting {
  id: string;
  projectId: string; // One-to-one with GanttProject

  // Revenue calculations
  grossServiceRevenue: number; // GSR = Total Std Rate × Days
  realizationRate: number; // RR = e.g., 0.43 (43%)
  commercialRate: number; // Commercial = GSR × RR
  netServiceRevenue: number; // NSR = Commercial × Days (actual billable)

  // Cost breakdown (MANUAL ENTRY - not auto-calculated for confidentiality)
  internalCost: number; // PartnerCo resources (manual entry)
  subcontractorCost: number; // External vendors (manual entry)
  outOfPocketExpense: number; // OPE - travel, onsite, etc.

  // Margin analysis
  totalCost: number; // Internal + Subcon + OPE
  grossMargin: number; // NSR - TotalCost
  marginPercentage: number; // (GrossMargin / NSR) × 100

  // Currency
  baseCurrency: string; // Default: "MYR"

  // Snapshot metadata
  calculatedAt: string; // ISO 8601 timestamp
  calculatedBy?: string; // User ID (must have Finance role)
  version: number; // Links to project version
}

/**
 * Out of Pocket Expense - Monthly breakdown of onsite costs
 * Tracks flights, hotel, parking, mileage per resource per month
 */
export interface OutOfPocketExpense {
  id: string;
  projectId: string;
  resourceId: string;

  // Time period (monthly aggregation)
  month: string; // First day of month (ISO 8601: "2026-01-01")

  // OPE calculation inputs
  totalMandays: number; // Total days worked this month
  onsitePercentage: number; // 0-100% of time spent onsite
  onsiteDays: number; // totalMandays × onsitePercentage / 100

  // Cost components (from Excel Auto_OPE structure)
  flightCount: number; // Number of return trips
  flightRate: number; // Cost per return trip
  totalFlightCost: number;

  hotelRate: number; // Cost per night
  totalHotelCost: number; // hotelRate × onsiteDays

  parkingTollRate: number; // Cost per day
  totalParkingTollCost: number; // parkingTollRate × onsiteDays

  mileageRate: number; // Cost per km
  mileageKm: number; // Total km traveled
  totalMileageCost: number; // mileageRate × mileageKm

  // Total OPE for this resource this month
  totalOPECost: number; // Sum of all components

  // Audit fields
  createdAt: string;
  updatedAt: string;
}

/**
 * Enhanced Phase Resource Assignment with allocation pattern support
 */
export interface EnhancedPhaseResourceAssignment extends PhaseResourceAssignment {
  allocationPattern?: AllocationPattern; // "STEADY" | "CUSTOM"
  assignedBy?: string; // User ID who created this assignment
  updatedAt?: string; // When this assignment was last updated
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrates a legacy resource to the new schema with assignmentLevel, isBillable, and chargeRatePerHour
 * This ensures backward compatibility when loading old project data
 */
export function migrateResourceToNewSchema(resource: any): Resource {
  // Determine assignment level based on category (PM can assign to both, others only tasks)
  const assignmentLevel: AssignmentLevel = resource.category === "pm" ? "both" : "task";

  // Calculate chargeRatePerHour from legacy fields
  let chargeRatePerHour = 0;
  if (resource.hourlyRate !== undefined && resource.hourlyRate !== null) {
    chargeRatePerHour = resource.hourlyRate;
  } else if (resource.dailyRate !== undefined && resource.dailyRate !== null) {
    // Convert daily rate to hourly (assuming 8-hour workday)
    chargeRatePerHour = resource.dailyRate / 8;
  }

  // Default to billable unless explicitly set
  const isBillable = resource.isBillable !== undefined ? resource.isBillable : true;

  return {
    ...resource,
    assignmentLevel: resource.assignmentLevel || assignmentLevel,
    isBillable: resource.isBillable !== undefined ? resource.isBillable : isBillable,
    chargeRatePerHour: resource.chargeRatePerHour || chargeRatePerHour,
  };
}

/**
 * Helper function to check if a resource can be assigned to a phase
 */
export function canAssignToPhase(resource: Resource): boolean {
  return resource.assignmentLevel === "phase" || resource.assignmentLevel === "both";
}

/**
 * Helper function to check if a resource can be assigned to a task
 */
export function canAssignToTask(resource: Resource): boolean {
  return resource.assignmentLevel === "task" || resource.assignmentLevel === "both";
}

/**
 * Helper function to get formatted rate display
 */
export function getFormattedRate(resource: Resource): string {
  if (!resource.isBillable) {
    return "Non-billable";
  }
  return `${resource.chargeRatePerHour.toFixed(4)}x`;
}

// ============================================
// Delta Save Types - Phase 2 Optimization
// ============================================

/**
 * Delta changes for incremental saves
 * Only contains entities that were created, updated, or deleted
 */
export interface ProjectDelta {
  // Project-level updates (only changed fields)
  projectUpdates?: {
    name?: string;
    description?: string;
    startDate?: string;
    viewSettings?: GanttViewSettings;
    budget?: ProjectBudget;
    orgChart?: any;
  };

  // Phase changes
  phases?: {
    created?: GanttPhase[];
    updated?: GanttPhase[];
    deleted?: string[]; // Phase IDs
  };

  // Task changes (can be from any phase)
  tasks?: {
    created?: GanttTask[];
    updated?: GanttTask[];
    deleted?: string[]; // Task IDs
  };

  // Resource changes
  resources?: {
    created?: Resource[];
    updated?: Resource[];
    deleted?: string[]; // Resource IDs
  };

  // Milestone changes
  milestones?: {
    created?: GanttMilestone[];
    updated?: GanttMilestone[];
    deleted?: string[]; // Milestone IDs
  };

  // Holiday changes
  holidays?: {
    created?: GanttHoliday[];
    updated?: GanttHoliday[];
    deleted?: string[]; // Holiday IDs
  };
}

/**
 * Track entity state for delta computation
 */
export interface EntityTracker {
  created: Set<string>; // IDs of newly created entities
  updated: Set<string>; // IDs of modified entities
  deleted: Set<string>; // IDs of deleted entities
}
