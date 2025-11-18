// app/architecture/types.ts
// Architecture Types - Clear AS-IS vs TO-BE Separation

export interface ProjectInfo {
  clientName: string;
  projectName: string;
  industry: string;
  description: string;
}

// ===== STEP 1: BUSINESS CONTEXT (Neutral - applies to both AS-IS and TO-BE) =====

export interface Actor {
  id: string;
  name: string;           // "Plant Manager" or "Loan Officer" or "Store Manager"
  role: string;           // "Operations" or "Credit Processing" or "Retail"
  activities: string[];   // Free text array
}

export interface ExternalSystem {
  id: string;
  name: string;           // "Government Portal" or "Bank" or "Supplier System"
  type: string;           // "Government System" or "Banking" or "B2B Partner"
  purpose: string;        // Free text description
  integration: string;    // "XML via SFTP" or "REST API" or "Batch file"
}

// ===== STEP 2: AS-IS LANDSCAPE (Current State) =====

export interface AsIsLandscape {
  sapModules: ModuleArea[];       // Current SAP modules (if any)
  nonSAPSystems: NonSAPSystem[];  // Current legacy/non-SAP systems
  integrations: Integration[];     // Current integrations
  database?: Database;             // Current database
}

export interface NonSAPSystem {
  id: string;
  name: string;           // "Legacy ERP" or "Custom Inventory System"
  type: string;           // "ERP" or "WMS" or "MES" or "CRM"
  vendor: string;         // "Oracle" or "In-house" or "Microsoft"
  purpose: string;        // What it does
  modules?: string[];     // Sub-components if applicable
}

// ===== STEP 3: TO-BE SOLUTION (Future State) =====

export interface ToBeSolution {
  sapModules: ModuleArea[];       // Planned SAP modules
  cloudSystems: CloudSystem[];    // SAP BTP, Ariba, SuccessFactors, etc.
  integrations: Integration[];     // New integrations
  database?: Database;             // Future database
  integrationLayer?: IntegrationLayer; // SAP BTP, Boomi, MuleSoft
}

export interface CloudSystem {
  id: string;
  name: string;           // "SAP Ariba" or "SAP SuccessFactors" or "SAP Analytics Cloud"
  type: 'BTP' | 'Ariba' | 'SuccessFactors' | 'Concur' | 'Fieldglass' | 'Analytics Cloud' | 'Other';
  modules: string[];      // ["Procurement", "Supplier Management"]
  purpose: string;        // What it will do
}

// ===== STEP 4: INTEGRATION BRIDGE (How TO-BE connects to AS-IS) =====

export interface IntegrationBridge {
  connections: BridgeConnection[];
}

export interface BridgeConnection {
  id: string;
  name: string;           // "ERP to SAP S/4HANA Migration"
  asIsSource: string;     // Reference to AS-IS system
  toBeTarget: string;     // Reference to TO-BE system
  method: string;         // "Data Migration" or "Real-time Sync" or "Batch Transfer"
  dataType: string;       // "Master Data" or "Transactional Data"
  strategy: string;       // "Phased cutover" or "Big bang" or "Parallel run"
  notes: string;          // Additional details
}

// ===== SHARED TYPES =====

export interface ModuleArea {
  id: string;
  area: string;           // "Finance & Controlling" or "Supply Chain"
  modules: Module[];
}

export interface Module {
  id: string;
  code: string;           // "FI" or "MM" or "SD"
  name: string;           // "Financial Accounting" or "Materials Management"
  scope: string;          // "GL, AP, AR" or "Procurement, Inventory"
}

export interface Integration {
  id: string;
  name: string;           // "Weighbridge Interface" or "Payment Gateway"
  source: string;         // System name
  target: string;         // System name
  method: string;         // "XML", "REST API", "RFC", "IDoc"
  frequency: string;      // "Real-time", "Hourly", "Daily"
  dataType: string;       // "Goods Receipt" or "Payment Transaction"
  volume: string;         // "3,500/month" or "100K/day"
  direction: string;      // "Inbound" or "Outbound" or "Bidirectional"
}

export interface Database {
  type?: string;           // "SAP HANA" or "Oracle" or "DB2"
  size?: string;           // "2TB RAM, 10TB storage"
  notes?: string;          // Additional details
}

export interface IntegrationLayer {
  middleware?: string;     // "SAP BTP" or "Dell Boomi" or "MuleSoft"
  description?: string;    // Free text
}

// ===== STEP 5: DEPLOYMENT ARCHITECTURE =====

export interface Environment {
  id: string;
  name: string;           // "Production" or "QA" or "Development"
  servers: Server[];
  notes: string;
}

export interface Server {
  id: string;
  type: string;           // "Application Server" or "Database Server"
  count: number;          // 3
  specs: string;          // "64 vCPU, 256GB RAM"
  additionalInfo: string; // "Load balanced cluster" or "HA setup"
}

export interface Infrastructure {
  deploymentModel: string;  // "On-premise" or "SAP Cloud" or "AWS IaaS"
  location: string;         // "Client Data Center, Kuala Lumpur"
  backup: string;           // "Daily incremental, weekly full"
  dr: string;               // "Hot standby site, 4-hour RTO"
  network: string;          // "1Gbps dedicated, site-to-site VPN"
}

// ===== STEP 6: SECURITY & SIZING =====

export interface AuthMethod {
  id: string;
  method: string;         // "Single Sign-On" or "Multi-Factor Auth"
  provider: string;       // "Active Directory" or "Okta"
  details: string;        // "SAML 2.0 integration"
}

export interface SecurityControl {
  id: string;
  layer: string;          // "Perimeter" or "Application" or "Data"
  controls: string[];     // ["Firewall", "IPS/IDS"]
}

export interface SecurityCompliance {
  standards: string[];    // ["ISO 27001", "PDPA", "PCI-DSS"]
  notes: string;
}

export interface Phase {
  id: string;
  name: string;           // "Phase 1 - Pilot"
  users: number;          // 51
  timeline: string;       // "Months 1-6"
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: string;           // "Purchase Orders" or "Invoices"
  volume: string;         // "750/month" or "10K/day"
}

export interface Scalability {
  approach: string;       // "Horizontal scaling of app servers"
  limits: string;         // "Up to 500 concurrent users"
}

// ===== MASTER DATA STRUCTURE =====

export interface ArchitectureData {
  // Project Info
  projectInfo: ProjectInfo;

  // Step 1: Business Context
  actors: Actor[];
  externalSystems: ExternalSystem[];

  // Step 2: AS-IS Landscape (Current State)
  asIs: AsIsLandscape;

  // Step 3: TO-BE Solution (Future State)
  toBe: ToBeSolution;

  // Step 4: Integration Bridge (AS-IS → TO-BE)
  bridge: IntegrationBridge;

  // Step 5: Deployment Architecture
  environments: Environment[];
  infrastructure: Infrastructure;

  // Step 6: Security & Sizing
  authMethods: AuthMethod[];
  securityControls: SecurityControl[];
  compliance: SecurityCompliance;
  phases: Phase[];
  scalability: Scalability;
}
