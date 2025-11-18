/**
 * HeatmapPhaseBar - Apple-inspired heatmap visualization for collapsed phases
 *
 * Design Principles (Jobs/Ive):
 * - Simplicity: Immediately understand task density at a glance
 * - Precision: Accurate time-based segmentation
 * - Beauty: Smooth gradients, refined aesthetics
 * - Purposeful: Every color has meaning
 * - Subtle: Elegant, not overwhelming
 *
 * Features:
 * - Time-sliced heatmap showing task density
 * - Darker colors = more task overlap
 * - Light gray = no tasks in that period
 * - Smooth animations on collapse/expand
 * - Hover tooltips showing task count
 */

"use client";

import React, { useMemo } from "react";
import { differenceInDays, addDays, format, isWithinInterval } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { GanttPhase, GanttTask } from "@/types/gantt-tool";

interface HeatmapPhaseBarProps {
  phase: GanttPhase;
  phasePosition: { left: number; width: number }; // Percentage-based position
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
  isHovered?: boolean;
}

interface TimeSlice {
  startDate: Date;
  endDate: Date;
  taskCount: number; // Number of overlapping tasks
  tasks: string[]; // Task names for tooltip
}

/**
 * Calculate task density heatmap for a phase
 * Divides phase timeline into slices and counts ACTUALLY OVERLAPPING tasks
 *
 * IMPORTANT: We measure tasks that are ACTIVE during the slice midpoint,
 * not just tasks that span the slice. This gives accurate density representation.
 */
function calculateHeatmap(phase: GanttPhase, sliceCount: number = 20): TimeSlice[] {
  const phaseStart = new Date(phase.startDate);
  const phaseEnd = new Date(phase.endDate);
  const phaseDuration = differenceInDays(phaseEnd, phaseStart);

  // Adaptive slice size based on phase duration
  // Short phases: fewer slices for clarity
  // Long phases: more slices for detail
  const adaptiveSliceCount = Math.min(sliceCount, Math.max(5, Math.ceil(phaseDuration / 3)));
  const sliceDuration = phaseDuration / adaptiveSliceCount;

  const slices: TimeSlice[] = [];

  for (let i = 0; i < adaptiveSliceCount; i++) {
    const sliceStart = addDays(phaseStart, i * sliceDuration);
    const sliceEnd = i === adaptiveSliceCount - 1
      ? phaseEnd
      : addDays(phaseStart, (i + 1) * sliceDuration);

    // Sample at the midpoint of the slice to check what tasks are active
    const sliceMidpoint = addDays(sliceStart, sliceDuration / 2);

    // Count tasks that are ACTUALLY ACTIVE at the slice midpoint
    const overlappingTasks = phase.tasks.filter((task) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);

      // Task is active if midpoint falls within task duration
      // This gives us the TRUE overlap count at any given moment
      return sliceMidpoint >= taskStart && sliceMidpoint <= taskEnd;
    });

    slices.push({
      startDate: sliceStart,
      endDate: sliceEnd,
      taskCount: overlappingTasks.length,
      tasks: overlappingTasks.map(t => t.name),
    });
  }

  return slices;
}

/**
 * Get color for a time slice based on task density
 * Apple HIG color system with semantic meaning
 *
 * Pixar Principle: Colors should "feel right" and have clear visual hierarchy
 */
function getSliceColor(taskCount: number): string {
  if (taskCount === 0) {
    // Empty state: Distinct light gray with subtle warmth (planning gap)
    // More visible than before so empty sections are clearly different
    return "rgba(0, 0, 0, 0.10)";
  } else if (taskCount === 1) {
    // Light activity: Soft blue (single task)
    return "rgba(0, 122, 255, 0.35)";
  } else if (taskCount === 2) {
    // Medium activity: Clear blue (parallel work)
    return "rgba(0, 122, 255, 0.55)";
  } else if (taskCount === 3) {
    // High activity: Strong blue (heavy workload)
    return "rgba(0, 122, 255, 0.70)";
  } else {
    // Critical density: Deep blue (potential bottleneck - 4+ tasks simultaneously)
    return "rgba(0, 122, 255, 0.85)";
  }
}

