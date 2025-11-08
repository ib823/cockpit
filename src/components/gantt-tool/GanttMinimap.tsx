/**
 * Gantt Minimap Component
 *
 * RTS-style overview map showing full project timeline with focus indicator.
 * Inspired by StarCraft/Age of Empires minimap design.
 *
 * Features:
 * - Compact view of all phases
 * - Visual indicator of focused phase
 * - Click outside phases to exit focus mode
 * - Top-right floating position
 */

'use client';

import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { differenceInDays } from 'date-fns';
import { X, Maximize2, GripVertical } from 'lucide-react';
import React, { useState, useRef } from 'react';

export function GanttMinimap() {
  const { currentProject, focusedPhaseId, exitFocusMode, getProjectDuration } = useGanttToolStoreV2();

  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 310, y: 24 }); // Default top-right
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const minimapRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Keep minimap within viewport
    const maxX = window.innerWidth - 280;
    const maxY = window.innerHeight - 200;

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Attach global mouse listeners for dragging - MUST BE BEFORE CONDITIONAL RETURN
  React.useEffect(() => {
    if (isDragging) {
      const moveHandler = (e: MouseEvent) => handleMouseMove(e);
      const upHandler = () => handleMouseUp();

      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);

      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
      };
    }
  }, [isDragging, position, dragStart]);

  // Get duration and check if minimap should render
  const duration = getProjectDuration();

  // Conditional return AFTER all hooks
  if (!currentProject || !duration || !focusedPhaseId) return null;

  const { startDate, endDate, durationDays } = duration;

  // Calculate phase positions
  const getPhasePosition = (phase: typeof currentProject.phases[0]) => {
    const phaseStart = new Date(phase.startDate);
    const phaseEnd = new Date(phase.endDate);
    const offsetDays = differenceInDays(phaseStart, startDate);
    const phaseDuration = differenceInDays(phaseEnd, phaseStart);

    return {
      left: (offsetDays / durationDays) * 100,
      width: (phaseDuration / durationDays) * 100,
    };
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only exit if clicked directly on background (not on phase bars)
    if (e.target === e.currentTarget) {
      exitFocusMode();
    }
  };

  return (
    <div
      ref={minimapRef}
      className="fixed bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[100] overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header - Drag Handle */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b-2 border-blue-800 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-60" />
          <Maximize2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Project Overview</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            exitFocusMode();
          }}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          title="Exit Focus Mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Minimap Canvas */}
      <div
        className="relative bg-gradient-to-b from-gray-100 to-gray-200 cursor-pointer"
        style={{ width: '280px', height: '120px' }}
        onClick={handleBackgroundClick}
      >
        {/* Phase bars */}
        <div className="absolute inset-0 p-2">
          {currentProject.phases.map((phase) => {
            const position = getPhasePosition(phase);
            const isFocused = phase.id === focusedPhaseId;

            return (
              <div
                key={phase.id}
                className="relative mb-1.5"
                style={{ height: '14px' }}
              >
                {/* Phase bar */}
                <div
                  className={`absolute h-full rounded transition-all ${
                    isFocused
                      ? 'ring-2 ring-yellow-400 ring-offset-1 shadow-lg z-10 scale-105'
                      : 'opacity-70 hover:opacity-90'
                  }`}
                  style={{
                    left: `${position.left}%`,
                    width: `${position.width}%`,
                    backgroundColor: phase.color,
                  }}
                  title={phase.name}
                >
                  {/* Focus indicator overlay */}
                  {isFocused && (
                    <div className="absolute inset-0 bg-yellow-300/30 border-2 border-yellow-400 rounded animate-pulse" />
                  )}

                  {/* Phase name - only show for wider bars */}
                  {position.width > 15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[0.625rem] font-bold text-white drop-shadow truncate px-1">
                      {phase.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions overlay */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <div className="inline-block bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            Click background to exit zoom
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="px-3 py-1.5 bg-gray-800 text-white text-xs flex items-center justify-between border-t border-gray-700">
        <span className="font-semibold">{currentProject.phases.length} phases</span>
        <span className="text-gray-400">
          {Math.ceil(durationDays / 7)} weeks
        </span>
      </div>
    </div>
  );
}
