// Extracted from Timeline MVP - Phase Generation and Sequencing

import { SAP_CATALOG, DEPENDENCY_MAP } from '@/data/sap-catalog';
import { RESOURCE_CATALOG } from '@/data/resource-catalog';

export interface Phase {
  id: string;
  name: string;
  phaseKey?: string;
  status: 'idle' | 'active' | 'complete';
  startBusinessDay: number;
  workingDays: number;
  color: string;
  description?: string;
  category: string;
  dependencies: string[];
  resources?: any[];
  skipHolidays?: boolean;
}

export interface ClientProfile {
  company?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  complexity?: 'standard' | 'complex' | 'extreme';
  timelinePreference?: 'relaxed' | 'normal' | 'aggressive';
  region?: string;
  employees?: number;
  annualRevenue?: number;
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Project Management': '#007AFF',
  'Foundation': '#5856D6',
  'Core': '#34C759',
  'Configuration': '#FF9500',
  'Advanced': '#FF3B30',
  'Technical': '#AF52DE',
  'Compliance': '#FFD60A',
  'HR Setup': '#32D74B',
  'SCM Setup': '#FF6482',
  'Advanced Configuration': '#FF375F',
  'Testing': '#30B0C7',
  'Training': '#FFB340',
  'Change Management': '#8E8E93'
};

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#8E8E93';
}

// Generate PM phases
export function generatePMPhases(): Phase[] {
  return [
    {
      id: `pm-${Date.now()}-1`,
      name: 'Project Initiation',
      phaseKey: 'Project Initiation',
      status: 'idle',
      startBusinessDay: 0,
      workingDays: 2,
      color: getCategoryColor('Project Management'),
      description: 'Project setup, team onboarding, and stakeholder alignment',
      category: 'Project Management',
      dependencies: [],
      skipHolidays: true
    },
    {
      id: `pm-${Date.now()}-2`,
      name: 'Project Planning',
      phaseKey: 'Project Planning',
      status: 'idle',
      startBusinessDay: 2,
      workingDays: 3,
      color: getCategoryColor('Project Management'),
      description: 'Detailed project planning and resource allocation',
      category: 'Project Management',
      dependencies: ['Project Initiation'],
      skipHolidays: true
    },
    {
      id: `pm-${Date.now()}-3`,
      name: 'Project Closure',
      phaseKey: 'Project Closure',
      status: 'idle',
      startBusinessDay: 100,
      workingDays: 2,
      color: getCategoryColor('Project Management'),
      description: 'Project handover and closure activities',
      category: 'Project Management',
      dependencies: [],
      skipHolidays: true
    }
  ];
}

// Generate FRICEW phases
export function generateFRICEWPhases(totalEffort: number): Phase[] {
  const fricewPercentage = 0.15;
  const fricewEffort = Math.ceil(totalEffort * fricewPercentage);
  
  return [
    {
      id: `fricew-${Date.now()}`,
      name: 'FRICEW Development',
      phaseKey: 'FRICEW',
      status: 'idle',
      startBusinessDay: 20,
      workingDays: fricewEffort,
      color: getCategoryColor('Technical'),
      description: 'Forms, Reports, Interfaces, Conversions, Enhancements, Workflows',
      category: 'Technical',
      dependencies: ['Master Data Setup'],
      skipHolidays: true
    }
  ];
}

// Generate change management phases
export function generateChangeManagementPhases(projectDuration: number): Phase[] {
  const phases: Phase[] = [];
  
  phases.push({
    id: `ocm-${Date.now()}-1`,
    name: 'Change Readiness Assessment',
    phaseKey: 'Change Readiness',
    status: 'idle',
    startBusinessDay: 0,
    workingDays: 5,
    color: getCategoryColor('Change Management'),
    description: 'Assess organizational readiness for change',
    category: 'Change Management',
    dependencies: [],
    skipHolidays: true
  });
  
  phases.push({
    id: `ocm-${Date.now()}-2`,
    name: 'Training Development',
    phaseKey: 'Training Development',
    status: 'idle',
    startBusinessDay: Math.floor(projectDuration * 0.5),
    workingDays: 10,
    color: getCategoryColor('Training'),
    description: 'Develop training materials and programs',
    category: 'Training',
    dependencies: [],
    skipHolidays: true
  });
  
  phases.push({
    id: `ocm-${Date.now()}-3`,
    name: 'End User Training',
    phaseKey: 'End User Training',
    status: 'idle',
    startBusinessDay: Math.floor(projectDuration * 0.8),
    workingDays: 5,
    color: getCategoryColor('Training'),
    description: 'Conduct end user training sessions',
    category: 'Training',
    dependencies: ['Training Development'],
    skipHolidays: true
  });
  
  return phases;
}

