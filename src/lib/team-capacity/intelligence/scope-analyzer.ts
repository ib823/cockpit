/**
 * Scope Analyzer
 *
 * Analyzes project context to detect:
 * 1. SAP modules involved
 * 2. Complexity factors
 * 3. Suggested team size
 *
 * Uses keyword detection on project description, business context,
 * AS-IS state, TO-BE state, and goals.
 */

// SAP Module Detection Patterns
const SAP_MODULE_PATTERNS: Record<string, {
  keywords: string[];
  moduleName: string;
  moduleId: string;
  category: "core" | "technical" | "hr" | "analytics";
}> = {
  FICO: {
    keywords: [
      "finance", "financial", "accounting", "gl", "general ledger",
      "accounts payable", "ap", "accounts receivable", "ar",
      "asset accounting", "fixed assets", "cost center", "profit center",
      "controlling", "co", "fi", "fico", "chart of accounts", "coa",
      "financial close", "financial reporting", "treasury", "bank accounting",
      "intercompany", "consolidation", "budget", "budgeting"
    ],
    moduleName: "SAP FICO",
    moduleId: "sap-fico",
    category: "core",
  },
  MM: {
    keywords: [
      "materials", "material management", "procurement", "purchasing",
      "inventory", "warehouse", "stock", "vendor", "supplier",
      "purchase order", "po", "goods receipt", "gr", "invoice verification",
      "mm", "material master", "requisition", "rfq", "source list",
      "quota arrangement", "consignment", "subcontracting"
    ],
    moduleName: "SAP MM",
    moduleId: "sap-mm",
    category: "core",
  },
  SD: {
    keywords: [
      "sales", "distribution", "order", "order management", "billing",
      "invoicing", "shipping", "delivery", "customer", "customer master",
      "pricing", "discount", "rebate", "sd", "order to cash", "otc",
      "quotation", "sales order", "credit management", "revenue recognition",
      "intercompany sales", "third party", "consignment"
    ],
    moduleName: "SAP SD",
    moduleId: "sap-sd",
    category: "core",
  },
  BASIS: {
    keywords: [
      "basis", "technical", "infrastructure", "system admin", "administration",
      "transport", "security", "authorization", "role", "user management",
      "sap hana", "hana", "s/4hana", "s4hana", "landscape", "system landscape",
      "backup", "monitoring", "performance", "sizing", "installation"
    ],
    moduleName: "SAP Basis",
    moduleId: "sap-basis",
    category: "technical",
  },
  HCM: {
    keywords: [
      "hcm", "hr", "human resources", "human capital", "payroll",
      "time management", "attendance", "personnel", "employee",
      "organizational management", "om", "pa", "personnel administration",
      "benefits", "talent", "recruitment", "onboarding", "successfactors"
    ],
    moduleName: "SAP HCM",
    moduleId: "sap-hcm",
    category: "hr",
  },
  PP: {
    keywords: [
      "production", "manufacturing", "pp", "production planning",
      "mrp", "bom", "bill of materials", "routing", "work center",
      "shop floor", "capacity planning", "demand management"
    ],
    moduleName: "SAP PP",
    moduleId: "sap-pp",
    category: "core",
  },
  QM: {
    keywords: [
      "quality", "qm", "quality management", "inspection", "inspection lot",
      "quality control", "qc", "defect", "certificate", "calibration"
    ],
    moduleName: "SAP QM",
    moduleId: "sap-qm",
    category: "core",
  },
  PM: {
    keywords: [
      "plant maintenance", "pm", "maintenance", "work order", "equipment",
      "functional location", "preventive maintenance", "corrective maintenance",
      "notification", "maintenance plan"
    ],
    moduleName: "SAP PM",
    moduleId: "sap-pm",
    category: "core",
  },
  PS: {
    keywords: [
      "project system", "ps", "project management", "wbs", "work breakdown",
      "network", "milestone", "project planning", "project budget"
    ],
    moduleName: "SAP PS",
    moduleId: "sap-ps",
    category: "core",
  },
  BW: {
    keywords: [
      "bw", "business warehouse", "bw/4hana", "analytics", "reporting",
      "data warehouse", "cube", "infocube", "dso", "data store",
      "query", "analysis", "dashboard", "bi", "business intelligence"
    ],
    moduleName: "SAP BW",
    moduleId: "sap-bw",
    category: "analytics",
  },
};

