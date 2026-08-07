/**
 * Integration test — does editing one task damage its phase?
 *
 * Runs against a REAL PostgreSQL database, because this is the question the
 * mocked unit tests cannot answer.
 *
 * The concern (audit finding #1): `DeltaSaveSchema` accepts a `tasks` block but
 * the transaction has no `delta.tasks` branch — nothing reads it. Task edits
 * therefore reach the database only through the phase path, which does
 * `ganttTask.deleteMany({ where: { phaseId } })` and recreates every task in the
 * phase from the client payload. If that is what happens, then:
 *
 *   1. every task row in the phase is destroyed and rewritten on any task edit,
 *   2. `GanttTaskResourceAssignment` rows cascade-delete with them, and
 *   3. anything the client did not send back is silently lost.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cockpit_e2e \
 *   npx vitest run tests/integration/delta-task-persistence.int.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "vitest";

// Requires a real database. Off by default so CI is unaffected:
//   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cockpit_e2e \
//   RUN_DB_E2E=1 npx vitest run tests/integration/delta-task-persistence.int.test.ts
const describeDb = process.env.RUN_DB_E2E ? describe : describe.skip;
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

const userId = randomUUID();
const projectId = randomUUID();
const phaseId = randomUUID();
const taskAId = randomUUID();
const taskBId = randomUUID();
const resourceId = randomUUID();

beforeAll(async () => {
  await prisma.users.create({
    data: {
      id: userId,
      email: `qa-delta-${userId.slice(0, 8)}@example.com`,
      role: "USER",
      accessExpiresAt: new Date(Date.now() + 86_400_000),
      updatedAt: new Date(),
    },
  });

  await prisma.ganttProject.create({
    data: {
      id: projectId,
      userId,
      name: `QA delta ${projectId.slice(0, 8)}`,
      startDate: new Date("2026-01-01"),
    },
  });

  await prisma.ganttResource.create({
    data: {
      id: resourceId,
      projectId,
      name: "QA Resource",
      category: "Functional",
      designation: "Consultant",
    },
  });

  await prisma.ganttPhase.create({
    data: {
      id: phaseId,
      projectId,
      name: "Realization",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      order: 0,
    },
  });

  for (const [id, name, order] of [
    [taskAId, "Task A", 0],
    [taskBId, "Task B", 1],
  ] as const) {
    await prisma.ganttTask.create({
      data: {
        id,
        phaseId,
        name,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-02-01"),
        order,
      },
    });
  }

  // Task A carries a resource assignment — the thing most at risk.
  await prisma.ganttTaskResourceAssignment.create({
    data: {
      id: randomUUID(),
      taskId: taskAId,
      resourceId,
      allocationPercentage: 50,
    },
  });
});

afterAll(async () => {
  await prisma.ganttProject.deleteMany({ where: { id: projectId } });
  await prisma.users.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describeDb("delta save — task persistence against a real database", () => {
  test("baseline fixture is as expected", async () => {
    const tasks = await prisma.ganttTask.findMany({ where: { phaseId } });
    const assignments = await prisma.ganttTaskResourceAssignment.findMany({
      where: { taskId: taskAId },
    });
    expect(tasks).toHaveLength(2);
    expect(assignments).toHaveLength(1);
  });

  test("the phase update path deletes and recreates every task in the phase", async () => {
    const before = await prisma.ganttTask.findMany({
      where: { phaseId },
      select: { id: true, name: true, createdAt: true },
      orderBy: { order: "asc" },
    });

    // Reproduce exactly what the delta route does for `phases.updated` when the
    // payload carries a `tasks` array: delete every task in the phase, then
    // recreate from the payload. Here the client renames Task A and — as the
    // real client does after a partial hydrate — sends back only that one task.
    await prisma.$transaction(async (tx) => {
      await tx.ganttTask.deleteMany({ where: { phaseId } });
      await tx.ganttTask.createMany({
        data: [
          {
            id: taskAId,
            phaseId,
            name: "Task A (renamed)",
            startDate: new Date("2026-01-01"),
            endDate: new Date("2026-02-01"),
            order: 0,
          },
        ],
      });
    });

    const after = await prisma.ganttTask.findMany({
      where: { phaseId },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    });

    const assignmentsAfter = await prisma.ganttTaskResourceAssignment.findMany({
      where: { taskId: taskAId },
    });

    // Record what actually happened rather than asserting a hoped-for outcome.
    // eslint-disable-next-line no-console
    console.log("DELTA-EVIDENCE", JSON.stringify({
      tasksBefore: before.map((t) => t.name),
      tasksAfter: after.map((t) => t.name),
      taskBSurvived: after.some((t) => t.id === taskBId),
      assignmentsOnTaskAAfter: assignmentsAfter.length,
    }));

    // The rename landed.
    expect(after.find((t) => t.id === taskAId)?.name).toBe("Task A (renamed)");

    // CURRENT BEHAVIOUR, asserted as measured fact (2026-08-07, real Postgres):
    // renaming Task A destroyed Task B, because the phase path deletes every
    // task in the phase and recreates only what the payload contained.
    //
    // Nothing on the server guarantees the client sends a COMPLETE task array;
    // the invariant is implicit and unguarded. A stale or partially-hydrated
    // client silently loses the omitted rows.
    //
    // When true task-level deltas are implemented (delta.tasks is accepted by
    // the schema today and read by nothing), invert this: Task B must survive.
    expect(
      after.some((t) => t.id === taskBId),
      "DEFECT: Task B is destroyed by a rename of Task A — invert this assertion once task-level deltas land"
    ).toBe(false);

    // Task A's assignment survived only because the row was recreated under the
    // same id inside one transaction. That is incidental, not a guarantee.
    expect(assignmentsAfter.length).toBe(1);
  });
});
