// src/lib/presales-to-timeline-bridge.ts
// Complete bridge between Presales chips and Timeline configuration

import { detectEmployeeCount, detectMultiEntityFactors } from '@/lib/critical-patterns';
import { Chip, ClientProfile } from '@/types/core';

export interface TimelineConversionResult {
  profile: ClientProfile;
  selectedPackages: string[];
  totalEffort: number;
  phases: any[]; // Empty for now, Timeline will generate from packages
  appliedMultipliers: {
    entity: number;
    employee: number;
    integration: number;
    compliance: number;
    total: number;
  };
  warnings: string[];
}

/**
 * Converts presales chips into timeline configuration
 * This is the critical bridge that enables "3-minute baseline" generation
 */
export function convertPresalesToTimeline(
  chips: Chip[],
  decisions: any
): TimelineConversionResult {
  try {
    // Extract client profile from chips
    const profile = extractClientProfile(chips);
    
    // Map modules to SAP packages
    const selectedPackages = mapModulesToPackages(chips);
    
    // Calculate base effort (60 PD per package baseline)
    const baseEffort = selectedPackages.length * 60;
    
    // Apply complexity multipliers
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

/**
 * Maps presales module chips to SAP package IDs
 * CRITICAL: This is where "Finance" becomes "Finance_1", "Finance_3"
 */
export function mapModulesToPackages(chips: Chip[]): string[] {
  const packages = new Set<string>();
  
  // Get all module chips (handles both 'kind' and 'type' for backwards compatibility)
  const moduleChips = chips.filter(c => 
    (c.kind === 'modules' || c.type === 'modules') ||
    (c.kind === 'module' || c.type === 'module')
  );
  
  moduleChips.forEach(chip => {
    // Extract module name (handles various data structures)
    const moduleName = (
      chip.value || 
      chip.raw || 
      chip.parsed?.value || 
      ''
    ).toString().toLowerCase();
    
    console.log(`[Bridge] Mapping module: "${moduleName}"`);
    
    // Finance mappings
    if (moduleName.includes('finance') || moduleName.includes('fi')) {
      packages.add('Finance_1');  // GL, AP, AR
      packages.add('Finance_3');  // Asset Accounting
      console.log('[Bridge] → Added Finance packages');
    }
    
    // HR/HCM mappings
    if (moduleName.includes('hr') || moduleName.includes('hcm') || moduleName.includes('human')) {
      packages.add('HCM_1');  // Core HR
      console.log('[Bridge] → Added HCM package');
    }
    
    // Supply Chain mappings
    if (moduleName.includes('supply') || moduleName.includes('scm') || 
        moduleName.includes('chain') || moduleName.includes('inventory')) {
      packages.add('SCM_1');  // Basic SCM
      console.log('[Bridge] → Added SCM package');
    }
    
    // Procurement mappings
    if (moduleName.includes('procurement') || moduleName.includes('purchasing') ||
        moduleName.includes('mm')) {
      packages.add('PROC_1');  // Procurement
      console.log('[Bridge] → Added Procurement package');
    }
    
    // Sales/CRM mappings
    if (moduleName.includes('sales') || moduleName.includes('crm') || 
        moduleName.includes('customer')) {
      packages.add('CX_1');  // Customer Experience
      console.log('[Bridge] → Added CX package');
    }
  });
  
  const packageArray = Array.from(packages);
  console.log(`[Bridge] Total packages mapped: ${packageArray.length}`, packageArray);
  
  return packageArray;
}

/**
 * Extracts client profile from presales chips
 */
export function extractClientProfile(chips: Chip[]): ClientProfile {
  const countryChip = chips.find(c => 
    (c.kind === 'country' || c.type === 'country')
  );
  
  const industryChip = chips.find(c => 
    (c.kind === 'industry' || c.type === 'industry')
  );
  
  const employeeChip = chips.find(c => 
    (c.kind === 'employees' || c.type === 'employees') ||
    (c.kind === 'users' || c.type === 'users')
  );
  
  // Determine size from employee count
  let size: ClientProfile['size'] = 'medium';
  let employees = 500; // Default
  
  if (employeeChip) {
    const empValue = employeeChip.parsed?.value || employeeChip.value;
    const empCount = typeof empValue === 'number' ? empValue : parseInt(String(empValue), 10);
    
    if (!isNaN(empCount)) {
      employees = empCount;
      if (empCount < 200) size = 'small';
      else if (empCount < 1000) size = 'medium';
      else if (empCount < 5000) size = 'large';
      else size = 'enterprise';
    }
  }
  
  // Determine complexity from integration/compliance requirements
  let complexity: ClientProfile['complexity'] = 'standard';
  const integrations = chips.filter(c => 
    (c.kind === 'integration' || c.type === 'integration')
  ).length;
  const compliance = chips.filter(c => 
    (c.kind === 'compliance' || c.type === 'compliance')
  ).length;
  
  if (integrations > 2 || compliance > 1) complexity = 'complex';
  if (size === 'enterprise') complexity = 'complex';
  
  // Extract region from country
  let region: 'ABMY' | 'ABSG' | 'ABVN' = 'ABMY';
  if (countryChip) {
    const country = String(countryChip.value || countryChip.parsed?.value || '').toLowerCase();
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
    annualRevenue: employees * 100000 // Rough estimate
  };
}

/**
 * Apply complexity multipliers from critical patterns
 */
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
  
  // Reconstruct full text from chips for pattern analysis
  const fullText = chips.map(c => 
    c.metadata?.evidence?.snippet || 
    c.evidence || 
    c.value || 
    ''
  ).join(' ');
  
  // 1. Multi-entity complexity
  const entityDetection = detectMultiEntityFactors(fullText);
  if (entityDetection.totalMultiplier > 1) {
    multipliers.entity = entityDetection.totalMultiplier;
    console.log(`[Bridge] 🔥 Multi-entity multiplier: ${entityDetection.totalMultiplier}x`);
    warnings.push(...entityDetection.warnings);
  }
  
  // 2. Employee count scaling (non-linear)
  const employeeDetection = detectEmployeeCount(fullText);
  if (employeeDetection.count) {
    multipliers.employee = calculateEmployeeMultiplier(employeeDetection.count);
    console.log(`[Bridge] 👥 Employee multiplier (${employeeDetection.count} users): ${multipliers.employee}x`);
  }
  
  // 3. Integration complexity
  const integrationChips = chips.filter(c => 
    c.type === 'integration' || c.kind === 'integration'
  );
  if (integrationChips.length > 0) {
    multipliers.integration = 1 + (integrationChips.length * 0.15);
    console.log(`[Bridge] 🔗 Integration multiplier (${integrationChips.length} systems): ${multipliers.integration}x`);
  }
  
  // 4. Compliance requirements
  const complianceChips = chips.filter(c => 
    c.type === 'compliance' || c.kind === 'compliance'
  );
  if (complianceChips.length > 0) {
    multipliers.compliance = 1 + (complianceChips.length * 0.1);
    console.log(`[Bridge] ⚖️ Compliance multiplier (${complianceChips.length} requirements): ${multipliers.compliance}x`);
  }
  
  // Calculate total multiplier (capped at 5x for safety)
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

/**
 * Calculate employee-based multiplier (non-linear curve)
 */
function calculateEmployeeMultiplier(count: number): number {
  if (count < 50) return 0.8;
  if (count < 200) return 1.0;
  if (count < 500) return 1.2;
  if (count < 1000) return 1.4;
  if (count < 2000) return 1.6;
  return 1.8;
}

/**
 * Default profile for error cases
 */
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