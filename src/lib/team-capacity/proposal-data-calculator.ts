/**
 * Proposal Data Calculator
 *
 * Calculates real costing data for proposals based on:
 * - Team capacity allocations
 * - Resource rates
 * - Phase breakdowns
 *
 * Replaces placeholder calculations with actual data
 */

import type { GanttProject, Resource, GanttPhase, ResourceCategory } from "@/types/gantt-tool";
import { differenceInWeeks, format, differenceInDays } from "date-fns";

// Daily rates by designation and region (MYR - NSR)
const DAILY_RATES: Record<string, Record<string, number>> = {
  ABMY: {
    principal: 6880,
    director: 5504,
    senior_manager: 4128,
    manager: 2752,
    senior_consultant: 2064,
    consultant: 1548,
    analyst: 1032,
    subcontractor: 1376,
  },
  ABSG: {
    principal: 7379,
    director: 5903,
    senior_manager: 4427,
    manager: 2952,
    senior_consultant: 2214,
    consultant: 1703,
    analyst: 1135,
    subcontractor: 1476,
  },
  ABVN: {
    principal: 2580,
    director: 2064,
    senior_manager: 1548,
    manager: 1032,
    senior_consultant: 774,
    consultant: 585,
    analyst: 378,
    subcontractor: 516,
  },
  ABTH: {
    principal: 3096,
    director: 2477,
    senior_manager: 1858,
    manager: 1238,
    senior_consultant: 929,
    consultant: 688,
    analyst: 464,
    subcontractor: 619,
  },
};

// Category labels and colors
const CATEGORY_INFO: Record<ResourceCategory, { label: string; color: string; icon: string }> = {
  leadership: { label: "Leadership", color: "#6366F1", icon: "👔" },
  functional: { label: "Functional", color: "#10B981", icon: "⚙️" },
  technical: { label: "Technical", color: "#3B82F6", icon: "💻" },
  basis: { label: "Basis", color: "#8B5CF6", icon: "🖥️" },
  security: { label: "Security", color: "#F59E0B", icon: "🔐" },
  pm: { label: "Project Management", color: "#EF4444", icon: "📊" },
  change: { label: "Change Management", color: "#EC4899", icon: "🎯" },
  qa: { label: "Quality Assurance", color: "#14B8A6", icon: "✅" },
  client: { label: "Client", color: "#059669", icon: "C" },
  other: { label: "Other", color: "#6B7280", icon: "📋" },
};

interface LocalAllocation {
  resourceId: string;
  weekId: string;
  mandays: number;
}

export interface ProposalCostData {
  totalCost: number;
  totalMandays: number;
  currency: string;
  byCategory: Record<string, {
    cost: number;
    mandays: number;
    percentage: number;
    label: string;
    color: string;
    icon: string;
  }>;
  byPhase: Record<string, {
    cost: number;
    mandays: number;
    percentage: number;
  }>;
  byResource: Array<{
    resourceId: string;
    name: string;
    category: ResourceCategory;
    designation: string;
    mandays: number;
    cost: number;
    dailyRate: number;
  }>;
  timeline: {
    totalWeeks: number;
    costPerWeek: number;
    mandaysPerWeek: number;
  };
}

export interface ProposalTeamData {
  totalResources: number;
  assignedResources: number;
  utilizationRate: number;
  byCategory: Record<string, {
    count: number;
    percentage: number;
    label: string;
    color: string;
    icon: string;
  }>;
  teamList: Array<{
    id: string;
    name: string;
    category: string;
    categoryLabel: string;
    designation: string;
    designationLabel: string;
    mandays: number;
    cost: number;
    icon: string;
    color: string;
  }>;
}

export interface ProposalSummaryData {
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  durationMonths: number;
  durationWeeks: number;
  phaseCount: number;
  taskCount: number;
  milestoneCount: number;
  resourceCount: number;
  totalMandays: number;
  totalCost: number;
  currency: string;
  complexityScore: number;
  phases: Array<{
    name: string;
    description: string;
    taskCount: number;
    durationDays: number;
    mandays: number;
    cost: number;
    percentage: number;
  }>;
}

/**
 * Calculate comprehensive proposal data from project and allocations
 */
