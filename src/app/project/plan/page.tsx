/**
 * Plan Page (Tier 3)
 * Timeline planning with AeroTimeline
 * Resource snapshot and project orchestration
 */

'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/lib/unified-project-store';
import { AeroTimeline } from '@/app/_components/timeline/AeroTimeline';
import { Button, Sheet, Empty } from '@/app/_components/ui';
import { Plus, Calendar } from 'lucide-react';
import type { TimelinePhase } from '@/app/_components/timeline/types';

export default function PlanPage() {
  const {
    timeline,
    updatePhase,
    addPhase,
  } = useProjectStore();

  const [isAddPhaseOpen, setIsAddPhaseOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);

  const handlePhaseUpdate = (phaseId: string, updates: Partial<TimelinePhase>) => {
    updatePhase(phaseId, updates);
  };

  const handlePhaseClick = (phase: TimelinePhase) => {
    setSelectedPhase(phase);
  };

  const handleAddSamplePhases = () => {
    // Add sample phases for demonstration
    const samplePhases: TimelinePhase[] = [
      {
        id: 'phase-1',
        name: 'Discovery & Analysis',
        startBD: 0,
        durationBD: 10,
        progress: 60,
        critical: true,
      },
      {
        id: 'phase-2',
        name: 'Design',
        startBD: 10,
        durationBD: 15,
        progress: 30,
        dependsOn: ['phase-1'],
      },
      {
        id: 'phase-3',
        name: 'Development',
        startBD: 25,
        durationBD: 30,
        progress: 0,
        dependsOn: ['phase-2'],
        baseline: {
          startBD: 25,
          durationBD: 35,
        },
      },
      {
        id: 'phase-4',
        name: 'Testing',
        startBD: 55,
        durationBD: 10,
        progress: 0,
        dependsOn: ['phase-3'],
      },
      {
        id: 'phase-5',
        name: 'Deployment',
        startBD: 65,
        durationBD: 5,
        progress: 0,
        critical: true,
        dependsOn: ['phase-4'],
      },
    ];

    samplePhases.forEach((phase) => addPhase(phase));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--ink)] mb-1">
            Project Plan
          </h1>
          <p className="text-sm text-[var(--ink-dim)]">
            Build your timeline with phases, dependencies, and resource allocation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            leftIcon={<Calendar size={16} />}
            size="md"
          >
            Add Holiday
          </Button>
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsAddPhaseOpen(true)}
            size="md"
          >
            Add Phase
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {timeline.phases.length === 0 ? (
        <Empty
          icon={<Calendar size={48} />}
          title="No phases yet"
          description="Start building your project timeline by adding phases. You can also load sample phases to see how it works."
          action={
            <div className="flex items-center gap-3">
              <Button variant="subtle" onClick={handleAddSamplePhases}>
                Load Sample Phases
              </Button>
              <Button variant="primary" onClick={() => setIsAddPhaseOpen(true)}>
                Add First Phase
              </Button>
            </div>
          }
        />
      ) : (
        <AeroTimeline
          startDateISO={timeline.startDateISO}
          phases={timeline.phases}
          holidays={timeline.holidays}
          onPhaseUpdate={handlePhaseUpdate}
          onPhaseClick={handlePhaseClick}
        />
      )}

      {/* Resource Snapshot */}
      {timeline.phases.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">
            Team Snapshot
          </h3>
          {timeline.resources.length === 0 ? (
            <p className="text-sm text-[var(--ink-dim)]">
              No resources assigned yet. Add team members to track allocation.
            </p>
          ) : (
            <div className="space-y-3">
              {timeline.resources.map((resource) => (
                <div key={resource.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--ink)]">
                      {resource.name}
                    </p>
                    <p className="text-xs text-[var(--ink-muted)]">
                      {resource.role}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--surface-sub)] rounded-[var(--r-full)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)]"
                          style={{ width: `${resource.allocation}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--ink-dim)] w-10">
                        {resource.allocation}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Phase Sheet */}
      <Sheet
        isOpen={isAddPhaseOpen}
        onClose={() => setIsAddPhaseOpen(false)}
        title="Add Phase"
        side="right"
        size="md"
      >
        <p className="text-sm text-[var(--ink-dim)]">
          Phase creation form will be implemented here.
        </p>
      </Sheet>

      {/* Phase Details Sheet */}
      <Sheet
        isOpen={!!selectedPhase}
        onClose={() => setSelectedPhase(null)}
        title={selectedPhase?.name || 'Phase Details'}
        side="right"
        size="md"
      >
        {selectedPhase && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--ink)] mb-1">
                Duration
              </p>
              <p className="text-sm text-[var(--ink-dim)]">
                {selectedPhase.durationBD} business days
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--ink)] mb-1">
                Progress
              </p>
              <p className="text-sm text-[var(--ink-dim)]">
                {selectedPhase.progress ?? 0}%
              </p>
            </div>
            {selectedPhase.critical && (
              <div className="px-3 py-2 bg-[var(--danger-bg)] rounded-[var(--r-md)]">
                <p className="text-sm text-[var(--danger)]">
                  ⚠️ Critical path phase
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
