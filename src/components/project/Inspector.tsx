// src/components/project/Inspector.tsx
"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";

export function Inspector() {
  const mode = useProjectStore((state) => state.mode);
  const lastGeneratedAt = useProjectStore((state) => state.lastGeneratedAt);
  const manualOverrides = useProjectStore((state) => state.manualOverrides);
  const phases = useTimelineStore((state) => state.phases);

  const [selectedRegion, setSelectedRegion] = useState<"MY" | "SG" | "VN" | "TH">("MY");
  const [resourceName, setResourceName] = useState("");
  const [resourceRole, setResourceRole] = useState("");

  const totalEffort = phases.reduce((sum, p) => sum + (p.effort || 0), 0);
  const totalDuration = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);

  const handleAddResource = () => {
    if (resourceName && resourceRole) {
      // Add resource to timeline store
      console.log("Add resource:", { name: resourceName, role: resourceRole });
      setResourceName("");
      setResourceRole("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Inspector</h2>
        <p className="text-xs text-gray-500 mt-1">{mode} mode</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {mode === "plan" && phases.length > 0 && (
          <>
            {/* Project Summary */}
            <div className="bg-white rounded-lg p-4 card-shadow">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Project Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phases</span>
                  <span className="text-sm font-medium text-gray-900">{phases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Effort</span>
                  <span className="text-sm font-medium text-gray-900">{totalEffort} PD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.ceil(totalDuration / 5)} weeks
                  </span>
                </div>
              </div>
            </div>

            {/* Manual Overrides */}
            {manualOverrides.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-xs font-semibold text-blue-900 uppercase tracking-wide mb-3">
                  Manual Edits ({manualOverrides.length})
                </h3>
                <div className="space-y-2">
                  {manualOverrides.map((override, idx) => (
                    <div key={idx} className="text-xs text-blue-700">
                      • {override.field} changed for phase {override.phaseId.slice(0, 8)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources Panel */}
            <div className="bg-white rounded-lg p-4 card-shadow">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Team Resources
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Role (e.g., Solution Architect)"
                  value={resourceRole}
                  onChange={(e) => setResourceRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddResource}
                  disabled={!resourceName || !resourceRole}
                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Resource
                </button>
              </div>
            </div>

            {/* Holidays Panel */}
            <div className="bg-white rounded-lg p-4 card-shadow">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                Holidays ({selectedRegion})
              </h3>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
              >
                <option value="MY">🇲🇾 Malaysia</option>
                <option value="SG">🇸🇬 Singapore</option>
                <option value="VN">🇻🇳 Vietnam</option>
                <option value="TH">🇹🇭 Thailand</option>
              </select>
              <div className="text-xs text-gray-500">
                Public holidays will be excluded from working days calculation
              </div>
            </div>

            {/* Last Generated */}
            {lastGeneratedAt && (
              <div className="text-xs text-gray-500">
                Last generated: {new Date(lastGeneratedAt).toLocaleTimeString()}
              </div>
            )}
          </>
        )}

        {mode === "capture" && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-sm">Capture requirements to see details</div>
          </div>
        )}

        {mode === "decide" && (
          <div className="bg-white rounded-lg p-4 card-shadow">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Decision Impact
            </h3>
            <p className="text-sm text-gray-600">
              Make decisions to see their impact on timeline and cost
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
