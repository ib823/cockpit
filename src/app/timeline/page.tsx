'use client';

import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';
import { useTimelineStore } from '@/stores/timeline-store';

export default function TimelinePage() {
  const { phases, generateTimeline } = useTimelineStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">SAP Timeline Planner</h1>
          <p className="text-gray-600 mt-1">Project planning and resource management</p>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <TimelineControls />
      </div>

      {/* Timeline Visualization */}
      <div className="max-w-6xl mx-auto px-6 pb-8">
        {phases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Generated</h3>
            <p className="text-gray-600 mb-4">Create a project timeline to get started</p>
            <button
              onClick={generateTimeline}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Generate Timeline
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
            <GanttChart />
          </div>
        )}
      </div>
    </div>
  );
}