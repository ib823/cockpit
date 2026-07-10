/**
 * Gantt Tool API - Project Access Check
 *
 * GET /api/gantt-tool/projects/[projectId]/access - Check user's access level
 *
 * Returns the user's role and permissions for a specific project.
 * Used by the client to conditionally render UI elements based on permissions.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { checkProjectAccess } from "@/lib/gantt-tool/access-control";
import { logger } from "@/lib/logger";

export const GET = withAuth<{ params: Promise<{ projectId: string }> }>(
  async (_request, auth, { params }) => {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    const access = await checkProjectAccess(projectId, auth.userId);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      projectId,
      userId: auth.userId,
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
    logger.error("[API] Failed to check project access", { error: error });
    return NextResponse.json(
      { error: "Failed to check project access" },
      { status: 500 }
    );
  }
});