export function HeatmapPhaseBar({
  phase,
  phasePosition,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  isDragOver = false,
  isHovered = false,
}: HeatmapPhaseBarProps) {
  // Calculate heatmap slices
  const heatmapSlices = useMemo(() => {
    return calculateHeatmap(phase);
  }, [phase.startDate, phase.endDate, phase.tasks]);

  // Calculate total phase duration for percentage calculations
  const phaseDuration = useMemo(() => {
    return differenceInDays(new Date(phase.endDate), new Date(phase.startDate));
  }, [phase.startDate, phase.endDate]);

  // Hover state for individual slices
  const [hoveredSliceIndex, setHoveredSliceIndex] = React.useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: "-50%" }}
      animate={{ opacity: 1, scale: 1, y: "-50%" }}
      exit={{ opacity: 0, scale: 0.92, y: "-50%" }}
      transition={{
        // Pixar-style spring animation: smooth, natural, with slight bounce
        type: "spring",
        stiffness: 300,      // How "tight" the spring is
        damping: 24,         // How quickly it settles (lower = more bounce)
        mass: 0.8,           // Weight of the element (affects momentum)
        duration: 0.6,       // Total animation time
      }}
      style={{
        position: "absolute",
        left: `${phasePosition.left}%`,
        width: `${phasePosition.width}%`,
        top: "50%",
        height: "24px",
        borderRadius: "6px",
        overflow: "hidden",
        cursor: "pointer",
        border: isDragOver
          ? "2px solid rgba(52, 199, 89, 0.8)"
          : phase.phaseType === "ams"
          ? "2px dashed rgba(59, 130, 246, 0.8)"
          : "none",
        boxShadow: isDragOver
          ? "0 4px 16px rgba(52, 199, 89, 0.4), 0 0 0 3px rgba(52, 199, 89, 0.15)"
          : isHovered
          ? "0 2px 8px rgba(0, 0, 0, 0.12)"
          : "none",
        background: phase.phaseType === "ams"
          ? `url("data:image/svg+xml,%3Csvg width='40' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 8 L8 12 L0 16 Z M12 8 L20 12 L12 16 Z M24 8 L32 12 L24 16 Z' fill='rgba(59, 130, 246, 0.25)'/%3E%3C/svg%3E")`
          : "transparent",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => {
        setHoveredSliceIndex(null);
        onMouseLeave?.();
      }}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Heatmap Segments */}
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
        }}
      >
        {heatmapSlices.map((slice, index) => {
          const sliceDuration = differenceInDays(slice.endDate, slice.startDate);
          const sliceWidthPercent = (sliceDuration / phaseDuration) * 100;
          const isHoveredSlice = hoveredSliceIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                // Pixar-style: gentle spring with cascading reveal
                type: "spring",
                stiffness: 260,
                damping: 20,
                mass: 0.6,
                delay: index * 0.025, // Subtle stagger for organic feel
              }}
              style={{
                flex: `0 0 ${sliceWidthPercent}%`,
                height: "100%",
                backgroundColor: getSliceColor(slice.taskCount),
                transition: "background-color 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isHoveredSlice ? "scaleY(1.18)" : "scaleY(1)",
                borderRight: index < heatmapSlices.length - 1 ? "0.5px solid rgba(255, 255, 255, 0.2)" : "none",
                position: "relative",
              }}
              onMouseEnter={() => setHoveredSliceIndex(index)}
              onMouseLeave={() => setHoveredSliceIndex(null)}
            >
              {/* Slice Hover Tooltip - Jobs/Ive: Informative, not intrusive */}
              {isHoveredSlice && slice.taskCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "rgba(0, 0, 0, 0.92)",
                    color: "white",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 1000,
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    animation: "fadeInUp 0.15s ease",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "2px" }}>
                    {slice.taskCount} task{slice.taskCount > 1 ? 's' : ''}
                  </div>
                  <div style={{ opacity: 0.7, fontSize: "9px" }}>
                    {format(slice.startDate, "MMM d")} - {format(slice.endDate, "MMM d")}
                  </div>
                  {/* Triangle pointer */}
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 0,
                      height: 0,
                      borderLeft: "4px solid transparent",
                      borderRight: "4px solid transparent",
                      borderTop: "4px solid rgba(0, 0, 0, 0.92)",
                    }}
                  />
                </div>
              )}

              {/* Empty state indicator - subtle diagonal stripes for better visibility */}
              {slice.taskCount === 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0, 0, 0, 0.04) 4px, rgba(0, 0, 0, 0.04) 5px)",
                    pointerEvents: "none",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Drag overlay - Pixar-style smooth fade */}
      {isDragOver && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(52, 199, 89, 0.2)",
            pointerEvents: "none",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      )}
    </motion.div>
  );
}

// CSS animations injected via style tag (Pixar-smooth easing)
if (typeof document !== "undefined") {
  const styleId = "heatmap-phase-bar-animations";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translate(-50%, 6px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }

      /* Pixar-style smooth pulse with ease-in-out */
      @keyframes pulse {
        0%, 100% {
          opacity: 0.15;
          transform: scale(1);
        }
        50% {
          opacity: 0.35;
          transform: scale(1.02);
        }
      }
    `;
    document.head.appendChild(style);
  }
}
