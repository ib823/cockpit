"use client";

import { Users } from "lucide-react";

export function AllocationMode() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Resource Allocation Timeline</h3>
        <p className="text-gray-600 mb-4">
          Coming in Phase 3: Drag-and-drop resource allocation with Gantt-style timeline
        </p>
        <div className="text-sm text-gray-500">
          <p>Features planned:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-left max-w-md mx-auto">
            <li>Visual timeline with resource swimlanes</li>
            <li>Drag-and-drop task reallocation</li>
            <li>Utilization heatmap by week</li>
            <li>Conflict detection and resolution</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
