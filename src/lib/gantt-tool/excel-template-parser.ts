/**
 * Excel Template Parser for Gantt Tool
 *
 * Parses Excel data (TSV format) into Gantt project structure.
 * Handles two-part format: tasks + weekly timeline, resources + weekly mandays
 */

import { format, parse, addDays } from 'date-fns';
import { nanoid } from 'nanoid';

export interface ParsedTask {
  phaseName: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
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
 *
 * FIX ISSUE #12: Validates all dates and reports errors instead of silent fallback
 */
export function parseExcelTemplate(tsvData: string): ParsedExcelData {
  const lines = tsvData.split('\n').map(line => line.split('\t'));
  const dateErrors: string[] = [];

  // Find the row with weekly column headers (e.g., "2-Feb-26", "9-Feb-26" or legacy "W 01", "W 02")
  let weeklyHeaderRow = -1;
  let weeklyColumns: string[] = [];

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const row = lines[i];
    // Match date format (d-MMM-yy) or legacy W format
    const weekPattern = row.filter(cell => /\d{1,2}-[A-Za-z]{3}-\d{2}/.test(cell || '') || /W\s*\d+/.test(cell || ''));
    if (weekPattern.length > 5) {
      weeklyHeaderRow = i;
      weeklyColumns = row.slice(row.findIndex(cell => /\d{1,2}-[A-Za-z]{3}-\d{2}/.test(cell || '') || /W\s*\d+/.test(cell || '')));
      break;
    }
  }

  if (weeklyHeaderRow === -1) {
    throw new Error(
      'Could not find weekly column headers.\n\n' +
      'Expected format: Column headers should include weekly dates like "2-Feb-26", "9-Feb-26", etc.\n\n' +
      'Please make sure you:\n' +
      '1. Copied the entire table including the header row\n' +
      '2. Used the provided Excel template format\n' +
      '3. Included both task data and weekly columns'
    );
  }

  // Parse tasks (rows between header and resource section)
  const tasks: ParsedTask[] = [];
  let taskEndRow = weeklyHeaderRow;

  for (let i = weeklyHeaderRow + 1; i < lines.length; i++) {
    const row = lines[i];
    const phaseName = row[0]?.trim();
    const taskName = row[1]?.trim();

    // Empty row or "Role" column indicates start of resource section
    if (!phaseName || phaseName.toLowerCase() === 'role') {
      taskEndRow = i;
      break;
    }

    // Parse task row
    const startDateStr = row[2]?.trim(); // Start Date column
    const endDateStr = row[3]?.trim();   // End Date column

    if (phaseName && taskName && startDateStr && endDateStr) {
      // FIX ISSUE #12: Validate dates and collect errors
      const startDateResult = parseExcelDate(startDateStr);
      const endDateResult = parseExcelDate(endDateStr);

      if (startDateResult.error) {
        dateErrors.push(`Row ${i + 1} (${phaseName} - ${taskName}): Start date error - ${startDateResult.error}`);
      }
      if (endDateResult.error) {
        dateErrors.push(`Row ${i + 1} (${phaseName} - ${taskName}): End date error - ${endDateResult.error}`);
      }

      // Only add task if both dates are valid
      if (!startDateResult.error && !endDateResult.error) {
        tasks.push({
          phaseName,
          name: taskName,
          startDate: startDateResult.date,
          endDate: endDateResult.date,
        });
      }
    }
  }

  // FIX ISSUE #12: Throw error if any dates are invalid
  if (dateErrors.length > 0) {
    const errorMessage = `Found ${dateErrors.length} invalid date(s) in your import:\n\n` +
      dateErrors.slice(0, 10).join('\n') +
      (dateErrors.length > 10 ? `\n\n... and ${dateErrors.length - 10} more errors` : '') +
      '\n\nPlease fix these dates and try again. Accepted formats:\n' +
      '• "Monday, 2 February, 2026"\n' +
      '• "2026-02-02"\n' +
      '• "02/02/2026"';

    throw new Error(errorMessage);
  }

  // Parse resources (rows after task section)
  const resources: ParsedResource[] = [];
  const weekStartIndex = lines[weeklyHeaderRow].findIndex(cell => /\d{1,2}-[A-Za-z]{3}-\d{2}/.test(cell || '') || /W\s*\d+/.test(cell || ''));

