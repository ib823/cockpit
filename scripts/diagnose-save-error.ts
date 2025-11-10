/**
 * Diagnostic Script: Gantt Project Save Error
 *
 * This script helps diagnose the 500 error when saving gantt projects.
 * It validates the project data and identifies potential issues.
 */

import { prisma } from "../src/lib/db";
import { z } from "zod";

// Validation schema (same as in the API)
const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  viewSettings: z.any().optional(),
  budget: z.any().optional(),
  orgChart: z.any().optional(),
  phases: z.array(z.any()).optional(),
  milestones: z.array(z.any()).optional(),
  holidays: z.array(z.any()).optional(),
  resources: z.array(z.any()).optional(),
});

async function diagnoseProject(projectId: string) {
  console.log(`\n🔍 Diagnosing project: ${projectId}\n`);

  try {
    // 1. Fetch the project
    console.log("1️⃣  Fetching project from database...");
    const project = await prisma.ganttProject.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        phases: {
          include: {
            tasks: {
              include: { resourceAssignments: true },
              orderBy: { order: "asc" },
            },
            phaseResourceAssignments: true,
          },
          orderBy: { order: "asc" },
        },
        milestones: { orderBy: { date: "asc" } },
        holidays: { orderBy: { date: "asc" } },
        resources: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!project) {
      console.error("❌ Project not found");
      return;
    }

    console.log(`✅ Project found: "${project.name}"`);
    console.log(`   - Phases: ${project.phases.length}`);
    console.log(`   - Resources: ${project.resources.length}`);
    console.log(`   - Milestones: ${project.milestones.length}`);
    console.log(`   - Holidays: ${project.holidays.length}`);

    // 2. Validate data structure
    console.log("\n2️⃣  Validating data structure...");
    const projectData = {
      name: project.name,
      description: project.description || undefined,
      startDate: project.startDate.toISOString().split("T")[0],
      viewSettings: project.viewSettings || undefined,
      budget: project.budget || undefined,
      orgChart: project.orgChart || undefined,
      phases: project.phases.map((phase) => ({
        id: phase.id,
        name: phase.name,
        description: phase.description || "",
        color: phase.color,
        startDate: phase.startDate.toISOString().split("T")[0],
        endDate: phase.endDate.toISOString().split("T")[0],
        collapsed: phase.collapsed,
        order: phase.order || 0,
        dependencies: phase.dependencies || [],
        tasks: phase.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          description: task.description || "",
          startDate: task.startDate.toISOString().split("T")[0],
          endDate: task.endDate.toISOString().split("T")[0],
          progress: task.progress || 0,
          assignee: task.assignee || "",
          order: task.order || 0,
          dependencies: task.dependencies || [],
          resourceAssignments: task.resourceAssignments.map((ra) => ({
            id: ra.id,
            resourceId: ra.resourceId,
            assignmentNotes: ra.assignmentNotes || "",
            allocationPercentage: ra.allocationPercentage || 0,
            assignedAt: ra.assignedAt.toISOString(),
          })),
        })),
        phaseResourceAssignments: phase.phaseResourceAssignments.map((pra) => ({
          id: pra.id,
          resourceId: pra.resourceId,
          assignmentNotes: pra.assignmentNotes || "",
          allocationPercentage: pra.allocationPercentage || 0,
          assignedAt: pra.assignedAt.toISOString(),
        })),
      })),
      milestones: project.milestones.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description || "",
        date: m.date.toISOString().split("T")[0],
        icon: m.icon,
        color: m.color,
      })),
      holidays: project.holidays.map((h) => ({
        id: h.id,
        name: h.name,
        date: h.date.toISOString().split("T")[0],
        region: h.region,
        type: h.type,
      })),
      resources: project.resources.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        description: r.description || "",
        designation: r.designation,
        managerResourceId: r.managerResourceId || null,
        email: r.email || null,
        department: r.department || null,
        location: r.location || null,
        projectRole: r.projectRole || null,
        createdAt: r.createdAt.toISOString(),
      })),
    };

    try {
      UpdateProjectSchema.parse(projectData);
      console.log("✅ Data validation passed");
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("❌ Validation failed:");
        error.issues.forEach((issue) => {
          console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
        });
      }
      return;
    }

    // 3. Check for orphaned resource assignments
    console.log("\n3️⃣  Checking for orphaned resource assignments...");
    const resourceIds = new Set(project.resources.map((r) => r.id));
    let orphanedCount = 0;

    for (const phase of project.phases) {
      for (const task of phase.tasks) {
        for (const ra of task.resourceAssignments) {
          if (!resourceIds.has(ra.resourceId)) {
            orphanedCount++;
            console.error(
              `❌ Task "${task.name}" references non-existent resource: ${ra.resourceId}`
            );
          }
        }
      }
      for (const pra of phase.phaseResourceAssignments) {
        if (!resourceIds.has(pra.resourceId)) {
          orphanedCount++;
          console.error(
            `❌ Phase "${phase.name}" references non-existent resource: ${pra.resourceId}`
          );
        }
      }
    }

    if (orphanedCount === 0) {
      console.log("✅ No orphaned resource assignments found");
    } else {
      console.log(`❌ Found ${orphanedCount} orphaned resource assignments`);
    }

    // 4. Check data size
    console.log("\n4️⃣  Checking data size...");
    const jsonSize = JSON.stringify(projectData).length;
    const sizeInKB = (jsonSize / 1024).toFixed(2);
    console.log(`   - Total JSON size: ${sizeInKB} KB`);

    if (jsonSize > 1000000) {
      // 1MB
      console.warn("⚠️  Warning: Data size is very large (>1MB)");
    } else {
      console.log("✅ Data size is acceptable");
    }

    // 5. Check for special characters in IDs
    console.log("\n5️⃣  Checking for invalid characters in IDs...");
    const allIds = [
      ...project.phases.map((p) => p.id),
      ...project.phases.flatMap((p) => p.tasks.map((t) => t.id)),
      ...project.resources.map((r) => r.id),
      ...project.milestones.map((m) => m.id),
      ...project.holidays.map((h) => h.id),
    ];

    const invalidIds = allIds.filter(
      (id) => typeof id !== "string" || id.trim() === "" || id.includes("\x00")
    );

    if (invalidIds.length === 0) {
      console.log("✅ All IDs are valid");
    } else {
      console.error(`❌ Found ${invalidIds.length} invalid IDs:`, invalidIds);
    }

    console.log("\n✅ Diagnosis complete\n");
  } catch (error) {
    console.error("\n❌ Error during diagnosis:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnostic
const projectId = process.argv[2] || "cmhdareks000512ussi08yu78";
diagnoseProject(projectId);
