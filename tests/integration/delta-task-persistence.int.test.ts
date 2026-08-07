/**
 * Integration test — does editing one task damage its phase?
 *
 * Calls the REAL delta route against a REAL PostgreSQL database. Both matter:
 * the mocked unit tests cannot answer this, and a test that re-implements the
 * route's diffing logic would only prove the re-implementation.
 *
 * The defect (audit finding #1, fixed 2026-08-07): `DeltaSaveSchema` accepted a
 * `tasks` block that nothing read, so task edits reached the database only
 * through the phase path — which deleted every task in the phase and recreated
 * whatever the payload contained. A payload missing a task destroyed it, and
 * cascaded away its resource assignments. Nothing on the server guaranteed the
 * client sent a complete array.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cockpit_e2e \
 *   RUN_DB_E2E=1 npx vitest run tests/integration/delta-task-persistence.int.test.ts
 */

import { describe, test, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

const describeDb = process.env.RUN_DB_E2E ? describe : describe.skip;

// A real client, replacing the global in-memory mock from tests/setup.ts.
const db = new PrismaClient();

vi.mock("@/lib/db", async () => {
  const { PrismaClient: PC } = await import("@prisma/client");
  return { prisma: new PC() };
});

// The caller legitimately owns the project; object-level authorization is
// covered separately in tests/security/delta-cross-project-idor.test.ts.
vi.mock("@/lib/gantt-tool/access-control", () => ({
  checkProjectAccess: vi.fn().mockResolvedValue({ canWrite: true, canRead: true }),
}));

let userId = "";
let projectId = "";
let phaseId = "";
let taskAId = "";
let taskBId = "";
let resourceId = "";
let assignmentId = "";

async function seed() {
  userId = randomUUID();
  projectId = randomUUID();
  phaseId = randomUUID();
  taskAId = randomUUID();
  taskBId = randomUUID();
  resourceId = randomUUID();
  assignmentId = randomUUID();

  await db.users.create({
    data: {
      id: userId,
      email: `qa-delta-${userId.slice(0, 8)}@example.com`,
      role: "USER",
      accessExpiresAt: new Date(Date.now() + 86_400_000),
      updatedAt: new Date(),
    },
  });
  await db.ganttProject.create({
    data: {
      id: projectId,
      userId,
      name: `QA delta ${projectId.slice(0, 8)}`,
      startDate: new Date("2026-01-01"),
    },
  });
  await db.ganttResource.create({
    data: {
      id: resourceId,
      projectId,
      name: "QA Resource",
      category: "Functional",
      designation: "Consultant",
    },
  });
  await db.ganttPhase.create({
    data: {
      id: phaseId,
      projectId,
      name: "Realize",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      order: 0,
    },
  });
  for (const [id, name, order] of [
    [taskAId, "Task A", 0],
    [taskBId, "Task B", 1],
  ] as const) {
    await db.ganttTask.create({
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
  await db.ganttTaskResourceAssignment.create({
    data: { id: assignmentId, taskId: taskAId, resourceId, allocationPercentage: 50 },
  });
}

async function cleanup() {
  if (projectId) await db.ganttProject.deleteMany({ where: { id: projectId } });
  if (userId) await db.users.deleteMany({ where: { id: userId } });
}

/** Invokes the real route handler. */
async function patchDelta(delta: unknown) {
  const { PATCH } = await import("@/app/api/gantt-tool/projects/[projectId]/delta/route");
  const req = new NextRequest(
    `http://localhost:3000/api/gantt-tool/projects/${projectId}/delta`,
    {
      method: "PATCH",
      body: JSON.stringify(delta),
      headers: { "Content-Type": "application/json" },
    }
  );
  return PATCH(req, { params: Promise.resolve({ projectId }) });
}

const DATES = { startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z" };
const PHASE_DATES = { startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-06-30T00:00:00.000Z" };

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describeDb("delta save — task persistence via the real route", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  test("a phase payload that omits a sibling no longer destroys it", async () => {
    // The client renames Task A and, as a partially-hydrated client does, sends
    // back only that one task inside the phase. This is the exact shape that
    // used to destroy Task B.
    const res = await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Realize",
            ...PHASE_DATES,
            order: 0,
            tasks: [{ id: taskAId, name: "Task A (renamed)", order: 0, ...DATES }],
          },
        ],
      },
    });
    expect(res.status).toBe(200);

    const after = await db.ganttTask.findMany({ where: { phaseId }, orderBy: { order: "asc" } });
    expect(after.find((t) => t.id === taskAId)?.name).toBe("Task A (renamed)");
    expect(
      after.some((t) => t.id === taskBId),
      "Task B must survive a rename of Task A"
    ).toBe(true);
  });

  test("the surviving task keeps its resource assignment row", async () => {
    await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Realize",
            ...PHASE_DATES,
            order: 0,
            tasks: [{ id: taskAId, name: "Task A (renamed)", order: 0, ...DATES }],
          },
        ],
      },
    });

    const assignments = await db.ganttTaskResourceAssignment.findMany({
      where: { taskId: taskAId },
    });
    expect(assignments).toHaveLength(1);
    // The same row, not a recreated one — identity is preserved.
    expect(assignments[0].id).toBe(assignmentId);
  });

  test("omission from a phase payload never deletes — deletion must be explicit", async () => {
    // A phase payload cannot distinguish "the user deleted this" from "the
    // client did not send it", so absence means unchanged. Task B is omitted
    // and a brand-new Task C is added in the same request.
    const taskCId = randomUUID();
    const res = await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Realize",
            ...PHASE_DATES,
            order: 0,
            tasks: [
              { id: taskAId, name: "Task A", order: 0, ...DATES },
              { id: taskCId, name: "Task C", order: 2, ...DATES },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);

    const after = await db.ganttTask.findMany({ where: { phaseId } });
    expect(after.map((t) => t.name).sort()).toEqual(["Task A", "Task B", "Task C"]);
  });

  test("explicit deletion still works alongside a phase update", async () => {
    // The client that genuinely wants Task B gone says so.
    const res = await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Realize",
            ...PHASE_DATES,
            order: 0,
            tasks: [{ id: taskAId, name: "Task A", order: 0, ...DATES }],
          },
        ],
      },
      tasks: { deleted: [taskBId] },
    });
    expect(res.status).toBe(200);

    const after = await db.ganttTask.findMany({ where: { phaseId } });
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(taskAId);
  });

  test("delta.tasks updates a task without restating its phase", async () => {
    const res = await patchDelta({
      tasks: { updated: [{ id: taskBId, name: "Task B (via delta.tasks)", ...DATES }] },
    });
    expect(res.status).toBe(200);

    const after = await db.ganttTask.findMany({ where: { phaseId }, orderBy: { order: "asc" } });
    expect(after).toHaveLength(2);
    expect(after.find((t) => t.id === taskBId)?.name).toBe("Task B (via delta.tasks)");
    // The sibling is untouched — that is the whole point of a task-level delta.
    expect(after.find((t) => t.id === taskAId)?.name).toBe("Task A");
  });

  test("delta.tasks deletes only what it names", async () => {
    const res = await patchDelta({ tasks: { deleted: [taskBId] } });
    expect(res.status).toBe(200);

    const after = await db.ganttTask.findMany({ where: { phaseId } });
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(taskAId);
  });

  test("an assignment removed from the payload is removed from the database", async () => {
    // Tasks now survive, so their assignments are no longer swept away by
    // cascade. They must be reconciled explicitly, or an assignment the user
    // removed would persist forever.
    const res = await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Realize",
            ...PHASE_DATES,
            order: 0,
            tasks: [
              { id: taskAId, name: "Task A", order: 0, ...DATES, resourceAssignments: [] },
              { id: taskBId, name: "Task B", order: 1, ...DATES },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);

    expect(
      await db.ganttTaskResourceAssignment.findMany({ where: { taskId: taskAId } })
    ).toHaveLength(0);
    // Task B never supplied `resourceAssignments`, so it was left alone —
    // undefined means "not specified", not "empty".
    expect(await db.ganttTask.count({ where: { phaseId } })).toBe(2);
  });
});