// Build foundation phases
export function buildFoundationPhases(selectedPackages: string[]): Phase[] {
  const phases: Phase[] = [];
  const foundationItems = new Set<string>();
  
  selectedPackages.forEach(pkgId => {
    const pkg = SAP_CATALOG[pkgId];
    if (pkg) {
      pkg.dependencies.forEach(dep => foundationItems.add(dep));
    }
  });
  
  foundationItems.forEach(item => {
    const depInfo = DEPENDENCY_MAP[item];
    if (depInfo) {
      phases.push({
        id: `foundation-${Date.now()}-${Math.random()}`,
        name: depInfo.phaseName,
        phaseKey: item,
        status: 'idle',
        startBusinessDay: 0,
        workingDays: calculateFoundationEffort(item),
        color: getCategoryColor(depInfo.category),
        description: `Foundation: ${item}`,
        category: depInfo.category,
        dependencies: depInfo.dependencies,
        skipHolidays: true
      });
    }
  });
  
  return phases;
}

// Calculate foundation phase effort
function calculateFoundationEffort(foundationItem: string): number {
  const effortMap: Record<string, number> = {
    'Organizational Setup': 5,
    'Master Data Setup': 8,
    'Security Roles': 5,
    'Organizational Structure': 4,
    'Basic Configuration': 3
  };
  
  return effortMap[foundationItem] || 3;
}

// Generate timeline from SAP package selection
export function generateTimelineFromSAPSelection(
  selectedPackages: string[],
  profile: ClientProfile
): Phase[] {
  const allPhases: Phase[] = [];
  
  // Add PM phases
  allPhases.push(...generatePMPhases());
  
  // Add foundation phases
  allPhases.push(...buildFoundationPhases(selectedPackages));
  
  // Add package phases
  selectedPackages.forEach(pkgId => {
    const pkg = SAP_CATALOG[pkgId];
    if (pkg) {
      allPhases.push({
        id: `pkg-${Date.now()}-${Math.random()}`,
        name: pkg.name,
        phaseKey: pkgId,
        status: 'idle',
        startBusinessDay: 0,
        workingDays: adjustEffortForComplexity(pkg.effort, profile.complexity),
        color: getCategoryColor(pkg.category),
        description: pkg.description,
        category: pkg.category,
        dependencies: pkg.dependencies,
        skipHolidays: true
      });
    }
  });
  
  // Add FRICEW phases
  const totalEffort = calculateTotalEffort(selectedPackages, profile.complexity);
  allPhases.push(...generateFRICEWPhases(totalEffort));
  
  // Add change management phases
  const estimatedDuration = estimateProjectDuration(totalEffort, profile.timelinePreference);
  allPhases.push(...generateChangeManagementPhases(estimatedDuration));
  
  // Sequence all phases
  return calculateIntelligentSequencing(allPhases);
}

// Adjust effort based on complexity
function adjustEffortForComplexity(
  baseEffort: number,
  complexity?: 'standard' | 'complex' | 'extreme'
): number {
  const multipliers = {
    standard: 1.0,
    complex: 1.3,
    extreme: 1.6
  };
  
  return Math.ceil(baseEffort * (multipliers[complexity || 'standard']));
}

// Calculate total effort
function calculateTotalEffort(
  packageIds: string[],
  complexity?: 'standard' | 'complex' | 'extreme'
): number {
  return packageIds.reduce((sum, id) => {
    const pkg = SAP_CATALOG[id];
    if (pkg) {
      return sum + adjustEffortForComplexity(pkg.effort, complexity);
    }
    return sum;
  }, 0);
}

// Estimate project duration
function estimateProjectDuration(
  totalEffort: number,
  timelinePreference?: 'relaxed' | 'normal' | 'aggressive'
): number {
  const teamSize = {
    relaxed: 4,
    normal: 6,
    aggressive: 10
  }[timelinePreference || 'normal'];
  
  const utilizationFactor = 0.8;
  return Math.ceil(totalEffort / (teamSize * utilizationFactor));
}