export function calculateProposalData(
  project: GanttProject,
  allocations: LocalAllocation[]
): {
  summary: ProposalSummaryData;
  costs: ProposalCostData;
  team: ProposalTeamData;
} {
  const resources = project.resources || [];
  const phases = project.phases || [];

  // Calculate duration
  const allDates = phases.flatMap((p) => [new Date(p.startDate), new Date(p.endDate)]);
  const startDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const durationDays = Math.max(1, differenceInDays(endDate, startDate));
  const durationWeeks = Math.max(1, Math.ceil(durationDays / 7));

  // Calculate costs
  const costData = calculateCosts(resources, allocations, phases);

  // Calculate team data
  const teamData = calculateTeamData(resources, allocations);

  // Calculate summary
  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  const complexityScore = calculateComplexity(phases, resources, costData.totalMandays);

  // Calculate phase details
  const phaseDetails = calculatePhaseDetails(phases, resources, allocations, costData.totalCost);

  const summary: ProposalSummaryData = {
    projectName: project.name,
    description: project.description || "",
    startDate: format(startDate, "MMMM dd, yyyy"),
    endDate: format(endDate, "MMMM dd, yyyy"),
    durationDays,
    durationMonths: Math.round(durationDays / 30),
    durationWeeks,
    phaseCount: phases.length,
    taskCount: totalTasks,
    milestoneCount: project.milestones?.length || 0,
    resourceCount: resources.length,
    totalMandays: costData.totalMandays,
    totalCost: costData.totalCost,
    currency: "MYR",
    complexityScore,
    phases: phaseDetails,
  };

  return {
    summary,
    costs: costData,
    team: teamData,
  };
}

/**
 * Calculate cost data
 */
function calculateCosts(
  resources: Resource[],
  allocations: LocalAllocation[],
  phases: GanttPhase[]
): ProposalCostData {
  let totalCost = 0;
  let totalMandays = 0;

  const byCategory: ProposalCostData["byCategory"] = {};
  const byResource: ProposalCostData["byResource"] = [];

  // Calculate per resource
  for (const resource of resources) {
    const resourceAllocations = allocations.filter((a) => a.resourceId === resource.id);
    const mandays = resourceAllocations.reduce((sum, a) => sum + a.mandays, 0);
    const dailyRate = getDailyRate(resource.designation, resource.regionCode);
    const cost = mandays * dailyRate;

    if (mandays > 0) {
      totalCost += cost;
      totalMandays += mandays;

      byResource.push({
        resourceId: resource.id,
        name: resource.name || `${CATEGORY_INFO[resource.category]?.label || "Resource"}`,
        category: resource.category,
        designation: resource.designation,
        mandays,
        cost,
        dailyRate,
      });

      // Aggregate by category
      const catInfo = CATEGORY_INFO[resource.category] || CATEGORY_INFO.other;
      if (!byCategory[resource.category]) {
        byCategory[resource.category] = {
          cost: 0,
          mandays: 0,
          percentage: 0,
          label: catInfo.label,
          color: catInfo.color,
          icon: catInfo.icon,
        };
      }
      byCategory[resource.category].cost += cost;
      byCategory[resource.category].mandays += mandays;
    }
  }

  // Calculate percentages
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].percentage = totalCost > 0
      ? Math.round((byCategory[cat].cost / totalCost) * 100)
      : 0;
  }

  // Calculate by phase (approximate based on week allocation)
  const byPhase: ProposalCostData["byPhase"] = {};
  // TODO: Map allocations to phases by week dates

  // Calculate timeline metrics
  const weeks = new Set(allocations.map((a) => a.weekId)).size;
  const timeline = {
    totalWeeks: weeks || 1,
    costPerWeek: weeks > 0 ? Math.round(totalCost / weeks) : 0,
    mandaysPerWeek: weeks > 0 ? Math.round((totalMandays / weeks) * 10) / 10 : 0,
  };

  return {
    totalCost,
    totalMandays,
    currency: "MYR",
    byCategory,
    byPhase,
    byResource,
    timeline,
  };
}

/**
 * Calculate team data
 */
