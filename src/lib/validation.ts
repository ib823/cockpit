/**
 * Zod Schemas for Data Validation
 *
 * These schemas define the shape of our data and are used by the DAL
 * to validate data at the application's boundaries (API, forms, etc.).
 * This ensures data integrity and provides type safety.
 */
import { z } from 'zod';

// --- Base Schemas ---

export const ChipSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  type: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  validated: z.boolean(),
});

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

export const ProjectSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  status: z.string(),
  ownerId: z.string(),
});

export const PhaseSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  name: z.string(),
  order: z.number(),
  start: z.date(),
  end: z.date(),
  duration: z.number(),
  effort: z.number(),
  cost: z.number(),
});

export const ResourceSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  name: z.string(),
  role: z.string(),
  allocation: z.number(),
  cost: z.number(),
});

export const RicefwSchema = z.object({
  id: z.string().cuid(),
  projectId: z.string().cuid(),
  type: z.enum(['Report', 'Interface', 'Conversion', 'Enhancement', 'Form', 'Workflow']),
  name: z.string(),
  complexity: z.enum(['S', 'M', 'L', 'XL']),
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