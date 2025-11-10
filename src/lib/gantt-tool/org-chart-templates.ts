import type { Resource, ResourceCategory, ResourceDesignation } from "@/types/gantt-tool";

/**
 * Organization Chart Template
 * Defines a complete organizational hierarchy structure with resources and reporting relationships
 */
export interface OrgChartTemplate {
  id: string;
  name: string;
  description: string;
  category: "sap-implementation" | "sap-activate" | "generic" | "custom";
  icon: string;
  resources: OrgChartTemplateResource[];
}

/**
 * Template Resource with placeholder fields that can be filled in
 */
export interface OrgChartTemplateResource {
  id: string;
  name: string; // Role name (e.g., "Steering Committee Member - Your Company MD")
  category: ResourceCategory;
  designation: ResourceDesignation;
  description: string;
  managerResourceId?: string; // Reports to (for hierarchy)
  isPlaceholder: boolean; // Indicates this should be filled with actual person details
  placeholderHint?: string; // e.g., "Enter your company's MD/CEO name"
  department?: string;
  projectRole?: string;

  // Default cost settings (can be overridden)
  rateType?: "hourly" | "daily" | "fixed";
  hourlyRate?: number;
  dailyRate?: number;
  currency?: string;
}

/**
 * Standard SAP Project Organization Chart Template
 * Based on typical SAP implementation project structure
 */
