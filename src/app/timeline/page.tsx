'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import SAPPackageSelector from '@/components/timeline/SAPPackageSelector';
import TimelineControls from '@/components/timeline/TimelineControls';
import GanttChart from '@/components/timeline/GanttChart';
import ResourceManager from '@/components/timeline/ResourceManager';
import HolidayManager from '@/components/timeline/HolidayManager';

export default function TimelinePage() {
  const {
    phases,
    holidays,
    selectedPhaseId,
    selectPhase,
    zoomLevel
  } = useTimelineStore();

  const [showResourceManager, setShowResourceManager] = useState(false);
  const [showHolidayManager, setShowHolidayManager] = useState(false);

  // FIXED: Proper phase selection handling
  const handlePhaseClick = (phaseId: string) => {
    selectPhase(phaseId);
    setShowResourceManager(true);
  };

  // FIXED: Proper panel closing clears selection
  const handleCloseResourceManager = () => {
    setShowResourceManager(false);
    selectPhase(null); // Clear selection when panel closes
  };

  const activePhase = phases.find(p => p.id === selectedPhaseId);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Project Timeline</h1>
            <p className="text-sm text-gray-600 mt-1">
              Plan and manage your SAP implementation timeline
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <SAPPackageSelector />

          {phases.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <TimelineControls />
                <button
                  onClick={() => setShowHolidayManager(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Manage Holidays ({holidays.length})
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border">
                <GanttChart
                  phases={phases}
                  zoomLevel={zoomLevel}
                  onPhaseClick={handlePhaseClick}
                  selectedPhaseId={selectedPhaseId}
                  holidays={holidays}
                  showCalendarAxis={true}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Resource Manager */}
      <ResourceManager
        isOpen={showResourceManager}
        onClose={handleCloseResourceManager}
        activePhase={activePhase}
      />

      {/* Holiday Manager */}
      <HolidayManager
        isOpen={showHolidayManager}
        onClose={() => setShowHolidayManager(false)}
      />
    </div>
  );
}
