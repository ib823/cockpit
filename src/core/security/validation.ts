import { z } from 'zod';

// Timeline input schemas
export const TimelineInputSchema = z.object({
  title: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().positive().max(1000000)
});

// Presales input schemas  
export const ChipInputSchema = z.object({
  value: z.string().min(1).max(200),
  type: z.enum(['country', 'employees', 'revenue', 'industry', 'modules']),
  confidence: z.number().min(0).max(1)
});

export function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}
