"use client";
import { MilestoneManagerModal } from "./MilestoneManagerModal";

import {
  addWorkingDays,
  calculateWorkingDays,
  getHolidaysInRange,
  isHoliday
} from "@/data/holidays";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import type { Phase } from "@/types/core";
import { addDays, differenceInDays, format } from "date-fns";
import {
  Calendar,
  Flag,
  HelpCircle,
  Settings,
  Users
} from "lucide-react";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { HolidayManagerModal } from "./HolidayManagerModal";

// Project base date for business day calculations
const PROJECT_BASE_DATE = new Date(2024, 0, 1); // January 1, 2024

interface Milestone {
  id: string;
  name: string;
  date: Date;
  color: string;
}

export function EnhancedGanttChart() {
  const { phases: rawPhases, updatePhase } = useTimelineStore();
  const setMode = useProjectStore(state => state.setMode);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [draggedPhase, setDraggedPhase] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPhase, setDragStartPhase] = useState<Phase | null>(null);
  const [showHolidayManager, setShowHolidayManager] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<'ABMY' | 'ABSG' | 'ABVN'>('ABMY');
  const dragThrottleRef = useRef<number | null>(null);

  // Milestones state - initialized with computed dates
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Convert phases with business days to phases with actual dates
  const phases = useMemo(() => {
    return rawPhases.map(phase => ({
      ...phase,
      startDate: addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, selectedRegion),
      endDate: addWorkingDays(
        PROJECT_BASE_DATE,
        (phase.startBusinessDay || 0) + (phase.workingDays || 0),
        selectedRegion
      ),
    }));
  }, [rawPhases, selectedRegion]);

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
  // Drag handlers for interactive adjustment
  const handleMouseDown = (
  e: React.MouseEvent,
  phaseId: string,
  mode: 'move' | 'resize-start' | 'resize-end'
) => {
  e.preventDefault();
  e.stopPropagation();
  
  const phase = phases.find(p => p.id === phaseId);
  if (!phase) return;
  
  setDraggedPhase(phaseId);
  setDragMode(mode);
  setDragStartX(e.clientX);
  setDragStartPhase(phase);
};

