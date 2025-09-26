// @ts-nocheck
// @ts-nocheck
// SAP Package Catalog - Complete package definitions with effort and dependencies
import { SAPPackage } from "@/types/core";

export const SAP_PACKAGES: Record<string, SAPPackage> = {
  // ==================== FINANCE CORE ====================
  Finance_1: {
    id: "Finance_1",
    name: "General Ledger",
    category: "Finance Core",
    baseEffort: 30,
    dependencies: [],
    criticalPath: true,
    modules: [
      { id: "gl_setup", name: "GL Account Setup", effort: 8, mandatory: true },
      { id: "coa", name: "Chart of Accounts", effort: 10, mandatory: true },
      { id: "fiscal_year", name: "Fiscal Year Configuration", effort: 3, mandatory: true },
      { id: "currency", name: "Currency Configuration", effort: 2, mandatory: true },
      { id: "gl_posting", name: "GL Posting Rules", effort: 7, mandatory: false },
    ],
  },

  Finance_3: {
    id: "Finance_3",
    name: "Cost Center Accounting",
    category: "Finance Core",
    baseEffort: 25,
    dependencies: ["Finance_1"],
    criticalPath: true,
    modules: [
      { id: "cc_hierarchy", name: "Cost Center Hierarchy", effort: 8, mandatory: true },
      { id: "cc_planning", name: "Cost Planning", effort: 7, mandatory: false },
      { id: "cc_allocation", name: "Cost Allocation", effort: 10, mandatory: true },
    ],
  },

  HCM_1: {
    id: "HCM_1",
    name: "Core HR Implementation",
    category: "HR Core",
    baseEffort: 40,
    dependencies: [],
    criticalPath: false,
    modules: [
      { id: "org_structure", name: "Organizational Structure", effort: 10, mandatory: true },
      { id: "employee_master", name: "Employee Master Data", effort: 12, mandatory: true },
      { id: "time_mgmt", name: "Time Management", effort: 10, mandatory: false },
      { id: "leave_mgmt", name: "Leave Management", effort: 8, mandatory: true },
    ],
  },

  SCM_1: {
    id: "SCM_1",
    name: "Inventory Management",
    category: "Supply Chain",
    baseEffort: 30,
    dependencies: [],
    criticalPath: false,
    modules: [
      { id: "material_master", name: "Material Master", effort: 12, mandatory: true },
      { id: "warehouse_config", name: "Warehouse Configuration", effort: 8, mandatory: true },
      { id: "stock_management", name: "Stock Management", effort: 10, mandatory: true },
    ],
  },

  Technical_2: {
    id: "Technical_2",
    name: "Data Migration",
    category: "Technical",
    baseEffort: 40,
    dependencies: [],
    criticalPath: true,
    modules: [
      { id: "data_mapping", name: "Data Mapping", effort: 15, mandatory: true },
      { id: "data_cleansing", name: "Data Cleansing", effort: 10, mandatory: true },
      { id: "migration_execution", name: "Migration Execution", effort: 15, mandatory: true },
    ],
  },

  Compliance_MY: {
    id: "Compliance_MY",
    name: "Malaysia e-Invoice (MyInvois)",
    category: "Compliance",
    baseEffort: 20,
    dependencies: ["Finance_1"],
    criticalPath: false,
    modules: [
      { id: "lhdn_integration", name: "LHDN Integration", effort: 10, mandatory: true },
      { id: "invoice_format", name: "Invoice Format Setup", effort: 5, mandatory: true },
      { id: "compliance_testing", name: "Compliance Testing", effort: 5, mandatory: true },
    ],
  },
};

// Helper function to calculate total effort for selected packages
export function calculateTotalEffort(selectedPackageIds: string[]): number {
  return selectedPackageIds.reduce((total, id) => {
    const pkg = SAP_PACKAGES[id];
    if (!pkg) return total;

    // Base effort plus all mandatory modules
    const mandatoryEffort = pkg.modules
      .filter((m) => m.mandatory)
      .reduce((sum, m) => sum + m.effort, 0);

    return total + pkg.baseEffort + mandatoryEffort;
  }, 0);
}

// Get all dependencies for selected packages
export function getAllDependencies(selectedPackageIds: string[]): string[] {
  const allDeps = new Set<string>();
  const toProcess = [...selectedPackageIds];

  while (toProcess.length > 0) {
    const current = toProcess.shift()!;
    const pkg = SAP_PACKAGES[current];

    if (pkg) {
      pkg.dependencies.forEach((dep) => {
        if (!allDeps.has(dep)) {
          allDeps.add(dep);
          toProcess.push(dep);
        }
      });
    }
  }

  return Array.from(allDeps);
}

// Check if package selection is valid
export function validatePackageSelection(selectedPackageIds: string[]): {
  isValid: boolean;
  missingDependencies: string[];
} {
  const selected = new Set(selectedPackageIds);
  const missingDependencies: string[] = [];

  selectedPackageIds.forEach((id) => {
    const pkg = SAP_PACKAGES[id];
    if (pkg) {
      pkg.dependencies.forEach((dep) => {
        if (!selected.has(dep)) {
          missingDependencies.push(`${pkg.name} requires ${SAP_PACKAGES[dep]?.name || dep}`);
        }
      });
    }
  });

  return {
    isValid: missingDependencies.length === 0,
    missingDependencies,
  };
}

// Get packages by category
export function getPackagesByCategory(category: string): SAPPackage[] {
  return Object.values(SAP_PACKAGES).filter((pkg) => pkg.category === category);
}

// Suggest packages based on industry
export function suggestPackagesForIndustry(industry: string): string[] {
  const suggestions: Record<string, string[]> = {
    manufacturing: ["Finance_1", "Finance_3", "SCM_1", "Technical_2"],
    retail: ["Finance_1", "SCM_1", "Technical_2"],
    services: ["Finance_1", "Finance_3", "HCM_1", "Technical_2"],
    banking: ["Finance_1", "Finance_3", "Technical_2"],
    healthcare: ["Finance_1", "HCM_1", "SCM_1", "Technical_2"],
  };

  return suggestions[industry.toLowerCase()] || ["Finance_1", "Finance_3", "Technical_2"];
}
