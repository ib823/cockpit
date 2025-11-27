import type { Phase, ProjectSummary, ResourceAllocation, WeeklyAllocation } from "./types";

// Generate weekly breakdown for STEADY pattern
function generateSteadyWeeks(weekStart: number, weekEnd: number, daysPerWeek: number): WeeklyAllocation[] {
  const weeks: WeeklyAllocation[] = [];
  const totalWeeks = weekEnd - weekStart + 1;

  for (let i = 0; i < totalWeeks; i++) {
    const weekNum = weekStart + i;
    const date = new Date(2026, 0, 6 + (weekNum - 1) * 7);
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    weeks.push({
      weekNumber: weekNum,
      weekLabel: `W${weekNum}`,
      dateRange: `${dateStr}-${endDateStr}`,
      days: daysPerWeek,
      percentage: (daysPerWeek / 5) * 100,
      workingDays: 5,
    });
  }

  return weeks;
}

// Generate weekly breakdown for RAMP_UP pattern
function generateRampUpWeeks(weekStart: number, weekEnd: number, totalDays: number): WeeklyAllocation[] {
  const weeks: WeeklyAllocation[] = [];
  const totalWeeks = weekEnd - weekStart + 1;

  // Exponential ramp from 1d to 5d
  const distribution = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5];

  for (let i = 0; i < totalWeeks; i++) {
    const weekNum = weekStart + i;
    const date = new Date(2026, 0, 6 + (weekNum - 1) * 7);
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const days = distribution[i] || 5;

    weeks.push({
      weekNumber: weekNum,
      weekLabel: `W${weekNum}`,
      dateRange: `${dateStr}-${endDateStr}`,
      days,
      percentage: (days / 5) * 100,
      workingDays: 5,
    });
  }

  return weeks;
}

// Sample allocations for Phase 1
const phase1Allocations: ResourceAllocation[] = [
  {
    id: "alloc-1",
    resourceName: "Project Manager",
    designation: "Manager",
    phaseId: "phase-1",
    phaseName: "Infrastructure",
    totalDays: 20,
    averagePerWeek: 5,
    pattern: "STEADY",
    weeklyBreakdown: generateSteadyWeeks(1, 4, 5),
    status: "allocated",
  },
  {
    id: "alloc-2",
    resourceName: "Solution Architect",
    designation: "Senior Manager",
    phaseId: "phase-1",
    phaseName: "Infrastructure",
    totalDays: 10,
    averagePerWeek: 2.5,
    pattern: "STEADY",
    weeklyBreakdown: generateSteadyWeeks(1, 4, 2.5),
    status: "allocated",
  },
];

// Sample allocations for Phase 2
const phase2Allocations: ResourceAllocation[] = [
  {
    id: "alloc-3",
    resourceName: "Finance Consultant",
    designation: "Manager",
    phaseId: "phase-2",
    phaseName: "Development",
    totalDays: 70,
    averagePerWeek: 5,
    pattern: "STEADY",
    weeklyBreakdown: generateSteadyWeeks(5, 18, 5),
    status: "allocated",
  },
  {
    id: "alloc-4",
    resourceName: "ABAP Developer",
    designation: "Senior Consultant",
    phaseId: "phase-2",
    phaseName: "Development",
    totalDays: 45,
    averagePerWeek: 0, // Variable
    pattern: "RAMP_UP",
    weeklyBreakdown: generateRampUpWeeks(5, 18, 45),
    status: "allocated",
  },
  {
    id: "alloc-5",
    resourceName: "SAP IS Developer",
    designation: "Senior Consultant",
    phaseId: "phase-2",
    phaseName: "Development",
    totalDays: 28,
    averagePerWeek: 2,
    pattern: "STEADY",
    weeklyBreakdown: generateSteadyWeeks(5, 18, 2),
    status: "allocated",
  },
  {
    id: "alloc-6",
    resourceName: "PP Consultant",
    designation: "Manager",
    phaseId: "phase-2",
    phaseName: "Development",
    totalDays: 56,
    averagePerWeek: 4,
    pattern: "STEADY",
    weeklyBreakdown: generateSteadyWeeks(5, 18, 4),
    status: "allocated",
  },
];

// Sample phases
export const samplePhases: Phase[] = [
  {
    id: "phase-1",
    name: "Infrastructure",
    weekStart: 1,
    weekEnd: 4,
    totalWeeks: 4,
    dateRange: "Jan 6 - Feb 1",
    allocations: phase1Allocations,
    totalDays: 30,
    resourceCount: 2,
    conflicts: 0,
    warnings: 0,
  },
  {
    id: "phase-2",
    name: "Development",
    weekStart: 5,
    weekEnd: 18,
    totalWeeks: 14,
    dateRange: "Jan 29 - May 3",
    allocations: phase2Allocations,
    totalDays: 199,
    resourceCount: 4,
    conflicts: 0,
    warnings: 0,
  },
  {
    id: "phase-3",
    name: "Testing",
    weekStart: 19,
    weekEnd: 22,
    totalWeeks: 4,
    dateRange: "May 4 - May 31",
    allocations: [],
    totalDays: 48,
    resourceCount: 3,
    conflicts: 0,
    warnings: 0,
  },
  {
    id: "phase-4",
    name: "Deployment",
    weekStart: 23,
    weekEnd: 26,
    totalWeeks: 4,
    dateRange: "Jun 1 - Jun 30",
    allocations: [],
    totalDays: 24,
    resourceCount: 2,
    conflicts: 0,
    warnings: 0,
  },
];

// Project summary
export const sampleProject: ProjectSummary = {
  name: "YTL Cement SAP Implementation",
  totalWeeks: 26,
  totalDays: 245,
  resourceCount: 10,
  phases: samplePhases,
  errors: 0,
  warnings: 0,
};

// Available resources (not yet allocated)
export const availableResources = [
  { id: "res-7", name: "Change Analyst", designation: "Senior Consultant" },
  { id: "res-8", name: "S&A Consultant", designation: "Senior Consultant" },
  { id: "res-9", name: "MM Consultant", designation: "Manager" },
  { id: "res-10", name: "Sales Consultant", designation: "Manager" },
  { id: "res-11", name: "ABAP Dev Lead", designation: "Manager" },
  { id: "res-12", name: "Fiori Dev Lead", designation: "Manager" },
];
