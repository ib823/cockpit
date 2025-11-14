/**
 * Gantt Tool - Type Definitions
 *
 * Standalone Gantt chart tool for creating professional timeline visualizations.
 * Features: Phases, Tasks, Milestones, Holidays, Drag-and-drop, Export to PNG/Excel/PDF
 */

export interface GanttProject {
  id: string;
  name: string;
  description?: string;
  startDate: string; // ISO 8601 format
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
    [key: string]: any; // Other org chart data
  };
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
  currency?: string; // Currency code (USD, EUR, GBP, etc.)
  utilizationTarget?: number; // Target utilization percentage (0-100)

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