  for (let i = taskEndRow + 1; i < lines.length; i++) {
    const row = lines[i];
    const role = row[0]?.trim(); // Role (e.g., "Project Manager")
    const designation = row[1]?.trim(); // Designation (e.g., "Senior Manager")
    // row[2] = Start Date (optional, not used by gantt tool)
    // row[3] = End Date (optional, not used by gantt tool)

    if (!role || !designation) continue;

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
      name: role, // Use role as name since we don't track individual names
      role: designation, // Store designation in role field for backward compatibility
      category: inferCategory(designation),
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
 * Supports: "Monday, 2 February, 2026", "Monday, 12 January 2026", "2026-01-12"
 *
 * FIX ISSUE #12: Returns error instead of silent fallback to prevent data corruption
 */
function parseExcelDate(dateStr: string): { date: string; error?: string } {
  if (!dateStr || dateStr.trim() === '') {
    return {
      date: '',
      error: `Empty date value. Please provide a valid date.`
    };
  }

  const trimmed = dateStr.trim();

  // Try ISO format first (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Validate it's a real date
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return { date: trimmed };
    }
  }

  // Try various human-readable formats
  const formats = [
    'EEEE, d MMMM, yyyy',      // Monday, 2 February, 2026
    'EEEE, dd MMMM yyyy',      // Monday, 12 January 2026
    'EEEE, d MMMM yyyy',       // Monday, 2 January 2026
    'd MMMM yyyy',             // 2 February 2026
    'dd MMMM yyyy',            // 12 January 2026
    'yyyy-MM-dd',              // 2026-01-12
    'dd/MM/yyyy',              // 12/01/2026
    'MM/dd/yyyy',              // 01/12/2026
  ];

  for (const formatStr of formats) {
    try {
      const parsed = parse(trimmed, formatStr, new Date());
      if (!isNaN(parsed.getTime())) {
        // Additional validation: year should be reasonable (1900-2100)
        const year = parsed.getFullYear();
        if (year >= 1900 && year <= 2100) {
          return { date: format(parsed, 'yyyy-MM-dd') };
        }
      }
    } catch {}
  }

  // FIX ISSUE #12: Return error instead of silent fallback
  return {
    date: '',
    error: `Invalid date format: "${trimmed}". Expected formats: "Monday, 2 February, 2026", "2026-02-02", or "02/02/2026"`
  };
}

/**
 * Infer resource category from designation
 */
function inferCategory(designation: string): string {
  const designationLower = designation.toLowerCase();

  if (designationLower.includes('manager')) return 'management';
  if (designationLower.includes('consultant')) return 'functional';
  if (designationLower.includes('developer') || designationLower.includes('abap')) return 'technical';
  if (designationLower.includes('architect')) return 'functional';
  if (designationLower.includes('analyst')) return 'functional';

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

  // Group tasks by phase name
  const phaseMap = new Map<string, ParsedTask[]>();

  for (const task of tasks) {
    if (!phaseMap.has(task.phaseName)) {
      phaseMap.set(task.phaseName, []);
    }
    phaseMap.get(task.phaseName)!.push(task);
  }

  // Create phases from grouped tasks
  const phases: any[] = [];
  let phaseOrder = 0;

  for (const [phaseName, phaseTasks] of phaseMap.entries()) {
    // Calculate phase date range from tasks
    const taskDates = phaseTasks.map(t => ({
      start: new Date(t.startDate),
      end: new Date(t.endDate),
    }));

    const phaseStartDate = format(
      new Date(Math.min(...taskDates.map(d => d.start.getTime()))),
      'yyyy-MM-dd'
    );

    const phaseEndDate = format(
      new Date(Math.max(...taskDates.map(d => d.end.getTime()))),
      'yyyy-MM-dd'
    );

    // Create phase
    const phase = {
      id: nanoid(),
      name: phaseName,
      description: '',
      color: PHASE_COLORS[phaseOrder % PHASE_COLORS.length],
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      collapsed: false,
      order: phaseOrder,
      dependencies: [],
      tasks: phaseTasks.map((task, idx) => ({
        id: nanoid(),
        name: task.name,
        description: '',
        startDate: task.startDate,
        endDate: task.endDate,
        progress: 0,
        assignee: null,
        order: idx,
        dependencies: [],
        resourceAssignments: [],
      })),
      phaseResourceAssignments: [],
    };

    phases.push(phase);
    phaseOrder++;
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

function inferDesignation(designation: string): string {
  const designationLower = designation.toLowerCase();

  // Map standard designation strings to system enum values
  if (designationLower.includes('senior manager')) return 'senior_manager';
  if (designationLower === 'manager') return 'manager';
  if (designationLower.includes('senior consultant')) return 'senior_consultant';
  if (designationLower === 'consultant') return 'consultant';
  if (designationLower === 'analyst') return 'analyst';
  if (designationLower.includes('lead')) return 'lead';
  if (designationLower.includes('principal')) return 'principal';

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
