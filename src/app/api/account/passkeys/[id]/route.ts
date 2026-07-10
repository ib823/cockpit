import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// DELETE /api/account/passkeys/:id - Delete a passkey
export const DELETE = withUser<{ params: Promise<{ id: string }> }>(
  async (req, user, { params }) => {
    try {
      const { id } = await params;

      // Find the passkey to delete
      const passkeyToDelete = await prisma.authenticator.findUnique({
        where: { id },
      });

      if (!passkeyToDelete) {
        return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
      }

      // Verify the passkey belongs to the user
      if (passkeyToDelete.userId !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      // Check if this is the last passkey
      const passkeyCount = await prisma.authenticator.count({
        where: { userId: user.id },
      });

      if (passkeyCount <= 1) {
        return NextResponse.json(
          { error: "Cannot delete your last passkey. Add another passkey first." },
          { status: 400 }
        );
      }

      // Delete the passkey
      await prisma.authenticator.delete({
        where: { id },
      });

      // Audit log the deletion
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";

      await prisma.audit_logs.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          action: "DELETE",
          entity: "PASSKEY",
          entityId: id,
          changes: {
            deletedPasskey: {
              id: passkeyToDelete.id,
              nickname: passkeyToDelete.nickname,
              deviceType: passkeyToDelete.deviceType,
            },
          },
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.error("Passkey delete error", { error: error });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
);
