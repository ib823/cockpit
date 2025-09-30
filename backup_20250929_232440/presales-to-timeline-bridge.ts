import { Chip } from "@/types/core";
import { useTimelineStore } from "@/stores/timeline-store";
import { calculateComplexityMultiplier, ExtendedChip } from "@/lib/enhanced-chip-parser";

interface PresalesDecisions {
  moduleCombo?: string;
  bankingPath?: string;
  rateRegion?: string;
  ssoMode?: string;
  targetPrice?: number;
  targetMargin?: number;
}

export function convertPresalesToTimeline(chips: Chip[], decisions: PresalesDecisions) {
  // Extract client profile from chips
  const profile = extractClientProfile(chips);
  
  // Calculate complexity multiplier from critical patterns
  const complexityMultiplier = calculateComplexityMultiplier(chips as ExtendedChip[]);
  console.log(`🔥 COMPLEXITY MULTIPLIER: ${complexityMultiplier.toFixed(2)}x`);
  
  // Map decisions to SAP packages
  const packages = mapDecisionsToPackages(decisions, chips);
  
  // Get timeline store and update it
  const timelineStore = useTimelineStore.getState();
  
  // Set profile with complexity multiplier
  timelineStore.setProfile({
    ...profile,
    complexityMultiplier // Add multiplier to profile
  });
  
  // Clear existing packages and add new ones
  timelineStore.clearPackages();
  packages.forEach(pkg => timelineStore.addPackage(pkg));
  
  // Generate timeline with multiplier applied
  timelineStore.generateTimeline();
  
  // Apply complexity multiplier to all phases
  applyComplexityMultiplierToPhases(complexityMultiplier);
  
  return {
    profile,
    packages,
    complexityMultiplier,
    success: true
  };
}

function applyComplexityMultiplierToPhases(multiplier: number) {
  if (multiplier <= 1.0) return; // No adjustment needed
  
  const timelineStore = useTimelineStore.getState();
  const phases = timelineStore.phases;
  
  console.log(`📊 Applying ${multiplier.toFixed(2)}x multiplier to ${phases.length} phases`);
  
  // Apply multiplier to each phase's effort and recalculate duration
  phases.forEach(phase => {
    const originalEffort = phase.effort;
    const newEffort = Math.ceil(originalEffort * multiplier);
    const originalDuration = phase.duration;
    const newDuration = Math.ceil(originalDuration * multiplier);
    
    console.log(`  📈 ${phase.name}: ${originalEffort}PD → ${newEffort}PD, ${originalDuration}w → ${newDuration}w`);
    
    // Update phase with multiplied values
    timelineStore.updatePhase(phase.id, {
      effort: newEffort,
      duration: newDuration,
      metadata: {
        ...phase.metadata,
        complexityMultiplier: multiplier,
        originalEffort,
        originalDuration,
        adjustmentReason: getMultiplierReason(multiplier)
      }
    });
  });
  
  // Regenerate timeline to recalculate dates
  timelineStore.generateTimeline();
}

function getMultiplierReason(multiplier: number): string {
  if (multiplier >= 2.5) {
    return 'High complexity: Multiple legal entities, locations, or high data volumes detected';
  } else if (multiplier >= 1.8) {
    return 'Medium-high complexity: Significant organizational or data complexity';
  } else if (multiplier >= 1.3) {
    return 'Medium complexity: Some complexity factors present';
  } else if (multiplier > 1.0) {
    return 'Low complexity increase: Minor complexity factors';
  }
  return 'Standard complexity';
}

function extractClientProfile(chips: Chip[]) {
  const profile: any = {
    company: 'Client Company',
    industry: 'manufacturing',
    size: 'medium',
    complexity: 'standard',
    timelinePreference: 'normal',
    region: 'ABMY',
    employees: 500,
    annualRevenue: 100000000,
    complexityMultiplier: 1.0 // Default
  };

  // Extract critical factors
  let legalEntities = 0;
  let locations = 0;
  let users = 0;

  chips.forEach(chip => {
    const chipType = chip.type || (chip as any).kind;
    const value = chip.value;

    switch (chipType) {
      case 'country':
        if (value === 'Malaysia') profile.region = 'ABMY';
        else if (value === 'Singapore') profile.region = 'ABSG';
        else if (value === 'Vietnam') profile.region = 'ABVN';
        break;
        
      case 'employees':
      case 'users':
        const numericValue = typeof value === 'string' ? parseInt(value) : value;
        if (typeof numericValue === 'number' && !isNaN(numericValue)) {
          profile.employees = numericValue;
          users = numericValue;
          
          // Update size based on employees
          if (numericValue < 100) profile.size = 'small';
          else if (numericValue < 1000) profile.size = 'medium';
          else profile.size = 'large';
        }
        break;
        
      case 'revenue':
        const revenueValue = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof revenueValue === 'number' && !isNaN(revenueValue)) {
          profile.annualRevenue = revenueValue;
        }
        break;
        
      case 'industry':
        if (typeof value === 'string') {
          profile.industry = value.toLowerCase();
        }
        break;
        
      case 'legal_entities':
        const entitiesValue = typeof value === 'string' ? parseInt(value) : value;
        if (typeof entitiesValue === 'number' && !isNaN(entitiesValue)) {
          legalEntities = entitiesValue;
        }
        break;
        
      case 'locations':
        const locValue = typeof value === 'string' ? parseInt(value) : value;
        if (typeof locValue === 'number' && !isNaN(locValue)) {
          locations = locValue;
        }
        break;
    }
  });

  // Set complexity level based on factors
  if (legalEntities > 10 || locations > 10 || users > 1000) {
    profile.complexity = 'high';
  } else if (legalEntities > 5 || locations > 5 || users > 500) {
    profile.complexity = 'medium';
  } else {
    profile.complexity = 'low';
  }

  return profile;
}

function mapDecisionsToPackages(decisions: PresalesDecisions, chips: Chip[]): string[] {
  const packages: string[] = [];
  
  // Always include base packages
  packages.push('Finance_1'); // General Ledger
  
  // Module combo mapping
  switch (decisions.moduleCombo) {
    case 'finance_only':
      packages.push('Finance_3'); // Cost Center
      break;
      
    case 'finance_hr':
      packages.push('Finance_3');
      packages.push('HCM_1'); // Core HR
      break;
      
    case 'finance_scm':
      packages.push('Finance_3');
      packages.push('SCM_1'); // Inventory
      break;
      
    case 'full_suite':
      packages.push('Finance_3', 'HCM_1', 'SCM_1');
      break;
  }
  
  // Banking path mapping
  if (decisions.bankingPath === 'host_to_host' || decisions.bankingPath === 'multi_bank') {
    packages.push('Technical_2'); // Data Migration needed for banking
  }
  
  // SSO requirements
  if (decisions.ssoMode === 'day_one') {
    // Add integration packages for SSO
    packages.push('Technical_3'); // Integration
  }
  
  // Check for specific requirements in chips
  const hasIntegration = chips.some(chip => {
    const chipType = chip.type || (chip as any).kind;
    return chipType === 'integration';
  });
  
  if (hasIntegration) {
    packages.push('Technical_2');
  }
  
  const hasCompliance = chips.some(chip => {
    const chipType = chip.type || (chip as any).kind;
    return chipType === 'compliance';
  });
  
  if (hasCompliance) {
    // Add compliance-specific packages
    packages.push('Technical_4'); // Compliance & Localization
  }

  return [...new Set(packages)]; // Remove duplicates
}