// src/lib/critical-patterns.ts
// Advanced pattern detection for Bahasa Malaysia and complex requirements

export interface CriticalFactor {
  type: "branch" | "entity" | "subsidiary" | "company_code" | "plant";
  count: number;
  multiplier: number;
  confidence: number;
  evidence: string;
}

export interface MultiEntityDetection {
  factors: CriticalFactor[];
  totalMultiplier: number;
  warnings: string[];
}

/**
 * Detect multi-branch/entity patterns in both English and Bahasa Malaysia
 */
export function detectMultiEntityFactors(text: string): MultiEntityDetection {
  const factors: CriticalFactor[] = [];
  const warnings: string[] = [];

  // Pattern 1: Branches (English + BM)
  const branchPatterns = [
    /(\d+)\s+(?:branch|branches|cawangan)/gi,
    /(?:branch|branches|cawangan)[:\s]+(\d+)/gi,
    /beroperasi\s+di\s+(\d+)\s+(?:lokasi|cawangan)/gi,
  ];

  for (const pattern of branchPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const count = parseInt(match[1]);
      if (count > 1 && count < 100) {
        // Sanity check
        factors.push({
          type: "branch",
          count,
          multiplier: Math.sqrt(count), // Non-linear scaling
          confidence: 0.9,
          evidence: match[0],
        });
      }
    }
  }

  // Pattern 2: Entities/Subsidiaries
  const entityPatterns = [
    /(\d+)\s+(?:entities|entity|syarikat|anak syarikat|subsidiaries)/gi,
    /operating\s+(\d+)\s+(?:separate|legal)\s+entities/gi,
  ];

  for (const pattern of entityPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const count = parseInt(match[1]);
      if (count > 1 && count < 50) {
        factors.push({
          type: "entity",
          count,
          multiplier: count * 1.5, // Linear + overhead
          confidence: 0.85,
          evidence: match[0],
        });
      }
    }
  }

  // Pattern 3: Company Codes (SAP-specific)
  const companyCodePatterns = [/(\d+)\s+company\s+codes?/gi, /(\d+)\s+kod\s+syarikat/gi];

  for (const pattern of companyCodePatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const count = parseInt(match[1]);
      if (count > 1 && count < 20) {
        factors.push({
          type: "company_code",
          count,
          multiplier: count * 0.8, // Less overhead than entities
          confidence: 0.95,
          evidence: match[0],
        });
      }
    }
  }

  // Pattern 4: Plants/Kilang
  const plantPatterns = [
    /(\d+)\s+(?:plants?|kilang)/gi,
    /(\d+)\s+(?:manufacturing|production)\s+(?:facilities|sites)/gi,
  ];

  for (const pattern of plantPatterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const count = parseInt(match[1]);
      if (count > 1 && count < 30) {
        factors.push({
          type: "plant",
          count,
          multiplier: count * 1.2,
          confidence: 0.8,
          evidence: match[0],
        });
      }
    }
  }

  // Deduplication: keep highest confidence per type
  const uniqueFactors = factors.reduce((acc, factor) => {
    const existing = acc.find((f) => f.type === factor.type);
    if (!existing || factor.confidence > existing.confidence) {
      return [...acc.filter((f) => f.type !== factor.type), factor];
    }
    return acc;
  }, [] as CriticalFactor[]);

  // Calculate total multiplier (use max, not sum, to avoid double-counting)
  const totalMultiplier =
    uniqueFactors.length > 0 ? Math.max(...uniqueFactors.map((f) => f.multiplier)) : 1.0;

  // Generate warnings for unusual patterns
  if (uniqueFactors.length > 1) {
    warnings.push(
      `Multiple organizational structures detected (${uniqueFactors.map((f) => f.type).join(", ")}). ` +
        `Ensure these are distinct and not overlapping.`
    );
  }

  if (totalMultiplier > 10) {
    warnings.push(
      `Very high complexity multiplier (${totalMultiplier.toFixed(1)}x). ` +
        `Consider phased rollout approach.`
    );
  }

  return {
    factors: uniqueFactors,
    totalMultiplier,
    warnings,
  };
}

/**
 * Detect employee count with better accuracy
 */
export function detectEmployeeCount(text: string): {
  count: number | null;
  confidence: number;
  evidence: string;
} {
  const patterns = [
    /(\d+[\d,]*)\s+(?:employees?|pekerja|workers?|staff)/gi,
    /(?:workforce|headcount|team size)[:\s]+(\d+[\d,]*)/gi,
    /(\d+[\d,]*)\s+orang\s+(?:pekerja|kakitangan)/gi,
  ];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const countStr = match[1].replace(/,/g, "");
      const count = parseInt(countStr);

      if (count >= 10 && count <= 100000) {
        return {
          count,
          confidence: 0.9,
          evidence: match[0],
        };
      }
    }
  }

  return { count: null, confidence: 0, evidence: "" };
}

/**
 * Detect revenue with currency
 */
export function detectRevenue(text: string): {
  amount: number | null;
  currency: string | null;
  confidence: number;
  evidence: string;
} {
  const patterns = [
    /(MYR|SGD|USD|VND)\s*([\d,]+(?:\.\d+)?)\s*(?:million|M|billion|B|juta|bilion)?/gi,
    /([\d,]+(?:\.\d+)?)\s*(?:million|M|billion|B|juta|bilion)?\s*(MYR|SGD|USD|VND)/gi,
  ];

  for (const pattern of patterns) {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      const currency = match[1] || match[3];
      const amountStr = (match[2] || match[1]).replace(/,/g, "");
      let amount = parseFloat(amountStr);

      // Handle million/billion suffixes
      if (match[0].match(/million|M|juta/i)) amount *= 1000000;
      if (match[0].match(/billion|B|bilion/i)) amount *= 1000000000;

      if (amount >= 100000 && amount <= 100000000000) {
        return {
          amount,
          currency: currency.toUpperCase(),
          confidence: 0.85,
          evidence: match[0],
        };
      }
    }
  }

  return { amount: null, currency: null, confidence: 0, evidence: "" };
}

