/**
 * Milestone Marker Component
 *
 * Renders diamond-shaped milestone markers on the Gantt timeline.
 * Design: Steve Jobs/Jony Ive Apple HIG specification
 *
 * Features:
 * - Diamond SVG marker with drop shadow
 * - Frosted glass label background
 * - Hover scale effect (1.15x)
 * - Click to edit/delete
 * - Drag to move functionality
 * - Keyboard accessible
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Flag, Edit2, Trash2 } from "lucide-react";
import type { GanttMilestone } from "@/types/gantt-tool";

interface MilestoneMarkerProps {
  milestone: GanttMilestone;
  xPosition: number;
  yPosition: number;
  onEdit: (milestone: GanttMilestone) => void;
  onDelete: (milestoneId: string) => void;
  onMove?: (milestoneId: string, newX: number) => void;
  pixelToDate?: (x: number) => Date;
}

export function MilestoneMarker({
  milestone,
  xPosition,
  yPosition,
  onEdit,
  onDelete,
  onMove,
  pixelToDate,
}: MilestoneMarkerProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [currentX, setCurrentX] = useState(xPosition);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onMove && pixelToDate) {
      e.stopPropagation();
      setIsDragging(true);
      setDragStartX(e.clientX - currentX);
      document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStartX;
      setCurrentX(newX);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging && onMove && pixelToDate) {
      setIsDragging(false);
      document.body.style.cursor = '';
      const newX = e.clientX - dragStartX;
      onMove(milestone.id, newX);
      setCurrentX(newX);
    }
  };

  // Add global mouse event listeners when dragging
  if (typeof window !== 'undefined') {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }

  const displayX = isDragging ? currentX : xPosition;
  const displayColor = milestone.color || '#FF3B30'; // Apple red default

  return (
    <div className="milestone-marker-container" style={{ position: 'relative' }}>
      <button
        className={`milestone-marker ${isDragging ? 'milestone-marker--dragging' : ''}`}
        style={{
          position: 'absolute',
          left: `${displayX}px`,
          top: `${yPosition}px`,
          zIndex: isDragging ? 20 : 10,
        }}
        onMouseDown={handleMouseDown}
        onClick={() => setShowPopover(!showPopover)}
        aria-label={`Milestone: ${milestone.name} on ${format(new Date(milestone.date), 'MMM d, yyyy')}`}
      >
        {/* Diamond SVG */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className="milestone-diamond"
          style={{
            filter: isDragging
              ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        >
          <path
            d="M8 0 L16 8 L8 16 L0 8 Z"
            fill={displayColor}
            stroke="#fff"
            strokeWidth="2"
          />
          {milestone.icon && (
            <text
              x="8"
              y="11"
              fontSize="10"
              textAnchor="middle"
              fill="#fff"
            >
              {milestone.icon}
            </text>
          )}
        </svg>

        {/* Label with frosted glass effect */}
        <span className="milestone-label">
          {milestone.name}
        </span>
      </button>

      {/* Simple Popover */}
      {showPopover && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="fixed inset-0 z-[1000]"
            onClick={() => setShowPopover(false)}
          />
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div
            className="absolute z-[1001] bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[240px]"
            style={{
              left: `${displayX + 20}px`,
              top: `${yPosition}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start gap-2">
                <Flag className="w-4 h-4 mt-1" style={{ color: displayColor }} />
                <div>
                  <h4 className="font-semibold text-sm">{milestone.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(milestone.date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Description */}
              {milestone.description && (
                <p className="text-sm text-gray-700">{milestone.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    onEdit(milestone);
                    setShowPopover(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete milestone "${milestone.name}"?`)) {
                      onDelete(milestone.id);
                      setShowPopover(false);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-red-50 text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
