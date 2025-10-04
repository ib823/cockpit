/**
 * Smart Defaults for Missing Chips
 * 
 * SECURITY: All defaults are conservative and clearly marked as assumptions
 * PRIVACY: No PII in default values
 * UX: Low confidence scores (0.3-0.5) to indicate uncertainty
 */

import { Chip, ChipSource, ChipType } from "@/types/core";

// Conservative default values for each chip type
export const CHIP_DEFAULTS: Record<ChipType, {
  value: string;
  confidence: number;
  note: string;
  unit?: string;
}> = {
  country: {
    value: "Malaysia",
    confidence: 0.3,
    note: "Default assumption - verify actual country",
  },
  legal_entities: {
    value: "1",
    confidence: 0.4,
    note: "Assumed single entity - common for SMEs",
  },
  locations: {
    value: "1",
    confidence: 0.4,
    note: "Assumed single location - verify if multi-site",
  },
  users: {
    value: "50",
    confidence: 0.3,
    note: "Conservative estimate - typical small deployment",
  },
  data_volume: {
    value: "10000",
    confidence: 0.3,
    note: "Estimated low volume - verify actual data size",
    unit: "transactions/month",
  },
  industry: {
    value: "Manufacturing",
    confidence: 0.3,
    note: "Default industry - update based on client sector",
  },
  modules: {
    value: "Finance",
    confidence: 0.4,
    note: "Core module assumption - add others as needed",
  },
  currencies: {
    value: "MYR",
    confidence: 0.4,
    note: "Default to MYR - update for multi-currency needs",
  },
  languages: {
    value: "EN",
    confidence: 0.5,
    note: "English default - add local languages if required",
  },
  business_units: {
    value: "1",
    confidence: 0.4,
    note: "Single business unit assumption",
  },
  legacy_systems: {
    value: "0",
    confidence: 0.3,
    note: "Assumed greenfield - update if replacing systems",
  },
  employees: {
    value: "100",
    confidence: 0.3,
    note: "Small organization estimate",
  },
  revenue: {
    value: "10000000",
    confidence: 0.2,
    note: "Revenue estimate - update with actual figures",
    unit: "MYR/year",
  },
  timeline: {
    value: "6 months",
    confidence: 0.3,
    note: "Standard timeline assumption",
  },
  integration: {
    value: "None",
    confidence: 0.5,
    note: "No integrations assumed initially",
  },
  compliance: {
    value: "Standard",
    confidence: 0.4,
    note: "Basic compliance requirements",
  },
  banking: {
    value: "Manual",
    confidence: 0.4,
    note: "Manual banking assumed - upgrade if needed",
  },
  existing_system: {
    value: "None",
    confidence: 0.4,
    note: "Greenfield assumption",
  },
};

// Validation rules for each chip type
export const CHIP_VALIDATION: Record<ChipType, {
  pattern?: RegExp;
  min?: number;
  max?: number;
  options?: string[];
  validator?: (value: string) => boolean;
  errorMessage: string;
}> = {
  country: {
    options: ["Malaysia", "Singapore", "Vietnam", "Thailand", "Indonesia", "Philippines"],
    errorMessage: "Please select a valid country",
  },
  legal_entities: {
    pattern: /^\d+$/,
    min: 1,
    max: 1000,
    errorMessage: "Must be a number between 1-1000",
  },
  locations: {
    pattern: /^\d+$/,
    min: 1,
    max: 1000,
    errorMessage: "Must be a number between 1-1000",
  },
  users: {
    pattern: /^\d+$/,
    min: 1,
    max: 100000,
    errorMessage: "Must be a number between 1-100,000",
  },
  data_volume: {
    pattern: /^\d+$/,
    min: 1,
    errorMessage: "Must be a positive number",
  },
  industry: {
    options: [
      "Manufacturing",
      "Retail",
      "Healthcare",
      "Financial Services",
      "Technology",
      "Education",
      "Government",
      "Professional Services",
      "Other",
    ],
    errorMessage: "Please select a valid industry",
  },
  modules: {
    options: ["Finance", "HR", "Supply Chain", "Manufacturing", "Sales", "CRM"],
    errorMessage: "Please select valid modules",
  },
  currencies: {
    options: ["MYR", "SGD", "USD", "EUR", "GBP", "VND", "THB"],
    errorMessage: "Please select a valid currency",
  },
  languages: {
    options: ["EN", "MS", "ZH", "TA", "VI", "TH", "ID"],
    errorMessage: "Please select valid languages",
  },
  business_units: {
    pattern: /^\d+$/,
    min: 1,
    max: 100,
    errorMessage: "Must be a number between 1-100",
  },
  legacy_systems: {
    pattern: /^\d+$/,
    min: 0,
    max: 50,
    errorMessage: "Must be a number between 0-50",
  },
  employees: {
    pattern: /^\d+$/,
    min: 1,
    max: 1000000,
    errorMessage: "Must be a number between 1-1,000,000",
  },
  revenue: {
    pattern: /^\d+$/,
    min: 0,
    errorMessage: "Must be a positive number",
  },
  timeline: {
    pattern: /^\d+\s*(months?|weeks?|days?)/i,
    errorMessage: "Format: '6 months' or '12 weeks'",
  },
  integration: {
    errorMessage: "Describe integration requirements",
  },
  compliance: {
    errorMessage: "Describe compliance requirements",
  },
  banking: {
    options: ["Manual", "Host-to-Host", "API", "SWIFT"],
    errorMessage: "Please select a banking integration type",
  },
  existing_system: {
    errorMessage: "Describe existing system (or 'None')",
  },
};

