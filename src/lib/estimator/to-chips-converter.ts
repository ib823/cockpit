/**
 * ESTIMATOR → PROJECT BRIDGE
 *
 * Converts EstimatorInputs into Chip[] format for presales-store.
 *
 * Per spec: Holistic_Redesign_V2.md Section 5.2
 * DoD: Roadmap_and_DoD.md P0-1
 */

import type { Chip, ChipType } from '@/types/core';
import type { EstimatorInputs as BaseEstimatorInputs } from './types';
import { sanitizeHtml } from '@/lib/input-sanitizer';

// Extended estimator inputs with legacy properties
interface EstimatorInputs extends BaseEstimatorInputs {
  modules?: string[];
  employees?: number;
  revenue?: number;
  industry?: string;
  country?: string;
  existingSystem?: string;
  entities?: number;
  peakSessions?: number;
  l3Items?: Array<{ code: string; module: string }>;
  inAppExtensions?: number;
  btpExtensions?: number;
}

// Extended profile with id and complexity
interface ProfileWithExtras {
  id?: string;
  complexity?: string;
  name: string;
  region?: string;
  description?: string;
  baseFT: number;
  basis: number;
  securityAuth: number;
}

// Helper for safe input sanitization
const sanitizeInput = (input: string) => sanitizeHtml(input).substring(0, 500);

/**
 * Convert estimator inputs to chips for project workflow
 */
export function convertEstimateToChips(inputs: EstimatorInputs): Chip[] {
  const chips: Chip[] = [];
  const timestamp = new Date();

  // MODULES chip
  if (inputs.modules && inputs.modules.length > 0) {
    chips.push({
      id: `chip-modules-${Date.now()}`,
      type: 'MODULES' as ChipType,
      value: sanitizeInput(inputs.modules.join(', ')),
      confidence: 1.0,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: 'From Quick Estimate',
        estimated: true,
      },
    });
  }

  // COUNTRIES chip (from OSG)
  if (inputs.countries && inputs.countries > 0) {
    chips.push({
      id: `chip-countries-${Date.now() + 1}`,
      type: 'COUNTRY' as ChipType,
      value: inputs.countries === 1 ? (inputs.profile.region || 'XX').toUpperCase() : `${inputs.countries} countries`,
      confidence: inputs.countries === 1 ? 1.0 : 0.8,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: `${inputs.countries} country/countries`,
        estimated: true,
      },
    });
  }

  // LEGAL_ENTITIES chip (from entities)
  if (inputs.entities && inputs.entities > 0) {
    chips.push({
      id: `chip-entities-${Date.now() + 2}`,
      type: 'LEGAL_ENTITIES' as ChipType,
      value: inputs.entities,
      confidence: 0.9,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: `${inputs.entities} legal entities`,
        estimated: true,
      },
    });
  }

  // LANGUAGES chip
  if (inputs.languages && inputs.languages > 0) {
    chips.push({
      id: `chip-languages-${Date.now() + 3}`,
      type: 'LANGUAGES' as ChipType,
      value: inputs.languages,
      confidence: 0.9,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: `${inputs.languages} language(s)`,
        estimated: true,
      },
    });
  }

  // USERS chip (from peak sessions)
  if (inputs.peakSessions && inputs.peakSessions > 0) {
    chips.push({
      id: `chip-users-${Date.now() + 4}`,
      type: 'USERS' as ChipType,
      value: inputs.peakSessions,
      confidence: 0.8,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: `${inputs.peakSessions} peak concurrent users`,
        estimated: true,
        unit: 'concurrent sessions',
      },
    });
  }

  // INTEGRATION chips (from integrations count)
  if (inputs.integrations && inputs.integrations > 0) {
    chips.push({
      id: `chip-integrations-${Date.now() + 5}`,
      type: 'INTEGRATION' as ChipType,
      value: `${inputs.integrations} integrations`,
      confidence: 0.7,
      source: 'manual',
      validated: false, // User should review in Decide mode
      timestamp,
      metadata: {
        note: `${inputs.integrations} external system integrations`,
        estimated: true,
      },
    });
  }

  // INDUSTRY chip (inferred from profile description)
  if (inputs.profile && inputs.profile.description) {
    // Extract industry hints from profile description
    const industryHints = inputs.profile.description.toLowerCase();
    let industry = 'General';

    if (industryHints.includes('finance') || industryHints.includes('financial')) {
      industry = 'Financial Services';
    } else if (industryHints.includes('retail') || industryHints.includes('distribution')) {
      industry = 'Retail & Distribution';
    } else if (industryHints.includes('manufacturing') || industryHints.includes('production')) {
      industry = 'Manufacturing';
    } else if (industryHints.includes('utilities')) {
      industry = 'Utilities';
    }

    chips.push({
      id: `chip-industry-${Date.now() + 6}`,
      type: 'INDUSTRY' as ChipType,
      value: sanitizeInput(industry),
      confidence: 0.6,
      source: 'manual',
      validated: false, // User should confirm
      timestamp,
      metadata: {
        note: 'Inferred from profile selection',
        inferred: true,
      },
    });
  }

  // L3 ITEMS as MODULES (append to modules chip if L3 items selected)
  if (inputs.l3Items && inputs.l3Items.length > 0) {
    const l3Codes = inputs.l3Items.map(item => item.code).join(', ');
    const l3Modules = [...new Set(inputs.l3Items.map(item => item.module))].join(', ');

    chips.push({
      id: `chip-l3-items-${Date.now() + 7}`,
      type: 'MODULES' as ChipType,
      value: sanitizeInput(`L3 Scope: ${l3Codes}`),
      confidence: 1.0,
      source: 'manual',
      validated: true,
      timestamp,
      metadata: {
        note: `${inputs.l3Items.length} L3 items across ${l3Modules}`,
        estimated: true,
      },
    });
  }

  // TIMELINE chip (placeholder - will be generated in project)
  // This signals to project that estimation basis exists
  chips.push({
    id: `chip-timeline-${Date.now() + 8}`,
    type: 'TIMELINE' as ChipType,
    value: 'From Quick Estimate',
    confidence: 0.8,
    source: 'manual',
    validated: false,
    timestamp,
    metadata: {
      note: 'Timeline will be generated from estimate',
      estimated: true,
    },
  });

  return chips;
}

/**
 * Generate project name from estimate inputs
 */
export function generateProjectName(inputs: EstimatorInputs): string {
  const profileName = inputs.profile.name.split(' (')[0]; // "Singapore Mid-Market"
  const moduleList = (inputs.modules || []).slice(0, 2).join('+') || 'SAP'; // "FI+CO"
  const timestamp = new Date().toISOString().split('T')[0]; // "2024-01-15"

  return sanitizeInput(`${profileName} ${moduleList} - ${timestamp}`);
}

/**
 * Extract metadata for project description
 */
export function extractEstimateMetadata(inputs: EstimatorInputs) {
  return {
    source: 'estimator' as const,
    estimatorProfile: inputs.profile.name,
    estimatorComplexity: inputs.profile.description || 'Standard',
    scopeBreadth: {
      l3Count: inputs.l3Items?.length || inputs.selectedL3Items.length,
      integrations: inputs.integrations,
    },
    processComplexity: {
      inAppExtensions: inputs.inAppExtensions || 0,
      btpExtensions: inputs.btpExtensions || 0,
    },
    orgScale: {
      countries: inputs.countries,
      entities: inputs.legalEntities,
      languages: inputs.languages,
      peakSessions: inputs.peakSessions || 0,
    },
  };
}
