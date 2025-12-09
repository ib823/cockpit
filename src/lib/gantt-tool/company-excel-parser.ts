/**
 * Company Excel Parser
 *
 * Parses the established company format for project imports:
 * - Schedule Section: Phase | Task Name | Start Date | End Date | Duration
 * - Resource Section: Role | Rank | Region | ... | Start Date | End Date | Total M/Days | W1 | W2 | ...
 *
 * This format includes weekly effort allocation per resource.
 */

import { parse, format, startOfWeek, addDays, isValid } from "date-fns";
import type { ResourceDesignation, ResourceCategory } from "@/types/gantt-tool";

// Types
export interface CompanyParsedTask {
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
}

export interface CompanyParsedPhase {
  name: string;
  tasks: CompanyParsedTask[];
  startDate: string;
  endDate: string;
}

export interface CompanyWeeklyAllocation {
  weekStartDate: string;
  days: number;
}

export interface CompanyParsedResource {
  name: string;
  designation: ResourceDesignation;
  category: ResourceCategory;
  region: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  weeklyEffort: CompanyWeeklyAllocation[];
}

export interface CompanyParsedProject {
  phases: CompanyParsedPhase[];
  resources: CompanyParsedResource[];
  projectStartDate: string;
  projectEndDate: string;
  totalTasks: number;
  totalResources: number;
  totalMandays: number;
  weekCount: number;
}

export interface CompanyParseResult {
  success: boolean;
  data?: CompanyParsedProject;
  errors: string[];
  warnings: string[];
}

/**
 * Parse date in multiple formats
 */
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '#N/A') return null;

  const trimmed = dateStr.trim();

  // Try "Monday, February 02, 2026" format
  try {
    const parsed = parse(trimmed, "EEEE, MMMM dd, yyyy", new Date());
    if (isValid(parsed)) return parsed;
  } catch {}

  // Try "2 Feb 2026" format
  try {
    const parsed = parse(trimmed, "d MMM yyyy", new Date());
    if (isValid(parsed)) return parsed;
  } catch {}

  // Try "6 Aug 2027" format
  try {
    const parsed = parse(trimmed, "d MMM yyyy", new Date());
    if (isValid(parsed)) return parsed;
  } catch {}

  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed + "T00:00:00");
    if (isValid(date)) return date;
  }

  return null;
}

/**
 * Map rank string to ResourceDesignation
 */
function mapRankToDesignation(rank: string): ResourceDesignation {
  const normalized = rank.toLowerCase().replace(/[^a-z]/g, "");

  const mapping: Record<string, ResourceDesignation> = {
    principal: "principal",
    director: "director",
    seniormanager: "senior_manager",
    srmanager: "senior_manager",
    manager: "manager",
    seniorconsultant: "senior_consultant",
    srconsultant: "senior_consultant",
    consultant: "consultant",
    analyst: "analyst",
    subcontractor: "subcontractor",
    subcon: "subcontractor",
  };

  return mapping[normalized] || "consultant";
}

/**
 * Infer resource category from role name
 */
function inferCategoryFromRole(roleName: string, designation: ResourceDesignation): ResourceCategory {
  const lower = roleName.toLowerCase();

  // PM
  if (lower.includes("pm") || lower.includes("project manager") || lower.includes("program manager")) {
    return "pm";
  }

  // QA
  if (lower.includes("qa") || lower.includes("quality") || lower.includes("sme/qa")) {
    return "qa";
  }

  // Change Management
  if (lower.includes("change") || lower.includes("training") || lower.includes("ocm")) {
    return "change";
  }

  // Security
  if (lower.includes("security") || lower.includes("auth")) {
    return "security";
  }

  // Basis
  if (lower.includes("basis") || lower.includes("cloud") || lower.includes("admin")) {
    return "basis";
  }

  // Technical/Development
  if (lower.includes("dev") || lower.includes("abap") || lower.includes("technical") || lower.includes("integration")) {
    return "technical";
  }

  // Leadership
  if (lower.includes("lead") || lower.includes("architect") || designation === "principal" || designation === "director") {
    return "leadership";
  }

  // Functional - SAP modules
  if (lower.includes("fi") || lower.includes("co") || lower.includes("mm") ||
      lower.includes("sd") || lower.includes("pp") || lower.includes("eam") ||
      lower.includes("procurement") || lower.includes("inventory") ||
      lower.includes("finance") || lower.includes("consultant") ||
      lower.includes("regulatory") || lower.includes("jva") ||
      lower.includes("localization") || lower.includes("tax")) {
    return "functional";
  }

  return "other";
}

/**
 * Parse company Excel data
 * @param scheduleData - Array of arrays from schedule section (rows with Phase, Task, Start, End)
 * @param resourceData - Array of arrays from resource section (rows with Role, Rank, Region, ..., weekly)
 * @param projectStartDate - The project start date for week calculations
 */
