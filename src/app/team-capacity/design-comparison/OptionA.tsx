"use client";

import { useState, useEffect } from "react";
import type { AllocationPattern } from "./types";
import { samplePhases } from "./sampleData";
import { ResourceCreationModal, type CreatedResource } from "@/components/gantt-tool/ResourceCreationModal";

interface OptionAProps {
  deviceView: "desktop" | "tablet" | "mobile";
}

type WizardStep = 1 | 2 | 3 | 4;

interface Resource {
  id: string;
  name: string;
  designation: string;
  chargeRatePerHour?: number;
  regionCode?: string;
}

interface Phase {
  id: string;
  name: string;
  weekStart: number;
  weekEnd: number;
  totalWeeks: number;
  dateRange: string;
}

export default function OptionAWizard({ deviceView }: OptionAProps) {
  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<AllocationPattern | null>(null);
  const [totalDays, setTotalDays] = useState<number>(56);
  const [allocationNotes, setAllocationNotes] = useState("");

  // Resource management
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Using sample phases for demo purposes
  const phases: Phase[] = samplePhases.map(p => ({
    id: p.id,
    name: p.name,
    weekStart: p.weekStart,
    weekEnd: p.weekEnd,
    totalWeeks: p.totalWeeks,
    dateRange: p.dateRange,
  }));

  // Mock project ID for demo
  const projectId = "demo_project_001";

  // Load resources when wizard opens
  useEffect(() => {
    if (showWizard && resources.length === 0) {
      loadResources();
    }
  }, [showWizard]);

  const loadResources = async () => {
    setIsLoadingResources(true);
    try {
      // In production, this would fetch from /api/gantt-tool/resources?projectId=xxx
      // For demo, start with empty array (users create inline)
      setResources([]);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleResourceCreated = (resource: CreatedResource) => {
    setResources(prev => [...prev, resource]);
    setSelectedResource(resource.id);
    setShowResourceModal(false);
  };

  const handleStartWizard = () => {
    setShowWizard(true);
    setWizardStep(1);
    setSaveError(null);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedResource(null);
    setSelectedPhase(null);
    setSelectedPattern(null);
    setTotalDays(56);
    setAllocationNotes("");
    setSaveError(null);
  };

  const handleNextStep = () => {
    if (wizardStep < 4) {
      setWizardStep((wizardStep + 1) as WizardStep);
    }
  };

  const handleBackStep = () => {
    if (wizardStep > 1) {
      setWizardStep((wizardStep - 1) as WizardStep);
    }
  };

  const calculateWeeklyBreakdown = (
    pattern: AllocationPattern,
    totalWeeks: number,
    totalDaysForPhase: number
  ) => {
    const weeklyAllocations: { weekNumber: number; mandays: number }[] = [];
    const avgDaysPerWeek = totalDaysForPhase / totalWeeks;

    switch (pattern) {
      case "STEADY":
        for (let i = 0; i < totalWeeks; i++) {
          weeklyAllocations.push({ weekNumber: i + 1, mandays: avgDaysPerWeek });
        }
        break;

      case "RAMP_UP":
        for (let i = 0; i < totalWeeks; i++) {
          const progress = (i + 1) / totalWeeks;
          const mandays = progress * 5;
          weeklyAllocations.push({ weekNumber: i + 1, mandays: Math.min(mandays, 5) });
        }
        break;

      case "RAMP_DOWN":
        for (let i = 0; i < totalWeeks; i++) {
          const progress = 1 - (i / totalWeeks);
          const mandays = progress * 5;
          weeklyAllocations.push({ weekNumber: i + 1, mandays: Math.max(mandays, 1) });
        }
        break;

      case "RAMP_UP_DOWN":
        const midpoint = Math.floor(totalWeeks / 2);
        for (let i = 0; i < totalWeeks; i++) {
          const progress = i < midpoint ? (i + 1) / midpoint : (totalWeeks - i) / (totalWeeks - midpoint);
          const mandays = progress * 5;
          weeklyAllocations.push({ weekNumber: i + 1, mandays: Math.min(Math.max(mandays, 1), 5) });
        }
        break;

      case "CUSTOM":
        for (let i = 0; i < totalWeeks; i++) {
          weeklyAllocations.push({ weekNumber: i + 1, mandays: avgDaysPerWeek });
        }
        break;
    }

    return weeklyAllocations;
  };

  const handleSaveAllocation = async () => {
    if (!selectedResource || !selectedPhase || !selectedPattern) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const phase = phases.find(p => p.id === selectedPhase);
      if (!phase) throw new Error("Phase not found");

      // Calculate weekly breakdown
      const weeklyBreakdown = calculateWeeklyBreakdown(selectedPattern, phase.totalWeeks, totalDays);

      // In production, this would call /api/gantt-tool/team-capacity/allocations
      // For demo, we simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success and close wizard
      alert(`Allocation saved successfully!\n\nResource: ${resources.find(r => r.id === selectedResource)?.name}\nPhase: ${phase.name}\nTotal: ${totalDays} days`);

      handleCloseWizard();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save allocation");
    } finally {
      setIsSaving(false);
    }
  };

  // Main Dashboard View
  const DashboardView = () => (
    <div className="h-full overflow-auto bg-gray-50">
      <div className={`bg-white border-b border-gray-200 ${
        deviceView === "mobile" ? "px-4 py-3" : "px-8 py-4"
      }`}>
        <h2 className={`font-semibold text-gray-900 ${
          deviceView === "mobile" ? "text-base" : "text-lg"
        }`}>
          {deviceView === "mobile" ? "YTL Cement SAP" : "YTL Cement SAP Implementation"}
        </h2>
        <p className="text-xs text-gray-600 mt-1">26 weeks · Jan 6 - Jun 30, 2026</p>
      </div>

      <div className={deviceView === "mobile" ? "p-4" : "p-8"}>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
          Capacity Planning
        </h3>

        <div className="space-y-4">
          {phases.map((phase) => (
            <div key={phase.id} className={`bg-white border border-gray-200 rounded-lg ${
              deviceView === "mobile" ? "p-4" : "p-6"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    PHASE {phase.id.split("-")[1]}: {phase.name.toUpperCase()}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    W{phase.weekStart}-W{phase.weekEnd} · {phase.totalWeeks} weeks
                  </p>
                </div>
                <button
                  onClick={handleStartWizard}
                  className={`text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 ${
                    deviceView === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-2"
                  }`}
                >
                  + Add{deviceView === "mobile" ? "" : " Resource"}
                </button>
              </div>

              <div className="text-center py-8 bg-gray-50 rounded">
                <p className="text-sm text-gray-500 mb-3">No resources allocated yet</p>
                <button
                  onClick={handleStartWizard}
                  className={`font-medium text-blue-600 hover:text-blue-800 ${
                    deviceView === "mobile" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
                  }`}
                >
                  + Add First Resource
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-8 bg-white border border-gray-200 rounded-lg ${
          deviceView === "mobile" ? "p-4" : "p-6"
        }`}>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">PROJECT SUMMARY</h3>
          <div className="text-sm text-gray-700">
            Total Effort: 0 days across 0 resources · Duration: 26 weeks
          </div>
          <div className="text-sm text-gray-600 font-medium mt-2">
            <span className="text-green-600">[0 ERRORS]</span> <span className="text-yellow-600">[0 WARNINGS]</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Wizard Modal
  const WizardModal = () => {
    const isDesktop = deviceView === "desktop";
    const modalClasses = isDesktop
      ? "max-w-4xl w-full"
      : deviceView === "tablet"
      ? "max-w-2xl w-full"
      : "w-full h-full";

    const selectedPhaseData = phases.find(p => p.id === selectedPhase);
    const selectedResourceData = resources.find(r => r.id === selectedResource);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`bg-white rounded-lg shadow-xl ${modalClasses} max-h-[90vh] overflow-hidden flex flex-col`}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add Resource Allocation</h3>
            <button
              onClick={handleCloseWizard}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-900">
              STEP {wizardStep} OF 4: {
                wizardStep === 1 ? "Select Resource and Phase" :
                wizardStep === 2 ? "Choose Allocation Pattern" :
                wizardStep === 3 ? "Configure Pattern" :
                "Review and Save"
              }
            </div>
            <div className="mt-2 flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-1 rounded ${
                    step <= wizardStep ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-auto flex-1">
            {/* STEP 1: Select Resource and Phase */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Resource:
                  </label>

                  {resources.length === 0 && !isLoadingResources && (
                    <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        No resources created yet. Teams create resources during allocation.
                      </p>
                      <button
                        onClick={() => setShowResourceModal(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        + Create New Resource
                      </button>
                    </div>
                  )}

                  {resources.length > 0 && (
                    <div className="space-y-2">
                      {resources.map((resource) => (
                        <label
                          key={resource.id}
                          className={`flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                            selectedResource === resource.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="resource"
                            value={resource.id}
                            checked={selectedResource === resource.id}
                            onChange={() => setSelectedResource(resource.id)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                            <div className="text-xs text-gray-600">
                              {resource.designation} · {resource.chargeRatePerHour ? `${resource.chargeRatePerHour} MYR/hr` : "Rate not set"}
                            </div>
                          </div>
                        </label>
                      ))}
                      <button
                        onClick={() => setShowResourceModal(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600"
                      >
                        + Create Another Resource
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Phase:
                  </label>
                  <div className="space-y-2">
                    {phases.map((phase) => (
                      <label
                        key={phase.id}
                        className={`flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                          selectedPhase === phase.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="phase"
                          value={phase.id}
                          checked={selectedPhase === phase.id}
                          onChange={() => setSelectedPhase(phase.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {phase.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            W{phase.weekStart}-W{phase.weekEnd} · {phase.totalWeeks} weeks · {phase.dateRange}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedResource && selectedPhase && (
                  <div className="p-4 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-blue-800">
                      <strong>Selected:</strong> {selectedResourceData?.name} → {selectedPhaseData?.name}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Choose Pattern */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 mb-4">
                  How should effort be distributed across the phase weeks?
                </p>

                {(["STEADY", "RAMP_UP", "RAMP_DOWN", "RAMP_UP_DOWN", "CUSTOM"] as AllocationPattern[]).map((pattern) => (
                  <label
                    key={pattern}
                    className={`block p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                      selectedPattern === pattern ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="pattern"
                        value={pattern}
                        checked={selectedPattern === pattern}
                        onChange={() => setSelectedPattern(pattern)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{pattern}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {pattern === "STEADY" && "Same effort every week (e.g., 4 days/week for all weeks)"}
                          {pattern === "RAMP_UP" && "Gradually increase from low to high (e.g., 1d → 5d/week)"}
                          {pattern === "RAMP_DOWN" && "Gradually decrease from high to low (e.g., 5d → 1d/week)"}
                          {pattern === "RAMP_UP_DOWN" && "Peak in middle, low at start/end (e.g., 1d → 5d → 1d)"}
                          {pattern === "CUSTOM" && "Enter each week manually"}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* STEP 3: Configure Pattern */}
            {wizardStep === 3 && selectedPattern && selectedPhaseData && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">
                    Configure {selectedPattern} Allocation
                  </div>
                  <div className="text-xs text-gray-700">
                    Phase: {selectedPhaseData.name} · {selectedPhaseData.totalWeeks} weeks
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Effort:
                  </label>
                  <div className="flex items-center space-x-4">
                    <div>
                      <input
                        type="number"
                        min="0"
                        max={selectedPhaseData.totalWeeks * 5}
                        value={totalDays}
                        onChange={(e) => setTotalDays(parseInt(e.target.value) || 0)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">days</span>
                    </div>
                    <div className="text-sm text-gray-600">OR</div>
                    <div>
                      <input
                        type="number"
                        value={Math.round((totalDays / (selectedPhaseData.totalWeeks * 5)) * 100)}
                        onChange={(e) => {
                          const percent = parseInt(e.target.value) || 0;
                          setTotalDays(Math.round((percent / 100) * selectedPhaseData.totalWeeks * 5));
                        }}
                        className="w-32 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        max="100"
                        min="0"
                      />
                      <span className="ml-2 text-sm text-gray-600">%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-2">Calculated Distribution:</div>
                  <div className="text-sm text-gray-700">
                    {selectedPhaseData.totalWeeks} weeks × {(totalDays / selectedPhaseData.totalWeeks).toFixed(1)} days/week = {totalDays} days
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Utilization: {Math.round((totalDays / (selectedPhaseData.totalWeeks * 5)) * 100)}% per week
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional):
                  </label>
                  <textarea
                    value={allocationNotes}
                    onChange={(e) => setAllocationNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any notes about this allocation..."
                  />
                </div>
              </div>
            )}

            {/* STEP 4: Review and Save */}
            {wizardStep === 4 && selectedResourceData && selectedPhaseData && selectedPattern && (
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Allocation Summary:</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Resource:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {selectedResourceData.name} ({selectedResourceData.designation})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phase:</span>{" "}
                      <span className="font-medium text-gray-900">
                        {selectedPhaseData.name} (W{selectedPhaseData.weekStart}-W{selectedPhaseData.weekEnd})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pattern:</span>{" "}
                      <span className="font-medium text-gray-900">{selectedPattern}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>{" "}
                      <span className="font-medium text-gray-900">{totalDays} days</span>
                    </div>
                    {selectedResourceData.chargeRatePerHour && (
                      <div>
                        <span className="text-gray-600">Estimated Cost:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {(totalDays * 8 * selectedResourceData.chargeRatePerHour).toLocaleString()} MYR
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded border border-green-200">
                  <div className="text-sm font-medium text-green-900 mb-2">
                    SUCCESS: No conflicts detected
                  </div>
                  <div className="text-xs text-green-800">
                    This allocation can be saved without conflicts.
                  </div>
                </div>

                {saveError && (
                  <div className="p-4 bg-red-50 rounded border border-red-200">
                    <div className="text-sm font-medium text-red-900 mb-1">
                      ERROR: Failed to save
                    </div>
                    <div className="text-xs text-red-800">{saveError}</div>
                  </div>
                )}

                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-2">This allocation will:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Create {selectedPhaseData.totalWeeks} weekly allocation records</li>
                    <li>Link to {selectedPhaseData.name} phase</li>
                    <li>Apply {selectedPattern} pattern across all weeks</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={wizardStep === 1 ? handleCloseWizard : handleBackStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              disabled={isSaving}
            >
              {wizardStep === 1 ? "Cancel" : "← Back"}
            </button>
            <button
              onClick={wizardStep === 4 ? handleSaveAllocation : handleNextStep}
              disabled={
                isSaving ||
                (wizardStep === 1 && (!selectedResource || !selectedPhase)) ||
                (wizardStep === 2 && !selectedPattern)
              }
              className={`px-4 py-2 text-sm font-medium rounded ${
                isSaving ||
                (wizardStep === 1 && (!selectedResource || !selectedPhase)) ||
                (wizardStep === 2 && !selectedPattern)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSaving ? "Saving..." : wizardStep === 4 ? "Save Allocation" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <DashboardView />
      {showWizard && <WizardModal />}
      {showResourceModal && (
        <ResourceCreationModal
          isOpen={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          onSuccess={handleResourceCreated}
          projectId={projectId}
        />
      )}
    </>
  );
}
