/**
 * PRESENTATION SLIDE COMPONENTS
 *
 * Individual slide components for dynamic presentation generation.
 * Each component is self-contained and data-driven.
 */

import { motion } from 'framer-motion';
import { Calendar, Users, Flag, Code, TrendingUp, CheckCircle2 } from 'lucide-react';
import type { Phase } from '@/types/core';
import type { Chip } from '@/types/core';
import { formatDuration } from '@/lib/utils';

interface SlideProps {
  phases: Phase[];
  chips: Chip[];
  projectName?: string;
}

export function CoverSlide({ phases, chips, projectName }: SlideProps) {
  const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);
  const totalResources = phases.reduce((sum, phase) => sum + (phase.resources?.length || 0), 0);

  return (
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
  );
}

export function RequirementsSlide({ chips }: SlideProps) {
  return (
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
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">{chip.type}</div>
            <div className="text-xl font-light">{chip.value}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSlide({ phases }: SlideProps) {
  const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);

  return (
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
  );
}

export function PhaseBreakdownSlide({ phases }: SlideProps) {
  return (
    <div>
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-5xl font-light mb-12"
      >
        Detailed Phase Breakdown
      </motion.h2>
      <div className="grid grid-cols-2 gap-6">
        {phases.map((phase, i) => (
          <motion.div
            key={phase.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          >
            <h3 className="text-2xl font-light mb-4">{phase.name}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span>{formatDuration(phase.workingDays)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Team Size:</span>
                <span>{phase.resources?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Effort:</span>
                <span>{phase.effort || 0} MD</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function TeamStructureSlide({ phases }: SlideProps) {
  return (
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
            <div className="text-3xl font-thin text-gray-300">{phase.resources?.length || 0}</div>
            <div className="text-sm text-gray-500 mt-1">consultants</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function RICEFWSlide({ phases }: SlideProps) {
  // Placeholder for RICEFW count - would come from actual RICEFW data
  const ricefwCount = 0;

  return (
    <div>
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-5xl font-light mb-12"
      >
        RICEFW Objects
      </motion.h2>
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
        >
          <Code className="w-16 h-16" />
        </motion.div>
        <div className="text-6xl font-thin mb-4">{ricefwCount}</div>
        <div className="text-2xl text-gray-400">Custom Objects</div>
        <p className="text-sm text-gray-500 mt-4">Coming soon</p>
      </div>
    </div>
  );
}

export function MilestonesSlide({ phases }: SlideProps) {
  // Use phases as milestones for now
  const milestones = phases.slice(0, 6);

  return (
    <div>
      <motion.h2
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="text-5xl font-light mb-12"
      >
        Key Milestones
      </motion.h2>
      <div className="space-y-6">
        {milestones.map((phase, i) => (
          <motion.div
            key={phase.id}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
          >
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <div className="flex-1">
              <h3 className="text-xl font-light">{phase.name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {formatDuration(phase.workingDays)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function SummarySlide({ phases }: SlideProps) {
  const totalDuration = phases.reduce((sum, phase) => sum + phase.workingDays, 0);
  const totalResources = phases.reduce((sum, phase) => sum + (phase.resources?.length || 0), 0);

  return (
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
  );
}
