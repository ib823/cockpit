/**
 * FORMULA ENGINE
 *
 * Core calculation logic for SAP effort estimation:
 * Total MD = BCE × (1 + SB) × (1 + PC) × (1 + OSG) + FW
 *
 * Where:
 * - BCE = Base Core Effort (378 MD for Finance+MM baseline)
 * - SB = Scope Breadth (modules, L3 items, integrations)
 * - PC = Process Complexity (extensions: in-app +0.01, BTP +0.05)
 * - OSG = Org Scale & Geography (countries, entities, languages)
 * - FW = Factory Wrapper (97 MD: PM 65 + Basis 24 + S&A 8)
 */

export interface EstimatorInputs {
  // Base profile
  profile: ProfilePreset;

  // Scope Breadth (SB)
  modules: string[];
  l3Items: L3Item[];
  integrations: number;

  // Process Complexity (PC)
  inAppExtensions: number;
  btpExtensions: number;

  // Org Scale & Geography (OSG)
  countries: number;
  entities: number;
  languages: number;
  peakSessions: number;
}

export interface EstimateResult {
  // Breakdown
  bce: number;           // Base Core Effort
  sbEffort: number;      // Scope Breadth effort
  pcEffort: number;      // Process Complexity effort
  osgEffort: number;     // Org Scale & Geography effort
  fw: number;            // Factory Wrapper

  // Multipliers
  sbMultiplier: number;  // 1 + SB
  pcMultiplier: number;  // 1 + PC
  osgMultiplier: number; // 1 + OSG

  // Totals
  coreEffort: number;    // BCE × (1+SB) × (1+PC) × (1+OSG)
  totalEffort: number;   // coreEffort + FW

  // Derived metrics
  duration: {
    weeks: number;
    months: number;
  };
  fte: number;
  cost: {
    currency: string;
    amount: number;
  };

  // Justification
  description: string;
  confidence: number; // 0-100
}

export interface ProfilePreset {
  id: string;
  name: string;
  bce: number;
  modules: string[];
  description: string;
  complexity: number; // 1-5
}

export interface L3Item {
  id: string;
  code: string;         // e.g., "2TW" (GL Master Data)
  name: string;
  module: string;       // FI, CO, MM, SD, etc.
  tier: 'A' | 'B' | 'C';
  coefficient: number;  // 0.006, 0.008, 0.010
  description: string;
}

// Preset profiles
export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    id: 'my-sme',
    name: 'Malaysia SME (Finance)',
    bce: 378,
    modules: ['FI', 'CO'],
    description: 'Standard finance impl with basic procurement, no integrations',
    complexity: 2
  },
  {
    id: 'sg-mid',
    name: 'Singapore Mid-Market (Finance+MM)',
    bce: 520,
    modules: ['FI', 'CO', 'MM'],
    description: 'Finance + Materials Management with standard integrations',
    complexity: 3
  },
  {
    id: 'multi-ent',
    name: 'Multi-Country Enterprise',
    bce: 890,
    modules: ['FI', 'CO', 'MM', 'SD'],
    description: 'Multi-country rollout with complex requirements',
    complexity: 4
  }
];

// L3 Tier coefficients
export const TIER_COEFFICIENTS = {
  A: 0.006, // Standard config, single variant, low risk
  B: 0.008, // Cross-module touch, 2 variants, medium risk
  C: 0.010  // E2E statutory, 3+ variants, high risk
};

// Extension coefficients
export const EXTENSION_COEFFICIENTS = {
  inApp: 0.01,  // In-app extension (Fiori, custom fields)
  btp: 0.05     // BTP extension (CAP services, integrations)
};

// Geography coefficients
export const GEOGRAPHY_COEFFICIENTS = {
  countryBase: 0.10,      // +10% per additional country
  entityBase: 0.05,       // +5% per additional legal entity
  languageBase: 0.02,     // +2% per additional language
  sessionBase: 0.01       // +1% per 100 peak sessions
};

// Factory wrapper base
export const FACTORY_WRAPPER_BASE = 97; // PM 65 + Basis 24 + S&A 8

