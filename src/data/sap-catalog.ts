// Extracted from Timeline MVP - SAP Package Catalog
export interface SAPPackage {
  id: string;
  name: string;
  category: string;
  effort: number;
  dependencies: string[];
  description?: string;
  modules?: string[];
}

export const SAP_CATALOG: Record<string, SAPPackage> = {
  // Finance packages
  Finance_1: {
    id: 'Finance_1',
    name: 'Finance Core',
    category: 'Core',
    effort: 80,
    dependencies: [],
    description: 'GL, cost centers, procurement',
    modules: ['FI', 'CO']
  },
  Finance_3: {
    id: 'Finance_3',
    name: 'Finance Advanced',
    category: 'Advanced',
    effort: 60,
    dependencies: ['Finance_1'],
    description: 'Project accounting, treasury',
    modules: ['PS', 'TR']
  },
  Finance_21: {
    id: 'Finance_21',
    name: 'Project Accounting Configuration',
    category: 'Advanced Configuration',
    effort: 45,
    dependencies: ['Finance_1', 'Organizational Setup'],
    modules: ['PS']
  },
  
  // HR packages
  HCM_1: {
    id: 'HCM_1',
    name: 'Core HR Implementation',
    category: 'HR Setup',
    effort: 60,
    dependencies: ['Organizational Setup'],
    description: 'Employee management, payroll',
    modules: ['HCM', 'PY']
  },
  
  // Supply Chain packages
  SCM_1: {
    id: 'SCM_1',
    name: 'Supply Chain Core',
    category: 'SCM Setup',
    effort: 100,
    dependencies: ['Master Data Setup'],
    description: 'Production planning, inventory',
    modules: ['PP', 'MM', 'SD']
  },
  SCM_2: {
    id: 'SCM_2',
    name: 'Production Planning Configuration',
    category: 'SCM Setup',
    effort: 75,
    dependencies: ['Master Data Setup', 'Organizational Structure'],
    modules: ['PP']
  },
  
  // Technical packages
  Technical_2: {
    id: 'Technical_2',
    name: 'BTP Integration',
    category: 'Technical',
    effort: 40,
    dependencies: [],
    description: 'SAP BTP setup and configuration',
    modules: ['BTP']
  },
  
  // Compliance packages
  Compliance_MY: {
    id: 'Compliance_MY',
    name: 'Malaysia e-Invoice',
    category: 'Compliance',
    effort: 30,
    dependencies: ['Finance_1'],
    description: 'MyInvois compliance for LHDN',
    modules: ['e-Invoice']
  }
};

// Dependency mapping for intelligent sequencing
export const DEPENDENCY_MAP: Record<string, { 
  phaseName: string; 
  category: string; 
  dependencies: string[];
  parallelizable?: boolean;
}> = {
  'Organizational Setup': {
    phaseName: 'Organizational Structure Setup',
    category: 'Foundation',
    dependencies: [],
    parallelizable: false
  },
  'Master Data Setup': {
    phaseName: 'Master Data Configuration',
    category: 'Foundation',
    dependencies: ['Organizational Setup'],
    parallelizable: false
  },
  'Security Roles': {
    phaseName: 'Security and Authorization Setup',
    category: 'Configuration',
    dependencies: ['Finance_1', 'Master Data Setup'],
    parallelizable: true
  }
};

// Calculate total effort for selected packages
export function calculatePackageEffort(
  packageIds: string[],
  complexity: 'standard' | 'complex' | 'extreme' = 'standard'
): number {
  const baseEffort = packageIds.reduce((sum, id) => {
    const pkg = SAP_CATALOG[id];
    return sum + (pkg?.effort || 0);
  }, 0);
  
  const multiplier = {
    standard: 1.0,
    complex: 1.3,
    extreme: 1.6
  }[complexity];
  
  return Math.ceil(baseEffort * multiplier);
}

// Get package dependencies
export function getPackageDependencies(packageId: string): string[] {
  const pkg = SAP_CATALOG[packageId];
  if (!pkg) return [];
  
  const deps = new Set<string>(pkg.dependencies);
  
  // Recursively add dependencies of dependencies
  pkg.dependencies.forEach(dep => {
    getPackageDependencies(dep).forEach(d => deps.add(d));
  });
  
  return Array.from(deps);
}

// Suggest packages based on industry
export function suggestPackagesByIndustry(industry: string): string[] {
  const suggestions: Record<string, string[]> = {
    manufacturing: ['Finance_1', 'SCM_1', 'SCM_2'],
    retail: ['Finance_1', 'SCM_1'],
    healthcare: ['Finance_1', 'HCM_1'],
    banking: ['Finance_1', 'Finance_3', 'Finance_21'],
    insurance: ['Finance_1', 'Finance_3']
  };
  
  return suggestions[industry.toLowerCase()] || ['Finance_1'];
}







