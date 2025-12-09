/**
 * Resource Suggester
 *
 * Suggests resources based on:
 * 1. Detected SAP modules from scope analysis
 * 2. Project phases
 * 3. Current allocations (to avoid duplicates)
 * 4. SAP Activate best practices
 */

import type { Resource, ResourceCategory, GanttPhase } from "@/types/gantt-tool";
import {
  SAP_ACTIVATE_SKILLSETS,
  type RoleRequirement,
  type ModuleSkillsets,
} from "@/data/sap-activate-skillsets";
import {
  analyzeScope,
  type ScopeAnalysisResult,
  type DetectedModule,
} from "./scope-analyzer";

export interface ResourceSuggestion {
  id: string;
  name: string;
  category: ResourceCategory;
  designation: string;
  phaseId: string;
  phaseName: string;
  moduleId: string;
  moduleName: string;
  role: string;
  skillsets: string[];
  criticality: "must-have" | "recommended" | "optional";
  suggestedAllocation: number; // % FTE
  suggestedMandays: number; // Total for phase
  estimatedCost: number; // Rough estimate
  reason: string;
  confidence: number; // 0-1
}

export interface SuggestionResult {
  suggestions: ResourceSuggestion[];
  summary: {
    totalSuggestions: number;
    mustHaveCount: number;
    recommendedCount: number;
    optionalCount: number;
    totalEstimatedMandays: number;
    byPhase: Record<string, number>;
    byModule: Record<string, number>;
  };
  analysisUsed: ScopeAnalysisResult | null;
}

// Map roles to resource categories
const ROLE_TO_CATEGORY: Record<string, ResourceCategory> = {
  "solution architect": "technical",
  "technical architect": "technical",
  "module lead": "functional",
  "fico module lead": "functional",
  "mm module lead": "functional",
  "sd module lead": "functional",
  "hcm module lead": "functional",
  "senior fico consultant": "functional",
  "senior mm consultant": "functional",
  "senior sd consultant": "functional",
  "senior hcm consultant": "functional",
  "business analyst": "functional",
  "abap developer": "technical",
  "qa analyst": "qa",
  "data migration specialist": "technical",
  "training specialist": "change",
  "support analyst": "functional",
  "project manager": "pm",
  "basis consultant": "basis",
  "basis administrator": "basis",
  "security consultant": "security",
  "payroll specialist": "functional",
};

// Map roles to designations
const ROLE_TO_DESIGNATION: Record<string, string> = {
  "solution architect": "director",
  "technical architect": "senior_manager",
  "module lead": "senior_manager",
  "fico module lead": "senior_manager",
  "mm module lead": "senior_manager",
  "sd module lead": "senior_manager",
  "hcm module lead": "senior_manager",
  "senior fico consultant": "senior_consultant",
  "senior mm consultant": "senior_consultant",
  "senior sd consultant": "senior_consultant",
  "senior hcm consultant": "senior_consultant",
  "business analyst": "consultant",
  "abap developer": "senior_consultant",
  "qa analyst": "consultant",
  "data migration specialist": "senior_consultant",
  "training specialist": "consultant",
  "support analyst": "consultant",
  "project manager": "manager",
  "basis consultant": "senior_consultant",
  "basis administrator": "consultant",
  "security consultant": "senior_consultant",
  "payroll specialist": "senior_consultant",
};

// Average daily rates by designation (MYR)
const DAILY_RATES: Record<string, number> = {
  director: 5500,
  senior_manager: 4100,
  manager: 2750,
  senior_consultant: 2060,
  consultant: 1550,
  analyst: 1030,
};

/**
 * Generate resource suggestions based on project context
 */
