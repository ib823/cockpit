// Core type definitions for SAP Implementation Platform

// ==================== CHIP TYPES ====================
export type ChipKind =
  | "country"
  | "users"
  | "employees"
  | "revenue"
  | "modules"
  | "timeline"
  | "banking"
  | "integration"
  | "compliance"
  | "industry"
  | "existing_system"
  | "constraint"
  | "priority";

export interface Chip {
  id: string;
  kind: ChipKind;
  raw: string;
  parsed: {
    value: string | number;
    unit?: string;
    modifier?: string;
  };
  source: {
    location?: string;
    page?: number;
    timestamp?: string;
  };
  evidence?: {
    snippet: string;
    context: string;
    confidence: number;
  };
  validated: boolean;
}

// ==================== DECISION TYPES ====================
export interface Decision {
  id: string;
  type:
    | "module_combo"
    | "banking_path"
    | "integration_posture"
    | "sso_mode"
    | "fricew_target"
    | "rate_region"
    | "pricing_target";
  selected: string;
  rationale: string;
  impact: {
    effort: number;
    cost: number;
    risk: number;
  };
  timestamp: string;
}

// ==================== SCENARIO TYPES ====================
export interface ScenarioPlan {
  id: string;
  name: string;
  phases: Phase[];
  totals: {
    personDays: number;
    duration: number;
    cost: number;
    margin: number;
  };
  assumptions: string[];
  risks: Risk[];
}

export interface Phase {
  id: string;
  name: string;
  sapActivatePhase: "Prepare" | "Explore" | "Realize" | "Deploy" | "Run";
  stream: string;
  startDay: number;
  duration: number;
  effort: number;
  resources: Resource[];
  dependencies: string[];
  deliverables: string[];
}

export interface Resource {
  id: string;
  name?: string;
  role:
    | "Partner"
    | "Director"
    | "Senior Manager"
    | "Manager"
    | "Senior Consultant"
    | "Consultant"
    | "Analyst";
  allocation: number; // percentage
  region: "ABMY" | "ABSG" | "ABVN";
  hourlyRate: number;
}

export interface Risk {
  id: string;
  description: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  mitigation: string;
}

// ==================== CLIENT TYPES ====================
export interface ClientProfile {
  companyName: string;
  industry: string;
  size: "small" | "medium" | "large" | "enterprise";
  employees: number;
  annualRevenue: number;
  region: string;
  complexity: "standard" | "complex" | "extreme";
  maturity: "naive" | "basic" | "intermediate" | "advanced";
}

// ==================== SAP PACKAGE TYPES ====================
export interface SAPPackage {
  id: string;
  name: string;
  category:
    | "Finance Core"
    | "Finance Advanced"
    | "HR Core"
    | "Supply Chain"
    | "Technical"
    | "Compliance";
  baseEffort: number;
  dependencies: string[];
  criticalPath: boolean;
  modules: {
    id: string;
    name: string;
    effort: number;
    mandatory: boolean;
  }[];
}

// ==================== OVERRIDE TYPES ====================
export interface Override {
  id: string;
  phaseId: string;
  field: "effort" | "duration" | "resources" | "dependencies";
  original: any;
  modified: any;
  anchor?: "keep_pd" | "keep_fte" | "keep_duration";
  rationale?: string;
}

// ==================== GUARDRAIL TYPES ====================
export interface Guardrail {
  id: string;
  type: "testing_floor" | "deploy_window" | "fx_completeness" | "rate_anomaly";
  status: "pass" | "warn" | "block";
  message: string;
  action?: string;
}

// ==================== EXPORT TYPES ====================
export interface ExportData {
  version: string;
  timestamp: string;
  client: ClientProfile;
  chips: Chip[];
  decisions: Decision[];
  scenario: ScenarioPlan;
  overrides: Override[];
  guardrails: Guardrail[];
}
