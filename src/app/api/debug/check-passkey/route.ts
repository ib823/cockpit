import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get email from query params
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "admin@example.com";

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        Authenticator: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          found: false,
          email,
          message: "User not found in database",
        },
        { status: 404 }
      );
    }

    // Check admin approval
    const adminApproval = await prisma.emailApproval.findUnique({
      where: { email },
    });

    const hasExpiredAdminAccess = adminApproval?.tokenExpiresAt
      ? new Date(adminApproval.tokenExpiresAt) < new Date()
      : false;

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        emailVerified: !!user.emailVerified,
      },
      authenticators: {
        count: user.Authenticator.length,
        registered: user.Authenticator.length > 0,
        details: user.Authenticator.map((auth: any) => ({
          id: auth.id.substring(0, 20) + "...",
          deviceType: auth.deviceType,
          createdAt: auth.createdAt,
          lastUsedAt: auth.lastUsedAt,
          counter: auth.counter,
        })),
      },
      adminAccess: adminApproval
        ? {
            hasApproval: true,
            approvedByUserId: adminApproval.approvedByUserId,
            createdAt: adminApproval.createdAt,
            tokenExpiresAt: adminApproval.tokenExpiresAt,
            expired: hasExpiredAdminAccess,
          }
        : {
            hasApproval: false,
          },
      diagnosis: {
        canLogin: user.Authenticator.length > 0 && (!hasExpiredAdminAccess || !adminApproval),
        issues: [
          ...(user.Authenticator.length === 0
            ? ["No passkeys registered - register at /register-secure"]
            : []),
          ...(hasExpiredAdminAccess ? ["Admin access expired - request renewal"] : []),
        ],
      },
    });
  } catch (error: unknown) {
    console.error("Error checking passkey:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unknown error occurred",
        stack: process.env.NODE_ENV === "development" && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
