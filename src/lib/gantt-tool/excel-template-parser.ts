/**
 * Excel Template Parser for Gantt Tool
 *
 * Parses Excel data (TSV format) into Gantt project structure.
 * Handles two-part format: tasks + weekly timeline, resources + weekly mandays
 */

import { format, parse, addDays } from 'date-fns';
import { nanoid } from 'nanoid';

export interface ParsedTask {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  level: number;     // 0 = phase, 1 = task
}

export interface ParsedResource {
  name: string;
  role: string;
  category: string;
  weeklyEffort: { week: number; days: number }[]; // week index → mandays
}

export interface ParsedExcelData {
  tasks: ParsedTask[];
  resources: ParsedResource[];
  projectStartDate: string;
  weeklyColumns: string[]; // Column headers for weeks
}

/**
 * Parse TSV data from Excel clipboard
 */
export function parseExcelTemplate(tsvData: string): ParsedExcelData {
  const lines = tsvData.split('\n').map(line => line.split('\t'));

  // Find the row with weekly column headers (e.g., "W 01", "W 02")
  let weeklyHeaderRow = -1;
  let weeklyColumns: string[] = [];

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const row = lines[i];
    const weekPattern = row.filter(cell => /W\s*\d+/.test(cell || ''));
    if (weekPattern.length > 5) {
      weeklyHeaderRow = i;
      weeklyColumns = row.slice(row.findIndex(cell => /W\s*\d+/.test(cell || '')));
      break;
    }
  }

  if (weeklyHeaderRow === -1) {
    throw new Error('Could not find weekly column headers (W 01, W 02, etc.)');
  }

  // Parse tasks (rows between header and resource section)
  const tasks: ParsedTask[] = [];
  let taskEndRow = weeklyHeaderRow;

  for (let i = weeklyHeaderRow + 1; i < lines.length; i++) {
    const row = lines[i];
    const firstCell = row[0]?.trim();

    // Empty row or "Role" column indicates start of resource section
    if (!firstCell || firstCell.toLowerCase() === 'role') {
      taskEndRow = i;
      break;
    }

    // Parse task row
    const taskName = firstCell;
    const startDateStr = row[1]?.trim(); // Start Date column
    const endDateStr = row[2]?.trim();   // End Date column

    if (taskName && startDateStr && endDateStr) {
      const level = taskName.startsWith(' ') ? 1 : 0; // Indented = task, not indented = phase

      tasks.push({
        name: taskName.trim(),
        startDate: parseExcelDate(startDateStr),
        endDate: parseExcelDate(endDateStr),
        level,
      });
    }
  }

  // Parse resources (rows after task section)
  const resources: ParsedResource[] = [];
  const weekStartIndex = lines[weeklyHeaderRow].findIndex(cell => /W\s*\d+/.test(cell || ''));

  for (let i = taskEndRow + 1; i < lines.length; i++) {
    const row = lines[i];
    const resourceName = row[0]?.trim();
    const role = row[1]?.trim();

    if (!resourceName || !role) continue;

    // Parse weekly effort (mandays)
    const weeklyEffort: { week: number; days: number }[] = [];

    for (let w = 0; w < weeklyColumns.length; w++) {
      const cellValue = row[weekStartIndex + w]?.trim();
      const days = parseFloat(cellValue || '0');

      if (days > 0) {
        weeklyEffort.push({ week: w, days });
      }
    }

    resources.push({
      name: resourceName,
      role,
      category: inferCategory(role),
      weeklyEffort,
    });
  }

  // Extract project start date from first task
  const projectStartDate = tasks.length > 0 ? tasks[0].startDate : format(new Date(), 'yyyy-MM-dd');

  return {
    tasks,
    resources,
    projectStartDate,
    weeklyColumns,
  };
}

/**
 * Parse Excel date formats
 * Supports: "12.00", "Monday, 12 January 2026", "2026-01-12"
 */
