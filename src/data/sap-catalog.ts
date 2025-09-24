import { SAPPackage } from '@/types/core';

export const SAP_CATALOG: Record<string, SAPPackage> = {
  Finance_1: {
    id: 'Finance_1',
    name: 'Finance Core (FI)',
    category: 'Finance',
    effort: 45,
    dependencies: [],
    description: 'General Ledger, Accounts Payable/Receivable, Asset Accounting',
    modules: ['FI-GL', 'FI-AP', 'FI-AR', 'FI-AA'],
    complexity: 1.0
  },
  
  Finance_3: {
    id: 'Finance_3',
    name: 'Finance Advanced',
    category: 'Finance',
    effort: 65,
    dependencies: ['Finance_1'],
    description: 'Advanced Financial Accounting, Controlling, Project Systems',
    modules: ['FI-ADV', 'CO', 'PS'],
    complexity: 1.3
  },

  HCM_1: {
    id: 'HCM_1',
    name: 'HR Core (HCM)',
    category: 'Human Capital',
    effort: 55,
    dependencies: [],
    description: 'Personnel Administration, Organizational Management, Payroll',
    modules: ['PA', 'OM', 'PY'],
    complexity: 1.2
  },

  SCM_1: {
    id: 'SCM_1',
    name: 'Supply Chain Management',
    category: 'Supply Chain',
    effort: 75,
    dependencies: ['Finance_1'],
    description: 'Materials Management, Production Planning, Sales & Distribution',
    modules: ['MM', 'PP', 'SD'],
    complexity: 1.4
  },

  SCM_2: {
    id: 'SCM_2',
    name: 'Advanced SCM',
    category: 'Supply Chain',
    effort: 85,
    dependencies: ['SCM_1'],
    description: 'Advanced Planning & Optimization, Warehouse Management',
    modules: ['APO', 'WM', 'EWM'],
    complexity: 1.6
  },

  Technical_2: {
    id: 'Technical_2',
    name: 'BTP Integration Suite',
    category: 'Technical',
    effort: 35,
    dependencies: [],
    description: 'SAP Business Technology Platform, Integration, APIs',
    modules: ['BTP', 'CPI', 'API'],
    complexity: 1.1
  },

  Technical_3: {
    id: 'Technical_3',
    name: 'Advanced Technical',
    category: 'Technical',
    effort: 45,
    dependencies: ['Technical_2'],
    description: 'Custom Development, Enhancement Framework, Advanced Integrations',
    modules: ['ABAP', 'ENHANCEMENT', 'RFC'],
    complexity: 1.5
  },

  Compliance_MY: {
    id: 'Compliance_MY',
    name: 'Malaysia Compliance',
    category: 'Compliance',
    effort: 25,
    dependencies: ['Finance_1'],
    description: 'Malaysia MyInvois e-invoicing, GST/SST, Local Reporting',
    modules: ['MYINVOIS', 'TAX-MY', 'REPORT-MY'],
    complexity: 1.2
  },

  Analytics_1: {
    id: 'Analytics_1',
    name: 'SAP Analytics Cloud',
    category: 'Analytics',
    effort: 40,
    dependencies: ['Finance_1'],
    description: 'Business Intelligence, Planning & Analytics, Dashboards',
    modules: ['SAC', 'BI', 'PLANNING'],
    complexity: 1.3
  }
};

// Dependency mapping for intelligent sequencing
export const DEPENDENCY_MAP: Record<string, string[]> = {
  Finance_3: ['Finance_1'],
  SCM_1: ['Finance_1'],
  SCM_2: ['SCM_1'],
  Technical_3: ['Technical_2'],
  Compliance_MY: ['Finance_1'],
  Analytics_1: ['Finance_1']
};

// Package categories for UI grouping
export const PACKAGE_CATEGORIES = {
  'Finance': ['Finance_1', 'Finance_3'],
  'Human Capital': ['HCM_1'],
  'Supply Chain': ['SCM_1', 'SCM_2'],
  'Technical': ['Technical_2', 'Technical_3'],
  'Compliance': ['Compliance_MY'],
  'Analytics': ['Analytics_1']
};

// Effort calculation helpers
export const calculatePackageEffort = (packageIds: string[], complexity: number = 1.0): number => {
  return packageIds.reduce((total, id) => {
    const pkg = SAP_CATALOG[id];
    return total + (pkg ? pkg.effort * pkg.complexity * complexity : 0);
  }, 0);
};

export const getPackageDependencies = (packageId: string): string[] => {
  return DEPENDENCY_MAP[packageId] || [];
};

export const validateDependencies = (selectedPackages: string[]): string[] => {
  const missing: string[] = [];
  
  selectedPackages.forEach(packageId => {
    const dependencies = getPackageDependencies(packageId);
    dependencies.forEach(depId => {
      if (!selectedPackages.includes(depId)) {
        missing.push(depId);
      }
    });
  });
  
  return missing;
};
