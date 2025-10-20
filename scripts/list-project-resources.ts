/**
 * Script to list all resources by phases and tasks for a specific project
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listProjectResources() {
  try {
    // Find the KPJ S/4hana project
    const projects = await prisma.ganttProject.findMany({
      where: {
        name: {
          contains: 'KPJ',
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      include: {
        phases: {
          include: {
            tasks: {
              include: {
                resourceAssignments: true,
              },
              orderBy: { order: 'asc' },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: 'asc' },
        },
        resources: true,
      },
    });

    if (projects.length === 0) {
      console.log('No project found matching "KPJ"');
      return;
    }

    const project = projects[0];
    console.log(`\n=== PROJECT: ${project.name} ===\n`);

    // Create a map of resources by ID
    const resourceMap = new Map(
      project.resources.map(r => [r.id, r])
    );

    // List resources by phase and task
    for (const phase of project.phases) {
      console.log(`\n📊 PHASE: ${phase.name}`);
      console.log(`   Dates: ${phase.startDate.toISOString().split('T')[0]} to ${phase.endDate.toISOString().split('T')[0]}`);

      // Phase-level resources
      if (phase.phaseResourceAssignments && phase.phaseResourceAssignments.length > 0) {
        console.log(`\n   🎯 Phase-Level Resources (${phase.phaseResourceAssignments.length}):`);
        for (const assignment of phase.phaseResourceAssignments) {
          const resource = resourceMap.get(assignment.resourceId);
          if (resource) {
            console.log(`      - ${resource.name} (${resource.category})`);
            console.log(`        Allocation: ${assignment.allocationPercentage}%`);
            if (assignment.assignmentNotes) {
              console.log(`        Notes: ${assignment.assignmentNotes}`);
            }
          }
        }
      }

      // Task-level resources
      for (const task of phase.tasks) {
        if (task.resourceAssignments && task.resourceAssignments.length > 0) {
          console.log(`\n   ✓ TASK: ${task.name}`);
          console.log(`      Dates: ${task.startDate.toISOString().split('T')[0]} to ${task.endDate.toISOString().split('T')[0]}`);
          console.log(`      Assigned Resources (${task.resourceAssignments.length}):`);

          for (const assignment of task.resourceAssignments) {
            const resource = resourceMap.get(assignment.resourceId);
            if (resource) {
              console.log(`         - ${resource.name} (${resource.category})`);
              console.log(`           Allocation: ${assignment.allocationPercentage}%`);
              if (assignment.assignmentNotes) {
                console.log(`           Notes: ${assignment.assignmentNotes}`);
              }
            }
          }
        }
      }
    }

    // Summary
    console.log('\n\n=== SUMMARY ===');
    console.log(`Total Phases: ${project.phases.length}`);
    console.log(`Total Resources: ${project.resources.length}`);

    const totalTasks = project.phases.reduce((sum, p) => sum + p.tasks.length, 0);
    console.log(`Total Tasks: ${totalTasks}`);

    const tasksWithResources = project.phases.reduce(
      (sum, p) => sum + p.tasks.filter(t => t.resourceAssignments && t.resourceAssignments.length > 0).length,
      0
    );
    console.log(`Tasks with Resources: ${tasksWithResources}`);

    // Resource breakdown by category
    console.log('\n=== RESOURCES BY CATEGORY ===');
    const categoryCount = new Map<string, number>();
    for (const resource of project.resources) {
      categoryCount.set(resource.category, (categoryCount.get(resource.category) || 0) + 1);
    }

    for (const [category, count] of Array.from(categoryCount.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`${category}: ${count}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listProjectResources();