const handleMouseMove = useCallback((e: React.MouseEvent) => {
  // Throttle to 60fps for smoothness
  if (dragThrottleRef.current) return;

  dragThrottleRef.current = window.requestAnimationFrame(() => {
    dragThrottleRef.current = null;

    if (!draggedPhase || !dragMode || !dragStartPhase) return;

    const deltaX = e.clientX - dragStartX;

    // Calculate days moved (improved sensitivity)
    const ganttWidth = window.innerWidth * 0.65; // Adjust based on actual width
    const pixelsPerDay = ganttWidth / totalDays;
    let deltaDays = Math.round(deltaX / pixelsPerDay);

    // Minimum threshold to prevent jittery updates
    if (Math.abs(deltaDays) === 0) return;

    const phase = phases.find(p => p.id === draggedPhase);
    if (!phase) return;

    let newStartDate = new Date(dragStartPhase.startDate);
    let newEndDate = new Date(dragStartPhase.endDate);

  switch (dragMode) {
    case 'move': {
      // Move both dates by the same amount
      newStartDate = addDays(dragStartPhase.startDate, deltaDays);
      newEndDate = addDays(dragStartPhase.endDate, deltaDays);
      
      // Adjust for weekends/holidays
      while (isWeekend(newStartDate) || isHoliday(newStartDate, selectedRegion)) {
        if (deltaDays > 0) {
          newStartDate = addDays(newStartDate, 1);
          newEndDate = addDays(newEndDate, 1);
        } else {
          newStartDate = addDays(newStartDate, -1);
          newEndDate = addDays(newEndDate, -1);
        }
      }
      break;
    }
    
    case 'resize-start': {
      // Only adjust start date, keep end fixed
      newStartDate = addDays(dragStartPhase.startDate, deltaDays);
      newEndDate = new Date(dragStartPhase.endDate); // Keep original end
      
      // Skip weekends/holidays
      while (isWeekend(newStartDate) || isHoliday(newStartDate, selectedRegion)) {
        newStartDate = addDays(newStartDate, deltaDays > 0 ? 1 : -1);
      }
      
      // Ensure minimum 1 working day duration
      if (newStartDate >= newEndDate) {
        newStartDate = addDays(newEndDate, -1);
        while (isWeekend(newStartDate) || isHoliday(newStartDate, selectedRegion)) {
          newStartDate = addDays(newStartDate, -1);
        }
      }
      break;
    }
    
    case 'resize-end': {
      // Only adjust end date, keep start fixed
      newStartDate = new Date(dragStartPhase.startDate); // Keep original start
      newEndDate = addDays(dragStartPhase.endDate, deltaDays);
      
      // Skip weekends/holidays
      while (isWeekend(newEndDate) || isHoliday(newEndDate, selectedRegion)) {
        newEndDate = addDays(newEndDate, deltaDays > 0 ? 1 : -1);
      }
      
      // Ensure minimum 1 working day duration
      if (newEndDate <= newStartDate) {
        newEndDate = addDays(newStartDate, 1);
        while (isWeekend(newEndDate) || isHoliday(newEndDate, selectedRegion)) {
          newEndDate = addDays(newEndDate, 1);
        }
      }
      break;
    }
  }

    const newWorkingDays = calculateWorkingDays(newStartDate, newEndDate, selectedRegion);

    updatePhase(draggedPhase, {
      startDate: newStartDate,
      endDate: newEndDate,
      workingDays: newWorkingDays,
    });
  });
}, [draggedPhase, dragMode, dragStartPhase, dragStartX, selectedRegion, phases, totalDays, updatePhase]);

  const handleMouseUp = () => {
  setDraggedPhase(null);
  setDragMode(null);
  setDragStartPhase(null);
};

  // Helper to check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Get holidays in visible range
  const visibleHolidays = useMemo(() => {
    return getHolidaysInRange(minDate, maxDate, selectedRegion);
  }, [minDate, maxDate, selectedRegion]);

  // Initialize milestones when phases are available
  useEffect(() => {
    if (milestones.length === 0 && phases.length > 0) {
      const dates = phases.flatMap(p => [p.startDate, p.endDate]).filter((d): d is Date => d != null);
      if (dates.length > 0) {
        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));
        setMilestones([
          { id: 'm1', name: 'Project Kickoff', date: min, color: 'bg-green-500' },
          { id: 'm2', name: 'Go-Live', date: max, color: 'bg-purple-500' },
        ]);
      }
    }
  }, [phases, milestones.length]);

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
    <div className="text-sm text-gray-600">
      {phases.length} phases
    </div>
  </div>

  <div className="flex items-center gap-3">
    {/* Region Selector */}
    <select
      value={selectedRegion}
      onChange={(e) => setSelectedRegion(e.target.value as any)}
      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 transition-colors"
    >
      <option value="ABMY">🇲🇾 Malaysia</option>
      <option value="ABSG">🇸🇬 Singapore</option>
      <option value="ABVN">🇻🇳 Vietnam</option>
    </select>

    {/* Holiday Manager */}
    <button
      onClick={() => setShowHolidayManager(true)}
      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm transition-colors border border-purple-200"
    >
      <Calendar className="w-4 h-4" />
      Manage Holidays
    </button>

    {/* Milestone Manager */}
    <button
      onClick={() => setShowMilestoneModal(true)}
      className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm transition-colors border border-green-200"
    >
      <Flag className="w-4 h-4" />
      Milestones ({milestones.length})
    </button>

    {/* Resource Allocation */}
    <button
      onClick={() => setMode('optimize')}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors shadow-md"
    >
      <Users className="w-4 h-4" />
      Allocate Resources
    </button>

    <button
      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm transition-colors border border-gray-200"
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
      <div className="relative mt-6 border-t border-gray-200 pt-4">
  <div className="text-xs font-medium text-gray-600 mb-2">Public Holidays</div>
  <div className="relative h-12 bg-gray-50 rounded">
    {visibleHolidays.map((holiday, idx) => {
      const holidayDate = new Date(holiday.date);
      const offset = differenceInDays(holidayDate, minDate);
      const position = (offset / totalDays) * 100;
      
      return (
        <div
          key={idx}
          className="absolute top-0 bottom-0 group"
          style={{ left: `${position}%` }}
        >
          {/* Holiday line */}
          <div className="w-0.5 h-full bg-red-500 relative">
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {holiday.name}
                <div className="text-gray-300">{format(holidayDate, 'MMM dd, yyyy')}</div>
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
          </div>
          {/* Top marker */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow" />
        </div>
      );
    })}
  </div>
</div>

      {/* Milestone Markers */}
      <div className="relative mt-6 border-t border-gray-200 pt-4">
        <div className="text-xs font-medium text-gray-600 mb-2">Project Milestones</div>
        <div className="relative h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded">
          {milestones.map((milestone) => {
            const offset = differenceInDays(milestone.date, minDate);
            const position = (offset / totalDays) * 100;

            return (
              <div
                key={milestone.id}
                className="absolute top-0 bottom-0 group cursor-pointer"
                style={{ left: `${position}%` }}
              >
                {/* Milestone diamond */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 ${milestone.color} rotate-45 border-2 border-white shadow-lg`} />
                </div>
                {/* Label */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {milestone.name}
                </div>
                {/* Date */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs text-gray-500 whitespace-nowrap">
                  {format(milestone.date, 'MMM dd')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holiday Manager Modal */}
      {showHolidayManager && (
        <HolidayManagerModal
          region={selectedRegion}
          onClose={() => setShowHolidayManager(false)}
        />
      )}

      {/* Milestone Manager Modal */}
      {showMilestoneModal && (
        <MilestoneManagerModal
          milestones={milestones}
          onUpdate={(updated) => {
            setMilestones(updated);
            setShowMilestoneModal(false);
          }}
          onClose={() => setShowMilestoneModal(false)}
        />
      )}
    </div>
  );
}

// Phase Row Component
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
  const workingDays = calculateWorkingDays(phase.startDate, phase.endDate, region);
  const holidays = getHolidaysInRange(phase.startDate, phase.endDate, region);

  return (
    <div className="group">
      <div className="flex items-center hover:bg-gray-50 py-2 rounded">
        {/* Phase Name */}
        <div className="w-64 shrink-0 flex items-center gap-2 px-3">
          {/* Chevron - currently decorative, can be functional if phases have sub-items */}
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          
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
              absolute top-2 h-8 rounded-lg transition-all duration-150
              ${isDragging
                ? 'opacity-70 shadow-2xl scale-105 cursor-grabbing ring-4 ring-blue-300'
                : 'shadow-md hover:shadow-xl cursor-grab hover:scale-102'
              }
              bg-gradient-to-r from-blue-500 to-blue-600
            `}
            style={{
              left: `${position.left}%`,
              width: `${position.width}%`,
            }}
            onMouseDown={(e) => onMouseDown(e, phase.id, 'move')}
          >
            {/* Resize Handle - Start */}
            <div
              className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e, phase.id, 'resize-start');
              }}
              title="Drag to adjust start date"
            >
              <div className="w-1 h-4 bg-white/50 rounded" />
            </div>

            {/* Date Labels */}
            <div className="absolute -top-5 left-1 text-xs text-gray-600 font-medium whitespace-nowrap pointer-events-none">
              {format(phase.startDate, 'MMM dd')}
            </div>
            <div className="absolute -top-5 right-1 text-xs text-gray-600 font-medium whitespace-nowrap pointer-events-none">
              {format(phase.endDate, 'MMM dd')}
            </div>

            {/* Duration Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-white text-xs font-semibold px-2 py-1 bg-black/20 rounded">
                {workingDays}d
              </span>
            </div>

            {/* Resize Handle - End */}
            <div
              className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e, phase.id, 'resize-end');
              }}
              title="Drag to adjust end date"
            >
              <div className="w-1 h-4 bg-white/50 rounded" />
            </div>
          </div>
        </div>
      </div>
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