export function suggestResources(
  context: {
    projectName?: string;
    description?: string;
    asIsState?: string;
    toBeState?: string;
    goals?: string[];
    businessContext?: string;
  },
  phases: GanttPhase[],
  existingResources: Resource[] = []
): SuggestionResult {
  // Analyze scope to detect modules
  const scopeAnalysis = analyzeScope(context);
  const { detectedModules } = scopeAnalysis;

  // If no modules detected, add Basis as default (always needed)
  if (detectedModules.length === 0) {
    detectedModules.push({
      moduleId: "sap-basis",
      moduleName: "SAP Basis",
      category: "technical",
      confidence: 0.5,
      matchedKeywords: [],
    });
  }

  const suggestions: ResourceSuggestion[] = [];
  let suggestionId = 1;

  // For each detected module
  for (const module of detectedModules) {
    const skillsets = SAP_ACTIVATE_SKILLSETS[module.moduleId];
    if (!skillsets) continue;

    // For each phase
    for (const phase of phases) {
      const phaseName = normalizePhaseName(phase.name);
      const phaseRequirements = skillsets[phaseName as keyof ModuleSkillsets];

      if (!phaseRequirements || !Array.isArray(phaseRequirements)) continue;

      // Calculate phase duration in weeks
      const phaseStart = new Date(phase.startDate);
      const phaseEnd = new Date(phase.endDate);
      const phaseWeeks = Math.max(1, Math.ceil((phaseEnd.getTime() - phaseStart.getTime()) / (7 * 24 * 60 * 60 * 1000)));

      // For each role requirement
      for (const req of phaseRequirements as RoleRequirement[]) {
        // Check if similar role already exists
        const existingRole = findExistingRole(existingResources, req.role, module.moduleId);
        if (existingRole) continue;

        // Calculate suggested mandays
        const suggestedMandays = Math.round(
          (req.allocationPercent / 100) * 5 * phaseWeeks
        );

        // Get category and designation
        const roleLower = req.role.toLowerCase();
        const category = ROLE_TO_CATEGORY[roleLower] || "functional";
        const designation = ROLE_TO_DESIGNATION[roleLower] || "consultant";

        // Calculate estimated cost
        const dailyRate = DAILY_RATES[designation] || 1550;
        const estimatedCost = suggestedMandays * dailyRate;

        suggestions.push({
          id: `suggestion-${suggestionId++}`,
          name: `${req.role} (${module.moduleName})`,
          category,
          designation,
          phaseId: phase.id,
          phaseName: phase.name,
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          role: req.role,
          skillsets: req.skillsets,
          criticality: req.criticality,
          suggestedAllocation: req.allocationPercent,
          suggestedMandays,
          estimatedCost,
          reason: generateReason(req, module, phase.name),
          confidence: module.confidence * (req.criticality === "must-have" ? 1 : 0.7),
        });
      }
    }
  }

  // Sort by criticality and confidence
  const sortedSuggestions = suggestions.sort((a, b) => {
    const criticalityOrder = { "must-have": 0, recommended: 1, optional: 2 };
    if (criticalityOrder[a.criticality] !== criticalityOrder[b.criticality]) {
      return criticalityOrder[a.criticality] - criticalityOrder[b.criticality];
    }
    return b.confidence - a.confidence;
  });

  // Calculate summary
  const summary = calculateSummary(sortedSuggestions);

  return {
    suggestions: sortedSuggestions,
    summary,
    analysisUsed: scopeAnalysis,
  };
}

/**
 * Suggest resources for a specific gap
 */
export function suggestForGap(
  category: ResourceCategory,
  phaseName: string,
  gapMandays: number,
  existingResources: Resource[] = []
): ResourceSuggestion[] {
  const suggestions: ResourceSuggestion[] = [];

  // Find modules that typically need this category
  const relevantModules = findModulesForCategory(category);

  for (const moduleId of relevantModules) {
    const skillsets = SAP_ACTIVATE_SKILLSETS[moduleId];
    if (!skillsets) continue;

    const normalizedPhase = normalizePhaseName(phaseName);
    const phaseRequirements = skillsets[normalizedPhase as keyof ModuleSkillsets];

    if (!phaseRequirements || !Array.isArray(phaseRequirements)) continue;

    for (const req of phaseRequirements as RoleRequirement[]) {
      const roleLower = req.role.toLowerCase();
      const roleCategory = ROLE_TO_CATEGORY[roleLower] || "functional";

      if (roleCategory === category) {
        const designation = ROLE_TO_DESIGNATION[roleLower] || "consultant";
        const dailyRate = DAILY_RATES[designation] || 1550;

        suggestions.push({
          id: `gap-suggestion-${Date.now()}-${Math.random()}`,
          name: req.role,
          category,
          designation,
          phaseId: "",
          phaseName,
          moduleId,
          moduleName: skillsets.moduleName,
          role: req.role,
          skillsets: req.skillsets,
          criticality: req.criticality,
          suggestedAllocation: req.allocationPercent,
          suggestedMandays: Math.ceil(gapMandays),
          estimatedCost: Math.ceil(gapMandays) * dailyRate,
          reason: `Fills ${gapMandays.toFixed(1)} manday gap in ${category} capacity during ${phaseName}`,
          confidence: 0.8,
        });
      }
    }
  }

  // Deduplicate by role
  const uniqueRoles = new Map<string, ResourceSuggestion>();
  for (const s of suggestions) {
    if (!uniqueRoles.has(s.role) || uniqueRoles.get(s.role)!.criticality !== "must-have") {
      uniqueRoles.set(s.role, s);
    }
  }

  return Array.from(uniqueRoles.values());
}

