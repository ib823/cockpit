/**
 * Zod Schemas for Data Validation
 *
 * NOTE: Core entity schemas (Project, Phase, Resource, Chip, etc.) are now
 * centralized in src/data/dal.ts to prevent validation inconsistencies.
 * Import from there for all database-backed entities.
 *
 * This file contains ONLY schemas for non-persisted or domain-specific entities.
 */
import { z } from "zod";

// --- Domain-Specific Schemas (Non-DAL) ---

export const DecisionSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  moduleCombo: z.string().optional(),
  bankingPath: z.string().optional(),
  rateRegion: z.string().optional(),
  ssoMode: z.string().optional(),
  targetPrice: z.number().optional(),
  targetMargin: z.number().optional(),
});

export const RicefwSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  type: z.enum(["Report", "Interface", "Conversion", "Enhancement", "Form", "Workflow"]),
  name: z.string(),
  complexity: z.enum(["S", "M", "L", "XL"]),
  effort: z.number(),
});

export const TimelineProfileSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  company: z.string(),
  industry: z.string(),
  employees: z.number(),
});

// --- Validation Utility ---

/**
 * Validates data against a Zod schema.
 * @param schema The Zod schema to validate against.
 * @param data The data to validate.
 * @returns A success or error object.
 */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}
