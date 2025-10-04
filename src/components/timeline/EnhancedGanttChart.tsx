"use client";

import { useState, useMemo } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { format, addDays, differenceInDays } from "date-fns";
import { 
  ChevronRight, 
  ChevronDown, 
  HelpCircle, 
  Calendar,
  Maximize2,
  Minimize2,
  Settings,
} from "lucide-react";
import { 
  calculateWorkingDays, 
  addWorkingDays,
  isHoliday,
  getHolidayName,
  getHolidaysInRange,
} from "@/data/holidays";
import type { Phase } from "@/types/core";
import { HolidayManagerModal } from "./HolidayManagerModal";

export function EnhancedGanttChart() {
  const { phases, updatePhase } = useTimelineStore();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [draggedPhase, setDraggedPhase] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'ABMY' | 'ABSG' | 'ABVN'>('ABMY');

  // Calculate timeline bounds
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (phases.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 180),
        totalDays: 180,
      };
    }

    const dates = phases.flatMap(p => [p.startDate, p.endDate]).filter((d): d is Date => d != null);
    if (dates.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 180),
        totalDays: 180,
      };
    }
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add 10% padding
    const padding = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24) * 0.1);
    const paddedMin = addDays(min, -padding);
    const paddedMax = addDays(max, padding);
    
    return {
      minDate: paddedMin,
      maxDate: paddedMax,
      totalDays: differenceInDays(paddedMax, paddedMin),
    };
  }, [phases]);

  // Expand/Collapse controls
  const handleExpandAll = () => {
    setExpandedPhases(new Set(phases.map(p => p.id)));
  };

  const handleCollapseAll = () => {
    setExpandedPhases(new Set());
  };

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  // Calculate position on timeline
  const getPhasePosition = (phase: Phase) => {
    if (!phase.startDate || !phase.endDate) {
      return { left: 0, width: 0 };
    }
    const startOffset = differenceInDays(phase.startDate, minDate);
    const duration = differenceInDays(phase.endDate, phase.startDate);

    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
    };
  };

  // Drag handlers for interactive adjustment
  const handleMouseDown = (
    e: React.MouseEvent,
    phaseId: string,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault();
    setDraggedPhase(phaseId);
    setDragMode(mode);
    setDragStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedPhase || !dragMode) return;

    const deltaX = e.clientX - dragStartX;
    const deltaDays = Math.round((deltaX / window.innerWidth) * totalDays);

    if (deltaDays === 0) return;

    const phase = phases.find(p => p.id === draggedPhase);
    if (!phase) return;

    let newStartDate = phase.startDate;
    let newEndDate = phase.endDate;

    switch (dragMode) {
      case 'move':
        newStartDate = addWorkingDays(phase.startDate, deltaDays, selectedRegion);
        const originalDuration = calculateWorkingDays(phase.startDate, phase.endDate, selectedRegion);
        newEndDate = addWorkingDays(newStartDate, originalDuration, selectedRegion);
        break;
      
      case 'resize-start':
        newStartDate = addWorkingDays(phase.startDate, deltaDays, selectedRegion);
        if (newStartDate >= phase.endDate) {
          newStartDate = addWorkingDays(phase.endDate, -1, selectedRegion);
        }
        break;
      
      case 'resize-end':
        newEndDate = addWorkingDays(phase.endDate, deltaDays, selectedRegion);
        if (newEndDate <= phase.startDate) {
          newEndDate = addWorkingDays(phase.startDate, 1, selectedRegion);
        }
        break;
    }

    const newWorkingDays = calculateWorkingDays(newStartDate, newEndDate, selectedRegion);

    updatePhase(draggedPhase, {
      startDate: newStartDate,
      endDate: newEndDate,
      workingDays: newWorkingDays,
    });

    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setDraggedPhase(null);
    setDragMode(null);
  };

  // Get holidays in visible range
  const visibleHolidays = useMemo(() => {
    return getHolidaysInRange(minDate, maxDate, selectedRegion);
  }, [minDate, maxDate, selectedRegion]);

  if (phases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No timeline generated yet. Generate a timeline first.
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm transition-colors"
            >
              <Minimize2 className="w-3 h-3" />
              Collapse All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Region Selector */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="ABMY">Malaysia</option>
            <option value="ABSG">Singapore</option>
            <option value="ABVN">Vietnam</option>
          </select>

          {/* Holiday Manager */}
          <button
            onClick={() => setShowHolidayManager(true)}
            className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Holidays ({visibleHolidays.length})
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-600 mb-1">Start Date</div>
          <div className="font-semibold text-gray-900">
            {format(minDate, 'MMM dd, yyyy')}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">End Date</div>
          <div className="font-semibold text-gray-900">
            {format(maxDate, 'MMM dd, yyyy')}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Total Working Days</div>
          <div className="font-semibold text-gray-900">
            {phases.reduce((sum, p) => sum + p.workingDays, 0)} days
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Holidays in Range</div>
          <div className="font-semibold text-gray-900">
            {visibleHolidays.length} days
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="space-y-2">
        {/* Month Headers */}
        <div className="flex border-b border-gray-200 pb-2">
          <div className="w-64 shrink-0" />
          <div className="flex-1 relative h-8">
            {generateMonthMarkers(minDate, maxDate).map((marker, idx) => (
              <div
                key={idx}
                className="absolute top-0 text-xs font-medium text-gray-600"
                style={{ left: `${marker.position}%` }}
              >
                {marker.label}
              </div>
            ))}
          </div>
        </div>

        {/* Phase Rows */}
        {phases.map((phase) => (
          <PhaseRow
            key={phase.id}
            phase={phase}
            isExpanded={expandedPhases.has(phase.id)}
            onToggleExpand={() => togglePhaseExpansion(phase.id)}
            position={getPhasePosition(phase)}
            onMouseDown={handleMouseDown}
            isDragging={draggedPhase === phase.id}
            region={selectedRegion}
            minDate={minDate}
            maxDate={maxDate}
          />
        ))}
      </div>

      {/* Holiday Markers */}
      <div className="relative h-4 mt-4 border-t border-gray-200 pt-2">
        {visibleHolidays.map((holiday, idx) => {
          const holidayDate = new Date(holiday.date);
          const offset = differenceInDays(holidayDate, minDate);
          const position = (offset / totalDays) * 100;
          
          return (
            <div
              key={idx}
              className="absolute w-px h-4 bg-red-400"
              style={{ left: `${position}%` }}
              title={holiday.name}
            />
          );
        })}
      </div>

      {/* Holiday Manager Modal */}
      {showHolidayManager && (
        <HolidayManagerModal
          region={selectedRegion}
          onClose={() => setShowHolidayManager(false)}
        />
      )}
    </div>
  );
}

