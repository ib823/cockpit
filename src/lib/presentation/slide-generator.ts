/**
 * DYNAMIC SLIDE GENERATOR
 *
 * Generates presentation slides based on project data.
 * Per spec: PresentMode_Upgrade_Spec.md
 *
 * Rules:
 * - Always: Cover, Timeline, Summary
 * - If chips exist: Requirements slide
 * - If >3 phases: Detailed phase breakdown
 * - If RICEFW items: Custom objects slide
 * - If team data: Team structure slide
 *
 * Usage:
 *   import { generateSlides } from '@/lib/presentation/slide-generator';
 *   const slides = generateSlides(chips, phases, ricefwItems);
 */

import type { Chip, Phase } from '@/types/core';

export interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  notes?: string;
}

export interface RicefwItem {
  id: string;
  type: 'report' | 'interface' | 'conversion' | 'enhancement' | 'form' | 'workflow';
  name: string;
  complexity: 'low' | 'medium' | 'high';
  effort: number;
}

/**
 * Generate slides dynamically based on project data
 */
export function generateSlides(
  projectName: string,
  chips: Chip[],
  phases: Phase[],
  ricefwItems: RicefwItem[] = []
): Slide[] {
  const slides: Slide[] = [];

  // ALWAYS: Cover slide
  slides.push({
    id: 'cover',
    title: 'Cover',
    component: null, // Will be rendered by PresentMode
    notes: `
Introduction talking points:
- Welcome and introduce yourself
- Project name: ${projectName}
- Mention project duration: ${calculateTotalDuration(phases)}
- Set expectations: "We'll walk through our proposed solution in about 10-15 minutes"
- Highlight key differentiators
    `.trim(),
  });

  // CONDITIONAL: Requirements slide (if chips exist)
  if (chips.length > 0) {
    slides.push({
      id: 'requirements',
      title: 'Requirements Overview',
      component: null,
      notes: `
Talk about the requirements gathering process:
- We've identified ${chips.length} key requirements
- Highlight ${getTopChipCategories(chips, 3)} as main focus areas
- Mention data sources: ${getChipSources(chips)}
- Emphasize alignment with business objectives
      `.trim(),
    });
  }

  // ALWAYS: Timeline slide
  slides.push({
    id: 'timeline',
    title: 'Project Timeline',
    component: null,
    notes: `
Walk through the timeline:
- Total duration: ${calculateTotalDuration(phases)}
- Number of phases: ${phases.length}
- Highlight critical path and dependencies
- Mention resource allocation strategy
- Discuss risk mitigation for each phase
    `.trim(),
  });

  // CONDITIONAL: Phase breakdown (if >3 phases)
  if (phases.length > 3) {
    slides.push({
      id: 'phase-breakdown',
      title: 'Detailed Phase Breakdown',
      component: null,
      notes: `
Deep dive into each phase:
- Phase 1: ${phases[0]?.name || 'N/A'} - ${phases[0]?.workingDays || 0} days
- Phase 2: ${phases[1]?.name || 'N/A'} - ${phases[1]?.workingDays || 0} days
- Explain deliverables for each phase
- Discuss quality gates and approval points
      `.trim(),
    });
  }

  // CONDITIONAL: RICEFW slide (if custom objects exist)
  if (ricefwItems.length > 0) {
    slides.push({
      id: 'ricefw',
      title: 'Custom Development',
      component: null,
      notes: `
Discuss custom development scope:
- Total RICEFW objects: ${ricefwItems.length}
- Breakdown: ${getRicefwBreakdown(ricefwItems)}
- Effort estimate: ${calculateRicefwEffort(ricefwItems)} days
- Integration points with standard SAP
- Testing and validation approach
      `.trim(),
    });
  }

  // CONDITIONAL: Team slide (if resources data exists)
  const teamMembers = getUniqueTeamMembers(phases);
  if (teamMembers.length > 0) {
    slides.push({
      id: 'team',
      title: 'Project Team',
      component: null,
      notes: `
Introduce the team structure:
- Team size: ${teamMembers.length} resources
- Key roles: ${teamMembers.slice(0, 5).join(', ')}
- Mention experience and expertise
- Highlight dedicated vs. shared resources
- Discuss escalation and governance
      `.trim(),
    });
  }

  // ALWAYS: Summary slide
  slides.push({
    id: 'summary',
    title: 'Summary & Next Steps',
    component: null,
    notes: `
Wrap up the presentation:
- Recap key points: duration, cost, scope
- Highlight unique value proposition
- Address any remaining questions
- Discuss next steps: contract, kickoff, etc.
- Thank the client for their time
- Provide contact information
    `.trim(),
  });

  return slides;
}

/**
 * Helper: Calculate total project duration
 */
function calculateTotalDuration(phases: Phase[]): string {
  const totalDays = phases.reduce((sum, phase) => sum + (phase.workingDays || 0), 0);
  const months = Math.ceil(totalDays / 20); // Assuming 20 working days per month
  const weeks = Math.ceil(totalDays / 5);

  if (months >= 12) {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years}year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths}mo` : ''}`;
  } else if (months >= 2) {
    return `${months} months`;
  } else {
    return `${weeks} weeks`;
  }
}

/**
 * Helper: Get top chip categories
 */
function getTopChipCategories(chips: Chip[], count: number): string {
  const typeCounts: Record<string, number> = {};

  chips.forEach((chip) => {
    const type = chip.type || 'OTHER';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  const sorted = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([type]) => type.replace(/_/g, ' ').toLowerCase());

  return sorted.join(', ');
}

/**
 * Helper: Get chip sources
 */
function getChipSources(chips: Chip[]): string {
  const sources = new Set(chips.map((c) => c.source || 'manual'));
  return Array.from(sources).join(', ');
}

/**
 * Helper: Get RICEFW breakdown
 */
function getRicefwBreakdown(items: RicefwItem[]): string {
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    const type = item.type.toUpperCase();
    counts[type] = (counts[type] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');
}

/**
 * Helper: Calculate total RICEFW effort
 */
function calculateRicefwEffort(items: RicefwItem[]): number {
  return items.reduce((sum, item) => sum + (item.effort || 0), 0);
}

/**
 * Helper: Get unique team members from phases
 */
function getUniqueTeamMembers(phases: Phase[]): string[] {
  const members = new Set<string>();

  phases.forEach((phase) => {
    if (phase.resources) {
      phase.resources.forEach((resource) => {
        if (typeof resource === 'string') {
          members.add(resource);
        } else if (resource && typeof resource === 'object' && 'role' in resource) {
          members.add((resource as any).role);
        }
      });
    }
  });

  return Array.from(members);
}

/**
 * Reorder slides based on user preference
 */
export function reorderSlides(slides: Slide[], fromIndex: number, toIndex: number): Slide[] {
  const result = Array.from(slides);
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Hide a slide (mark as hidden, don't remove)
 */
export function toggleSlideVisibility(slides: Slide[], slideId: string, hidden: boolean): Slide[] {
  return slides.map((slide) =>
    slide.id === slideId
      ? { ...slide, hidden }
      : slide
  ) as Slide[];
}
