// Bridge between Presales and Timeline systems
import { Chip, ClientProfile, Decision } from '@/types/core';
import { generateBaselineScenario } from './scenario-generator';

export interface ConversionResult {
  profile: ClientProfile;
  selectedPackages: string[];
  success: boolean;
  errors: string[];
}

/**
 * Converts presales chips and decisions into timeline configuration
 */
export function convertPresalesToTimeline(
  chips: Chip[],
  decisions: Decision[]
): ConversionResult {
  try {
    // Generate baseline scenario from chips and decisions
    const scenario = generateBaselineScenario(chips, decisions);
    
    // Extract profile and packages
    const profile: ClientProfile = {
      company: (chips.find((c: any) => (c.kind || c.type) === 'country') as any)?.parsed?.value as string || '',
      industry: (chips.find((c: any) => (c.kind || c.type) === 'industry') as any)?.parsed?.value as string || 'manufacturing',
      size: 'medium', // Default, can be derived from employee count
      complexity: 'standard',
      timelinePreference: 'normal',
      region: (chips.find((c: any) => (c.kind || c.type) === 'country') as any)?.parsed?.value as string || 'ABMY'
    };

    // Extract selected packages from scenario
    const selectedPackages: string[] = [];
    
    return {
      profile,
      selectedPackages,
      success: true,
      errors: []
    };
  } catch (error) {
    return {
      profile: {
        company: '',
        industry: 'manufacturing',
        size: 'medium',
        complexity: 'standard',
        timelinePreference: 'normal',
        region: 'ABMY'
      },
      selectedPackages: [],
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Maps presales module chips to SAP package IDs
 */
export function mapModulesToPackages(chips: any[]): string[] {
  const packages = new Set<string>();

  chips
    .filter((c: any) => (c.kind || c.type) === 'modules')
    .forEach((chip: any) => {
      const module = (chip.raw || chip.value || '').toString().toLowerCase();
      
      // Map common modules to packages
      if (module.includes('finance') || module.includes('fi')) {
        packages.add('Finance_1');
        packages.add('Finance_3');
      }
      if (module.includes('hr') || module.includes('hcm')) {
        packages.add('HCM_1');
      }
      if (module.includes('supply') || module.includes('scm')) {
        packages.add('SCM_1');
      }
      if (module.includes('procurement')) {
        packages.add('PROC_1');
      }
      if (module.includes('sales') || module.includes('crm')) {
        packages.add('CX_1');
      }
    });
  
  return Array.from(packages);
}

/**
 * Extracts client profile from presales chips
 */
export function extractClientProfile(chips: any[]): ClientProfile {
  const countryChip = chips.find((c: any) => (c.kind || c.type) === 'country');
  const industryChip = chips.find((c: any) => (c.kind || c.type) === 'industry');
  const employeeChip = chips.find((c: any) => (c.kind || c.type) === 'employees' || (c.kind || c.type) === 'users');

  // Determine size from employee count
  let size: ClientProfile['size'] = 'medium';
  if (employeeChip && typeof (employeeChip.parsed?.value || employeeChip.value) === 'number') {
    const employees = employeeChip.parsed?.value || employeeChip.value;
    if (employees < 200) size = 'small';
    else if (employees < 1000) size = 'medium';
    else if (employees < 5000) size = 'large';
    else size = 'enterprise';
  }

  // Determine complexity from integration/compliance requirements
  let complexity: ClientProfile['complexity'] = 'standard';
  const integrations = chips.filter((c: any) => (c.kind || c.type) === 'integration').length;
  const compliance = chips.filter((c: any) => (c.kind || c.type) === 'compliance').length;

  if (integrations > 2 || compliance > 1) complexity = 'complex';
  if (size === 'enterprise') complexity = 'complex';

  return {
    company: (countryChip?.parsed?.value || countryChip?.value) as string || '',
    industry: ((industryChip?.parsed?.value || industryChip?.value) as string) || 'manufacturing',
    size,
    complexity,
    timelinePreference: 'normal',
    region: (countryChip?.parsed?.value || countryChip?.value) as string || 'ABMY'
  };
}