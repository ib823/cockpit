// src/components/project/TimelineCanvas.tsx
"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { ImprovedGanttChart } from "@/components/timeline/ImprovedGanttChart";

export function TimelineCanvas() {
  const regenerateTimeline = useProjectStore((state) => state.regenerateTimeline);
  const timelineIsStale = useProjectStore((state) => state.timelineIsStale);
  const phases = useTimelineStore((state) => state.phases);

  useEffect(() => {
    // Auto-generate on first load if needed
    if (phases.length === 0) {
      regenerateTimeline(true);
    }
  }, []);

  if (phases.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-light text-gray-900 mb-2">Generating Timeline...</h3>
          <p className="text-sm text-gray-500">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {timelineIsStale && (
        <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-amber-900">Timeline is outdated</div>
              <div className="text-xs text-amber-700 mt-1">
                Requirements changed. Timeline will regenerate in 0.5s...
              </div>
            </div>
            <button
              onClick={() => regenerateTimeline(true)}
              className="px-3 py-1 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
            >
              Regenerate Now
            </button>
          </div>
        </div>
      )}

      <ImprovedGanttChart />
    </div>
  );
}
