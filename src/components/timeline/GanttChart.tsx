'use client';

import { useMemo } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';

export default function GanttChart() {
  const { phases = [], selectedPhaseId, selectPhase } = useTimelineStore();
  
  // Safety check for phases
  const safePhases = Array.isArray(phases) ? phases : [];
  
  const { startBusinessDay, endBusinessDay, totalBusinessDays } = useMemo(() => {
    if (!safePhases || safePhases.length === 0) {
      return { startBusinessDay: 0, endBusinessDay: 0, totalBusinessDays: 0 };
    }
    
    const start = Math.min(...safePhases.map(p => p.startBusinessDay || 0));
    const end = Math.max(...safePhases.map(p => (p.startBusinessDay || 0) + (p.workingDays || 0)));
    
    return {
      startBusinessDay: start,
      endBusinessDay: end,
      totalBusinessDays: end - start
    };
  }, [safePhases]);
  
  if (safePhases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center">
        <p className="text-gray-500">No timeline generated yet. Select packages and click Generate Timeline.</p>
      </div>
    );
  }
  
  return (
    <div className="relative overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {/* Timeline Header */}
        <div className="flex items-center mb-4 border-b pb-2">
          <div className="w-48 font-semibold">Phase</div>
          <div className="flex-1 text-sm text-gray-600">Timeline</div>
        </div>
        
        {/* Phase Bars */}
        {safePhases.map((phase) => {
          const startPercent = ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
          const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;
          
          return (
            <div key={phase.id} className="flex items-center mb-3">
              <div className="w-48 pr-4 text-sm truncate">
                {phase.name}
              </div>
              <div className="flex-1 relative h-10">
                <div
                  className={`absolute h-full rounded cursor-pointer transition-all ${
                    selectedPhaseId === phase.id 
                      ? 'bg-blue-600 shadow-lg' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`
                  }}
                  onClick={() => selectPhase && selectPhase(phase.id)}
                >
                  <div className="px-2 py-1 text-white text-xs truncate">
                    {phase.workingDays || 0} days
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
