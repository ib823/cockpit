// @ts-nocheck
// Core type definitions

export interface Chip {
  id: string;
  type: ChipType;
  value: string;
  confidence: number;
  source: ChipSource;
  metadata?: {
    snippet?: string;
    context?: string;
    location?: string;
    evidence?: { snippet: string };
};
  timestamp: Date;
}

export type ChipType = 
  | 'country' 
  | 'employees' 
  | 'revenue' 
  | 'industry'
  | 'modules'
  | 'timeline'
  | 'integration'
  | 'compliance'
  | 'banking'
  | 'existing_system';

export type ChipSource = 
  | 'paste' 
  | 'upload' 
  | 'voice' 
  | 'manual' 
  | 'photo_ocr';

export interface Decision {
  id: string;
  type: 'single' | 'multiple' | 'range';
  category: string;
  question: string;
  options: string[];
  selected?: string | string[];
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface ScenarioPlan {
  id: string;
  name: string;
  phases: Phase[];
  totalEffort: number;
  totalCost: number;
  duration: number;
  risks: string[];
  assumptions: string[];
  confidence: number;
}

export interface Phase {
  id: string;
  name: string;
  category: string;
  startBusinessDay: number;
  workingDays: number;
  effort: number;
  color?: string;
  skipHolidays: boolean;
  dependencies: string[];
  status?: 'idle' | 'active' | 'complete';
  resources?: Resource[];
}

export interface Resource {
  id: string;
  role: string;
  allocation: number; // percentage
  region?: string;
  hourlyRate?: number;
}

export interface Override {
  id: string;
  targetId: string;
  type: 'effort' | 'duration' | 'resource';
  originalValue: any;
  newValue: any;
  reason?: string;
  timestamp: Date;
}

export interface Guardrail {
  id: string;
  type: 'min' | 'max' | 'ratio' | 'dependency';
  target: string;
  value: number | string;
  severity: 'warning' | 'error';
  message: string;
}

export interface ClientProfile {
  company: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  complexity: 'simple' | 'standard' | 'complex' | 'very_complex';
  timelinePreference: 'aggressive' | 'normal' | 'conservative';
  region: string;
  employees?: number;
  annualRevenue?: number;
}

export interface SAPPackage {
  effort?: number;
  id: string;
  name: string;
  description: string;
  modules: any[];
  baseEffort: number;
  dependencies: string[];
  category: 'core' | 'industry' | 'technical' | 'compliance';
}

export interface Holiday {
  date: string; // ISO date string
  name: string;
  country: string;
}

// Missing exports - add at end of file
export type ChipKind = 'country' | 'employees' | 'revenue' | 'modules' | 'timeline' | 'integration' | 'compliance' | 'industry';

export interface ChipParsed {
  value: string | number;
  unit?: string;
  evidence?: { snippet: string };
}

// Extend existing Chip interface
export interface ExtendedChip extends Chip {
  kind: ChipKind;
  raw: string;
  parsed: ChipParsed;
}

// Add missing properties to SAPPackage
export interface SAPPackageExtended extends SAPPackage {
  effort?: number;
  effort: number;
  complexity: number;
}

export interface RateCard {
  region: string;
  hourlyRate: number;
  currency: string;
}
