import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { Phase, Holiday } from '@/types/core';
import { useTimelineStore } from '@/stores/timeline-store';
import { businessDayToDate, isHoliday, isWeekend } from '@/lib/timeline/date-calculations';

const ItemType = 'phase';

interface DraggablePhaseRowProps {
  phase: Phase;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onPhaseClick: (id: string) => void;
  onHover: (id: string | null) => void;
  onMove: (dragIndex: number, dropIndex: number) => void;
  startBusinessDay: number;
  dayWidth: number;
  phaseColor: string;
}

const DraggablePhaseRow: React.FC<DraggablePhaseRowProps> = ({
  phase,
  index,
  isSelected,
  isHovered,
  onPhaseClick,
  onHover,
  onMove,
  startBusinessDay,
  dayWidth,
  phaseColor,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = React.useRef<HTMLDivElement>(null);
  drag(drop(ref));

  const phaseStart = phase.startBusinessDay - startBusinessDay;
  const x = phaseStart * dayWidth;
  const width = Math.max(phase.workingDays * dayWidth - 2, 40);
  const y = 100 + index * 50;

  const barColor = phaseColor;
  const phaseOpacity = isDragging ? 0.5 : 1;

  // Calculate resource utilization
  const totalAllocation = (phase.resources || []).reduce((sum, r) => sum + (r.allocation || 0), 0);
  const avgUtilization = phase.resources?.length ? totalAllocation / phase.resources.length : 0;
  
  // Show max 3 avatars, then +X
  const visibleResources = (phase.resources || []).slice(0, 3);
  const remainingCount = Math.max(0, (phase.resources?.length || 0) - 3);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: '40px',
        opacity: phaseOpacity,
        cursor: isDragging ? 'grabbing' : 'pointer',
      }}
      onMouseEnter={() => onHover(phase.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundColor: barColor,
          borderRadius: '4px',
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
        onClick={() => onPhaseClick(phase.id)}
      >
        {/* Resource avatars */}
        {visibleResources.length > 0 && (
          <div style={{ position: 'absolute', top: '3px', left: '4px', display: 'flex' }}>
            {visibleResources.map((res, idx) => (
              <div
                key={idx}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: barColor,
                  marginLeft: idx > 0 ? '-4px' : '0',
                  zIndex: 3 - idx,
                }}
                title={`${res.role} (${res.allocation}%)`}
              >
                {res.role?.charAt(0).toUpperCase()}
              </div>
            ))}
            {remainingCount > 0 && (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: barColor,
                  marginLeft: '-4px',
                  zIndex: 0,
                }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )}
        
        {/* Utilization indicator bar */}
        {phase.resources && phase.resources.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '2px',
              left: '4px',
              right: '4px',
              height: '2px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '1px',
            }}
          >
            <div
              style={{
                width: `${Math.min(100, avgUtilization)}%`,
                height: '100%',
                backgroundColor: avgUtilization > 100 ? '#ef4444' : avgUtilization > 80 ? '#f59e0b' : '#10b981',
                borderRadius: '1px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}
        
        <div
          style={{
            padding: '0 8px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            fontSize: '12px',
            fontWeight: '400',
            paddingTop: phase.resources?.length ? '8px' : '0',
          }}
        >
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {phase.name}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.9, marginLeft: '4px' }}>
            {phase.workingDays}d
          </span>
        </div>
      </div>
    </div>
  );
};

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
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);
  const { movePhaseOrder, phaseColors, setPhaseColor } = useTimelineStore();

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth || 1200);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const startBusinessDay = useMemo(() => {
    if (!phases.length) return 0;
    return Math.min(...phases.map(p => p.startBusinessDay));
  }, [phases]);

  const endBusinessDay = useMemo(() => {
    if (!phases.length) return 100;
    return Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
  }, [phases]);

  const totalBusinessDays = Math.max(1, endBusinessDay - startBusinessDay);
  
  const minDayWidth = 30;
  const maxDayWidth = 80;
  const optimalDayWidth = Math.floor(containerWidth / totalBusinessDays);
  const dayWidth = Math.max(minDayWidth, Math.min(maxDayWidth, optimalDayWidth));
  
  const chartWidth = Math.max(containerWidth, totalBusinessDays * dayWidth);
  const chartHeight = phases.length * 50 + 150;

  const calendarDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i <= totalBusinessDays; i++) {
      const date = businessDayToDate(startBusinessDay + i);
      const isHol = holidays.some(h => {
        const hDate = new Date(h.date);
        return hDate.toDateString() === date.toDateString();
      });
      const isWknd = isWeekend(date);
      
      dates.push({
        businessDay: i,
        date,
        isHoliday: isHol,
        isWeekend: isWknd,
        holidayName: holidays.find(h => new Date(h.date).toDateString() === date.toDateString())?.name
      });
    }
    return dates;
  }, [startBusinessDay, totalBusinessDays, holidays]);

  const handlePhaseMove = useCallback((fromIndex: number, toIndex: number) => {
    movePhaseOrder(fromIndex, toIndex);
  }, [movePhaseOrder]);

  const handlePhaseClick = useCallback((phaseId: string) => {
    onPhaseClick?.(phaseId);
  }, [onPhaseClick]);

  const formatDateHeader = (date: Date) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: months[date.getMonth()],
      year: String(date.getFullYear()),
      dow: days[date.getDay()]
    };
  };

  // Color options
  const colorOptions = ['#3b82f6', '#10b981', '#8b5cf6'];

  if (!phases.length) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded border border-dashed border-gray-300">
        <p className="text-sm text-gray-500">Generate a timeline to see the Gantt chart</p>
      </div>
    );
  }

  // Safeguard against invalid chart dimensions
  const safeChartWidth = isNaN(chartWidth) ? 1200 : chartWidth;
  const safeDayWidth = isNaN(dayWidth) ? 40 : dayWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-lg overflow-hidden" ref={containerRef}>
        <div style={{ width: '100%', overflow: 'auto' }}>
          <div 
            style={{ 
              position: 'relative', 
              width: safeChartWidth,
              minHeight: chartHeight,
              backgroundColor: 'white',
            }}
          >
            {showCalendarAxis && (
              <div style={{ 
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                width: safeChartWidth,
              }}>
                <div style={{ 
                  display: 'flex',
                  height: '20px',
                  borderBottom: '1px solid #e5e7eb',
                }}>
                  {calendarDates.map((cal, idx) => {
                    const fmt = formatDateHeader(cal.date);
                    const showMonth = idx === 0 || fmt.day === '01';
                    return showMonth ? (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          left: `${idx * safeDayWidth}px`,
                          padding: '2px 6px',
                          fontSize: '10px',
                          fontWeight: '500',
                          color: '#374151',
                        }}
                      >
                        {fmt.month} {fmt.year}
                      </div>
                    ) : null;
                  })}
                </div>
                
                <div style={{ display: 'flex', height: '40px', width: safeChartWidth }}>
                  {calendarDates.map((cal, idx) => {
                    const fmt = formatDateHeader(cal.date);
                    const isToday = new Date().toDateString() === cal.date.toDateString();
                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${safeDayWidth}px`,
                          minWidth: `${safeDayWidth}px`,
                          borderRight: '1px solid #e5e7eb',
                          backgroundColor: isToday ? '#dbeafe' : cal.isWeekend ? '#fef3c7' : cal.isHoliday ? '#fee2e2' : 'transparent',
                          padding: '2px 0',
                          textAlign: 'center',
                          fontSize: '10px',
                        }}
                        title={cal.holidayName || ''}
                      >
                        <div style={{ fontWeight: isToday ? '500' : 'normal' }}>
                          {fmt.day}
                        </div>
                        <div style={{ fontSize: '9px', color: cal.isWeekend || cal.isHoliday ? '#dc2626' : '#6b7280' }}>
                          {fmt.dow}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <svg
              width={safeChartWidth}
              height={chartHeight - 60}
              style={{ position: 'absolute', top: 60, left: 0, zIndex: 0 }}
            >
              {calendarDates.map((cal, idx) => (
                <line
                  key={idx}
                  x1={idx * safeDayWidth}
                  y1={0}
                  x2={idx * safeDayWidth}
                  y2={chartHeight - 60}
                  stroke={cal.isWeekend || cal.isHoliday ? '#fbbf24' : '#f3f4f6'}
                  strokeWidth={1}
                  strokeDasharray={cal.isWeekend ? '2 2' : '0'}
                />
              ))}
            </svg>
            
            {phases.map((phase, index) => {
              const phaseColor = phaseColors?.[phase.id] || colorOptions[index % 3];
              return (
                <DraggablePhaseRow
                  key={phase.id}
                  phase={phase}
                  index={index}
                  isSelected={selectedPhaseId === phase.id}
                  isHovered={hoveredPhase === phase.id}
                  onPhaseClick={handlePhaseClick}
                  onHover={setHoveredPhase}
                  onMove={handlePhaseMove}
                  startBusinessDay={startBusinessDay}
                  dayWidth={safeDayWidth}
                  phaseColor={phaseColor}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default GanttChart;
