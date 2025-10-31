/**
 * Test Save Operation - Simulates the actual PATCH request flow
 */

import { prisma } from '../src/lib/db';

async function testSaveOperation(projectId: string) {
  console.log(`\n🧪 Testing save operation for project: ${projectId}\n`);

  try {
    // Step 1: Fetch the project (like the API does)
    console.log('1️⃣  Fetching project...');
    const project = await prisma.ganttProject.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        phases: {
          include: {
            tasks: {
              include: { resourceAssignments: true },
              orderBy: { order: 'asc' },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: 'asc' },
        },
        milestones: { orderBy: { date: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
        resources: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!project) {
      console.error('❌ Project not found');
      return;
    }
    console.log('✅ Project fetched');

    // Step 2: Prepare update data (minimal update - just touch updatedAt)
    console.log('\n2️⃣  Preparing update data...');
    const updateData = {
      name: project.name,
      description: project.description || undefined,
      startDate: project.startDate,
      viewSettings: project.viewSettings,
      budget: project.budget || undefined,
      orgChart: project.orgChart || undefined,
      phases: project.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || '',
        color: phase.color,
        startDate: phase.startDate,
        endDate: phase.endDate,
        collapsed: phase.collapsed,
        order: phase.order || 0,
        dependencies: phase.dependencies || [],
        tasks: phase.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          startDate: task.startDate,
          endDate: task.endDate,
          progress: task.progress || 0,
          assignee: task.assignee || '',
          order: task.order || 0,
          dependencies: task.dependencies || [],
          resourceAssignments: task.resourceAssignments.map(ra => ({
            id: ra.id,
            resourceId: ra.resourceId,
            assignmentNotes: ra.assignmentNotes || '',
            allocationPercentage: ra.allocationPercentage || 0,
            assignedAt: ra.assignedAt,
          })),
        })),
        phaseResourceAssignments: phase.phaseResourceAssignments.map(pra => ({
          id: pra.id,
          resourceId: pra.resourceId,
          assignmentNotes: pra.assignmentNotes || '',
          allocationPercentage: pra.allocationPercentage || 0,
          assignedAt: pra.assignedAt,
        })),
      })),
      milestones: project.milestones.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        date: m.date,
        icon: m.icon,
        color: m.color,
      })),
      holidays: project.holidays.map(h => ({
        id: h.id,
        name: h.name,
        date: h.date,
        region: h.region,
        type: h.type,
      })),
      resources: project.resources.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description || '',
        designation: r.designation,
        managerResourceId: r.managerResourceId || null,
        email: r.email || null,
        department: r.department || null,
        location: r.location || null,
        projectRole: r.projectRole || null,
        createdAt: r.createdAt,
      })),
    };
    console.log('✅ Update data prepared');

    // Step 3: Test the transaction (like the API does)
    console.log('\n3️⃣  Testing transaction...');
    console.log('   Starting transaction...');

    const updatedProject = await prisma.$transaction(async (tx) => {
      // Update main project fields
      console.log('   - Updating main project...');
      const proj = await tx.ganttProject.update({
        where: { id: projectId },
        data: {
          name: updateData.name,
          description: updateData.description,
          startDate: updateData.startDate,
          viewSettings: updateData.viewSettings,
          budget: updateData.budget,
          orgChart: updateData.orgChart,
        },
      });
      console.log('   ✅ Main project updated');

      // Delete and recreate resources
      if (updateData.resources) {
        console.log('   - Deleting old resources...');
        await tx.ganttResource.deleteMany({
          where: { projectId: projectId },
        });
        console.log('   ✅ Resources deleted');

        if (updateData.resources.length > 0) {
          console.log(`   - Creating ${updateData.resources.length} resources...`);
          await tx.ganttResource.createMany({
            data: updateData.resources.map((r: any) => ({
              id: r.id,
              projectId: projectId,
              name: r.name,
              category: r.category,
              description: r.description || '',
              designation: r.designation,
              managerResourceId: r.managerResourceId || null,
              email: r.email || null,
              department: r.department || null,
              location: r.location || null,
              projectRole: r.projectRole || null,
              createdAt: r.createdAt,
            })),
          });
          console.log('   ✅ Resources created');
        }
      }

      // Delete and recreate phases
      if (updateData.phases) {
        console.log('   - Deleting old phases...');
        await tx.ganttPhase.deleteMany({
          where: { projectId: projectId },
        });
        console.log('   ✅ Phases deleted');

        console.log(`   - Creating ${updateData.phases.length} phases...`);
        for (const phase of updateData.phases) {
          await tx.ganttPhase.create({
            data: {
              id: phase.id,
              projectId: projectId,
              name: phase.name,
              description: phase.description,
              color: phase.color,
              startDate: phase.startDate,
              endDate: phase.endDate,
              collapsed: phase.collapsed || false,
              order: phase.order || 0,
              dependencies: phase.dependencies || [],
              tasks: {
                create: (phase.tasks || []).map((task: any, index: number) => ({
                  id: task.id,
                  name: task.name,
                  description: task.description,
                  startDate: task.startDate,
                  endDate: task.endDate,
                  progress: task.progress || 0,
                  assignee: task.assignee,
                  order: task.order !== undefined ? task.order : index,
                  dependencies: task.dependencies || [],
                  resourceAssignments: {
                    create: (task.resourceAssignments || []).map((ra: any) => ({
                      id: ra.id,
                      resourceId: ra.resourceId,
                      assignmentNotes: ra.assignmentNotes,
                      allocationPercentage: ra.allocationPercentage,
                      assignedAt: ra.assignedAt,
                    })),
                  },
                })),
              },
              phaseResourceAssignments: {
                create: (phase.phaseResourceAssignments || []).map((pra: any) => ({
                  id: pra.id,
                  resourceId: pra.resourceId,
                  assignmentNotes: pra.assignmentNotes,
                  allocationPercentage: pra.allocationPercentage,
                  assignedAt: pra.assignedAt,
                })),
              },
            },
          });
        }
        console.log('   ✅ Phases created');
      }

      // Milestones
      if (updateData.milestones) {
        console.log('   - Updating milestones...');
        await tx.ganttMilestone.deleteMany({ where: { projectId } });
        if (updateData.milestones.length > 0) {
          await tx.ganttMilestone.createMany({
            data: updateData.milestones.map((m: any) => ({
              id: m.id,
              projectId: projectId,
              name: m.name,
              description: m.description,
              date: m.date,
              icon: m.icon,
              color: m.color,
            })),
          });
        }
        console.log('   ✅ Milestones updated');
      }

      // Holidays
      if (updateData.holidays) {
        console.log('   - Updating holidays...');
        await tx.ganttHoliday.deleteMany({ where: { projectId } });
        if (updateData.holidays.length > 0) {
          await tx.ganttHoliday.createMany({
            data: updateData.holidays.map((h: any) => ({
              id: h.id,
              projectId: projectId,
              name: h.name,
              date: h.date,
              region: h.region,
              type: h.type,
            })),
          });
        }
        console.log('   ✅ Holidays updated');
      }

      console.log('   Transaction complete, returning project...');
      return proj;
    });

    console.log('✅ Transaction completed successfully');

    // Step 4: Test audit log creation
    console.log('\n4️⃣  Testing audit log creation...');
    try {
      await prisma.audit_logs.create({
        data: {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: project.userId,
          action: 'UPDATE',
          entity: 'gantt_project',
          entityId: projectId,
          changes: { test: true },
        },
      });
      console.log('✅ Audit log created successfully');
    } catch (auditError) {
      console.error('⚠️  Audit log failed (non-critical):', auditError);
    }

    // Step 5: Test fetching updated project
    console.log('\n5️⃣  Testing fetch of updated project...');
    const fullProject = await prisma.ganttProject.findFirst({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: {
              include: { resourceAssignments: true },
              orderBy: { order: 'asc' },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: 'asc' },
        },
        milestones: { orderBy: { date: 'asc' } },
        holidays: { orderBy: { date: 'asc' } },
        resources: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!fullProject) {
      console.error('❌ Failed to fetch updated project');
      return;
    }
    console.log('✅ Updated project fetched successfully');

    console.log('\n✅ All save operation steps completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Save operation failed:');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : error);

    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code);
      console.error('Prisma error meta:', (error as any).meta);
    }

    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
const projectId = process.argv[2] || 'cmhdareks000512ussi08yu78';
testSaveOperation(projectId);
