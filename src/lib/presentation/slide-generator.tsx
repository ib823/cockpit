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

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Flag, TrendingUp } from 'lucide-react';
import type { Chip, Phase } from '@/types/core';
import { formatDuration } from '@/lib/utils';
import type { RicefwItem as RicefwItemModel } from '@/lib/ricefw/model';

export interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  notes?: string;
  hidden?: boolean;
}

export interface RicefwItem {
  id: string;
  type: 'report' | 'interface' | 'conversion' | 'enhancement' | 'form' | 'workflow';
  name: string;
  complexity: 'low' | 'medium' | 'high' | 'S' | 'M' | 'L';
  effort: number;
  count?: number;
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
  const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);
  const totalResources = phases.reduce((sum, phase) => sum + (phase.resources?.length || 0), 0);

  // ALWAYS: Cover slide
  slides.push({
    id: 'cover',
    title: 'Cover',
    component: (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-7xl font-thin mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {projectName || 'Your SAP Implementation Plan'}
          </h1>
          <p className="text-3xl text-gray-400 font-light">
            {formatDuration(totalDuration)} · {phases.length} phases · {totalResources} consultants
          </p>
        </motion.div>
      </div>
    ),
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
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Project Requirements
          </motion.h2>
          <div className="grid grid-cols-2 gap-6">
            {chips.slice(0, 8).map((chip, i) => (
              <motion.div
                key={chip.id || i}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">
                  {chip.type}
                </div>
                <div className="text-xl font-light">{chip.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
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
    component: (
      <div>
        <motion.h2
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="text-5xl font-light mb-12"
        >
          Implementation Timeline
        </motion.h2>
        <div className="space-y-8">
          {phases.map((phase, i) => {
            const widthPercent = (phase.workingDays / totalDuration) * 100;

            return (
              <motion.div
                key={phase.id}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-light">{phase.name}</h3>
                  <span className="text-gray-400">{formatDuration(phase.workingDays)}</span>
                </div>
                <div
                  className="h-20 rounded-2xl relative overflow-hidden"
                  style={{
                    width: `${Math.max(widthPercent, 20)}%`,
                    background: `linear-gradient(135deg, ${phase.color || `hsl(${i * 60}, 60%, 50%)`}, ${phase.color || `hsl(${i * 60}, 60%, 40%)`})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                  <div className="relative h-full px-6 flex items-center">
                    <div className="text-white/80 text-sm">
                      {phase.resources?.length || 0} team members
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    ),
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
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Phase Breakdown
          </motion.h2>
          <div className="space-y-6">
            {phases.map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-light">{phase.name}</h3>
                  <span className="px-4 py-1 bg-blue-500/20 rounded-full text-sm">
                    {formatDuration(phase.workingDays)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Team Size</div>
                    <div className="text-lg">{phase.resources?.length || 0} members</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Effort</div>
                    <div className="text-lg">{phase.effort || 0} PD</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
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
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Custom Development Objects
          </motion.h2>
          <div className="grid grid-cols-2 gap-6">
            {ricefwItems.slice(0, 8).map((item, i) => (
              <motion.div
                key={item.id || i}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-400 uppercase tracking-wide">
                    {item.type}
                  </div>
                  <div className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                    {item.complexity}
                  </div>
                </div>
                <div className="text-lg font-light mb-2">{item.name}</div>
                <div className="text-sm text-gray-400">{item.effort} PD</div>
              </motion.div>
            ))}
          </div>
          {ricefwItems.length > 8 && (
            <div className="mt-8 text-center text-gray-400">
              + {ricefwItems.length - 8} more items
            </div>
          )}
        </div>
      ),
      notes: `
Discuss custom development scope:
- Total RICEFW objects: ${ricefwItems.length}
- Breakdown: ${getRicefwBreakdown(ricefwItems)}
- Effort estimate: ${calculateTotalRicefwEffort(ricefwItems)} days
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
      component: (
        <div>
          <motion.h2
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-5xl font-light mb-12"
          >
            Team Structure
          </motion.h2>
          <div className="grid grid-cols-3 gap-8">
            {phases.slice(0, 6).map((phase, i) => (
              <motion.div
                key={phase.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-light mb-2">{phase.name}</h3>
                <div className="text-3xl font-thin text-gray-300">
                  {phase.resources?.length || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">consultants</div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
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
    component: (
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-light mb-12">Project Summary</h2>

          <div className="grid grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div>
              <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <div className="text-4xl font-thin mb-2">{formatDuration(totalDuration)}</div>
              <div className="text-gray-400">Duration</div>
            </div>

            <div>
              <Flag className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <div className="text-4xl font-thin mb-2">{phases.length}</div>
              <div className="text-gray-400">Phases</div>
            </div>

            <div>
              <Users className="w-12 h-12 mx-auto mb-4 text-green-400" />
              <div className="text-4xl font-thin mb-2">{totalResources}</div>
              <div className="text-gray-400">Team Members</div>
            </div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 pt-12 border-t border-white/10"
          >
            <p className="text-2xl font-light text-gray-300">
              Ready to transform your business with SAP
            </p>
          </motion.div>
        </motion.div>
      </div>
    ),
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
function calculateTotalRicefwEffort(items: RicefwItem[]): number {
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