// Resource assumptions
export const RESOURCE_ASSUMPTIONS = {
  fteDefault: 6,                    // 6 consultants
  workDaysPerMonth: 22,
  bufferPercent: 0.15,              // 15% contingency
  ratesByRegion: {
    ABMY: 1580,                     // RM per day
    ABSG: 2100,                     // SGD per day
    ABVN: 850                       // USD per day
  },
  defaultRegion: 'ABMY' as const
};

/**
 * Core formula engine
 */
export class FormulaEngine {
  /**
   * Calculate total estimate from inputs
   */
  calculateTotal(inputs: EstimatorInputs): EstimateResult {
    // 1. Base Core Effort
    const bce = inputs.profile.bce;

    // 2. Scope Breadth (SB)
    const sbMultiplier = this.calculateSB(
      inputs.modules,
      inputs.l3Items,
      inputs.integrations
    );
    const sbEffort = Math.round(bce * (sbMultiplier - 1));

    // 3. Process Complexity (PC)
    const pcMultiplier = this.calculatePC(
      inputs.inAppExtensions,
      inputs.btpExtensions
    );
    const pcEffort = Math.round(bce * sbMultiplier * (pcMultiplier - 1));

    // 4. Org Scale & Geography (OSG)
    const osgMultiplier = this.calculateOSG(
      inputs.countries,
      inputs.entities,
      inputs.languages,
      inputs.peakSessions
    );
    const osgEffort = Math.round(bce * sbMultiplier * pcMultiplier * (osgMultiplier - 1));

    // 5. Core effort (before wrapper)
    const coreEffort = Math.round(bce * sbMultiplier * pcMultiplier * osgMultiplier);

    // 6. Factory Wrapper (scales slightly with scope)
    const fw = this.calculateFW(sbMultiplier, inputs.countries);

    // 7. Total effort
    const totalEffort = coreEffort + fw;

    // 8. Derived metrics
    const duration = this.calculateDuration(totalEffort);
    const fte = RESOURCE_ASSUMPTIONS.fteDefault;
    const cost = this.calculateCost(totalEffort, RESOURCE_ASSUMPTIONS.defaultRegion);

    // 9. Justification
    const description = this.generateDescription(inputs);
    const confidence = this.calculateConfidence(inputs);

    return {
      bce,
      sbEffort,
      pcEffort,
      osgEffort,
      fw,
      sbMultiplier,
      pcMultiplier,
      osgMultiplier,
      coreEffort,
      totalEffort,
      duration,
      fte,
      cost,
      description,
      confidence
    };
  }

  /**
   * Calculate Scope Breadth (SB) multiplier
   * SB = modules + L3 items + integrations
   */
  calculateSB(
    modules: string[],
    l3Items: L3Item[],
    integrations: number
  ): number {
    let sb = 0;

    // Module additions (beyond baseline FI+CO)
    const baselineModules = ['FI', 'CO'];
    const extraModules = modules.filter(m => !baselineModules.includes(m));
    sb += extraModules.length * 0.03; // +3% per extra module

    // L3 items by tier
    const l3Contribution = l3Items.reduce((sum, item) => {
      return sum + item.coefficient;
    }, 0);
    sb += l3Contribution;

    // Integrations
    sb += integrations * 0.03; // +3% per integration

    return 1 + sb; // Return as multiplier (1 + SB)
  }

  /**
   * Calculate Process Complexity (PC) multiplier
   * PC = in-app extensions + BTP extensions
   */
  calculatePC(inAppExtensions: number, btpExtensions: number): number {
    let pc = 0;

    pc += inAppExtensions * EXTENSION_COEFFICIENTS.inApp;
    pc += btpExtensions * EXTENSION_COEFFICIENTS.btp;

    return 1 + pc; // Return as multiplier (1 + PC)
  }

