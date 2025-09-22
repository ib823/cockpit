// Baseline Scenario Generator - Creates initial project plan from chips and decisions
import { Chip, Decision, ScenarioPlan, Phase, ClientProfile } from '@/types/core';
import { SAP_PACKAGES, getAllDependencies, calculateTotalEffort } from './sap-packages';
import { getDefaultTeamComposition } from './rate-cards';
import { summarizeChips } from './chip-parser';

// SAP Activate methodology phases
const SAP_ACTIVATE_DISTRIBUTION = {
  'Prepare': 0.05,
  'Explore': 0.20,
  'Realize': 0.45,
  'Deploy': 0.20,
  'Run': 0.10,
};

// Stream definitions for organizing work
const STREAMS = {
  'Core Finance': ['Finance_1', 'Finance_3'],
  'Human Capital': ['HCM_1'],
  'Supply Chain': ['SCM_1'],
  'Technical': ['Technical_2'],
  'Compliance': ['Compliance_MY'],
};

// Generate baseline scenario from chips and decisions
export function generateBaselineScenario(
  chips: Chip[],
  decisions: Decision[]
): ScenarioPlan {
  // Extract key information from chips
  const clientProfile = extractClientProfile(chips);
  const selectedPackages = determinePackages(chips, decisions);
  const timeline = extractTimeline(chips);
  
  // Calculate total effort
  const totalEffort = calculateProjectEffort(selectedPackages, clientProfile);
  
  // Generate phases
  const phases = generatePhases(
    selectedPackages,
    totalEffort,
    timeline,
    clientProfile
  );
  
  // Calculate totals
  const totals = calculateTotals(phases, clientProfile);
  
  // Generate assumptions
  const assumptions = generateAssumptions(chips, decisions, clientProfile);
  
  // Identify risks
  const risks = identifyRisks(chips, decisions, selectedPackages);
  
  return {
    id: `scenario_${Date.now()}`,
    name: 'Baseline',
    phases,
    totals,
    assumptions,
    risks,
  };
}

// Extract client profile from chips
function extractClientProfile(chips: Chip[]): ClientProfile {
  const summary = summarizeChips(chips);
  
  // Extract company size from employee count
  let size: ClientProfile['size'] = 'medium';
  const employeeChip = summary.users?.[0] || summary.employees?.[0];
  if (employeeChip && typeof employeeChip.parsed.value === 'number') {
    const employees = employeeChip.parsed.value;
    if (employees < 200) size = 'small';
    else if (employees < 1000) size = 'medium';
    else if (employees < 5000) size = 'large';
    else size = 'enterprise';
  }
  
  // Extract region
  const region = summary.country?.[0]?.parsed.value || 'Malaysia';
  
  // Extract industry
  const industry = summary.industry?.[0]?.parsed.value || 'General';
  
  // Determine complexity based on various factors
  let complexity: ClientProfile['complexity'] = 'standard';
  if (summary.integration && summary.integration.length > 2) complexity = 'complex';
  if (summary.compliance && summary.compliance.length > 1) complexity = 'complex';
  if (size === 'enterprise') complexity = 'extreme';
  
  // Determine maturity
  const maturity: ClientProfile['maturity'] = 
    summary.existing_system ? 'intermediate' : 'basic';
  
  return {
    companyName: 'Client Company',
    industry: industry as string,
    size,
    employees: (employeeChip?.parsed.value as number) || 500,
    annualRevenue: (summary.revenue?.[0]?.parsed.value as number) || 0,
    region: region as string,
    complexity,
    maturity,
  };
}
// Determine packages based on chips and decisions
function determinePackages(chips: Chip[], decisions: Decision[]): string[] {
  const packages: Set<string> = new Set();
  const summary = summarizeChips(chips);
  
  // Check module decision
  const moduleDecision = decisions.find(d => d.type === 'module_combo');
  if (moduleDecision) {
    switch (moduleDecision.selected) {
      case 'finance_only':
        packages.add('Finance_1');
        packages.add('Finance_3');
        break;
      case 'finance_hr':
        packages.add('Finance_1');
        packages.add('Finance_3');
        packages.add('HCM_1');
        break;
      case 'finance_scm':
        packages.add('Finance_1');
        packages.add('Finance_3');
        packages.add('SCM_1');
        break;
      case 'full_suite':
        packages.add('Finance_1');
        packages.add('Finance_3');
        packages.add('HCM_1');
        packages.add('SCM_1');
        break;
    }
  } else {
    // Default based on module chips
    if (summary.modules) {
      summary.modules.forEach(chip => {
        const module = chip.raw.toLowerCase();
        if (module.includes('finance') || module.includes('fi')) {
          packages.add('Finance_1');
          packages.add('Finance_3');
        }
        if (module.includes('hr') || module.includes('hcm')) {
          packages.add('HCM_1');
        }
        if (module.includes('supply') || module.includes('scm')) {
          packages.add('SCM_1');
        }
      });
    }
  }
  
  // Add compliance if needed
  if (summary.compliance) {
    const region = summary.country?.[0]?.parsed.value;
    if (region === 'Malaysia') packages.add('Compliance_MY');
  }
  
  // Add technical components
  packages.add('Technical_2'); // Data migration is usually needed
  
  // Add all dependencies
  const allPackages = Array.from(packages);
  const dependencies = getAllDependencies(allPackages);
  dependencies.forEach(dep => packages.add(dep));
  
  return Array.from(packages);
}