function calculateTeamData(
  resources: Resource[],
  allocations: LocalAllocation[]
): ProposalTeamData {
  const assignedIds = new Set(allocations.filter((a) => a.mandays > 0).map((a) => a.resourceId));
  const assignedResources = assignedIds.size;
  const utilizationRate = resources.length > 0
    ? Math.round((assignedResources / resources.length) * 100)
    : 0;

  // By category count
  const byCategory: ProposalTeamData["byCategory"] = {};
  for (const resource of resources) {
    const catInfo = CATEGORY_INFO[resource.category] || CATEGORY_INFO.other;
    if (!byCategory[resource.category]) {
      byCategory[resource.category] = {
        count: 0,
        percentage: 0,
        label: catInfo.label,
        color: catInfo.color,
        icon: catInfo.icon,
      };
    }
    byCategory[resource.category].count++;
  }

  // Calculate percentages
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].percentage = resources.length > 0
      ? Math.round((byCategory[cat].count / resources.length) * 100)
      : 0;
  }

  // Team list
  const teamList = resources.map((resource) => {
    const resourceAllocations = allocations.filter((a) => a.resourceId === resource.id);
    const mandays = resourceAllocations.reduce((sum, a) => sum + a.mandays, 0);
    const dailyRate = getDailyRate(resource.designation, resource.regionCode);
    const cost = mandays * dailyRate;
    const catInfo = CATEGORY_INFO[resource.category] || CATEGORY_INFO.other;

    return {
      id: resource.id,
      name: resource.name || `${catInfo.label}`,
      category: resource.category,
      categoryLabel: catInfo.label,
      designation: resource.designation,
      designationLabel: formatDesignation(resource.designation),
      mandays,
      cost,
      icon: catInfo.icon,
      color: catInfo.color,
    };
  });

  // Sort by cost descending
  teamList.sort((a, b) => b.cost - a.cost);

  return {
    totalResources: resources.length,
    assignedResources,
    utilizationRate,
    byCategory,
    teamList,
  };
}

/**
 * Calculate phase details
 */
function calculatePhaseDetails(
  phases: GanttPhase[],
  resources: Resource[],
  allocations: LocalAllocation[],
  totalCost: number
): ProposalSummaryData["phases"] {
  return phases.map((phase) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const durationDays = Math.max(1, differenceInDays(phaseEnd, phaseStart));

    // Estimate phase cost based on duration ratio
    // In a full implementation, we'd map allocations to phase weeks
    const phaseRatio = durationDays / phases.reduce((sum, p) =>
      sum + differenceInDays(new Date(p.endDate), new Date(p.startDate)), 0
    );
    const phaseCost = Math.round(totalCost * phaseRatio);

    return {
      name: phase.name,
      description: phase.description || "",
      taskCount: phase.tasks.length,
      durationDays,
      mandays: Math.round(phaseCost / 2000), // Rough estimate
      cost: phaseCost,
      percentage: Math.round(phaseRatio * 100),
    };
  });
}

/**
 * Calculate complexity score
 */
function calculateComplexity(
  phases: GanttPhase[],
  resources: Resource[],
  totalMandays: number
): number {
  let score = 0;

  // Phase complexity
  score += Math.min(phases.length * 10, 30);

  // Task complexity
  const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
  score += Math.min(totalTasks * 2, 30);

  // Team complexity
  score += Math.min(resources.length * 3, 20);

  // Effort complexity
  score += Math.min(totalMandays / 10, 20);

  return Math.min(100, Math.round(score));
}

/**
 * Get daily rate for designation and region
 */
function getDailyRate(designation: string, regionCode?: string | null): number {
  const region = regionCode || "ABMY";
  const regionRates = DAILY_RATES[region] || DAILY_RATES.ABMY;
  return regionRates[designation] || regionRates.consultant;
}

/**
 * Format designation for display
 */
function formatDesignation(designation: string): string {
  const labels: Record<string, string> = {
    principal: "Principal",
    director: "Director",
    senior_manager: "Senior Manager",
    manager: "Manager",
    senior_consultant: "Senior Consultant",
    consultant: "Consultant",
    analyst: "Analyst",
    subcontractor: "Subcontractor",
  };
  return labels[designation] || designation;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency = "MYR"): string {
  if (amount >= 1000000) {
    return `${currency} ${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `${currency} ${(amount / 1000).toFixed(0)}K`;
  }
  return `${currency} ${amount.toFixed(0)}`;
}

/**
 * Generate payment schedule
 */
export function generatePaymentSchedule(totalCost: number): Array<{
  milestone: string;
  percentage: number;
  amount: number;
}> {
  return [
    { milestone: "Project Kickoff", percentage: 30, amount: Math.round(totalCost * 0.3) },
    { milestone: "Mid-Project Review", percentage: 40, amount: Math.round(totalCost * 0.4) },
    { milestone: "Project Completion", percentage: 30, amount: Math.round(totalCost * 0.3) },
  ];
}
