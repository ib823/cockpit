import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * Admin Recovery Requests API
 *
 * GET /api/admin/recovery - List all recovery requests
 */
export const GET = withAdmin(async (req) => {
  try {
    // Parse query parameters for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // pending, approved, rejected, or null for all

    const whereClause: { status?: string } = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      whereClause.status = status;
    }

    const requests = await prisma.accountRecoveryRequest.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      userId: request.userId,
      user: { email: request.user.email, name: request.user.name },
      reason: request.reason,
      notes: request.notes,
      status: request.status,
      submittedAt: request.submittedAt.toISOString(),
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt?.toISOString() || null,
      rejectedBy: request.rejectedBy,
      rejectedAt: request.rejectedAt?.toISOString() || null,
      rejectionReason: request.rejectionReason,
    }));

    return NextResponse.json({
      ok: true,
      requests: formattedRequests,
      total: formattedRequests.length,
    });
  } catch (error) {
    logger.error("[AdminRecovery] GET error", { error });
    return NextResponse.json(
      { ok: false, message: "Failed to fetch recovery requests" },
      { status: 500 }
    );
  }
});
