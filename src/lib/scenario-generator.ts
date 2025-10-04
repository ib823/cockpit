// src/lib/scenario-generator.ts
import { Chip, Decision, ScenarioPlan, Phase, Resource } from "@/types/core";
import { EstimationEngine } from "./estimation-engine";
import { ESTIMATION_CONSTANTS } from "./estimation-constants";

// Type definitions for EstimationEngine inputs
export interface ProjectInput {
  companyFootprint: CompanyFootprint;
  scopeItems: ScopeItem[];
  usersRoles: UsersRoles;
  dataMigration: DataMigration;
  integrations: Integration[];
  outputs: Outputs;
  localization: Localization;
  volumes: Volumes;
  nfrSecurity: NFRSecurity;
  envCutover: EnvCutover;
  trainingOCM: TrainingOCM;
  run: Run;
  risksAssumptions: RisksAssumptions;
  timeline: Timeline;
  extensions: Extension[];
  sharedServicesModel: boolean;
  decisionVelocity: "fast" | "normal" | "slow";
}

export interface CompanyFootprint {
  legalEntities: Array<{ id: string; name: string }>;
  currencies: string[];
  languages: string[];
  timezones: string[];
}

export interface ScopeItem {
  id: string;
  name: string;
  complexity: "small" | "medium" | "large" | "xlarge";
  variants: number;
  criticalityPercent: number;
  customWorkflows: number;
  customForms: number;
  customReports: number;
  dependencies: string[];
}

export interface UsersRoles {
  personas: Array<{ id: string; name: string }>;
  totalUsers: number;
  concurrentUsers: number;
  shifts: number;
  languages: string[];
  accessibilityRequired: boolean;
  roles: Array<{ id: string; name: string }>;
  sodRules: number;
  uatParticipants: number;
  maxCohortSize: number;
  superUsers: number;
}

export interface DataMigration {
  objects: Array<{
    id: string;
    name: string;
    complexity: "simple" | "medium" | "complex";
    recordCount: number;
    sources: Array<{ id: string; name: string }>;
    transformationRules: number;
    customFields: number;
  }>;
  dataQuality: "high" | "medium" | "low";
  mockRuns: number;
  reconciliationRequired: boolean;
  piiHandling: boolean;
  historicalYears: number;
  cutoverWindow: number;
  mdmInPlace: boolean;
}

export interface Integration {
  id: string;
  name: string;
  protocol:
    | "REST"
    | "SOAP"
    | "OData"
    | "RFC/BAPI"
    | "IDoc"
    | "SFTP"
    | "AS2"
    | "Kafka"
    | "MQ"
    | "File";
  securityLevel: "basic" | "oauth" | "certificate" | "advanced";
  transactionsPerDay: number;
  transformationRules: number;
  errorHandling: "basic" | "advanced";
  monitoringRequired: boolean;
  extraEnvRequired: boolean;
  partnerInvolved: boolean;
  reuseExistingPattern: boolean;
  nfrRequired: boolean;
  complianceRequired: boolean;
  backfillRequired: boolean;
  runbookRequired: boolean;
}

export interface Outputs {
  forms: Array<{ id: string; complexity: "simple" | "medium" | "complex" }>;
  reports: Array<{ id: string; complexity: "simple" | "medium" | "complex" }>;
  sacConnections: number;
  sacPages: number;
  sacWidgets: number;
}

export interface Localization {
  countries: string[];
  eInvoiceModels: Array<{ country: string; model: "API" | "Peppol" | "Clearance" }>;
  whtRequired: boolean;
  statutoryReports: number;
  bankFormats: number;
}

export interface Volumes {
  transactionsPerDay: number;
  linesPerDocument: number;
  peakFactors: Array<{ period: "month_end" | "quarter_end" | "year_end" }>;
  ilmRequired: boolean;
}

export interface NFRSecurity {
  slaTarget: "standard" | "99.5%" | "99.9%" | "99.95%";
  latencyTarget: number;
  dataResidency: boolean;
  ssoMode: "SAML" | "OAuth" | "OIDC" | "None";
  mfaRequired: boolean;
  penTestRequired: boolean;
  complianceFrameworks: string[];
}

