/**
 * Script to remove all unassigned resources from a project
 *
 * Unassigned resources are those with no task or phase assignments.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeUnassignedResources() {
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
            },
            phaseResourceAssignments: true,
          },
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

    // Find all assigned resource IDs
    const assignedResourceIds = new Set<string>();

    project.phases.forEach((phase) => {
      // Check phase-level assignments
      phase.phaseResourceAssignments?.forEach((assignment) => {
        assignedResourceIds.add(assignment.resourceId);
      });

      // Check task-level assignments
      phase.tasks.forEach((task) => {
        task.resourceAssignments?.forEach((assignment) => {
          assignedResourceIds.add(assignment.resourceId);
        });
      });
    });

    console.log(`Total resources in project: ${project.resources.length}`);
    console.log(`Assigned resources: ${assignedResourceIds.size}`);

    // Find unassigned resources
    const unassignedResources = project.resources.filter(
      (resource) => !assignedResourceIds.has(resource.id)
    );

    console.log(`Unassigned resources: ${unassignedResources.length}\n`);

    if (unassignedResources.length === 0) {
      console.log('✅ No unassigned resources to remove!');
      return;
    }

    // Show unassigned resources
    console.log('📋 Unassigned resources to be deleted:');
    unassignedResources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.name} (${resource.category})`);
    });

    console.log(`\n⚠️  About to delete ${unassignedResources.length} unassigned resources...`);

    // Delete unassigned resources
    const deleteResult = await prisma.ganttResource.deleteMany({
      where: {
        id: {
          in: unassignedResources.map((r) => r.id),
        },
      },
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.count} unassigned resources!`);

    // Show summary
    const remainingCount = project.resources.length - deleteResult.count;
    console.log(`\n📊 Summary:`);
    console.log(`   Before: ${project.resources.length} resources`);
    console.log(`   After: ${remainingCount} resources`);
    console.log(`   Deleted: ${deleteResult.count} unassigned resources`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeUnassignedResources();
