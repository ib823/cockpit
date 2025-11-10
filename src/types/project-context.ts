// src/types/project-context.ts

export interface BusinessContext {
  clientName: string;
  projectCode: string;

  // Organization
  numberOfUsers: number;
  numberOfLegalEntities: number;
  numberOfCountries: number;
  numberOfSites: number;
  numberOfPlants: number;

  // Financial
  annualRevenue: number;
  currency: "USD" | "EUR" | "MYR" | "SGD";

  // Project Characteristics
  complexity: "standard" | "high" | "extreme";
  goLiveQuarter: string; // e.g., "Q4 2025"
  timelinePressure: "relaxed" | "normal" | "aggressive";

  // Geography
  countries: Country[];
  regions: string[];
}

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  legalEntities: number;
  users: number;
  compliance: string[]; // e.g., ["MyInvois", "IRAS"]
}

export interface StrategyDriver {
  id: string;
  category: "efficiency" | "compliance" | "growth" | "modernization";
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  kpis: string[];
}

export interface ExternalSystem {
  id: string;
  name: string;
  category: "crm" | "wms" | "banking" | "tax" | "hr" | "legacy" | "other";
  vendor: string;
  integrationType: "real-time" | "batch" | "manual";
  frequency?: string; // e.g., "hourly", "daily"
  dataVolume?: string; // e.g., "10K records/day"
  interfaces: Integration[];
}

export interface Integration {
  id: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  protocol: "REST" | "SOAP" | "RFC" | "IDoc" | "OData" | "SFTP" | "File";
  direction: "inbound" | "outbound" | "bidirectional";
  frequency: "real-time" | "hourly" | "daily" | "weekly" | "monthly";
  complexity: "simple" | "medium" | "complex";
  estimatedEffort: number; // PD
}

export interface SAPSupplement {
  id: string;
  name: string;
  category: "analytics" | "procurement" | "hr" | "integration" | "bpm";
  edition: string; // e.g., "Ariba Sourcing", "SuccessFactors Employee Central"
  effort: number; // PD
  licenseRequired: boolean;
}

export const DEFAULT_BUSINESS_CONTEXT: BusinessContext = {
  clientName: "Example Corp",
  projectCode: "SAP-2025-001",
  numberOfUsers: 1250,
  numberOfLegalEntities: 6,
  numberOfCountries: 4,
  numberOfSites: 12,
  numberOfPlants: 8,
  annualRevenue: 500000000, // $500M
  currency: "USD",
  complexity: "high",
  goLiveQuarter: "Q4 2025",
  timelinePressure: "aggressive",
  countries: [
    {
      code: "MY",
      name: "Malaysia",
      legalEntities: 2,
      users: 450,
      compliance: ["MyInvois", "SST"],
    },
    {
      code: "SG",
      name: "Singapore",
      legalEntities: 2,
      users: 350,
      compliance: ["IRAS", "GST"],
    },
    {
      code: "TH",
      name: "Thailand",
      legalEntities: 1,
      users: 250,
      compliance: ["e-Tax"],
    },
    {
      code: "VN",
      name: "Vietnam",
      legalEntities: 1,
      users: 200,
      compliance: ["e-Invoice"],
    },
  ],
  regions: ["APAC"],
};

export const DEFAULT_STRATEGY_DRIVERS: StrategyDriver[] = [
  {
    id: "harmonize",
    category: "efficiency",
    description: "Harmonize processes across 6 legal entities",
    priority: "critical",
    kpis: ["Process standardization: 80%", "Shared services center utilization: 90%"],
  },
  {
    id: "visibility",
    category: "efficiency",
    description: "Real-time visibility into global operations",
    priority: "high",
    kpis: ["Dashboard refresh: <5 min", "Report generation: <30 sec"],
  },
  {
    id: "modernize",
    category: "modernization",
    description: "Modernize from legacy ERP (AS/400)",
    priority: "critical",
    kpis: ["System uptime: 99.9%", "User satisfaction: >85%"],
  },
  {
    id: "growth",
    category: "growth",
    description: "Enable growth into new markets (Vietnam, Thailand)",
    priority: "high",
    kpis: ["Time to add new entity: <3 months", "Localization coverage: 100%"],
  },
  {
    id: "compliance",
    category: "compliance",
    description: "Compliance with e-invoicing regulations (Malaysia, Singapore)",
    priority: "critical",
    kpis: ["e-Invoice submission: 100%", "Audit trail: Complete"],
  },
];

