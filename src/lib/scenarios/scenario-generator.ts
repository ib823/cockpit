export interface Scenario {
  id: string;
  name: string;
  type: 'best' | 'likely' | 'worst';
  effort: number;
  duration: number;
  cost: number;
  confidence: number;
  assumptions: string[];
  risks: any[];
  probability: number;
}

export class ScenarioGenerator {
  generateScenarios(baseCalculation: any): Scenario[] {
    const scenarios: Scenario[] = [];

    // Best case scenario
    scenarios.push(this.generateBestCase(baseCalculation));
    
    // Likely case scenario
    scenarios.push(this.generateLikelyCase(baseCalculation));
    
    // Worst case scenario
    scenarios.push(this.generateWorstCase(baseCalculation));

    return scenarios;
  }

  private generateBestCase(base: any): Scenario {
    return {
      id: `scenario_best_${Date.now()}`,
      name: 'Best Case',
      type: 'best',
      effort: Math.round(base.effort * 0.8),
      duration: Math.round(base.duration * 0.85),
      cost: Math.round(base.cost * 0.75),
      confidence: 0.3,
      assumptions: [
        'All key resources available immediately',
        'No major customizations required',
        'Excellent user adoption',
        'No significant data issues'
      ],
      risks: [],
      probability: 0.2
    };
  }

  private generateLikelyCase(base: any): Scenario {
    return {
      id: `scenario_likely_${Date.now()}`,
      name: 'Most Likely',
      type: 'likely',
      effort: base.effort,
      duration: base.duration,
      cost: base.cost,
      confidence: 0.7,
      assumptions: [
        'Normal resource availability',
        'Standard customizations',
        'Typical change management challenges',
        'Some data cleansing required'
      ],
      risks: base.risks || [],
      probability: 0.6
    };
  }

  private generateWorstCase(base: any): Scenario {
    return {
      id: `scenario_worst_${Date.now()}`,
      name: 'Worst Case',
      type: 'worst',
      effort: Math.round(base.effort * 1.4),
      duration: Math.round(base.duration * 1.3),
      cost: Math.round(base.cost * 1.5),
      confidence: 0.3,
      assumptions: [
        'Resource constraints',
        'Significant customizations needed',
        'Major resistance to change',
        'Extensive data migration issues'
      ],
      risks: [
        ...base.risks,
        { description: 'Scope creep', impact: 'high' },
        { description: 'Key resource turnover', impact: 'high' }
      ],
      probability: 0.2
    };
  }
}