/**
 * Normalize phase name to match SAP Activate phases
 */
function normalizePhaseName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("discover")) return "Prepare";
  if (normalized.includes("prepare")) return "Prepare";
  if (normalized.includes("explore")) return "Explore";
  if (normalized.includes("realize")) return "Realize";
  if (normalized.includes("deploy")) return "Deploy";
  if (normalized.includes("run") || normalized.includes("operate")) return "Run";
  return "Explore"; // Default
}

/**
 * Find existing role to avoid duplicates
 */
function findExistingRole(
  resources: Resource[],
  role: string,
  moduleId: string
): Resource | undefined {
  const roleLower = role.toLowerCase();
  return resources.find((r) => {
    const nameLower = r.name?.toLowerCase() || "";
    return nameLower.includes(roleLower) || nameLower.includes(moduleId.replace("sap-", ""));
  });
}

/**
 * Find modules that typically need a category
 */
function findModulesForCategory(category: ResourceCategory): string[] {
  const categoryToModules: Record<ResourceCategory, string[]> = {
    leadership: ["sap-basis"],
    functional: ["sap-fico", "sap-mm", "sap-sd", "sap-hcm"],
    technical: ["sap-basis", "sap-fico", "sap-mm"],
    basis: ["sap-basis"],
    security: ["sap-basis"],
    pm: ["sap-fico", "sap-mm"],
    change: ["sap-hcm", "sap-fico"],
    qa: ["sap-fico", "sap-mm", "sap-sd"],
    client: [], // Client placeholders not tied to modules
    other: [],
  };

  return categoryToModules[category] || ["sap-fico"];
}

/**
 * Generate human-readable reason for suggestion
 */
function generateReason(
  req: RoleRequirement,
  module: DetectedModule,
  phaseName: string
): string {
  const criticalityText = {
    "must-have": "Critical role",
    recommended: "Recommended role",
    optional: "Optional role",
  };

  return `${criticalityText[req.criticality]} for ${module.moduleName} during ${phaseName} phase. Skills: ${req.skillsets.slice(0, 3).join(", ")}`;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(suggestions: ResourceSuggestion[]): SuggestionResult["summary"] {
  const byPhase: Record<string, number> = {};
  const byModule: Record<string, number> = {};

  let totalMandays = 0;
  let mustHaveCount = 0;
  let recommendedCount = 0;
  let optionalCount = 0;

  for (const s of suggestions) {
    totalMandays += s.suggestedMandays;

    if (s.criticality === "must-have") mustHaveCount++;
    else if (s.criticality === "recommended") recommendedCount++;
    else optionalCount++;

    byPhase[s.phaseName] = (byPhase[s.phaseName] || 0) + 1;
    byModule[s.moduleName] = (byModule[s.moduleName] || 0) + 1;
  }

  return {
    totalSuggestions: suggestions.length,
    mustHaveCount,
    recommendedCount,
    optionalCount,
    totalEstimatedMandays: totalMandays,
    byPhase,
    byModule,
  };
}

/**
 * Quick suggestion for a single phase and module
 */
export function quickSuggest(
  moduleId: string,
  phaseName: string,
  phaseWeeks: number
): ResourceSuggestion[] {
  const skillsets = SAP_ACTIVATE_SKILLSETS[moduleId];
  if (!skillsets) return [];

  const normalizedPhase = normalizePhaseName(phaseName);
  const requirements = skillsets[normalizedPhase as keyof ModuleSkillsets];

  if (!requirements || !Array.isArray(requirements)) return [];

  return (requirements as RoleRequirement[])
    .filter((r) => r.criticality === "must-have")
    .map((req, idx) => {
      const roleLower = req.role.toLowerCase();
      const category = ROLE_TO_CATEGORY[roleLower] || "functional";
      const designation = ROLE_TO_DESIGNATION[roleLower] || "consultant";
      const suggestedMandays = Math.round((req.allocationPercent / 100) * 5 * phaseWeeks);
      const dailyRate = DAILY_RATES[designation] || 1550;

      return {
        id: `quick-${moduleId}-${phaseName}-${idx}`,
        name: req.role,
        category,
        designation,
        phaseId: "",
        phaseName,
        moduleId,
        moduleName: skillsets.moduleName,
        role: req.role,
        skillsets: req.skillsets,
        criticality: req.criticality,
        suggestedAllocation: req.allocationPercent,
        suggestedMandays,
        estimatedCost: suggestedMandays * dailyRate,
        reason: `Must-have role for ${skillsets.moduleName}`,
        confidence: 1,
      };
    });
}
