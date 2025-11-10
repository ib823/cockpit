import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig as authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// DELETE /api/account/passkeys/:id - Delete a passkey
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    console.error("Passkey delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