export const STANDARD_SAP_ORG_TEMPLATE: OrgChartTemplate = {
  id: "standard-sap-org",
  name: "Standard SAP Project Organization",
  description:
    "Complete SAP project org structure with Steering Committee, PM Team, and functional/technical teams",
  category: "sap-implementation",
  icon: "🏢",
  resources: [
    // LEVEL 1: STEERING COMMITTEE
    {
      id: "sc-your-company-md",
      name: "Steering Committee - Your Company MD/CEO",
      category: "pm",
      designation: "principal",
      description: "Executive sponsor and decision maker from your company",
      isPlaceholder: true,
      placeholderHint: "Enter your company's MD/CEO name",
      department: "Steering Committee",
      projectRole: "Executive Sponsor",
      rateType: "daily",
      currency: "USD",
    },
    {
      id: "sc-client-company-md",
      name: "Steering Committee - Client Company MD/CEO",
      category: "pm",
      designation: "principal",
      description: "Executive sponsor and decision maker from client company",
      isPlaceholder: true,
      placeholderHint: "Enter client company's MD/CEO name",
      department: "Steering Committee",
      projectRole: "Executive Sponsor (Client)",
      rateType: "daily",
      currency: "USD",
    },

    // LEVEL 2: PROJECT MANAGEMENT TEAM
    {
      id: "pm-program-director",
      name: "SAP Program Director",
      category: "pm",
      designation: "senior_manager",
      description: "Overall program leadership and delivery accountability",
      managerResourceId: "sc-your-company-md",
      isPlaceholder: true,
      placeholderHint: "Enter Program Director name",
      department: "Project Management",
      projectRole: "Program Director",
      rateType: "daily",
      dailyRate: 2000,
      currency: "USD",
    },
    {
      id: "pm-project-manager",
      name: "Senior SAP Project Manager",
      category: "pm",
      designation: "manager",
      description: "Day-to-day project management and coordination",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter Project Manager name",
      department: "Project Management",
      projectRole: "Project Manager",
      rateType: "daily",
      dailyRate: 1500,
      currency: "USD",
    },
    {
      id: "pm-pmo-lead",
      name: "PMO Lead",
      category: "pm",
      designation: "senior_consultant",
      description: "Project controls, reporting, and administrative support",
      managerResourceId: "pm-project-manager",
      isPlaceholder: true,
      placeholderHint: "Enter PMO Lead name",
      department: "Project Management",
      projectRole: "PMO Lead",
      rateType: "daily",
      dailyRate: 1200,
      currency: "USD",
    },

    // LEVEL 3: CHANGE MANAGEMENT TEAM
    {
      id: "cm-director",
      name: "OCM Director",
      category: "change",
      designation: "senior_manager",
      description: "Organizational change management strategy and execution",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter OCM Director name",
      department: "Change Management",
      projectRole: "OCM Director",
      rateType: "daily",
      dailyRate: 1600,
      currency: "USD",
    },
    {
      id: "cm-manager",
      name: "Senior OCM Manager",
      category: "change",
      designation: "manager",
      description: "Change management activities and stakeholder engagement",
      managerResourceId: "cm-director",
      isPlaceholder: true,
      placeholderHint: "Enter OCM Manager name",
      department: "Change Management",
      projectRole: "OCM Manager",
      rateType: "daily",
      dailyRate: 1300,
      currency: "USD",
    },
    {
      id: "cm-training-manager",
      name: "Training Manager",
      category: "change",
      designation: "senior_consultant",
      description: "Training strategy, materials development, and delivery",
      managerResourceId: "cm-director",
      isPlaceholder: true,
      placeholderHint: "Enter Training Manager name",
      department: "Change Management",
      projectRole: "Training Manager",
      rateType: "daily",
      dailyRate: 1200,
      currency: "USD",
    },
    {
      id: "cm-communications-lead",
      name: "Communications Lead",
      category: "change",
      designation: "consultant",
      description: "Internal communications and stakeholder messaging",
      managerResourceId: "cm-manager",
      isPlaceholder: true,
      placeholderHint: "Enter Communications Lead name",
      department: "Change Management",
      projectRole: "Communications Lead",
      rateType: "daily",
      dailyRate: 1000,
      currency: "USD",
    },

    // LEVEL 3: FUNCTIONAL TEAM
    {
      id: "func-architect",
      name: "SAP Solution Architect (Functional Lead)",
      category: "functional",
      designation: "senior_manager",
      description: "Overall functional architecture and module integration",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter Solution Architect name",
      department: "Functional Team",
      projectRole: "Solution Architect",
      rateType: "daily",
      dailyRate: 1800,
      currency: "USD",
    },
    {
      id: "func-fico-lead",
      name: "SAP FI/CO Lead",
      category: "functional",
      designation: "manager",
      description: "Finance and controlling module configuration",
      managerResourceId: "func-architect",
      isPlaceholder: true,
      placeholderHint: "Enter FI/CO Lead name",
      department: "Functional Team",
      projectRole: "FI/CO Lead",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "func-mm-sd-lead",
      name: "SAP MM/SD Lead",
      category: "functional",
      designation: "manager",
      description: "Materials management and sales/distribution configuration",
      managerResourceId: "func-architect",
      isPlaceholder: true,
      placeholderHint: "Enter MM/SD Lead name",
      department: "Functional Team",
      projectRole: "MM/SD Lead",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "func-hcm-consultant",
      name: "SAP HCM Consultant",
      category: "functional",
      designation: "senior_consultant",
      description: "Human capital management module configuration",
      managerResourceId: "func-architect",
      isPlaceholder: true,
      placeholderHint: "Enter HCM Consultant name",
      department: "Functional Team",
      projectRole: "HCM Consultant",
      rateType: "daily",
      dailyRate: 1300,
      currency: "USD",
    },
    {
      id: "func-pp-consultant",
      name: "SAP PP Consultant",
      category: "functional",
      designation: "consultant",
      description: "Production planning module configuration",
      managerResourceId: "func-architect",
      isPlaceholder: true,
      placeholderHint: "Enter PP Consultant name",
      department: "Functional Team",
      projectRole: "PP Consultant",
      rateType: "daily",
      dailyRate: 1200,
      currency: "USD",
    },

    // LEVEL 3: TECHNICAL TEAM
    {
      id: "tech-architect",
      name: "SAP Technical Architect",
      category: "technical",
      designation: "senior_manager",
      description: "Technical architecture, development standards, and integration",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter Technical Architect name",
      department: "Technical Team",
      projectRole: "Technical Architect",
      rateType: "daily",
      dailyRate: 1800,
      currency: "USD",
    },
    {
      id: "tech-abap-lead",
      name: "ABAP Development Lead",
      category: "technical",
      designation: "manager",
      description: "ABAP development team leadership and code quality",
      managerResourceId: "tech-architect",
      isPlaceholder: true,
      placeholderHint: "Enter ABAP Lead name",
      department: "Technical Team",
      projectRole: "ABAP Lead",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "tech-abap-dev-1",
      name: "Senior ABAP Developer",
      category: "technical",
      designation: "senior_consultant",
      description: "Custom ABAP development and enhancements",
      managerResourceId: "tech-abap-lead",
      isPlaceholder: true,
      placeholderHint: "Enter ABAP Developer name",
      department: "Technical Team",
      projectRole: "ABAP Developer",
      rateType: "daily",
      dailyRate: 1200,
      currency: "USD",
    },
    {
      id: "tech-integration-manager",
      name: "Integration Manager",
      category: "technical",
      designation: "manager",
      description: "System integration and middleware configuration",
      managerResourceId: "tech-architect",
      isPlaceholder: true,
      placeholderHint: "Enter Integration Manager name",
      department: "Technical Team",
      projectRole: "Integration Manager",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "tech-fiori-dev",
      name: "Fiori/UI5 Developer",
      category: "technical",
      designation: "consultant",
      description: "Fiori app development and UI enhancements",
      managerResourceId: "tech-architect",
      isPlaceholder: true,
      placeholderHint: "Enter Fiori Developer name",
      department: "Technical Team",
      projectRole: "Fiori Developer",
      rateType: "daily",
      dailyRate: 1100,
      currency: "USD",
    },

    // LEVEL 3: BASIS TEAM
    {
      id: "basis-manager",
      name: "SAP Basis Manager",
      category: "basis",
      designation: "manager",
      description: "SAP infrastructure, system administration, and performance",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter Basis Manager name",
      department: "Basis/Infrastructure",
      projectRole: "Basis Manager",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "basis-admin",
      name: "SAP Basis Administrator",
      category: "basis",
      designation: "senior_consultant",
      description: "System administration, transport management, and monitoring",
      managerResourceId: "basis-manager",
      isPlaceholder: true,
      placeholderHint: "Enter Basis Administrator name",
      department: "Basis/Infrastructure",
      projectRole: "Basis Administrator",
      rateType: "daily",
      dailyRate: 1200,
      currency: "USD",
    },
    {
      id: "basis-infra-specialist",
      name: "Infrastructure Specialist",
      category: "basis",
      designation: "consultant",
      description: "Database, OS, and cloud infrastructure management",
      managerResourceId: "basis-manager",
      isPlaceholder: true,
      placeholderHint: "Enter Infrastructure Specialist name",
      department: "Basis/Infrastructure",
      projectRole: "Infrastructure Specialist",
      rateType: "daily",
      dailyRate: 1100,
      currency: "USD",
    },

    // LEVEL 3: SECURITY & AUTHORIZATION TEAM
    {
      id: "sec-manager",
      name: "Security & Authorization Manager",
      category: "security",
      designation: "manager",
      description: "Security architecture, GRC, and authorization management",
      managerResourceId: "pm-program-director",
      isPlaceholder: true,
      placeholderHint: "Enter Security Manager name",
      department: "Security & Authorization",
      projectRole: "Security Manager",
      rateType: "daily",
      dailyRate: 1400,
      currency: "USD",
    },
    {
      id: "sec-grc-consultant",
      name: "SAP GRC Consultant",
      category: "security",
      designation: "senior_consultant",
      description: "GRC Access Control and compliance configuration",
      managerResourceId: "sec-manager",
      isPlaceholder: true,
      placeholderHint: "Enter GRC Consultant name",
      department: "Security & Authorization",
      projectRole: "GRC Consultant",
      rateType: "daily",
      dailyRate: 1300,
      currency: "USD",
    },
    {
      id: "sec-auth-specialist",
      name: "Authorization Specialist",
      category: "security",
      designation: "consultant",
      description: "Role design, authorization objects, and user provisioning",
      managerResourceId: "sec-manager",
      isPlaceholder: true,
      placeholderHint: "Enter Authorization Specialist name",
      department: "Security & Authorization",
      projectRole: "Authorization Specialist",
      rateType: "daily",
      dailyRate: 1100,
      currency: "USD",
    },

    // QUALITY ASSURANCE (reports to PM)
    {
      id: "qa-manager",
      name: "QA Manager",
      category: "qa",
      designation: "manager",
      description: "Quality assurance, test management, and UAT coordination",
      managerResourceId: "pm-project-manager",
      isPlaceholder: true,
      placeholderHint: "Enter QA Manager name",
      department: "Quality Assurance",
      projectRole: "QA Manager",
      rateType: "daily",
      dailyRate: 1300,
      currency: "USD",
    },
    {
      id: "qa-test-lead",
      name: "Test Lead",
      category: "qa",
      designation: "senior_consultant",
      description: "Test planning, execution, and defect management",
      managerResourceId: "qa-manager",
      isPlaceholder: true,
      placeholderHint: "Enter Test Lead name",
      department: "Quality Assurance",
      projectRole: "Test Lead",
      rateType: "daily",
      dailyRate: 1100,
      currency: "USD",
    },
  ],
};

