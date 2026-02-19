/**
 * Gap Detection Engine
 *
 * Identifies skill gaps in resource capacity planning by comparing:
 * 1. Required skills from tasks (task.requiredSkillCategories)
 * 2. Estimated effort based on phase duration and standard patterns
 * 3. Actually allocated resources by category
 *
 * Returns actionable gap information with severity levels
 */

import type { GanttProject, GanttPhase, GanttTask, Resource, ResourceCategory } from "@/types/gantt-tool";
import { differenceInWeeks, addWeeks, startOfWeek, isWithinInterval } from "date-fns";

// Standard effort patterns by category for SAP implementations
const CATEGORY_EFFORT_PATTERNS: Record<ResourceCategory, {
  minPercentOfProject: number;
  peakPhases: string[];
  description: string;
}> = {
  leadership: {
    minPercentOfProject: 5,
    peakPhases: ["Prepare", "Deploy"],
    description: "Strategic oversight and stakeholder management",
  },
  functional: {
    minPercentOfProject: 30,
    peakPhases: ["Explore", "Realize"],
    description: "Business process design and configuration",
  },
  technical: {
    minPercentOfProject: 25,
    peakPhases: ["Realize", "Deploy"],
    description: "Development and technical architecture",
  },
  basis: {
    minPercentOfProject: 10,
    peakPhases: ["Prepare", "Deploy", "Run"],
    description: "Infrastructure and system administration",
  },
  security: {
    minPercentOfProject: 5,
    peakPhases: ["Realize", "Deploy"],
    description: "Authorization and security configuration",
  },
  pm: {
    minPercentOfProject: 10,
    peakPhases: ["Prepare", "Explore", "Realize", "Deploy"],
    description: "Project management and coordination",
  },
  change: {
    minPercentOfProject: 8,
    peakPhases: ["Explore", "Deploy", "Run"],
    description: "Change management and training",
  },
  qa: {
    minPercentOfProject: 7,
    peakPhases: ["Realize", "Deploy"],
    description: "Quality assurance and testing",
  },
  client: {
    minPercentOfProject: 0,
    peakPhases: [],
    description: "Client counterpart placeholder",
  },
  other: {
    minPercentOfProject: 0,
    peakPhases: [],
    description: "Other resources",
  },
};

// Phase effort distribution (% of total project effort)
const PHASE_EFFORT_DISTRIBUTION: Record<string, number> = {
  "Discover": 0.05,
  "Prepare": 0.10,
  "Explore": 0.20,
  "Realize": 0.40,
  "Deploy": 0.20,
  "Run": 0.05,
};

export interface Gap {
  id: string;
  phaseId: string;
  phaseName: string;
  weekId: string;
  weekNumber: number;
  category: ResourceCategory;
  requiredMandays: number;
  allocatedMandays: number;
  gapMandays: number;
  severity: "critical" | "warning" | "info";
  description: string;
  recommendation: string;
}

export interface GapAnalysisResult {
  gaps: Gap[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    totalGapMandays: number;
    mostAffectedCategory: ResourceCategory | null;
    mostAffectedPhase: string | null;
  };
  byCategory: Record<ResourceCategory, {
    totalRequired: number;
    totalAllocated: number;
    totalGap: number;
    gapPercent: number;
  }>;
  byPhase: Record<string, {
    totalRequired: number;
    totalAllocated: number;
    totalGap: number;
    gapPercent: number;
  }>;
}

interface LocalAllocation {
  resourceId: string;
  weekId: string;
  mandays: number;
}

interface WeekInfo {
  weekId: string;
  weekNumber: number;
  startDate: Date;
}

/**
 * Detect gaps in resource capacity planning
 */
