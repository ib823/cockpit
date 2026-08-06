/**
 * Regression tests for the cross-project IDOR in the delta-save endpoint.
 *
 * The vulnerability: PATCH /api/gantt-tool/projects/[projectId]/delta verified
 * write access against `projectId`, but then applied per-entity mutations using
 * client-supplied ids with no project scoping —
 * `tx.ganttPhase.update({ where: { id: phase.id } })` and friends. A user with
 * write access to their own project could name another tenant's phase,
 * resource, milestone or holiday id and have the write land there. Worse, the
 * phase task re-sync issued
 * `ganttTask.deleteMany({ where: { phaseId: { in: [...] } } })`, so naming a
 * foreign phase id deleted every task under it along with its resource
 * assignments.
 *
 * The fix authorizes every referenced id against the target project before any
 * write runs, and fails the whole request closed.
 */

import { describe, test, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const counts = {
  ganttResource: vi.fn(),
  ganttPhase: vi.fn(),
  ganttMilestone: vi.fn(),
  ganttHoliday: vi.fn(),
};

// Records writes so a leaked mutation is visible to assertions.
const writes: Array<{ model: string; op: string; where: unknown }> = [];

function model(name: keyof typeof counts) {
  const record = (op: string) => (args: { where?: unknown }) => {
    writes.push({ model: name, op, where: args?.where });
    return Promise.resolve({ count: 0 });
  };
  return {
    count: (...a: unknown[]) => counts[name](...a),
    update: record("update"),
    updateMany: record("updateMany"),
    deleteMany: record("deleteMany"),
    createMany: record("createMany"),
    findUnique: () => Promise.resolve({ id: "proj-mine", updatedAt: new Date() }),
    findFirst: () => Promise.resolve(null),
  };
}

const tx = {
  ganttResource: model("ganttResource"),
  ganttPhase: model("ganttPhase"),
  ganttMilestone: model("ganttMilestone"),
  ganttHoliday: model("ganttHoliday"),
  ganttTask: model("ganttPhase"),
  ganttPhaseResourceAssignment: model("ganttPhase"),
  ganttTaskResourceAssignment: model("ganttPhase"),
  ganttProject: model("ganttPhase"),
};

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: (fn: (t: unknown) => Promise<unknown>) => fn(tx),
    audit_logs: { create: vi.fn().mockResolvedValue({}) },
    ganttProject: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/lib/gantt-tool/access-control", () => ({
  // The caller legitimately owns the project named in the URL.
  checkProjectAccess: vi.fn().mockResolvedValue({ canWrite: true, canRead: true }),
}));

// The request body IS the delta — DeltaSaveSchema parses it at the top level.
function patch(projectId: string, delta: unknown): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/gantt-tool/projects/${projectId}/delta`,
    {
      method: "PATCH",
      body: JSON.stringify(delta),
      headers: { "Content-Type": "application/json" },
    }
  );
}

const ctx = (projectId: string) => ({ params: Promise.resolve({ projectId }) });

describe("delta save: cross-project entity references (V-2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    writes.length = 0;
    // No id supplied by the client belongs to the target project.
    Object.values(counts).forEach((c) => c.mockResolvedValue(0));
  });

  test("THE EXPLOIT: updating another project's phase is rejected", async () => {
    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    const res = await PATCH(
      patch("proj-mine", {
        phases: {
          updated: [
            {
              id: "phase-owned-by-victim",
              name: "pwned",
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              tasks: [],
            },
          ],
        },
      }),
      ctx("proj-mine")
    );

    expect(res.status).toBe(403);
  });

  test("no write reaches the database when a foreign id is present", async () => {
    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    await PATCH(
      patch("proj-mine", {
        phases: {
          updated: [
            {
              id: "phase-owned-by-victim",
              name: "pwned",
              startDate: new Date().toISOString(),
              endDate: new Date().toISOString(),
              tasks: [],
            },
          ],
        },
      }),
      ctx("proj-mine")
    );

    // The destructive task re-sync must never have run.
    expect(writes.filter((w) => w.op === "deleteMany")).toHaveLength(0);
    expect(writes.filter((w) => w.op === "update")).toHaveLength(0);
  });

  test("foreign resource ids are rejected", async () => {
    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    const res = await PATCH(
      patch("proj-mine", {
        resources: {
          updated: [{ id: "resource-owned-by-victim", name: "pwned", category: "x", designation: "y" }],
        },
      }),
      ctx("proj-mine")
    );

    expect(res.status).toBe(403);
  });

  test("foreign milestone ids are rejected", async () => {
    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    const res = await PATCH(
      patch("proj-mine", {
        milestones: {
          updated: [
            { id: "milestone-owned-by-victim", name: "pwned", date: new Date().toISOString() },
          ],
        },
      }),
      ctx("proj-mine")
    );

    expect(res.status).toBe(403);
  });

  test("foreign holiday ids are rejected", async () => {
    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    const res = await PATCH(
      patch("proj-mine", {
        holidays: {
          updated: [
            { id: "holiday-owned-by-victim", name: "pwned", date: new Date().toISOString() },
          ],
        },
      }),
      ctx("proj-mine")
    );

    expect(res.status).toBe(403);
  });

  test("entities that do belong to the project are still writable", async () => {
    // Every referenced id resolves inside the target project.
    Object.values(counts).forEach((c) => c.mockResolvedValue(1));

    const { PATCH } = await import(
      "@/app/api/gantt-tool/projects/[projectId]/delta/route"
    );

    const res = await PATCH(
      patch("proj-mine", {
        milestones: {
          updated: [{ id: "milestone-mine", name: "ok", date: new Date().toISOString() }],
        },
      }),
      ctx("proj-mine")
    );

    expect(res.status).toBe(200);
    expect(writes.some((w) => w.op === "updateMany")).toBe(true);
  });
});
