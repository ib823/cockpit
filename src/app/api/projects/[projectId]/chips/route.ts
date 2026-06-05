import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { dal } from "@/data/prisma-adapter";
import { badRequest, unauthorized, forbidden, notFound } from "@/lib/api-response";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return unauthorized();
  }

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
    if (project.ownerId !== session.user.id) {
      return forbidden();
    }

    const chips = await dal.listChips(projectId);
    return NextResponse.json(chips);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
