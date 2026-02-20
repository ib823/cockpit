/**
 * F-04: Data Validation Coverage Audit
 *
 * Tracks which API routes use Zod validation (centralized or inline).
 * Ensures validation coverage doesn't regress.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/** Recursively find all route.ts files under a directory */
function findRouteFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        results.push(...findRouteFiles(full));
      } else if (entry === "route.ts") {
        results.push(full);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  return results;
}

/** Check if a route file contains Zod validation */
function hasZodValidation(filepath: string): boolean {
  const content = readFileSync(filepath, "utf-8");
  return (
    content.includes("from \"zod\"") ||
    content.includes("from 'zod'") ||
    content.includes("api-validators") ||
    content.includes(".safeParse(") ||
    content.includes(".parse(")
  );
}

/** Check if a route file has POST/PATCH/PUT/DELETE methods (mutation) */
function hasMutationMethod(filepath: string): boolean {
  const content = readFileSync(filepath, "utf-8");
  return /export\s+async\s+function\s+(POST|PATCH|PUT|DELETE)\b/.test(content);
}

describe("Validation Coverage Audit", () => {
  const apiDir = join(process.cwd(), "src/app/api");
  const routeFiles = findRouteFiles(apiDir);

  it("finds API route files", () => {
    expect(routeFiles.length).toBeGreaterThan(0);
  });

  it("mutation routes with Zod validation are tracked", () => {
    const mutationRoutes = routeFiles.filter(hasMutationMethod);
    const validatedRoutes = mutationRoutes.filter(hasZodValidation);

    // Current baseline: 13 routes with Zod out of ~40+ mutation routes
    // This test prevents regression — validated count should not decrease
    expect(validatedRoutes.length).toBeGreaterThanOrEqual(13);
  });

  it("tracks gantt-tool mutation routes with Zod validation", () => {
    const ganttRoutes = routeFiles
      .filter((f) => f.includes("/gantt-tool/"))
      .filter(hasMutationMethod);
    const validated = ganttRoutes.filter(hasZodValidation);

    // Baseline: 10 of 12 gantt-tool mutation routes have Zod.
    // Known gaps: invites/[token], projects/[projectId]/context
    expect(validated.length).toBeGreaterThanOrEqual(10);
  });

  it("centralized api-validators.ts exports expected schemas", async () => {
    const validators = await import("@/lib/api-validators");
    const expectedSchemas = [
      "ProjectCreateSchema",
      "ProjectUpdateSchema",
      "PhaseCreateSchema",
      "ResourceSchema",
      "MilestoneSchema",
      "CommentCreateSchema",
      "CommentUpdateSchema",
      "ChipSchema",
      "ChipBulkCreateSchema",
      "ExportSchema",
      "ShareCreateSchema",
      "UserUpdateSchema",
      "AdminAccessSchema",
      "AdminApprovalSchema",
      "RICEFWItemSchema",
      "IntegrationItemSchema",
      "ProjectFilterSchema",
    ];

    for (const name of expectedSchemas) {
      expect(
        (validators as Record<string, unknown>)[name],
        `Missing schema: ${name}`
      ).toBeDefined();
    }
  });

  it("validateRequest helper is exported", async () => {
    const { validateRequest } = await import("@/lib/api-validators");
    expect(typeof validateRequest).toBe("function");
  });
});
