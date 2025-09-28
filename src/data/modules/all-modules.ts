import { FINANCE_MODULES } from './finance-complete';
import { SCM_MODULES } from './scm-complete';
import { HCM_MODULES } from './hcm-complete';
import { PROCUREMENT_MODULES } from './procurement-complete';
import { CX_MODULES } from './cx-complete';
import { TECHNICAL_MODULES } from './technical-complete';
import { SAPModule } from '@/data/sap-modules-complete';

export const ALL_SAP_MODULES: Record<string, SAPModule> = {
  ...FINANCE_MODULES,    // 30 modules
  ...SCM_MODULES,        // 8 modules
  ...HCM_MODULES,        // 9 modules
  ...PROCUREMENT_MODULES, // 7 modules
  ...CX_MODULES,         // 14 modules
  ...TECHNICAL_MODULES   // 74 modules
};

// Total: 142 modules

export const MODULE_CATEGORIES = {
  Finance: Object.keys(FINANCE_MODULES),
  SCM: Object.keys(SCM_MODULES),
  HCM: Object.keys(HCM_MODULES),
  Procurement: Object.keys(PROCUREMENT_MODULES),
  CX: Object.keys(CX_MODULES),
  Technical: Object.keys(TECHNICAL_MODULES)
};

export const TOTAL_MODULE_COUNT = Object.keys(ALL_SAP_MODULES).length;

export function getModuleById(moduleId: string): SAPModule | undefined {
  return ALL_SAP_MODULES[moduleId];
}

export function getModulesByCategory(category: string): SAPModule[] {
  return Object.values(ALL_SAP_MODULES).filter(m => m.category === category);
}

export function getCriticalPathModules(): SAPModule[] {
  return Object.values(ALL_SAP_MODULES).filter(m => m.criticalPath);
}

export function calculateTotalBaseEffort(moduleIds: string[]): number {
  return moduleIds.reduce((total, id) => {
    const module = ALL_SAP_MODULES[id];
    return total + (module ? module.baseEffort : 0);
  }, 0);
}