// Complexity Factor Patterns
const COMPLEXITY_PATTERNS: Record<string, {
  keywords: string[];
  weight: number;
  factor: string;
}> = {
  multiCountry: {
    keywords: ["multi-country", "multiple countries", "global", "international", "cross-border", "regional", "apac", "emea", "americas", "countries"],
    weight: 2.0,
    factor: "Multi-country deployment",
  },
  multiCompany: {
    keywords: ["multi-company", "multiple entities", "company codes", "legal entities", "subsidiaries", "group company"],
    weight: 1.5,
    factor: "Multi-company structure",
  },
  migration: {
    keywords: ["migration", "data migration", "legacy", "conversion", "historical data", "cutover", "brownfield"],
    weight: 1.3,
    factor: "Data migration from legacy",
  },
  integration: {
    keywords: ["integration", "interface", "api", "web service", "middleware", "edi", "idoc", "third party", "external system"],
    weight: 1.4,
    factor: "System integrations",
  },
  customization: {
    keywords: ["custom", "customization", "enhancement", "development", "abap", "badi", "user exit", "extension", "fiori app"],
    weight: 1.3,
    factor: "Custom development",
  },
  greenfield: {
    keywords: ["greenfield", "new implementation", "from scratch", "net new"],
    weight: 1.0,
    factor: "Greenfield implementation",
  },
  rollout: {
    keywords: ["rollout", "template", "deployment", "replication", "standardization"],
    weight: 0.8,
    factor: "Template rollout",
  },
  highVolume: {
    keywords: ["high volume", "large scale", "millions", "thousands", "heavy load", "enterprise"],
    weight: 1.2,
    factor: "High volume processing",
  },
};

export interface DetectedModule {
  moduleId: string;
  moduleName: string;
  category: string;
  confidence: number; // 0-1
  matchedKeywords: string[];
}

export interface ComplexityFactor {
  factor: string;
  weight: number;
  matchedKeywords: string[];
}

export interface ScopeAnalysisResult {
  detectedModules: DetectedModule[];
  complexityFactors: ComplexityFactor[];
  complexityScore: number; // 1-10
  suggestedTeamSize: {
    min: number;
    max: number;
    recommended: number;
  };
  projectType: "small" | "medium" | "large" | "enterprise";
  estimatedDuration: {
    minWeeks: number;
    maxWeeks: number;
  };
}

/**
 * Analyze project scope from context
 */
export function analyzeScope(context: {
  projectName?: string;
  description?: string;
  asIsState?: string;
  toBeState?: string;
  goals?: string[];
  businessContext?: string;
  additionalText?: string;
}): ScopeAnalysisResult {
  // Combine all text for analysis
  const allText = [
    context.projectName || "",
    context.description || "",
    context.asIsState || "",
    context.toBeState || "",
    context.businessContext || "",
    context.additionalText || "",
    ...(context.goals || []),
  ]
    .join(" ")
    .toLowerCase();

  // Detect SAP modules
  const detectedModules = detectModules(allText);

  // Detect complexity factors
  const complexityFactors = detectComplexity(allText);

  // Calculate complexity score
  const complexityScore = calculateComplexityScore(detectedModules, complexityFactors);

  // Calculate team size
  const teamSize = calculateTeamSize(detectedModules, complexityScore);

  // Determine project type
  const projectType = determineProjectType(detectedModules.length, complexityScore);

  // Estimate duration
  const estimatedDuration = estimateDuration(detectedModules.length, complexityScore);

  return {
    detectedModules,
    complexityFactors,
    complexityScore,
    suggestedTeamSize: teamSize,
    projectType,
    estimatedDuration,
  };
}

