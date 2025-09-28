import { ALL_SAP_MODULES } from '@/data/modules/all-modules';

export interface RiskFactor {
  id: string;
  category: 'technical' | 'business' | 'resource' | 'timeline' | 'integration';
  description: string;
  probability: number; // 0-1
  impact: number; // 1-5
  mitigation: string;
  trigger?: string;
  owner?: string;
}

export class RiskAnalyzer {
  analyzeRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Technical risks
    risks.push(...this.analyzeTechnicalRisks(context));
    
    // Business risks
    risks.push(...this.analyzeBusinessRisks(context));
    
    // Resource risks
    risks.push(...this.analyzeResourceRisks(context));
    
    // Timeline risks
    risks.push(...this.analyzeTimelineRisks(context));
    
    // Integration risks
    risks.push(...this.analyzeIntegrationRisks(context));
    
    return this.prioritizeRisks(risks);
  }

  private analyzeTechnicalRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    if (context.modules?.length > 10) {
      risks.push({
        id: 'tech_complexity',
        category: 'technical',
        description: 'High technical complexity due to multiple module dependencies',
        probability: 0.7,
        impact: 4,
        mitigation: 'Implement modules in waves with thorough integration testing',
        trigger: 'More than 10 modules selected',
        owner: 'Technical Architect'
      });
    }
    
    if (context.integrations?.length > 5) {
      risks.push({
        id: 'integration_complexity',
        category: 'technical',
        description: 'Complex integration landscape may cause delays',
        probability: 0.8,
        impact: 4,
        mitigation: 'Create integration proof of concepts early',
        trigger: 'Multiple system integrations required',
        owner: 'Integration Lead'
      });
    }
    
    if (context.customization > 30) {
      risks.push({
        id: 'customization_debt',
        category: 'technical',
        description: 'High customization increases technical debt',
        probability: 0.9,
        impact: 3,
        mitigation: 'Document all customizations and plan for standard adoption',
        trigger: 'Customization exceeds 30%',
        owner: 'Development Lead'
      });
    }
    
    return risks;
  }

  private analyzeBusinessRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    if (context.changeReadiness < 0.5) {
      risks.push({
        id: 'change_resistance',
        category: 'business',
        description: 'Organizational resistance to change',
        probability: 0.8,
        impact: 5,
        mitigation: 'Implement comprehensive change management program',
        trigger: 'Low change readiness score',
        owner: 'Change Management Lead'
      });
    }
    
    if (!context.executiveSponsor) {
      risks.push({
        id: 'sponsorship_gap',
        category: 'business',
        description: 'Lack of executive sponsorship',
        probability: 0.7,
        impact: 5,
        mitigation: 'Secure C-level sponsor before project start',
        trigger: 'No identified executive sponsor',
        owner: 'Project Manager'
      });
    }
    
    if (context.processMaturity === 'low') {
      risks.push({
        id: 'process_gaps',
        category: 'business',
        description: 'Immature business processes',
        probability: 0.6,
        impact: 4,
        mitigation: 'Conduct process optimization before system implementation',
        trigger: 'Low process maturity assessment',
        owner: 'Business Analyst'
      });
    }
    
    return risks;
  }

  private analyzeResourceRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    if (context.teamSize < context.requiredTeamSize * 0.7) {
      risks.push({
        id: 'resource_shortage',
        category: 'resource',
        description: 'Insufficient resources allocated',
        probability: 0.9,
        impact: 4,
        mitigation: 'Secure additional resources or adjust timeline',
        trigger: 'Team size below 70% of requirement',
        owner: 'Resource Manager'
      });
    }
    
    if (context.keyPersonDependency > 0.3) {
      risks.push({
        id: 'key_person_risk',
        category: 'resource',
        description: 'Over-reliance on key individuals',
        probability: 0.5,
        impact: 5,
        mitigation: 'Implement knowledge transfer and backup resources',
        trigger: 'Single person owns >30% of critical knowledge',
        owner: 'Project Manager'
      });
    }
    
    if (!context.trainingPlan) {
      risks.push({
        id: 'skill_gap',
        category: 'resource',
        description: 'Team lacks required skills',
        probability: 0.7,
        impact: 3,
        mitigation: 'Develop comprehensive training plan',
        trigger: 'No training plan defined',
        owner: 'HR Manager'
      });
    }
    
    return risks;
  }

  private analyzeTimelineRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    if (context.timeline?.aggressive) {
      risks.push({
        id: 'aggressive_timeline',
        category: 'timeline',
        description: 'Timeline is aggressive for scope',
        probability: 0.8,
        impact: 4,
        mitigation: 'Build buffer time and identify fast-track opportunities',
        trigger: 'Timeline compressed by >20%',
        owner: 'Project Manager'
      });
    }
    
    if (context.dependencies?.external > 3) {
      risks.push({
        id: 'external_dependencies',
        category: 'timeline',
        description: 'Multiple external dependencies',
        probability: 0.6,
        impact: 3,
        mitigation: 'Create contingency plans for each dependency',
        trigger: 'More than 3 external dependencies',
        owner: 'Project Manager'
      });
    }
    
    if (context.goLive?.blackoutDates) {
      risks.push({
        id: 'blackout_periods',
        category: 'timeline',
        description: 'Go-live constrained by blackout periods',
        probability: 0.4,
        impact: 3,
        mitigation: 'Plan around blackout dates with adequate buffer',
        trigger: 'Blackout periods identified',
        owner: 'Project Manager'
      });
    }
    
    return risks;
  }

  private analyzeIntegrationRisks(context: any): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    if (context.dataQuality < 0.7) {
      risks.push({
        id: 'data_quality',
        category: 'integration',
        description: 'Poor data quality in source systems',
        probability: 0.9,
        impact: 5,
        mitigation: 'Implement data cleansing project before migration',
        trigger: 'Data quality score below 70%',
        owner: 'Data Manager'
      });
    }
    
    if (context.interfaces?.realtime > 5) {
      risks.push({
        id: 'realtime_interfaces',
        category: 'integration',
        description: 'Complex real-time integration requirements',
        probability: 0.7,
        impact: 4,
        mitigation: 'Design robust error handling and retry mechanisms',
        trigger: 'More than 5 real-time interfaces',
        owner: 'Integration Architect'
      });
    }
    
    if (context.legacySystems?.count > 2) {
      risks.push({
        id: 'legacy_retirement',
        category: 'integration',
        description: 'Legacy system retirement complexity',
        probability: 0.6,
        impact: 3,
        mitigation: 'Phase legacy retirement post-stabilization',
        trigger: 'Multiple legacy systems to retire',
        owner: 'IT Manager'
      });
    }
    
    return risks;
  }

  private prioritizeRisks(risks: RiskFactor[]): RiskFactor[] {
    return risks.sort((a, b) => {
      const scoreA = a.probability * a.impact;
      const scoreB = b.probability * b.impact;
      return scoreB - scoreA;
    });
  }

  calculateRiskScore(risks: RiskFactor[]): number {
    if (risks.length === 0) return 0;
    
    const totalScore = risks.reduce((sum, risk) => {
      return sum + (risk.probability * risk.impact);
    }, 0);
    
    const maxPossibleScore = risks.length * 5; // Max impact is 5
    return totalScore / maxPossibleScore;
  }

  generateRiskMatrix(risks: RiskFactor[]): any {
    const matrix = {
      high: { high: [], medium: [], low: [] },
      medium: { high: [], medium: [], low: [] },
      low: { high: [], medium: [], low: [] }
    };
    
    risks.forEach(risk => {
      const probabilityLevel = risk.probability > 0.7 ? 'high' : 
                              risk.probability > 0.4 ? 'medium' : 'low';
      const impactLevel = risk.impact > 3 ? 'high' : 
                         risk.impact > 2 ? 'medium' : 'low';
      
      matrix[probabilityLevel][impactLevel].push(risk);
    });
    
    return matrix;
  }
}