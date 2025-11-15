/**
 * Collapsed Phase Bar Visualization Demo
 *
 * Shows multiple design approaches for displaying aggregated task information
 * when a phase is collapsed in the Gantt timeline.
 *
 * Approaches:
 * 1. Stacked semi-transparent bars (Apple Activity Rings style)
 * 2. Density heatmap (color intensity = overlap count)
 * 3. Segmented bar (colored sections for each task)
 * 4. Activity rings (stacked circles)
 * 5. Battery usage style (segmented bar with regions)
 * 6. Storage usage style (colored segments)
 */

"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { Phase, Task } from "@/types/gantt-tool";

interface CollapsedPhaseVisualizationProps {
  phase: Phase;
  onClose?: () => void;
}

type VisualizationStyle = "stacked" | "heatmap" | "segmented" | "rings" | "battery" | "storage";

export function CollapsedPhaseVisualization({
  phase,
  onClose,
}: CollapsedPhaseVisualizationProps) {
  const [selectedStyle, setSelectedStyle] = useState<VisualizationStyle>("heatmap");

  if (!phase.tasks || phase.tasks.length === 0) {
    return null;
  }

  const tasks = phase.tasks;
  const phaseStart = new Date(phase.startDate);
  const phaseEnd = new Date(phase.endDate);
  const phaseDuration = phaseEnd.getTime() - phaseStart.getTime();

  // Calculate task positions and overlaps
  const getTaskPosition = (task: Task) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const left = ((taskStart.getTime() - phaseStart.getTime()) / phaseDuration) * 100;
    const width = ((taskEnd.getTime() - taskStart.getTime()) / phaseDuration) * 100;
    return { left, width };
  };

  // Get task colors (cycling through palette)
  const taskColors = [
    "#007AFF", // Blue
    "#34C759", // Green
    "#FF9500", // Orange
    "#FF3B30", // Red
    "#AF52DE", // Purple
  ];

  const getTaskColor = (index: number) => taskColors[index % taskColors.length];

  // Version A: Stacked semi-transparent bars
  const StackedBarsVersion = () => (
    <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
      <div>
        <h3 className="font-semibold text-sm mb-2">A) Stacked Semi-Transparent Bars</h3>
        <p className="text-xs text-gray-600 mb-3">Apple Activity Rings style - overlaid bars show which tasks exist</p>
      </div>
      <div className="relative h-16 bg-gray-50 rounded border border-gray-200 overflow-hidden">
        {/* Background timeline grid */}
        {[0, 25, 50, 75, 100].map((pos) => (
          <div
            key={pos}
            className="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${pos}%` }}
          />
        ))}

        {/* Stacked task bars */}
        {tasks.map((task, index) => {
          const pos = getTaskPosition(task);
          return (
            <div
              key={task.id}
              className="absolute top-0 bottom-0"
              style={{
                left: `${pos.left}%`,
                width: `${pos.width}%`,
                backgroundColor: getTaskColor(index),
                opacity: 0.3 + (index * 0.1),
                borderLeft: `2px solid ${getTaskColor(index)}`,
              }}
              title={`${task.name} (${format(new Date(task.startDate), "dd-MMM")} - ${format(new Date(task.endDate), "dd-MMM")})`}
            />
          );
        })}
      </div>
      <div className="text-xs text-gray-600">
        {tasks.length} task{tasks.length > 1 ? "s" : ""} in this phase
      </div>
    </div>
  );

  // Version B: Density heatmap
  const HeatmapVersion = () => {
    // Divide timeline into 20 segments and calculate overlap count
    const segments = 20;
    const segmentData = Array.from({ length: segments }, (_, i) => {
      const segmentStart = phaseStart.getTime() + (phaseDuration / segments) * i;
      const segmentEnd = phaseStart.getTime() + (phaseDuration / segments) * (i + 1);
      const overlapCount = tasks.filter((task) => {
        const taskStart = new Date(task.startDate).getTime();
        const taskEnd = new Date(task.endDate).getTime();
        return taskStart < segmentEnd && taskEnd > segmentStart;
      }).length;
      return overlapCount;
    });

    const maxOverlap = Math.max(...segmentData);

    const getHeatmapColor = (count: number) => {
      if (count === 0) return "rgba(200, 200, 200, 0.3)"; // Light gray
      if (count === 1) return "rgba(0, 122, 255, 0.4)"; // Light blue
      if (count === 2) return "rgba(0, 122, 255, 0.6)"; // Medium blue
      if (count === 3) return "rgba(0, 122, 255, 0.8)"; // Dark blue
      return "rgba(0, 122, 255, 1)"; // Very dark blue
    };

    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-sm mb-2">B) Density Heatmap</h3>
          <p className="text-xs text-gray-600 mb-3">Color intensity shows task overlap density (darker = more tasks)</p>
        </div>
        <div className="flex gap-1 h-12 bg-gray-50 rounded border border-gray-200 p-2 overflow-hidden">
          {segmentData.map((count, index) => (
            <div
              key={index}
              className="flex-1 rounded transition-all"
              style={{
                backgroundColor: getHeatmapColor(count),
              }}
              title={`${count} task${count !== 1 ? "s" : ""}`}
            />
          ))}
        </div>
        <div className="text-xs text-gray-600">
          Max concurrent tasks: {maxOverlap} | Segments showing density across timeline
        </div>
      </div>
    );
  };

  // Version C: Segmented bar
  const SegmentedVersion = () => {
    // Create segments for each task region
    const segments: Array<{ left: number; width: number; color: string; taskName: string }> = tasks.map((task, index) => {
      const pos = getTaskPosition(task);
      return {
        left: pos.left,
        width: pos.width,
        color: getTaskColor(index),
        taskName: task.name,
      };
    });

    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-sm mb-2">C) Segmented Bar</h3>
          <p className="text-xs text-gray-600 mb-3">Colored sections represent individual task regions on timeline</p>
        </div>
        <div className="relative h-8 bg-gray-50 rounded border border-gray-200 overflow-hidden">
          {/* Background timeline grid */}
          {[0, 25, 50, 75, 100].map((pos) => (
            <div
              key={pos}
              className="absolute top-0 bottom-0 w-px bg-gray-200"
              style={{ left: `${pos}%` }}
            />
          ))}

          {/* Segmented sections */}
          {segments.map((segment, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0"
              style={{
                left: `${segment.left}%`,
                width: `${Math.max(segment.width, 2)}%`,
                backgroundColor: segment.color,
                opacity: 0.7,
                borderRight: "1px solid white",
              }}
              title={segment.taskName}
            />
          ))}
        </div>
        <div className="text-xs text-gray-600 flex flex-wrap gap-2">
          {tasks.map((task, index) => (
            <span key={task.id} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: getTaskColor(index) }}
              />
              {task.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // Version D: Activity rings (stacked circles)
  const RingsVersion = () => {
    const ringRadius = 40;
    const ringWidth = 8;

    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-sm mb-2">D) Activity Rings (Apple Watch Style)</h3>
          <p className="text-xs text-gray-600 mb-3">Stacked circles represent task progress/completion</p>
        </div>
        <div className="flex justify-center items-center h-32 bg-gray-50 rounded border border-gray-200">
          <svg width="160" height="160" viewBox="0 0 160 160">
            {tasks.slice(0, 3).map((task, index) => {
              const taskPos = getTaskPosition(task);
              const taskProgress = taskPos.width / 100;
              const angle = (taskProgress * 360 * Math.PI) / 180;
              const cx = 80;
              const cy = 80;
              const r = ringRadius - index * 20;

              return (
                <g key={task.id}>
                  {/* Background ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="rgba(200, 200, 200, 0.3)"
                    strokeWidth={ringWidth}
                  />
                  {/* Progress ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={getTaskColor(index)}
                    strokeWidth={ringWidth}
                    strokeDasharray={`${(2 * Math.PI * r * taskProgress).toFixed(1)} ${(2 * Math.PI * r).toFixed(1)}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`}
                  />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="text-xs text-gray-600">
          Showing first {Math.min(tasks.length, 3)} task{tasks.length !== 1 ? "s" : ""} as rings
        </div>
      </div>
    );
  };

  // Version E: Battery usage style
  const BatteryVersion = () => {
    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-sm mb-2">E) Battery Usage Style</h3>
          <p className="text-xs text-gray-600 mb-3">Segmented bar showing task regions with battery-meter appearance</p>
        </div>
        <div className="relative h-10 bg-gray-50 rounded-lg border-2 border-gray-300 overflow-hidden flex p-1">
          {/* Battery nib */}
          <div className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-gray-300 rounded-r" />

          {/* Segmented regions */}
          {tasks.map((task, index) => {
            const pos = getTaskPosition(task);
            const displayWidth = Math.max(pos.width, 3);
            return (
              <div
                key={task.id}
                className="relative"
                style={{
                  flex: `${displayWidth} 0 0`,
                  backgroundColor: getTaskColor(index),
                  opacity: 0.8,
                  margin: "0 1px",
                  borderRadius: "2px",
                }}
                title={task.name}
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-600">
          Battery-meter style showing task distribution
        </div>
      </div>
    );
  };

  // Version F: Storage usage style
  const StorageVersion = () => {
    const totalWidth = 100;
    let currentPos = 0;

    return (
      <div className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h3 className="font-semibold text-sm mb-2">F) Storage Usage Style</h3>
          <p className="text-xs text-gray-600 mb-3">Stacked horizontal bar showing all tasks</p>
        </div>
        <div className="space-y-3">
          <div className="flex h-8 rounded-full overflow-hidden border border-gray-200">
            {tasks.map((task, index) => {
              const pos = getTaskPosition(task);
              const width = Math.max(pos.width, 2);
              currentPos += width;
              return (
                <div
                  key={task.id}
                  className="relative flex items-center justify-center"
                  style={{
                    width: `${width}%`,
                    backgroundColor: getTaskColor(index),
                    opacity: 0.85,
                    minWidth: "8px",
                  }}
                  title={task.name}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getTaskColor(index) }}
                />
                <span className="truncate text-gray-600">{task.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{phase.name} - Collapsed View Options</h2>
            <p className="text-blue-100 mt-1">
              {format(new Date(phase.startDate), "dd-MMM-yy")} → {format(new Date(phase.endDate), "dd-MMM-yy")}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              ✕ Close
            </button>
          )}
        </div>

        {/* Style selector */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-2 flex-wrap">
            {(["stacked", "heatmap", "segmented", "rings", "battery", "storage"] as const).map(
              (style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedStyle === style
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="p-6">
          {selectedStyle === "stacked" && <StackedBarsVersion />}
          {selectedStyle === "heatmap" && <HeatmapVersion />}
          {selectedStyle === "segmented" && <SegmentedVersion />}
          {selectedStyle === "rings" && <RingsVersion />}
          {selectedStyle === "battery" && <BatteryVersion />}
          {selectedStyle === "storage" && <StorageVersion />}

          {/* Description */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Interaction ideas:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-600">
                <li>Hover shows tooltip with task names and dates</li>
                <li>Click expands the phase to show individual task bars</li>
                <li>Right-click offers quick actions (edit, delete, etc.)</li>
                <li>Drag from collapsed bar to adjust phase dates</li>
              </ul>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
