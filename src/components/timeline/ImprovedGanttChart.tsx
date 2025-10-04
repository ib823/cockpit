"use client";

import {
  calculateWorkingDays,
  getHolidaysInRange,
  isHoliday,
} from "@/data/holidays";
import { useTimelineStore } from "@/stores/timeline-store";
import type { Phase } from "@/types/core";
import { addDays, differenceInDays, format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface Stream {
  id: string;
  name: string;
  phases: Phase[];
  color: string;
  totalDays: number;
  totalEffort: number;
}

const STREAM_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-red-500",
];

export function ImprovedGanttChart({
  phases: phasesProp,
  onPhaseClick
}: {
  phases?: Phase[];
  onPhaseClick?: (phase: Phase) => void;
}) {
  const storePhases = useTimelineStore((state) => state.phases);
  const updatePhase = useTimelineStore((state) => state.updatePhase);
  const selectPhase = useTimelineStore((state) => state.selectPhase);
  const selectedPhaseId = useTimelineStore((state) => state.selectedPhaseId);

  const safePhases = Array.isArray(phasesProp)
    ? phasesProp
    : Array.isArray(storePhases)
    ? storePhases
    : [];

  // State
  const [collapsedStreams, setCollapsedStreams] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState<'ABMY' | 'ABSG' | 'ABVN'>('ABMY');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; date: Date; color: string }>>([]);
  
  // Drag state
  const [draggedPhase, setDraggedPhase] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPhase, setDragStartPhase] = useState<Phase | null>(null);

  // Group phases into streams
  const streams = useMemo(() => {
    if (safePhases.length === 0) return [];

    const streamMap = new Map<string, Phase[]>();

    safePhases.forEach((phase) => {
      const streamName = phase.category?.split(" - ")[0] || "General";
      if (!streamMap.has(streamName)) {
        streamMap.set(streamName, []);
      }
      streamMap.get(streamName)!.push(phase);
    });

    const streamList: Stream[] = [];
    let colorIndex = 0;

    streamMap.forEach((phases, name) => {
      const totalDays = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);
      const totalEffort = phases.reduce((sum, p) => sum + (p.effort || 0), 0);

      streamList.push({
        id: name.toLowerCase().replace(/\s+/g, "-"),
        name,
        phases,
        color: STREAM_COLORS[colorIndex % STREAM_COLORS.length],
        totalDays,
        totalEffort,
      });

      colorIndex++;
    });

    return streamList.sort((a, b) => b.totalEffort - a.totalEffort);
  }, [safePhases]);

  // Calculate timeline bounds
  const { minDate, maxDate, totalDays, startBusinessDay, endBusinessDay, totalBusinessDays } = useMemo(() => {
    if (safePhases.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 180),
        totalDays: 180,
        startBusinessDay: 0,
        endBusinessDay: 180,
        totalBusinessDays: 180,
      };
    }

    const start = Math.min(...safePhases.map((p) => p.startBusinessDay || 0));
    const end = Math.max(
      ...safePhases.map((p) => (p.startBusinessDay || 0) + (p.workingDays || 0))
    );

    const dates = safePhases.flatMap(p => [p.startDate, p.endDate]).filter((d): d is Date => d != null && d instanceof Date);

    if (dates.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        maxDate: addDays(today, 180),
        totalDays: 180,
        startBusinessDay: 0,
        endBusinessDay: 180,
        totalBusinessDays: 180,
      };
    }

    const minD = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxD = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      minDate: minD,
      maxDate: maxD,
      totalDays: differenceInDays(maxD, minD),
      startBusinessDay: start,
      endBusinessDay: end,
      totalBusinessDays: end - start,
    };
  }, [safePhases]);

  // Get holidays in range
  const visibleHolidays = useMemo(() => {
    return getHolidaysInRange(minDate, maxDate, selectedRegion);
  }, [minDate, maxDate, selectedRegion]);

  // Collapse/Expand handlers
  const handleExpandAll = () => {
    setExpandedPhases(new Set(safePhases.map(p => p.id)));
    setCollapsedStreams(new Set());
  };

  const handleCollapseAll = () => {
    setExpandedPhases(new Set());
    setCollapsedStreams(new Set(streams.map(s => s.id)));
  };

  const toggleStream = (streamId: string) => {
    setCollapsedStreams((prev) => {
      const next = new Set(prev);
      if (next.has(streamId)) {
        next.delete(streamId);
      } else {
        next.add(streamId);
      }
      return next;
    });
  };

  // Drag handlers
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    phaseId: string,
    mode: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    const phase = safePhases.find(p => p.id === phaseId);
    if (!phase) return;
    
    setDraggedPhase(phaseId);
    setDragMode(mode);
    setDragStartX(e.clientX);
    setDragStartPhase(phase);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedPhase || !dragMode || !dragStartPhase) return;

    const deltaX = e.clientX - dragStartX;
    const ganttWidth = window.innerWidth * 0.6;
    const pixelsPerDay = ganttWidth / totalBusinessDays;
    const deltaDays = Math.round(deltaX / pixelsPerDay);

    if (deltaDays === 0) return;

    let newStartDate = new Date(dragStartPhase.startDate);
    let newEndDate = new Date(dragStartPhase.endDate);

    switch (dragMode) {
      case 'move':
        newStartDate = addDays(dragStartPhase.startDate, deltaDays);
        newEndDate = addDays(dragStartPhase.endDate, deltaDays);
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
      
      case 'resize-start':
        newStartDate = addDays(dragStartPhase.startDate, deltaDays);
        newEndDate = new Date(dragStartPhase.endDate);
        while (isWeekend(newStartDate) || isHoliday(newStartDate, selectedRegion)) {
          newStartDate = addDays(newStartDate, deltaDays > 0 ? 1 : -1);
        }
        if (newStartDate >= newEndDate) {
          newStartDate = addDays(newEndDate, -1);
          while (isWeekend(newStartDate) || isHoliday(newStartDate, selectedRegion)) {
            newStartDate = addDays(newStartDate, -1);
          }
        }
        break;
      
      case 'resize-end':
        newStartDate = new Date(dragStartPhase.startDate);
        newEndDate = addDays(dragStartPhase.endDate, deltaDays);
        while (isWeekend(newEndDate) || isHoliday(newEndDate, selectedRegion)) {
          newEndDate = addDays(newEndDate, deltaDays > 0 ? 1 : -1);
        }
        if (newEndDate <= newStartDate) {
          newEndDate = addDays(newStartDate, 1);
          while (isWeekend(newEndDate) || isHoliday(newEndDate, selectedRegion)) {
            newEndDate = addDays(newEndDate, 1);
          }
        }
        break;
    }

    const newWorkingDays = calculateWorkingDays(newStartDate, newEndDate, selectedRegion);
    const newStartBusinessDay = differenceInDays(newStartDate, minDate);

    updatePhase(draggedPhase, {
      startDate: newStartDate,
      endDate: newEndDate,
      workingDays: newWorkingDays,
      startBusinessDay: newStartBusinessDay,
    });
  }, [draggedPhase, dragMode, dragStartPhase, dragStartX, selectedRegion, totalBusinessDays, minDate, updatePhase]);

  const handleMouseUp = () => {
    setDraggedPhase(null);
    setDragMode(null);
    setDragStartPhase(null);
  };

  // Resource avatars
  const renderResourceAvatars = (phase: Phase) => {
    const resources = phase.resources || [];
    if (resources.length === 0) return null;

    const visibleCount = Math.min(3, resources.length);
    const remainingCount = resources.length - visibleCount;

    return (
      <div className="flex items-center gap-1 mt-1 absolute bottom-1 left-2">
        {resources.slice(0, visibleCount).map((resource, idx) => {
          const initials =
            resource.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "??";

          return (
            <div
              key={idx}
              className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-semibold text-white backdrop-blur-sm"
              title={`${resource.name} - ${resource.role} (${resource.allocation}%)`}
            >
              {initials}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-[10px] font-semibold text-white backdrop-blur-sm"
            title={`${remainingCount} more team member${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Utilization bar
  const renderUtilizationBar = (phase: Phase) => {
    const resources = phase.resources || [];
    if (resources.length === 0) return null;

    const avgAllocation =
      resources.reduce((sum, r) => sum + (r.allocation || 0), 0) / resources.length;

    const barColor =
      avgAllocation > 100
        ? "bg-red-400"
        : avgAllocation >= 80
        ? "bg-orange-400"
        : "bg-green-400";

    return (
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 rounded-b-lg overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(100, avgAllocation)}%` }}
        />
      </div>
    );
  };

  if (safePhases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center shadow-sm">
        <p className="text-gray-500">
          No timeline generated yet. Select packages and generate a timeline.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-x-auto bg-white rounded-lg shadow-lg p-6"
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
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expand All
            </button>
            <button
              onClick={handleCollapseAll}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              Collapse All
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 transition-colors"
          >
            <option value="ABMY">🇲🇾 Malaysia</option>
            <option value="ABSG">🇸🇬 Singapore</option>
            <option value="ABVN">🇻🇳 Vietnam</option>
          </select>

          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm transition-colors border border-purple-200"
          >
            <Calendar className="w-4 h-4" />
            Holidays ({visibleHolidays.length})
          </button>

          <button
            onClick={() => setShowMilestoneModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm transition-colors border border-green-200"
          >
            <Flag className="w-4 h-4" />
            Milestones ({milestones.length})
          </button>
        </div>
      </div>

      {/* Timeline Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div>
          <div className="text-xs text-gray-600 mb-1">Start Date</div>
          <div className="font-semibold text-gray-900">{format(minDate, 'MMM dd, yyyy')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">End Date</div>
          <div className="font-semibold text-gray-900">{format(maxDate, 'MMM dd, yyyy')}</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Total Working Days</div>
          <div className="font-semibold text-gray-900">
            {safePhases.reduce((sum, p) => sum + (p.workingDays || 0), 0)} days
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">Holidays in Range</div>
          <div className="font-semibold text-gray-900">{visibleHolidays.length} days</div>
        </div>
      </div>

      {/* Month Headers */}
      <div className="flex border-b-2 border-gray-200 pb-3 mb-4">
        <div className="w-64 font-semibold text-gray-700 text-sm">Stream / Phase</div>
        <div className="flex-1 relative h-6">
          {generateMonthMarkers(minDate, maxDate, totalDays).map((marker, idx) => (
            <div
              key={idx}
              className="absolute text-xs font-medium text-gray-600"
              style={{ left: `${marker.position}%` }}
            >
              {marker.label}
            </div>
          ))}
        </div>
      </div>

      {/* Streams */}
      {streams.map((stream) => {
        const isCollapsed = collapsedStreams.has(stream.id);

        return (
          <div key={stream.id} className="mb-6">
            {/* Stream Header */}
            <div
              className="flex items-center mb-2 cursor-pointer group hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={() => toggleStream(stream.id)}
            >
              <div className="w-64 flex items-center gap-2">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
                <div className={`w-3 h-3 rounded ${stream.color}`} />
                <span className="font-semibold text-gray-900 text-sm">{stream.name}</span>
                <span className="text-xs text-gray-500">
                  ({stream.phases.length} phases · {stream.totalDays}d)
                </span>
              </div>
            </div>

            {/* Phases */}
            {!isCollapsed &&
              stream.phases.map((phase) => {
                const startPercent = ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
                const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;
                const isDragging = draggedPhase === phase.id;

                return (
                  <div key={phase.id} className="flex items-center mb-2 group/phase">
                    <div className="w-64 pl-8 pr-4">
                      <div className="text-sm text-gray-700 truncate">{phase.name}</div>
                      <div className="text-xs text-gray-500">{phase.workingDays}d</div>
                    </div>

                    <div className="flex-1 relative h-16">
                      {/* Phase Bar */}
                      <div
                        className={`
                          absolute top-2 h-12 rounded-lg transition-all cursor-pointer
                          ${isDragging 
                            ? 'opacity-70 shadow-2xl scale-105 cursor-grabbing ring-2 ring-blue-400' 
                            : `${stream.color} hover:shadow-xl cursor-grab hover:brightness-110`
                          }
                        `}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onClick={() => {
                          if (onPhaseClick) {
                            onPhaseClick(phase);
                          } else if (selectPhase) {
                            selectPhase(phase.id);
                          }
                        }}
                        onMouseDown={(e) => handleMouseDown(e, phase.id, 'move')}
                      >
                        {/* Resize Handles */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover/phase:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, phase.id, 'resize-start');
                          }}
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover/phase:opacity-100 transition-opacity"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleMouseDown(e, phase.id, 'resize-end');
                          }}
                        />

                        {/* Phase Content */}
                        <div className="p-2 h-full flex flex-col justify-between pointer-events-none">
                          {/* Dates */}
                          <div className="flex justify-between text-[10px] text-white/80 font-medium">
                            <span>{format(phase.startDate, 'MMM dd')}</span>
                            <span>{format(phase.endDate, 'MMM dd')}</span>
                          </div>

                          {/* Duration */}
                          <div className="text-center">
                            <span className="text-xs font-bold text-white px-2 py-0.5 bg-black/20 rounded">
                              {phase.workingDays}d
                            </span>
                          </div>
                        </div>

                        {/* Avatars */}
                        {renderResourceAvatars(phase)}
                        
                        {/* Utilization */}
                        {renderUtilizationBar(phase)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        );
      })}

      {/* Holiday Markers */}
      <div className="relative mt-8 border-t border-gray-200 pt-4">
        <div className="text-xs font-medium text-gray-600 mb-2 px-2">Public Holidays</div>
        <div className="relative h-12 bg-gradient-to-b from-red-50 to-transparent rounded">
          {visibleHolidays.map((holiday, idx) => {
            const holidayDate = new Date(holiday.date);
            const offset = differenceInDays(holidayDate, minDate);
            const position = (offset / totalDays) * 100;
            
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 group"
                style={{ left: `calc(16rem + ${position}% * (100% - 16rem) / 100)` }}
              >
                <div className="w-0.5 h-full bg-red-500 relative">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {holiday.name}
                      <div className="text-gray-300">{format(holidayDate, 'MMM dd, yyyy')}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Markers */}
      {milestones.length > 0 && (
        <div className="relative mt-6 border-t border-gray-200 pt-4">
          <div className="text-xs font-medium text-gray-600 mb-2 px-2">Project Milestones</div>
          <div className="relative h-16 bg-gradient-to-r from-green-50 to-purple-50 rounded">
            {milestones.map((milestone) => {
              const offset = differenceInDays(milestone.date, minDate);
              const position = (offset / totalDays) * 100;
              
              return (
                <div
                  key={milestone.id}
                  className="absolute top-0 bottom-0"
                  style={{ left: `calc(16rem + ${position}% * (100% - 16rem) / 100)` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className={`w-4 h-4 ${milestone.color} rotate-45 border-2 border-white shadow-lg`} />
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                    {milestone.name}
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs text-gray-500 whitespace-nowrap">
                    {format(milestone.date, 'MMM dd')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Generate month markers
function generateMonthMarkers(startDate: Date, endDate: Date, totalDays: number): Array<{ position: number; label: string }> {
  const markers: Array<{ position: number; label: string }> = [];
  
  let current = new Date(startDate);
  current.setDate(1);
  
  while (current <= endDate) {
    const offset = differenceInDays(current, startDate);
    const position = (offset / totalDays) * 100;
    
    markers.push({
      position: Math.max(0, position),
      label: format(current, 'MMM yyyy'),
    });
    
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }
  
  return markers;
}