export interface EnvCutover {
  threeSystemLandscape: boolean;
  extraEnvironments: number;
  dataRefreshes: number;
  dressRehearsals: number;
  cutoverWindow: "weekend" | "under_24h" | "under_12h";
  freezePeriodWeeks: number;
}

export interface TrainingOCM {
  impactAssessmentRequired: boolean;
  commsArtifacts: number;
  tttCohorts: number;
  floorwalkingRequired: boolean;
}

export interface Run {
  linesOfBusiness: number;
  ticketsPerWeek: number;
  triageCadence: "24x7" | "business_hours" | "best_effort";
  coverageWindow: "8x5" | "12x5" | "24x5" | "24x7";
  ktSessions: number;
}

export interface RisksAssumptions {
  contingencyLevel: "low" | "medium" | "high";
  riskWorkshopRequired: boolean;
  monthsOfMaintenance: number;
}

export interface Timeline {
  hardDeadline: boolean;
  blackoutWeeks: number;
  externalDependencies: number;
  workingModel: "onsite" | "hybrid" | "remote";
}

export interface Extension {
  id: string;
  type: "key_user" | "in_app" | "side_by_side";
  workflowSteps: number;
  customApis: number;
  customEvents: number;
  uiScreens: number;
  multiTenant: boolean;
}

/**
 * Converts chips + decisions → full project plan
 * Uses EstimationEngine for accurate effort calculation
 */
export class ScenarioGenerator {
  private engine: EstimationEngine;

  constructor() {
    this.engine = new EstimationEngine(ESTIMATION_CONSTANTS);
  }

  /**
   * Main generation function
   */
  generate(chips: Chip[], decisions: Decision[]): ScenarioPlan {
    // Step 1: Build ProjectInput from chips
    const projectInput = this.buildProjectInputFromChips(chips, decisions);

    // Step 2: Run estimation engine
    const basePlan = this.engine.estimate(projectInput);

    // Step 3: Distribute effort across streams (BEFORE decision impacts)
    const streamPlan = this.distributeToStreams(basePlan);

    // Step 4: Apply decision impacts (AFTER distribution, so changes persist)
    const adjustedPlan = this.applyDecisionImpacts(streamPlan, decisions);

    // Step 5: Allocate resources
    const resourcePlan = this.allocateResources(adjustedPlan, decisions);

    // Step 6: Generate timeline
    const timelinePlan = this.generateTimeline(resourcePlan, chips);

    // Step 7: Calculate costs and recalculate totalEffort from phases
    const finalPlan = this.calculateCosts(timelinePlan, decisions);

    return finalPlan;
  }

  /**
   * Convert chips to ProjectInput structure
   */
  private buildProjectInputFromChips(chips: Chip[], decisions: Decision[]): ProjectInput {
    const input: ProjectInput = {
      companyFootprint: this.extractCompanyFootprint(chips),
      scopeItems: this.extractScopeItems(chips, decisions),
      usersRoles: this.extractUsersRoles(chips),
      dataMigration: this.extractDataMigration(chips),
      integrations: this.extractIntegrations(chips),
      outputs: this.extractOutputs(chips),
      localization: this.extractLocalization(chips),
      volumes: this.extractVolumes(chips),
      nfrSecurity: this.extractNFRSecurity(chips),
      envCutover: this.extractEnvCutover(chips),
      trainingOCM: this.extractTrainingOCM(chips),
      run: this.extractRun(chips),
      risksAssumptions: this.extractRisksAssumptions(chips),
      timeline: this.extractTimeline(chips),
      extensions: this.extractExtensions(chips),
      sharedServicesModel: this.detectSharedServices(chips),
      decisionVelocity: this.estimateDecisionVelocity(chips),
    };

    return input;
  }

