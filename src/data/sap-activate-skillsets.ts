/**
 * SAP Activate Skillset Catalog
 * Maps SAP modules to required roles and skillsets per phase
 * Aligned with existing phase-generation.ts SAP Activate phases
 */

import { Resource } from "@/types/core";

export interface RoleRequirement {
  role: string;
  skillsets: string[];
  effortPercent: number; // % of phase effort
  allocationPercent: number; // % FTE (50 = half-time)
  criticality: 'must-have' | 'recommended' | 'optional';
}

export interface ModuleSkillsets {
  moduleId: string;
  moduleName: string;

  // Skillsets per SAP Activate phase
  Prepare: RoleRequirement[];
  Explore: RoleRequirement[];
  Realize: RoleRequirement[];
  Deploy: RoleRequirement[];
  Run: RoleRequirement[];
}

/**
 * SAP FICO (Financial Accounting & Controlling)
 */
export const FICO_SKILLSETS: ModuleSkillsets = {
  moduleId: 'sap-fico',
  moduleName: 'SAP FICO',

  Prepare: [
    {
      role: 'Solution Architect',
      skillsets: ['SAP S/4HANA', 'Financial Architecture', 'Integration Design'],
      effortPercent: 15,
      allocationPercent: 50,
      criticality: 'must-have'
    },
    {
      role: 'FICO Module Lead',
      skillsets: ['SAP FICO', 'Financial Processes', 'Chart of Accounts'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Business Analyst',
      skillsets: ['Finance Domain', 'Process Mapping', 'Requirements Gathering'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Project Manager',
      skillsets: ['SAP Projects', 'Stakeholder Management'],
      effortPercent: 15,
      allocationPercent: 50,
      criticality: 'recommended'
    }
  ],

  Explore: [
    {
      role: 'FICO Module Lead',
      skillsets: ['SAP FICO Configuration', 'Solution Design', 'Fit-Gap Analysis'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Senior FICO Consultant',
      skillsets: ['GL Configuration', 'AP/AR', 'Asset Accounting'],
      effortPercent: 35,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Technical Architect',
      skillsets: ['SAP Integration', 'Custom Objects', 'Data Model'],
      effortPercent: 20,
      allocationPercent: 75,
      criticality: 'recommended'
    }
  ],

  Realize: [
    {
      role: 'FICO Module Lead',
      skillsets: ['IMG Configuration', 'Testing Strategy'],
      effortPercent: 20,
      allocationPercent: 75,
      criticality: 'must-have'
    },
    {
      role: 'Senior FICO Consultant',
      skillsets: ['Full FICO Configuration', 'Unit Testing'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'ABAP Developer',
      skillsets: ['ABAP', 'Financial Reports', 'Forms (Adobe/Smartforms)'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'recommended'
    },
    {
      role: 'QA Analyst',
      skillsets: ['Integration Testing', 'Test Automation'],
      effortPercent: 15,
      allocationPercent: 75,
      criticality: 'recommended'
    }
  ],

  Deploy: [
    {
      role: 'FICO Module Lead',
      skillsets: ['Cutover Planning', 'Go-Live Support'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Data Migration Specialist',
      skillsets: ['Financial Data Migration', 'Data Validation', 'SAP LTMC'],
      effortPercent: 35,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Training Specialist',
      skillsets: ['End-User Training', 'Training Materials'],
      effortPercent: 20,
      allocationPercent: 75,
      criticality: 'recommended'
    },
    {
      role: 'Senior FICO Consultant',
      skillsets: ['Production Support', 'Issue Resolution'],
      effortPercent: 20,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Run: [
    {
      role: 'Support Analyst',
      skillsets: ['SAP FICO', 'Hypercare Support', 'Incident Management'],
      effortPercent: 50,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'FICO Module Lead',
      skillsets: ['Continuous Improvement', 'Performance Tuning'],
      effortPercent: 30,
      allocationPercent: 50,
      criticality: 'recommended'
    }
  ]
};

/**
 * SAP MM (Materials Management)
 */
export const MM_SKILLSETS: ModuleSkillsets = {
  moduleId: 'sap-mm',
  moduleName: 'SAP MM',

  Prepare: [
    {
      role: 'Solution Architect',
      skillsets: ['SAP S/4HANA', 'Procurement Architecture'],
      effortPercent: 15,
      allocationPercent: 50,
      criticality: 'must-have'
    },
    {
      role: 'MM Module Lead',
      skillsets: ['SAP MM', 'Procurement Processes', 'Material Master'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Business Analyst',
      skillsets: ['Procurement Domain', 'Vendor Management'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Explore: [
    {
      role: 'MM Module Lead',
      skillsets: ['SAP MM Configuration', 'Inventory Management'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Senior MM Consultant',
      skillsets: ['Purchasing', 'Invoice Verification', 'Material Valuation'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Realize: [
    {
      role: 'Senior MM Consultant',
      skillsets: ['Full MM Configuration', 'Integration Testing'],
      effortPercent: 45,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'ABAP Developer',
      skillsets: ['ABAP', 'Procurement Reports', 'Enhancements'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'recommended'
    },
    {
      role: 'QA Analyst',
      skillsets: ['Procurement Testing', 'MM-FICO Integration'],
      effortPercent: 20,
      allocationPercent: 75,
      criticality: 'recommended'
    }
  ],

  Deploy: [
    {
      role: 'MM Module Lead',
      skillsets: ['Cutover Planning', 'Master Data Migration'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Data Migration Specialist',
      skillsets: ['Material Master Migration', 'Vendor Master', 'Stock Data'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Run: [
    {
      role: 'Support Analyst',
      skillsets: ['SAP MM', 'Procurement Support'],
      effortPercent: 60,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ]
};

/**
 * SAP SD (Sales & Distribution)
 */
export const SD_SKILLSETS: ModuleSkillsets = {
  moduleId: 'sap-sd',
  moduleName: 'SAP SD',

  Prepare: [
    {
      role: 'Solution Architect',
      skillsets: ['SAP S/4HANA', 'Sales Architecture', 'Pricing Strategy'],
      effortPercent: 15,
      allocationPercent: 50,
      criticality: 'must-have'
    },
    {
      role: 'SD Module Lead',
      skillsets: ['SAP SD', 'Order-to-Cash Process', 'Pricing & Billing'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Business Analyst',
      skillsets: ['Sales Domain', 'Customer Management'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Explore: [
    {
      role: 'SD Module Lead',
      skillsets: ['SAP SD Configuration', 'Pricing Procedures', 'Output Determination'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Senior SD Consultant',
      skillsets: ['Sales Orders', 'Delivery', 'Billing', 'Credit Management'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Realize: [
    {
      role: 'Senior SD Consultant',
      skillsets: ['Full SD Configuration', 'SD-FICO Integration'],
      effortPercent: 45,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'ABAP Developer',
      skillsets: ['ABAP', 'Output Forms', 'User Exits', 'BAdIs'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'recommended'
    }
  ],

  Deploy: [
    {
      role: 'SD Module Lead',
      skillsets: ['Go-Live Planning', 'Order Book Migration'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Data Migration Specialist',
      skillsets: ['Customer Master', 'Material Master', 'Pricing Conditions'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Run: [
    {
      role: 'Support Analyst',
      skillsets: ['SAP SD', 'Order Management Support'],
      effortPercent: 60,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ]
};

/**
 * SAP Basis (Technical Foundation)
 */
export const BASIS_SKILLSETS: ModuleSkillsets = {
  moduleId: 'sap-basis',
  moduleName: 'SAP Basis',

  Prepare: [
    {
      role: 'Technical Architect',
      skillsets: ['SAP S/4HANA Architecture', 'Infrastructure Planning', 'Sizing'],
      effortPercent: 40,
      allocationPercent: 75,
      criticality: 'must-have'
    },
    {
      role: 'Basis Consultant',
      skillsets: ['SAP Basis', 'System Landscape', 'Security Concept'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Explore: [
    {
      role: 'Basis Consultant',
      skillsets: ['System Installation', 'Transport Management', 'User Administration'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Security Consultant',
      skillsets: ['SAP Security', 'Role Design', 'GRC'],
      effortPercent: 30,
      allocationPercent: 75,
      criticality: 'must-have'
    }
  ],

  Realize: [
    {
      role: 'Basis Consultant',
      skillsets: ['System Configuration', 'Performance Tuning', 'Monitoring Setup'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Security Consultant',
      skillsets: ['Role Development', 'Authorization Testing', 'SOD Analysis'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Deploy: [
    {
      role: 'Basis Consultant',
      skillsets: ['Production Setup', 'Go-Live Support', 'System Copy'],
      effortPercent: 50,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Security Consultant',
      skillsets: ['User Provisioning', 'Access Management'],
      effortPercent: 25,
      allocationPercent: 75,
      criticality: 'must-have'
    }
  ],

  Run: [
    {
      role: 'Basis Administrator',
      skillsets: ['System Monitoring', 'Incident Management', 'Patching'],
      effortPercent: 70,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ]
};

/**
 * SAP HCM (Human Capital Management)
 */
export const HCM_SKILLSETS: ModuleSkillsets = {
  moduleId: 'sap-hcm',
  moduleName: 'SAP HCM',

  Prepare: [
    {
      role: 'HCM Module Lead',
      skillsets: ['SAP HCM', 'HR Processes', 'Organizational Management'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Business Analyst',
      skillsets: ['HR Domain', 'Payroll Processes', 'Benefits Administration'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Explore: [
    {
      role: 'HCM Module Lead',
      skillsets: ['PA/OM Configuration', 'Time Management', 'Payroll Schema'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Senior HCM Consultant',
      skillsets: ['Personnel Administration', 'Time Management', 'Benefits'],
      effortPercent: 35,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Payroll Specialist',
      skillsets: ['SAP Payroll', 'Tax Configuration', 'Country-Specific Requirements'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Realize: [
    {
      role: 'Senior HCM Consultant',
      skillsets: ['Full HCM Configuration', 'ESS/MSS'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Payroll Specialist',
      skillsets: ['Payroll Testing', 'Parallel Payroll Runs'],
      effortPercent: 30,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'ABAP Developer',
      skillsets: ['ABAP HR', 'HR Forms', 'Payroll Reports'],
      effortPercent: 20,
      allocationPercent: 75,
      criticality: 'recommended'
    }
  ],

  Deploy: [
    {
      role: 'HCM Module Lead',
      skillsets: ['HR Cutover', 'Historical Data Migration'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Data Migration Specialist',
      skillsets: ['Employee Master Data', 'Org Structure', 'Historical Payroll'],
      effortPercent: 40,
      allocationPercent: 100,
      criticality: 'must-have'
    },
    {
      role: 'Payroll Specialist',
      skillsets: ['First Live Payroll', 'Payroll Validation'],
      effortPercent: 25,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ],

  Run: [
    {
      role: 'Support Analyst',
      skillsets: ['SAP HCM', 'HR Support', 'Payroll Incident Management'],
      effortPercent: 60,
      allocationPercent: 100,
      criticality: 'must-have'
    }
  ]
};

/**
 * Master catalog - all module skillsets
 */
export const SAP_ACTIVATE_SKILLSETS: Record<string, ModuleSkillsets> = {
  'sap-fico': FICO_SKILLSETS,
  'sap-mm': MM_SKILLSETS,
  'sap-sd': SD_SKILLSETS,
  'sap-basis': BASIS_SKILLSETS,
  'sap-hcm': HCM_SKILLSETS,
};

/**
 * Get skillset requirements for a specific SAP module and phase
 */
export function getSkillsetRequirements(
  moduleId: string,
  phase: 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run'
): RoleRequirement[] {
  const moduleSkillsets = SAP_ACTIVATE_SKILLSETS[moduleId];
  if (!moduleSkillsets) {
    console.warn(`No skillsets defined for module: ${moduleId}`);
    return [];
  }

  return moduleSkillsets[phase] || [];
}

/**
 * Generate resources with skillsets for a phase
 * This enhances the existing generateResourceRequirements() function
 */
export function generateResourcesWithSkillsets(
  moduleId: string,
  phase: 'Prepare' | 'Explore' | 'Realize' | 'Deploy' | 'Run',
  phaseEffort: number,
  region: string,
  rateCard: Record<string, number>
): Resource[] {
  const requirements = getSkillsetRequirements(moduleId, phase);

  return requirements.map((req, index) => ({
    id: `${moduleId}_${phase}_${req.role}_${index}`,
    name: req.role,
    role: req.role,
    allocation: req.allocationPercent,
    region: region,
    hourlyRate: rateCard[req.role.toLowerCase().replace(/\s+/g, '_')] || 100,
  }));
}
