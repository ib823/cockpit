import { Chip } from "@/types/core";

export interface CompletenessResult {
  score: number;
  gaps: string[];
  canProceed: boolean;
  blockers: string[];
  suggestions: string[];
}

export function validateCompleteness(chips: Chip[]): CompletenessResult {
  const requiredFields = [
    'country',
    'employees', 
    'modules',
    'timeline',
    'industry',
    'revenue'
  ];

  const extractedKinds = new Set(chips.map(chip => (chip as any).kind));
  const gaps = requiredFields.filter(field => !extractedKinds.has(field));
  
  const score = Math.max(0, Math.min(100, ((requiredFields.length - gaps.length) / requiredFields.length) * 100));
  const canProceed = score >= 60;
  
  const blockers = gaps.filter(gap => 
    ['country', 'modules', 'timeline'].includes(gap)
  );

  const suggestions = generateSuggestions(gaps, chips);

  return {
    score,
    gaps: gaps.map(formatGapMessage),
    canProceed,
    blockers: blockers.map(formatGapMessage),
    suggestions
  };
}

function formatGapMessage(gap: string): string {
  const messages: Record<string, string> = {
    country: 'Missing country/region information',
    employees: 'Missing employee count',
    modules: 'Missing SAP module requirements', 
    timeline: 'Missing timeline or go-live date',
    industry: 'Missing industry information',
    revenue: 'Missing revenue information'
  };
  
  return messages[gap] || `Missing ${gap}`;
}

function generateSuggestions(gaps: string[], chips: Chip[]): string[] {
  const suggestions: string[] = [];
  
  if (gaps.includes('country')) {
    suggestions.push('Specify the implementation country (Malaysia, Singapore, etc.)');
  }
  
  if (gaps.includes('modules')) {
    suggestions.push('List required SAP modules (Finance, HR, Supply Chain)');
  }
  
  if (gaps.includes('timeline')) {
    suggestions.push('Add target go-live date (Q2 2024, Q3 2024, etc.)');
  }
  
  if (gaps.length > 3) {
    suggestions.push('Consider providing more detailed requirements for better planning');
  }
  
  return suggestions;
}