export type AllocationPattern = "STEADY" | "RAMP_UP" | "RAMP_DOWN" | "RAMP_UP_DOWN" | "CUSTOM";

export interface ResourceAllocation {
  id: string;
  resourceName: string;
  designation: string;
  phaseId: string;
  phaseName: string;
  totalDays: number;
  averagePerWeek: number;
  pattern: AllocationPattern;
  weeklyBreakdown: WeeklyAllocation[];
  status: "draft" | "allocated" | "conflict";
  notes?: string;
}

export interface WeeklyAllocation {
  weekNumber: number;
  weekLabel: string;
  dateRange: string;
  days: number;
  percentage: number;
  workingDays: number;
  notes?: string;
}

export interface Phase {
  id: string;
  name: string;
  weekStart: number;
  weekEnd: number;
  totalWeeks: number;
  dateRange: string;
  allocations: ResourceAllocation[];
  totalDays: number;
  resourceCount: number;
  conflicts: number;
  warnings: number;
}

export interface ConflictInfo {
  id: string;
  type: "ERROR" | "WARNING";
  resourceName: string;
  weeks: string[];
  description: string;
  suggestedFixes: string[];
}

export interface ProjectSummary {
  name: string;
  totalWeeks: number;
  totalDays: number;
  resourceCount: number;
  phases: Phase[];
  errors: number;
  warnings: number;
}