/**
 * Simplified SAP Project Organization (smaller teams)
 */
export const SIMPLIFIED_SAP_ORG_TEMPLATE: OrgChartTemplate = {
  id: "simplified-sap-org",
  name: "Simplified SAP Project Organization",
  description: "Streamlined org structure for smaller SAP projects",
  category: "sap-implementation",
  icon: "🏪",
  resources: [
    // Steering Committee
    {
      id: "sc-sponsor",
      name: "Executive Sponsor",
      category: "pm",
      designation: "principal",
      description: "Executive oversight and governance",
      isPlaceholder: true,
      placeholderHint: "Enter Executive Sponsor name",
      department: "Steering Committee",
      projectRole: "Executive Sponsor",
    },
    // PM
    {
      id: "pm-lead",
      name: "SAP Project Manager",
      category: "pm",
      designation: "manager",
      description: "Overall project leadership",
      managerResourceId: "sc-sponsor",
      isPlaceholder: true,
      placeholderHint: "Enter Project Manager name",
      department: "Project Management",
      projectRole: "Project Manager",
    },
    // Functional
    {
      id: "func-lead",
      name: "Functional Lead",
      category: "functional",
      designation: "senior_consultant",
      description: "Functional configuration across modules",
      managerResourceId: "pm-lead",
      isPlaceholder: true,
      placeholderHint: "Enter Functional Lead name",
      department: "Functional",
      projectRole: "Functional Lead",
    },
    // Technical
    {
      id: "tech-lead",
      name: "Technical Lead",
      category: "technical",
      designation: "senior_consultant",
      description: "Technical development and integration",
      managerResourceId: "pm-lead",
      isPlaceholder: true,
      placeholderHint: "Enter Technical Lead name",
      department: "Technical",
      projectRole: "Technical Lead",
    },
    // Basis
    {
      id: "basis-lead",
      name: "Basis Administrator",
      category: "basis",
      designation: "consultant",
      description: "System administration and infrastructure",
      managerResourceId: "pm-lead",
      isPlaceholder: true,
      placeholderHint: "Enter Basis Administrator name",
      department: "Basis",
      projectRole: "Basis Administrator",
    },
    // Security
    {
      id: "sec-lead",
      name: "Security Consultant",
      category: "security",
      designation: "consultant",
      description: "Security and authorization management",
      managerResourceId: "pm-lead",
      isPlaceholder: true,
      placeholderHint: "Enter Security Consultant name",
      department: "Security",
      projectRole: "Security Consultant",
    },
    // Change
    {
      id: "cm-lead",
      name: "Change Manager",
      category: "change",
      designation: "consultant",
      description: "Change management and training",
      managerResourceId: "pm-lead",
      isPlaceholder: true,
      placeholderHint: "Enter Change Manager name",
      department: "Change Management",
      projectRole: "Change Manager",
    },
  ],
};

