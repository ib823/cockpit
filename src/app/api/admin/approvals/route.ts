import { prisma } from "../../../../lib/db";
import { withAdmin } from "@/lib/auth/with-auth";
import { hash } from "bcryptjs";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { randomUUID, randomInt } from "crypto";
export const runtime = "nodejs";
// SECURITY FIX: DEFECT-20251027-006 & REGRESSION-001
// Replaced Math.random() with crypto.randomInt() for cryptographically secure random code generation
function six() {
  return randomInt(100000, 1000000).toString();
}

export const GET = withAdmin(async () => {
  const users = await prisma.users.findMany({
    include: { Authenticator: true },
    orderBy: { createdAt: "desc" },
  });
  const approvals = await prisma.emailApproval.findMany();
  const byEmail = new Map(approvals.map((a) => [a.email, a]));

  // Aggregate both event types for every user in two queries rather than two
  // per user. This endpoint previously issued 2N+2 queries, so its cost grew
  // linearly with the user table on every admin page load.
  const eventAggregates = await prisma.auditEvent.groupBy({
    by: ["userId", "type"],
    _count: { _all: true },
    _max: { createdAt: true },
    where: {
      userId: { in: users.map((u) => u.id) },
      type: { in: ["login", "timeline.generate"] },
    },
  });

  const aggregateByUserAndType = new Map(
    eventAggregates.map((a) => [`${a.userId}:${a.type}`, a])
  );
  const emptyAggregate = { _count: { _all: 0 }, _max: { createdAt: null } };

  const rows = users.map((u) => {
      const appr = byEmail.get(u.email);
      const expired = !u.exception && u.accessExpiresAt <= new Date();

      const loginAgg = aggregateByUserAndType.get(`${u.id}:login`) ?? emptyAggregate;
      const timelineAgg =
        aggregateByUserAndType.get(`${u.id}:timeline.generate`) ?? emptyAggregate;

      let status: "pending" | "approved" | "enrolled" | "expired" = "pending";
      if (u.Authenticator.length > 0 && !expired) status = "enrolled";
      else if (appr && !appr.usedAt && appr.tokenExpiresAt > new Date()) status = "approved";
      else if (expired) status = "expired";

      return {
        email: u.email,
        status,
        exception: u.exception,
        expiry: u.accessExpiresAt,
        codeActive: !!(appr && !appr.usedAt && appr.tokenExpiresAt > new Date()),
        loginCount: loginAgg._count._all,
        lastLoginAt: loginAgg._max.createdAt,
        timelineRuns: timelineAgg._count._all,
        lastTimelineAt: timelineAgg._max.createdAt,
      };
  });

  return NextResponse.json({ rows });
});

export const POST = withAdmin(async (req, auth) => {
  const { email } = await req.json();

  const code = six();
  // SECURITY FIX: DEFECT-20251027-012
  // Increased bcrypt cost factor from 10 to 12 for industry-standard security (2024)
  const tokenHash = await hash(code, 12);
  const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  await prisma.emailApproval.upsert({
    where: { email },
    update: {
      tokenHash,
      tokenExpiresAt: new Date(Date.now() + EXPIRY_MS),
      usedAt: null,
      approvedByUserId: auth.userId,
    },
    create: {
      email,
      tokenHash,
      tokenExpiresAt: new Date(Date.now() + EXPIRY_MS),
      approvedByUserId: auth.userId,
    },
  });

  await prisma.users.upsert({
    where: { email },
    update: {},
    create: {
      id: randomUUID(),
      email,
      role: Role.USER,
      accessExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      updatedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      id: randomUUID(),
      userId: auth.userId,
      type: "admin.approve",
      meta: { email },
    },
  });

  return NextResponse.json({ ok: true, code });
});

export const PATCH = withAdmin(async (req) => {
  const { email, action } = (await req.json()) as {
    email: string;
    action: "toggle-exception" | "disable" | "reapprove";
  };

  if (action === "toggle-exception") {
    const cur = await prisma.users.findUnique({ where: { email } });
    if (!cur) return NextResponse.json({ ok: false }, { status: 404 });
    await prisma.users.update({ where: { email }, data: { exception: !cur.exception } });
    return NextResponse.json({ ok: true });
  }

  if (action === "disable") {
    await prisma.users.update({ where: { email }, data: { accessExpiresAt: new Date() } });
    return NextResponse.json({ ok: true });
  }

  if (action === "reapprove") {
    const code = six();
    // SECURITY FIX: DEFECT-20251027-012
    // Increased bcrypt cost factor from 10 to 12 for industry-standard security (2024)
    const tokenHash = await hash(code, 12);
    const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
    await prisma.emailApproval.upsert({
      where: { email },
      update: { tokenHash, tokenExpiresAt: new Date(Date.now() + EXPIRY_MS), usedAt: null },
      create: {
        email,
        tokenHash,
        tokenExpiresAt: new Date(Date.now() + EXPIRY_MS),
        approvedByUserId: "system",
      },
    });
    return NextResponse.json({ ok: true, code });
  }

  return NextResponse.json({ ok: false }, { status: 400 });
});
