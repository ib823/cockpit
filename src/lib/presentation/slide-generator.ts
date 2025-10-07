/**
 * DYNAMIC SLIDE GENERATION
 *
 * Generates presentation slides based on project data.
 * Adapts slide count and content based on available information.
 *
 * Per spec: Roadmap_and_DoD.md (P2-2)
 */

import type { Phase } from '@/types/core';
import type { Chip } from '@/types/core';

export interface SlideConfig {
  id: string;
  title: string;
  type: SlideType;
  enabled: boolean;
  order: number;
  condition?: () => boolean;
}

export type SlideType =
  | 'cover'
  | 'requirements'
  | 'timeline'
  | 'team'
  | 'ricefw'
  | 'phase-breakdown'
  | 'milestones'
  | 'summary';

export interface SlideGeneratorOptions {
  phases: Phase[];
  chips: Chip[];
  ricefwItems?: any[];
  projectName?: string;
  includeRICEFW?: boolean;
  includePhaseBreakdown?: boolean;
}

/**
 * Generate slide configuration based on project data
 */
export function generateSlides(options: SlideGeneratorOptions): SlideConfig[] {
  const { phases, chips, ricefwItems = [], projectName } = options;

  const slides: SlideConfig[] = [
    // Always include cover
    {
      id: 'cover',
      title: 'Cover',
      type: 'cover',
      enabled: true,
      order: 0,
    },

    // Requirements - only if chips exist
    {
      id: 'requirements',
      title: 'Requirements',
      type: 'requirements',
      enabled: chips.length > 0,
      order: 1,
      condition: () => chips.length > 0,
    },

    // Timeline - only if phases exist
    {
      id: 'timeline',
      title: 'Timeline',
      type: 'timeline',
      enabled: phases.length > 0,
      order: 2,
      condition: () => phases.length > 0,
    },

    // Phase Breakdown - only if >3 phases
    {
      id: 'phase-breakdown',
      title: 'Phase Breakdown',
      type: 'phase-breakdown',
      enabled: phases.length > 3,
      order: 3,
      condition: () => phases.length > 3,
    },

    // RICEFW - only if items exist
    {
      id: 'ricefw',
      title: 'RICEFW Objects',
      type: 'ricefw',
      enabled: ricefwItems.length > 0,
      order: 4,
      condition: () => ricefwItems.length > 0,
    },

    // Team Structure - only if phases have resources
    {
      id: 'team',
      title: 'Team Structure',
      type: 'team',
      enabled: phases.some((p) => p.resources && p.resources.length > 0),
      order: 5,
      condition: () => phases.some((p) => p.resources && p.resources.length > 0),
    },

    // Milestones - show if we have phases
    {
      id: 'milestones',
      title: 'Key Milestones',
      type: 'milestones',
      enabled: phases.length > 0,
      order: 6,
      condition: () => phases.length > 0,
    },

    // Always include summary
    {
      id: 'summary',
      title: 'Summary',
      type: 'summary',
      enabled: true,
      order: 99, // Always last
    },
  ];

  // Filter out disabled slides and sort by order
  return slides.filter((slide) => slide.enabled).sort((a, b) => a.order - b.order);
}

/**
 * Reorder slides
 */
export function reorderSlides(slides: SlideConfig[], fromIndex: number, toIndex: number): SlideConfig[] {
  const result = Array.from(slides);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update order numbers
  return result.map((slide, index) => ({
    ...slide,
    order: index,
  }));
}

/**
 * Toggle slide visibility
 */
export function toggleSlideVisibility(slides: SlideConfig[], slideId: string): SlideConfig[] {
  return slides.map((slide) =>
    slide.id === slideId ? { ...slide, enabled: !slide.enabled } : slide
  );
}

/**
 * Get slide count recommendation based on project complexity
 */
export function getRecommendedSlideCount(options: SlideGeneratorOptions): {
  min: number;
  max: number;
  recommended: number;
} {
  const { phases, chips, ricefwItems = [] } = options;

  let recommended = 3; // Cover + Timeline + Summary (minimum)

  if (chips.length > 0) recommended++;
  if (phases.length > 3) recommended++;
  if (ricefwItems.length > 0) recommended++;
  if (phases.some((p) => p.resources && p.resources.length > 0)) recommended++;

  return {
    min: 3,
    max: 8,
    recommended: Math.min(recommended, 8),
  };
}

/**
 * Validate slide configuration
 */
export function validateSlides(slides: SlideConfig[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Must have at least cover and summary
  const hasCover = slides.some((s) => s.type === 'cover');
  const hasSummary = slides.some((s) => s.type === 'summary');

  if (!hasCover) errors.push('Cover slide is required');
  if (!hasSummary) errors.push('Summary slide is required');

  // Cover must be first
  if (slides.length > 0 && slides[0].type !== 'cover') {
    errors.push('Cover slide must be first');
  }

  // Summary must be last
  if (slides.length > 0 && slides[slides.length - 1].type !== 'summary') {
    errors.push('Summary slide must be last');
  }

  // Check for duplicate IDs
  const ids = slides.map((s) => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate slide IDs: ${duplicates.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
