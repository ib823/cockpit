/**
 * Template Engine - Convert templates into actual projects
 *
 * Handles instantiation of project templates with proper date calculation
 * and ID generation
 */

import type { GanttProject, GanttPhase, GanttTask, Resource, Milestone } from '@/types/gantt-tool';
import type { ProjectTemplate } from './template-types';
import { addDays, format } from 'date-fns';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate end date based on start date and duration (working days)
 * Assumes Monday-Friday work week
 */
function calculateEndDate(startDate: Date, durationDays: number): Date {
  let currentDate = new Date(startDate);
  let remainingDays = durationDays;

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return currentDate;
}

/**
 * Instantiate a template into a full GanttProject
 */
export function instantiateTemplate(
  template: ProjectTemplate,
  projectName?: string,
  startDate?: Date
): GanttProject {
  const now = new Date();
  const projectStartDate = startDate || now;
  const projectId = generateId();

  // Convert template phases to actual phases with dates
  let currentPhaseStartDate = projectStartDate;
  const phases: GanttPhase[] = template.phases.map((templatePhase, phaseIndex) => {
    const phaseId = generateId();
    const phaseStartDate = currentPhaseStartDate;
    const phaseEndDate = calculateEndDate(phaseStartDate, templatePhase.durationDays - 1); // -1 because start day counts

    // Convert template tasks to actual tasks with dates
    let currentTaskStartDate = phaseStartDate;
    const tasks: GanttTask[] = templatePhase.tasks.map((templateTask, taskIndex) => {
      const taskId = generateId();
      const taskStartDate = currentTaskStartDate;
      const taskEndDate = calculateEndDate(taskStartDate, templateTask.durationDays - 1);

      // Move to next task start date
      currentTaskStartDate = addDays(taskEndDate, 1);
      // Skip weekends for next task start
      while (currentTaskStartDate.getDay() === 0 || currentTaskStartDate.getDay() === 6) {
        currentTaskStartDate = addDays(currentTaskStartDate, 1);
      }

      return {
        id: taskId,
        phaseId: phaseId,
        name: templateTask.name,
        description: templateTask.description || '',
        startDate: format(taskStartDate, 'yyyy-MM-dd'),
        endDate: format(taskEndDate, 'yyyy-MM-dd'),
        progress: templateTask.progress || 0,
        assignee: templateTask.assignee || null,
        dependencies: templateTask.dependencies || [],
        sortOrder: templateTask.sortOrder,
      };
    });

    // Move to next phase start date (day after previous phase ends)
    currentPhaseStartDate = addDays(phaseEndDate, 1);
    // Skip weekends
    while (currentPhaseStartDate.getDay() === 0 || currentPhaseStartDate.getDay() === 6) {
      currentPhaseStartDate = addDays(currentPhaseStartDate, 1);
    }

    return {
      id: phaseId,
      projectId: projectId,
      name: templatePhase.name,
      description: templatePhase.description || '',
      color: templatePhase.color,
      startDate: format(phaseStartDate, 'yyyy-MM-dd'),
      endDate: format(phaseEndDate, 'yyyy-MM-dd'),
      tasks: tasks,
      sortOrder: templatePhase.sortOrder,
      expanded: true,
    };
  });

  // Convert template resources to actual resources
  const resources: Resource[] = (template.resources || []).map((templateResource) => ({
    id: generateId(),
    projectId: projectId,
    name: templateResource.name,
    email: templateResource.email || '',
    role: templateResource.role,
    category: templateResource.category as any,
    designation: templateResource.designation as any,
    rate: templateResource.rate,
    workingHours: templateResource.workingHours,
    color: templateResource.color,
  }));

  // Convert template milestones to actual milestones with dates
  const milestones: Milestone[] = (template.milestones || []).map((templateMilestone) => {
    const milestoneDate = addDays(projectStartDate, templateMilestone.dayOffset);
    return {
      id: generateId(),
      projectId: projectId,
      name: templateMilestone.name,
      description: templateMilestone.description || '',
      date: format(milestoneDate, 'yyyy-MM-dd'),
      color: templateMilestone.color,
    };
  });

  // Create the full project
  const project: GanttProject = {
    id: projectId,
    name: projectName || template.name,
    description: `Created from template: ${template.name}. ${template.description}`,
    startDate: format(projectStartDate, 'yyyy-MM-dd'),
    phases: phases,
    resources: resources,
    milestones: milestones,
    holidays: template.holidays || [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  return project;
}

/**
 * Calculate total project duration from template
 */
export function calculateTemplateDuration(template: ProjectTemplate): {
  totalDays: number;
  totalWeeks: number;
  totalMonths: number;
} {
  const totalDays = template.phases.reduce((sum, phase) => sum + phase.durationDays, 0);
  const totalWeeks = Math.ceil(totalDays / 5); // 5 working days per week
  const totalMonths = Math.ceil(totalWeeks / 4); // Approximate 4 weeks per month

  return {
    totalDays,
    totalWeeks,
    totalMonths,
  };
}

/**
 * Estimate project cost from template
 */
export function estimateTemplateCost(template: ProjectTemplate): {
  minCost: number;
  maxCost: number;
  totalHours: number;
} {
  if (!template.resources || template.resources.length === 0) {
    return { minCost: 0, maxCost: 0, totalHours: 0 };
  }

  const totalDays = template.phases.reduce((sum, phase) => sum + phase.durationDays, 0);

  // Calculate cost based on resources
  let totalCost = 0;
  let totalHours = 0;

  template.resources.forEach((resource) => {
    const hoursForProject = resource.workingHours * totalDays;
    const costForResource = hoursForProject * resource.rate;
    totalCost += costForResource;
    totalHours += hoursForProject;
  });

  // Add 20% variance for min/max estimates
  const minCost = totalCost * 0.8;
  const maxCost = totalCost * 1.2;

  return {
    minCost: Math.round(minCost),
    maxCost: Math.round(maxCost),
    totalHours: Math.round(totalHours),
  };
}

/**
 * Preview template statistics without full instantiation
 */
export function getTemplateStats(template: ProjectTemplate): {
  phaseCount: number;
  taskCount: number;
  resourceCount: number;
  milestoneCount: number;
  duration: ReturnType<typeof calculateTemplateDuration>;
  cost: ReturnType<typeof estimateTemplateCost>;
} {
  const taskCount = template.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);

  return {
    phaseCount: template.phases.length,
    taskCount,
    resourceCount: template.resources?.length || 0,
    milestoneCount: template.milestones?.length || 0,
    duration: calculateTemplateDuration(template),
    cost: estimateTemplateCost(template),
  };
}
