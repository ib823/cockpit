"use client";

import { useState } from "react";
import OptionAWizard from "./OptionA";
import OptionBGrid from "./OptionB";
import OptionCHybrid from "./OptionC";

type DesignOption = "A" | "B" | "C";

export default function TeamCapacityDesignComparison() {
  const [selectedOption, setSelectedOption] = useState<DesignOption>("C");
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Team Capacity Design Comparison
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Compare 3 different UX approaches for resource allocation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500">
                Device Preview:
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    deviceView === "desktop"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setDeviceView("tablet")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    deviceView === "tablet"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Tablet
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    deviceView === "mobile"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setSelectedOption("A")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedOption === "A"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Option A: Wizard (Guided)
            </button>
            <button
              onClick={() => setSelectedOption("B")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedOption === "B"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Option B: Smart Grid (Excel-style)
            </button>
            <button
              onClick={() => setSelectedOption("C")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedOption === "C"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Option C: Hybrid (Recommended)
            </button>
          </div>
        </div>
      </div>

      {/* Option Info Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-[1920px] mx-auto px-8 py-4">
          {selectedOption === "A" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Allocation Wizard (Guided, Step-by-Step)
              </h3>
              <p className="text-xs text-blue-800">
                <strong>Best for:</strong> Mobile users, first-time allocations, pattern-based entry ·
                <strong> Pros:</strong> Mobile-friendly, guided flow, prevents errors ·
                <strong> Cons:</strong> 4-step process, slower for quick edits
              </p>
            </div>
          )}
          {selectedOption === "B" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Smart Grid with Pattern Overlay (Excel-style)
              </h3>
              <p className="text-xs text-blue-800">
                <strong>Best for:</strong> Desktop power users, spreadsheet familiarity ·
                <strong> Pros:</strong> Fast cell editing, see all weeks at once, Excel-like ·
                <strong> Cons:</strong> Doesn't scale to mobile, overwhelming for 100+ resources
              </p>
            </div>
          )}
          {selectedOption === "C" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Hybrid: Phase Canvas + Weekly Drill-Down (Recommended)
              </h3>
              <p className="text-xs text-blue-800">
                <strong>Best for:</strong> All users, all devices, scalable ·
                <strong> Pros:</strong> Clean phase-level view, weekly precision on demand, mobile-responsive ·
                <strong> Cons:</strong> Two-level navigation (minor learning curve)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Area with Device Simulation */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="flex justify-center">
          <div
            className={`bg-white border-2 border-gray-300 rounded-lg shadow-xl overflow-hidden transition-all duration-300 ${
              deviceView === "desktop" ? "w-full" : ""
            } ${deviceView === "tablet" ? "w-[768px]" : ""} ${
              deviceView === "mobile" ? "w-[375px]" : ""
            }`}
            style={{
              minHeight: deviceView === "mobile" ? "667px" : "600px",
            }}
          >
            {selectedOption === "A" && <OptionAWizard deviceView={deviceView} />}
            {selectedOption === "B" && <OptionBGrid deviceView={deviceView} />}
            {selectedOption === "C" && <OptionCHybrid deviceView={deviceView} />}
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="bg-gray-100 border-t border-gray-200">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            Implementation Notes:
          </h3>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• All 3 options use the same backend data model (ResourceWeeklyAllocation)</li>
            <li>• Real-time collaboration (WebSocket) works identically across all options</li>
            <li>• Conflict detection and costing modules are independent of UI choice</li>
            <li>• Option C recommended for MVP due to best multi-device experience and fastest development</li>
            <li>• This is interactive prototype - click buttons and inputs to explore flows</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
