'use client';

import React from 'react';
import SimpleTimeline from '@/components/SimpleTimeline';
import { useTimelineStore } from '@/stores/simple-timeline-store';

export default function TimelinePage() {
  const { phases, milestones, selectedMilestoneId } = useTimelineStore();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SAP Implementation Timeline with Milestones
          </h1>
          <p className="text-gray-600">
            Professional milestone management for SAP projects
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Phases</h3>
            <p className="text-2xl font-bold text-blue-600">{phases.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Milestones</h3>
            <p className="text-2xl font-bold text-green-600">{milestones.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2">Selected</h3>
            <p className="text-2xl font-bold text-purple-600">
              {selectedMilestoneId ? '1' : '0'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="text-sm text-gray-600">
              ✅ Milestone System Active
            </div>
          </div>
        </div>

        <SimpleTimeline />
      </div>
    </div>
  );
}
