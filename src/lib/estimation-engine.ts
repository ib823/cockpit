// src/lib/estimation-engine.ts
import { ScenarioPlan } from '@/types/core';
import type {
  ProjectInput,
  CompanyFootprint,
  ScopeItem,
  UsersRoles,
  DataMigration,
  Integration
} from './scenario-generator';

interface Totals {
  e: number;   // Explore
  r: number;   // Realize
  d: number;   // Deploy
  ru: number;  // Run
}

class EstimationEngine {
  private constants: typeof CONSTANTS;

  constructor(constants = CONSTANTS) {
    this.constants = constants;
  }

  /**
   * Master estimation function (§6.2 from Playbook)
   */
  estimate(project: ProjectInput): ScenarioPlan {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };

    // §4.1 Company & Footprint
    this.addEffort(t, this.estimateCompanyFootprint(project.companyFootprint));

    // §4.2 Scope Items
    project.scopeItems.forEach(item => {
      this.addEffort(t, this.estimateScopeItem(item));
    });

    // §4.3 Users & Roles
    this.addEffort(t, this.estimateUsersRoles(project.usersRoles));

    // §4.4 Data Migration
    this.addEffort(t, this.estimateDataMigration(project.dataMigration));

    // §4.5 Integrations
    project.integrations.forEach(integration => {
      this.addEffort(t, this.estimateIntegration(integration));
    });

    // §4.6 Forms, Reports, Analytics
    this.addEffort(t, this.estimateOutputs(project.outputs));

    // §4.7 Localization
    this.addEffort(t, this.estimateLocalization(project.localization));

    // §4.8 Volumes
    this.addEffort(t, this.estimateVolumes(project.volumes));

    // §4.9 NFR & Security
    this.addEffort(t, this.estimateNFRSecurity(project.nfrSecurity));

    // §4.10 Environments & Cutover
    this.addEffort(t, this.estimateEnvCutover(project.envCutover));

    // §4.11 Training & OCM
    this.addEffort(t, this.estimateTrainingOCM(project.trainingOCM));

    // §4.12 Run Support
    this.addEffort(t, this.estimateRun(project.run));

    // §4.13 Risks & Assumptions
    this.addEffort(t, this.estimateRisksAssumptions(project.risksAssumptions));

    // §4.14 Timeline Constraints
    this.addEffort(t, this.estimateTimeline(project.timeline));

    // §4.15 Extensions
    project.extensions.forEach(extension => {
      this.addEffort(t, this.estimateExtension(extension));
    });

    // Global adjustments
    this.applySharedServicesDiscount(t, project);
    this.applyDecisionVelocitySurcharge(t, project);

    // Contingency (7%/10%/12%)
    this.applyContingency(t, project.risksAssumptions.contingencyLevel);

