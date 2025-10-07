"use client";

import {
  addWorkingDays,
  calculateWorkingDays,
  getHolidaysInRange,
  isHoliday,
} from "@/data/holidays";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import type { Phase } from "@/types/core";
import { addDays, differenceInDays, format } from "date-fns";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Flag,
  Maximize2,
  Minimize2,
  Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HolidayManagerModal } from "./HolidayManagerModal";
import { MilestoneManagerModal } from "./MilestoneManagerModal";
import { ResourceManagerModal } from "./ResourceManagerModal";
import { Button } from "@/components/common/Button";
import { Heading3 } from "@/components/common/Typography";
import { generateTasksForPhase } from "@/lib/task-templates";

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

// Project base date for business day calculations - use current year
const PROJECT_BASE_DATE = new Date(new Date().getFullYear(), 0, 1); // January 1 of current year

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
  const setMode = useProjectStore(state => state.setMode);

  const rawPhases = Array.isArray(phasesProp)
    ? phasesProp
    : Array.isArray(storePhases)
    ? storePhases
    : [];

  // Compute phases with dates if they don't have them
  const safePhases = useMemo(() => {
    return rawPhases.map(phase => {
      // If phase already has dates, use them
      if (phase.startDate && phase.endDate) {
        return phase;
      }

      // Otherwise compute from business days
      const startDate = addWorkingDays(
        PROJECT_BASE_DATE,
        phase.startBusinessDay || 0,
        'ABMY' // Default region
      );
      const endDate = addWorkingDays(
        PROJECT_BASE_DATE,
        (phase.startBusinessDay || 0) + (phase.workingDays || 0),
        'ABMY'
      );

      return {
        ...phase,
        startDate,
        endDate,
      };
    });
  }, [rawPhases]);

  // State - Default to all collapsed
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
  const dragThrottleRef = useRef<number | null>(null);

  // Edit mode state
  const [editingField, setEditingField] = useState<{ phaseId: string; field: 'start' | 'end' | 'duration' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // Resource management state
  const [selectedPhaseForResources, setSelectedPhaseForResources] = useState<Phase | null>(null);

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

  // Initialize milestones and default collapsed state when phases are available
  useEffect(() => {
    if (milestones.length === 0 && safePhases.length > 0) {
      const dates = safePhases.flatMap(p => [p.startDate, p.endDate]).filter((d): d is Date => d != null && d instanceof Date);
      if (dates.length > 0) {
        const min = new Date(Math.min(...dates.map(d => d.getTime())));
        const max = new Date(Math.max(...dates.map(d => d.getTime())));
        setMilestones([
          { id: 'm1', name: 'Project Kickoff', date: min, color: 'bg-green-500' },
          { id: 'm2', name: 'Go-Live', date: max, color: 'bg-purple-500' },
        ]);
      }
    }

    // Default all streams to collapsed on initial load
    if (streams.length > 0 && collapsedStreams.size === 0) {
      setCollapsedStreams(new Set(streams.map(s => s.id)));
    }
  }, [safePhases, milestones.length, streams, collapsedStreams.size]);

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

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Handle editable date/duration updates
  const handleDateDurationUpdate = useCallback((
    phase: Phase,
    field: 'start' | 'end' | 'duration',
    newValue: string
  ) => {
    if (!updatePhase) return;

    const startDate = phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, selectedRegion);
    const endDate = phase.endDate || addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), selectedRegion);

    let updatedPhase: Partial<Phase> = {};

    if (field === 'duration') {
      // Update duration (working days)
      const newDuration = parseInt(newValue, 10);
      if (isNaN(newDuration) || newDuration <= 0) return;

      const newEndDate = addWorkingDays(startDate, newDuration, selectedRegion);
      const newEndBusinessDay = calculateWorkingDays(PROJECT_BASE_DATE, newEndDate, selectedRegion);

      updatedPhase = {
        ...phase,
        workingDays: newDuration,
        endDate: newEndDate,
      };
    } else if (field === 'start') {
      // Update start date
      const newStartDate = new Date(newValue);
      if (isNaN(newStartDate.getTime())) return;

      // Calculate new start business day
      const newStartBusinessDay = calculateWorkingDays(PROJECT_BASE_DATE, newStartDate, selectedRegion);

      // Recalculate end date based on duration
      const newEndDate = addWorkingDays(newStartDate, phase.workingDays || 0, selectedRegion);

      updatedPhase = {
        ...phase,
        startDate: newStartDate,
        startBusinessDay: newStartBusinessDay,
        endDate: newEndDate,
      };
    } else if (field === 'end') {
      // Update end date
      const newEndDate = new Date(newValue);
      if (isNaN(newEndDate.getTime())) return;

      // Calculate new duration
      const newDuration = calculateWorkingDays(startDate, newEndDate, selectedRegion);
      if (newDuration <= 0) return;

      updatedPhase = {
        ...phase,
        endDate: newEndDate,
        workingDays: newDuration,
      };
    }

    updatePhase(phase.id, updatedPhase);
    setEditingField(null);
  }, [updatePhase, selectedRegion]);

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
    // Throttle to 60fps for smoothness
    if (dragThrottleRef.current) return;

    dragThrottleRef.current = window.requestAnimationFrame(() => {
      dragThrottleRef.current = null;

      if (!draggedPhase || !dragMode || !dragStartPhase) return;

      const deltaX = e.clientX - dragStartX;
      const ganttWidth = window.innerWidth * 0.6;
      const pixelsPerDay = ganttWidth / totalBusinessDays;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (deltaDays === 0) return;

      // Get start and end dates with fallbacks
      const currentStartDate = dragStartPhase.startDate || addWorkingDays(PROJECT_BASE_DATE, dragStartPhase.startBusinessDay || 0, selectedRegion);
      const currentEndDate = dragStartPhase.endDate || addWorkingDays(PROJECT_BASE_DATE, (dragStartPhase.startBusinessDay || 0) + (dragStartPhase.workingDays || 0), selectedRegion);

      let newStartDate = new Date(currentStartDate);
      let newEndDate = new Date(currentEndDate);

    switch (dragMode) {
      case 'move':
        newStartDate = addDays(currentStartDate, deltaDays);
        newEndDate = addDays(currentEndDate, deltaDays);
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
        newStartDate = addDays(currentStartDate, deltaDays);
        newEndDate = new Date(currentEndDate);
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
        newStartDate = new Date(currentStartDate);
        newEndDate = addDays(currentEndDate, deltaDays);
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
      className="relative overflow-x-auto bg-white rounded-lg shadow-lg p-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Heading3>Project Timeline</Heading3>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExpandAll}
              leftIcon={<Maximize2 className="w-4 h-4" />}
            >
              Expand All
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCollapseAll}
              leftIcon={<Minimize2 className="w-4 h-4" />}
            >
              Collapse All
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Select region"
          >
            <option value="ABMY">🇲🇾 Malaysia</option>
            <option value="ABSG">🇸🇬 Singapore</option>
            <option value="ABVN">🇻🇳 Vietnam</option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHolidayModal(true)}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            Holidays ({visibleHolidays.length})
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMilestoneModal(true)}
            leftIcon={<Flag className="w-4 h-4" />}
          >
            Milestones ({milestones.length})
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setMode('optimize')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Allocate Resources
          </Button>
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

      {/* Timeline Area with Vertical Markers */}
      <div className="relative">
        {/* Holiday Markers - Triangle at top */}
        {visibleHolidays.map((holiday, idx) => {
          const holidayDate = new Date(holiday.date);
          const offset = differenceInDays(holidayDate, minDate);
          const position = (offset / totalDays) * 100;

          return (
            <div
              key={`holiday-${idx}`}
              className="absolute top-0 z-20 group cursor-help pointer-events-auto"
              style={{ left: `calc(16rem + (100% - 16rem) * ${position / 100} - 6px)` }}
            >
              {/* Triangle marker */}
              <div className="relative">
                <svg width="12" height="12" viewBox="0 0 12 12" className="drop-shadow-md">
                  <polygon
                    points="6,0 12,12 0,12"
                    className="fill-red-500 group-hover:fill-red-600 transition-colors"
                  />
                </svg>

                {/* Tooltip on hover */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  <div className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
                    <div className="font-semibold">{holiday.name}</div>
                    <div className="text-red-100 text-[10px] mt-0.5">{format(holidayDate, 'EEEE, MMM dd, yyyy')}</div>
                  </div>
                  {/* Arrow pointer */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Milestone Markers - Flag at top, higher z-index */}
        {milestones.map((milestone) => {
          const offset = differenceInDays(milestone.date, minDate);
          const position = (offset / totalDays) * 100;

          return (
            <div
              key={`milestone-${milestone.id}`}
              className="absolute top-0 z-30 group cursor-help pointer-events-auto"
              style={{ left: `calc(16rem + (100% - 16rem) * ${position / 100} - 8px)` }}
            >
              {/* Flag marker */}
              <div className="relative">
                <Flag className="w-4 h-4 text-purple-600 fill-purple-600 drop-shadow-md group-hover:text-purple-700 group-hover:fill-purple-700 transition-colors" />

                {/* Tooltip on hover */}
                <div className="absolute top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
                  <div className="bg-purple-600 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
                    <div className="font-semibold">{milestone.name}</div>
                    <div className="text-purple-100 text-[10px] mt-0.5">{format(milestone.date, 'MMM dd, yyyy')}</div>
                  </div>
                  {/* Arrow pointer */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-600 rotate-45"></div>
                </div>
              </div>
            </div>
          );
        })}

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

            {/* Collapsed View - Show ALL phases with full details */}
            {isCollapsed && (
              <div className="space-y-2">
                {stream.phases.map((phase) => {
                  const startPercent = ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
                  const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;

                  return (
                    <div key={phase.id} className="flex items-center group/phase">
                      <div className="w-64 pl-8 pr-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-700 truncate">{phase.name}</div>
                          <div className="text-xs text-gray-500">{phase.workingDays}d • {phase.effort}md</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhaseForResources(phase);
                          }}
                          className="ml-2 opacity-0 group-hover/phase:opacity-100"
                          aria-label="Allocate Resources"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex-1 relative h-16">
                        {/* Full insightful phase bar */}
                        <div
                          className={`absolute top-2 h-12 rounded-lg ${stream.color} hover:shadow-xl hover:brightness-110 transition-all cursor-pointer`}
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
                        >
                          {/* Phase Content */}
                          <div className="p-2 h-full flex flex-col justify-between">
                            {/* Dates */}
                            <div className="flex justify-between text-[10px] text-white/80 font-medium gap-1">
                              <span>
                                {phase.startDate ? format(phase.startDate, 'MMM dd') : format(addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, selectedRegion), 'MMM dd')}
                              </span>
                              <span>
                                {phase.endDate ? format(phase.endDate, 'MMM dd') : format(addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), selectedRegion), 'MMM dd')}
                              </span>
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
            )}

            {/* Phases */}
            {!isCollapsed &&
              stream.phases.map((phase) => {
                const startPercent = ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
                const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;
                const isDragging = draggedPhase === phase.id;
                const isPhaseExpanded = expandedPhases.has(phase.id);

                // Tasks are manually created by user (no auto-generation)
                const phaseTasks = phase.tasks || [];

                return (
                  <div key={phase.id}>
                    {/* Phase Row */}
                    <div className="flex items-center mb-2 group/phase">
                      <div className="w-64 pl-8 pr-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {phaseTasks && phaseTasks.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePhase(phase.id);
                              }}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={isPhaseExpanded ? "Collapse tasks" : "Expand tasks"}
                            >
                              {isPhaseExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div className="flex-1">
                            <div className="text-sm text-gray-700 truncate">{phase.name}</div>
                            <div className="text-xs text-gray-500">{phase.workingDays}d • {phase.effort}md</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhaseForResources(phase);
                          }}
                          className="ml-2 opacity-0 group-hover/phase:opacity-100"
                          aria-label="Allocate Resources"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>

                    <div className="flex-1 relative h-16">
                      {/* Phase Bar */}
                      <div
                        className={`
                          absolute top-2 h-12 rounded-lg transition-all duration-150
                          ${isDragging
                            ? 'opacity-70 shadow-2xl scale-105 cursor-grabbing ring-4 ring-blue-300'
                            : `${stream.color} hover:shadow-xl hover:brightness-110`
                          }
                        `}
                        style={{
                          left: `${startPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onClick={(e) => {
                          // Only trigger if not dragging (click vs drag detection)
                          if (!isDragging) {
                            if (onPhaseClick) {
                              onPhaseClick(phase);
                            } else if (selectPhase) {
                              selectPhase(phase.id);
                            }
                          }
                        }}
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
                        <div className="p-2 h-full flex flex-col justify-between">
                          {/* Dates - Editable */}
                          <div className="flex justify-between text-[10px] text-white/80 font-medium gap-1">
                            {/* Start Date */}
                            {editingField?.phaseId === phase.id && editingField.field === 'start' ? (
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleDateDurationUpdate(phase, 'start', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDateDurationUpdate(phase, 'start', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                autoFocus
                                className="w-20 px-1 text-gray-900 rounded pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const startDate = phase.startDate || addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, selectedRegion);
                                  setEditingField({ phaseId: phase.id, field: 'start' });
                                  setEditValue(format(startDate, 'yyyy-MM-dd'));
                                }}
                                title="Click to edit start date"
                              >
                                {phase.startDate ? format(phase.startDate, 'MMM dd') : format(addWorkingDays(PROJECT_BASE_DATE, phase.startBusinessDay || 0, selectedRegion), 'MMM dd')}
                              </span>
                            )}

                            {/* End Date */}
                            {editingField?.phaseId === phase.id && editingField.field === 'end' ? (
                              <input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleDateDurationUpdate(phase, 'end', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDateDurationUpdate(phase, 'end', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                autoFocus
                                className="w-20 px-1 text-gray-900 rounded pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:bg-white/20 px-1 rounded transition-colors pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const endDate = phase.endDate || addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), selectedRegion);
                                  setEditingField({ phaseId: phase.id, field: 'end' });
                                  setEditValue(format(endDate, 'yyyy-MM-dd'));
                                }}
                                title="Click to edit end date"
                              >
                                {phase.endDate ? format(phase.endDate, 'MMM dd') : format(addWorkingDays(PROJECT_BASE_DATE, (phase.startBusinessDay || 0) + (phase.workingDays || 0), selectedRegion), 'MMM dd')}
                              </span>
                            )}
                          </div>

                          {/* Duration - Editable */}
                          <div className="text-center">
                            {editingField?.phaseId === phase.id && editingField.field === 'duration' ? (
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleDateDurationUpdate(phase, 'duration', editValue)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDateDurationUpdate(phase, 'duration', editValue);
                                  if (e.key === 'Escape') setEditingField(null);
                                }}
                                autoFocus
                                className="w-16 px-1 text-gray-900 rounded text-center pointer-events-auto"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <span
                                className="text-xs font-bold text-white px-2 py-0.5 bg-black/20 rounded cursor-pointer hover:bg-black/30 transition-colors pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingField({ phaseId: phase.id, field: 'duration' });
                                  setEditValue(String(phase.workingDays || 0));
                                }}
                                title="Click to edit duration (business days)"
                              >
                                {phase.workingDays}d
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Avatars */}
                        {renderResourceAvatars(phase)}

                        {/* Utilization */}
                        {renderUtilizationBar(phase)}
                      </div>
                    </div>
                    </div>

                    {/* Tasks - Shown when phase is expanded */}
                    {isPhaseExpanded && phaseTasks && phaseTasks.length > 0 && (
                      <div className="ml-12 mt-1 mb-3 space-y-1">
                        {phaseTasks.map((task, idx) => (
                          <div key={task.id} className="flex items-center text-xs group/task">
                            <div className="w-52 pr-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">└</span>
                                <span className="truncate">{task.name}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 ml-4">
                                {task.workingDays}d • {task.effort}md • {task.defaultRole}
                              </div>
                            </div>
                            <div className="flex-1 relative h-8">
                              <div
                                className={`absolute top-1 h-6 rounded ${stream.color} opacity-30 hover:opacity-50 transition-opacity`}
                                style={{
                                  left: `${startPercent + (widthPercent * (phaseTasks.slice(0, idx).reduce((sum, t) => sum + t.daysPercent, 0) / 100))}%`,
                                  width: `${widthPercent * (task.daysPercent / 100)}%`,
                                }}
                                title={`${task.name} - ${task.defaultRole}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center gap-6 text-xs border-t border-gray-200 pt-4">
        <div className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <polygon points="6,0 12,12 0,12" className="fill-red-500" />
          </svg>
          <span className="text-gray-600">Public Holidays ({visibleHolidays.length})</span>
        </div>
        {milestones.length > 0 && (
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3 text-purple-600 fill-purple-600" />
            <span className="text-gray-600">Milestones ({milestones.length})</span>
          </div>
        )}
      </div>

      {/* Holiday Manager Modal */}
      {showHolidayModal && (
        <HolidayManagerModal
          region={selectedRegion}
          onClose={() => setShowHolidayModal(false)}
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

      {/* Resource Manager Modal */}
      {selectedPhaseForResources && updatePhase && (
        <ResourceManagerModal
          phase={selectedPhaseForResources}
          onClose={() => setSelectedPhaseForResources(null)}
          onSave={(resources) => {
            updatePhase(selectedPhaseForResources.id, { resources });
          }}
        />
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