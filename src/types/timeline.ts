export interface Phase {
  id: string;
  name: string;
  category: string;
  startBusinessDay: number;
  workingDays: number;
  color?: string;
  selected?: boolean;
  dependencies?: string[];
  resources?: Resource[];
  description?: string;
  isCritical?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  allocation: number;
  region: string;
  hourlyRate: number;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface ClientProfile {
  company: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  complexity: 'simple' | 'standard' | 'complex';
  region: string;
}