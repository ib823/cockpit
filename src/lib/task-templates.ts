import type { Task } from "@/types/core";

/**
 * Generic task templates for SAP implementation phases
 * Each phase gets a 3-task breakdown with effort and duration percentages
 */

export const TASK_TEMPLATES: Record<string, Task[]> = {
  // PREPARE Phase
  prepare: [
    {
      id: "prepare-1",
      name: "Team Mobilization",
      effortPercent: 25,
      daysPercent: 30,
      defaultRole: "Project Manager",
      description: "Assemble project team, assign roles, and establish communication channels"
    },
    {
      id: "prepare-2",
      name: "Project Governance & Planning",
      effortPercent: 40,
      daysPercent: 40,
      defaultRole: "Project Manager",
      description: "Define governance structure, create project charter, and detailed planning"
    },
    {
      id: "prepare-3",
      name: "SAP Environment Setup",
      effortPercent: 35,
      daysPercent: 30,
      defaultRole: "Basis Consultant",
      description: "Configure SAP landscape (DEV, QAS, PRD) and system access"
    }
  ],

  // EXPLORE Phase
  explore: [
    {
      id: "explore-1",
      name: "Design Workshop",
      effortPercent: 45,
      daysPercent: 40,
      defaultRole: "Functional + Technical Team",
      description: "Conduct workshops to gather requirements and design solution (configurable days based on modules)"
    },
    {
      id: "explore-2",
      name: "Develop Blueprint Document",
      effortPercent: 35,
      daysPercent: 35,
      defaultRole: "Functional + Technical Team",
      description: "Document business processes, configuration specifications, and technical design"
    },
    {
      id: "explore-3",
      name: "User/System Validation Conditions",
      effortPercent: 20,
      daysPercent: 25,
      defaultRole: "Functional + Technical Team",
      description: "Define test scenarios, acceptance criteria, and validation approach"
    }
  ],

  // REALIZE Phase
  realize: [
    {
      id: "realize-1",
      name: "Configure/Build",
      effortPercent: 50,
      daysPercent: 45,
      defaultRole: "Functional + Technical Team",
      description: "System configuration, custom development, and enhancements"
    },
    {
      id: "realize-2",
      name: "Unit Test + SIT",
      effortPercent: 30,
      daysPercent: 30,
      defaultRole: "Functional + Technical Team",
      description: "Unit testing and System Integration Testing"
    },
    {
      id: "realize-3",
      name: "Mock Run",
      effortPercent: 20,
      daysPercent: 25,
      defaultRole: "Functional + Technical Team",
      description: "End-to-end mock cutover and data migration testing"
    }
  ],

  // DEPLOY Phase
  deploy: [
    {
      id: "deploy-1",
      name: "Training",
      effortPercent: 30,
      daysPercent: 35,
      defaultRole: "Functional Team",
      description: "End-user training and training material preparation"
    },
    {
      id: "deploy-2",
      name: "UAT",
      effortPercent: 35,
      daysPercent: 40,
      defaultRole: "Functional Team + Business Users",
      description: "User Acceptance Testing with business users"
    },
    {
      id: "deploy-3",
      name: "Cutover",
      effortPercent: 35,
      daysPercent: 25,
      defaultRole: "Technical Team + Basis",
      description: "Production cutover, data migration, and go-live activities"
    }
  ],

  // RUN Phase (Hypercare)
  run: [
    {
      id: "run-1",
      name: "Hypercare Support",
      effortPercent: 60,
      daysPercent: 100,
      defaultRole: "Full Team",
      description: "Intensive post-go-live support and issue resolution"
    },
    {
      id: "run-2",
      name: "Knowledge Transfer",
      effortPercent: 25,
      daysPercent: 80,
      defaultRole: "Functional + Technical Team",
      description: "Transfer knowledge to internal support team"
    },
    {
      id: "run-3",
      name: "Stabilization & Optimization",
      effortPercent: 15,
      daysPercent: 60,
      defaultRole: "Technical Team",
      description: "System tuning, performance optimization, and minor fixes"
    }
  ]
};

/**
 * Get task templates for a phase based on its name or category
 */
export function getTaskTemplatesForPhase(phaseName: string, phaseCategory?: string): Task[] | null {
  const name = phaseName.toLowerCase();
  const category = phaseCategory?.toLowerCase() || "";

  // Match by phase name or category keywords
  // Category format is usually "MODULE - STAGE" like "FI - Prepare"
  if (name.includes("prepare") || category.includes("- prepare") || category.endsWith("prepare")) {
    return TASK_TEMPLATES.prepare;
  }
  if (name.includes("explore") || category.includes("- explore") || category.endsWith("explore")) {
    return TASK_TEMPLATES.explore;
  }
  if (name.includes("realize") || category.includes("- realize") || category.endsWith("realize")) {
    return TASK_TEMPLATES.realize;
  }
  if (name.includes("deploy") || category.includes("- deploy") || category.endsWith("deploy")) {
    return TASK_TEMPLATES.deploy;
  }
  if (name.includes("run") || name.includes("hypercare") || category.includes("- run") || category.endsWith("run") || name.includes("support")) {
    return TASK_TEMPLATES.run;
  }

  return null;
}

/**
 * Calculate task effort and duration from phase totals
 */
export function calculateTaskMetrics(tasks: Task[], phaseEffort: number, phaseWorkingDays: number): Task[] {
  return tasks.map(task => ({
    ...task,
    effort: Math.round((task.effortPercent / 100) * phaseEffort * 10) / 10,
    workingDays: Math.round((task.daysPercent / 100) * phaseWorkingDays)
  }));
}

/**
 * Generate tasks for a phase with calculated metrics
 */
export function generateTasksForPhase(
  phaseName: string,
  phaseCategory: string,
  phaseEffort: number,
  phaseWorkingDays: number
): Task[] | null {
  const templates = getTaskTemplatesForPhase(phaseName, phaseCategory);
  if (!templates) return null;

  return calculateTaskMetrics(templates, phaseEffort, phaseWorkingDays);
}
