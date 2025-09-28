import { Chip } from "@/types/core";
import { useTimelineStore } from "@/stores/timeline-store";

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
  
  // Map decisions to SAP packages
  const packages = mapDecisionsToPackages(decisions, chips);
  
  // Get timeline store and update it
  const timelineStore = useTimelineStore.getState();
  
  // Set profile
  timelineStore.setProfile(profile);
  
  // Clear existing packages and add new ones
  timelineStore.clearPackages();
  packages.forEach(pkg => timelineStore.addPackage(pkg));
  
  // Generate timeline
  timelineStore.generateTimeline();
  
  return {
    profile,
    packages,
    success: true
  };
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
    annualRevenue: 100000000
  };

  chips.forEach(chip => {
    const kind = (chip as any).kind;
    const value = chip.value;

    switch (kind) {
      case 'country':
        if (value === 'Malaysia') profile.region = 'ABMY';
        else if (value === 'Singapore') profile.region = 'ABSG';
        else if (value === 'Vietnam') profile.region = 'ABVN';
        break;
        
      case 'employees':
        if (typeof value === 'number') {
          profile.employees = value;
          if (value < 100) profile.size = 'small';
          else if (value < 1000) profile.size = 'medium';
          else profile.size = 'large';
        }
        break;
        
      case 'revenue':
        if (typeof value === 'number') {
          profile.annualRevenue = value;
        }
        break;
        
      case 'industry':
        if (typeof value === 'string') {
          profile.industry = value.toLowerCase();
        }
        break;
    }
  });

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
    // Add integration packages
  }
  
  // Check for specific requirements in chips
  const hasIntegration = chips.some(chip => (chip as any).kind === 'integration');
  if (hasIntegration) {
    packages.push('Technical_2');
  }
  
  const hasCompliance = chips.some(chip => (chip as any).kind === 'compliance');
  if (hasCompliance) {
    // Add compliance-specific packages
  }

  return [...new Set(packages)]; // Remove duplicates
}