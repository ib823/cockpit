/**
 * Gantt Tool API - Project Access Check
 *
 * GET /api/gantt-tool/projects/[projectId]/access - Check user's access level
 *
 * Returns the user's role and permissions for a specific project.
 * Used by the client to conditionally render UI elements based on permissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { checkProjectAccess } from "@/lib/gantt-tool/access-control";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const access = await checkProjectAccess(projectId, session.user.id);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      projectId,
      userId: session.user.id,
      role: access.role,
      permissions: {
        read: access.canRead,
        write: access.canWrite,
        editResources: access.canEditResources,
        admin: access.canAdmin,
      },
      isOwner: access.isOwner,
    });
  } catch (error) {
    console.error("[API] Failed to check project access:", error);
    return NextResponse.json(
      { error: "Failed to check project access" },
      { status: 500 }
    );
  }
}
