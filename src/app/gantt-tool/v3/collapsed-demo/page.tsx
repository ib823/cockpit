/**
 * Collapsed Phase Visualization Demo Page
 *
 * See all 6 design approaches for displaying aggregated task information
 * when a phase is collapsed in the Gantt timeline.
 */

"use client";

import { useEffect, useState } from "react";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import { CollapsedPhaseVisualization } from "@/components/gantt-tool/CollapsedPhaseVisualization";
import { useRouter } from "next/navigation";

export default function CollapsedDemoPage() {
  const { currentProject } = useGanttToolStoreV2();
  const router = useRouter();
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    setShowDemo(true);
  }, []);

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Project Loaded</h1>
          <p className="text-gray-600 mb-6">Please load a project from the Gantt timeline view first.</p>
          <button
            onClick={() => router.push("/gantt-tool/v3")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Gantt View
          </button>
        </div>
      </div>
    );
  }

  const firstPhase = currentProject.phases?.[0];

  if (!firstPhase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Phases in Project</h1>
          <p className="text-gray-600 mb-6">Create phases and tasks in the Gantt view to see the collapsed visualization.</p>
          <button
            onClick={() => router.push("/gantt-tool/v3")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go Back to Gantt View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Collapsed Phase Visualization Demo
            </h1>
            <p className="text-gray-600 mt-1">
              See 6 different design approaches for showing collapsed phases. Choose your favorite!
            </p>
          </div>
          <button
            onClick={() => router.push("/gantt-tool/v3")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Gantt
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{firstPhase.name}</h2>
          <p className="text-sm text-gray-600">
            {firstPhase.tasks?.length || 0} task{(firstPhase.tasks?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Demo modal */}
        {showDemo && firstPhase && (
          <CollapsedPhaseVisualization
            phase={firstPhase}
            onClose={() => router.push("/gantt-tool/v3")}
          />
        )}
      </div>
    </div>
  );
}
