import { SAPModule } from '@/data/sap-modules-complete';

export interface CalculationContext {
  modules: string[];
  clientProfile: {
    size: 'small' | 'medium' | 'large' | 'enterprise';
    complexity: 'standard' | 'complex' | 'extreme';
    maturity: 'naive' | 'basic' | 'intermediate' | 'advanced';
    industry: string;
    region: string;
    employees: number;
    annualRevenue: number;
  };
  constraints?: {
    maxBudget?: number;
    deadline?: Date;
    maxResources?: number;
  };
  assumptions: string[];
  risks: Risk[];
}

export interface Risk {
  id: string;
  category: 'technical' | 'business' | 'resource' | 'timeline';
  probability: number; // 0-1
  impact: number; // 1-5
  mitigation?: string;
}

export interface EffortBreakdown {
  baseEffort: number;
  complexityMultiplier: number;
  sizeMultiplier: number;
  maturityMultiplier: number;
  industryMultiplier: number;
  riskBuffer: number;
  totalEffort: number;
  confidence: number;
  breakdown: {
    phase: string;
    stream: string;
    effort: number;
    resources: number;
    duration: number;
  }[];
}

export class EffortCalculator {
  private readonly SAP_ACTIVATE_PHASES = {
    'Prepare': 0.05,
    'Explore': 0.20,
    'Realize': 0.45,
    'Deploy': 0.20,
    'Run': 0.10
  };

  private readonly COMPLEXITY_MULTIPLIERS = {
    standard: 1.0,
    complex: 1.3,
    extreme: 1.6
  };

  private readonly SIZE_MULTIPLIERS = {
    small: 0.8,    // <200 employees
    medium: 1.0,   // 200-1000 employees
    large: 1.2,    // 1000-5000 employees
    enterprise: 1.5 // >5000 employees
  };

  private readonly MATURITY_MULTIPLIERS = {
    naive: 1.4,      // No ERP experience
    basic: 1.2,      // Some systems experience
    intermediate: 1.0, // Previous ERP
    advanced: 0.9     // Multiple implementations
  };

  private readonly INDUSTRY_MULTIPLIERS: Record<string, number> = {
    'manufacturing': 1.0,
    'retail': 0.9,
    'banking': 1.3,
    'healthcare': 1.2,
    'government': 1.4,
    'technology': 0.8,
    'default': 1.0
  };

  calculate(context: CalculationContext): EffortBreakdown {
    // Step 1: Calculate base effort from modules
    const baseEffort = this.calculateBaseEffort(context.modules);

    // Step 2: Apply multipliers
    const complexityMultiplier = this.COMPLEXITY_MULTIPLIERS[context.clientProfile.complexity];
    const sizeMultiplier = this.SIZE_MULTIPLIERS[context.clientProfile.size];
    const maturityMultiplier = this.MATURITY_MULTIPLIERS[context.clientProfile.maturity];
    const industryMultiplier = this.INDUSTRY_MULTIPLIERS[context.clientProfile.industry] || 
                               this.INDUSTRY_MULTIPLIERS.default;

    // Step 3: Calculate risk buffer
    const riskBuffer = this.calculateRiskBuffer(context.risks);

    // Step 4: Calculate total effort
    const adjustedEffort = baseEffort * 
                          complexityMultiplier * 
                          sizeMultiplier * 
                          maturityMultiplier * 
                          industryMultiplier;
    
    const totalEffort = adjustedEffort * (1 + riskBuffer);

    // Step 5: Distribute across phases
    const breakdown = this.distributeEffortAcrossPhases(
      totalEffort, 
      context.modules,
      context.clientProfile
    );

    // Step 6: Calculate confidence
    const confidence = this.calculateConfidence(context);

    return {
      baseEffort,
      complexityMultiplier,
      sizeMultiplier,
      maturityMultiplier,
      industryMultiplier,
      riskBuffer,
      totalEffort: Math.round(totalEffort),
      confidence,
      breakdown
    };
  }

  private calculateBaseEffort(modules: string[]): number {
    // This would connect to the full module registry
    // For now, simplified calculation
    const effortPerModule = 40; // Average person-days per module
    return modules.length * effortPerModule;
  }

  private calculateRiskBuffer(risks: Risk[]): number {
    if (!risks || risks.length === 0) return 0.1; // Default 10% buffer

    const totalRiskScore = risks.reduce((sum, risk) => {
      return sum + (risk.probability * risk.impact);
    }, 0);

    // Convert to percentage (max 50% buffer)
    return Math.min(0.5, totalRiskScore / (risks.length * 5));
  }

  private distributeEffortAcrossPhases(
    totalEffort: number, 
    modules: string[],
    profile: CalculationContext['clientProfile']
  ): EffortBreakdown['breakdown'] {
    const breakdown: EffortBreakdown['breakdown'] = [];

    Object.entries(this.SAP_ACTIVATE_PHASES).forEach(([phase, percentage]) => {
      const phaseEffort = Math.round(totalEffort * percentage);
      
      // Distribute across streams based on modules
      const streams = this.identifyStreams(modules);
      
      streams.forEach(stream => {
        const streamEffort = Math.round(phaseEffort / streams.length);
        const resources = this.calculateOptimalResources(streamEffort, phase, profile);
        const duration = Math.round(streamEffort / (resources * 0.75)); // 75% efficiency

        breakdown.push({
          phase,
          stream,
          effort: streamEffort,
          resources,
          duration
        });
      });
    });

    return breakdown;
  }

  private identifyStreams(modules: string[]): string[] {
    const streams = new Set<string>();
    
    modules.forEach(module => {
      if (module.startsWith('Finance')) streams.add('Core Finance');
      else if (module.startsWith('SCM')) streams.add('Supply Chain');
      else if (module.startsWith('HCM')) streams.add('Human Capital');
      else if (module.startsWith('Technical')) streams.add('Technical');
      else streams.add('Other');
    });

    return Array.from(streams);
  }

  private calculateOptimalResources(effort: number, phase: string, profile: any): number {
    // Optimal team size varies by phase
    const optimalTeamSizes: Record<string, number> = {
      'Prepare': 3,
      'Explore': 5,
      'Realize': 8,
      'Deploy': 6,
      'Run': 2
    };

    let optimal = optimalTeamSizes[phase] || 5;

    // Adjust for company size
    if (profile.size === 'enterprise') optimal *= 1.5;
    if (profile.size === 'small') optimal *= 0.7;

    return Math.round(optimal);
  }

  private calculateConfidence(context: CalculationContext): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on data completeness
    if (context.modules.length > 0) confidence += 0.1;
    if (context.clientProfile.employees > 0) confidence += 0.1;
    if (context.clientProfile.annualRevenue > 0) confidence += 0.1;
    if (context.assumptions.length > 5) confidence += 0.1;
    if (context.risks.length > 3) confidence += 0.1;

    return Math.min(0.95, confidence);
  }
}

// Export singleton instance
export const effortCalculator = new EffortCalculator();