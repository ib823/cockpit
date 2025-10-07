"use client";

import { useMemo } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { Phase } from "@/lib/timeline/phase-generation";

export default function GanttChart() {
  const { phases = [], selectedPhaseId, selectPhase } = useTimelineStore();

  // Safety check for phases
  const safePhases = useMemo(() => (Array.isArray(phases) ? phases : []), [phases]);

  // Helper: Render resource avatars
  const renderResourceAvatars = (phase: Phase) => {
    const resources = phase.resources || [];
    if (resources.length === 0) return null;

    const visibleCount = Math.min(3, resources.length);
    const remainingCount = resources.length - visibleCount;

    return (
      <div className="flex items-center gap-1 mt-1 px-2">
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
              className="w-5 h-5 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[10px] font-medium text-blue-700"
              title={`${resource.name} - ${resource.role} (${resource.allocation}%)`}
            >
              {initials}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-medium text-gray-600"
            title={`${remainingCount} more team member${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Helper: Calculate team utilization
  const calculateUtilization = (phase: Phase): number => {
    const resources = phase.resources || [];
    if (resources.length === 0) return 0;

    // Calculate average allocation
    const totalAllocation = resources.reduce((sum, r) => sum + (r.allocation || 0), 0);
    const avgAllocation = totalAllocation / resources.length;

    return avgAllocation;
  };

  // Helper: Render utilization bar
  const renderUtilizationBar = (phase: Phase) => {
    const utilization = calculateUtilization(phase);
    if (utilization === 0) return null;

    // Color logic: <80% green, 80-100% orange, >100% red
    let barColor = "bg-green-500";
    let textColor = "text-green-700";

    if (utilization >= 100) {
      barColor = "bg-red-500";
      textColor = "text-red-700";
    } else if (utilization >= 80) {
      barColor = "bg-orange-500";
      textColor = "text-orange-700";
    }

    return (
      <div className="mt-1 px-2">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-gray-500">Team Load</span>
          <span className={`text-[10px] font-medium ${textColor}`}>{utilization.toFixed(0)}%</span>
        </div>
        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(100, utilization)}%` }}
          />
        </div>
      </div>
    );
  };

  const { startBusinessDay, endBusinessDay, totalBusinessDays } = useMemo(() => {
    if (!safePhases || safePhases.length === 0) {
      return { startBusinessDay: 0, endBusinessDay: 0, totalBusinessDays: 0 };
    }

    const start = Math.min(...safePhases.map((p) => p.startBusinessDay || 0));
    const end = Math.max(
      ...safePhases.map((p) => (p.startBusinessDay || 0) + (p.workingDays || 0))
    );

    return {
      startBusinessDay: start,
      endBusinessDay: end,
      totalBusinessDays: end - start,
    };
  }, [safePhases]);

  if (safePhases.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-12 text-center card-shadow animate-fade-in">
        <p className="text-gray-500">
          No timeline generated yet. Select packages and click Generate Timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto animate-slide-up">
      <div className="min-w-[800px] p-4">
        {/* Timeline Header */}
        <div className="flex items-center mb-4 border-b pb-2">
          <div className="w-48 font-semibold">Phase</div>
          <div className="flex-1 text-sm text-gray-600">Timeline</div>
        </div>

        {/* Phase Bars */}
        {safePhases.map((phase) => {
          const startPercent = ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
          const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;

          return (
            <div key={phase.id} className="flex items-center mb-3">
              <div className="w-48 pr-4 text-sm truncate">{phase.name}</div>
              <div className="flex-1 relative h-auto min-h-[60px]">
                <div
                  className={`absolute top-0 rounded cursor-pointer transition-all overflow-visible hover-lift ${
                    selectedPhaseId === phase.id
                      ? "bg-blue-600 shadow-lg"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    minHeight: "60px",
                  }}
                  onClick={() => selectPhase && selectPhase(phase.id)}
                >
                  <div className="p-2">
                    {/* Phase duration */}
                    <div className="flex items-center justify-between text-white text-xs mb-1">
                      <span className="font-medium truncate">{phase.name}</span>
                      <span className="ml-2">{phase.workingDays || 0}d</span>
                    </div>

                    {/* Resource avatars */}
                    {renderResourceAvatars(phase)}

                    {/* Utilization bar */}
                    {renderUtilizationBar(phase)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
