/**
 * Import Jadestone Energy End to End Project
 *
 * This script imports the company Excel format into the database.
 * Run with: npx ts-node scripts/import-jadestone-project.ts
 */

import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import { parse, format, startOfWeek, addDays, isValid } from "date-fns";

const prisma = new PrismaClient();

// Color palette for phases
const PHASE_COLORS = [
  "#007AFF", // Blue - Wave 1
  "#34C759", // Green - Wave 2
  "#FF9500", // Orange - Wave 3
  "#AF52DE", // Purple
  "#FF3B30", // Red
];

// Parse date in multiple formats
function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "#N/A") return null;
  const trimmed = dateStr.trim();

  // Try "Monday, February 02, 2026" format
  const longMatch = trimmed.match(/^[A-Za-z]+, ([A-Za-z]+) (\d+), (\d+)$/);
  if (longMatch) {
    const months: Record<string, number> = {
      January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
      July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
    };
    const date = new Date(parseInt(longMatch[3]), months[longMatch[1]], parseInt(longMatch[2]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try "2 Feb 2026" format
  const shortMatch = trimmed.match(/^(\d+) ([A-Za-z]+) (\d+)$/);
  if (shortMatch) {
    const months: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const date = new Date(parseInt(shortMatch[3]), months[shortMatch[2]], parseInt(shortMatch[1]));
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

// Map rank to designation
function mapRankToDesignation(rank: string): string {
  const normalized = rank.toLowerCase().replace(/[^a-z]/g, "");
  const mapping: Record<string, string> = {
    principal: "principal",
    director: "director",
    seniormanager: "senior_manager",
    manager: "manager",
    seniorconsultant: "senior_consultant",
    consultant: "consultant",
    analyst: "analyst",
  };
  return mapping[normalized] || "consultant";
}

// Infer category from role
function inferCategory(roleName: string): string {
  const lower = roleName.toLowerCase();
  if (lower.includes("pm") || lower.includes("project manager") || lower.includes("program manager")) return "pm";
  if (lower.includes("qa") || lower.includes("sme/qa")) return "qa";
  if (lower.includes("change") || lower.includes("training")) return "change";
  if (lower.includes("security") || lower.includes("auth")) return "security";
  if (lower.includes("basis") || lower.includes("cloud") || lower.includes("admin")) return "basis";
  if (lower.includes("dev") || lower.includes("technical") || lower.includes("integration")) return "technical";
  if (lower.includes("lead") || lower.includes("architect")) return "leadership";
  return "functional";
}

async function main() {
  console.log("Starting Jadestone Energy import...\n");

  // Read Excel file
  const workbook = XLSX.readFile("docs/screeenshots/gantt-import-template-2025-11-30.xlsx");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false }) as string[][];

  // Find section boundaries
  let scheduleStartRow = -1;
  let resourceStartRow = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i]?.[4] === "Phase" && data[i]?.[5] === "Task Name") scheduleStartRow = i;
    if (data[i]?.[0] === "Role" && data[i]?.[1] === "Rank") resourceStartRow = i;
  }

  console.log(`Schedule header at row ${scheduleStartRow + 1}`);
  console.log(`Resource header at row ${resourceStartRow + 1}`);

  // Extract schedule data
  const scheduleData: { phase: string; task: string; startDate: Date; endDate: Date }[] = [];
  for (let i = scheduleStartRow + 1; i < resourceStartRow - 1; i++) {
    const row = data[i];
    if (!row?.[4] || !row?.[5] || !row?.[6]) continue;

    const startDate = parseFlexibleDate(row[6]);
    const endDate = parseFlexibleDate(row[7]);
    if (!startDate || !endDate) continue;

    scheduleData.push({
      phase: row[4].trim(),
      task: row[5].trim(),
      startDate,
      endDate,
    });
  }

  console.log(`\nParsed ${scheduleData.length} tasks`);

  // Extract resource data
  const resourceData: {
    name: string;
    rank: string;
    region: string;
    totalDays: number;
    weeklyEffort: { weekIndex: number; days: number }[];
  }[] = [];

  for (let i = resourceStartRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row?.[0] || row[0] === "#N/A" || !row[1]) continue;

    const totalDays = parseFloat(row[8]) || 0;
    if (totalDays <= 0) continue;

    const weeklyEffort: { weekIndex: number; days: number }[] = [];
    for (let w = 10; w < row.length; w++) {
      const val = row[w]?.toString().trim();
      if (val && val !== "" && val !== "-" && val !== " -   ") {
        const days = parseFloat(val);
        if (!isNaN(days) && days > 0) {
          weeklyEffort.push({ weekIndex: w - 10, days });
        }
      }
    }

    resourceData.push({
      name: row[0].trim(),
      rank: row[1].trim(),
      region: row[2]?.trim() || "ABMY",
      totalDays,
      weeklyEffort,
    });
  }

  console.log(`Parsed ${resourceData.length} resources`);

  // Calculate project date range
  const projectStartDate = scheduleData.reduce((min, s) => (s.startDate < min ? s.startDate : min), scheduleData[0].startDate);
  const projectEndDate = scheduleData.reduce((max, s) => (s.endDate > max ? s.endDate : max), scheduleData[0].endDate);

  console.log(`\nProject range: ${format(projectStartDate, "yyyy-MM-dd")} to ${format(projectEndDate, "yyyy-MM-dd")}`);

  // Find admin user
  const adminUser = await prisma.users.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    console.error("No admin user found. Please create an admin user first.");
    process.exit(1);
  }

  console.log(`\nUsing admin user: ${adminUser.email}`);

  // Check if project exists
  let project = await prisma.ganttProject.findFirst({
    where: {
      name: "Jadestone Energy End to End",
      userId: adminUser.id,
      deletedAt: null,
    },
  });

  if (project) {
    console.log(`\nProject exists (ID: ${project.id}). Deleting old data...`);

    // Delete existing phases (cascades to tasks and assignments)
    await prisma.ganttPhase.deleteMany({ where: { projectId: project.id } });
    await prisma.ganttResource.deleteMany({ where: { projectId: project.id } });

    // Update project dates
    project = await prisma.ganttProject.update({
      where: { id: project.id },
      data: {
        startDate: projectStartDate,
        updatedAt: new Date(),
      },
    });
  } else {
    console.log("\nCreating new project...");
    project = await prisma.ganttProject.create({
      data: {
        userId: adminUser.id,
        name: "Jadestone Energy End to End",
        description: "Jadestone Energy SAP S/4HANA Implementation - 3 Waves (MY, ID, AU)",
        startDate: projectStartDate,
        viewSettings: {
          viewMode: "month",
          showToday: true,
          showWeekends: false,
        },
      },
    });
  }

  console.log(`Project ID: ${project.id}`);

  // Create phases and tasks
  const phaseNames = [...new Set(scheduleData.map((s) => s.phase))];
  const phaseMap = new Map<string, string>(); // phase name -> phase id

  for (let i = 0; i < phaseNames.length; i++) {
    const phaseName = phaseNames[i];
    const phaseTasks = scheduleData.filter((s) => s.phase === phaseName);
    const phaseStart = phaseTasks.reduce((min, t) => (t.startDate < min ? t.startDate : min), phaseTasks[0].startDate);
    const phaseEnd = phaseTasks.reduce((max, t) => (t.endDate > max ? t.endDate : max), phaseTasks[0].endDate);

    const phase = await prisma.ganttPhase.create({
      data: {
        projectId: project.id,
        name: phaseName,
        color: PHASE_COLORS[i % PHASE_COLORS.length],
        startDate: phaseStart,
        endDate: phaseEnd,
        order: i,
      },
    });

    phaseMap.set(phaseName, phase.id);
    console.log(`  Created phase: ${phaseName} (${phaseTasks.length} tasks)`);

    // Create tasks for this phase
    for (let j = 0; j < phaseTasks.length; j++) {
      const taskData = phaseTasks[j];
      await prisma.ganttTask.create({
        data: {
          phaseId: phase.id,
          name: taskData.task,
          startDate: taskData.startDate,
          endDate: taskData.endDate,
          order: j,
        },
      });
    }
  }

  // Create resources
  const resourceMap = new Map<string, string>(); // resource name -> resource id

  for (const res of resourceData) {
    const resource = await prisma.ganttResource.create({
      data: {
        projectId: project.id,
        name: res.name,
        designation: mapRankToDesignation(res.rank),
        category: inferCategory(res.name),
        description: `${res.rank} - ${res.region}`,
        location: res.region,
      },
    });
    resourceMap.set(res.name, resource.id);
  }

  console.log(`\nCreated ${resourceData.length} resources`);

  // Create phase resource assignments
  // Calculate week start dates
  const weekStartMonday = startOfWeek(projectStartDate, { weekStartsOn: 1 });

  // First, collect all assignments by phase-resource pair
  const allPhaseAssignments = new Map<string, { phaseId: string; resourceId: string; totalDays: number; weeklyPattern: number[] }>();

  for (const res of resourceData) {
    const resourceId = resourceMap.get(res.name);
    if (!resourceId) continue;

    for (const week of res.weeklyEffort) {
      const weekDate = addDays(weekStartMonday, week.weekIndex * 7);

      // Find which phase this week falls into
      for (const [phaseName, phaseId] of phaseMap.entries()) {
        const phaseTasks = scheduleData.filter((s) => s.phase === phaseName);
        const phaseStart = phaseTasks.reduce((min, t) => (t.startDate < min ? t.startDate : min), phaseTasks[0].startDate);
        const phaseEnd = phaseTasks.reduce((max, t) => (t.endDate > max ? t.endDate : max), phaseTasks[0].endDate);

        if (weekDate >= phaseStart && weekDate <= phaseEnd) {
          const key = `${phaseId}:${resourceId}`;
          if (!allPhaseAssignments.has(key)) {
            allPhaseAssignments.set(key, { phaseId, resourceId, totalDays: 0, weeklyPattern: [] });
          }
          const assignment = allPhaseAssignments.get(key)!;
          assignment.totalDays += week.days;
          assignment.weeklyPattern.push(week.days);
          break;
        }
      }
    }
  }

  // Create phase assignments
  let assignmentCount = 0;
  for (const [, assignment] of allPhaseAssignments.entries()) {
    const avgDaysPerWeek = assignment.totalDays / (assignment.weeklyPattern.length || 1);
    const allocationPct = Math.min(100, Math.round((avgDaysPerWeek / 5) * 100));

    await prisma.ganttPhaseResourceAssignment.create({
      data: {
        phaseId: assignment.phaseId,
        resourceId: assignment.resourceId,
        allocationPercentage: allocationPct,
        assignmentNotes: `Total: ${assignment.totalDays.toFixed(1)} days over ${assignment.weeklyPattern.length} weeks. Weekly pattern: ${assignment.weeklyPattern.slice(0, 5).join(", ")}${assignment.weeklyPattern.length > 5 ? "..." : ""}`,
        allocationPattern: "CUSTOM",
      },
    });
    assignmentCount++;
  }

  console.log(`Created ${assignmentCount} phase resource assignments`);

  // Summary
  const totalMandays = resourceData.reduce((sum, r) => sum + r.totalDays, 0);
  console.log("\n" + "=".repeat(50));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(50));
  console.log(`Project: ${project.name}`);
  console.log(`Phases: ${phaseNames.length}`);
  console.log(`Tasks: ${scheduleData.length}`);
  console.log(`Resources: ${resourceData.length}`);
  console.log(`Total Mandays: ${totalMandays.toFixed(1)}`);
  console.log(`Phase Assignments: ${assignmentCount}`);
  console.log("=".repeat(50));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