export function detectGaps(
  project: GanttProject,
  allocations: LocalAllocation[],
  weeks: WeekInfo[]
): GapAnalysisResult {
  const gaps: Gap[] = [];
  const resources = project.resources || [];
  const phases = project.phases || [];

  // Group allocations by week and category
  const allocationsByWeekAndCategory = new Map<string, Map<ResourceCategory, number>>();

  allocations.forEach((alloc) => {
    const resource = resources.find((r) => r.id === alloc.resourceId);
    if (!resource) return;

    const key = alloc.weekId;
    if (!allocationsByWeekAndCategory.has(key)) {
      allocationsByWeekAndCategory.set(key, new Map());
    }
    const weekMap = allocationsByWeekAndCategory.get(key)!;
    const current = weekMap.get(resource.category) || 0;
    weekMap.set(resource.category, current + alloc.mandays);
  });

  // Calculate required effort per week based on phases
  const requiredByWeekAndCategory = calculateRequiredEffort(phases, weeks);

  // Compare required vs allocated
  weeks.forEach((week) => {
    const allocatedMap = allocationsByWeekAndCategory.get(week.weekId) || new Map();
    const requiredMap = requiredByWeekAndCategory.get(week.weekId) || new Map();

    // Find which phase this week belongs to
    const phase = findPhaseForWeek(phases, week.startDate);

    requiredMap.forEach((required, category) => {
      const allocated = allocatedMap.get(category) || 0;
      const gapMandays = required - allocated;

      if (gapMandays > 0.5) {
        // Significant gap
        const severity = determineSeverity(gapMandays, required, category);
        const pattern = CATEGORY_EFFORT_PATTERNS[category as ResourceCategory];

        gaps.push({
          id: `gap-${week.weekId}-${category}`,
          phaseId: phase?.id || "",
          phaseName: phase?.name || "Unknown",
          weekId: week.weekId,
          weekNumber: week.weekNumber,
          category,
          requiredMandays: Math.round(required * 10) / 10,
          allocatedMandays: Math.round(allocated * 10) / 10,
          gapMandays: Math.round(gapMandays * 10) / 10,
          severity,
          description: `Missing ${Math.round(gapMandays * 10) / 10} mandays of ${pattern.description}`,
          recommendation: generateRecommendation(category, gapMandays, phase?.name || ""),
        });
      }
    });
  });

  // Calculate summary statistics
  const summary = calculateSummary(gaps);
  const byCategory = calculateByCategory(gaps, requiredByWeekAndCategory, allocationsByWeekAndCategory);
  const byPhase = calculateByPhase(gaps, phases, weeks, requiredByWeekAndCategory, allocationsByWeekAndCategory);

  return {
    gaps: gaps.sort((a, b) => {
      // Sort by severity (critical first), then by week
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.weekNumber - b.weekNumber;
    }),
    summary,
    byCategory,
    byPhase,
  };
}

/**
 * Calculate required effort per week based on phases and standard patterns
 */
function calculateRequiredEffort(
  phases: GanttPhase[],
  weeks: WeekInfo[]
): Map<string, Map<ResourceCategory, number>> {
  const required = new Map<string, Map<ResourceCategory, number>>();

  // Calculate total project duration and effort baseline
  let totalProjectWeeks = 0;
  let totalRequiredMandays = 0;

  phases.forEach((phase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const phaseWeeks = Math.max(1, differenceInWeeks(phaseEnd, phaseStart) + 1);
    totalProjectWeeks += phaseWeeks;

    // Estimate effort from tasks if available
    phase.tasks?.forEach((task) => {
      if (task.estimatedEffort) {
        totalRequiredMandays += task.estimatedEffort;
      }
    });
  });

  // If no effort estimates, use standard ratio (5 mandays per week per consultant)
  if (totalRequiredMandays === 0) {
    totalRequiredMandays = totalProjectWeeks * 5 * 3; // Assume 3 consultants avg
  }

  // Distribute effort across weeks based on phases
  weeks.forEach((week) => {
    const phase = findPhaseForWeek(phases, week.startDate);
    if (!phase) {
      required.set(week.weekId, new Map());
      return;
    }

    const weekMap = new Map<ResourceCategory, number>();
    const phaseName = phase.name;
    const phaseEffortPercent = PHASE_EFFORT_DISTRIBUTION[phaseName] || 0.1;

    // Get phase duration
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const phaseWeeks = Math.max(1, differenceInWeeks(phaseEnd, phaseStart) + 1);

    // Calculate weekly effort for this phase
    const phaseEffort = totalRequiredMandays * phaseEffortPercent;
    const weeklyEffort = phaseEffort / phaseWeeks;

    // Distribute weekly effort by category
    Object.entries(CATEGORY_EFFORT_PATTERNS).forEach(([cat, pattern]) => {
      const category = cat as ResourceCategory;
      if (pattern.minPercentOfProject === 0) return;

      // Base effort proportion
      let categoryPercent = pattern.minPercentOfProject / 100;

      // Boost if this is a peak phase for this category
      if (pattern.peakPhases.includes(phaseName)) {
        categoryPercent *= 1.5;
      }

      const categoryMandays = weeklyEffort * categoryPercent;
      if (categoryMandays > 0.1) {
        weekMap.set(category, categoryMandays);
      }
    });

    required.set(week.weekId, weekMap);
  });

  return required;
}