  /**
   * Extract company footprint from chips
   */
  private extractCompanyFootprint(chips: Chip[]): CompanyFootprint {
    const countryChips = chips.filter((c) => c.type === "country");
    const entityChips = chips.filter((c) => c.type === "legal_entities");

    return {
      legalEntities:
        entityChips.length > 0
          ? entityChips.map((c) => ({
              id: c.id || `entity-${c.type}-${c.value}`,
              name: String(c.value),
            }))
          : countryChips.map((c) => ({
              id: c.id || `country-${c.type}-${c.value}`,
              name: String(c.value),
            })),

      currencies: this.inferCurrencies(countryChips),
      languages: this.inferLanguages(countryChips),
      timezones: this.inferTimezones(countryChips),
    };
  }

  private inferCurrencies(countryChips: Chip[]): string[] {
    const currencyMap: Record<string, string> = {
      Malaysia: "MYR",
      Singapore: "SGD",
      Vietnam: "VND",
      Thailand: "THB",
      Indonesia: "IDR",
      Philippines: "PHP",
    };

    const currencies = countryChips.map((c) => currencyMap[String(c.value)]).filter(Boolean);

    return [...new Set(currencies)];
  }

  private inferLanguages(countryChips: Chip[]): string[] {
    const languageMap: Record<string, string[]> = {
      Malaysia: ["English", "Malay"],
      Singapore: ["English", "Chinese", "Malay", "Tamil"],
      Vietnam: ["English", "Vietnamese"],
      Thailand: ["English", "Thai"],
      Indonesia: ["English", "Indonesian"],
      Philippines: ["English", "Filipino"],
    };

    const languages = countryChips.flatMap((c) => languageMap[String(c.value)] || ["English"]);

    return [...new Set(languages)];
  }

  private inferTimezones(countryChips: Chip[]): string[] {
    const timezoneMap: Record<string, string> = {
      Malaysia: "GMT+8",
      Singapore: "GMT+8",
      Vietnam: "GMT+7",
      Thailand: "GMT+7",
      Indonesia: "GMT+7",
      Philippines: "GMT+8",
    };

    const timezones = countryChips.map((c) => timezoneMap[String(c.value)]).filter(Boolean);

    return [...new Set(timezones)];
  }

  /**
   * Extract scope items from chips and decisions
   */
  private extractScopeItems(chips: Chip[], decisions: Decision[]): ScopeItem[] {
    const moduleChips = chips.filter((c) => c.type === "modules");
    const moduleComboDecision = decisions.find((d) => d.category === "module_combo");

    const items: ScopeItem[] = [];

    // Base modules
    moduleChips.forEach((chip) => {
      const chipValue = String(chip.value);
      items.push({
        id: chip.id || `module-${chip.type}-${chipValue}`,
        name: chipValue,
        complexity: this.inferModuleComplexity(chipValue),
        variants: 1,
        criticalityPercent: 80, // Default assumption
        customWorkflows: this.estimateCustomWorkflows(chipValue),
        customForms: this.estimateCustomForms(chipValue),
        customReports: this.estimateCustomReports(chipValue),
        dependencies: [],
      });
    });

    // Apply module combo decision
    if (moduleComboDecision) {
      this.applyModuleComboLogic(items, moduleComboDecision);
    }

    return items;
  }

  private inferModuleComplexity(moduleName: string): "small" | "medium" | "large" | "xlarge" {
    const complexityMap: Record<string, "small" | "medium" | "large" | "xlarge"> = {
      Finance: "large",
      "FI/CO": "large",
      HR: "medium",
      HCM: "medium",
      "Supply Chain": "large",
      SCM: "large",
      SD: "medium",
      MM: "medium",
      PP: "large",
      QM: "medium",
      PM: "medium",
      PS: "large",
    };

    return complexityMap[moduleName] || "medium";
  }

  private estimateCustomWorkflows(moduleName: string): number {
    const workflowMap: Record<string, number> = {
      Finance: 3,
      HR: 5,
      "Supply Chain": 4,
      SD: 2,
      MM: 2,
      PP: 3,
    };

    return workflowMap[moduleName] || 2;
  }