    return this.buildScenarioPlan(t, project);
  }

  // §4.1 Company & Footprint
  private estimateCompanyFootprint(footprint: CompanyFootprint): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    
    // Base effort
    t.e += this.constants.BASE_EXPLORE;
    t.r += this.constants.BASE_REALIZE;
    t.d += this.constants.BASE_DEPLOY;
    t.ru += this.constants.BASE_RUN;

    // Entity adders
    const entityCount = footprint.legalEntities.length;
    if (entityCount > 1) {
      const adder = (entityCount - 1) * this.constants.ENTITY_ADDER;
      t.e += adder * 0.15;  // 15% in Explore
      t.r += adder * 0.50;  // 50% in Realize
      t.d += adder * 0.25;  // 25% in Deploy
      t.ru += adder * 0.10; // 10% in Run
    }

    // Currency adders
    const currencyCount = footprint.currencies.length;
    if (currencyCount > 1) {
      const adder = (currencyCount - 1) * this.constants.CURRENCY_ADDER;
      t.r += adder * 0.8;
      t.d += adder * 0.2;
    }

    // Language adders
    const languageCount = footprint.languages.length;
    if (languageCount > 1) {
      const adder = (languageCount - 1) * this.constants.LANGUAGE_ADDER;
      t.e += adder * 0.2;
      t.r += adder * 0.6;
      t.d += adder * 0.2;
    }

    // Timezone adders
    const timezoneCount = footprint.timezones.length;
    if (timezoneCount > 1) {
      const adder = (timezoneCount - 1) * this.constants.TIMEZONE_ADDER;
      t.r += adder * 0.5;
      t.d += adder * 0.3;
      t.ru += adder * 0.2;
    }

    return t;
  }

  // §4.2 Scope Items
  private estimateScopeItem(item: ScopeItem): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };

    // Base effort by complexity
    const base = this.constants.SCOPE_BASE[item.complexity];
    t.e += base.e;
    t.r += base.r;
    t.d += base.d;
    t.ru += base.ru;

    // Variant multiplier
    if (item.variants > 1) {
      const multiplier = 1 + (item.variants - 1) * this.constants.VARIANT_FACTOR;
      t.e *= multiplier;
      t.r *= multiplier;
      t.d *= multiplier;
    }

    // Criticality factor
    const criticalityMultiplier = 1 + (item.criticalityPercent / 100) * this.constants.CRITICALITY_FACTOR;
    t.e *= criticalityMultiplier;
    t.r *= criticalityMultiplier;
    t.d *= criticalityMultiplier;

    // Workflow adders
    if (item.customWorkflows > 0) {
      const adder = item.customWorkflows * this.constants.WORKFLOW_ADDER;
      t.r += adder * 0.7;
      t.d += adder * 0.3;
    }

    // Form adders
    if (item.customForms > 0) {
      const adder = item.customForms * this.constants.FORM_ADDER;
      t.r += adder * 0.6;
      t.d += adder * 0.4;
    }

    // Report adders
    if (item.customReports > 0) {
      const adder = item.customReports * this.constants.REPORT_ADDER;
      t.r += adder * 0.5;
      t.d += adder * 0.5;
    }

    // Dependencies
    if (item.dependencies.length > 0) {
      const adder = item.dependencies.length * this.constants.DEPENDENCY_ADDER;
      t.e += adder * 0.3;
      t.r += adder * 0.5;
      t.d += adder * 0.2;
    }

    return t;
  }

  // §4.3 Users & Roles (CRITICAL for SAP)
  private estimateUsersRoles(usersRoles: UsersRoles): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };

    // Base per persona
    const personaCount = usersRoles.personas.length;
    const basePerPersona = this.constants.PERSONA_BASE;
    t.e += personaCount * basePerPersona * 0.2;
    t.r += personaCount * basePerPersona * 0.5;
    t.d += personaCount * basePerPersona * 0.3;

    // Per-user scaling (diminishing returns)
    const totalUsers = usersRoles.totalUsers;
    if (totalUsers > 100) {
      const scalingFactor = Math.log10(totalUsers / 100) * this.constants.USER_SCALING;
      t.r += scalingFactor;
      t.d += scalingFactor * 0.5;
    }

    // Concurrent users (for performance testing)
    const concurrentRatio = usersRoles.concurrentUsers / totalUsers;
    if (concurrentRatio > 0.3) {
      t.d += this.constants.CONCURRENCY_ADDER;
    }

    // Multi-shift operations
    if (usersRoles.shifts > 1) {
      t.ru *= 1 + (usersRoles.shifts - 1) * 0.4;
    }

    // Languages for UI
    if (usersRoles.languages.length > 1) {
      const langAdder = (usersRoles.languages.length - 1) * this.constants.UI_LANGUAGE_ADDER;
      t.r += langAdder * 0.6;
      t.d += langAdder * 0.4;
    }

    // Accessibility requirements
    if (usersRoles.accessibilityRequired) {
      t.r += this.constants.ACCESSIBILITY_ADDER * 0.7;
      t.d += this.constants.ACCESSIBILITY_ADDER * 0.3;
    }

    // Role count (for RBAC setup)
    const roleCount = usersRoles.roles.length;
    if (roleCount > 10) {
      const roleAdder = (roleCount - 10) * this.constants.ROLE_ADDER;
      t.e += roleAdder * 0.3;
      t.r += roleAdder * 0.5;
      t.d += roleAdder * 0.2;
    }

    // SoD (Segregation of Duties) complexity
    if (usersRoles.sodRules > 0) {
      const sodAdder = usersRoles.sodRules * this.constants.SOD_ADDER;
      t.r += sodAdder * 0.6;
      t.d += sodAdder * 0.4;
    }

    // UAT participants
    const uatUsers = usersRoles.uatParticipants;
    t.d += (uatUsers / 10) * this.constants.UAT_ADDER;

    // Training cohorts
    const trainingCohorts = Math.ceil(totalUsers / usersRoles.maxCohortSize);
    t.d += trainingCohorts * this.constants.TRAINING_COHORT_ADDER;

    // Super users
    if (usersRoles.superUsers > 0) {
      t.d += usersRoles.superUsers * this.constants.SUPER_USER_ADDER;
      t.ru += usersRoles.superUsers * this.constants.SUPER_USER_ADDER * 0.3;
    }

    return t;
  }

  // §4.4 Data Migration (Often underestimated!)
  private estimateDataMigration(migration: DataMigration): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };

    // Per-object baseline
    migration.objects.forEach(obj => {
      const base = this.constants.MIGRATION_OBJECT_BASE[obj.complexity];
      t.e += base * 0.1;
      t.r += base * 0.4;
      t.d += base * 0.5;

      // Volume factor
      const volumeMultiplier = this.getVolumeFactor(obj.recordCount);
      const volAdder = base * volumeMultiplier;
      t.r += volAdder * 0.6;
      t.d += volAdder * 0.4;

      // Source systems
      if (obj.sources.length > 1) {
        const sourceAdder = (obj.sources.length - 1) * this.constants.SOURCE_ADDER;
        t.r += sourceAdder * 0.7;
        t.d += sourceAdder * 0.3;
      }

      // Data quality multiplier
      const qualityFactor = this.constants.QUALITY_FACTORS[migration.dataQuality];
      t.e *= qualityFactor;
      t.r *= qualityFactor;
      t.d *= qualityFactor;

      // Transformation rules
      if (obj.transformationRules > 0) {
        const transAdder = obj.transformationRules * this.constants.TRANSFORMATION_ADDER;
        t.r += transAdder * 0.8;
        t.d += transAdder * 0.2;
      }

      // Custom fields
      if (obj.customFields > 0) {
        const customAdder = obj.customFields * this.constants.CUSTOM_FIELD_ADDER;
        t.r += customAdder * 0.5;
        t.d += customAdder * 0.5;
      }
    });

    // Mock migration runs
    const mockRuns = migration.mockRuns || 2;
    t.d += (mockRuns - 1) * this.constants.MOCK_RUN_ADDER;

    // Reconciliation effort
    if (migration.reconciliationRequired) {
      t.d += this.constants.RECONCILIATION_ADDER;
    }

    // PII handling
    if (migration.piiHandling) {
      t.r += this.constants.PII_ADDER * 0.6;
      t.d += this.constants.PII_ADDER * 0.4;
    }

    // Historical data
    if (migration.historicalYears > 2) {
      const histAdder = (migration.historicalYears - 2) * this.constants.HISTORICAL_ADDER;
      t.r += histAdder * 0.5;
      t.d += histAdder * 0.5;
    }

    // Cutover tightness
    if (migration.cutoverWindow < 24) {  // hours
      t.d += this.constants.TIGHT_CUTOVER_ADDER;
    }

    // MDM discount
    if (migration.mdmInPlace) {
      t.r *= 0.85;  // 15% discount
      t.d *= 0.85;
    }

    return t;
  }

  // §4.6 Forms, Reports, Analytics
  private estimateOutputs(outputs: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.7 Localization
  private estimateLocalization(localization: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.8 Volumes
  private estimateVolumes(volumes: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.9 NFR & Security
  private estimateNFRSecurity(nfrSecurity: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.10 Environments & Cutover
  private estimateEnvCutover(envCutover: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.11 Training & OCM
  private estimateTrainingOCM(trainingOCM: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.12 Run Support
  private estimateRun(run: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.13 Risks & Assumptions
  private estimateRisksAssumptions(risksAssumptions: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.14 Timeline Constraints
  private estimateTimeline(timeline: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.15 Extensions
  private estimateExtension(extension: any): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };
    // Placeholder implementation
    return t;
  }

  // §4.5 Integrations (Complex area!)
  private estimateIntegration(integration: Integration): Totals {
    const t: Totals = { e: 0, r: 0, d: 0, ru: 0 };

    // Protocol baseline
    const protoBase = (this.constants.PROTOCOL_BASELINES as any)[integration.protocol] || 15;
    t.e += protoBase * 0.15;
    t.r += protoBase * 0.50;
    t.d += protoBase * 0.25;
    t.ru += protoBase * 0.10;

    // Security factor
    const securityFactor = (this.constants.SECURITY_FACTORS as any)[integration.securityLevel] || 1.0;
    t.e *= securityFactor;
    t.r *= securityFactor;
    t.d *= securityFactor;

    // Volume adders
    const volumeAdder = this.getIntegrationVolumeAdder(integration.transactionsPerDay);
    t.r += volumeAdder * 0.6;
    t.d += volumeAdder * 0.4;

    // Transformation rules
    if (integration.transformationRules > 0) {
      const transAdder = integration.transformationRules * this.constants.INTEGRATION_TRANSFORMATION_ADDER;
      t.r += transAdder * 0.7;
      t.d += transAdder * 0.3;
    }

    // Error handling complexity
    if (integration.errorHandling === 'advanced') {
      t.r += this.constants.ERROR_HANDLING_ADDER * 0.6;
      t.d += this.constants.ERROR_HANDLING_ADDER * 0.4;
    }

    // Monitoring & alerting
    if (integration.monitoringRequired) {
      t.r += this.constants.MONITORING_ADDER * 0.5;
      t.d += this.constants.MONITORING_ADDER * 0.3;
      t.ru += this.constants.MONITORING_ADDER * 0.2;
    }

    // Extra environment
    if (integration.extraEnvRequired) {
      t.r += this.constants.EXTRA_ENV_ADDER * 0.4;
      t.d += this.constants.EXTRA_ENV_ADDER * 0.6;
    }

    // Partner factor (if 3rd party integration partner involved)
    if (integration.partnerInvolved) {
      t.e *= this.constants.PARTNER_FACTOR;
      t.r *= this.constants.PARTNER_FACTOR;
      t.d *= this.constants.PARTNER_FACTOR;
    }

    // Reuse discount
    if (integration.reuseExistingPattern) {
      t.r *= 0.75;  // 25% discount
      t.d *= 0.75;
    }

    // NFR requirements
    if (integration.nfrRequired) {
      t.r += this.constants.INTEGRATION_NFR_ADDER * 0.6;
      t.d += this.constants.INTEGRATION_NFR_ADDER * 0.4;
    }

    // Compliance requirements
    if (integration.complianceRequired) {
      t.r += this.constants.COMPLIANCE_ADDER * 0.5;
      t.d += this.constants.COMPLIANCE_ADDER * 0.5;
    }

    // Backfill required
    if (integration.backfillRequired) {
      t.d += this.constants.BACKFILL_ADDER;
    }

    // Runbook creation
    if (integration.runbookRequired) {
      t.d += this.constants.RUNBOOK_ADDER * 0.7;
      t.ru += this.constants.RUNBOOK_ADDER * 0.3;
    }

    return t;
  }

  // ... Continue for §4.6-§4.15 (Forms, Localization, Volumes, etc.)
  // Each driver category follows the same pattern

  // Helper functions
  private addEffort(target: Totals, source: Totals): void {
    target.e += source.e;
    target.r += source.r;
    target.d += source.d;
    target.ru += source.ru;
  }

  private getVolumeFactor(recordCount: number): number {
    if (recordCount < 10000) return 0;
    if (recordCount < 100000) return 0.2;
    if (recordCount < 1000000) return 0.5;
    return 1.0;
  }

  private getIntegrationVolumeAdder(transactionsPerDay: number): number {
    if (transactionsPerDay < 1000) return 0;
    if (transactionsPerDay < 10000) return 2;
    if (transactionsPerDay < 100000) return 5;
    return 10;
  }

  // Global adjustments
  private applySharedServicesDiscount(t: Totals, project: ProjectInput): void {
    if (project.sharedServicesModel) {
      t.e *= 0.85;  // 15% discount
      t.r *= 0.85;
      t.d *= 0.85;
      t.ru *= 0.90; // Smaller discount for Run
    }
  }

  private applyDecisionVelocitySurcharge(t: Totals, project: ProjectInput): void {
    if (project.decisionVelocity === 'slow') {
      t.e *= 1.15;  // 15% surcharge
      t.r *= 1.10;  // 10% surcharge
      t.d *= 1.05;  // 5% surcharge
    }
  }

  private applyContingency(t: Totals, level: 'low' | 'medium' | 'high'): void {
    const factors = { low: 1.07, medium: 1.10, high: 1.12 };
    const factor = factors[level];
    t.e *= factor;
    t.r *= factor;
    t.d *= factor;
    t.ru *= factor;
  }

  private buildScenarioPlan(t: Totals, project: ProjectInput): ScenarioPlan {
    // Convert Totals to ScenarioPlan structure
    const totalEffort = t.e + t.r + t.d + t.ru;

    return {
      id: `plan_${Date.now()}`,
      name: 'Baseline Plan',
      phases: [],
      totalEffort,
      totalCost: 0,
      duration: 0,
      risks: [],
      assumptions: [],
      confidence: 0.8
    };
  }
}

// Constants (from Playbook §8)
const CONSTANTS = {
  // Base effort
  BASE_EXPLORE: 40,    // PD
  BASE_REALIZE: 180,   // PD
  BASE_DEPLOY: 80,     // PD
  BASE_RUN: 20,        // PD per month

  // Company & Footprint (§4.1)
  ENTITY_ADDER: 8,
  CURRENCY_ADDER: 3,
  LANGUAGE_ADDER: 5,
  TIMEZONE_ADDER: 2,

  // Scope Items (§4.2)
  SCOPE_BASE: {
    small: { e: 5, r: 20, d: 10, ru: 2 },
    medium: { e: 10, r: 40, d: 20, ru: 4 },
    large: { e: 20, r: 80, d: 40, ru: 8 },
    xlarge: { e: 40, r: 160, d: 80, ru: 16 }
  },
  VARIANT_FACTOR: 0.3,
  CRITICALITY_FACTOR: 0.2,
  WORKFLOW_ADDER: 3,
  FORM_ADDER: 2,
  REPORT_ADDER: 4,
  DEPENDENCY_ADDER: 1.5,

  // Users & Roles (§4.3)
  PERSONA_BASE: 12,
  USER_SCALING: 0.05,
  CONCURRENCY_ADDER: 5,
  UI_LANGUAGE_ADDER: 4,
  ACCESSIBILITY_ADDER: 8,
  ROLE_ADDER: 0.5,
  SOD_ADDER: 1.5,
  UAT_ADDER: 0.2,
  TRAINING_COHORT_ADDER: 2,
  SUPER_USER_ADDER: 1,

  // Data Migration (§4.4)
  MIGRATION_OBJECT_BASE: {
    simple: 5,
    medium: 12,
    complex: 25
  },
  SOURCE_ADDER: 3,
  QUALITY_FACTORS: {
    high: 1.0,
    medium: 1.3,
    low: 1.8
  },
  TRANSFORMATION_ADDER: 1,
  CUSTOM_FIELD_ADDER: 0.5,
  MOCK_RUN_ADDER: 3,
  RECONCILIATION_ADDER: 5,
  PII_ADDER: 4,
  HISTORICAL_ADDER: 2,
  TIGHT_CUTOVER_ADDER: 8,

  // Integrations (§4.5)
  PROTOCOL_BASELINES: {
    'REST': 15,
    'SOAP': 18,
    'OData': 12,
    'RFC/BAPI': 20,
    'IDoc': 22,
    'SFTP': 10,
    'AS2': 25,
    'Kafka': 30
  },
  SECURITY_FACTORS: {
    basic: 1.0,
    oauth: 1.2,
    certificate: 1.3,
    advanced: 1.5
  },
  INTEGRATION_TRANSFORMATION_ADDER: 2,
  ERROR_HANDLING_ADDER: 5,
  MONITORING_ADDER: 3,
  EXTRA_ENV_ADDER: 4,
  PARTNER_FACTOR: 1.25,
  INTEGRATION_NFR_ADDER: 4,
  COMPLIANCE_ADDER: 6,
  BACKFILL_ADDER: 8,
  RUNBOOK_ADDER: 2,

  // Add constants for §4.6-§4.15...
  // (This would continue for all remaining driver categories)
};

export { CONSTANTS, EstimationEngine };
export type { ProjectInput, Totals };
