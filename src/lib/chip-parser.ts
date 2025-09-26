// @ts-nocheck
// @ts-nocheck
// Chip Parser V2 - More precise extraction
type ChipKind = string;
import { Chip } from "@/types/core";

// Improved patterns with better boundaries and context
const CHIP_PATTERNS = {
  // Geographic patterns
  country: [/\b(malaysia|singapore|vietnam|thailand|indonesia|philippines)\b/gi],

  // Employee patterns only (not users)
  employees: [/(\d+(?:,\d{3})*)\s*(?:employees?|staff|headcount)\b/gi],

  // Revenue patterns
  revenue: [
    /\b(?:MYR|RM|SGD|S\$|USD|VND)\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(million|mil|m|billion|b)?\b/gi,
  ],

  // Module patterns - avoiding false positives
  modules: [
    /\b(?:Finance|Financial|Accounting)\s+(?:module|system|package)?/gi,
    /\b(?:HR|HCM|Human\s+(?:Resources?|Capital))\s+(?:module|system|package)?/gi,
    /\b(?:Supply\s+Chain|SCM|Procurement)\s+(?:module|system|package)?/gi,
  ],

  // Timeline patterns
  timeline: [
    /\b(?:Q[1-4]\s+\d{4})\b/gi,
    /\b(?:go.?live|target(?:ed)?)\s+(?:for\s+)?(?:Q[1-4]\s+\d{4})/gi,
  ],

  // Integration patterns - capture the system name only
  integration: [
    /\bintegrate\s+with\s+(\w+)/gi,
    /\b(Salesforce|Oracle|Microsoft|Workday|Concur|Ariba)\b/gi,
  ],

  // Compliance patterns - specific terms only
  compliance: [/\b(?:e-?invoice|einvoice|my\s*invois)\b/gi, /\b(?:LHDN|SST|GST)\b/gi],

  // Industry patterns
  industry: [
    /\b(manufacturing|retail|healthcare|banking|insurance)\s+(?:company|industry|sector)?\b/gi,
  ],
};

export function parseChips(text: string): Chip[] {
  const chips: Chip[] = [];
  const lines = text.split("\n");

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) return;

    // Extract each type
    Object.entries(CHIP_PATTERNS).forEach(([kind, patterns]) => {
      patterns.forEach((pattern) => {
        const matches = line.matchAll(pattern);
        for (const match of matches) {
          // Special handling for integration
          if (kind === "integration" && match[0].toLowerCase().startsWith("integrate")) {
            const system = match[1];
            if (system && system.toLowerCase() !== "with") {
              const chip = createChip("integration", system, match, `Line ${lineIndex + 1}`, line);
              if (chip && !isDuplicate(chips, chip)) {
                chips.push(chip);
              }
            }
          } else {
            const chip = createChip(
              kind as ChipKind,
              match[0],
              match,
              `Line ${lineIndex + 1}`,
              line
            );
            if (chip && !isDuplicate(chips, chip)) {
              chips.push(chip);
            }
          }
        }
      });
    });
  });

  return chips;
}

function createChip(
  kind: ChipKind,
  raw: string,
  match: RegExpMatchArray,
  location: string,
  context: string
): Chip | null {
  // Filter out too generic terms
  const genericTerms = ["require", "need", "must", "compliance"];
  if (genericTerms.includes(raw.toLowerCase())) {
    return null;
  }

  const parsed = parseValue(kind, raw, match);

  return {
    id: generateId(),
    kind,
    raw: raw.trim(),
    parsed,
    source: {
      location,
      timestamp: new Date().toISOString(),
    },
    evidence: {
      snippet: raw,
      context: context.substring(0, 200),
      confidence: calculateConfidence(kind, raw),
    },
    validated: false,
  };
}

