import { prisma } from "@/lib/db";
import { getSession } from "@/lib/nextauth-helpers";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { validateRequest, ValidationError, ProjectCreateSchema } from "@/lib/api-validators";
import { validationErrorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const projects = await prisma.projects.findMany({
    where: { ownerId: user.id },
    include: { chips: true, phases: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data = await req.json();

  // Preserve existing behavior: an absent/empty name defaults to "Untitled
  // Project". Apply the default before validation so that default still
  // succeeds, while malformed fields (e.g. an over-long name or invalid
  // status/types) are rejected with a 400.
  const candidate = {
    ...data,
    name: data?.name || "Untitled Project",
  };

  let validated: z.infer<typeof ProjectCreateSchema>;
  try {
    validated = validateRequest(ProjectCreateSchema, candidate);
  } catch (err) {
    if (err instanceof ValidationError) {
      return validationErrorResponse(err);
    }
    throw err;
  }

  const project = await prisma.projects.create({
    data: {
      id: randomUUID(),
      name: validated.name,
      ownerId: user.id,
      status: "DRAFT",
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(project);
}
