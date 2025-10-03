// src/lib/presales-to-timeline-bridge.ts
import { detectEmployeeCount, detectMultiEntityFactors } from '@/lib/critical-patterns';
import { Chip, ClientProfile } from '@/types/core';

export interface TimelineConversionResult {
  profile: ClientProfile;
  selectedPackages: string[];
  totalEffort: number;
  phases: any[];
  appliedMultipliers: {
    entity: number;
    employee: number;
    integration: number;
    compliance: number;
    total: number;
  };
  warnings: string[];
}

export function convertPresalesToTimeline(
  chips: Chip[],
  decisions: any
): TimelineConversionResult {
  try {
    const profile = extractClientProfile(chips);
    const selectedPackages = mapModulesToPackages(chips);
    const baseEffort = selectedPackages.length * 60;
    const result = applyMultipliers(baseEffort, chips, decisions);
    
    console.log(`[Bridge] ✅ Conversion complete: ${selectedPackages.length} packages, ${result.totalEffort} PD total`);
    
    return {
      profile,
      selectedPackages,
      totalEffort: result.totalEffort,
      phases: [],
      appliedMultipliers: result.multipliers,
      warnings: result.warnings
    };
    
  } catch (error) {
    console.error('[Bridge] ❌ Conversion failed:', error);
    
    return {
      profile: getDefaultProfile(),
      selectedPackages: [],
      totalEffort: 0,
      phases: [],
      appliedMultipliers: {
        entity: 1.0,
        employee: 1.0,
        integration: 1.0,
        compliance: 1.0,
        total: 1.0
      },
      warnings: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

export function mapModulesToPackages(chips: Chip[]): string[] {
  const packages = new Set<string>();
  
  // Filter chips by type (Chip interface uses 'type' not 'kind')
  const moduleChips = chips.filter(c => 
    c.type === 'modules' || c.type === 'industry' // Some modules come through as industry
  );
  
  moduleChips.forEach(chip => {
    const moduleName = String(chip.value || '').toLowerCase();
    
    console.log(`[Bridge] Mapping module: "${moduleName}"`);
    
    if (moduleName.includes('finance') || moduleName.includes('fi')) {
      packages.add('Finance_1');
      packages.add('Finance_3');
      console.log('[Bridge] → Added Finance packages');
    }
    
    if (moduleName.includes('hr') || moduleName.includes('hcm') || moduleName.includes('human')) {
      packages.add('HCM_1');
      console.log('[Bridge] → Added HCM package');
    }
    
    if (moduleName.includes('supply') || moduleName.includes('scm') || 
        moduleName.includes('chain') || moduleName.includes('inventory')) {
      packages.add('SCM_1');
      console.log('[Bridge] → Added SCM package');
    }
    
    if (moduleName.includes('procurement') || moduleName.includes('purchasing') ||
        moduleName.includes('mm')) {
      packages.add('PROC_1');
      console.log('[Bridge] → Added Procurement package');
    }
    
    if (moduleName.includes('sales') || moduleName.includes('crm') || 
        moduleName.includes('customer')) {
      packages.add('CX_1');
      console.log('[Bridge] → Added CX package');
    }
  });
  
  const packageArray = Array.from(packages);
  console.log(`[Bridge] Total packages mapped: ${packageArray.length}`, packageArray);
  
  return packageArray;
}

export function extractClientProfile(chips: Chip[]): ClientProfile {
  const countryChip = chips.find(c => c.type === 'country');
  const industryChip = chips.find(c => c.type === 'industry');
  const employeeChip = chips.find(c => c.type === 'employees' || c.type === 'users');
  
  let size: ClientProfile['size'] = 'medium';
  let employees = 500;
  
  if (employeeChip) {
    const empValue = employeeChip.value;
    const empCount = typeof empValue === 'number' ? empValue : parseInt(String(empValue), 10);
    
    if (!isNaN(empCount)) {
      employees = empCount;
      if (empCount < 200) size = 'small';
      else if (empCount < 1000) size = 'medium';
      else if (empCount < 5000) size = 'large';
      else size = 'enterprise';
    }
  }
  
  let complexity: ClientProfile['complexity'] = 'standard';
  const integrations = chips.filter(c => c.type === 'integration').length;
  const compliance = chips.filter(c => c.type === 'compliance').length;
  
  if (integrations > 2 || compliance > 1) complexity = 'complex';
  if (size === 'enterprise') complexity = 'complex';
  
  let region: 'ABMY' | 'ABSG' | 'ABVN' = 'ABMY';
  if (countryChip) {
    const country = String(countryChip.value || '').toLowerCase();
    if (country.includes('singapore')) region = 'ABSG';
    else if (country.includes('vietnam')) region = 'ABVN';
  }
  
  return {
    company: String(countryChip?.value || ''),
    industry: String(industryChip?.value || 'manufacturing'),
    size,
    complexity,
    timelinePreference: 'normal',
    region,
    employees,
    annualRevenue: employees * 100000
  };
}

function applyMultipliers(
  baseEffort: number,
  chips: Chip[],
  decisions: any
): {
  totalEffort: number;
  multipliers: {
    entity: number;
    employee: number;
    integration: number;
    compliance: number;
    total: number;
  };
  warnings: string[];
} {
  const multipliers = {
    entity: 1.0,
    employee: 1.0,
    integration: 1.0,
    compliance: 1.0,
    total: 1.0
  };
  
  const warnings: string[] = [];
  
  // Reconstruct text from chip values
  const fullText = chips.map(c => String(c.value || '')).join(' ');
  
  const entityDetection = detectMultiEntityFactors(fullText);
  if (entityDetection.totalMultiplier > 1) {
    multipliers.entity = entityDetection.totalMultiplier;
    console.log(`[Bridge] 🔥 Multi-entity multiplier: ${entityDetection.totalMultiplier}x`);
    warnings.push(...entityDetection.warnings);
  }
  
  const employeeDetection = detectEmployeeCount(fullText);
  if (employeeDetection.count) {
    multipliers.employee = calculateEmployeeMultiplier(employeeDetection.count);
    console.log(`[Bridge] 👥 Employee multiplier (${employeeDetection.count} users): ${multipliers.employee}x`);
  }
  
  const integrationChips = chips.filter(c => c.type === 'integration');
  if (integrationChips.length > 0) {
    multipliers.integration = 1 + (integrationChips.length * 0.15);
    console.log(`[Bridge] 🔗 Integration multiplier (${integrationChips.length} systems): ${multipliers.integration}x`);
  }
  
  const complianceChips = chips.filter(c => c.type === 'compliance');
  if (complianceChips.length > 0) {
    multipliers.compliance = 1 + (complianceChips.length * 0.1);
    console.log(`[Bridge] ⚖️ Compliance multiplier (${complianceChips.length} requirements): ${multipliers.compliance}x`);
  }
  
  multipliers.total = Math.min(
    5.0,
    multipliers.entity * multipliers.employee * multipliers.integration * multipliers.compliance
  );
  
  const finalEffort = Math.round(baseEffort * multipliers.total);
  
  console.log(`[Bridge] 🎯 Final calculation: ${baseEffort} PD × ${multipliers.total.toFixed(2)}x = ${finalEffort} PD`);
  
  if (multipliers.total > 3.0) {
    warnings.push(`⚠️ Very high complexity multiplier (${multipliers.total.toFixed(1)}x). Consider phased rollout.`);
  }
  
  return {
    totalEffort: finalEffort,
    multipliers,
    warnings
  };
}

function calculateEmployeeMultiplier(count: number): number {
  if (count < 50) return 0.8;
  if (count < 200) return 1.0;
  if (count < 500) return 1.2;
  if (count < 1000) return 1.4;
  if (count < 2000) return 1.6;
  return 1.8;
}

function getDefaultProfile(): ClientProfile {
  return {
    company: '',
    industry: 'manufacturing',
    size: 'medium',
    complexity: 'standard',
    timelinePreference: 'normal',
    region: 'ABMY',
    employees: 500,
    annualRevenue: 50000000
  };
}