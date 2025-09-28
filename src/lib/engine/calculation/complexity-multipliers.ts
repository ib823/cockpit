export interface ComplexityFactors {
  dataVolume: 'low' | 'medium' | 'high' | 'extreme';
  integrationPoints: number;
  customizationLevel: number; // 0-100%
  regulatoryRequirements: string[];
  geographicSpread: number; // number of countries
  languageRequirements: string[];
  businessProcessVariants: number;
  legacySystemCount: number;
}

export class ComplexityAnalyzer {
  private readonly DATA_VOLUME_MULTIPLIERS = {
    low: 0.8,      // <1M records
    medium: 1.0,   // 1-10M records
    high: 1.3,     // 10-100M records
    extreme: 1.6   // >100M records
  };

  private readonly INTEGRATION_COMPLEXITY = {
    simple: 1.0,    // REST/file based
    moderate: 1.2,  // Real-time sync
    complex: 1.4,   // Bi-directional
    extreme: 1.6    // Multi-system orchestration
  };

  calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 1.0;

    // Data volume impact
    score *= this.DATA_VOLUME_MULTIPLIERS[factors.dataVolume];

    // Integration complexity
    if (factors.integrationPoints <= 2) score *= 1.0;
    else if (factors.integrationPoints <= 5) score *= 1.2;
    else if (factors.integrationPoints <= 10) score *= 1.4;
    else score *= 1.6;

    // Customization impact
    score *= (1 + factors.customizationLevel / 100);

    // Regulatory complexity
    if (factors.regulatoryRequirements.length > 5) score *= 1.3;
    else if (factors.regulatoryRequirements.length > 2) score *= 1.15;

    // Geographic complexity
    if (factors.geographicSpread > 5) score *= 1.25;
    else if (factors.geographicSpread > 2) score *= 1.1;

    // Language complexity
    if (factors.languageRequirements.length > 5) score *= 1.2;
    else if (factors.languageRequirements.length > 2) score *= 1.1;

    // Process variant complexity
    if (factors.businessProcessVariants > 10) score *= 1.3;
    else if (factors.businessProcessVariants > 5) score *= 1.15;

    // Legacy system migration
    score *= (1 + factors.legacySystemCount * 0.1);

    return Math.min(3.0, score); // Cap at 3x
  }

  identifyComplexityDrivers(factors: ComplexityFactors): string[] {
    const drivers: string[] = [];

    if (factors.dataVolume === 'extreme' || factors.dataVolume === 'high') {
      drivers.push(`High data volume (${factors.dataVolume})`);
    }

    if (factors.integrationPoints > 5) {
      drivers.push(`Complex integrations (${factors.integrationPoints} systems)`);
    }

    if (factors.customizationLevel > 30) {
      drivers.push(`High customization (${factors.customizationLevel}%)`);
    }

    if (factors.regulatoryRequirements.length > 2) {
      drivers.push(`Multiple compliance requirements (${factors.regulatoryRequirements.join(', ')})`);
    }

    if (factors.geographicSpread > 2) {
      drivers.push(`Multi-country rollout (${factors.geographicSpread} countries)`);
    }

    if (factors.legacySystemCount > 2) {
      drivers.push(`Multiple legacy migrations (${factors.legacySystemCount} systems)`);
    }

    return drivers;
  }
}