/**
 * Find which phase a given week belongs to
 */
function findPhaseForWeek(phases: GanttPhase[], weekStart: Date): GanttPhase | undefined {
  return phases.find((phase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    return isWithinInterval(weekStart, { start: phaseStart, end: phaseEnd });
  });
}

/**
 * Determine severity based on gap size and category
 */
function determineSeverity(
  gapMandays: number,
  required: number,
  category: ResourceCategory
): "critical" | "warning" | "info" {
  const gapPercent = (gapMandays / required) * 100;

  // Critical categories that need immediate attention
  const criticalCategories: ResourceCategory[] = ["pm", "functional", "technical"];

  if (gapPercent >= 80 || (criticalCategories.includes(category) && gapPercent >= 50)) {
    return "critical";
  } else if (gapPercent >= 40) {
    return "warning";
  }
  return "info";
}

/**
 * Generate recommendation based on gap
 */
function generateRecommendation(
  category: ResourceCategory,
  gapMandays: number,
  phaseName: string
): string {
  const pattern = CATEGORY_EFFORT_PATTERNS[category];
  const days = Math.ceil(gapMandays);

  if (gapMandays >= 5) {
    return `Add a ${pattern.description.toLowerCase()} resource at 100% for ${phaseName} phase`;
  } else if (gapMandays >= 2.5) {
    return `Add a ${pattern.description.toLowerCase()} resource at 50% or increase existing allocation`;
  }
  return `Consider increasing ${pattern.description.toLowerCase()} allocation by ${days} days`;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(gaps: Gap[]) {
  const criticalCount = gaps.filter((g) => g.severity === "critical").length;
  const warningCount = gaps.filter((g) => g.severity === "warning").length;
  const infoCount = gaps.filter((g) => g.severity === "info").length;
  const totalGapMandays = gaps.reduce((sum, g) => sum + g.gapMandays, 0);

  // Find most affected category
  const categoryGaps = new Map<ResourceCategory, number>();
  gaps.forEach((g) => {
    categoryGaps.set(g.category, (categoryGaps.get(g.category) || 0) + g.gapMandays);
  });
  let mostAffectedCategory: ResourceCategory | null = null;
  let maxCategoryGap = 0;
  categoryGaps.forEach((gap, cat) => {
    if (gap > maxCategoryGap) {
      maxCategoryGap = gap;
      mostAffectedCategory = cat;
    }
  });

  // Find most affected phase
  const phaseGaps = new Map<string, number>();
  gaps.forEach((g) => {
    phaseGaps.set(g.phaseName, (phaseGaps.get(g.phaseName) || 0) + g.gapMandays);
  });
  let mostAffectedPhase: string | null = null;
  let maxPhaseGap = 0;
  phaseGaps.forEach((gap, phase) => {
    if (gap > maxPhaseGap) {
      maxPhaseGap = gap;
      mostAffectedPhase = phase;
    }
  });

  return {
    criticalCount,
    warningCount,
    infoCount,
    totalGapMandays: Math.round(totalGapMandays * 10) / 10,
    mostAffectedCategory,
    mostAffectedPhase,
  };
}

/**
 * Calculate breakdown by category
 */
function calculateByCategory(
  gaps: Gap[],
  requiredByWeek: Map<string, Map<ResourceCategory, number>>,
  allocatedByWeek: Map<string, Map<ResourceCategory, number>>
): Record<ResourceCategory, { totalRequired: number; totalAllocated: number; totalGap: number; gapPercent: number }> {
  const result: Record<string, { totalRequired: number; totalAllocated: number; totalGap: number; gapPercent: number }> = {};

  const categories: ResourceCategory[] = ["leadership", "functional", "technical", "basis", "security", "pm", "change", "qa", "other"];

  categories.forEach((category) => {
    let totalRequired = 0;
    let totalAllocated = 0;

    requiredByWeek.forEach((weekMap) => {
      totalRequired += weekMap.get(category) || 0;
    });

    allocatedByWeek.forEach((weekMap) => {
      totalAllocated += weekMap.get(category) || 0;
    });

    const totalGap = Math.max(0, totalRequired - totalAllocated);
    const gapPercent = totalRequired > 0 ? (totalGap / totalRequired) * 100 : 0;

    result[category] = {
      totalRequired: Math.round(totalRequired * 10) / 10,
      totalAllocated: Math.round(totalAllocated * 10) / 10,
      totalGap: Math.round(totalGap * 10) / 10,
      gapPercent: Math.round(gapPercent),
    };
  });

  return result as Record<ResourceCategory, { totalRequired: number; totalAllocated: number; totalGap: number; gapPercent: number }>;
}

/**
 * Calculate breakdown by phase
 */
function calculateByPhase(
  gaps: Gap[],
  phases: GanttPhase[],
  weeks: WeekInfo[],
  requiredByWeek: Map<string, Map<ResourceCategory, number>>,
  allocatedByWeek: Map<string, Map<ResourceCategory, number>>
): Record<string, { totalRequired: number; totalAllocated: number; totalGap: number; gapPercent: number }> {
  const result: Record<string, { totalRequired: number; totalAllocated: number; totalGap: number; gapPercent: number }> = {};

  phases.forEach((phase) => {
    let totalRequired = 0;
    let totalAllocated = 0;

    weeks.forEach((week) => {
      const weekPhase = findPhaseForWeek(phases, week.startDate);
      if (weekPhase?.id === phase.id) {
        const weekRequired = requiredByWeek.get(week.weekId);
        const weekAllocated = allocatedByWeek.get(week.weekId);

        if (weekRequired) {
          weekRequired.forEach((val) => {
            totalRequired += val;
          });
        }
        if (weekAllocated) {
          weekAllocated.forEach((val) => {
            totalAllocated += val;
          });
        }
      }
    });

    const totalGap = Math.max(0, totalRequired - totalAllocated);
    const gapPercent = totalRequired > 0 ? (totalGap / totalRequired) * 100 : 0;

    result[phase.name] = {
      totalRequired: Math.round(totalRequired * 10) / 10,
      totalAllocated: Math.round(totalAllocated * 10) / 10,
      totalGap: Math.round(totalGap * 10) / 10,
      gapPercent: Math.round(gapPercent),
    };
  });

  return result;
}

/**
 * Quick gap check - returns true if there are any critical gaps
 */
export function hasCriticalGaps(
  project: GanttProject,
  allocations: LocalAllocation[],
  weeks: WeekInfo[]
): boolean {
  const result = detectGaps(project, allocations, weeks);
  return result.summary.criticalCount > 0;
}

/**
 * Get gap count by severity
 */
export function getGapCounts(
  project: GanttProject,
  allocations: LocalAllocation[],
  weeks: WeekInfo[]
): { critical: number; warning: number; info: number; total: number } {
  const result = detectGaps(project, allocations, weeks);
  return {
    critical: result.summary.criticalCount,
    warning: result.summary.warningCount,
    info: result.summary.infoCount,
    total: result.gaps.length,
  };
}
