// Core type definitions

export interface Chip {
  id?: string;
  type: ChipType;
  value: string | number;
  confidence: number;
  source: ChipSource;
  validated?: boolean;
  metadata?: {
    // Original fields
    multiplier?: number;
    snippet?: string;
    context?: string;
    location?: string;
    evidence?: {
      snippet: string;
    };

    // NEW FIELDS - Add these:
    note?: string;
    estimated?: boolean;
    unit?: string;
    impact?: string;
    range?: string;
    inferred?: boolean;
    originalEffort?: number;
    originalDuration?: number;
    adjustmentReason?: string;
  };
  timestamp?: Date;
}

export type ChipType =
  | "COUNTRY"
  | "EMPLOYEES"
  | "REVENUE"
  | "INDUSTRY"
  | "MODULES"
  | "TIMELINE"
  | "INTEGRATION"
  | "COMPLIANCE"
  | "BANKING"
  | "EXISTING_SYSTEM"
  | "LEGAL_ENTITIES"
  | "LOCATIONS"
  | "USERS"
  | "DATA_VOLUME"
  | "CURRENCIES"
  | "LANGUAGES"
  | "BUSINESS_UNITS"
  | "LEGACY_SYSTEMS";

export type ChipSource = "paste" | "upload" | "voice" | "manual" | "photo_ocr" | "test";

export interface Decision {
  id: string;
  type: "single" | "multiple" | "range";
  category: string;
  question: string;
  options: string[];
  selected?: string | string[];
  impact: "low" | "medium" | "high";
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

export interface Task {
  id: string;
  name: string;
  effortPercent: number; // Percentage of phase effort (0-100)
  effort?: number; // Calculated from phase effort * effortPercent
  daysPercent: number; // Percentage of phase duration (0-100)
  workingDays?: number; // Calculated from phase workingDays * daysPercent
  defaultRole: string; // Default role for this task
  description?: string;
}

export interface Phase {
  id: string;
  name: string;
  category: string;
  startBusinessDay: number;
  workingDays: number;
  effort?: number;
  color?: string;
  skipHolidays?: boolean;
  dependencies?: string[];
  status?: "idle" | "active" | "complete";
  resources?: Resource[];
  selected?: boolean;
  description?: string;
  isCritical?: boolean;
  progress?: number; // Optional progress percentage (0-100)
  startDate?: Date; // Computed from startBusinessDay
  endDate?: Date; // Computed from startBusinessDay + workingDays
  tasks?: Task[]; // Generic task breakdown
}

export interface Resource {
  id: string;
  name?: string;
  role: string;
  allocation: number;
  region: string;
  hourlyRate: number;
}

export interface Override {
  id: string;
  targetId: string;
  type: "effort" | "duration" | "resource";
  originalValue: any;
  newValue: any;
  reason?: string;
  timestamp: Date;
}

export interface Guardrail {
  id: string;
  type: "min" | "max" | "ratio" | "dependency";
  target: string;
  value: number | string;
  severity: "warning" | "error";
  message: string;
}

export interface ClientProfile {
  company: string;
  industry: string;
  size: "small" | "medium" | "large" | "enterprise";
  complexity: "simple" | "standard" | "complex" | "very_complex";
  timelinePreference?: "aggressive" | "normal" | "conservative";
  region: string;
  employees?: number;
  annualRevenue?: number;
}

export interface SAPPackage {
  id: string;
  name: string;
  description: string;
  modules?: any[];
  baseEffort?: number;
  effort?: number;
  complexity?: number;
  dependencies: string[];
  category: string;
  licensePrice?: { sgd: number; myr: number; vnd: number };
  criticalPath?: boolean;
}

export interface Holiday {
  date: string;
  name: string;
  country?: string;
}

export type ChipKind =
  | "country"
  | "employees"
  | "revenue"
  | "modules"
  | "timeline"
  | "integration"
  | "compliance"
  | "industry";

export interface ChipParsed {
  value: string | number;
  unit?: string;
  evidence?: { snippet: string };
}

export interface ExtendedChip extends Chip {
  kind: ChipKind;
  raw: string;
  parsed: ChipParsed;
}

export interface SAPPackageExtended extends SAPPackage {
  effort: number;
  complexity: number;
}

export interface RateCard {
  region: string;
  hourlyRate: number;
  currency: string;
}
