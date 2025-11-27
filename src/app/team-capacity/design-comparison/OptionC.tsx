"use client";

import { useState } from "react";
import type { ResourceAllocation, Phase } from "./types";
import { samplePhases, sampleProject } from "./sampleData";

interface OptionCProps {
  deviceView: "desktop" | "tablet" | "mobile";
}

export default function OptionCHybrid({ deviceView }: OptionCProps) {
  const [phases, setPhases] = useState<Phase[]>(samplePhases);
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["phase-1", "phase-2"]);
  const [selectedAllocation, setSelectedAllocation] = useState<ResourceAllocation | null>(null);
  const [showWeeklyDetail, setShowWeeklyDetail] = useState(false);

  const togglePhase = (phaseId: string) => {
    if (expandedPhases.includes(phaseId)) {
      setExpandedPhases(expandedPhases.filter((id) => id !== phaseId));
    } else {
      setExpandedPhases([...expandedPhases, phaseId]);
    }
  };

  const handleViewWeekly = (allocation: ResourceAllocation) => {
    setSelectedAllocation(allocation);
    setShowWeeklyDetail(true);
  };

  const handleCloseWeeklyDetail = () => {
    setShowWeeklyDetail(false);
    setSelectedAllocation(null);
  };

  // Desktop View - Responsive layout
  if (deviceView === "desktop") {
    return (
      <div className="h-full overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{sampleProject.name}</h2>
            <p className="text-xs text-gray-600 mt-0.5">
              {sampleProject.totalWeeks} weeks · Jan 6 - Jun 30, 2026
            </p>
          </div>
          <div className="flex space-x-2 text-xs">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Timeline View</span>
            <span className="px-2 py-1 bg-blue-600 text-white rounded font-medium">Capacity View</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Resource Allocation Overview
          </h3>

          <div className="space-y-4">
            {phases.map((phase) => {
              const isExpanded = expandedPhases.includes(phase.id);

              return (
                <div key={phase.id} className="border border-gray-200 rounded-lg bg-white shadow-sm">
                  {/* Phase Header */}
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => togglePhase(phase.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            PHASE {phase.id.split("-")[1].toUpperCase()}: {phase.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-0.5">
                            W{phase.weekStart}-W{phase.weekEnd} · {phase.totalWeeks} weeks · {phase.dateRange}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {phase.allocations.length > 0 && (
                        <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                          + Add Resource
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phase Content */}
                  {isExpanded && (
                    <div className="px-6 py-4">
                      {phase.allocations.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500 mb-3">No resources allocated yet</p>
                          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                            + Add First Resource
                          </button>
                        </div>
                      ) : (
                        <>
                          <table className="w-full">
                            <thead>
                              <tr className="text-left text-xs font-medium text-gray-600 border-b border-gray-200">
                                <th className="pb-2">Resource</th>
                                <th className="pb-2 text-right">Total Effort</th>
                                <th className="pb-2 text-right">Avg/Week</th>
                                <th className="pb-2">Pattern</th>
                                <th className="pb-2">Status</th>
                                <th className="pb-2 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {phase.allocations.map((allocation) => (
                                <tr
                                  key={allocation.id}
                                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                  <td className="py-3">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {allocation.resourceName}
                                      </div>
                                      <div className="text-xs text-gray-500">{allocation.designation}</div>
                                    </div>
                                  </td>
                                  <td className="py-3 text-right text-sm text-gray-900">
                                    {allocation.totalDays}d
                                  </td>
                                  <td className="py-3 text-right text-sm text-gray-600">
                                    {allocation.averagePerWeek > 0
                                      ? `${allocation.averagePerWeek}d/wk`
                                      : "Variable"}
                                  </td>
                                  <td className="py-3">
                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                      {allocation.pattern}
                                    </span>
                                  </td>
                                  <td className="py-3">
                                    <span className="text-xs text-gray-600">Allocated</span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <button
                                      onClick={() => handleViewWeekly(allocation)}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      View
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-xs text-gray-600">
                              Phase Summary: <span className="font-semibold text-gray-900">{phase.totalDays} days</span> ·{" "}
                              <span className="font-semibold text-gray-900">{phase.allocations.length} resources</span> ·{" "}
                              <span className="text-green-600 font-medium">[{phase.conflicts} CONFLICTS]</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Collapsed Summary */}
                  {!isExpanded && (
                    <div className="px-6 py-3 text-xs text-gray-600">
                      {phase.totalDays} days · {phase.resourceCount} resources · [{phase.conflicts} CONFLICTS]
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Project Summary */}
          <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">PROJECT SUMMARY</h3>
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <div className="text-xs text-gray-600">Total Effort</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {sampleProject.totalDays} days
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Resources</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {sampleProject.resourceCount} unique
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Duration</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  {sampleProject.totalWeeks} weeks
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600">Status</div>
                <div className="text-sm font-medium text-green-600 mt-1">
                  [{sampleProject.errors} ERRORS] [{sampleProject.warnings} WARNINGS]
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                Detect All Conflicts
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                View Costing
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                Export Proposal
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Detail Modal */}
        {showWeeklyDetail && selectedAllocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Weekly Allocation Detail</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedAllocation.resourceName} ({selectedAllocation.designation})
                  </p>
                </div>
                <button
                  onClick={handleCloseWeeklyDetail}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="px-6 py-4 overflow-auto flex-1">
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <div className="grid grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Phase:</span>{" "}
                      <span className="font-medium text-gray-900">{selectedAllocation.phaseName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pattern:</span>{" "}
                      <span className="font-medium text-gray-900">{selectedAllocation.pattern}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>{" "}
                      <span className="font-medium text-gray-900">{selectedAllocation.totalDays} days</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg/Week:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {selectedAllocation.averagePerWeek > 0
                          ? `${selectedAllocation.averagePerWeek}d/wk`
                          : "Variable"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">
                    Edit Pattern ▼
                  </button>
                </div>

                <h4 className="text-sm font-semibold text-gray-900 mb-3">Week-by-Week Breakdown:</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Week</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Date Range</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Days</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Util%</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Working Days</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAllocation.weeklyBreakdown.map((week) => (
                        <tr key={week.weekNumber} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900">{week.weekLabel}</td>
                          <td className="px-3 py-2 text-gray-600">{week.dateRange}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{week.days.toFixed(1)}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{week.percentage.toFixed(0)}%</td>
                          <td className="px-3 py-2 text-right text-gray-600">{week.workingDays}</td>
                          <td className="px-3 py-2 text-gray-400 text-xs">—</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <div className="text-xs">
                    <span className="text-gray-600">Total:</span>{" "}
                    <span className="font-semibold text-gray-900">{selectedAllocation.totalDays} days</span> ✓
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={handleCloseWeeklyDetail}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tablet View - Similar to desktop but more compact
  if (deviceView === "tablet") {
    return (
      <div className="h-full overflow-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">{sampleProject.name}</h2>
              <p className="text-xs text-gray-600">26 weeks · Jan 6 - Jun 30</p>
            </div>
            <div className="text-xs space-x-2">
              <span className="px-2 py-1 bg-blue-600 text-white rounded">Capacity</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {phases.map((phase) => {
            const isExpanded = expandedPhases.includes(phase.id);

            return (
              <div key={phase.id} className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between"
                >
                  <div className="text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      {isExpanded ? "▼" : "▶"} PHASE {phase.id.split("-")[1]}: {phase.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      W{phase.weekStart}-W{phase.weekEnd} · {phase.totalWeeks} weeks
                    </div>
                  </div>
                </button>

                {isExpanded && phase.allocations.length > 0 && (
                  <div className="p-4 space-y-2">
                    {phase.allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{allocation.resourceName}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {allocation.totalDays}d · {allocation.averagePerWeek > 0 ? `${allocation.averagePerWeek}d/wk` : "Variable"} ·{" "}
                            {allocation.pattern}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewWeekly(allocation)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          View →
                        </button>
                      </div>
                    ))}
                    <div className="text-xs text-gray-600 mt-2">
                      Summary: {phase.totalDays}d · {phase.allocations.length} resources
                    </div>
                  </div>
                )}

                {!isExpanded && (
                  <div className="px-4 py-2 text-xs text-gray-600">
                    {phase.totalDays}d · {phase.resourceCount} resources
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-xs space-y-2">
            <div className="font-semibold text-gray-900">Project: {sampleProject.totalDays}d · {sampleProject.resourceCount} resources</div>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded">
                Detect Conflicts
              </button>
              <button className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile View
  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
        <h2 className="text-sm font-semibold text-gray-900">{sampleProject.name}</h2>
        <p className="text-xs text-gray-600">26 weeks · 245 days · 10 resources</p>
        <div className="text-xs text-green-600 font-medium mt-1">[0 ERRORS] [0 WARNINGS]</div>
      </div>

      <div className="p-3 space-y-3">
        {phases.map((phase) => {
          const isExpanded = expandedPhases.includes(phase.id);

          return (
            <div key={phase.id} className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full px-3 py-2 text-left border-b border-gray-200"
              >
                <div className="text-sm font-semibold text-gray-900">
                  {isExpanded ? "▼" : "▶"} PHASE {phase.id.split("-")[1]}: {phase.name}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  W{phase.weekStart}-W{phase.weekEnd} · {phase.totalWeeks} weeks
                </div>
                {!isExpanded && (
                  <div className="text-xs text-gray-600 mt-1">
                    {phase.totalDays}d · {phase.resourceCount} resources
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {phase.allocations.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-500 mb-2">No resources allocated</p>
                      <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded">
                        + Add Resource
                      </button>
                    </div>
                  ) : (
                    <>
                      {phase.allocations.map((allocation) => (
                        <div
                          key={allocation.id}
                          className="p-2 border border-gray-200 rounded"
                        >
                          <div className="text-sm font-medium text-gray-900">{allocation.resourceName}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {allocation.totalDays} days · {allocation.pattern}
                          </div>
                          <button
                            onClick={() => handleViewWeekly(allocation)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 mt-1"
                          >
                            View →
                          </button>
                        </div>
                      ))}
                      <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                        {phase.totalDays}d total · {phase.allocations.length} resources
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg space-y-2">
          <button className="w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded">
            Detect All Conflicts
          </button>
          <button className="w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded">
            View Costing
          </button>
          <button className="w-full px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded">
            Export Proposal
          </button>
        </div>
      </div>

      {/* Mobile Weekly Detail - Full Screen */}
      {showWeeklyDetail && selectedAllocation && (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 flex items-center justify-between">
            <button onClick={handleCloseWeeklyDetail} className="text-blue-600 text-sm font-medium">
              ← Back
            </button>
            <h3 className="text-sm font-semibold text-gray-900">Weekly Detail</h3>
            <button onClick={handleCloseWeeklyDetail} className="text-gray-400 text-xl">
              ×
            </button>
          </div>

          <div className="p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900">{selectedAllocation.resourceName}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {selectedAllocation.designation} · Phase {selectedAllocation.phaseName}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Pattern: {selectedAllocation.pattern} · {selectedAllocation.totalDays} days total
              </p>
            </div>

            <div className="space-y-2">
              {selectedAllocation.weeklyBreakdown.map((week) => (
                <div key={week.weekNumber} className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-900">{week.weekLabel}</div>
                    <div className="text-sm font-semibold text-gray-900">{week.days.toFixed(1)}d</div>
                  </div>
                  <div className="text-xs text-gray-600">{week.dateRange}</div>
                  <div className="text-xs text-gray-600 mt-1">{week.percentage.toFixed(0)}% utilization</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-xs">
              <span className="text-gray-700">Total:</span>{" "}
              <span className="font-semibold text-gray-900">{selectedAllocation.totalDays} days</span> ✓
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                onClick={handleCloseWeeklyDetail}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