function parseValue(kind: ChipKind, raw: string, match: RegExpMatchArray) {
  switch (kind) {
    case "employees": {
      const numStr = match[1] || raw.match(/\d+(?:,\d{3})*/)?.[0] || "";
      const value = parseInt(numStr.replace(/,/g, ""), 10);
      return { value, unit: "employees" };
    }

    case "revenue": {
      const numStr = match[1] || "";
      const multiplier = match[2] || "";
      let value = parseFloat(numStr.replace(/,/g, ""));

      if (multiplier?.toLowerCase().match(/^(m|mil|million)$/)) {
        value *= 1_000_000;
      } else if (multiplier?.toLowerCase().match(/^(b|billion)$/)) {
        value *= 1_000_000_000;
      }

      const currency = raw.match(/MYR|RM|SGD|S\$|USD|VND/i)?.[0] || "MYR";
      return { value, unit: currency.toUpperCase().replace("$", "D") };
    }

    case "timeline": {
      const timelineMatch = raw.match(/Q[1-4]\s+\d{4}/i);
      if (timelineMatch) {
        return { value: timelineMatch[0], unit: "date" };
      }
      return { value: raw };
    }

    case "country": {
      return { value: raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() };
    }

    case "integration": {
      return { value: raw.charAt(0).toUpperCase() + raw.slice(1) };
    }

    case "modules": {
      const normalized = raw.toLowerCase();
      if (normalized.includes("finance")) return { value: "Finance" };
      if (normalized.includes("hr") || normalized.includes("human")) return { value: "HR" };
      if (normalized.includes("supply") || normalized.includes("scm"))
        return { value: "Supply Chain" };
      return { value: raw };
    }

    case "compliance": {
      if (raw.toLowerCase().includes("invoice")) return { value: "e-Invoice" };
      return { value: raw.toUpperCase() };
    }

    case "industry": {
      const industryMatch = raw.match(/\b(manufacturing|retail|healthcare|banking|insurance)\b/i);
      if (industryMatch) {
        return {
          value: industryMatch[1].charAt(0).toUpperCase() + industryMatch[1].slice(1).toLowerCase(),
        };
      }
      return { value: raw };
    }

    default:
      return { value: raw };
  }
}

function calculateConfidence(kind: ChipKind, raw: string): number {
  let confidence = 0.7;

  if (kind === "timeline" && /Q[1-4]\s+\d{4}/.test(raw)) {
    confidence = 0.9;
  }

  if (kind === "revenue" && /\d/.test(raw)) {
    confidence = 0.8;
  }

  if (kind === "integration" && raw.toLowerCase() === "salesforce") {
    confidence = 0.9;
  }

  if (kind === "compliance" && (raw.toLowerCase().includes("invoice") || raw === "LHDN")) {
    confidence = 0.9;
  }

  return confidence;
}

function isDuplicate(chips: Chip[], newChip: Chip): boolean {
  return chips.some((chip) => {
    if ((chip as any).kind === newChip.kind) {
      if (typeof chip.parsed.value === "string" && typeof newChip.parsed.value === "string") {
        return chip.parsed.value.toLowerCase() === newChip.parsed.value.toLowerCase();
      }
      return chip.parsed.value === newChip.parsed.value;
    }
    return false;
  });
}

function generateId(): string {
  return `chip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function summarizeChips(chips: Chip[]): Partial<Record<ChipKind, Chip[]>> {
  const summary: Partial<Record<ChipKind, Chip[]>> = {};

  chips.forEach((chip) => {
    if (!summary[(chip as any).kind]) {
      summary[(chip as any).kind] = [];
    }
    summary[(chip as any).kind]!.push(chip);
  });

  return summary;
}

export function identifyGaps(chips: Chip[]): string[] {
  const gaps: string[] = [];
  const summary = summarizeChips(chips);

  if (!summary.country || summary.country.length === 0) {
    gaps.push("Missing country/region information");
  }

  if (!summary.employees) {
    gaps.push("Missing employee count");
  }

  if (!summary.modules) {
    gaps.push("Missing SAP module requirements");
  }

  if (!summary.timeline) {
    gaps.push("Missing timeline or go-live date");
  }

  if (!summary.industry) {
    gaps.push("Missing industry information");
  }

  if (!summary.revenue) {
    gaps.push("Missing revenue information");
  }

  return gaps;
}