// Intelligent phase sequencing using topological sort
export function calculateIntelligentSequencing(phases: Phase[]): Phase[] {
  const phaseMap = new Map<string, Phase>();
  phases.forEach(phase => {
    const key = phase.phaseKey || phase.name;
    phaseMap.set(key, { ...phase, phaseKey: key });
  });
  
  const inDegree = new Map<string, number>();
  const dependencyGraph = new Map<string, string[]>();
  
  phaseMap.forEach((_, key) => {
    inDegree.set(key, 0);
    dependencyGraph.set(key, []);
  });
  
  phaseMap.forEach((phase, key) => {
    phase.dependencies.forEach(dep => {
      if (phaseMap.has(dep)) {
        const currentDeps = dependencyGraph.get(dep) || [];
        currentDeps.push(key);
        dependencyGraph.set(dep, currentDeps);
        inDegree.set(key, (inDegree.get(key) || 0) + 1);
      }
    });
  });
  
  const queue: string[] = [];
  const earliestStart = new Map<string, number>();
  
  inDegree.forEach((degree, key) => {
    if (degree === 0) {
      queue.push(key);
      earliestStart.set(key, 0);
    }
  });
  
  const sequenced: Phase[] = [];
  
  while (queue.length > 0) {
    const key = queue.shift()!;
    const phase = phaseMap.get(key)!;
    const start = earliestStart.get(key) || 0;
    
    sequenced.push({
      ...phase,
      startBusinessDay: start
    });
    
    const dependents = dependencyGraph.get(key) || [];
    dependents.forEach(dependent => {
      const currentInDegree = (inDegree.get(dependent) || 0) - 1;
      inDegree.set(dependent, currentInDegree);
      
      const dependentStart = Math.max(
        earliestStart.get(dependent) || 0,
        start + phase.workingDays
      );
      earliestStart.set(dependent, dependentStart);
      
      if (currentInDegree === 0) {
        queue.push(dependent);
      }
    });
  }
  
  if (sequenced.length !== phases.length) {
    console.warn('Dependency cycle detected, falling back to simple sequencing');
    let currentStart = 0;
    return phases.map(phase => {
      const result = { ...phase, startBusinessDay: currentStart };
      currentStart += phase.workingDays;
      return result;
    });
  }
  
  const closurePhase = sequenced.find(p => p.phaseKey === 'Project Closure');
  if (closurePhase) {
    const maxEnd = Math.max(...sequenced
      .filter(p => p.phaseKey !== 'Project Closure')
      .map(p => p.startBusinessDay + p.workingDays));
    closurePhase.startBusinessDay = maxEnd;
  }
  
  return sequenced;
}

// Calculate resource requirements for a phase
export function calculateResourceRequirements(
  phase: Phase,
  profile: ClientProfile
): any[] {
  const category = phase.category;
  const region = profile.region || 'ABMY';
  
  const templates: Record<string, any[]> = {
    'Project Management': [
      { role: 'Manager', allocation: 50 },
      { role: 'Senior Consultant', allocation: 30 }
    ],
    'Foundation': [
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 80 }
    ],
    'Core': [
      { role: 'Manager', allocation: 40 },
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 60 }
    ],
    'Configuration': [
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 100 },
      { role: 'Analyst', allocation: 50 }
    ],
    'Technical': [
      { role: 'Senior Consultant', allocation: 100 },
      { role: 'Consultant', allocation: 100 }
    ],
    'Testing': [
      { role: 'Consultant', allocation: 100 },
      { role: 'Analyst', allocation: 80 }
    ],
    'Training': [
      { role: 'Senior Consultant', allocation: 50 },
      { role: 'Consultant', allocation: 100 }
    ],
    'Change Management': [
      { role: 'Manager', allocation: 30 },
      { role: 'Senior Consultant', allocation: 50 }
    ]
  };
  
  const template = templates[category] || templates['Foundation'];
  
  return template.map((resource, index) => {
    const hourlyRate = RESOURCE_CATALOG[region]?.positions[resource.role]?.rate || 0;
    return {
      id: `${phase.id}-resource-${index}`,
      name: `${resource.role} ${index + 1}`,
      role: resource.role,
      region: region,
      allocation: resource.allocation,
      hourlyRate: hourlyRate,
      includeOPE: false
    };
  });
}
