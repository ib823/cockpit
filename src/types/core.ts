// Core TypeScript interfaces for SAP Implementation Cockpit

export interface Phase {
  id: string;
  name: string;
  category: string;
  startBusinessDay: number;
  workingDays: number;
  effort: number;
  color: string;
  skipHolidays: boolean;
  dependencies: string[];
  status: 'idle' | 'active' | 'completed' | 'delayed';
  resources?: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  role: 'Partner' | 'Director' | 'Senior Manager' | 'Manager' | 'Senior Consultant' | 'Consultant' | 'Analyst';
  region: 'ABMY' | 'ABSG' | 'ABVN';
  allocation: number; // percentage
  hourlyRate?: number;
  includeOPE?: boolean;
}

export interface ClientProfile {
  company: string;
  industry: 'manufacturing' | 'retail' | 'services' | 'healthcare' | 'finance';
  size: 'small' | 'medium' | 'large' | 'enterprise';
  complexity: 'standard' | 'complex' | 'extreme';
  timelinePreference: 'relaxed' | 'normal' | 'aggressive';
  region: 'ABMY' | 'ABSG' | 'ABVN';
  employees: number;
  annualRevenue: number;
}

export interface SAPPackage {
  id: string;
  name: string;
  category: string;
  effort: number; // person-days
  dependencies: string[];
  description: string;
  modules: string[];
  complexity: number; // multiplier
}

export interface Holiday {
  date: string;
  name: string;
  country: string;
}

export interface RateCard {
  role: string;
  region: string;
  hourlyRate: number;
  includeOPE: boolean;
}

// Chip-related types from presales engine
export interface Chip {
  id: string;
  type: 'country' | 'entity' | 'users' | 'budget' | 'start' | 'golive' | 'bank' | 'bank_fmt' | 'eInvoice' | 'idp' | 'integration' | 'forms' | 'fricew_target' | 'module_combo' | 'fx' | 'rate_region';
  value: string;
  confidence: number;
  source: 'paste' | 'upload' | 'voice' | 'manual' | 'photo_ocr';
  evidence?: {
    snippet: string;
    context: string;
    location: string;
  };
  validated: boolean;
  validatedBy?: string;
  extractedAt: Date;
}

export interface Decision {
  id: string;
  type: string;
  value: string;
  rationale: string;
  confidence: number;
  madeBy: string;
  madeAt: Date;
}

export interface ScenarioPlan {
  id: string;
  name: string;
  chips: Chip[];
  decisions: Decision[];
  phases: Record<string, any>;
  resources: Resource[];
  cost: number;
  duration: number;
  risk: number;
}