export function parseCompanyExcelData(
  scheduleData: string[][],
  resourceData: string[][],
  projectStartDate: Date
): CompanyParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Parse phases and tasks
  const phaseMap = new Map<string, CompanyParsedPhase>();
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let totalTasks = 0;

  for (let i = 0; i < scheduleData.length; i++) {
    const row = scheduleData[i];
    if (!row || !row[0] || !row[1]) continue;

    const phaseName = row[0]?.trim();
    const taskName = row[1]?.trim();
    const startDateStr = row[2]?.trim();
    const endDateStr = row[3]?.trim();
    const durationStr = row[4]?.trim();

    if (!phaseName || !taskName) continue;

    const startDate = parseFlexibleDate(startDateStr);
    const endDate = parseFlexibleDate(endDateStr);

    if (!startDate || !endDate) {
      warnings.push(`Schedule row ${i + 1}: Could not parse dates for task "${taskName}"`);
      continue;
    }

    const formattedStart = format(startDate, "yyyy-MM-dd");
    const formattedEnd = format(endDate, "yyyy-MM-dd");
    const durationDays = parseFloat(durationStr) || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Track project date range
    if (!minDate || startDate < minDate) minDate = startDate;
    if (!maxDate || endDate > maxDate) maxDate = endDate;

    // Add to phase
    if (!phaseMap.has(phaseName)) {
      phaseMap.set(phaseName, {
        name: phaseName,
        tasks: [],
        startDate: formattedStart,
        endDate: formattedEnd,
      });
    }

    const phase = phaseMap.get(phaseName)!;
    phase.tasks.push({
      name: taskName,
      startDate: formattedStart,
      endDate: formattedEnd,
      durationDays,
    });

    // Update phase date range
    if (formattedStart < phase.startDate) phase.startDate = formattedStart;
    if (formattedEnd > phase.endDate) phase.endDate = formattedEnd;

    totalTasks++;
  }

  // Parse resources
  const resources: CompanyParsedResource[] = [];
  let totalMandays = 0;

  // Calculate week start dates from project start
  const weekStartMonday = startOfWeek(projectStartDate, { weekStartsOn: 1 });

  for (let i = 0; i < resourceData.length; i++) {
    const row = resourceData[i];
    if (!row || !row[0] || row[0] === '#N/A') continue;

    const roleName = row[0]?.trim();
    const rankStr = row[1]?.trim();
    const region = row[2]?.trim() || "ABMY";
    const startDateStr = row[6]?.trim();
    const endDateStr = row[7]?.trim();
    const totalDaysStr = row[8]?.trim();

    if (!roleName || !rankStr) continue;

    // Skip if no valid dates
    const resourceStartDate = parseFlexibleDate(startDateStr);
    const resourceEndDate = parseFlexibleDate(endDateStr);

    if (!resourceStartDate || !resourceEndDate) {
      warnings.push(`Resource row ${i + 1}: Could not parse dates for "${roleName}"`);
      continue;
    }

    const designation = mapRankToDesignation(rankStr);
    const category = inferCategoryFromRole(roleName, designation);
    const totalDays = parseFloat(totalDaysStr) || 0;

    // Skip resources with 0 total days
    if (totalDays <= 0) {
      warnings.push(`Resource "${roleName}" has 0 mandays - skipped`);
      continue;
    }

    // Parse weekly effort (columns 10+ are weekly data)
    const weeklyEffort: CompanyWeeklyAllocation[] = [];
    for (let w = 10; w < row.length; w++) {
      const weekValue = row[w]?.toString().trim();
      if (!weekValue || weekValue === '' || weekValue === '-' || weekValue === ' -   ') continue;

      const days = parseFloat(weekValue);
      if (isNaN(days) || days <= 0) continue;

      const weekIndex = w - 10;
      const weekStartDate = addDays(weekStartMonday, weekIndex * 7);

      weeklyEffort.push({
        weekStartDate: format(weekStartDate, "yyyy-MM-dd"),
        days,
      });
    }

    if (weeklyEffort.length === 0 && totalDays > 0) {
      warnings.push(`Resource "${roleName}" has ${totalDays} total days but no weekly allocation`);
    }

    resources.push({
      name: roleName,
      designation,
      category,
      region,
      startDate: format(resourceStartDate, "yyyy-MM-dd"),
      endDate: format(resourceEndDate, "yyyy-MM-dd"),
      totalDays,
      weeklyEffort,
    });

    totalMandays += totalDays;
  }

  // Validate results
  if (phaseMap.size === 0) {
    errors.push("No phases found in schedule data");
  }

  if (resources.length === 0) {
    errors.push("No resources found in resource data");
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  const phases = Array.from(phaseMap.values());

  // Calculate week count from resource data
  const maxWeekCount = Math.max(...resources.map(r => r.weeklyEffort.length), 0);

  return {
    success: true,
    data: {
      phases,
      resources,
      projectStartDate: minDate ? format(minDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      projectEndDate: maxDate ? format(maxDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      totalTasks,
      totalResources: resources.length,
      totalMandays,
      weekCount: maxWeekCount,
    },
    errors: [],
    warnings,
  };
}
