"use client";

import { useState } from "react";
import { ChipCapture } from "@/components/presales/ChipCapture";
import DecisionBar from "@/components/DecisionBar";
import PlanningCanvas from "@/components/PlanningCanvas";
import { ModeSelector } from "@/components/presales/ModeSelector";

export default function PresalesPage() {
  // const { mode } = usePresalesStore();
  const [activeView, setActiveView] = useState<"capture" | "plan">("capture");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">SAP Presales Engine</h1>
            <ModeSelector />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveView("capture")}
              className={`py-2 px-3 border-b-2 transition-colors ${
                activeView === "capture"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Capture
            </button>
            <button
              onClick={() => setActiveView("plan")}
              className={`py-2 px-3 border-b-2 transition-colors ${
                activeView === "plan"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Plan
            </button>
          </div>
        </div>
      </div>

      {/* Decision Bar */}
      {activeView === "plan" && <DecisionBar />}

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {activeView === "capture" ? <ChipCapture /> : <PlanningCanvas />}
      </div>
    </div>
  );
}
