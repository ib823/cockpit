/**
 * Optimistic locking on the delta route, against a real database.
 *
 * The defect: two clients editing the same task both succeeded, and the second
 * silently overwrote the first. In a local-first app whose clients queue
 * changes while offline, that is not a rare race — it is the ordinary outcome
 * after two people work on the same plan on a plane.
 *
 * Mocked tests cannot demonstrate this. The guarantee is a property of the
 * WHERE clause in a real transaction, so these call the real route against a
 * real PostgreSQL.
 *
 * Run with:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cockpit_e2e \
 *   RUN_DB_E2E=1 npx vitest run tests/integration/delta-optimistic-lock.int.test.ts
 */

import { describe, test, expect, beforeEach, afterAll, vi } from "vitest";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

const describeDb = process.env.RUN_DB_E2E ? describe : describe.skip;

/**
 * A REAL client, obtained through `vi.importActual`.
 *
 * `tests/setup.ts` mocks `@prisma/client` itself, not merely `@/lib/db`. So a
 * plain `new PrismaClient()` here — and a plain `import("@prisma/client")`
 * inside the mock factory below — both return the in-memory mock, and the
 * whole suite passes without ever opening a connection.
 *
 * That is exactly what happened when this file was first written: it asserted
 * real database behaviour, passed, and touched no database. `importActual` is
 * what makes the word "integration" true here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

vi.mock("@/lib/db", async () => {
  const actual = await vi.importActual<typeof import("@prisma/client")>("@prisma/client");
  return { prisma: new actual.PrismaClient() };
});

vi.mock("@/lib/gantt-tool/access-control", () => ({
  checkProjectAccess: vi.fn().mockResolvedValue({ canWrite: true, canRead: true }),
}));

let userId = "";
let projectId = "";
let phaseId = "";
let taskId = "";

async function realClient() {
  const actual = await vi.importActual<typeof import("@prisma/client")>("@prisma/client");
  return new actual.PrismaClient();
}

async function seed() {
  if (!db) db = await realClient();
  userId = randomUUID();
  projectId = randomUUID();
  phaseId = randomUUID();
  taskId = randomUUID();

  await db.users.create({
    data: {
      id: userId,
      email: `qa-lock-${userId.slice(0, 8)}@example.com`,
      role: "USER",
      accessExpiresAt: new Date(Date.now() + 86_400_000),
      updatedAt: new Date(),
    },
  });
  await db.ganttProject.create({
    data: { id: projectId, userId, name: `QA lock ${projectId.slice(0, 8)}`, startDate: new Date("2026-01-01"), viewSettings: {} },
  });
  await db.ganttPhase.create({
    data: {
      id: phaseId,
      projectId,
      name: "Realize",
      // Required by the real schema; the mock let it through as undefined.
      color: "#0B57D0",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      order: 0,
    },
  });
  await db.ganttTask.create({
    data: {
      id: taskId,
      phaseId,
      name: "Original",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-02-01"),
      order: 0,
    },
  });
}

async function cleanup() {
  if (!db) return;
  if (projectId) await db.ganttProject.deleteMany({ where: { id: projectId } });
  if (userId) await db.users.deleteMany({ where: { id: userId } });
}

async function patchDelta(delta: unknown) {
  const { PATCH } = await import("@/app/api/gantt-tool/projects/[projectId]/delta/route");
  const req = new NextRequest(`http://localhost:3000/api/gantt-tool/projects/${projectId}/delta`, {
    method: "PATCH",
    body: JSON.stringify(delta),
    headers: { "Content-Type": "application/json" },
  });
  return PATCH(req, { params: Promise.resolve({ projectId }) });
}

const DATES = { startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-02-01T00:00:00.000Z" };

afterAll(async () => {
  if (db) {
    await cleanup();
    await db.$disconnect();
  }
});

describeDb("delta save — optimistic locking", () => {
  beforeEach(async () => {
    await cleanup();
    await seed();
  });

  test("a write at the current version succeeds and bumps it", async () => {
    const res = await patchDelta({
      tasks: { updated: [{ id: taskId, name: "First edit", version: 0, ...DATES }] },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.conflicts).toEqual([]);

    const after = await db.ganttTask.findUnique({ where: { id: taskId } });
    expect(after?.name).toBe("First edit");
    expect(after?.version).toBe(1);
  });

  test("THE DEFECT: a second client at a stale version does not overwrite", async () => {
    // Both clients read version 0. The first commits.
    await patchDelta({
      tasks: { updated: [{ id: taskId, name: "First edit", version: 0, ...DATES }] },
    });

    // The second is still holding version 0 — it never saw the first edit.
    const res = await patchDelta({
      tasks: { updated: [{ id: taskId, name: "Second edit", version: 0, ...DATES }] },
    });
    const body = await res.json();

    // Before this change, "Second edit" won silently and "First edit" was gone.
    const after = await db.ganttTask.findUnique({ where: { id: taskId } });
    expect(after?.name).toBe("First edit");
    expect(after?.version).toBe(1);

    expect(body.conflicts).toEqual([
      { entity: "task", id: taskId, expectedVersion: 0 },
    ]);
  });

  test("a conflict does not roll back the rest of the batch", async () => {
    // The reason conflicts are reported rather than thrown: a local-first
    // client batches a whole offline session, and losing forty good edits
    // because the forty-first collided is worse than the collision.
    await patchDelta({
      tasks: { updated: [{ id: taskId, name: "First edit", version: 0, ...DATES }] },
    });

    const res = await patchDelta({
      tasks: { updated: [{ id: taskId, name: "Stale", version: 0, ...DATES }] },
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Renamed phase",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-06-30T00:00:00.000Z",
            order: 0,
            version: 0,
          },
        ],
      },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    // The task collided...
    expect(body.conflicts).toHaveLength(1);
    expect(body.conflicts[0].entity).toBe("task");
    // ...and the phase, which did not, still applied.
    const phase = await db.ganttPhase.findUnique({ where: { id: phaseId } });
    expect(phase?.name).toBe("Renamed phase");
    expect(phase?.version).toBe(1);
  });

  test("a client that sends no version still writes, as before", async () => {
    // Backwards compatibility is the point: requiring a version would break
    // every deployed client on the day this ships.
    const res = await patchDelta({
      tasks: { updated: [{ id: taskId, name: "Unversioned", ...DATES }] },
    });
    const body = await res.json();

    expect(body.conflicts).toEqual([]);
    const after = await db.ganttTask.findUnique({ where: { id: taskId } });
    expect(after?.name).toBe("Unversioned");
    // Still incremented, so a versioned client that reads afterwards is correct.
    expect(after?.version).toBe(1);
  });

  test("phases lock independently of tasks", async () => {
    await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "First",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-06-30T00:00:00.000Z",
            order: 0,
            version: 0,
          },
        ],
      },
    });

    const res = await patchDelta({
      phases: {
        updated: [
          {
            id: phaseId,
            name: "Stale",
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-06-30T00:00:00.000Z",
            order: 0,
            version: 0,
          },
        ],
      },
    });
    const body = await res.json();

    expect(body.conflicts).toEqual([
      { entity: "phase", id: phaseId, expectedVersion: 0 },
    ]);
    const phase = await db.ganttPhase.findUnique({ where: { id: phaseId } });
    expect(phase?.name).toBe("First");
  });

  test("a client that re-reads and retries at the new version succeeds", async () => {
    // The recovery path the conflict report exists to enable.
    await patchDelta({
      tasks: { updated: [{ id: taskId, name: "First edit", version: 0, ...DATES }] },
    });

    const current = await db.ganttTask.findUnique({ where: { id: taskId } });
    const res = await patchDelta({
      tasks: {
        updated: [{ id: taskId, name: "Merged edit", version: current!.version, ...DATES }],
      },
    });
    const body = await res.json();

    expect(body.conflicts).toEqual([]);
    const after = await db.ganttTask.findUnique({ where: { id: taskId } });
    expect(after?.name).toBe("Merged edit");
    expect(after?.version).toBe(2);
  });
});
