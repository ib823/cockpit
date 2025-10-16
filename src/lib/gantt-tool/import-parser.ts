/**
 * Gantt Tool - Import Parser
 *
 * Parses Excel import files and converts them to Gantt project format.
 * Validates data and provides detailed error messages.
 */

import ExcelJS from 'exceljs';
import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  GanttMilestone,
  GanttHoliday,
  Resource,
  ResourceCategory,
  ResourceDesignation,
} from '@/types/gantt-tool';

export interface ImportValidationError {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  project?: GanttProject;
  errors: ImportValidationError[];
  warnings: string[];
}

const VALID_CATEGORIES: ResourceCategory[] = ['functional', 'technical', 'basis', 'security', 'pm', 'change'];
const VALID_DESIGNATIONS: ResourceDesignation[] = ['principal', 'senior_manager', 'manager', 'senior_consultant', 'consultant', 'analyst', 'subcontractor'];
const VALID_HOLIDAY_TYPES: Array<'public' | 'company' | 'custom'> = ['public', 'company', 'custom'];

function getCellValue(row: ExcelJS.Row, columnKey: string): string {
  const cell = row.getCell(columnKey);
  if (!cell || cell.value === null || cell.value === undefined) return '';

  // Handle date cells
  if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
    return cell.value.toISOString().split('T')[0];
  }

  return String(cell.value).trim();
}

function validateDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  const errors: ImportValidationError[] = [];
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // Parse Project Info
    const projectSheet = workbook.getWorksheet('Project Info');
    if (!projectSheet) {
      errors.push({
        sheet: 'Project Info',
        row: 0,
        column: '',
        message: 'Missing "Project Info" sheet',
      });
      return { success: false, errors, warnings };
    }

    const projectRow = projectSheet.getRow(2); // Row 2 (after header)
    const projectName = getCellValue(projectRow, 'A');
    const projectStartDate = getCellValue(projectRow, 'B');
    const projectDescription = getCellValue(projectRow, 'C');

    if (!projectName) {
      errors.push({
        sheet: 'Project Info',
        row: 2,
        column: 'A',
        message: 'Project Name is required',
      });
    }

    if (!projectStartDate) {
      errors.push({
        sheet: 'Project Info',
        row: 2,
        column: 'B',
        message: 'Start Date is required',
      });
    } else if (!validateDate(projectStartDate)) {
      errors.push({
        sheet: 'Project Info',
        row: 2,
        column: 'B',
        message: 'Start Date must be in YYYY-MM-DD format',
      });
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    // Parse Phases
    const phasesSheet = workbook.getWorksheet('Phases');
    const phases: GanttPhase[] = [];
    const phaseNames = new Set<string>();

    if (phasesSheet) {
      let rowNum = 2; // Start after header
      let row = phasesSheet.getRow(rowNum);

      while (getCellValue(row, 'A')) {
        const phaseName = getCellValue(row, 'A');
        const startDate = getCellValue(row, 'B');
        const endDate = getCellValue(row, 'C');
        const description = getCellValue(row, 'D');
        const color = getCellValue(row, 'E') || '#3B82F6';

        // Validate
        if (!phaseName) {
          errors.push({ sheet: 'Phases', row: rowNum, column: 'A', message: 'Phase Name is required' });
        } else if (phaseNames.has(phaseName)) {
          errors.push({ sheet: 'Phases', row: rowNum, column: 'A', message: `Duplicate phase name: ${phaseName}` });
        } else {
          phaseNames.add(phaseName);
        }

        if (!validateDate(startDate)) {
          errors.push({ sheet: 'Phases', row: rowNum, column: 'B', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        if (!validateDate(endDate)) {
          errors.push({ sheet: 'Phases', row: rowNum, column: 'C', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
          errors.push({ sheet: 'Phases', row: rowNum, column: 'C', message: 'End date must be after start date' });
        }

        phases.push({
          id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: phaseName,
          description,
          color,
          startDate,
          endDate,
          tasks: [],
          collapsed: false,
          dependencies: [],
        });

        rowNum++;
        row = phasesSheet.getRow(rowNum);
      }
    }

    if (phases.length === 0) {
      warnings.push('No phases found. Project will be created with tasks only.');
    }

    // Parse Tasks
    const tasksSheet = workbook.getWorksheet('Tasks');
    const tasksByPhase = new Map<string, GanttTask[]>();

    if (tasksSheet) {
      let rowNum = 2;
      let row = tasksSheet.getRow(rowNum);

      while (getCellValue(row, 'A')) {
        const taskName = getCellValue(row, 'A');
        const phaseName = getCellValue(row, 'B');
        const startDate = getCellValue(row, 'C');
        const endDate = getCellValue(row, 'D');
        const description = getCellValue(row, 'E');
        const progressStr = getCellValue(row, 'F');
        const assignee = getCellValue(row, 'G');

        // Validate
        if (!taskName) {
          errors.push({ sheet: 'Tasks', row: rowNum, column: 'A', message: 'Task Name is required' });
        }

        if (!phaseName) {
          errors.push({ sheet: 'Tasks', row: rowNum, column: 'B', message: 'Phase Name is required' });
        } else if (!phaseNames.has(phaseName)) {
          errors.push({ sheet: 'Tasks', row: rowNum, column: 'B', message: `Phase "${phaseName}" not found in Phases sheet` });
        }

        if (!validateDate(startDate)) {
          errors.push({ sheet: 'Tasks', row: rowNum, column: 'C', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        if (!validateDate(endDate)) {
          errors.push({ sheet: 'Tasks', row: rowNum, column: 'D', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        const progress = progressStr ? parseInt(progressStr, 10) : 0;
        if (progress < 0 || progress > 100) {
          warnings.push(`Task "${taskName}" (row ${rowNum}): Progress value ${progress} out of range, using 0`);
        }

        const task: GanttTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          phaseId: '', // Will be set when adding to phase
          name: taskName,
          description,
          startDate,
          endDate,
          dependencies: [],
          assignee,
          progress: Math.max(0, Math.min(100, progress)),
          resourceAssignments: [],
        };

        if (!tasksByPhase.has(phaseName)) {
          tasksByPhase.set(phaseName, []);
        }
        tasksByPhase.get(phaseName)!.push(task);

        rowNum++;
        row = tasksSheet.getRow(rowNum);
      }
    }

    // Assign tasks to phases
    phases.forEach((phase) => {
      const phaseTasks = tasksByPhase.get(phase.name) || [];
      phaseTasks.forEach((task) => {
        task.phaseId = phase.id;
      });
      phase.tasks = phaseTasks;
    });

    // Parse Resources
    const resourcesSheet = workbook.getWorksheet('Resources');
    const resources: Resource[] = [];
    const resourceNameToId = new Map<string, string>();

    if (resourcesSheet) {
      let rowNum = 2;
      let row = resourcesSheet.getRow(rowNum);

      while (getCellValue(row, 'A')) {
        const resourceName = getCellValue(row, 'A');
        const category = getCellValue(row, 'B') as ResourceCategory;
        const designation = getCellValue(row, 'C') as ResourceDesignation;
        const description = getCellValue(row, 'D');
        const managerName = getCellValue(row, 'E');
        const email = getCellValue(row, 'F');
        const department = getCellValue(row, 'G');
        const location = getCellValue(row, 'H');
        const projectRole = getCellValue(row, 'I');

        // Validate
        if (!resourceName) {
          errors.push({ sheet: 'Resources', row: rowNum, column: 'A', message: 'Resource Name is required' });
        }

        if (!category) {
          errors.push({ sheet: 'Resources', row: rowNum, column: 'B', message: 'Category is required' });
        } else if (!VALID_CATEGORIES.includes(category)) {
          errors.push({ sheet: 'Resources', row: rowNum, column: 'B', message: `Invalid category: ${category}` });
        }

        if (!designation) {
          errors.push({ sheet: 'Resources', row: rowNum, column: 'C', message: 'Designation is required' });
        } else if (!VALID_DESIGNATIONS.includes(designation)) {
          errors.push({ sheet: 'Resources', row: rowNum, column: 'C', message: `Invalid designation: ${designation}` });
        }

        const resourceId = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        resourceNameToId.set(resourceName, resourceId);

        resources.push({
          id: resourceId,
          name: resourceName,
          category,
          designation,
          description: description || '',
          createdAt: new Date().toISOString(),
          managerResourceId: null, // Will be set in second pass
          email: email || undefined,
          department: department || undefined,
          location: location || undefined,
          projectRole: projectRole || undefined,
        });

        rowNum++;
        row = resourcesSheet.getRow(rowNum);
      }

      // Second pass: Set manager references
      rowNum = 2;
      row = resourcesSheet.getRow(rowNum);
      let resourceIndex = 0;

      while (getCellValue(row, 'A') && resourceIndex < resources.length) {
        const managerName = getCellValue(row, 'E');
        if (managerName) {
          const managerId = resourceNameToId.get(managerName);
          if (managerId) {
            resources[resourceIndex].managerResourceId = managerId;
          } else {
            warnings.push(`Resource "${resources[resourceIndex].name}" has manager "${managerName}" which was not found`);
          }
        }
        rowNum++;
        row = resourcesSheet.getRow(rowNum);
        resourceIndex++;
      }
    }

    // Parse Milestones
    const milestonesSheet = workbook.getWorksheet('Milestones');
    const milestones: GanttMilestone[] = [];

    if (milestonesSheet) {
      let rowNum = 2;
      let row = milestonesSheet.getRow(rowNum);

      while (getCellValue(row, 'A')) {
        const name = getCellValue(row, 'A');
        const date = getCellValue(row, 'B');
        const description = getCellValue(row, 'C');
        const icon = getCellValue(row, 'D') || '🏁';
        const color = getCellValue(row, 'E') || '#10B981';

        if (!name) {
          errors.push({ sheet: 'Milestones', row: rowNum, column: 'A', message: 'Milestone Name is required' });
        }

        if (!validateDate(date)) {
          errors.push({ sheet: 'Milestones', row: rowNum, column: 'B', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        milestones.push({
          id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          date,
          icon,
          color,
        });

        rowNum++;
        row = milestonesSheet.getRow(rowNum);
      }
    }

    // Parse Holidays
    const holidaysSheet = workbook.getWorksheet('Holidays');
    const holidays: GanttHoliday[] = [];

    if (holidaysSheet) {
      let rowNum = 2;
      let row = holidaysSheet.getRow(rowNum);

      while (getCellValue(row, 'A')) {
        const name = getCellValue(row, 'A');
        const date = getCellValue(row, 'B');
        const region = getCellValue(row, 'C') || 'Global';
        const type = (getCellValue(row, 'D') || 'public') as 'public' | 'company' | 'custom';

        if (!name) {
          errors.push({ sheet: 'Holidays', row: rowNum, column: 'A', message: 'Holiday Name is required' });
        }

        if (!validateDate(date)) {
          errors.push({ sheet: 'Holidays', row: rowNum, column: 'B', message: 'Invalid date format (use YYYY-MM-DD)' });
        }

        if (!VALID_HOLIDAY_TYPES.includes(type)) {
          warnings.push(`Holiday "${name}" has invalid type "${type}", using "public"`);
        }

        holidays.push({
          id: `holiday-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          date,
          region,
          type: VALID_HOLIDAY_TYPES.includes(type) ? type : 'public',
        });

        rowNum++;
        row = holidaysSheet.getRow(rowNum);
      }
    }

    // Return early if errors
    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    // Create project
    const project: GanttProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: projectName,
      description: projectDescription,
      startDate: projectStartDate,
      phases,
      milestones,
      holidays,
      resources,
      viewSettings: {
        zoomLevel: 'week',
        showWeekends: true,
        showHolidays: true,
        showMilestones: true,
        showTaskDependencies: false,
        showCriticalPath: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      success: true,
      project,
      errors: [],
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [{
        sheet: 'File',
        row: 0,
        column: '',
        message: `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }],
      warnings,
    };
  }
}
