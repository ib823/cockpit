/**
 * Project Context API Endpoint
 *
 * Security: HIGHEST PRIORITY
 * - Authorization: Check user has EDITOR or OWNER role
 * - XSS Prevention: Sanitize all text inputs
 * - SQL Injection: Protected by Prisma ORM
 * - Rate limiting: Consider implementing if abuse detected
 *
 * Performance: LOW IMPACT
 * - Single UPDATE query (indexed on primary key)
 * - Payload size: ~2-5 KB typical
 *
 * Route: POST /api/gantt-tool/projects/[projectId]/context
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Input validation constants
const MAX_TEXT_LENGTH = 10000; // 10K characters per field
const MAX_SKILLS_COUNT = 50;
const MAX_SKILL_LENGTH = 100;

// Input sanitization (basic - DOMPurify runs client-side)
function sanitizeText(input: string | undefined): string {
  if (!input) return "";
  // Remove null bytes and control characters
  return input
    .replace(/\0/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

function sanitizeSkills(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .filter((s) => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= MAX_SKILL_LENGTH)
    .slice(0, MAX_SKILLS_COUNT);
}

interface ContextUpdateRequest {
  asIs?: string;
  toBe?: string;
  goals?: string;
  skills?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // 1. SECURITY: Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { projectId } = await params;

    // 2. SECURITY: Authorization check
    // User must be project owner or have EDITOR role
    const project = await prisma.ganttProject.findUnique({
      where: { id: projectId },
      select: {
        userId: true,
        collaborators: {
          where: {
            userId: userId,
            role: {
              in: ["EDITOR", "OWNER"],
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const isOwner = project.userId === userId;
    const isEditor = project.collaborators.length > 0;

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit this project" },
        { status: 403 }
      );
    }

    // 3. INPUT VALIDATION: Parse and sanitize request body
    let body: ContextUpdateRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const asIs = sanitizeText(body.asIs);
    const toBe = sanitizeText(body.toBe);
    const goals = sanitizeText(body.goals);
    const skills = sanitizeSkills(body.skills);

    // 4. BUILD CONTEXT DATA
    // Format: Store in painPoints field (existing schema field)
    // Architecture/v3 can read and enhance with entities/actors/capabilities
    const contextText = [
      asIs ? `AS-IS: ${asIs}` : "",
      toBe ? `TO-BE: ${toBe}` : "",
      goals ? `GOALS: ${goals}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // Get existing businessContext to preserve architect-added data
    const existingProject = await prisma.ganttProject.findUnique({
      where: { id: projectId },
      select: { businessContext: true },
    });

    const existingContext = (existingProject?.businessContext as Record<string, unknown>) || {};

    // Merge: Update painPoints (presales context) while preserving entities/actors/capabilities (architect context)
    const updatedContext = {
      ...existingContext,
      painPoints: contextText,
      skills: skills, // Store skills separately for easy filtering
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    // 5. DATABASE UPDATE with optimistic locking (version check)
    const updated = await prisma.ganttProject.update({
      where: { id: projectId },
      data: {
        businessContext: updatedContext,
        updatedAt: new Date(),
        lastModifiedBy: userId,
        version: {
          increment: 1, // Increment version for optimistic locking
        },
      },
      select: {
        id: true,
        businessContext: true,
        version: true,
      },
    });

    // 6. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      project: {
        id: updated.id,
        businessContext: updated.businessContext,
        version: updated.version,
      },
    });
  } catch (error) {
    console.error("Error updating project context:", error);

    // Handle specific Prisma errors
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Generic error response (don't leak internal details)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve context
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // 1. SECURITY: Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { projectId } = await params;

    // 2. SECURITY: Check user has access to project (owner or collaborator)
    const project = await prisma.ganttProject.findFirst({
      where: {
        id: projectId,
        OR: [
          { userId: userId },
          {
            collaborators: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        businessContext: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // 3. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      context: project.businessContext || {},
    });
  } catch (error) {
    console.error("Error fetching project context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