// Pattern arrays for enhanced chip parser
export const CRITICAL_PATTERNS = {
  legal_entities: [
    /(\d+)\s+(?:legal\s+)?entit(?:y|ies)/gi,
    /(\d+)\s+(?:companies|syarikat|anak\s+syarikat)/gi,
    /(\d+)\s+subsidiar(?:y|ies)/gi,
    /operating\s+(\d+)\s+(?:separate|legal)\s+entities/gi,
  ],
  locations: [
    /(\d+)\s+(?:locations?|sites?|offices?|cawangan|branches?)/gi,
    /operating\s+(?:in|across)\s+(\d+)\s+(?:locations?|sites?|countries?)/gi,
    /beroperasi\s+di\s+(\d+)\s+(?:lokasi|cawangan)/gi,
  ],
  employees: [
    /(\d+[\d,]*)\s+(?:employees?|pekerja|workers?|staff)/gi,
    /(?:workforce|headcount|team size)[:\s]+(\d+[\d,]*)/gi,
    /(\d+[\d,]*)\s+orang\s+(?:pekerja|kakitangan)/gi,
  ],
  revenue: [
    /(MYR|SGD|USD|VND)\s*([\d,]+(?:\.\d+)?)\s*(?:million|M|billion|B|juta|bilion)?/gi,
    /([\d,]+(?:\.\d+)?)\s*(?:million|M|billion|B|juta|bilion)?\s*(MYR|SGD|USD|VND)/gi,
  ],
  data_volume: [
    /(\d+[\d,]*)\s+(?:transactions?|documents?|records?)/gi,
    /(?:processing|handling)\s+(\d+[\d,]*)\s+(?:per\s+)?(?:day|month|year)/gi,
  ],
  integrations: [
    /integrat(?:e|ion)\s+with\s+(\d+)\s+(?:systems?|applications?)/gi,
    /(\d+)\s+(?:legacy|existing|third-party)\s+(?:systems?|integrations?)/gi,
    /connect\s+to\s+(\d+)\s+(?:external|downstream)\s+systems?/gi,
  ],
  company_codes: [/(\d+)\s+company\s+codes?/gi, /(\d+)\s+kod\s+syarikat/gi],
  plants: [
    /(\d+)\s+(?:plants?|kilang)/gi,
    /(\d+)\s+(?:manufacturing|production)\s+(?:facilities|sites)/gi,
  ],
  users: [
    /(\d+[\d,]*)\s+(?:concurrent\s+)?users?/gi,
    /(\d+[\d,]*)\s+(?:named\s+)?licenses?/gi,
    /user\s+base\s+of\s+(\d+[\d,]*)/gi,
  ],
  legacy_systems: [
    /(\d+)\s+(?:legacy|existing|current)\s+systems?/gi,
    /integrat(?:e|ion)\s+with\s+(\d+)\s+systems?/gi,
    /replace\s+(\d+)\s+(?:legacy|existing)\s+systems?/gi,
  ],
};

export const EFFORT_IMPACT_RULES: any = {
  legal_entities: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 3, multiplier: 1.5 },
    high: { max: 5, multiplier: 2.0 },
    extreme: { max: 999, multiplier: 3.0 },
  },
  locations: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 3, multiplier: 1.3 },
    high: { max: 10, multiplier: 1.8 },
    extreme: { max: 999, multiplier: 2.5 },
  },
  employees: {
    low: { max: 100, multiplier: 1.0 },
    medium: { max: 500, multiplier: 1.2 },
    high: { max: 2000, multiplier: 1.5 },
    extreme: { max: 999999, multiplier: 2.0 },
  },
  users: {
    low: { max: 50, multiplier: 1.0 },
    medium: { max: 200, multiplier: 1.1 },
    high: { max: 1000, multiplier: 1.3 },
    extreme: { max: 999999, multiplier: 1.6 },
  },
  integrations: {
    low: { max: 2, multiplier: 1.0 },
    medium: { max: 5, multiplier: 1.3 },
    high: { max: 10, multiplier: 1.6 },
    extreme: { max: 999, multiplier: 2.0 },
  },
  data_volume: {
    low: { max: 1000, multiplier: 1.0 },
    medium: { max: 10000, multiplier: 1.2 },
    high: { max: 100000, multiplier: 1.5 },
    extreme: { max: 9999999, multiplier: 2.0 },
  },
  legacy_systems: {
    low: { max: 2, multiplier: 1.0 },
    medium: { max: 5, multiplier: 1.4 },
    high: { max: 10, multiplier: 1.8 },
    extreme: { max: 999, multiplier: 2.5 },
  },
  company_codes: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 3, multiplier: 1.2 },
    high: { max: 5, multiplier: 1.5 },
    extreme: { max: 999, multiplier: 2.0 },
  },
  plants: {
    low: { max: 1, multiplier: 1.0 },
    medium: { max: 3, multiplier: 1.3 },
    high: { max: 10, multiplier: 1.7 },
    extreme: { max: 999, multiplier: 2.2 },
  },
};

export const MISSING_INFO_ALERTS: unknown[] = [];

export function extractNumericValue(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0]) : null;
}

export function getSmartAssumptions(
  _industry?: string,
  _employees?: number,
  _revenue?: number
): any {
  return {
    legal_entities: 1,
    branches: 1,
  };
}
