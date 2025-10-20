// src/lib/presales-to-timeline-bridge.ts
import { detectEmployeeCount, detectMultiEntityFactors } from "@/lib/critical-patterns";
import { Chip, ClientProfile, Decision, Phase } from "@/types/core";
import { ScenarioGenerator } from "@/lib/scenario-generator";
import { sanitizeObject, sanitizeHtml } from "@/lib/input-sanitizer";

/**
 * SECURITY: Basic sanitization for chip values
 * Defense-in-depth: Sanitization that handles edge cases
 * Prevents XSS attacks in user-provided chip data
 */
function sanitizeChipValue(value: unknown): string {
  if (!value) return '';

  // Limit length to prevent DoS attacks (1000 char max)
  const str = String(value).slice(0, 1000);

  // Strip HTML tags and dangerous patterns
  const clean = str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers

  return clean;
}

/**
 * SECURITY: Validate and sanitize phase data before rendering
 * Prevents XSS in phase names, descriptions, and metadata
 */
function sanitizePhase(phase: any): any {
  return {
    ...phase,
    id: sanitizeHtml(String(phase.id || "")),
    name: sanitizeHtml(String(phase.name || "")),
    description: phase.description ? sanitizeHtml(String(phase.description)) : undefined,
    category: phase.category ? sanitizeHtml(String(phase.category)) : undefined,
    workingDays: Math.max(0, Math.min(1000, Number(phase.workingDays) || 0)), // Clamp to 0-1000
    startBusinessDay: Math.max(0, Number(phase.startBusinessDay) || 0),
    effort: Math.max(0, Number(phase.effort) || 0),
    resources: phase.resources?.map((r: any) => ({
      ...r,
      name: sanitizeHtml(String(r.name || "")),
      role: sanitizeHtml(String(r.role || "")),
      allocation: Math.max(0, Math.min(100, Number(r.allocation) || 0)),
      hourlyRate: Math.max(0, Number(r.hourlyRate) || 0),
    })),
  };
}

export interface TimelineConversionResult {
  profile: ClientProfile;
  selectedPackages: string[];
  totalEffort: number;
  phases: Phase[];
  appliedMultipliers: {
    entity: number;
    employee: number;
    integration: number;
    compliance: number;
    total: number;
  };
  warnings: string[];
}

interface MultipliersResult {
  entity: number;
  employee: number;
  integration: number;
  compliance: number;
  total: number;
  warnings: string[];
}

/**
 * Calculate effort multipliers from chips
 */
function calculateMultipliers(chips: Chip[]): MultipliersResult {
  const warnings: string[] = [];
  // Employee multiplier - check both employee chips AND text in chip values
  let employeeMultiplier = 1.0;
  const employeeChips = chips.filter((c) => c.type === "EMPLOYEES");
  let maxEmployees = 0;

  if (employeeChips.length > 0) {
    maxEmployees = Math.max(...employeeChips.map((c) => Number(c.value) || 0));
  }

  // Also check for employee count mentioned in chip values (e.g., module descriptions)
  if (maxEmployees === 0) {
    for (const chip of chips) {
      const valueStr = String(chip.value || "");
      const employeeMatch = valueStr.match(/(\d+)\s*(?:employees?|staff|workers?)/i);
      if (employeeMatch) {
        const count = parseInt(employeeMatch[1], 10);
        if (count > maxEmployees) maxEmployees = count;
      }
    }
  }

  if (maxEmployees > 0) {
    if (maxEmployees <= 100) employeeMultiplier = 0.8;
    else if (maxEmployees <= 250) employeeMultiplier = 1.0;
    else if (maxEmployees <= 500) employeeMultiplier = 1.2;
    else if (maxEmployees <= 1000) employeeMultiplier = 1.4;
    else if (maxEmployees <= 2500) employeeMultiplier = 1.6;
    else employeeMultiplier = 1.8;
  }

  // Integration multiplier (0.15 per integration)
  // Note: enhanced-chip-parser may create "integrations" (plural) type
  const integrationChips = chips.filter(
    (c) => c.type === "INTEGRATION" || (c.type as string) === "integrations"
  );
  const integrationMultiplier = 1.0 + integrationChips.length * 0.15;

  // Compliance multiplier (0.1 per compliance requirement)
  const complianceChips = chips.filter((c) => c.type === "COMPLIANCE");
  const complianceMultiplier = 1.0 + complianceChips.length * 0.1;

  // Entity multiplier
  let entityMultiplier = 1.0;
  const entityChips = chips.filter((c) => c.type === "LEGAL_ENTITIES");
  if (entityChips.length > 0) {
    const maxEntities = Math.max(...entityChips.map((c) => Number(c.value) || 0));
    if (maxEntities <= 1) entityMultiplier = 1.0;
    else if (maxEntities <= 3) entityMultiplier = 1.15;
    else if (maxEntities <= 5) entityMultiplier = 1.3;
    else entityMultiplier = 1.5;
  }

  const total = Math.min(
    5.0,
    employeeMultiplier * integrationMultiplier * complianceMultiplier * entityMultiplier
  );

  // Generate warnings for high complexity
  if (total > 3.0) {
    warnings.push(
      `⚠️ Very high complexity multiplier (${total.toFixed(1)}x). Consider phased rollout.`
    );
  }

  return {
    entity: entityMultiplier,
    employee: employeeMultiplier,
    integration: integrationMultiplier,
    compliance: complianceMultiplier,
    total,
    warnings,
  };
}

