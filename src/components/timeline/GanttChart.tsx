"use client";
import { businessDayToDate } from '@/lib/timeline/date-calculations';
import { Phase } from '@/lib/timeline/phase-generation';
import { useTimelineStore } from '@/stores/timeline-store';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ITEM_TYPE = 'PHASE_ROW';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

interface DraggablePhaseRowProps {
  phase: Phase;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  onPhaseClick: (phaseId: string) => void;
  onHover: (phaseId: string | null) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  chartWidth: number;
  startBusinessDay: number;
  totalBusinessDays: number;
}

const DraggablePhaseRow: React.FC<DraggablePhaseRowProps> = ({
  phase,
  index,
  isSelected,
  isHovered,
  onPhaseClick,
  onHover,
  onMove,
  chartWidth,
  startBusinessDay,
  totalBusinessDays
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: ITEM_TYPE,
    item: () => ({
      id: phase.id,
      index,
      type: ITEM_TYPE,
    }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: any }>({
    accept: ITEM_TYPE,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  // Calculate phase bar position using business days
  const relativeStart = phase.startBusinessDay - startBusinessDay;
  const x = Math.max(0, (relativeStart / totalBusinessDays) * chartWidth);
  const width = Math.max(30, (phase.workingDays / totalBusinessDays) * chartWidth);
  const rowHeight = 45;

  const phaseColor = isSelected ? '#2563eb' : (phase.color || '#3b82f6');
  const phaseOpacity = isDragging ? 0.5 : 1;

  const attachRef = useCallback((node: HTMLDivElement) => {
    if (node) { (ref as any).current = node; }
    drag(drop(node));
  }, [drag, drop]);

  return (
    <div
      ref={attachRef}
      data-handler-id={handlerId}
      style={{ 
        position: 'absolute',
        top: index * rowHeight + 30,
        left: 0,
        width: chartWidth,
        height: rowHeight,
        opacity: phaseOpacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 1,
      }}
      className="transition-opacity duration-200"
    >
      {/* SVG for the phase visualization */}
      <svg
        width={chartWidth}
        height={rowHeight}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Drop indicator */}
        {isDragging && (
          <line
            x1={0}
            y1={2}
            x2={chartWidth}
            y2={2}
            stroke="#3b82f6"
            strokeWidth={3}
            strokeDasharray="5,5"
          />
        )}
        
        {/* Phase background */}
        <rect
          x={0}
          y={0}
          width={chartWidth}
          height={rowHeight - 5}
          fill={isDragging ? '#f3f4f6' : 'transparent'}
          stroke={isDragging ? '#d1d5db' : 'none'}
          strokeWidth={1}
        />
        
        {/* Phase bar */}
        <rect
          x={x}
          y={7}
          width={width}
          height={28}
          rx={4}
          fill={phaseColor}
          stroke={isHovered ? '#1d4ed8' : phaseColor}
          strokeWidth={isHovered ? 2 : 1}
          className="transition-all cursor-pointer"
          onClick={() => onPhaseClick(phase.id)}
          onMouseEnter={() => onHover(phase.id)}
          onMouseLeave={() => onHover(null)}
        />
        
        {/* Phase name */}
        <text
          x={x + 8}
          y={25}
          fill="white"
          fontSize="12"
          fontWeight="500"
          className="pointer-events-none select-none"
          textAnchor="start"
        >
          {phase.name}
        </text>
        
        {/* Duration label */}
        <text
          x={x + width - 8}
          y={25}
          fill="white"
          fontSize="10"
          className="pointer-events-none select-none"
          textAnchor="end"
        >
          {phase.workingDays}d
        </text>
      </svg>
      
      {/* HTML drag handle - works better with React DND */}
      <div
        style={{
          position: 'absolute',
          right: 20,
          top: 8,
          width: 24,
          height: 20,
          backgroundColor: isDragging ? '#3b82f6' : 'rgba(255,255,255,0.95)',
          border: isDragging ? '2px solid #2563eb' : '1px solid #d1d5db',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          fontSize: '10px',
          color: isDragging ? 'white' : '#6b7280',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
        className="hover:bg-blue-100"
      >
        ⋮⋮⋮
      </div>
    </div>
  );
};

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
  const { movePhaseOrder } = useTimelineStore();

  const { startBusinessDay, endBusinessDay, totalBusinessDays } = useMemo(() => {
    if (!phases.length) return { startBusinessDay: 0, endBusinessDay: 0, totalBusinessDays: 0 };
    
    const start = Math.min(...phases.map(p => p.startBusinessDay));
    const end = Math.max(...phases.map(p => p.startBusinessDay + p.workingDays));
    
    return { 
      startBusinessDay: start, 
      endBusinessDay: end, 
      totalBusinessDays: end - start 
    };
  }, [phases]);

  const handlePhaseMove = useCallback((dragIndex: number, hoverIndex: number) => {
    console.log('React DND: Moving phase from', dragIndex, 'to', hoverIndex);
    movePhaseOrder(dragIndex, hoverIndex);
  }, [movePhaseOrder]);

  const handlePhaseClick = useCallback((phaseId: string) => {
    onPhaseClick?.(phaseId);
  }, [onPhaseClick]);

  if (!phases.length) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-gray-400 mb-2 text-2xl">📊</div>
          <p className="text-gray-500">Generate a timeline to see the Gantt chart</p>
          <p className="text-sm text-gray-400 mt-1">Select packages and click Generate Timeline</p>
        </div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = phases.length * 45 + 80;

  const startDate = businessDayToDate(startBusinessDay);
  const endDate = businessDayToDate(endBusinessDay);
  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Project Timeline - Enhanced Drag & Drop</h3>
              <p className="text-sm text-gray-600">
                {formatDateRange(startDate, endDate)} • {phases.length} phases
              </p>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                Phase
              </span>
              <div className="bg-green-100 px-2 py-1 rounded text-green-700">
                Drag handle (⋮⋮⋮) to reorder - works immediately!
              </div>
            </div>
          </div>
        </div>
        
        {/* Chart Container */}
        <div className="p-4 overflow-x-auto">
          <div 
            style={{ 
              position: 'relative', 
              width: chartWidth, 
              height: chartHeight,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8
            }}
          >
            {/* Background Grid SVG */}
            <svg
              width={chartWidth}
              height={chartHeight}
              style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}
            >
              <defs>
                <pattern id="grid" width="50" height="45" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 45" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Timeline header */}
              <rect x={0} y={0} width={chartWidth} height={30} fill="#f9fafb" />
              <text x={10} y={20} className="fill-gray-700 text-sm font-medium">
                Timeline: {formatDateRange(startDate, endDate)}
              </text>
            </svg>
            
            {/* Draggable Phase Rows */}
            {phases.map((phase, index) => (
              <DraggablePhaseRow
                key={phase.id}
                phase={phase}
                index={index}
                isSelected={selectedPhaseId === phase.id}
                isHovered={hoveredPhase === phase.id}
                onPhaseClick={handlePhaseClick}
                onHover={setHoveredPhase}
                onMove={handlePhaseMove}
                chartWidth={chartWidth}
                startBusinessDay={startBusinessDay}
                totalBusinessDays={totalBusinessDays}
              />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            <strong>✅ React DND:</strong> Smooth, responsive drag & drop. Click and drag any handle (⋮⋮⋮) to reorder phases.
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default GanttChart;