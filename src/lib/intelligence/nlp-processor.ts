import { Chip } from '@/types/core';
import { ALL_SAP_MODULES } from '@/data/modules/all-modules';

export interface ProcessedIntent {
  primaryIntent: 'implement' | 'upgrade' | 'migrate' | 'optimize' | 'assess';
  modules: string[];
  constraints: {
    timeline?: { value: number; unit: 'days' | 'weeks' | 'months' };
    budget?: { value: number; currency: string };
    resources?: number;
  };
  context: {
    urgency: 'low' | 'medium' | 'high' | 'critical';
    maturity: 'greenfield' | 'brownfield' | 'hybrid';
    scope: 'pilot' | 'phased' | 'bigbang' | 'rollout';
  };
  confidence: number;
}

export class NLPProcessor {
  private moduleKeywords: Map<string, string[]> = new Map();
  
  constructor() {
    this.buildModuleKeywordMap();
  }

  private buildModuleKeywordMap() {
    Object.entries(ALL_SAP_MODULES).forEach(([id, module]) => {
      const keywords = this.extractKeywords(module.name + ' ' + module.description);
      this.moduleKeywords.set(id, keywords);
    });
  }

  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['with', 'from', 'that', 'this', 'have'].includes(word));
  }

  processText(text: string, chips: Chip[]): ProcessedIntent {
    const normalizedText = text.toLowerCase();
    
    // Detect primary intent
    const primaryIntent = this.detectIntent(normalizedText);
    
    // Extract modules mentioned
    const modules = this.extractModules(normalizedText, chips);
    
    // Extract constraints
    const constraints = this.extractConstraints(normalizedText, chips);
    
    // Analyze context
    const context = this.analyzeContext(normalizedText, chips);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(modules, constraints, context);
    
    return {
      primaryIntent,
      modules,
      constraints,
      context,
      confidence
    };
  }

  private detectIntent(text: string): ProcessedIntent['primaryIntent'] {
    const intents = {
      implement: ['implement', 'deploy', 'rollout', 'install', 'setup'],
      upgrade: ['upgrade', 'update', 'enhance', 'modernize'],
      migrate: ['migrate', 'move', 'transition', 'convert'],
      optimize: ['optimize', 'improve', 'streamline', 'enhance performance'],
      assess: ['assess', 'evaluate', 'analyze', 'study', 'review']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return intent as ProcessedIntent['primaryIntent'];
      }
    }
    
    return 'implement'; // default
  }

  private extractModules(text: string, chips: Chip[]): string[] {
    const detectedModules = new Set<string>();
    
    // Check for explicit module mentions
    Object.entries(ALL_SAP_MODULES).forEach(([id, module]) => {
      const keywords = this.moduleKeywords.get(id) || [];
      const matchCount = keywords.filter(keyword => text.includes(keyword)).length;
      
      if (matchCount >= 2) { // At least 2 keyword matches
        detectedModules.add(id);
      }
    });
    
    // Check chips for module information
    chips.forEach(chip => {
      const chipKind = (chip as any).kind;
    const chipType = (chip as any).type;
    if (chipKind === 'modules' || chipType === 'modules') {
        const moduleValue = (chip as any).raw || chip.value;
        if (typeof moduleValue === 'string') {
          const normalized = moduleValue.toLowerCase();
          
          if (normalized.includes('finance')) {
            detectedModules.add('Finance_1');
            detectedModules.add('Finance_3');
            detectedModules.add('Finance_5');
          }
          if (normalized.includes('hr') || normalized.includes('human')) {
            detectedModules.add('HCM_1');
            detectedModules.add('HCM_2');
          }
          if (normalized.includes('supply') || normalized.includes('scm')) {
            detectedModules.add('SCM_1');
            detectedModules.add('SCM_6');
          }
          if (normalized.includes('procurement') || normalized.includes('purchasing')) {
            detectedModules.add('Procurement_4');
          }
          if (normalized.includes('sales') || normalized.includes('customer')) {
            detectedModules.add('CX_1');
          }
        }
      }
    });
    
    return Array.from(detectedModules);
  }

  private extractConstraints(text: string, chips: Chip[]): ProcessedIntent['constraints'] {
    const constraints: ProcessedIntent['constraints'] = {};
    
    // Timeline extraction
    const timelineMatch = text.match(/(\d+)\s*(days?|weeks?|months?)/i);
    if (timelineMatch) {
      constraints.timeline = {
        value: parseInt(timelineMatch[1]),
        unit: timelineMatch[2].replace(/s$/, '') as any
      };
    }
    
    // Budget extraction
    const budgetMatch = text.match(/([\d,]+)\s*(k|m|million)?\s*(usd|myr|sgd)/i);
    if (budgetMatch) {
      let value = parseFloat(budgetMatch[1].replace(/,/g, ''));
      if (budgetMatch[2]?.toLowerCase() === 'k') value *= 1000;
      if (budgetMatch[2]?.toLowerCase() === 'm' || budgetMatch[2]?.toLowerCase() === 'million') value *= 1000000;
      
      constraints.budget = {
        value,
        currency: (budgetMatch[3] || 'USD').toUpperCase()
      };
    }
    
    // Resource constraints from chips
    chips.forEach(chip => {
      if ((chip as any).kind === 'employees' || chip.type === 'employees') {
        const value = parseInt((chip as any).raw || chip.value);
        if (!isNaN(value)) {
          constraints.resources = Math.floor(value / 50); // Rough estimate of project team size
        }
      }
    });
    
    return constraints;
  }

  private analyzeContext(text: string, chips: Chip[]): ProcessedIntent['context'] {
    // Urgency detection
    let urgency: ProcessedIntent['context']['urgency'] = 'medium';
    if (text.includes('urgent') || text.includes('asap') || text.includes('immediate')) {
      urgency = 'critical';
    } else if (text.includes('soon') || text.includes('quickly')) {
      urgency = 'high';
    } else if (text.includes('eventually') || text.includes('future')) {
      urgency = 'low';
    }
    
    // Maturity detection
    let maturity: ProcessedIntent['context']['maturity'] = 'greenfield';
    if (text.includes('existing') || text.includes('current') || text.includes('legacy')) {
      maturity = 'brownfield';
    } else if (text.includes('partial') || text.includes('some modules')) {
      maturity = 'hybrid';
    }
    
    // Scope detection
    let scope: ProcessedIntent['context']['scope'] = 'bigbang';
    if (text.includes('pilot') || text.includes('proof of concept') || text.includes('poc')) {
      scope = 'pilot';
    } else if (text.includes('phase') || text.includes('gradual') || text.includes('step')) {
      scope = 'phased';
    } else if (text.includes('rollout') || text.includes('multiple sites')) {
      scope = 'rollout';
    }
    
    return { urgency, maturity, scope };
  }

  private calculateConfidence(
    modules: string[],
    constraints: ProcessedIntent['constraints'],
    context: ProcessedIntent['context']
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on information completeness
    if (modules.length > 0) confidence += 0.1;
    if (modules.length > 3) confidence += 0.1;
    if (constraints.timeline) confidence += 0.1;
    if (constraints.budget) confidence += 0.1;
    if (context.urgency !== 'medium') confidence += 0.05;
    if (context.scope !== 'bigbang') confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }
}