/**
 * Detect SAP modules from text
 */
function detectModules(text: string): DetectedModule[] {
  const modules: DetectedModule[] = [];

  for (const [key, pattern] of Object.entries(SAP_MODULE_PATTERNS)) {
    const matchedKeywords: string[] = [];

    for (const keyword of pattern.keywords) {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text)) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // Calculate confidence based on number of matched keywords
      const confidence = Math.min(matchedKeywords.length / 3, 1);

      modules.push({
        moduleId: pattern.moduleId,
        moduleName: pattern.moduleName,
        category: pattern.category,
        confidence,
        matchedKeywords,
      });
    }
  }

  // Sort by confidence
  return modules.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect complexity factors from text
 */
function detectComplexity(text: string): ComplexityFactor[] {
  const factors: ComplexityFactor[] = [];

  for (const [key, pattern] of Object.entries(COMPLEXITY_PATTERNS)) {
    const matchedKeywords: string[] = [];

    for (const keyword of pattern.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(text)) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      factors.push({
        factor: pattern.factor,
        weight: pattern.weight,
        matchedKeywords,
      });
    }
  }

  return factors;
}

/**
 * Calculate overall complexity score (1-10)
 */
function calculateComplexityScore(
  modules: DetectedModule[],
  factors: ComplexityFactor[]
): number {
  // Base score from module count
  let score = Math.min(modules.length * 1.5, 5);

  // Add complexity factor weights
  const factorWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  score += Math.min(factorWeight, 5);

  // Normalize to 1-10
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Calculate suggested team size
 */
function calculateTeamSize(
  modules: DetectedModule[],
  complexityScore: number
): { min: number; max: number; recommended: number } {
  // Base calculation: ~3-5 people per module, adjusted by complexity
  const basePerModule = 3;
  const moduleCount = Math.max(modules.length, 1);

  const baseSize = moduleCount * basePerModule;
  const complexityMultiplier = 0.8 + (complexityScore / 10) * 0.4; // 0.8 - 1.2

  const recommended = Math.round(baseSize * complexityMultiplier);
  const min = Math.max(3, Math.round(recommended * 0.7));
  const max = Math.round(recommended * 1.4);

  return { min, max, recommended };
}

/**
 * Determine project type
 */
function determineProjectType(
  moduleCount: number,
  complexityScore: number
): "small" | "medium" | "large" | "enterprise" {
  const combinedScore = moduleCount * 2 + complexityScore;

  if (combinedScore <= 6) return "small";
  if (combinedScore <= 12) return "medium";
  if (combinedScore <= 20) return "large";
  return "enterprise";
}

/**
 * Estimate project duration
 */
function estimateDuration(
  moduleCount: number,
  complexityScore: number
): { minWeeks: number; maxWeeks: number } {
  // Base: 12 weeks per module, adjusted by complexity
  const baseWeeksPerModule = 12;
  const moduleWeeks = Math.max(moduleCount, 1) * baseWeeksPerModule;

  const complexityMultiplier = 0.7 + (complexityScore / 10) * 0.6; // 0.7 - 1.3

  const baseWeeks = moduleWeeks * complexityMultiplier;

  return {
    minWeeks: Math.round(baseWeeks * 0.8),
    maxWeeks: Math.round(baseWeeks * 1.3),
  };
}

/**
 * Quick scope check - returns primary module and complexity
 */
export function quickScopeAnalysis(text: string): {
  primaryModule: string | null;
  complexity: "low" | "medium" | "high";
  moduleCount: number;
} {
  const result = analyzeScope({ additionalText: text });

  return {
    primaryModule: result.detectedModules[0]?.moduleName || null,
    complexity: result.complexityScore <= 3 ? "low" : result.complexityScore <= 6 ? "medium" : "high",
    moduleCount: result.detectedModules.length,
  };
}
