/**
 * SAP Deliverables Catalog - Configuration-Level Granularity
 * 
 * Structure: Module → SubModule → ConfigTask
 * Each task has base effort, skills, shareability, and risk level
 */

export interface ConfigTask {
  id: string;
  name: string;
  category: 'functional' | 'technical' | 'wrapper';
  stream: 'FI' | 'MM' | 'SD' | 'HCM' | 'RICEW' | 'PM' | 'Change' | 'Basis' | 'Security';
  baseEffort: number;           // Person-days
  skillRequired: string[];       // e.g., ["SAP FI", "Accounting"]
  sharable: boolean;             // Can be shared across modules?
  riskLevel: 'low' | 'medium' | 'high';
  dependencies?: string[];       // Task IDs
}

export interface SubModule {
  id: string;
  name: string;
  configurations: ConfigTask[];
  estimatedEffort: number;       // Sum of config tasks
  complexity: number;            // Multiplier 0.7-1.5
}

export interface DeliverableTree {
  moduleId: string;              // Maps to SAP_MODULES keys
  moduleName: string;
  subModules: SubModule[];
}

// ========== FINANCE MODULE ==========
export const FINANCE_DELIVERABLES: DeliverableTree = {
  moduleId: "Finance_1",
  moduleName: "General Ledger & Core Finance",
  subModules: [
    {
      id: "FI_GL",
      name: "General Ledger Configuration",
      estimatedEffort: 15,
      complexity: 1.0,
      configurations: [
        {
          id: "FI_GL_COA",
          name: "Chart of Accounts Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 3,
          skillRequired: ["SAP FI", "Accounting Standards"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "FI_GL_COMPANY_CODE",
          name: "Company Code Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI", "Organizational Structure"],
          sharable: true,
          riskLevel: "low",
          dependencies: ["FI_GL_COA"],
        },
        {
          id: "FI_GL_FISCAL_YEAR",
          name: "Fiscal Year Variant Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 1,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_GL_POSTING_KEYS",
          name: "Posting Key Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_GL_DOCUMENT_TYPES",
          name: "Document Type Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_GL_PERIOD_CLOSE",
          name: "Period-End Closing Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI", "Financial Close", "Reporting"],
          sharable: false,
          riskLevel: "high",
          dependencies: ["FI_GL_COA", "FI_GL_FISCAL_YEAR"],
        },
      ],
    },
    {
      id: "FI_AR",
      name: "Accounts Receivable",
      estimatedEffort: 18,
      complexity: 1.1,
      configurations: [
        {
          id: "FI_AR_CUST_MASTER",
          name: "Customer Master Data Config",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI", "Customer Master Data", "SD Integration"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "FI_AR_CUST_GROUPS",
          name: "Customer Account Groups",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_AR_PAYMENT_TERMS",
          name: "Payment Terms Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_AR_INVOICING",
          name: "Invoicing Process Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 4,
          skillRequired: ["SAP FI", "SD Integration", "Billing"],
          sharable: false,
          riskLevel: "medium",
          dependencies: ["FI_AR_CUST_MASTER"],
        },
        {
          id: "FI_AR_CREDIT_MGMT",
          name: "Credit Management Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI", "Credit Control", "Risk Management"],
          sharable: false,
          riskLevel: "high",
          dependencies: ["FI_AR_CUST_MASTER"],
        },
      ],
    },
    {
      id: "FI_AP",
      name: "Accounts Payable",
      estimatedEffort: 20,
      complexity: 1.2,
      configurations: [
        {
          id: "FI_AP_VENDOR_MASTER",
          name: "Vendor Master Data Config",
          category: "functional",
          stream: "FI",
          baseEffort: 5,
          skillRequired: ["SAP FI", "Vendor Master Data", "MM Integration"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "FI_AP_VENDOR_GROUPS",
          name: "Vendor Account Groups",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "FI_AP_PAYMENT_PROGRAM",
          name: "Automatic Payment Program",
          category: "functional",
          stream: "FI",
          baseEffort: 6,
          skillRequired: ["SAP FI", "Treasury", "Banking"],
          sharable: false,
          riskLevel: "high",
          dependencies: ["FI_AP_VENDOR_MASTER"],
        },
        {
          id: "FI_AP_PAYMENT_METHODS",
          name: "Payment Methods Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 3,
          skillRequired: ["SAP FI", "Banking"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "FI_AP_WITHHOLDING_TAX",
          name: "Withholding Tax Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 4,
          skillRequired: ["SAP FI", "Tax Compliance", "Local Regulations"],
          sharable: true,
          riskLevel: "medium",
        },
      ],
    },
    {
      id: "FI_AA",
      name: "Asset Accounting",
      estimatedEffort: 12,
      complexity: 0.9,
      configurations: [
        {
          id: "FI_AA_ASSET_CLASSES",
          name: "Asset Class Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 3,
          skillRequired: ["SAP FI", "Fixed Assets"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "FI_AA_DEPRECIATION",
          name: "Depreciation Key Setup",
          category: "functional",
          stream: "FI",
          baseEffort: 4,
          skillRequired: ["SAP FI", "Fixed Assets", "Accounting Standards"],
          sharable: true,
          riskLevel: "high",
        },
        {
          id: "FI_AA_INTEGRATION",
          name: "GL Integration Configuration",
          category: "functional",
          stream: "FI",
          baseEffort: 3,
          skillRequired: ["SAP FI"],
          sharable: false,
          riskLevel: "medium",
          dependencies: ["FI_GL_COA"],
        },
        {
          id: "FI_AA_MIGRATION",
          name: "Asset Master Data Migration",
          category: "functional",
          stream: "FI",
          baseEffort: 2,
          skillRequired: ["SAP FI", "Data Migration"],
          sharable: false,
          riskLevel: "low",
        },
      ],
    },
  ],
};

// ========== MATERIALS MANAGEMENT ==========
export const MM_DELIVERABLES: DeliverableTree = {
  moduleId: "SCM_1",
  moduleName: "Materials Management",
  subModules: [
    {
      id: "MM_PUR",
      name: "Procurement",
      estimatedEffort: 25,
      complexity: 1.1,
      configurations: [
        {
          id: "MM_PUR_ORG",
          name: "Purchasing Organization Setup",
          category: "functional",
          stream: "MM",
          baseEffort: 2,
          skillRequired: ["SAP MM", "Procurement"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "MM_PUR_GROUPS",
          name: "Purchasing Groups Configuration",
          category: "functional",
          stream: "MM",
          baseEffort: 2,
          skillRequired: ["SAP MM"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "MM_PUR_PR",
          name: "Purchase Requisition Config",
          category: "functional",
          stream: "MM",
          baseEffort: 4,
          skillRequired: ["SAP MM", "Procurement Process"],
          sharable: false,
          riskLevel: "medium",
        },
        {
          id: "MM_PUR_PO",
          name: "Purchase Order Configuration",
          category: "functional",
          stream: "MM",
          baseEffort: 6,
          skillRequired: ["SAP MM", "Procurement", "FI Integration"],
          sharable: false,
          riskLevel: "high",
          dependencies: ["MM_PUR_ORG", "FI_AP_VENDOR_MASTER"],
        },
        {
          id: "MM_PUR_APPROVAL",
          name: "Approval Workflow Setup",
          category: "functional",
          stream: "MM",
          baseEffort: 5,
          skillRequired: ["SAP MM", "Workflow"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "MM_PUR_SOURCE",
          name: "Source Determination",
          category: "functional",
          stream: "MM",
          baseEffort: 3,
          skillRequired: ["SAP MM", "Vendor Management"],
          sharable: false,
          riskLevel: "medium",
        },
        {
          id: "MM_PUR_PRICING",
          name: "Pricing Procedure Config",
          category: "functional",
          stream: "MM",
          baseEffort: 3,
          skillRequired: ["SAP MM", "Pricing"],
          sharable: true,
          riskLevel: "medium",
        },
      ],
    },
    {
      id: "MM_INV",
      name: "Inventory Management",
      estimatedEffort: 18,
      complexity: 1.0,
      configurations: [
        {
          id: "MM_INV_PLANT",
          name: "Plant Configuration",
          category: "functional",
          stream: "MM",
          baseEffort: 2,
          skillRequired: ["SAP MM", "Organizational Structure"],
          sharable: true,
          riskLevel: "low",
        },
        {
          id: "MM_INV_STORAGE_LOC",
          name: "Storage Location Setup",
          category: "functional",
          stream: "MM",
          baseEffort: 2,
          skillRequired: ["SAP MM"],
          sharable: true,
          riskLevel: "low",
          dependencies: ["MM_INV_PLANT"],
        },
        {
          id: "MM_INV_MOVEMENTS",
          name: "Goods Movement Configuration",
          category: "functional",
          stream: "MM",
          baseEffort: 5,
          skillRequired: ["SAP MM", "Inventory Management"],
          sharable: false,
          riskLevel: "medium",
        },
        {
          id: "MM_INV_MATERIAL_MASTER",
          name: "Material Master Config",
          category: "functional",
          stream: "MM",
          baseEffort: 6,
          skillRequired: ["SAP MM", "Master Data", "Cross-Module"],
          sharable: true,
          riskLevel: "high",
        },
        {
          id: "MM_INV_PHYSICAL_INV",
          name: "Physical Inventory Setup",
          category: "functional",
          stream: "MM",
          baseEffort: 3,
          skillRequired: ["SAP MM", "Inventory Mgmt"],
          sharable: false,
          riskLevel: "medium",
        },
      ],
    },
    {
      id: "MM_VAL",
      name: "Valuation & Account Determination",
      estimatedEffort: 10,
      complexity: 1.2,
      configurations: [
        {
          id: "MM_VAL_PRICE_CONTROL",
          name: "Price Control Configuration",
          category: "functional",
          stream: "MM",
          baseEffort: 3,
          skillRequired: ["SAP MM", "Valuation"],
          sharable: true,
          riskLevel: "medium",
        },
        {
          id: "MM_VAL_ACCT_DET",
          name: "Account Determination Setup",
          category: "functional",
          stream: "MM",
          baseEffort: 5,
          skillRequired: ["SAP MM", "FI Integration", "Accounting"],
          sharable: false,
          riskLevel: "high",
          dependencies: ["FI_GL_COA"],
        },
        {
          id: "MM_VAL_VALUATION_CLASS",
          name: "Valuation Class Config",
          category: "functional",
          stream: "MM",
          baseEffort: 2,
          skillRequired: ["SAP MM", "Valuation"],
          sharable: true,
          riskLevel: "low",
        },
      ],
    },
  ],
};

// ========== TECHNICAL DELIVERABLES (RICEW) ==========
export const TECHNICAL_DELIVERABLES = {
  reports: [
    {
      id: "REP_FI_GL_BALANCE",
      name: "GL Account Balance Report",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 2,
      skillRequired: ["ABAP", "ALV Reporting", "FI Knowledge"],
      sharable: false,
      riskLevel: "low" as const,
    },
    {
      id: "REP_FI_AR_AGING",
      name: "AR Aging Report",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 3,
      skillRequired: ["ABAP", "ALV Reporting", "FI AR"],
      sharable: false,
      riskLevel: "medium" as const,
    },
    {
      id: "REP_FI_AP_AGING",
      name: "AP Aging Report",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 3,
      skillRequired: ["ABAP", "ALV Reporting", "FI AP"],
      sharable: false,
      riskLevel: "medium" as const,
    },
    {
      id: "REP_MM_STOCK",
      name: "Stock Movement Report",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 2,
      skillRequired: ["ABAP", "ALV Reporting", "MM Knowledge"],
      sharable: false,
      riskLevel: "low" as const,
    },
  ],
  interfaces: [
    {
      id: "INT_BANK_STMT",
      name: "Bank Statement Interface",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 5,
      skillRequired: ["ABAP", "IDoc/PI", "Banking", "FI"],
      sharable: false,
      riskLevel: "high" as const,
    },
    {
      id: "INT_PAYMENT_FILE",
      name: "Payment File Generation",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 4,
      skillRequired: ["ABAP", "File Handling", "Banking"],
      sharable: false,
      riskLevel: "high" as const,
    },
    {
      id: "INT_VENDOR_SYNC",
      name: "Vendor Master Sync Interface",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 4,
      skillRequired: ["ABAP", "IDoc", "MM AP"],
      sharable: true,
      riskLevel: "medium" as const,
    },
  ],
  forms: [
    {
      id: "FORM_INVOICE",
      name: "Invoice Print Form",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 3,
      skillRequired: ["Adobe Forms", "Smartforms", "FI AR"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "FORM_PO",
      name: "Purchase Order Print Form",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 3,
      skillRequired: ["Adobe Forms", "Smartforms", "MM"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "FORM_PAYMENT_ADVICE",
      name: "Payment Advice Form",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 2,
      skillRequired: ["Adobe Forms", "FI AP"],
      sharable: true,
      riskLevel: "low" as const,
    },
  ],
  conversions: [
    {
      id: "CONV_GL_DATA",
      name: "GL Opening Balance Migration",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 3,
      skillRequired: ["LSMW", "Data Migration", "FI GL"],
      sharable: false,
      riskLevel: "high" as const,
    },
    {
      id: "CONV_CUST_MASTER",
      name: "Customer Master Migration",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 4,
      skillRequired: ["LSMW", "Data Migration", "FI AR"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "CONV_VENDOR_MASTER",
      name: "Vendor Master Migration",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 4,
      skillRequired: ["LSMW", "Data Migration", "FI AP"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "CONV_MATERIAL_MASTER",
      name: "Material Master Migration",
      category: "technical" as const,
      stream: "RICEW" as const,
      baseEffort: 5,
      skillRequired: ["LSMW", "Data Migration", "MM"],
      sharable: true,
      riskLevel: "high" as const,
    },
  ],
};

// ========== WRAPPER DELIVERABLES ==========
export const WRAPPER_DELIVERABLES = {
  projectManagement: [
    {
      id: "PM_KICKOFF",
      name: "Project Kickoff Meeting",
      category: "wrapper" as const,
      stream: "PM" as const,
      baseEffort: 1,
      skillRequired: ["Project Management"],
      sharable: true,
      riskLevel: "low" as const,
    },
    {
      id: "PM_STATUS_REPORTING",
      name: "Weekly Status Reporting",
      category: "wrapper" as const,
      stream: "PM" as const,
      baseEffort: 0.5,
      skillRequired: ["Project Management"],
      sharable: true,
      riskLevel: "low" as const,
    },
    {
      id: "PM_RISK_MGMT",
      name: "Risk Management Activities",
      category: "wrapper" as const,
      stream: "PM" as const,
      baseEffort: 2,
      skillRequired: ["Project Management", "Risk Analysis"],
      sharable: true,
      riskLevel: "medium" as const,
    },
  ],
  changeManagement: [
    {
      id: "CM_STAKEHOLDER_ANALYSIS",
      name: "Stakeholder Analysis",
      category: "wrapper" as const,
      stream: "Change" as const,
      baseEffort: 2,
      skillRequired: ["Change Management"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "CM_COMM_PLAN",
      name: "Communication Plan Development",
      category: "wrapper" as const,
      stream: "Change" as const,
      baseEffort: 2,
      skillRequired: ["Change Management", "Communications"],
      sharable: true,
      riskLevel: "low" as const,
    },
    {
      id: "CM_TRAINING_PLAN",
      name: "Training Plan & Materials",
      category: "wrapper" as const,
      stream: "Change" as const,
      baseEffort: 5,
      skillRequired: ["Change Management", "Training Design"],
      sharable: true,
      riskLevel: "medium" as const,
    },
  ],
  basis: [
    {
      id: "BASIS_LANDSCAPE_SETUP",
      name: "System Landscape Setup",
      category: "wrapper" as const,
      stream: "Basis" as const,
      baseEffort: 3,
      skillRequired: ["SAP Basis", "HANA", "Infrastructure"],
      sharable: true,
      riskLevel: "high" as const,
    },
    {
      id: "BASIS_TRANSPORT_MGMT",
      name: "Transport Management Config",
      category: "wrapper" as const,
      stream: "Basis" as const,
      baseEffort: 2,
      skillRequired: ["SAP Basis", "Change Management"],
      sharable: true,
      riskLevel: "medium" as const,
    },
    {
      id: "BASIS_BACKUP_RECOVERY",
      name: "Backup & Recovery Setup",
      category: "wrapper" as const,
      stream: "Basis" as const,
      baseEffort: 2,
      skillRequired: ["SAP Basis", "Infrastructure"],
      sharable: true,
      riskLevel: "high" as const,
    },
  ],
  security: [
    {
      id: "SEC_ROLE_DESIGN",
      name: "Security Role Design",
      category: "wrapper" as const,
      stream: "Security" as const,
      baseEffort: 4,
      skillRequired: ["SAP Security", "GRC", "Authorization Concept"],
      sharable: true,
      riskLevel: "high" as const,
    },
    {
      id: "SEC_ROLE_BUILD",
      name: "Security Role Build & Test",
      category: "wrapper" as const,
      stream: "Security" as const,
      baseEffort: 6,
      skillRequired: ["SAP Security", "Role Maintenance"],
      sharable: false,
      riskLevel: "high" as const,
    },
    {
      id: "SEC_SOD_ANALYSIS",
      name: "Segregation of Duties Analysis",
      category: "wrapper" as const,
      stream: "Security" as const,
      baseEffort: 3,
      skillRequired: ["SAP Security", "GRC", "Compliance"],
      sharable: true,
      riskLevel: "high" as const,
    },
  ],
};

// ========== CATALOG AGGREGATION ==========
export const SAP_DELIVERABLES_CATALOG = {
  modules: [
    FINANCE_DELIVERABLES,
    MM_DELIVERABLES,
  ],
  technical: TECHNICAL_DELIVERABLES,
  wrapper: WRAPPER_DELIVERABLES,
};

// Helper function to get all tasks for selected modules
export function getTasksForModules(moduleIds: string[]): ConfigTask[] {
  const tasks: ConfigTask[] = [];
  
  moduleIds.forEach(moduleId => {
    const moduleTree = SAP_DELIVERABLES_CATALOG.modules.find(
      m => m.moduleId === moduleId
    );
    
    if (moduleTree) {
      moduleTree.subModules.forEach(subModule => {
        tasks.push(...subModule.configurations);
      });
    }
  });
  
  return tasks;
}

// Helper to get deliverable tree for a module
export function getDeliverableTree(moduleId: string): DeliverableTree | null {
  return SAP_DELIVERABLES_CATALOG.modules.find(
    m => m.moduleId === moduleId
  ) || null;
}