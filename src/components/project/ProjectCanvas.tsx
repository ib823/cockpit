// src/components/project/ProjectCanvas.tsx
"use client";

import { useProjectStore } from "@/stores/project-store";
import { ChipsSidebar } from "./ChipsSidebar";
import { CaptureCanvas } from "./CaptureCanvas";
import { DecisionCanvas } from "./DecisionCanvas";
import { TimelineCanvas } from "./TimelineCanvas";
import { PresentCanvas } from "./PresentCanvas";
import { Inspector } from "./Inspector";
import { ResizablePanel } from "./ResizablePanel";

export function ProjectCanvas() {
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const leftPanelWidth = useProjectStore((state) => state.leftPanelWidth);
  const rightPanelWidth = useProjectStore((state) => state.rightPanelWidth);
  const setLeftPanelWidth = useProjectStore((state) => state.setLeftPanelWidth);
  const setRightPanelWidth = useProjectStore((state) => state.setRightPanelWidth);

  const timelineIsStale = useProjectStore((state) => state.timelineIsStale);
  const lastGeneratedAt = useProjectStore((state) => state.lastGeneratedAt);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-light text-gray-900">SAP Project</h1>

          {/* Mode Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["capture", "decide", "plan", "present"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicator */}
        {mode === "plan" && (
          <div className="flex items-center gap-2 text-sm">
            {timelineIsStale ? (
              <span className="text-amber-600">⚠️ Timeline outdated</span>
            ) : lastGeneratedAt ? (
              <span className="text-green-600">✓ Up to date</span>
            ) : (
              <span className="text-gray-500">Not generated</span>
            )}
          </div>
        )}
      </div>

      {/* Main Content - 3 Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chips Sidebar */}
        <ResizablePanel side="left" width={leftPanelWidth} onResize={setLeftPanelWidth}>
          <ChipsSidebar />
        </ResizablePanel>

        {/* Center Canvas */}
        <div className="flex-1 overflow-auto bg-white">
          {mode === "capture" && <CaptureCanvas />}
          {mode === "decide" && <DecisionCanvas />}
          {mode === "plan" && <TimelineCanvas />}
          {mode === "present" && <PresentCanvas />}
        </div>

        {/* Right Panel - Inspector */}
        <ResizablePanel side="right" width={rightPanelWidth} onResize={setRightPanelWidth}>
          <Inspector />
        </ResizablePanel>
      </div>
    </div>
  );
}
