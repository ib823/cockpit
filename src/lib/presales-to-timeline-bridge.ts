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
  console.log('🚀 convertPresalesToTimeline called');
  console.log('📦 Chips:', chips);
  console.log('📋 Decisions:', decisions);
  
  const profile = extractClientProfile(chips);
  console.log('👤 Profile:', profile);
  
  const complexityMultiplier = calculateComplexityMultiplier(chips as ExtendedChip[]);
  console.log(`🔥 COMPLEXITY MULTIPLIER: ${complexityMultiplier.toFixed(2)}x`);
  
  const packages = mapDecisionsToPackages(decisions, chips);
  console.log('📦 Packages:', packages);
  
  const timelineStore = useTimelineStore.getState();
  
  timelineStore.setProfile({
    ...profile,
    complexityMultiplier
  });
  
  timelineStore.clearPackages();
  packages.forEach(pkg => timelineStore.addPackage(pkg));
  
  console.log('⏱️ Generating baseline timeline...');
  timelineStore.generateTimeline();
  
  const phases = timelineStore.phases;
  console.log(`📊 Generated ${phases.length} phases`);
  
  if (phases.length === 0) {
    console.error('❌ No phases generated');
    return { profile, packages, complexityMultiplier, success: false };
  }
  
  // Step 1: Apply multiplier to all phases
  console.log(`📈 Applying ${complexityMultiplier.toFixed(2)}x multiplier to ${phases.length} phases`);
  
  phases.forEach(phase => {
    let baseDuration = phase.duration;
    let baseEffort = phase.effort;
    
    if (!baseDuration || isNaN(baseDuration)) {
      const phaseName = phase.name.toLowerCase();
      if (phaseName.includes('prepare')) baseDuration = 2;
      else if (phaseName.includes('explore')) baseDuration = 6;
      else if (phaseName.includes('realize')) baseDuration = 12;
      else if (phaseName.includes('deploy')) baseDuration = 4;
      else if (phaseName.includes('run')) baseDuration = 2;
      else baseDuration = 4;
      
      console.warn(`  ⚠️ ${phase.name}: Using default ${baseDuration}w`);
    }
    
    if (!baseEffort || isNaN(baseEffort)) {
      baseEffort = baseDuration * 5;
    }
    
    const newDuration = Math.ceil(baseDuration * complexityMultiplier);
    const newEffort = Math.ceil(baseEffort * complexityMultiplier);
    
    timelineStore.updatePhase(phase.id, {
      duration: newDuration,
      effort: newEffort,
      metadata: {
        ...phase.metadata,
        complexityMultiplier,
        originalDuration: baseDuration,
        originalEffort: baseEffort,
        adjustmentReason: getMultiplierReason(complexityMultiplier)
      }
    });
  });
  
  console.log('✅ Multiplier applied');
  
  // Step 2: Verify and fix any remaining phases
  console.log('🔍 Verifying all phases...');
  const freshPhases = useTimelineStore.getState().phases;
  
  freshPhases.forEach((phase, index) => {
    let duration = phase.duration;
    
    if (!duration || isNaN(duration)) {
      const phaseName = phase.name.toLowerCase();
      if (phaseName.includes('prepare')) duration = 2;
      else if (phaseName.includes('explore')) duration = 6;
      else if (phaseName.includes('realize')) duration = 12;
      else if (phaseName.includes('deploy')) duration = 4;
      else if (phaseName.includes('run')) duration = 2;
      else duration = 4;
      
      console.warn(`  ⚠️ Fixing ${phase.name}: ${duration}w`);
      
      timelineStore.updatePhase(phase.id, {
        duration: duration,
        effort: duration * 5
      });
    }
    
    if (index < 5) {
      console.log(`  ${phase.name}: ${duration}w`);
    }
  });
  
  // Step 3: Calculate dates
  console.log('📅 Calculating dates...');
  const startDate = new Date('2024-01-01');
  let currentDate = new Date(startDate);
  
  const finalPhases = useTimelineStore.getState().phases;
  
  finalPhases.forEach((phase) => {
    const duration = phase.duration || 4;
    const durationDays = duration * 7;
    
    const phaseStart = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + durationDays);
    const phaseEnd = new Date(currentDate);
    
    timelineStore.updatePhase(phase.id, {
      startDate: phaseStart.toISOString(),
      endDate: phaseEnd.toISOString()
    });
  });
  
  console.log(`📊 Timeline: ${startDate.toLocaleDateString()} to ${currentDate.toLocaleDateString()}`);
  console.log('✅ Timeline ready - click "View Timeline"');
  
  return {
    profile,
    packages,
    complexityMultiplier,
    success: true
  };
}

function getMultiplierReason(multiplier: number): string {
  if (multiplier >= 2.5) return 'High complexity: Multiple legal entities, locations, or high data volumes detected';
  if (multiplier >= 1.8) return 'Medium-high complexity: Significant organizational or data complexity';
  if (multiplier >= 1.3) return 'Medium complexity: Some complexity factors present';
  if (multiplier > 1.0) return 'Low complexity increase: Minor complexity factors';
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
    complexityMultiplier: 1.0
  };

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
  
  packages.push('Finance_1');
  
  switch (decisions.moduleCombo) {
    case 'finance_only':
      packages.push('Finance_3');
      break;
    case 'finance_hr':
      packages.push('Finance_3', 'HCM_1');
      break;
    case 'finance_scm':
      packages.push('Finance_3', 'SCM_1');
      break;
    case 'full_suite':
      packages.push('Finance_3', 'HCM_1', 'SCM_1');
      break;
  }
  
  if (decisions.bankingPath === 'host_to_host' || decisions.bankingPath === 'multi_bank') {
    packages.push('Technical_2');
  }
  
  if (decisions.ssoMode === 'day_one') {
    packages.push('Technical_3');
  }
  
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
    packages.push('Technical_4');
  }

  return [...new Set(packages)];
}