export const DEFAULT_EXTERNAL_SYSTEMS: ExternalSystem[] = [
  {
    id: "salesforce",
    name: "Salesforce CRM",
    category: "crm",
    vendor: "Salesforce",
    integrationType: "real-time",
    interfaces: [
      {
        id: "sf-sd-orders",
        name: "Sales Orders Sync",
        sourceSystem: "Salesforce",
        targetSystem: "SAP SD",
        protocol: "REST",
        direction: "bidirectional",
        frequency: "real-time",
        complexity: "medium",
        estimatedEffort: 8,
      },
      {
        id: "sf-sd-customers",
        name: "Customer Master Sync",
        sourceSystem: "Salesforce",
        targetSystem: "SAP SD",
        protocol: "REST",
        direction: "bidirectional",
        frequency: "hourly",
        complexity: "simple",
        estimatedEffort: 5,
      },
    ],
  },
  {
    id: "concur",
    name: "Concur Expense",
    category: "other",
    vendor: "SAP",
    integrationType: "batch",
    frequency: "daily",
    interfaces: [
      {
        id: "concur-fi",
        name: "Expense Report Posting",
        sourceSystem: "Concur",
        targetSystem: "SAP FI",
        protocol: "OData",
        direction: "inbound",
        frequency: "daily",
        complexity: "simple",
        estimatedEffort: 4,
      },
    ],
  },
  {
    id: "wms",
    name: "Blue Yonder WMS",
    category: "wms",
    vendor: "Blue Yonder",
    integrationType: "real-time",
    interfaces: [
      {
        id: "wms-mm-inventory",
        name: "Inventory Movements",
        sourceSystem: "WMS",
        targetSystem: "SAP MM",
        protocol: "IDoc",
        direction: "bidirectional",
        frequency: "real-time",
        complexity: "complex",
        estimatedEffort: 12,
      },
    ],
  },
  {
    id: "banking",
    name: "Bank Portal",
    category: "banking",
    vendor: "Multiple Banks",
    integrationType: "batch",
    frequency: "daily",
    interfaces: [
      {
        id: "bank-fi-statements",
        name: "Bank Statement Import (CAMT053)",
        sourceSystem: "Bank Portal",
        targetSystem: "SAP FI",
        protocol: "SFTP",
        direction: "inbound",
        frequency: "daily",
        complexity: "medium",
        estimatedEffort: 6,
      },
    ],
  },
  {
    id: "tax-platforms",
    name: "e-Invoice Platforms",
    category: "tax",
    vendor: "Government Agencies",
    integrationType: "real-time",
    interfaces: [
      {
        id: "tax-myinvois",
        name: "Malaysia MyInvois",
        sourceSystem: "SAP SD",
        targetSystem: "MyInvois API",
        protocol: "REST",
        direction: "outbound",
        frequency: "real-time",
        complexity: "complex",
        estimatedEffort: 10,
      },
      {
        id: "tax-iras",
        name: "Singapore IRAS",
        sourceSystem: "SAP SD",
        targetSystem: "IRAS API",
        protocol: "REST",
        direction: "outbound",
        frequency: "real-time",
        complexity: "medium",
        estimatedEffort: 8,
      },
    ],
  },
  {
    id: "legacy-as400",
    name: "Legacy AS/400",
    category: "legacy",
    vendor: "IBM",
    integrationType: "batch",
    frequency: "daily",
    interfaces: [
      {
        id: "as400-cutover",
        name: "Historical Data Migration",
        sourceSystem: "AS/400",
        targetSystem: "SAP S/4HANA",
        protocol: "File",
        direction: "inbound",
        frequency: "daily",
        complexity: "complex",
        estimatedEffort: 15,
      },
    ],
  },
];

export const DEFAULT_SAP_SUPPLEMENTS: SAPSupplement[] = [
  {
    id: "ariba",
    name: "SAP Ariba",
    category: "procurement",
    edition: "Sourcing & Procurement",
    effort: 15,
    licenseRequired: true,
  },
  {
    id: "successfactors",
    name: "SuccessFactors",
    category: "hr",
    edition: "Employee Central",
    effort: 20,
    licenseRequired: true,
  },
  {
    id: "analytics-cloud",
    name: "SAP Analytics Cloud",
    category: "analytics",
    edition: "Planning & Analytics",
    effort: 12,
    licenseRequired: true,
  },
  {
    id: "btp",
    name: "BTP Integration Suite",
    category: "integration",
    edition: "Cloud Integration",
    effort: 18,
    licenseRequired: true,
  },
  {
    id: "signavio",
    name: "SAP Signavio",
    category: "bpm",
    edition: "Process Intelligence",
    effort: 8,
    licenseRequired: true,
  },
];
