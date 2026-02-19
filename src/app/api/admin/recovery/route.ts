import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/nextauth-helpers";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Admin Recovery Requests API
 *
 * GET /api/admin/recovery - List all recovery requests
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user and verify admin role
    await requireAdmin();

    // Parse query parameters for filtering
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // pending, approved, rejected, or null for all

    // Build where clause
    const whereClause: { status?: string } = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      whereClause.status = status;
    }

    // Fetch recovery requests with user info
    const requests = await prisma.accountRecoveryRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Format response
    const formattedRequests = requests.map((request) => ({
      id: request.id,
      userId: request.userId,
      user: {
        email: request.user.email,
        name: request.user.name,
      },
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
    if (error instanceof Error) {
      if (error.message === "unauthorized") {
        return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "forbidden") {
        return NextResponse.json(
          { ok: false, message: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("[AdminRecovery] GET error:", error);
    return NextResponse.json(
      { ok: false, message: "Failed to fetch recovery requests" },
      { status: 500 }
    );
  }
}
