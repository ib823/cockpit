// Enhanced RFP Parser with Critical Business Patterns
// This extends the base parser with patterns that ACTUALLY drive SAP effort

import { parseRFPText as baseParseRFP } from "@/lib/chip-parser";
import {
  CRITICAL_PATTERNS,
  extractNumericValue,
  EFFORT_IMPACT_RULES,
  MISSING_INFO_ALERTS,
} from "@/lib/critical-patterns";

export interface ExtendedChip {
  id: string;
  type: string;
  value: string | number;
  confidence: number;
  source: string;
  evidence?: string;
  metadata?: {
    unit?: string;
    impact?: string;
    multiplier?: number;
    estimated?: boolean;
    range?: string;
    inferred?: boolean;
    note?: string;
  };
  timestamp?: Date;
}

export function parseRFPTextEnhanced(text: string): ExtendedChip[] {
  // First get base chips from your enhanced parser
  const baseChips = baseParseRFP(text);

  // Convert base chips to extended format
  const extendedChips: ExtendedChip[] = baseChips.map((chip) => ({
    id: chip.id || `chip_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: (chip as any).kind || chip.type,
    value: (chip as any).parsed?.value || chip.value || (chip as any).raw,
    confidence: (chip as any).evidence?.confidence?.score || chip.confidence || 0.8,
    source: "base_parser",
    evidence: (chip as any).evidence?.snippet || (chip as any).raw,
    metadata: {
      unit: (chip as any).parsed?.unit,
      ...(chip as any).metadata,
    },
    timestamp: chip.timestamp || new Date(),
  }));

  // Now extract critical business patterns
  const criticalChips = extractCriticalPatterns(text);

  // Merge, avoiding duplicates
  const allChips = [...extendedChips];

  for (const critical of criticalChips) {
    const isDuplicate = allChips.some(
      (existing) =>
        existing.type === critical.type && String(existing.value) === String(critical.value)
    );

    if (!isDuplicate) {
      allChips.push(critical);
    }
  }

  // Add impact calculations
  const allChipsWithImpact = allChips.map((chip) => addImpactAnalysis(chip, allChips));

  // Infer locations from countries if not explicitly stated
  const countryCount = allChipsWithImpact.filter((c) => c.type === "country").length;
  if (countryCount > 1 && !allChipsWithImpact.some((c) => c.type === "locations")) {
    allChipsWithImpact.push({
      id: `inferred_loc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "locations",
      value: countryCount,
      confidence: 0.6,
      source: "inference",
      evidence: `${countryCount} countries mentioned, assuming minimum ${countryCount} locations`,
      metadata: {
        inferred: true,
        note: "Minimum assumption based on countries mentioned",
        impact: getImpactLevel("locations", countryCount),
        multiplier: getMultiplier("locations", countryCount),
      },
      timestamp: new Date(),
    });
  }

  // Infer legal entities from countries if not explicitly stated
  if (countryCount > 1 && !allChipsWithImpact.some((c) => c.type === "legal_entities")) {
    allChipsWithImpact.push({
      id: `inferred_entities_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "legal_entities",
      value: countryCount,
      confidence: 0.5,
      source: "inference",
      evidence: `${countryCount} countries mentioned, likely ${countryCount}+ legal entities`,
      metadata: {
        inferred: true,
        note: "Conservative assumption: one entity per country minimum",
        impact: getImpactLevel("legal_entities", countryCount),
        multiplier: getMultiplier("legal_entities", countryCount),
      },
      timestamp: new Date(),
    });
  }

  return allChipsWithImpact;
}

function extractCriticalPatterns(text: string): ExtendedChip[] {
  const chips: ExtendedChip[] = [];

  // Legal Entities
  for (const pattern of CRITICAL_PATTERNS.legal_entities) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        const value = extractNumericValue(match[1]);
        if (value !== null && value > 0) {
          chips.push({
            id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "legal_entities",
            value: value,
            confidence: 0.9,
            source: "critical_parser",
            evidence: match[0],
            metadata: {
              unit: "entities",
              impact: getImpactLevel("legal_entities", value),
              multiplier: getMultiplier("legal_entities", value),
            },
          });
        }
      }
    }
  }

  // Locations
  for (const pattern of CRITICAL_PATTERNS.locations) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        const value = extractNumericValue(match[1]);
        if (value !== null && value > 0) {
          chips.push({
            id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "locations",
            value: value,
            confidence: 0.88,
            source: "critical_parser",
            evidence: match[0],
            metadata: {
              unit: "locations",
              impact: getImpactLevel("locations", value),
              multiplier: getMultiplier("locations", value),
            },
          });
        }
      }
    }
  }

  // Data Volume
  for (const pattern of CRITICAL_PATTERNS.data_volume) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        const value = extractNumericValue(match[1]);
        if (value !== null && value > 0) {
          const isTransactions = /transaction|invoice|order|PO|SO/i.test(match[0]);
          const isMasterData = /SKU|material|product|customer|vendor/i.test(match[0]);

          chips.push({
            id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "data_volume",
            value: value,
            confidence: 0.85,
            source: "critical_parser",
            evidence: match[0],
            metadata: {
              unit: isTransactions ? "transactions/day" : "records",
              impact: isTransactions
                ? getImpactLevel("data_volume_transactions_per_day", value)
                : getImpactLevel("data_volume", value),
              multiplier: isTransactions
                ? getMultiplier("data_volume_transactions_per_day", value)
                : getMultiplier("data_volume", value),
            },
          });
        }
      }
    }
  }

  // Users
  for (const pattern of CRITICAL_PATTERNS.users) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        const value = extractNumericValue(match[1]);
        if (value !== null && value > 0) {
          chips.push({
            id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "users",
            value: value,
            confidence: 0.92,
            source: "critical_parser",
            evidence: match[0],
            metadata: {
              unit: "users",
              impact: getImpactLevel("users", value),
              multiplier: getMultiplier("users", value),
            },
          });
        }
      }
    }
  }

  // Vague Employee Pattern
  const vagueEmployeePattern =
    /(?:few|several|many)\s+(hundred|thousand)\s+(?:people|employees|staff)/gi;
  for (const match of text.matchAll(vagueEmployeePattern)) {
    const multiplier = match[1].toLowerCase();
    const estimate = multiplier === "hundred" ? 200 : 2000;

    chips.push({
      id: `vague_emp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "employees",
      value: estimate,
      confidence: 0.5,
      source: "fuzzy_parser",
      evidence: match[0],
      metadata: {
        estimated: true,
        range: multiplier === "hundred" ? "100-500" : "1000-5000",
        note: "Estimated from vague description",
      },
    });
  }

  const vagueLocationPattern =
    /(?:several|multiple|various|some|many)\s+(?:branches?|locations?|plants?|sites?|offices?)/gi;
  for (const match of text.matchAll(vagueLocationPattern)) {
    const estimate = 3; // Conservative estimate for "several"

    chips.push({
      id: `vague_loc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "locations",
      value: estimate,
      confidence: 0.4,
      source: "fuzzy_parser",
      evidence: match[0],
      metadata: {
        estimated: true,
        range: "2-5",
        note: "Estimated from vague description",
      },
    });
  }

  // Legacy Systems
  for (const pattern of CRITICAL_PATTERNS.legacy_systems) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) {
        const value = extractNumericValue(match[1]);
        if (value !== null && value > 0) {
          chips.push({
            id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "legacy_systems",
            value: value,
            confidence: 0.85,
            source: "critical_parser",
            evidence: match[0],
            metadata: {
              unit: "systems",
              impact: getImpactLevel("legacy_systems", value),
              multiplier: getMultiplier("legacy_systems", value),
            },
          });
        }
      }
    }
  }

  // Multi-currency detection
  const currencyMatches = text.match(/\b(MYR|SGD|USD|EUR|GBP|JPY|CNY|THB|IDR|PHP|VND|INR)\b/gi);
  if (currencyMatches) {
    const uniqueCurrencies = new Set(currencyMatches.map((c) => c.toUpperCase()));
    if (uniqueCurrencies.size > 1) {
      chips.push({
        id: `critical_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        type: "currencies",
        value: uniqueCurrencies.size,
        confidence: 0.88,
        source: "critical_parser",
        evidence: Array.from(uniqueCurrencies).join(", "),
        metadata: {
          unit: "currencies",
          impact: uniqueCurrencies.size > 3 ? "high" : "medium",
          multiplier: uniqueCurrencies.size > 3 ? 1.25 : 1.15,
        },
      });
    }
  }

  return chips;
}