/**
 * All available org chart templates
 */
export const ORG_CHART_TEMPLATES: OrgChartTemplate[] = [
  STANDARD_SAP_ORG_TEMPLATE,
  SIMPLIFIED_SAP_ORG_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getOrgChartTemplate(id: string): OrgChartTemplate | undefined {
  return ORG_CHART_TEMPLATES.find((t) => t.id === id);
}

/**
 * Convert template resources to actual resources
 * Generates unique IDs and timestamps for new resources
 */
export function applyOrgChartTemplate(template: OrgChartTemplate): Resource[] {
  const now = new Date().toISOString();
  const idMap = new Map<string, string>();

  // First pass: create resources with new IDs
  const resources: Resource[] = template.resources.map((tr) => {
    const newId = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    idMap.set(tr.id, newId);

    return {
      id: newId,
      name: tr.name,
      category: tr.category,
      designation: tr.designation,
      description: tr.description,
      createdAt: now,
      email: "",
      department: tr.department,
      location: "",
      projectRole: tr.projectRole,
      rateType: tr.rateType || "daily",
      hourlyRate: tr.hourlyRate,
      dailyRate: tr.dailyRate,
      currency: tr.currency || "USD",
      utilizationTarget: 80,
      assignmentLevel: "both",
      isBillable: true,
      chargeRatePerHour: tr.dailyRate ? tr.dailyRate / 8 : 150,
    };
  });

  // Second pass: map manager relationships
  template.resources.forEach((tr, index) => {
    if (tr.managerResourceId && idMap.has(tr.managerResourceId)) {
      resources[index]!.managerResourceId = idMap.get(tr.managerResourceId);
    }
  });

  return resources;
}