  private estimateCustomForms(moduleName: string): number {
    const formMap: Record<string, number> = {
      Finance: 5,
      HR: 8,
      "Supply Chain": 4,
      SD: 3,
      MM: 2,
      PP: 3,
    };

    return formMap[moduleName] || 3;
  }

  private estimateCustomReports(moduleName: string): number {
    const reportMap: Record<string, number> = {
      Finance: 10,
      HR: 6,
      "Supply Chain": 8,
      SD: 5,
      MM: 4,
      PP: 6,
    };

    return reportMap[moduleName] || 5;
  }

  private applyModuleComboLogic(items: ScopeItem[], decision: Decision): void {
    const selectedModules = items.map((i) => i.name);

    if (selectedModules.includes("Finance") && selectedModules.includes("Supply Chain")) {
      const fiItem = items.find((i) => i.name === "Finance");
      const scmItem = items.find((i) => i.name === "Supply Chain");

      if (fiItem && scmItem) {
        fiItem.dependencies.push(scmItem.id);
        scmItem.complexity = "large";
      }
    }
  }

  private extractUsersRoles(chips: Chip[]): UsersRoles {
    const userChips = chips.filter((c) => c.type === "users" || c.type === "employees");
    const totalUsers = userChips.length > 0 ? parseInt(String(userChips[0].value)) || 500 : 500;

    return {
      personas: [
        { id: "1", name: "Finance User" },
        { id: "2", name: "HR User" },
      ],
      totalUsers,
      concurrentUsers: Math.floor(totalUsers * 0.2),
      shifts: 1,
      languages: ["English"],
      accessibilityRequired: false,
      roles: [
        { id: "1", name: "Finance Manager" },
        { id: "2", name: "HR Manager" },
      ],
      sodRules: 5,
      uatParticipants: Math.min(50, Math.floor(totalUsers * 0.1)),
      maxCohortSize: 20,
      superUsers: Math.min(10, Math.floor(totalUsers * 0.02)),
    };
  }

  private extractDataMigration(chips: Chip[]): DataMigration {
    const dataVolumeChips = chips.filter((c) => c.type === "data_volume");
    const recordCount =
      dataVolumeChips.length > 0 ? parseInt(String(dataVolumeChips[0].value)) || 100000 : 100000;

    return {
      objects: [
        {
          id: "1",
          name: "Master Data",
          complexity: "medium",
          recordCount,
          sources: [{ id: "1", name: "Legacy System" }],
          transformationRules: 5,
          customFields: 3,
        },
      ],
      dataQuality: "medium",
      mockRuns: 2,
      reconciliationRequired: true,
      piiHandling: true,
      historicalYears: 2,
      cutoverWindow: 24,
      mdmInPlace: false,
    };
  }

  private extractIntegrations(chips: Chip[]): Integration[] {
    const integrationChips = chips.filter((c) => c.type === "integration");

    return integrationChips.map((chip) => ({
      id: chip.id || `integration-${chip.type}-${chip.value}`,
      name: String(chip.value),
      protocol: "REST" as const,
      securityLevel: "oauth" as const,
      transactionsPerDay: 1000,
      transformationRules: 3,
      errorHandling: "basic" as const,
      monitoringRequired: true,
      extraEnvRequired: false,
      partnerInvolved: false,
      reuseExistingPattern: false,
      nfrRequired: true,
      complianceRequired: false,
      backfillRequired: false,
      runbookRequired: true,
    }));
  }

  private extractOutputs(chips: Chip[]): Outputs {
    return {
      forms: [
        { id: "1", complexity: "medium" },
        { id: "2", complexity: "simple" },
      ],
      reports: [
        { id: "1", complexity: "medium" },
        { id: "2", complexity: "complex" },
      ],
      sacConnections: 0,
      sacPages: 0,
      sacWidgets: 0,
    };
  }

  private extractLocalization(chips: Chip[]): Localization {
    const countryChips = chips.filter((c) => c.type === "country");

    return {
      countries: countryChips.map((c) => String(c.value)),
      eInvoiceModels: [],
      whtRequired: false,
      statutoryReports: 0,
      bankFormats: 0,
    };
  }