  /**
   * Calculate Org Scale & Geography (OSG) multiplier
   * OSG = countries + entities + languages + sessions
   */
  calculateOSG(
    countries: number,
    entities: number,
    languages: number,
    peakSessions: number
  ): number {
    let osg = 0;

    // Additional countries (first country is baseline)
    if (countries > 1) {
      osg += (countries - 1) * GEOGRAPHY_COEFFICIENTS.countryBase;
    }

    // Additional entities
    if (entities > 1) {
      osg += (entities - 1) * GEOGRAPHY_COEFFICIENTS.entityBase;
    }

    // Additional languages
    if (languages > 1) {
      osg += (languages - 1) * GEOGRAPHY_COEFFICIENTS.languageBase;
    }

    // Peak sessions (per 100 users)
    if (peakSessions > 100) {
      osg += Math.floor(peakSessions / 100) * GEOGRAPHY_COEFFICIENTS.sessionBase;
    }

    return 1 + osg; // Return as multiplier (1 + OSG)
  }

  /**
   * Calculate Factory Wrapper
   * Scales slightly with scope and geography
   */
  calculateFW(sbMultiplier: number, countries: number): number {
    let fw = FACTORY_WRAPPER_BASE;

    // Scale up slightly for large scope
    if (sbMultiplier > 1.2) {
      fw = Math.round(fw * 1.1); // +10% for complex scope
    }

    // Scale up for multi-country
    if (countries > 2) {
      fw = Math.round(fw * 1.15); // +15% for 3+ countries
    }

    return fw;
  }

  /**
   * Calculate duration (weeks and months)
   */
  calculateDuration(totalEffort: number): { weeks: number; months: number } {
    const { fteDefault, workDaysPerMonth, bufferPercent } = RESOURCE_ASSUMPTIONS;

    // Nominal duration
    const nominalMonths = totalEffort / (fteDefault * workDaysPerMonth);

    // With buffer
    const paddedMonths = nominalMonths * (1 + bufferPercent);

    return {
      weeks: Math.ceil(paddedMonths * 4.33), // 4.33 weeks per month
      months: Math.round(paddedMonths * 10) / 10 // Round to 1 decimal
    };
  }

  /**
   * Calculate cost
   */
  calculateCost(
    totalEffort: number,
    region: keyof typeof RESOURCE_ASSUMPTIONS.ratesByRegion
  ): { currency: string; amount: number } {
    const rate = RESOURCE_ASSUMPTIONS.ratesByRegion[region];
    const amount = Math.round(totalEffort * rate);

    const currencies = {
      ABMY: 'RM',
      ABSG: 'SGD',
      ABVN: 'USD'
    };

    return {
      currency: currencies[region],
      amount
    };
  }

  /**
   * Generate human-readable description
   */
  generateDescription(inputs: EstimatorInputs): string {
    const parts: string[] = [];

    // Base description from profile
    parts.push(inputs.profile.description);

    // Integrations
    if (inputs.integrations > 0) {
      parts.push(`${inputs.integrations} integration${inputs.integrations > 1 ? 's' : ''}`);
    }

    // Extensions
    const totalExt = inputs.inAppExtensions + inputs.btpExtensions;
    if (totalExt > 0) {
      parts.push(`${totalExt} custom extension${totalExt > 1 ? 's' : ''}`);
    }

    // Geography
    if (inputs.countries > 1) {
      parts.push(`${inputs.countries} countries`);
    }

    return parts.join(' • ');
  }

  /**
   * Calculate confidence score (0-100)
   * Based on data completeness and risk factors
   */
  calculateConfidence(inputs: EstimatorInputs): number {
    let confidence = 100;

    // Reduce for high complexity
    if (inputs.profile.complexity >= 4) {
      confidence -= 10;
    }

    // Reduce for many integrations
    if (inputs.integrations > 3) {
      confidence -= 5;
    }

    // Reduce for BTP extensions (higher risk)
    if (inputs.btpExtensions > 0) {
      confidence -= 10;
    }

    // Reduce for multi-country
    if (inputs.countries > 2) {
      confidence -= 5;
    }

    // Reduce if no L3 items (less detailed scope)
    if (inputs.l3Items.length === 0) {
      confidence -= 15;
    }

    return Math.max(confidence, 50); // Minimum 50%
  }
}

// Export singleton instance
export const formulaEngine = new FormulaEngine();