function getImpactLevel(type: string, value: number): string {
  const rules = (EFFORT_IMPACT_RULES as any)[type];
  if (!rules) return "unknown";

  if (value <= rules.low.max) return "low";
  if (value <= rules.medium.max) return "medium";
  if (value <= rules.high.max) return "high";
  return "extreme";
}

function getMultiplier(type: string, value: number): number {
  const rules = (EFFORT_IMPACT_RULES as any)[type];
  if (!rules) return 1.0;

  if (value <= rules.low.max) return rules.low.multiplier;
  if (value <= rules.medium.max) return rules.medium.multiplier;
  if (value <= rules.high.max) return rules.high.multiplier;
  return rules.extreme.multiplier;
}

function addImpactAnalysis(chip: ExtendedChip, allChips: ExtendedChip[]): ExtendedChip {
  // Skip if already has multiplier
  if (chip.metadata?.multiplier) {
    return chip;
  }

  const impactType =
    chip.type === "data_volume" && chip.metadata?.unit === "transactions/day"
      ? "data_volume_transactions_per_day"
      : chip.type;

  const rules = (EFFORT_IMPACT_RULES as any)[impactType];

  if (rules && typeof chip.value === "number") {
    let multiplier = 1.0;
    let impact = "low";

    if (chip.value <= rules.low.max) {
      multiplier = rules.low.multiplier;
      impact = "low";
    } else if (chip.value <= rules.medium.max) {
      multiplier = rules.medium.multiplier;
      impact = "medium";
    } else if (chip.value <= rules.high.max) {
      multiplier = rules.high.multiplier;
      impact = "high";
    } else {
      multiplier = rules.extreme.multiplier;
      impact = "extreme";
    }

    chip.metadata = {
      ...chip.metadata,
      impact,
      multiplier,
    };
  }

  return chip;
}

export function identifyCriticalGaps(chips: ExtendedChip[]): any[] {
  const gaps = [];
  const chipTypes = new Set(chips.map((c) => c.type));

  for (const [field, alert] of Object.entries(MISSING_INFO_ALERTS)) {
    if (!chipTypes.has(field)) {
      gaps.push({
        field,
        ...alert,
        currentValue: null,
      });
    }
  }

  return gaps;
}

export function calculateComplexityMultiplier(chips: ExtendedChip[]): number {
  let multiplier = 1.0;

  for (const chip of chips) {
    if (chip.metadata?.multiplier && chip.metadata.multiplier > 1.0) {
      // Compound the multipliers (multiplicative, not additive)
      multiplier *= chip.metadata.multiplier;
    }
  }

  // Cap at 5x to avoid unrealistic estimates
  return Math.min(5.0, multiplier);
}
