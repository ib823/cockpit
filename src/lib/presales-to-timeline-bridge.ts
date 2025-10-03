// Bridge between Presales and Timeline systems
import { detectEmployeeCount, detectMultiEntityFactors } from '@/lib/critical-patterns';
import { Chip, ClientProfile } from '@/types/core';

export interface ConversionResult {
  profile: ClientProfile;
  selectedPackages: string[];
  success: boolean;
  errors: string[];
}

/**
 * Converts presales chips and decisions into timeline configuration
 */
export interface TimelineConversionResult {
  phases: any[];  // Will be Phase[] from timeline types
  totalEffort: number;
  profile: ClientProfile;
  selectedPackages: string[];
}

/**
 * Converts presales chips and decisions into timeline configuration
 */
export function convertPresalesToTimeline(
  chips: Chip[],
  decisions: any  // Changed from Decision[] to any for now
): TimelineConversionResult {
  try {
    // Extract profile
    const profile = extractClientProfile(chips);
    
    // Map modules to packages
    const selectedPackages = mapModulesToPackages(chips);
    
    // Calculate base effort from packages
    const baseEffort = selectedPackages.length * 60; // 60 PD per package baseline
    
    // Apply multipliers
    const totalEffort = applyMultipliers(baseEffort, chips, decisions);
    
    // For now, return empty phases (Timeline will generate them)
    // In future, we can pre-generate phases here
    const phases: any[] = [];
    
    console.log(`[Bridge] Conversion complete: ${selectedPackages.length} packages, ${totalEffort} PD total`);
    
    return {
      phases,
      totalEffort,
      profile,
      selectedPackages
    };
  } catch (error) {
    console.error('[Bridge] Conversion failed:', error);
    
    // Return empty result on error
    return {
      phases: [],
      totalEffort: 0,
      profile: {
        company: '',
        industry: 'manufacturing',
        size: 'medium',
        complexity: 'standard',
        timelinePreference: 'normal',
        region: 'ABMY'
      },
      selectedPackages: []
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
      const moduleValue = (chip.raw || chip.value || '').toString().toLowerCase();

      // Map common modules to packages
      if (moduleValue.includes('finance') || moduleValue.includes('fi')) {
        packages.add('Finance_1');
        packages.add('Finance_3');
      }
      if (moduleValue.includes('hr') || moduleValue.includes('hcm')) {
        packages.add('HCM_1');
      }
      if (moduleValue.includes('supply') || moduleValue.includes('scm')) {
        packages.add('SCM_1');
      }
      if (moduleValue.includes('procurement')) {
        packages.add('PROC_1');
      }
      if (moduleValue.includes('sales') || moduleValue.includes('crm')) {
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

function applyMultipliers(
  baseEffort: number,
  chips: Chip[],
  _decisions: any
): number {
  let multiplier = 1.0;

  // Reconstruct full text from chips for pattern analysis
  const fullText = chips.map(c => c.metadata?.evidence?.snippet || c.value).join(' ');

  // 1. Multi-entity complexity
  const entityDetection = detectMultiEntityFactors(fullText);
  if (entityDetection.totalMultiplier > 1) {
    multiplier *= entityDetection.totalMultiplier;
    console.log(`[Bridge] Multi-entity multiplier: ${entityDetection.totalMultiplier}x`);

    // Log warnings to user
    entityDetection.warnings.forEach(w => console.warn(`[Bridge] ${w}`));
  }

  // 2. Employee count scaling (non-linear)
  const employeeDetection = detectEmployeeCount(fullText);
  if (employeeDetection.count) {
    const employeeMultiplier = calculateEmployeeMultiplier(employeeDetection.count);
    multiplier *= employeeMultiplier;
    console.log(`[Bridge] Employee multiplier (${employeeDetection.count} users): ${employeeMultiplier}x`);
  }

  // 3. Integration complexity
  const integrationChips = chips.filter(c => c.type === 'integration');
  if (integrationChips.length > 0) {
    const integrationMultiplier = 1 + (integrationChips.length * 0.15);
    multiplier *= integrationMultiplier;
    console.log(`[Bridge] Integration multiplier (${integrationChips.length} systems): ${integrationMultiplier}x`);
  }

  // 4. Compliance requirements
  const complianceChips = chips.filter(c => c.type === 'compliance');
  if (complianceChips.length > 0) {
    const complianceMultiplier = 1 + (complianceChips.length * 0.1);
    multiplier *= complianceMultiplier;
    console.log(`[Bridge] Compliance multiplier (${complianceChips.length} requirements): ${complianceMultiplier}x`);
  }

  // 5. Timeline pressure (if deadline is tight)
  const timelineChips = chips.filter(c => c.type === 'timeline');
  if (timelineChips.length > 0) {
    // TODO: Implement timeline pressure detection
    // For now, assume reasonable timeline
  }

  const finalEffort = Math.round(baseEffort * multiplier);
  console.log(`[Bridge] Final effort: ${baseEffort} PD × ${multiplier.toFixed(2)}x = ${finalEffort} PD`);

  return finalEffort;
}

function calculateEmployeeMultiplier(count: number): number {
  // Non-linear scaling based on user count
  if (count < 50) return 0.8;
  if (count < 200) return 1.0;
  if (count < 500) return 1.2;
  if (count < 1000) return 1.4;
  if (count < 2000) return 1.6;
  return 1.8;
}