  private extractVolumes(chips: Chip[]): Volumes {
    return {
      transactionsPerDay: 1000,
      linesPerDocument: 5,
      peakFactors: [{ period: "month_end" }],
      ilmRequired: false,
    };
  }

  private extractNFRSecurity(chips: Chip[]): NFRSecurity {
    return {
      slaTarget: "standard",
      latencyTarget: 1000,
      dataResidency: false,
      ssoMode: "None",
      mfaRequired: false,
      penTestRequired: false,
      complianceFrameworks: [],
    };
  }

  private extractEnvCutover(chips: Chip[]): EnvCutover {
    return {
      threeSystemLandscape: true,
      extraEnvironments: 0,
      dataRefreshes: 2,
      dressRehearsals: 1,
      cutoverWindow: "weekend",
      freezePeriodWeeks: 0,
    };
  }

  private extractTrainingOCM(chips: Chip[]): TrainingOCM {
    return {
      impactAssessmentRequired: true,
      commsArtifacts: 5,
      tttCohorts: 2,
      floorwalkingRequired: true,
    };
  }

  private extractRun(chips: Chip[]): Run {
    return {
      linesOfBusiness: 2,
      ticketsPerWeek: 10,
      triageCadence: "business_hours",
      coverageWindow: "8x5",
      ktSessions: 3,
    };
  }

  private extractRisksAssumptions(chips: Chip[]): RisksAssumptions {
    return {
      contingencyLevel: "medium",
      riskWorkshopRequired: true,
      monthsOfMaintenance: 3,
    };
  }

  private extractTimeline(chips: Chip[]): Timeline {
    return {
      hardDeadline: false,
      blackoutWeeks: 0,
      externalDependencies: 2,
      workingModel: "hybrid",
    };
  }

  private extractExtensions(chips: Chip[]): Extension[] {
    return [];
  }

  private detectSharedServices(chips: Chip[]): boolean {
    const entityChips = chips.filter((c) => c.type === "legal_entities");
    return entityChips.length > 3;
  }

  private estimateDecisionVelocity(chips: Chip[]): "fast" | "normal" | "slow" {
    return "normal";
  }

  /**
   * Apply decision impacts to base plan
   */
  private applyDecisionImpacts(plan: ScenarioPlan, decisions: Decision[]): ScenarioPlan {
    decisions.forEach((decision) => {
      switch (decision.category) {
        case "banking_path":
          this.applyBankingPathImpact(plan, decision);
          break;
        case "integration_posture":
          this.applyIntegrationPostureImpact(plan, decision);
          break;
        case "sso_mode":
          this.applySSOImpact(plan, decision);
          break;
        case "fricew_target":
          this.applyFRICEWTargetImpact(plan, decision);
          break;
        case "rate_region":
          this.applyRateRegionImpact(plan, decision);
          break;
      }
    });

    return plan;
  }

  private applyBankingPathImpact(plan: ScenarioPlan, decision: Decision): void {
    const impacts: Record<string, { effortDelta: number; costDelta: number }> = {
      MBC: { effortDelta: 120, costDelta: 240000 },
      DRC: { effortDelta: 80, costDelta: 160000 },
      "Host-to-Host": { effortDelta: 200, costDelta: 400000 },
    };

    const selected =
      typeof decision.selected === "string" ? decision.selected : decision.selected?.[0] || "";
    const impact = impacts[selected];
    if (!impact) return;

    const integrationPhase = plan.phases.find(
      (p) => p.name.includes("Integration") && p.category === "Realize"
    );
    if (integrationPhase && integrationPhase.effort) {
      integrationPhase.effort += impact.effortDelta;
    }

    plan.totalCost += impact.costDelta;
  }

  private applyIntegrationPostureImpact(plan: ScenarioPlan, decision: Decision): void {
    // Implement integration posture impact logic
  }

