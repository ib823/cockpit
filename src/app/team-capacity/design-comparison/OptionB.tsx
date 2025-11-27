"use client";

import { useState, useRef, useEffect } from "react";
import type { Phase, ResourceAllocation, WeeklyAllocation, AllocationPattern } from "./types";
import { samplePhases, availableResources } from "./sampleData";

interface OptionBProps {
  deviceView: "desktop" | "tablet" | "mobile";
}

type PatternConfig = {
  pattern: AllocationPattern;
  startWeek: number;
  endWeek: number;
  totalDays: number;
};

export default function OptionBGrid({ deviceView }: OptionBProps) {
  const [phases, setPhases] = useState<Phase[]>(samplePhases);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("phase-2");
  const [editingCell, setEditingCell] = useState<{ allocId: string; weekNum: number } | null>(null);
  const [cellValue, setCellValue] = useState<string>("");
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [selectedAllocForPattern, setSelectedAllocForPattern] = useState<ResourceAllocation | null>(null);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId);
  const allWeeks = selectedPhase
    ? Array.from({ length: selectedPhase.totalWeeks }, (_, i) => selectedPhase.weekStart + i)
    : [];

  // Focus input when editing cell
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (allocId: string, weekNum: number) => {
    const alloc = selectedPhase?.allocations.find((a) => a.id === allocId);
    if (!alloc) return;

    const weekData = alloc.weeklyBreakdown.find((w) => w.weekNumber === weekNum);
    if (weekData) {
      setEditingCell({ allocId, weekNum });
      setCellValue(weekData.days.toString());
    }
  };

  const handleCellSave = () => {
    if (!editingCell || !selectedPhase) return;

    const newDays = parseFloat(cellValue);
    if (isNaN(newDays) || newDays < 0 || newDays > 5) {
      alert("Please enter a valid number between 0 and 5");
      setEditingCell(null);
      return;
    }

    const updatedPhases = phases.map((phase) => {
      if (phase.id !== selectedPhaseId) return phase;

      return {
        ...phase,
        allocations: phase.allocations.map((alloc) => {
          if (alloc.id !== editingCell.allocId) return alloc;

          const updatedWeekly = alloc.weeklyBreakdown.map((week) => {
            if (week.weekNumber !== editingCell.weekNum) return week;
            return {
              ...week,
              days: newDays,
              percentage: (newDays / 5) * 100,
            };
          });

          const newTotalDays = updatedWeekly.reduce((sum, w) => sum + w.days, 0);

          return {
            ...alloc,
            weeklyBreakdown: updatedWeekly,
            totalDays: newTotalDays,
            averagePerWeek: newTotalDays / updatedWeekly.length,
          };
        }),
      };
    });

    setPhases(updatedPhases);
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellSave();
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  };

  const applyPattern = (config: PatternConfig) => {
    if (!selectedAllocForPattern || !selectedPhase) return;

    const { pattern, startWeek, endWeek, totalDays } = config;
    const totalWeeks = endWeek - startWeek + 1;
    const avgDaysPerWeek = totalDays / totalWeeks;

    let distribution: number[] = [];
    if (pattern === "STEADY") {
      distribution = Array(totalWeeks).fill(avgDaysPerWeek);
    } else if (pattern === "RAMP_UP") {
      // Exponential ramp from 1d to 5d
      const base = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5];
      distribution = base.slice(0, totalWeeks);
      // Normalize to match totalDays
      const currentSum = distribution.reduce((a, b) => a + b, 0);
      const factor = totalDays / currentSum;
      distribution = distribution.map((d) => d * factor);
    } else if (pattern === "RAMP_DOWN") {
      // Reverse ramp
      const base = [5, 5, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1];
      distribution = base.slice(0, totalWeeks);
      const currentSum = distribution.reduce((a, b) => a + b, 0);
      const factor = totalDays / currentSum;
      distribution = distribution.map((d) => d * factor);
    } else if (pattern === "RAMP_UP_DOWN") {
      // Bell curve
      const half = Math.floor(totalWeeks / 2);
      const upRamp = Array.from({ length: half }, (_, i) => 1 + (4 * i) / half);
      const downRamp = Array.from({ length: totalWeeks - half }, (_, i) => 5 - (4 * i) / (totalWeeks - half));
      distribution = [...upRamp, ...downRamp];
      const currentSum = distribution.reduce((a, b) => a + b, 0);
      const factor = totalDays / currentSum;
      distribution = distribution.map((d) => d * factor);
    } else {
      // CUSTOM - just use average
      distribution = Array(totalWeeks).fill(avgDaysPerWeek);
    }

    const updatedPhases = phases.map((phase) => {
      if (phase.id !== selectedPhaseId) return phase;

      return {
        ...phase,
        allocations: phase.allocations.map((alloc) => {
          if (alloc.id !== selectedAllocForPattern.id) return alloc;

          const updatedWeekly = alloc.weeklyBreakdown.map((week, idx) => {
            if (week.weekNumber < startWeek || week.weekNumber > endWeek) return week;
            const weekIdx = week.weekNumber - startWeek;
            const days = Math.min(5, Math.max(0, distribution[weekIdx] || 0));
            return {
              ...week,
              days,
              percentage: (days / 5) * 100,
            };
          });

          return {
            ...alloc,
            weeklyBreakdown: updatedWeekly,
            totalDays,
            averagePerWeek: totalDays / totalWeeks,
            pattern,
          };
        }),
      };
    });

    setPhases(updatedPhases);
    setShowPatternModal(false);
    setSelectedAllocForPattern(null);
  };

  const addNewResource = (resourceName: string, designation: string) => {
    if (!selectedPhase) return;

    const newAlloc: ResourceAllocation = {
      id: `alloc-new-${Date.now()}`,
      resourceName,
      designation,
      phaseId: selectedPhaseId,
      phaseName: selectedPhase.name,
      totalDays: 0,
      averagePerWeek: 0,
      pattern: "STEADY",
      weeklyBreakdown: allWeeks.map((weekNum) => {
        const date = new Date(2026, 0, 6 + (weekNum - 1) * 7);
        const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 6);
        const endDateStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return {
          weekNumber: weekNum,
          weekLabel: `W${weekNum}`,
          dateRange: `${dateStr}-${endDateStr}`,
          days: 0,
          percentage: 0,
          workingDays: 5,
        };
      }),
      status: "draft",
    };

    const updatedPhases = phases.map((phase) => {
      if (phase.id !== selectedPhaseId) return phase;
      return {
        ...phase,
        allocations: [...phase.allocations, newAlloc],
        resourceCount: phase.resourceCount + 1,
      };
    });

    setPhases(updatedPhases);
    setShowAddResourceModal(false);
  };

  const deleteAllocation = (allocId: string) => {
    const updatedPhases = phases.map((phase) => {
      if (phase.id !== selectedPhaseId) return phase;
      return {
        ...phase,
        allocations: phase.allocations.filter((a) => a.id !== allocId),
        resourceCount: phase.resourceCount - 1,
      };
    });
    setPhases(updatedPhases);
  };

  // Mobile view - vertical week list
  if (deviceView === "mobile") {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Smart Grid</h2>
          <p className="text-xs text-gray-600 mt-1">Vertical week-by-week view</p>

          {/* Phase Selector */}
          <select
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name} ({phase.totalWeeks} weeks)
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddResourceModal(true)}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
          >
            Add Resource
          </button>
        </div>

        {/* Mobile Week List */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {selectedPhase?.allocations.map((alloc) => (
            <div key={alloc.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{alloc.resourceName}</h3>
                  <p className="text-xs text-gray-600">{alloc.designation}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alloc.totalDays}d total · {alloc.pattern}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAllocForPattern(alloc);
                    setShowPatternModal(true);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                >
                  Pattern
                </button>
              </div>

              {/* Week-by-week breakdown */}
              <div className="space-y-2">
                {alloc.weeklyBreakdown.map((week) => (
                  <div key={week.weekNumber} className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{week.weekLabel}</div>
                      <div className="text-xs text-gray-500">{week.dateRange}</div>
                    </div>
                    <input
                      type="number"
                      value={week.days}
                      min="0"
                      max="5"
                      step="0.5"
                      onChange={(e) => {
                        const newDays = parseFloat(e.target.value);
                        if (isNaN(newDays)) return;

                        const updatedPhases = phases.map((phase) => {
                          if (phase.id !== selectedPhaseId) return phase;

                          return {
                            ...phase,
                            allocations: phase.allocations.map((a) => {
                              if (a.id !== alloc.id) return a;

                              const updatedWeekly = a.weeklyBreakdown.map((w) => {
                                if (w.weekNumber !== week.weekNumber) return w;
                                return {
                                  ...w,
                                  days: newDays,
                                  percentage: (newDays / 5) * 100,
                                };
                              });

                              const newTotalDays = updatedWeekly.reduce((sum, w) => sum + w.days, 0);

                              return {
                                ...a,
                                weeklyBreakdown: updatedWeekly,
                                totalDays: newTotalDays,
                                averagePerWeek: newTotalDays / updatedWeekly.length,
                              };
                            }),
                          };
                        });

                        setPhases(updatedPhases);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                    />
                    <span className="ml-2 text-xs text-gray-600 w-8">d/wk</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => deleteAllocation(alloc.id)}
                className="mt-3 w-full px-3 py-1.5 text-xs text-red-600 border border-red-600 rounded"
              >
                Remove Resource
              </button>
            </div>
          ))}
        </div>

        {/* Pattern Modal */}
        {showPatternModal && selectedAllocForPattern && (
          <PatternModal
            allocation={selectedAllocForPattern}
            phase={selectedPhase!}
            onApply={applyPattern}
            onClose={() => {
              setShowPatternModal(false);
              setSelectedAllocForPattern(null);
            }}
          />
        )}

        {/* Add Resource Modal */}
        {showAddResourceModal && (
          <AddResourceModal
            availableResources={availableResources}
            onAdd={addNewResource}
            onClose={() => setShowAddResourceModal(false)}
          />
        )}
      </div>
    );
  }

  // Desktop/Tablet view - Excel-style grid
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Smart Grid with Pattern Overlay</h2>
            <p className="text-xs text-gray-600 mt-1">
              Excel-style editing · Click any cell to edit · Pattern overlay available
            </p>
          </div>
          <button
            onClick={() => setShowAddResourceModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Add Resource
          </button>
        </div>

        {/* Phase Selector */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Phase:</label>
          <div className="flex space-x-2">
            {phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => setSelectedPhaseId(phase.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedPhaseId === phase.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {phase.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto">
        <div className={`${deviceView === "tablet" ? "min-w-[1200px]" : ""}`}>
          {/* Grid Table */}
          <table className="w-full border-collapse bg-white">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="sticky left-0 bg-gray-50 z-20 border border-gray-200 px-4 py-3 text-left">
                  <div className="text-xs font-semibold text-gray-900">Resource</div>
                </th>
                <th className="border border-gray-200 px-3 py-3 text-center bg-gray-50">
                  <div className="text-xs font-semibold text-gray-900">Total</div>
                  <div className="text-xs text-gray-500">Days</div>
                </th>
                <th className="border border-gray-200 px-3 py-3 text-center bg-gray-50">
                  <div className="text-xs font-semibold text-gray-900">Pattern</div>
                </th>
                {allWeeks.map((weekNum) => {
                  const date = new Date(2026, 0, 6 + (weekNum - 1) * 7);
                  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <th key={weekNum} className="border border-gray-200 px-2 py-3 text-center bg-gray-100">
                      <div className="text-xs font-semibold text-gray-900">W{weekNum}</div>
                      <div className="text-xs text-gray-500">{dateStr}</div>
                    </th>
                  );
                })}
                <th className="border border-gray-200 px-3 py-3 text-center bg-gray-50">
                  <div className="text-xs font-semibold text-gray-900">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedPhase?.allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-gray-50">
                  <td className="sticky left-0 bg-white z-10 border border-gray-200 px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{alloc.resourceName}</div>
                    <div className="text-xs text-gray-500">{alloc.designation}</div>
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center">
                    <div className="text-sm font-semibold text-gray-900">{alloc.totalDays.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">{alloc.averagePerWeek.toFixed(1)}/wk</div>
                  </td>
                  <td className="border border-gray-200 px-3 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedAllocForPattern(alloc);
                        setShowPatternModal(true);
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      {alloc.pattern}
                    </button>
                  </td>
                  {allWeeks.map((weekNum) => {
                    const weekData = alloc.weeklyBreakdown.find((w) => w.weekNumber === weekNum);
                    const isEditing = editingCell?.allocId === alloc.id && editingCell?.weekNum === weekNum;
                    const days = weekData?.days ?? 0;

                    // Color coding based on utilization
                    let bgColor = "bg-white";
                    if (days === 0) bgColor = "bg-gray-50";
                    else if (days <= 2) bgColor = "bg-blue-50";
                    else if (days <= 4) bgColor = "bg-blue-100";
                    else bgColor = "bg-blue-200";

                    return (
                      <td
                        key={weekNum}
                        className={`border border-gray-200 px-2 py-3 text-center cursor-pointer hover:ring-2 hover:ring-blue-400 ${bgColor}`}
                        onClick={() => !isEditing && handleCellClick(alloc.id, weekNum)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="number"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={handleCellKeyDown}
                            min="0"
                            max="5"
                            step="0.5"
                            className="w-12 px-1 py-1 border border-blue-500 rounded text-sm text-center"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">
                            {days === 0 ? "-" : days.toFixed(1)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 px-3 py-3 text-center">
                    <button
                      onClick={() => deleteAllocation(alloc.id)}
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedPhase?.allocations.length === 0 && (
            <div className="text-center py-12 bg-white border-t border-gray-200">
              <p className="text-sm text-gray-500">No resources allocated to this phase yet.</p>
              <button
                onClick={() => setShowAddResourceModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                Add First Resource
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid Legend */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
        <div className="flex items-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
            <span>0 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-50 border border-gray-300 rounded"></div>
            <span>1-2 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-gray-300 rounded"></div>
            <span>3-4 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 border border-gray-300 rounded"></div>
            <span>5 days</span>
          </div>
          <div className="ml-auto text-gray-700">
            <span className="font-medium">Tip:</span> Click any cell to edit · Use Pattern button for bulk entry
          </div>
        </div>
      </div>

      {/* Pattern Modal */}
      {showPatternModal && selectedAllocForPattern && (
        <PatternModal
          allocation={selectedAllocForPattern}
          phase={selectedPhase!}
          onApply={applyPattern}
          onClose={() => {
            setShowPatternModal(false);
            setSelectedAllocForPattern(null);
          }}
        />
      )}

      {/* Add Resource Modal */}
      {showAddResourceModal && (
        <AddResourceModal
          availableResources={availableResources}
          onAdd={addNewResource}
          onClose={() => setShowAddResourceModal(false)}
        />
      )}
    </div>
  );
}

// Pattern Application Modal
function PatternModal({
  allocation,
  phase,
  onApply,
  onClose,
}: {
  allocation: ResourceAllocation;
  phase: Phase;
  onApply: (config: PatternConfig) => void;
  onClose: () => void;
}) {
  const [pattern, setPattern] = useState<AllocationPattern>(allocation.pattern);
  const [startWeek, setStartWeek] = useState(phase.weekStart);
  const [endWeek, setEndWeek] = useState(phase.weekEnd);
  const [totalDays, setTotalDays] = useState(allocation.totalDays);

  const weekRange = endWeek - startWeek + 1;
  const avgDaysPerWeek = totalDays / weekRange;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Apply Allocation Pattern</h3>
          <p className="text-sm text-gray-600 mt-1">{allocation.resourceName}</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Pattern Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pattern Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["STEADY", "RAMP_UP", "RAMP_DOWN", "RAMP_UP_DOWN"] as AllocationPattern[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    pattern === p
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Week Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Week</label>
              <input
                type="number"
                value={startWeek}
                onChange={(e) => setStartWeek(parseInt(e.target.value))}
                min={phase.weekStart}
                max={endWeek}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Week</label>
              <input
                type="number"
                value={endWeek}
                onChange={(e) => setEndWeek(parseInt(e.target.value))}
                min={startWeek}
                max={phase.weekEnd}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Total Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Days</label>
            <input
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(parseFloat(e.target.value))}
              min="0"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-900">
              <div className="font-semibold mb-1">Preview:</div>
              <div>
                {weekRange} weeks × ~{avgDaysPerWeek.toFixed(1)} days/week = {totalDays.toFixed(1)} total days
              </div>
              <div className="mt-1 text-blue-700">Pattern: {pattern.replace("_", " ")}</div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply({ pattern, startWeek, endWeek, totalDays })}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Apply Pattern
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Resource Modal
function AddResourceModal({
  availableResources,
  onAdd,
  onClose,
}: {
  availableResources: Array<{ id: string; name: string; designation: string }>;
  onAdd: (name: string, designation: string) => void;
  onClose: () => void;
}) {
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const selectedResource = availableResources.find((r) => r.id === selectedResourceId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Resource</h3>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Resource</label>
            <select
              value={selectedResourceId ?? ""}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">-- Choose a resource --</option>
              {availableResources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name} ({res.designation})
                </option>
              ))}
            </select>
          </div>

          {selectedResource && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm">
                <div className="font-medium text-gray-900">{selectedResource.name}</div>
                <div className="text-gray-600">{selectedResource.designation}</div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedResource) {
                onAdd(selectedResource.name, selectedResource.designation);
              }
            }}
            disabled={!selectedResource}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Resource
          </button>
        </div>
      </div>
    </div>
  );
}