// Phase Row Component
function PhaseRow({
  phase,
  isExpanded,
  onToggleExpand,
  position,
  onMouseDown,
  isDragging,
  region,
  minDate,
  maxDate,
}: {
  phase: Phase;
  isExpanded: boolean;
  onToggleExpand: () => void;
  position: { left: number; width: number };
  onMouseDown: (e: React.MouseEvent, phaseId: string, mode: 'move' | 'resize-start' | 'resize-end') => void;
  isDragging: boolean;
  region: 'ABMY' | 'ABSG' | 'ABVN';
  minDate: Date;
  maxDate: Date;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!phase.startDate || !phase.endDate) {
    return null;
  }

  const workingDays = calculateWorkingDays(phase.startDate, phase.endDate, region);
  const holidays = getHolidaysInRange(phase.startDate, phase.endDate, region);

  return (
    <div className="group">
      <div className="flex items-center hover:bg-gray-50 py-2 rounded">
        {/* Phase Name */}
        <div className="w-64 shrink-0 flex items-center gap-2 px-3">
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-gray-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900 truncate">
              {phase.name}
            </div>
            <div className="text-xs text-gray-500">
              {workingDays} working days
            </div>
          </div>

          {/* Calculation Info Icon */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
            
            {showTooltip && (
              <CalculationTooltip 
                phase={phase} 
                workingDays={workingDays}
                holidays={holidays}
                region={region}
              />
            )}
          </div>
        </div>

        {/* Gantt Bar */}
        <div className="flex-1 relative h-12 px-2">
          {/* Background grid */}
          <div className="absolute inset-0 border-b border-gray-100" />

          {/* Phase Bar */}
          <div
            className={`
              absolute top-2 h-8 rounded-lg transition-all
              ${isDragging ? 'opacity-60 shadow-2xl scale-105' : 'shadow-md hover:shadow-lg'}
              ${phase.color || 'bg-blue-500'}
              cursor-move
            `}
            style={{
              left: `${position.left}%`,
              width: `${position.width}%`,
            }}
            onMouseDown={(e) => onMouseDown(e, phase.id, 'move')}
          >
            {/* Resize Handle - Start */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 group-hover:bg-black/10"
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e, phase.id, 'resize-start');
              }}
            />

            {/* Date Labels */}
            <div className="absolute -top-5 left-1 text-xs text-gray-600 font-medium whitespace-nowrap">
              {format(phase.startDate, 'MMM dd')}
            </div>
            <div className="absolute -top-5 right-1 text-xs text-gray-600 font-medium whitespace-nowrap">
              {format(phase.endDate, 'MMM dd')}
            </div>

            {/* Duration Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xs font-semibold px-2 bg-black/20 rounded">
                {workingDays}d
              </span>
            </div>

            {/* Resize Handle - End */}
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 group-hover:bg-black/10"
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e, phase.id, 'resize-end');
              }}
            />
          </div>
        </div>
      </div>

      {/* Sub-phases (if expanded) */}
      {isExpanded && phase.dependencies && phase.dependencies.length > 0 && (
        <div className="ml-8 border-l-2 border-gray-200 pl-4 py-2">
          <div className="text-xs text-gray-500">
            Dependencies: {phase.dependencies.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}

// Calculation Tooltip
function CalculationTooltip({ 
  phase, 
  workingDays, 
  holidays,
  region 
}: { 
  phase: Phase; 
  workingDays: number;
  holidays: any[];
  region: string;
}) {
  const totalCalendarDays = differenceInDays(phase.endDate, phase.startDate);
  const weekendDays = Math.floor(totalCalendarDays / 7) * 2;

  return (
    <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 text-xs">
      <div className="font-semibold text-gray-900 mb-3 text-sm">
        Calculation Breakdown
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Calendar Days:</span>
          <span className="font-medium text-gray-900">{totalCalendarDays} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Weekend Days:</span>
          <span className="font-medium text-red-600">-{weekendDays} days</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Holidays ({region}):</span>
          <span className="font-medium text-red-600">-{holidays.length} days</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="text-gray-900 font-semibold">Working Days:</span>
          <span className="font-bold text-green-600">{workingDays} days</span>
        </div>
      </div>

      {holidays.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="text-gray-600 font-medium mb-2">Holidays in Range:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {holidays.map((h, idx) => (
              <div key={idx} className="text-gray-700 flex justify-between">
                <span>{h.name}</span>
                <span className="text-gray-500">{format(new Date(h.date), 'MMM dd')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t text-gray-500">
        <div>Start: {format(phase.startDate, 'EEEE, MMM dd, yyyy')}</div>
        <div>End: {format(phase.endDate, 'EEEE, MMM dd, yyyy')}</div>
      </div>
    </div>
  );
}

// Helper: Generate month markers for header
function generateMonthMarkers(startDate: Date, endDate: Date): Array<{ position: number; label: string }> {
  const markers: Array<{ position: number; label: string }> = [];
  const totalDays = differenceInDays(endDate, startDate);
  
  let current = new Date(startDate);
  current.setDate(1); // Start of month
  
  while (current <= endDate) {
    const offset = differenceInDays(current, startDate);
    const position = (offset / totalDays) * 100;
    
    markers.push({
      position: Math.max(0, position),
      label: format(current, 'MMM yyyy'),
    });
    
    // Move to next month
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  
  return markers;
}