  private applySSOImpact(plan: ScenarioPlan, decision: Decision): void {
    const impacts: Record<string, { effortDelta: number }> = {
      None: { effortDelta: 0 },
      SAML: { effortDelta: 8 },
      OAuth: { effortDelta: 10 },
      OIDC: { effortDelta: 12 },
    };

    const selected =
      typeof decision.selected === "string" ? decision.selected : decision.selected?.[0] || "";
    const impact = impacts[selected];
    if (!impact) return;

    const exploreArch = plan.phases.find(
      (p) => p.name.includes("Solution Architecture") && p.category === "Explore"
    );
    const realizeArch = plan.phases.find(
      (p) => p.name.includes("Solution Architecture") && p.category === "Realize"
    );

    if (exploreArch && exploreArch.effort) exploreArch.effort += impact.effortDelta * 0.3;
    if (realizeArch && realizeArch.effort) realizeArch.effort += impact.effortDelta * 0.7;
  }

  private applyFRICEWTargetImpact(plan: ScenarioPlan, decision: Decision): void {
    // Implement FRICEW target impact logic
  }

  private applyRateRegionImpact(plan: ScenarioPlan, decision: Decision): void {
    // Rate region impacts cost, not effort
  }

  /**
   * Distribute total effort across 8 streams
   */
  private distributeToStreams(plan: ScenarioPlan): ScenarioPlan {
    const streams = [
      "Business Transformation & OCM",
      "Project Management",
      "Solution Architecture",
      "Configuration",
      "Development & Extensions",
      "Data Migration",
      "Integration",
      "Testing & Quality Assurance",
    ];

    const phases = ["Prepare", "Explore", "Realize", "Deploy", "Run"];
    const newPhases: Phase[] = [];

    streams.forEach((stream) => {
      phases.forEach((phase) => {
        const streamWeight = (ESTIMATION_CONSTANTS.STREAM_WEIGHTS as any)[stream] || 0.125;
        const phaseWeight =
          (ESTIMATION_CONSTANTS.PHASE_DISTRIBUTION as any)[phase.toLowerCase()] || 0.2;

        const effort = plan.totalEffort * streamWeight * phaseWeight;

        newPhases.push({
          id: `${stream}-${phase}`,
          name: `${phase} - ${stream}`,
          category: phase,
          startBusinessDay: 0,
          workingDays: 10,
          effort: Math.round(effort * 10) / 10,
          resources: [],
        });
      });
    });

    plan.phases = newPhases;
    return plan;
  }

  /**
   * Allocate resources to plan items
   */
  private allocateResources(plan: ScenarioPlan, decisions: Decision[]): ScenarioPlan {
    const rateRegionDecision = decisions.find((d) => d.category === "rate_region");
    const region =
      typeof rateRegionDecision?.selected === "string" ? rateRegionDecision.selected : "ABMY";

    plan.phases.forEach((phase) => {
      const resources = this.allocateResourcesByStream(
        phase.name.split(" - ")[1] || "",
        phase.effort || 0,
        region
      );
      phase.resources = resources;
    });

    return plan;
  }

  private allocateResourcesByStream(stream: string, effort: number, region: string): Resource[] {
    const allocations: Record<string, Array<{ role: string; allocation: number }>> = {
      "Business Transformation & OCM": [
        { role: "Senior Manager", allocation: 0.3 },
        { role: "Manager", allocation: 0.4 },
        { role: "Senior Consultant", allocation: 0.3 },
      ],
      "Project Management": [
        { role: "Senior Manager", allocation: 0.5 },
        { role: "Manager", allocation: 0.5 },
      ],
      "Solution Architecture": [
        { role: "Director", allocation: 0.2 },
        { role: "Senior Manager", allocation: 0.4 },
        { role: "Manager", allocation: 0.4 },
      ],
      Configuration: [
        { role: "Senior Consultant", allocation: 0.4 },
        { role: "Consultant", allocation: 0.6 },
      ],
      "Development & Extensions": [
        { role: "Senior Consultant", allocation: 0.3 },
        { role: "Consultant", allocation: 0.5 },
        { role: "Analyst", allocation: 0.2 },
      ],
      "Data Migration": [
        { role: "Manager", allocation: 0.3 },
        { role: "Senior Consultant", allocation: 0.4 },
        { role: "Consultant", allocation: 0.3 },
      ],
      Integration: [
        { role: "Senior Manager", allocation: 0.2 },
        { role: "Senior Consultant", allocation: 0.5 },
        { role: "Consultant", allocation: 0.3 },
      ],
      "Testing & Quality Assurance": [
        { role: "Manager", allocation: 0.3 },
        { role: "Consultant", allocation: 0.4 },
        { role: "Analyst", allocation: 0.3 },
      ],
    };

    const streamAllocations = allocations[stream] || [];

    return streamAllocations.map((alloc, idx) => ({
      id: `resource-${idx}`,
      role: alloc.role,
      allocation: alloc.allocation,
      region,
      hourlyRate: this.getHourlyRate(alloc.role, region),
    }));
  }

