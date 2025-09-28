import { z } from 'zod';
import DOMPurify from 'dompurify';

// Input validation schemas
export const ChipSchema = z.object({
  id: z.string(),
  type: z.enum(['country', 'industry', 'size', 'employees', 'revenue', 'module', 'timeline', 'integration', 'compliance', 'language']),
  value: z.string().min(1).max(500),
  confidence: z.number().min(0).max(1).default(0.8),
  validated: z.boolean().default(false),
  source: z.enum(['manual', 'extracted', 'inferred']).default('extracted')
});

export const DecisionSchema = z.object({
  moduleCombo: z.enum(['finance_only', 'finance_hr', 'finance_scm', 'full_suite']).optional(),
  bankingPath: z.enum(['manual', 'host_to_host', 'multi_bank']).optional(),
  rateRegion: z.enum(['MY', 'SG', 'VN', 'TH', 'ID']).optional(),
  ssoMode: z.enum(['none', 'basic', 'enterprise']).optional(),
  targetPrice: z.number().min(0).max(100000000).optional(),
  targetMargin: z.number().min(0).max(1).optional()
});

export function validateAndSanitizeInput(text: string): string {
  if (typeof window === 'undefined') return text;
  
  const sanitized = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
  
  if (sanitized.length > 50000) {
    throw new Error('Input exceeds maximum allowed length');
  }
  
  return sanitized;
}

export function validateChips(chips: unknown[]): z.infer<typeof ChipSchema>[] {
  return z.array(ChipSchema).parse(chips);
}

export function validateDecisions(decisions: unknown): z.infer<typeof DecisionSchema> {
  return DecisionSchema.parse(decisions);
}