function parseExcelDate(dateStr: string): string {
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try "Monday, 12 January 2026" format
  try {
    const parsed = parse(dateStr, 'EEEE, dd MMMM yyyy', new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {}

  // Try "12.00" format (assume week number)
  const weekMatch = dateStr.match(/(\d+)\.(\d+)/);
  if (weekMatch) {
    const week = parseInt(weekMatch[1], 10);
    // Approximate: assume project starts on Jan 1, 2026
    const projectStart = new Date(2026, 0, 1);
    const weekDate = addDays(projectStart, week * 7);
    return format(weekDate, 'yyyy-MM-dd');
  }

  // Fallback: return today
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Infer resource category from role
 */
function inferCategory(role: string): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('manager')) return 'management';
  if (roleLower.includes('consultant')) return 'functional';
  if (roleLower.includes('developer') || roleLower.includes('abap')) return 'technical';
  if (roleLower.includes('architect')) return 'functional';

  return 'other';
}

/**
 * Transform parsed data into Gantt project structure
 */
export function transformToGanttProject(
  parsed: ParsedExcelData,
  projectName: string
): {
  name: string;
  startDate: string;
  phases: any[];
  resources: any[];
  viewSettings: any;
} {
  const { tasks, resources, projectStartDate } = parsed;

  // Group tasks into phases (level 0) and sub-tasks (level 1)
  const phases: any[] = [];
  let currentPhase: any = null;

  for (const task of tasks) {
    if (task.level === 0) {
      // Create new phase
      currentPhase = {
        id: nanoid(),
        name: task.name,
        description: '',
        color: PHASE_COLORS[phases.length % PHASE_COLORS.length],
        startDate: task.startDate,
        endDate: task.endDate,
        collapsed: false,
        order: phases.length,
        dependencies: [],
        tasks: [],
        phaseResourceAssignments: [],
      };
      phases.push(currentPhase);
    } else if (task.level === 1 && currentPhase) {
      // Add task to current phase
      currentPhase.tasks.push({
        id: nanoid(),
        name: task.name,
        description: '',
        startDate: task.startDate,
        endDate: task.endDate,
        progress: 0,
        assignee: null,
        order: currentPhase.tasks.length,
        dependencies: [],
        resourceAssignments: [],
      });
    }
  }

  // Create resources
  const ganttResources = resources.map((res) => ({
    id: nanoid(),
    name: res.name,
    category: res.category,
    designation: inferDesignation(res.role),
    description: `${res.role}`,
    managerResourceId: null,
    email: null,
    department: null,
    location: null,
    projectRole: res.role,
    rateType: null,
    hourlyRate: null,
    dailyRate: null,
    currency: null,
    utilizationTarget: null,
    createdAt: new Date().toISOString(),
  }));

  // Assign resources to tasks based on weekly effort
  // For each resource, find overlapping tasks and create assignments
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const ganttResource = ganttResources[i];

    for (const phase of phases) {
      for (const task of phase.tasks) {
        // Check if resource has effort during task period
        const hasEffort = resource.weeklyEffort.some(we => {
          const weekDate = addDays(new Date(projectStartDate), we.week * 7);
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);
          return weekDate >= taskStart && weekDate <= taskEnd;
        });

        if (hasEffort) {
          task.resourceAssignments.push({
            id: nanoid(),
            taskId: task.id,
            resourceId: ganttResource.id,
            allocationPercentage: 100, // Default to 100%
            assignmentNotes: '',
            assignedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  return {
    name: projectName,
    startDate: projectStartDate,
    phases,
    resources: ganttResources,
    viewSettings: {
      zoomLevel: 'week',
      showWeekends: true,
      showHolidays: true,
      showMilestones: true,
      showTaskDependencies: false,
      showCriticalPath: false,
      showTitles: true,
      barDurationDisplay: 'all',
    },
  };
}

function inferDesignation(role: string): string {
  const roleLower = role.toLowerCase();

  if (roleLower.includes('lead') || roleLower.includes('manager')) return 'lead';
  if (roleLower.includes('senior')) return 'senior_consultant';
  if (roleLower.includes('principal')) return 'principal';

  return 'consultant';
}

const PHASE_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#EC4899', // pink
];