// Extract timeline from chips
function extractTimeline(chips: Chip[]): { startDate: Date; endDate: Date } {
  const summary = summarizeChips(chips);
  const now = new Date();
  
  // Default 6-month project
  let duration = 6;
  
  if (summary.timeline && summary.timeline.length > 0) {
    const timelineChip = summary.timeline[0];
    if (timelineChip.parsed.unit === 'months' && typeof timelineChip.parsed.value === 'number') {
      duration = timelineChip.parsed.value;
    } else if (timelineChip.parsed.unit === 'weeks' && typeof timelineChip.parsed.value === 'number') {
      duration = timelineChip.parsed.value / 4;
    }
  }
  
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 30); // Start in 1 month
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + duration);
  
  return { startDate, endDate };
}

// Calculate total project effort
function calculateProjectEffort(
  packages: string[],
  profile: ClientProfile
): number {
  const baseEffort = calculateTotalEffort(packages);
  
  // Apply complexity multipliers
  const complexityMultipliers = {
    'standard': 1.0,
    'complex': 1.3,
    'extreme': 1.6,
  };
  
  const sizeMultipliers = {
    'small': 0.8,
    'medium': 1.0,
    'large': 1.2,
    'enterprise': 1.5,
  };
  
  const adjustedEffort = baseEffort * 
    complexityMultipliers[profile.complexity] * 
    sizeMultipliers[profile.size];
  
  return Math.round(adjustedEffort);
}

// Generate project phases
function generatePhases(
  packages: string[],
  totalEffort: number,
  timeline: { startDate: Date; endDate: Date },
  profile: ClientProfile
): Phase[] {
  const phases: Phase[] = [];
  let currentDay = 0;
  
  // Generate phases for each SAP Activate stage
  Object.entries(SAP_ACTIVATE_DISTRIBUTION).forEach(([stage, percentage]) => {
    const stageEffort = Math.round(totalEffort * percentage);
    const stageDuration = Math.round(stageEffort / 5); // Assume 5 people average
    
    // Create phases by stream
    const streams = groupPackagesByStream(packages);
    
    Object.entries(streams).forEach(([streamName, streamPackages]) => {
      if (streamPackages.length === 0) return;
      
      const streamEffort = Math.round(stageEffort / Object.keys(streams).length);
      const resources = getDefaultTeamComposition(
        streamEffort,
        profile.region === 'Singapore' ? 'ABSG' : 'ABMY',
        profile.complexity
      );
      
      phases.push({
        id: `phase_${Date.now()}_${Math.random()}`,
        name: `${stage} - ${streamName}`,
        sapActivatePhase: stage as Phase['sapActivatePhase'],
        stream: streamName,
        startDay: currentDay,
        duration: stageDuration,
        effort: streamEffort,
        resources,
        dependencies: [],
        deliverables: generateDeliverables(stage, streamName),
      });
    });
    
    currentDay += stageDuration;
  });
  
  return phases;
}

// Group packages by stream
function groupPackagesByStream(packages: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  Object.entries(STREAMS).forEach(([stream, streamPackages]) => {
    const matched = packages.filter(pkg => streamPackages.includes(pkg));
    if (matched.length > 0) {
      grouped[stream] = matched;
    }
  });
  
  return grouped;
}

