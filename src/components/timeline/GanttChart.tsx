import React, { useRef, useEffect, useState } from 'react';
import { Phase, Holiday } from '@/types/core';
import { businessDayToDate } from '@/lib/timeline/date-calculations';
import { useTimelineStore } from '@/stores/timeline-store';

interface GanttChartProps {
  phases: Phase[];
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  onPhaseClick?: (phaseId: string) => void;
  selectedPhaseId?: string | null;
  holidays?: Holiday[];
  showCalendarAxis?: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  phases,
  zoomLevel,
  onPhaseClick,
  selectedPhaseId,
  holidays = [],
  showCalendarAxis = true
}) => {
  const { phaseColors } = useTimelineStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // FIXED: Use full container width minus minimal padding
        const width = containerRef.current.offsetWidth - 20; // Minimal padding
        setContainerWidth(Math.max(800, width));
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  if (!phases.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No phases to display. Generate a timeline to see the Gantt chart.</p>
      </div>
    );
  }

  const projectStart = Math.min(...phases.map(p => p.startBusinessDay));
  const projectEnd = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
  const projectSpan = projectEnd - projectStart;

  const getOptimalZoom = () => {
    const availableWidth = containerWidth - 20; // Minimal margins
    const pixelsPerDay = availableWidth / projectSpan;
    
    if (pixelsPerDay >= 40 && projectSpan <= 7) {
      return { type: 'half-daily', interval: 0.5, label: 'Half-daily', format: 'time' };
    } else if (pixelsPerDay >= 25 && projectSpan <= 14) {
      return { type: 'daily', interval: 1, label: 'Daily', format: 'day' };
    } else if (pixelsPerDay >= 15 && projectSpan <= 30) {
      return { type: 'weekly', interval: 5, label: 'Weekly', format: 'day-month' };
    } else if (pixelsPerDay >= 12 && projectSpan <= 60) {
      return { type: 'bi-weekly', interval: 10, label: 'Bi-weekly', format: 'day-month' };
    } else if (pixelsPerDay >= 8 && projectSpan <= 120) {
      return { type: 'monthly', interval: 22, label: 'Monthly', format: 'month' };
    } else if (pixelsPerDay >= 6 && projectSpan <= 240) {
      return { type: 'bi-monthly', interval: 44, label: 'Bi-monthly', format: 'month' };
    } else if (pixelsPerDay >= 4 && projectSpan <= 500) {
      return { type: 'quarterly', interval: 65, label: 'Quarterly', format: 'quarter' };
    } else if (pixelsPerDay >= 3 && projectSpan <= 1000) {
      return { type: 'half-yearly', interval: 130, label: 'Half-yearly', format: 'half-year' };
    } else if (pixelsPerDay >= 2 && projectSpan <= 2000) {
      return { type: 'yearly', interval: 260, label: 'Yearly', format: 'year' };
    } else if (projectSpan <= 5000) {
      return { type: 'bi-yearly', interval: 520, label: 'Bi-yearly', format: 'year' };
    } else if (projectSpan <= 12000) {
      return { type: '5-yearly', interval: 1300, label: '5-yearly', format: 'year' };
    } else {
      return { type: 'decade', interval: 2600, label: 'Decade', format: 'decade' };
    }
  };

  const { type: zoomType, interval, label, format } = getOptimalZoom();
  
  // FIXED: Chart width uses nearly full container width
  const chartWidth = containerWidth - 20;
  const dayWidth = chartWidth / projectSpan;
  const phaseHeight = 50;
  const phaseGap = 6;

  const generateSmartCalendarMarkers = () => {
    const markers = [];
    const maxMarkers = Math.floor(containerWidth / 120);
    const actualInterval = Math.max(interval, Math.ceil(projectSpan / maxMarkers));
    
    for (let businessDay = projectStart; businessDay <= projectEnd; businessDay += actualInterval) {
      const actualBusinessDay = Math.min(businessDay, projectEnd);
      const date = businessDayToDate(actualBusinessDay);
      const x = (actualBusinessDay - projectStart) * dayWidth;
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let primary, secondary, tertiary;

      switch (format) {
        case 'time':
          primary = businessDay % 1 === 0 ? 'AM' : 'PM';
          secondary = String(date.getDate()).padStart(2, '0');
          tertiary = months[date.getMonth()];
          break;
        case 'day':
          primary = String(date.getDate()).padStart(2, '0');
          secondary = `${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
          tertiary = `(${days[date.getDay()]})`;
          break;
        case 'day-month':
          primary = String(date.getDate()).padStart(2, '0');
          secondary = `${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
          tertiary = `(${days[date.getDay()]})`;
          break;
        case 'month':
          primary = months[date.getMonth()];
          secondary = String(date.getFullYear());
          tertiary = '';
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          primary = `Q${quarter}`;
          secondary = String(date.getFullYear());
          tertiary = '';
          break;
        case 'half-year':
          const half = date.getMonth() < 6 ? 'H1' : 'H2';
          primary = half;
          secondary = String(date.getFullYear());
          tertiary = '';
          break;
        case 'year':
          primary = String(date.getFullYear());
          secondary = '';
          tertiary = '';
          break;
        case 'decade':
          const decade = Math.floor(date.getFullYear() / 10) * 10;
          primary = `${decade}s`;
          secondary = '';
          tertiary = '';
          break;
        default:
          primary = String(date.getDate()).padStart(2, '0');
          secondary = months[date.getMonth()];
          tertiary = '';
      }
      
      markers.push({ x, primary, secondary, tertiary });
    }
    
    return markers;
  };

  const calendarMarkers = showCalendarAxis ? generateSmartCalendarMarkers() : [];

  const getHolidayPosition = (holiday: Holiday) => {
    try {
      const holidayDate = new Date(holiday.date);
      const startDate = businessDayToDate(projectStart);
      const diffTime = holidayDate.getTime() - startDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let businessDays = 0;
      const current = new Date(startDate);
      
      for (let i = 0; i < diffDays && businessDays < projectSpan; i++) {
        current.setDate(current.getDate() + 1);
        if (current.getDay() !== 0 && current.getDay() !== 6) {
          businessDays++;
        }
      }
      
      return businessDays * dayWidth;
    } catch {
      return null;
    }
  };

  return (
    <div ref={containerRef} className="p-3"> {/* Minimal padding for full width */}
      {showCalendarAxis && (
        <div className="mb-6 relative" style={{ height: '70px' }}>
          <div className="text-xs text-gray-400 mb-3">
            {label} View ({projectSpan} working days, ~{Math.ceil(projectSpan / 22)} months)
          </div>
          
          {/* FIXED: Calendar uses full width */}
          <div className="relative" style={{ width: chartWidth, height: '50px' }}>
            {calendarMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{ left: marker.x, top: 0 }}
              >
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">{marker.primary}</div>
                  {marker.secondary && <div className="text-xs text-gray-500">{marker.secondary}</div>}
                  {marker.tertiary && <div className="text-xs text-gray-400">{marker.tertiary}</div>}
                </div>
                <div className="w-px h-4 bg-gray-300 mt-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FIXED: Gantt uses full width */}
      <div 
        className="relative bg-gray-50 rounded-lg"
        style={{ 
          height: phases.length * (phaseHeight + phaseGap) + phaseGap * 2,
          width: chartWidth, // Full width utilization
          minHeight: '200px'
        }}
      >
        <div style={{ width: chartWidth, height: '100%', position: 'relative' }}>
          
          {holidays.map((holiday, index) => {
            const x = getHolidayPosition(holiday);
            return x && x >= 0 && x <= chartWidth ? (
              <div
                key={index}
                className="absolute top-0 bottom-0 w-px bg-red-400 opacity-60 z-10"
                style={{ left: x }}
                title={`${holiday.name} (${holiday.date})`}
              />
            ) : null;
          })}

          {/* FIXED: Elegant 3D selection effect */}
          {phases.map((phase, index) => {
            const phaseColor = phaseColors[phase.id] || phase.color || '#3b82f6';
            const startX = (phase.startBusinessDay - projectStart) * dayWidth;
            const width = phase.workingDays * dayWidth;
            const y = index * (phaseHeight + phaseGap) + phaseGap;
            const isSelected = selectedPhaseId === phase.id;
            const resourceCount = phase.resources?.length || 0;

            return (
              <div
                key={phase.id}
                className={`absolute rounded-lg cursor-pointer transition-all duration-300 ease-out ${
                  isSelected 
                    ? 'z-30 shadow-2xl' // Elegant elevation
                    : 'hover:shadow-lg hover:-translate-y-0.5 z-10'
                }`}
                style={{
                  left: Math.max(0, startX),
                  top: y,
                  width: Math.max(20, width),
                  height: phaseHeight,
                  backgroundColor: phaseColor,
                  // ELEGANT 3D EFFECT: Professional elevation and glow
                  transform: isSelected 
                    ? 'translateY(-4px) scale(1.02)' 
                    : 'none',
                  boxShadow: isSelected 
                    ? `0 8px 32px rgba(0,0,0,0.15), 0 0 0 2px ${phaseColor}, 0 0 20px rgba(59,130,246,0.3)`
                    : 'none',
                  filter: isSelected 
                    ? 'brightness(1.05) saturate(1.1)' 
                    : selectedPhaseId ? 'opacity(0.8)' : 'none'
                }}
                onClick={() => onPhaseClick?.(phase.id)}
              >
                <div className="h-full flex items-center justify-between px-3 text-white">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{phase.name}</div>
                    <div className="text-xs opacity-90">{phase.workingDays}d</div>
                  </div>
                  <div className="bg-black bg-opacity-20 px-2 py-1 rounded text-sm font-bold">
                    {resourceCount}
                  </div>
                </div>

                {resourceCount > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 rounded-b-lg overflow-hidden">
                    <div className="h-full bg-white bg-opacity-60" style={{ width: '75%' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
