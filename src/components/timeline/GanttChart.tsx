"use client";

import React, { useMemo, useState } from 'react';
import { Phase } from '@/lib/timeline/phase-generation';

interface GanttChartProps {
  phases: Phase[];
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  onPhaseClick?: (phaseId: string) => void;
  selectedPhaseId?: string | null;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  phases,
  zoomLevel,
  onPhaseClick,
  selectedPhaseId
}) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  // Calculate timeline dimensions
  const { timelineData, maxBusinessDay, minBusinessDay } = useMemo(() => {
    if (!phases.length) {
      return { timelineData: [], maxBusinessDay: 0, minBusinessDay: 0 };
    }

    const minDay = Math.min(...phases.map(p => p.startBusinessDay));
    const maxDay = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
    
    const timelineData = phases.map((phase, index) => ({
      ...phase,
      index,
      startX: ((phase.startBusinessDay - minDay) / (maxDay - minDay)) * 100,
      width: (phase.workingDays / (maxDay - minDay)) * 100,
      y: index * 60 + 20
    }));

    return { timelineData, maxBusinessDay: maxDay, minBusinessDay: minDay };
  }, [phases]);

  const chartHeight = phases.length * 60 + 40;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center p-4 border-b bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Timeline Visualization</h3>
        <div className="text-sm text-gray-600">
          {phases.length} phases • {maxBusinessDay - minBusinessDay} business days
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '600px' }}>
        <div className="min-w-full" style={{ width: '1200px' }}>
          <svg width="100%" height={chartHeight} className="block">
            {timelineData.map((phase) => {
              const isSelected = selectedPhaseId === phase.id;
              const isHovered = hoveredPhase === phase.id;
              
              return (
                <g key={phase.id}>
                  <text
                    x="10"
                    y={phase.y + 25}
                    fill="#1F2937"
                    fontSize="14"
                    fontWeight={isSelected ? "600" : "500"}
                    className="select-none cursor-pointer"
                    onClick={() => onPhaseClick?.(phase.id)}
                  >
                    {phase.name}
                  </text>
                  
                  <text
                    x="10"
                    y={phase.y + 42}
                    fill="#6B7280"
                    fontSize="12"
                    className="select-none"
                  >
                    {phase.workingDays} days
                  </text>

                  <rect
                    x={`${phase.startX}%`}
                    y={phase.y + 10}
                    width={`${phase.width}%`}
                    height="24"
                    fill={isSelected ? '#1D4ED8' : isHovered ? '#60A5FA' : phase.color || '#3B82F6'}
                    rx="4"
                    ry="4"
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => onPhaseClick?.(phase.id)}
                    onMouseEnter={() => setHoveredPhase(phase.id)}
                    onMouseLeave={() => setHoveredPhase(null)}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Phase</span>
          </div>
          <span>Click phases to select • Hover for details</span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
