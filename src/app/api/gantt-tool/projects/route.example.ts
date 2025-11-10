/**
 * EXAMPLE: Protected API Route for Project Creation
 *
 * This demonstrates how to apply all security protections to an API endpoint
 *
 * To use this, rename to route.ts and update your existing route
 */

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { protectAPIRoute } from "@/lib/security/api-protection";
import { RATE_LIMITS } from "@/lib/security/rate-limiter";
import { addSecurityHeaders } from "@/lib/security/api-protection";

/**
 * POST /api/gantt-tool/projects
 * Create a new project with full security protection
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get user session
    const session = await getServerSession();
    const userId = session?.user?.id;

    // 2. Apply security protections
    const protection = await protectAPIRoute(req, {
      // Rate limiting: 10 projects per hour per user
      rateLimit: RATE_LIMITS.PROJECT_CREATE,

      // Require CAPTCHA for project creation (prevents spam)
      requireCaptcha: true,
      captchaAction: "create_project",

      // Enable bot detection
      detectBots: true,

      // Enable abuse detection
      detectAbuse: true,
      abuseAction: "create_project",

      // User identification
      userId,
    });

    // 3. Check if request is allowed
    if (!protection.allowed) {
      return NextResponse.json(
        {
          error: protection.error?.code || "FORBIDDEN",
          message: protection.error?.message || "Access denied",
        },
        {
          status: protection.error?.statusCode || 403,
          headers: protection.headers,
        }
      );
    }

    // 4. Parse and validate request body
    const body = await req.json();

    // Validate input
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Project name is required" },
        { status: 400 }
      );
    }

    if (body.name.length > 100) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Project name too long (max 100 characters)" },
        { status: 400 }
      );
    }

    // 5. Your existing project creation logic
    // const project = await createProject({ ...body, userId });

    // 6. Return success response with security headers
    const response = NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        // project,
      },
      {
        status: 201,
        headers: protection.headers,
      }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("[API] Project creation failed:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to create project",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gantt-tool/projects
 * List projects with lighter protection (higher rate limit)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = session?.user?.id;

    // Lighter protection for GET requests
    const protection = await protectAPIRoute(req, {
      rateLimit: RATE_LIMITS.API_GENERAL,
      detectBots: true,
      userId,
    });

    if (!protection.allowed) {
      return NextResponse.json(
        {
          error: protection.error?.code || "FORBIDDEN",
          message: protection.error?.message || "Access denied",
        },
        {
          status: protection.error?.statusCode || 403,
          headers: protection.headers,
        }
      );
    }

    // Your existing logic to fetch projects
    // const projects = await getProjects(userId);

    const response = NextResponse.json(
      {
        projects: [],
        // projects,
      },
      {
        status: 200,
        headers: protection.headers,
      }
    );

    return addSecurityHeaders(response);
  } catch (error) {
    console.error("[API] Failed to fetch projects:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to fetch projects",
      },
      { status: 500 }
    );
  }
}
