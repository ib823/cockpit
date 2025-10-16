/**
 * API REQUEST VALIDATORS
 * Zod schemas for validating API route inputs
 *
 * SECURITY: All API routes MUST validate input using these schemas
 * to prevent injection attacks, data corruption, and API abuse
 */

import { z } from 'zod';

// ============================================================================
// PROJECT VALIDATORS
// ============================================================================

export const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Name required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  clientName: z.string().max(200, 'Client name too long').optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  complexity: z.string().max(50).optional(),
  region: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  employees: z.number().int().min(1).max(1000000).optional(),
  revenue: z.number().min(0).max(999999999999).optional(),
}).refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

// ============================================================================
// PHASE VALIDATORS
// ============================================================================

export const PhaseCreateSchema = z.object({
  name: z.string().min(1).max(100),
  workingDays: z.number().int().min(1).max(365),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  category: z.string().max(50),
  effort: z.number().min(0).max(10000),
  order: z.number().int().min(0),
  startBusinessDay: z.number().int().min(0).optional(),
  dependencies: z.array(z.string()).optional(),
});

export const PhaseUpdateSchema = PhaseCreateSchema.partial();

// ============================================================================
// RESOURCE VALIDATORS
// ============================================================================

export const ResourceSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  allocation: z.number().int().min(0).max(150, 'Allocation cannot exceed 150%'),
  hourlyRate: z.number().min(0).max(10000, 'Hourly rate too high'),
  region: z.string().max(100),
});

// ============================================================================
// MILESTONE VALIDATORS
// ============================================================================

export const MilestoneSchema = z.object({
  name: z.string().min(1).max(200),
  date: z.coerce.date(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
  description: z.string().max(1000).optional(),
  phaseId: z.string().optional(),
});

// ============================================================================
// COMMENT VALIDATORS
// ============================================================================

export const CommentCreateSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  resolved: z.boolean().optional(),
});

export const CommentUpdateSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  resolved: z.boolean().optional(),
});

// ============================================================================
// CHIP VALIDATORS
// ============================================================================

export const ChipSchema = z.object({
  type: z.enum([
    'COUNTRY',
    'EMPLOYEES',
    'REVENUE',
    'INDUSTRY',
    'MODULES',
    'TIMELINE',
    'INTEGRATION',
    'COMPLIANCE',
    'LEGAL_ENTITIES',
    'SSO',
    'BANKING',
    'EXISTING_SYSTEM',
    'LOCATIONS',
    'USERS',
    'DATA_VOLUME',
    'CURRENCIES',
    'LANGUAGES',
  ]),
  value: z.string().max(1000),
  confidence: z.number().min(0).max(1),
  evidence: z.string().max(500).optional(),
});

export const ChipBulkCreateSchema = z.array(ChipSchema).max(100, 'Too many chips');

// ============================================================================
// EXPORT VALIDATORS
// ============================================================================

export const ExportSchema = z.object({
  format: z.enum(['excel', 'pdf', 'pptx']),
  includeResources: z.boolean().optional(),
  includeFinancials: z.boolean().optional(),
  includeGantt: z.boolean().optional(),
});

// ============================================================================
// SHARE VALIDATORS
// ============================================================================

export const ShareCreateSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

// ============================================================================
// USER/ADMIN VALIDATORS
// ============================================================================

export const UserUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email('Invalid email format').max(320).optional(),
  role: z.enum(['USER', 'MANAGER', 'ADMIN']).optional(),
});

export const AdminAccessSchema = z.object({
  email: z.string().email('Invalid email format').max(320),
  expiresInDays: z.number().int().min(1).max(365),
  note: z.string().max(500).optional(),
});

export const AdminApprovalSchema = z.object({
  email: z.string().email('Invalid email format').max(320),
  action: z.enum(['approve', 'deny']),
});

// ============================================================================
// RICEFW VALIDATORS
// ============================================================================

export const RICEFWItemSchema = z.object({
  type: z.enum(['REPORT', 'INTERFACE', 'CONVERSION', 'ENHANCEMENT', 'FORM', 'WORKFLOW']),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  count: z.number().int().min(1).max(1000),
  effortPerItem: z.number().min(0).max(1000),
  phase: z.string().max(100),
});

// ============================================================================
// INTEGRATION VALIDATORS
// ============================================================================

export const IntegrationItemSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['API', 'FILE', 'DATABASE', 'MIDDLEWARE']),
  source: z.string().min(1).max(100),
  target: z.string().min(1).max(100),
  complexity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  volume: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  effort: z.number().min(0).max(10000),
});

// ============================================================================
// SEARCH/FILTER VALIDATORS
// ============================================================================

export const ProjectFilterSchema = z.object({
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'ARCHIVED']).optional(),
  region: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  complexity: z.enum(['standard', 'complex']).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ============================================================================
// VALIDATION HELPER
// ============================================================================

/**
 * Generic validator wrapper for API routes
 * Returns validated data or throws with formatted error
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.flatten();
    throw new ValidationError(
      'Validation failed',
      errors.fieldErrors as Record<string, string[]>
    );
  }

  return result.data;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