  private getHourlyRate(role: string, region: string): number {
    const rates: Record<string, Record<string, number>> = {
      ABMY: {
        Director: 200,
        "Senior Manager": 150,
        Manager: 120,
        "Senior Consultant": 100,
        Consultant: 80,
        Analyst: 60,
      },
      ABSG: {
        Director: 280,
        "Senior Manager": 220,
        Manager: 180,
        "Senior Consultant": 150,
        Consultant: 120,
        Analyst: 90,
      },
    };

    return rates[region]?.[role] || 100;
  }

  /**
   * Generate timeline
   */
  private generateTimeline(plan: ScenarioPlan, chips: Chip[]): ScenarioPlan {
    const timelineChips = chips.filter((c) => c.type === "timeline");
    const durationMonths =
      timelineChips.length > 0 ? parseInt(String(timelineChips[0].value)) || 6 : 6;

    plan.duration = durationMonths * 20; // Convert to business days

    // Update phase start dates
    let currentDay = 0;
    const phasesByCategory: Record<string, Phase[]> = {};

    plan.phases.forEach((phase) => {
      if (!phasesByCategory[phase.category]) {
        phasesByCategory[phase.category] = [];
      }
      phasesByCategory[phase.category].push(phase);
    });

    ["Prepare", "Explore", "Realize", "Deploy", "Run"].forEach((category) => {
      const categoryPhases = phasesByCategory[category] || [];
      const categoryDuration = Math.floor(
        plan.duration *
          ((ESTIMATION_CONSTANTS.PHASE_DISTRIBUTION as any)[category.toLowerCase()] || 0.2)
      );

      categoryPhases.forEach((phase) => {
        phase.startBusinessDay = currentDay;
        phase.workingDays = categoryDuration;
      });

      currentDay += categoryDuration;
    });

    return plan;
  }

  /**
   * Calculate costs
   */
  private calculateCosts(plan: ScenarioPlan, decisions: Decision[]): ScenarioPlan {
    let totalCost = 0;
    let totalEffort = 0;

    plan.phases.forEach((phase) => {
      // Sum up total effort from all phases
      totalEffort += phase.effort || 0;

      // Calculate cost per phase
      phase.resources?.forEach((resource) => {
        const resourceCost = (phase.effort || 0) * resource.allocation * resource.hourlyRate * 8;
        totalCost += resourceCost;
      });
    });

    // Update plan with recalculated totals
    plan.totalEffort = totalEffort;
    plan.totalCost = Math.round(totalCost);

    // Generate assumptions and risks
    plan.assumptions = this.generateAssumptions(decisions);
    plan.risks = this.generateRisks(decisions);

    return plan;
  }

  private generateAssumptions(decisions: Decision[]): string[] {
    return [
      "Client will provide dedicated resources for the project",
      "Current business processes are documented and available",
      "Decision makers are available for key project decisions",
      "Test data will be provided by client",
      "Standard SAP best practices will be followed",
    ];
  }

  private generateRisks(decisions: Decision[]): string[] {
    return [
      "Data quality issues during migration - Mitigation: Early data profiling and cleansing activities",
      "User adoption challenges - Mitigation: Comprehensive training and change management program",
    ];
  }
}
