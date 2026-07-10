import { prisma } from "../../../../lib/db";
import { withAdmin } from "@/lib/auth/with-auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = withAdmin(async () => {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [users, active, logins24h, timelines24h] = await Promise.all([
    prisma.users.count(),
    prisma.users.count({
      where: { OR: [{ exception: true }, { accessExpiresAt: { gt: new Date() } }] },
    }),
    prisma.auditEvent.count({ where: { type: "login", createdAt: { gte: since } } }),
    prisma.auditEvent.count({ where: { type: "timeline.generate", createdAt: { gte: since } } }),
  ]);
  return NextResponse.json({ users, active, logins24h, timelines24h });
});
