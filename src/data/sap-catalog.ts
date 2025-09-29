// @ts-nocheck
import { SAPPackage } from '@/types/chip-override';
import { ALL_SAP_MODULES } from '@/data/modules/all-modules';

// Convert the 142 module catalog to the package format
export const SAP_CATALOG: Record<string, SAPPackage> = {};

// Transform all modules to packages
Object.entries(ALL_SAP_MODULES).forEach(([id, module]) => {
  SAP_CATALOG[id] = {
    id: module.id,
    name: module.name,
    category: module.category.toLowerCase(),
    effort: module.baseEffort,
    dependencies: module.dependencies,
    description: module.description,
    modules: [module.id],
    complexity: module.complexity
  };
});

// Keep the original 9 packages for backward compatibility
const LEGACY_PACKAGES = {
  Finance_1: {
    id: 'Finance_1',
    name: 'Finance Core (FI)',
    category: 'finance',
    effort: 45,
    dependencies: [],
    description: 'General Ledger, Accounts Payable/Receivable, Asset Accounting',
    modules: ['FI-GL', 'FI-AP', 'FI-AR', 'FI-AA'],
    complexity: 1.0
  },
  
  Finance_3: {
    id: 'Finance_3',
    name: 'Finance Advanced',
    category: 'finance',
    effort: 65,
    dependencies: ['Finance_1'],
    description: 'Advanced Financial Accounting, Controlling, Project Systems',
    modules: ['FI-ADV', 'CO', 'PS'],
    complexity: 1.3
  },

  HCM_1: {
    id: 'HCM_1',
    name: 'HR Core (HCM)',
    category: 'core',
    effort: 55,
    dependencies: [],
    description: 'Personnel Administration, Organizational Management, Payroll',
    modules: ['PA', 'OM', 'PY'],
    complexity: 1.2
  },

  SCM_1: {
    id: 'SCM_1',
    name: 'Supply Chain Management',
    category: 'core',
    effort: 75,
    dependencies: ['Finance_1'],
    description: 'Materials Management, Production Planning, Sales & Distribution',
    modules: ['MM', 'PP', 'SD'],
    complexity: 1.4
  },

  SCM_2: {
    id: 'SCM_2',
    name: 'Advanced SCM',
    category: 'core',
    effort: 85,
    dependencies: ['SCM_1'],
    description: 'Advanced Planning & Optimization, Warehouse Management',
    modules: ['APO', 'WM', 'EWM'],
    complexity: 1.6
  },

  Technical_2: {
    id: 'Technical_2',
    name: 'BTP Integration Suite',
    category: 'technical',
    effort: 35,
    dependencies: [],
    description: 'SAP Business Technology Platform, Integration, APIs',
    modules: ['BTP', 'CPI', 'API'],
    complexity: 1.1
  },

  Technical_3: {
    id: 'Technical_3',
    name: 'Advanced Technical',
    category: 'technical',
    effort: 45,
    dependencies: ['Technical_2'],
    description: 'Custom Development, Enhancement Framework, Advanced Integrations',
    modules: ['ABAP', 'ENHANCEMENT', 'RFC'],
    complexity: 1.5
  },

  Compliance_MY: {
    id: 'Compliance_MY',
    name: 'Malaysia Compliance',
    category: 'compliance',
    effort: 25,
    dependencies: ['Finance_1'],
    description: 'Malaysia MyInvois e-invoicing, GST/SST, Local Reporting',
    modules: ['MYINVOIS', 'TAX-MY', 'REPORT-MY'],
    complexity: 1.2
  },

  Analytics_1: {
    id: 'Analytics_1',
    name: 'SAP Analytics Cloud',
    category: 'technical',
    effort: 40,
    dependencies: ['Finance_1'],
    description: 'Business Intelligence, Planning & Analytics, Dashboards',
    modules: ['SAC', 'BI', 'PLANNING'],
    complexity: 1.3
  }
};

// Merge legacy packages with the full module catalog  
Object.assign(SAP_CATALOG, LEGACY_PACKAGES);

// Export the dependency map from the modules
export const DEPENDENCY_MAP: Record<string, string[]> = {};
Object.entries(ALL_SAP_MODULES).forEach(([id, module]) => {
  if (module.dependencies.length > 0) {
    DEPENDENCY_MAP[id] = module.dependencies;
  }
});

// Keep legacy dependency map for backward compatibility
const LEGACY_DEPENDENCY_MAP: Record<string, string[]> = {
  Finance_3: ['Finance_1'],
  SCM_1: ['Finance_1'],
  SCM_2: ['SCM_1'],
  Technical_3: ['Technical_2'],
  Compliance_MY: ['Finance_1'],
  Analytics_1: ['Finance_1']
};
Object.assign(DEPENDENCY_MAP, LEGACY_DEPENDENCY_MAP);

// Package categories for UI grouping - now includes all 142 modules
export const PACKAGE_CATEGORIES = {
  'Finance': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Finance'),
  'SCM': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'SCM'),
  'HCM': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'HCM'),
  'Procurement': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Procurement'),
  'CX': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'CX'),
  'Technical': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Technical'),
  'Analytics': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Analytics'),
  'Industry': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Industry'),
  'Compliance': Object.keys(ALL_SAP_MODULES).filter(id => ALL_SAP_MODULES[id].category === 'Compliance')
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

// Convert catalog to array for UI components
export const SAP_PACKAGES = Object.values(SAP_CATALOG);