export function convertPresalesToTimeline(chips: Chip[], decisions:unknown): TimelineConversionResult {
  try {
    // Sanitize chips
    const sanitizedChips = chips.map((chip) => sanitizeObject(chip)) as Chip[];

    const profile = extractClientProfile(chips);
    const selectedPackages = mapModulesToPackages(chips);

    // If no modules/packages selected, return minimal result with 0 effort
    if (selectedPackages.length === 0 && !sanitizedChips.some((c) => c.type === "MODULES")) {
      return {
        profile,
        selectedPackages: [],
        totalEffort: 0,
        phases: [],
        appliedMultipliers: {
          entity: 1.0,
          employee: 1.0,
          integration: 1.0,
          compliance: 1.0,
          total: 1.0,
        },
        warnings: [],
      };
    }

    // Convert decisions object to Decision array
    const decisionArray: Decision[] = Object.entries(decisions || {}).map(([key, value]) => ({
      id: key,
      type: "single" as const,
      category: key,
      question: key,
      options: [String(value)],
      selected: String(value),
      impact: "medium" as const,
      timestamp: new Date(),
    }));

    // Use new ScenarioGenerator
    const generator = new ScenarioGenerator();
    const plan = generator.generate(sanitizedChips, decisionArray);

    // SECURITY: Sanitize all phase data before returning
    const sanitizedPhases = plan.phases.map(sanitizePhase);

    // Calculate multipliers from chips
    const multipliersResult = calculateMultipliers(chips);

    console.log(
      `[Bridge] ✅ Conversion complete using ScenarioGenerator: ${plan.totalEffort} PD total`
    );
    console.log(`[Bridge] 🔒 Sanitized ${sanitizedPhases.length} phases for rendering`);

    return {
      profile,
      selectedPackages,
      totalEffort: plan.totalEffort,
      phases: sanitizedPhases,
      appliedMultipliers: {
        entity: multipliersResult.entity,
        employee: multipliersResult.employee,
        integration: multipliersResult.integration,
        compliance: multipliersResult.compliance,
        total: multipliersResult.total,
      },
      warnings: multipliersResult.warnings,
    };
  } catch (error) {
    console.error("[Bridge] ❌ Conversion failed:", error);

    return {
      profile: getDefaultProfile(),
      selectedPackages: [],
      totalEffort: 0,
      phases: [],
      appliedMultipliers: {
        entity: 1.0,
        employee: 1.0,
        integration: 1.0,
        compliance: 1.0,
        total: 1.0,
      },
      warnings: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

export function mapModulesToPackages(chips: Chip[]): string[] {
  const packages = new Set<string>();

  // Filter chips by type (Chip interface uses 'type' not 'kind')
  const moduleChips = chips.filter(
    (c) => c.type === "MODULES" || c.type === "INDUSTRY" // Some modules come through as industry
  );

  moduleChips.forEach((chip) => {
    // SECURITY: Sanitize chip value before processing
    const moduleName = sanitizeChipValue(chip.value).toLowerCase();

    console.log(`[Bridge] Mapping module: "${moduleName}"`);

    if (moduleName.includes("finance") || moduleName.includes("fi")) {
      packages.add("Finance_1");
      packages.add("Finance_3");
      console.log("[Bridge] → Added Finance packages");
    }

    if (moduleName.includes("hr") || moduleName.includes("hcm") || moduleName.includes("human")) {
      packages.add("HCM_1");
      console.log("[Bridge] → Added HCM package");
    }

    if (
      moduleName.includes("supply") ||
      moduleName.includes("scm") ||
      moduleName.includes("chain") ||
      moduleName.includes("inventory")
    ) {
      packages.add("SCM_1");
      console.log("[Bridge] → Added SCM package");
    }

    if (
      moduleName.includes("procurement") ||
      moduleName.includes("purchasing") ||
      moduleName.includes("mm")
    ) {
      packages.add("PROC_1");
      console.log("[Bridge] → Added Procurement package");
    }

    if (
      moduleName.includes("sales") ||
      moduleName.includes("crm") ||
      moduleName.includes("customer")
    ) {
      packages.add("CX_1");
      console.log("[Bridge] → Added CX package");
    }
  });

  const packageArray = Array.from(packages);
  console.log(`[Bridge] Total packages mapped: ${packageArray.length}`, packageArray);

  return packageArray;
}

export function extractClientProfile(chips: Chip[]): ClientProfile {
  // Chips should already be sanitized, but double-check for security
  const sanitizedChips = chips.map((chip) => sanitizeObject(chip)) as Chip[];

  const countryChip = sanitizedChips.find((c) => c.type === "COUNTRY");
  const industryChip = sanitizedChips.find((c) => c.type === "INDUSTRY");
  const employeeChip = sanitizedChips.find((c) => c.type === "EMPLOYEES" || c.type === "USERS");

  let size: ClientProfile["size"] = "medium";
  let employees = 500;

  if (employeeChip) {
    const empValue = employeeChip.value;
    const empCount = typeof empValue === "number" ? empValue : parseInt(String(empValue), 10);

    if (!isNaN(empCount)) {
      employees = empCount;
      if (empCount < 200) size = "small";
      else if (empCount < 1000) size = "medium";
      else if (empCount < 5000) size = "large";
      else size = "enterprise";
    }
  }

  let complexity: ClientProfile["complexity"] = "standard";
  const integrations = chips.filter((c) => c.type === "INTEGRATION").length;
  const compliance = chips.filter((c) => c.type === "COMPLIANCE").length;

  if (integrations > 2 || compliance > 1) complexity = "complex";
  if (size === "enterprise") complexity = "complex";

  let region: "ABMY" | "ABSG" | "ABVN" = "ABMY";
  if (countryChip) {
    // SECURITY: Sanitize before string comparison
    const country = sanitizeChipValue(countryChip.value).toLowerCase();
    if (country.includes("singapore")) region = "ABSG";
    else if (country.includes("vietnam")) region = "ABVN";
  }

  return {
    // SECURITY: Sanitize all string values in profile
    company: sanitizeChipValue(countryChip?.value || ""),
    industry: sanitizeChipValue(industryChip?.value || "manufacturing"),
    size,
    complexity,
    timelinePreference: "normal",
    region,
    employees,
    annualRevenue: employees * 100000,
  };
}

function applyMultipliers(
  baseEffort: number,
  chips: Chip[],
  decisions: any
): {
  totalEffort: number;
  multipliers: {
    entity: number;
    employee: number;
    integration: number;
    compliance: number;
    total: number;
  };
  warnings: string[];
} {
  const multipliers = {
    entity: 1.0,
    employee: 1.0,
    integration: 1.0,
    compliance: 1.0,
    total: 1.0,
  };

  const warnings: string[] = [];

  // Reconstruct text from chip values
  const fullText = chips.map((c) => String(c.value || "")).join(" ");

  const entityDetection = detectMultiEntityFactors(fullText);
  if (entityDetection.totalMultiplier > 1) {
    multipliers.entity = entityDetection.totalMultiplier;
    console.log(`[Bridge] 🔥 Multi-entity multiplier: ${entityDetection.totalMultiplier}x`);
    warnings.push(...entityDetection.warnings);
  }

  const employeeDetection = detectEmployeeCount(fullText);
  if (employeeDetection.count) {
    multipliers.employee = calculateEmployeeMultiplier(employeeDetection.count);
    console.log(
      `[Bridge] 👥 Employee multiplier (${employeeDetection.count} users): ${multipliers.employee}x`
    );
  }

  const integrationChips = chips.filter((c) => c.type === "INTEGRATION");
  if (integrationChips.length > 0) {
    multipliers.integration = 1 + integrationChips.length * 0.15;
    console.log(
      `[Bridge] 🔗 Integration multiplier (${integrationChips.length} systems): ${multipliers.integration}x`
    );
  }

  const complianceChips = chips.filter((c) => c.type === "COMPLIANCE");
  if (complianceChips.length > 0) {
    multipliers.compliance = 1 + complianceChips.length * 0.1;
    console.log(
      `[Bridge] ⚖️ Compliance multiplier (${complianceChips.length} requirements): ${multipliers.compliance}x`
    );
  }

  multipliers.total = Math.min(
    5.0,
    multipliers.entity * multipliers.employee * multipliers.integration * multipliers.compliance
  );

  const finalEffort = Math.round(baseEffort * multipliers.total);

  console.log(
    `[Bridge] 🎯 Final calculation: ${baseEffort} PD × ${multipliers.total.toFixed(2)}x = ${finalEffort} PD`
  );

  if (multipliers.total > 3.0) {
    warnings.push(
      `⚠️ Very high complexity multiplier (${multipliers.total.toFixed(1)}x). Consider phased rollout.`
    );
  }

  return {
    totalEffort: finalEffort,
    multipliers,
    warnings,
  };
}

function calculateEmployeeMultiplier(count: number): number {
  if (count < 50) return 0.8;
  if (count < 200) return 1.0;
  if (count < 500) return 1.2;
  if (count < 1000) return 1.4;
  if (count < 2000) return 1.6;
  return 1.8;
}

function getDefaultProfile(): ClientProfile {
  return {
    company: "",
    industry: "manufacturing",
    size: "medium",
    complexity: "standard",
    timelinePreference: "normal",
    region: "ABMY",
    employees: 500,
    annualRevenue: 50000000,
  };
}
