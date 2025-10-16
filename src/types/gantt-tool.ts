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
}

export interface GanttPhase {
  id: string;
  name: string;
  description?: string;
  color: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  tasks: GanttTask[];
  collapsed: boolean;
  dependencies: string[]; // Phase IDs that this phase depends on
  phaseResourceAssignments?: PhaseResourceAssignment[]; // PM resources assigned at phase level
}

export interface GanttTask {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
  dependencies: string[]; // Task IDs that this task depends on
  assignee?: string;
  progress: number; // 0-100
  resourceAssignments?: TaskResourceAssignment[]; // Assigned resources
}

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
  type: 'public' | 'company' | 'custom';
}

export interface GanttViewSettings {
  zoomLevel: 'day' | 'week' | 'month' | 'quarter' | 'half-year' | 'year';
  showWeekends: boolean;
  showHolidays: boolean;
  showMilestones: boolean;
  showTaskDependencies: boolean;
  showCriticalPath: boolean;
  showTitles?: boolean; // Phase/task title display mode (default: true = visible)
  barDurationDisplay?: 'wd' | 'cd' | 'resource' | 'dates' | 'all' | 'clean'; // What to show on bars (default: 'all')
  timelineStart?: string; // Override project start date for viewport
  timelineEnd?: string; // Override calculated end date for viewport
}

// UI State Types
export interface DragState {
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemType: 'phase' | 'task' | 'milestone' | null;
  dragMode: 'move' | 'resize-start' | 'resize-end' | null;
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
  selectedItemType: 'phase' | 'task' | 'milestone' | null;
}

export interface SidePanelState {
  isOpen: boolean;
  mode: 'view' | 'add' | 'edit';
  itemType: 'phase' | 'task' | 'milestone' | 'holiday' | null;
  itemId?: string;
}

// Form Types for Adding/Editing Items
export interface PhaseFormData {
  name: string;
  description?: string;
  color: string;
  startDate: string;
  endDate: string;
}

export interface TaskFormData {
  name: string;
  description?: string;
  phaseId: string;
  startDate: string;
  endDate: string;
  assignee?: string;
  dependencies?: string[];
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
  type: 'public' | 'company' | 'custom';
}

// Export Types
export type ExportFormat = 'png' | 'pdf' | 'excel' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeHolidays: boolean;
  includeMilestones: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

// Color Presets
export const PHASE_COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
] as const;

export const MILESTONE_COLOR_PRESETS = [
  '#10B981', // Green (Start/Success)
  '#3B82F6', // Blue (Milestone)
  '#F59E0B', // Orange (Warning)
] as const;

// Resource Management Types
export type ResourceCategory = 'leadership' | 'functional' | 'technical' | 'basis' | 'security' | 'pm' | 'change' | 'qa' | 'other';
export type ResourceDesignation = 'principal' | 'director' | 'senior_manager' | 'manager' | 'senior_consultant' | 'consultant' | 'analyst' | 'subcontractor';

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

  // Cost tracking fields
  rateType?: 'hourly' | 'daily' | 'fixed'; // Billing model
  hourlyRate?: number; // Hourly rate in project currency
  dailyRate?: number; // Daily rate in project currency
  currency?: string; // Currency code (USD, EUR, GBP, etc.)
  utilizationTarget?: number; // Target utilization percentage (0-100)
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
export const RESOURCE_CATEGORIES: Record<ResourceCategory, { label: string; color: string; icon: string }> = {
  leadership: { label: 'Leadership', color: '#D97706', icon: '🎯' },
  functional: { label: 'Functional', color: '#3B82F6', icon: '📘' },
  technical: { label: 'Technical', color: '#8B5CF6', icon: '🔧' },
  basis: { label: 'Basis/Infrastructure', color: '#10B981', icon: '🏗️' },
  security: { label: 'Security & Authorization', color: '#EF4444', icon: '🔒' },
  pm: { label: 'Project Management', color: '#F59E0B', icon: '📊' },
  change: { label: 'Change Management', color: '#EC4899', icon: '🔄' },
  qa: { label: 'Quality Assurance', color: '#06B6D4', icon: '✅' },
  other: { label: 'Other/General', color: '#64748B', icon: '👤' },
};

export const RESOURCE_DESIGNATIONS: Record<ResourceDesignation, string> = {
  principal: 'Principal',
  director: 'Director',
  senior_manager: 'Senior Manager',
  manager: 'Manager',
  senior_consultant: 'Senior Consultant',
  consultant: 'Consultant',
  analyst: 'Analyst',
  subcontractor: 'SubContractor',
};

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
  type: 'warning' | 'critical';
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
