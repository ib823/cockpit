// @ts-nocheck
import { SAP_MODULES } from '@/data/sap-modules-complete';
import { SAPPackage } from '@/types/chip-override';

// Convert the 142 module catalog to the package format
export const SAP_CATALOG: Record<string, SAPPackage> = {};

// Import all modules from sap-modules-complete
Object.entries(SAP_MODULES).forEach(([id, module]) => {
  SAP_CATALOG[id] = {
    id: module.id,
    name: module.name,
    category: module.category,
    description: module.description,
    effort: module.baseEffort,
    complexity: module.complexity,
    dependencies: module.dependencies || [],
    licensePrice: { sgd: 0, myr: 0, vnd: 0 },
    criticalPath: module.criticalPath || false
  };
});

// Dependency map
export const DEPENDENCY_MAP: Record<string, string[]> = {};
Object.entries(SAP_MODULES).forEach(([id, module]) => {
  if (module.dependencies && module.dependencies.length > 0) {
    DEPENDENCY_MAP[id] = module.dependencies;
  }
});

// Package categories for UI grouping
export const PACKAGE_CATEGORIES = {
  'Finance': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Finance'),
  'SCM': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'SCM'),
  'HCM': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'HCM'),
  'Procurement': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Procurement'),
  'CX': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'CX'),
  'Technical': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Technical'),
  'Analytics': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Analytics'),
  'Industry': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Industry'),
  'Compliance': Object.keys(SAP_MODULES).filter(id => SAP_MODULES[id].category === 'Compliance')
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