// Generate deliverables for a phase
function generateDeliverables(stage: string, stream: string): string[] {
  const deliverables: Record<string, Record<string, string[]>> = {
    'Prepare': {
      'Core Finance': ['Project Charter', 'Finance Process Assessment'],
      'Human Capital': ['HR Process Assessment', 'Organization Readiness'],
      'Supply Chain': ['Supply Chain Assessment', 'Integration Points'],
      'Technical': ['Technical Architecture', 'Infrastructure Plan'],
    },
    'Explore': {
      'Core Finance': ['Finance Blueprint', 'Chart of Accounts Design'],
      'Human Capital': ['HR Blueprint', 'Org Structure Design'],
      'Supply Chain': ['SCM Blueprint', 'Master Data Design'],
      'Technical': ['Integration Design', 'Data Migration Plan'],
    },
    'Realize': {
      'Core Finance': ['Finance Configuration', 'Testing Scripts'],
      'Human Capital': ['HR Configuration', 'Payroll Testing'],
      'Supply Chain': ['SCM Configuration', 'Inventory Setup'],
      'Technical': ['Interfaces Built', 'Data Migration Executed'],
    },
    'Deploy': {
      'Core Finance': ['UAT Completion', 'Cutover Plan'],
      'Human Capital': ['HR UAT', 'Payroll Parallel Run'],
      'Supply Chain': ['SCM UAT', 'Inventory Cutover'],
      'Technical': ['Performance Testing', 'Backup Procedures'],
    },
    'Run': {
      'Core Finance': ['Month-End Close Support', 'Issue Resolution'],
      'Human Capital': ['Payroll Support', 'HR Operations'],
      'Supply Chain': ['Inventory Support', 'Order Support'],
      'Technical': ['System Monitoring', 'Performance Tuning'],
    },
  };
  
  return deliverables[stage]?.[stream] || ['Phase Deliverables'];
}

// Calculate project totals
function calculateTotals(
  phases: Phase[],
  profile: ClientProfile
): ScenarioPlan['totals'] {
  const personDays = phases.reduce((sum, phase) => sum + phase.effort, 0);
  const duration = Math.max(...phases.map(p => p.startDay + p.duration));
  
  // Calculate cost
  const avgDailyRate = profile.region === 'Singapore' ? 4800 : 8000; // SGD vs MYR
  const cost = personDays * avgDailyRate;
  
  // Default margin
  const margin = 0.25;
  
  return {
    personDays,
    duration,
    cost: Math.round(cost),
    margin,
  };
}

// Generate project assumptions
function generateAssumptions(
  chips: Chip[],
  decisions: Decision[],
  profile: ClientProfile
): string[] {
  const assumptions = [
    'Client will provide dedicated resources for the project',
    'Current business processes are documented and available',
    'Decision makers are available for key project decisions',
    'Test data will be provided by client',
    'Standard SAP best practices will be followed',
  ];
  
  // Add specific assumptions based on context
  if (profile.complexity === 'extreme') {
    assumptions.push('Complex requirements may require additional analysis time');
  }
  
  if (profile.maturity === 'naive') {
    assumptions.push('Additional change management effort may be required');
  }
  
  const summary = summarizeChips(chips);
  if (summary.integration && summary.integration.length > 0) {
    assumptions.push('Third-party systems will provide necessary APIs for integration');
  }
  
  return assumptions;
}

// Identify project risks
function identifyRisks(
  chips: Chip[],
  decisions: Decision[],
  packages: string[]
): ScenarioPlan['risks'] {
  const risks: ScenarioPlan['risks'] = [];
  
  // Standard risks
  risks.push({
    id: 'risk_1',
    description: 'Data quality issues during migration',
    probability: 'medium',
    impact: 'high',
    mitigation: 'Early data profiling and cleansing activities',
  });
  
  risks.push({
    id: 'risk_2',
    description: 'User adoption challenges',
    probability: 'medium',
    impact: 'medium',
    mitigation: 'Comprehensive training and change management program',
  });
  
  // Check for specific risk factors
  const summary = summarizeChips(chips);
  
  if (summary.integration && summary.integration.length > 2) {
    risks.push({
      id: 'risk_3',
      description: 'Complex integration requirements may delay project',
      probability: 'high',
      impact: 'high',
      mitigation: 'Early proof of concept for critical integrations',
    });
  }
  
  if (packages.length > 5) {
    risks.push({
      id: 'risk_4',
      description: 'Large scope may impact timeline',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Consider phased approach for non-critical modules',
    });
  }
  
  return risks;
}
