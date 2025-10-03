'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ZoomIn, ZoomOut, Eye, Calendar, DollarSign, Users, Flag,
  Plus, Edit2, ChevronRight
} from 'lucide-react';
import { useTimelineStore, type Phase } from '@/stores/timeline-store';
import { useProjectStore } from '@/stores/project-store';
import { EmptyState } from '../shared/EmptyState';
import { SlideOver } from '../shared/SlideOver';
import { StatBadge } from '../shared/StatBadge';
import { formatDuration, formatCurrency, cn } from '@/lib/utils';

export function PlanMode() {
  const { phases, selectedPackages, totalCost } = useTimelineStore();
  const { setMode, regenerateTimeline, timelineIsStale } = useProjectStore();

  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [zoom, setZoom] = useState<'week' | 'month'>('month');
  const [presentationMode, setPresentationMode] = useState(false);

  // Auto-generate timeline if empty
  useEffect(() => {
    if (phases.length === 0 && selectedPackages.length === 0) {
      // Trigger first-time generation with default package
      console.log('[PlanMode] No timeline - trigger generation');
    }
  }, [phases.length, selectedPackages.length]);

  // Handle timeline regeneration
  const handleRegenerate = () => {
    regenerateTimeline(true);
  };

  // Calculate total duration
  const totalDuration = phases.reduce((sum, phase) => sum + phase.duration, 0);

  // Empty state - no timeline yet
  if (phases.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No project plan yet"
        description="Generate a timeline from your requirements and decisions"
        action={{
          label: 'Generate Timeline',
          onClick: handleRegenerate
        }}
        secondaryAction={{
          label: 'Review Decisions',
          onClick: () => setMode('decide')
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom('week')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                zoom === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Week
            </button>
            <button
              onClick={() => setZoom('month')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                zoom === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Month
            </button>
          </div>

          {/* Presentation toggle */}
          <button
            onClick={() => setPresentationMode(!presentationMode)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                       rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            {presentationMode ? 'Edit Mode' : 'Present Mode'}
          </button>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-3">
          <StatBadge label="Duration" value={formatDuration(totalDuration)} icon={Calendar} />
          {!presentationMode && (
            <StatBadge label="Cost" value={formatCurrency(totalCost, 'MYR')} icon={DollarSign} />
          )}
          <StatBadge label="Phases" value={phases.length} icon={Flag} />
        </div>
      </div>

      {/* Stale warning banner */}
      {timelineIsStale && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-yellow-50 border-b border-yellow-200 px-6 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yellow-900">
              Timeline outdated - decisions changed
            </span>
          </div>
          <button
            onClick={handleRegenerate}
            className="px-4 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700
                       transition-colors text-sm font-medium"
          >
            Regenerate
          </button>
        </motion.div>
      )}

      {/* Timeline visualization */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {phases.map((phase, i) => {
              const isSelected = selectedPhase?.id === phase.id;
              const widthPercent = (phase.duration / totalDuration) * 100;

              return (
                <motion.div
                  key={phase.id}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-2"
                >
                  {/* Phase label */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {phase.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDuration(phase.duration)}
                    </span>
                  </div>

                  {/* Phase bar */}
                  <motion.div
                    whileHover={{ scale: presentationMode ? 1 : 1.02, y: -2 }}
                    onClick={() => !presentationMode && setSelectedPhase(phase)}
                    className={cn(
                      'relative h-16 rounded-xl cursor-pointer transition-all overflow-hidden',
                      isSelected
                        ? 'ring-4 ring-blue-500 ring-offset-2'
                        : 'hover:shadow-lg'
                    )}
                    style={{
                      width: `${Math.max(widthPercent, 15)}%`,
                      background: phase.color || `hsl(${i * 60}, 70%, 60%)`,
                    }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />

                    {/* Content */}
                    <div className="relative h-full px-4 flex items-center justify-between text-white">
                      <div className="flex-1">
                        <div className="text-sm font-medium opacity-90">
                          {phase.name}
                        </div>
                        <div className="text-xs opacity-75 mt-0.5">
                          {phase.resources?.length || 0} resources
                        </div>
                      </div>

                      {!presentationMode && (
                        <Edit2 className="w-4 h-4 opacity-60" />
                      )}
                    </div>

                    {/* Progress indicator (if applicable) */}
                    {phase.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-white/60"
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    )}
                  </motion.div>

                  {/* Resource avatars */}
                  {phase.resources && phase.resources.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <Users className="w-3 h-3 text-gray-400" />
                      <div className="flex -space-x-2">
                        {phase.resources.slice(0, 3).map((resource, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white
                                       flex items-center justify-center text-xs font-medium text-gray-600"
                          >
                            {resource.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {phase.resources.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white
                                         flex items-center justify-center text-xs font-medium text-gray-700">
                            +{phase.resources.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Phase inspector slide-over */}
      {!presentationMode && (
        <SlideOver
          open={selectedPhase !== null}
          onClose={() => setSelectedPhase(null)}
          title={selectedPhase?.name || 'Phase Details'}
          width={500}
        >
          {selectedPhase && (
            <div className="space-y-6">
              {/* Phase overview */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{formatDuration(selectedPhase.duration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Resources</span>
                    <span className="font-medium">{selectedPhase.resources?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cost</span>
                    <span className="font-medium">{formatCurrency(selectedPhase.cost || 0, 'MYR')}</span>
                  </div>
                </div>
              </div>

              {/* Resources list */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Team Members</h3>
                  <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add Resource
                  </button>
                </div>

                {selectedPhase.resources && selectedPhase.resources.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPhase.resources.map((resource, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                            {resource.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-500">{resource.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          {resource.allocation}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No resources assigned yet
                  </p>
                )}
              </div>

              {/* Phase description */}
              {selectedPhase.description && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedPhase.description}</p>
                </div>
              )}
            </div>
          )}
        </SlideOver>
      )}
    </div>
  );
}