/**
 * SECURITY: Sanitize user input to prevent XSS and injection attacks
 */
export const sanitizeChipValue = (value: string): string => {
  return value
    .trim()
    .slice(0, 200) // Max 200 chars
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers with double quotes
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers with single quotes
    .replace(/\bon\w+\s*=\s*\S+/gi, ''); // Remove event handlers without quotes
};

/**
 * Validate a chip value against its type rules
 */
export const validateChipValue = (type: ChipType, value: string): {
  isValid: boolean;
  error?: string;
} => {
  const rules = CHIP_VALIDATION[type];
  
  if (!value || value.trim() === '') {
    return { isValid: false, error: "Value cannot be empty" };
  }

  // Check pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return { isValid: false, error: rules.errorMessage };
  }

  // Check options
  if (rules.options && !rules.options.includes(value)) {
    return { isValid: false, error: rules.errorMessage };
  }

  // Check numeric range
  if (rules.min !== undefined || rules.max !== undefined) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: "Must be a number" };
    }
    if (rules.min !== undefined && numValue < rules.min) {
      return { isValid: false, error: `Minimum value is ${rules.min}` };
    }
    if (rules.max !== undefined && numValue > rules.max) {
      return { isValid: false, error: `Maximum value is ${rules.max}` };
    }
  }

  // Custom validator
  if (rules.validator && !rules.validator(value)) {
    return { isValid: false, error: rules.errorMessage };
  }

  return { isValid: true };
};

/**
 * Generate a default chip for a given type
 */
export const createDefaultChip = (type: ChipType): Chip => {
  const defaults = CHIP_DEFAULTS[type];
  
  return {
    id: `default_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    value: defaults.value,
    confidence: defaults.confidence,
    source: "default" as ChipSource,
    metadata: {
      note: defaults.note,
      estimated: true,
      unit: defaults.unit,
    },
    timestamp: new Date(),
  };
};

/**
 * Fill all missing chips with smart defaults
 */
export const fillMissingChips = (
  existingChips: Chip[],
  gaps: string[]
): Chip[] => {
  const newChips: Chip[] = [];
  
  for (const gap of gaps) {
    // Only create if not already exists
    const exists = existingChips.some(chip => chip.type === gap);
    if (!exists && gap in CHIP_DEFAULTS) {
      newChips.push(createDefaultChip(gap as ChipType));
    }
  }
  
  return newChips;
};

/**
 * Get input type for a chip type (for form rendering)
 */
export const getInputType = (type: ChipType): 'text' | 'number' | 'select' => {
  const validation = CHIP_VALIDATION[type];
  
  if (validation.options) return 'select';
  if (validation.pattern && validation.pattern.source.includes('\\d')) return 'number';
  return 'text';
};

/**
 * SECURITY: Rate limiting for chip additions
 */
let chipAddCount = 0;
let lastAddTime = Date.now();
const RATE_LIMIT = 20; // Max 20 chips per 10 seconds
const RATE_WINDOW = 10000; // 10 seconds

export const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  if (now - lastAddTime > RATE_WINDOW) {
    chipAddCount = 0;
    lastAddTime = now;
  }
  
  if (chipAddCount >= RATE_LIMIT) {
    return false;
  }
  
  chipAddCount++;
  return true;
};

export const resetRateLimit = (): void => {
  chipAddCount = 0;
  lastAddTime = Date.now();
};