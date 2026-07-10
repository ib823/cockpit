import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { dal } from "@/data/prisma-adapter";
import { badRequest, forbidden, notFound } from "@/lib/api-response";

export const GET = withAuth<{ params: Promise<{ projectId: string }> }>(
  async (_request, auth, { params }) => {
    try {
      const { projectId } = await params;
      if (!projectId) {
        return badRequest("Project ID is required");
      }

      // Ownership check: the `projects` model only has `ownerId` (no collaborator
      // relation), so only the owner may read its chips.
      const project = await dal.getProject(projectId);
      if (!project) {
        return notFound("Project not found");
      }
      if (project.ownerId !== auth.userId) {
        return forbidden();
      }

      const chips = await dal.listChips(projectId);
      return NextResponse.json(chips);
    } catch {
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }
);
