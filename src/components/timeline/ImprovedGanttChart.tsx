"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Phase } from "@/lib/timeline/phase-generation";
import { useTimelineStore } from "@/stores/timeline-store";

// Stream colors for visual variety
const STREAM_COLORS = [
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", text: "text-blue-700" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", text: "text-purple-700" },
  { bg: "bg-emerald-500", hover: "hover:bg-emerald-600", text: "text-emerald-700" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", text: "text-orange-700" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", text: "text-pink-700" },
  { bg: "bg-cyan-500", hover: "hover:bg-cyan-600", text: "text-cyan-700" },
  { bg: "bg-amber-500", hover: "hover:bg-amber-600", text: "text-amber-700" },
  { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", text: "text-indigo-700" },
];

interface Stream {
  id: string;
  name: string;
  phases: Phase[];
  color: typeof STREAM_COLORS[number];
  totalDays: number;
  totalEffort: number;
}

interface ImprovedGanttChartProps {
  phases?: Phase[];
  startDate?: Date;
  endDate?: Date;
}

export function ImprovedGanttChart({
  phases: phasesProp,
  startDate,
  endDate,
}: ImprovedGanttChartProps) {
  const storePhases = useTimelineStore((state) => state.phases);
  const selectedPhaseId = useTimelineStore((state) => state.selectedPhaseId);
  const selectPhase = useTimelineStore((state) => state.selectPhase);

  const phases = phasesProp || storePhases || [];
  const safePhases = Array.isArray(phases) ? phases : [];

  // Track which streams are collapsed
  const [collapsedStreams, setCollapsedStreams] = useState<Set<string>>(new Set());

  // Group phases into streams by category
  const streams = useMemo(() => {
    if (safePhases.length === 0) return [];

    // Group by category (e.g., "Finance - Prepare", "HR - Explore")
    const streamMap = new Map<string, Phase[]>();

    safePhases.forEach((phase) => {
      // Extract stream name from category or phase name
      // e.g., "Finance - Prepare" -> "Finance"
      const streamName = phase.category?.split(" - ")[0] || "General";

      if (!streamMap.has(streamName)) {
        streamMap.set(streamName, []);
      }
      streamMap.get(streamName)!.push(phase);
    });

    // Convert to Stream objects
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

    // Sort by total effort (descending)
    return streamList.sort((a, b) => b.totalEffort - a.totalEffort);
  }, [safePhases]);

  // Calculate timeline bounds
  const { startBusinessDay, endBusinessDay, totalBusinessDays } = useMemo(() => {
    if (safePhases.length === 0) {
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

  // Toggle stream collapse
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

  // Render resource avatars
  const renderResourceAvatars = (phase: Phase) => {
    const resources = phase.resources || [];
    if (resources.length === 0) return null;

    const visibleCount = Math.min(3, resources.length);
    const remainingCount = resources.length - visibleCount;

    return (
      <div className="flex items-center gap-1 mt-1">
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
              className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-medium text-white"
              title={`${resource.name} - ${resource.role} (${resource.allocation}%)`}
            >
              {initials}
            </div>
          );
        })}

        {remainingCount > 0 && (
          <div
            className="w-5 h-5 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-[10px] font-medium text-white"
            title={`${remainingCount} more team member${remainingCount > 1 ? "s" : ""}`}
          >
            +{remainingCount}
          </div>
        )}
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
    <div className="relative overflow-x-auto">
      <div className="min-w-[900px] p-6">
        {/* Timeline Header */}
        <div className="flex items-center mb-6 pb-3 border-b-2 border-gray-200">
          <div className="w-64 font-semibold text-gray-700">Stream / Phase</div>
          <div className="flex-1 text-sm text-gray-500 font-medium">Timeline</div>
        </div>

        {/* Streams */}
        {streams.map((stream) => {
          const isCollapsed = collapsedStreams.has(stream.id);

          return (
            <div key={stream.id} className="mb-4">
              {/* Stream Header */}
              <div
                className="flex items-center mb-2 cursor-pointer group"
                onClick={() => toggleStream(stream.id)}
              >
                <div className="w-64 flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  )}
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`w-3 h-3 rounded-full ${stream.color.bg}`}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                      {stream.name}
                    </span>
                    <span className="text-xs text-gray-500 font-normal">
                      ({stream.phases.length} phase{stream.phases.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>

                {/* Stream summary bar (when collapsed) */}
                {isCollapsed && (
                  <div className="flex-1 relative h-8">
                    {stream.phases.map((phase, idx) => {
                      const startPercent =
                        ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
                      const widthPercent = ((phase.workingDays || 0) / totalBusinessDays) * 100;

                      return (
                        <div
                          key={phase.id}
                          className={`absolute top-0 h-8 ${stream.color.bg} rounded opacity-70 transition-all duration-200 group-hover:opacity-90`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                            zIndex: idx,
                          }}
                          title={`${phase.name} (${phase.workingDays}d)`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Phase Bars (expanded) */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 space-y-2">
                      {stream.phases.map((phase) => {
                        const startPercent =
                          ((phase.startBusinessDay || 0) / totalBusinessDays) * 100;
                        const widthPercent =
                          ((phase.workingDays || 0) / totalBusinessDays) * 100;

                        return (
                          <div key={phase.id} className="flex items-center">
                            <div className="w-56 pr-4">
                              <div className="text-sm text-gray-700 truncate" title={phase.name}>
                                {phase.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {phase.effort || 0} PD • {phase.workingDays || 0} days
                              </div>
                            </div>
                            <div className="flex-1 relative h-16">
                              <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className={`absolute top-0 h-16 ${stream.color.bg} ${stream.color.hover} rounded-lg cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                  selectedPhaseId === phase.id ? "ring-2 ring-gray-900" : ""
                                }`}
                                style={{
                                  left: `${startPercent}%`,
                                  width: `${widthPercent}%`,
                                  transformOrigin: "left",
                                }}
                                onClick={() => selectPhase && selectPhase(phase.id)}
                              >
                                <div className="p-2 h-full flex flex-col justify-between text-white">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold truncate">
                                      {phase.name.split(" - ").pop()}
                                    </span>
                                    <span className="text-xs font-medium ml-2">
                                      {phase.workingDays}d
                                    </span>
                                  </div>

                                  {/* Resource avatars */}
                                  {renderResourceAvatars(phase)}
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ImprovedGanttChart;
