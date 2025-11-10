import { prisma } from "../../../../lib/db";
import { requireAdmin } from "@/lib/nextauth-helpers";
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

export async function GET() {
  await requireAdmin();
  const users = await prisma.users.findMany({
    include: { Authenticator: true },
    orderBy: { createdAt: "desc" },
  });
  const approvals = await prisma.emailApproval.findMany();
  const byEmail = new Map(approvals.map((a) => [a.email, a]));

  const rows = await Promise.all(
    users.map(async (u) => {
      const appr = byEmail.get(u.email);
      const expired = !u.exception && u.accessExpiresAt <= new Date();

      const loginAgg = await prisma.auditEvent.aggregate({
        _count: { _all: true },
        _max: { createdAt: true },
        where: { userId: u.id, type: "login" },
      });
      const timelineAgg = await prisma.auditEvent.aggregate({
        _count: { _all: true },
        _max: { createdAt: true },
        where: { userId: u.id, type: "timeline.generate" },
      });

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
    })
  );

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
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
      approvedByUserId: admin.user.id as string,
    },
    create: {
      email,
      tokenHash,
      tokenExpiresAt: new Date(Date.now() + EXPIRY_MS),
      approvedByUserId: admin.user.id as string,
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
      userId: admin.user.id as string,
      type: "admin.approve",
      meta: { email },
    },
  });

  return NextResponse.json({ ok: true, code });
}

export async function PATCH(req: Request) {
  await requireAdmin();
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
}
