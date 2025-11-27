"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";

/**
 * Approach B - Mobile/Tablet Adaptation
 *
 * Shows how split-screen adapts across devices:
 * - Desktop: Side-by-side timeline + capacity
 * - Tablet: Collapsible sidebar with toggle
 * - Mobile: Full-screen with slide-out context drawer
 */

const projectData = {
  name: "YTL Cement SAP Implementation",
  phases: [
    {
      id: "phase-1",
      name: "Planning & Requirements",
      weeks: "W1-W4",
      businessContext: "Legacy on-premise SAP ECC 6.0 system. Target: Cloud S/4HANA with automated workflows.",
      requirements: ["Document current processes", "Identify pain points", "Define functional requirements"],
      skills: ["Project Management", "SAP Functional", "Business Analysis"],
      resources: [
        { name: "Sarah Chen", role: "Project Manager", allocation: [90, 80, 70, 60] },
        { name: "Mike Wong", role: "Solution Architect", allocation: [50, 50, 50, 50] }
      ]
    },
    {
      id: "phase-2",
      name: "Development",
      weeks: "W5-W18",
      businessContext: "Configure SAP modules and develop custom integrations with existing MES system.",
      requirements: ["Configure FI/CO modules", "Develop custom APIs", "Build mobile apps"],
      skills: ["SAP ABAP", "Mobile Development", "Integration"],
      resources: [
        { name: "David Lee", role: "SAP Consultant", allocation: [100, 100, 100, 80] },
        { name: "Emma Tan", role: "ABAP Developer", allocation: [80, 80, 80, 80] }
      ]
    }
  ]
};

export default function ApproachBResponsivePage() {
  const [deviceView, setDeviceView] = useState<"desktop" | "tablet" | "mobile">("desktop");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Approach B: Responsive Adaptation
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            See how split-screen adapts across desktop, tablet, and mobile
          </p>

          {/* Device Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setDeviceView("desktop")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                deviceView === "desktop"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Desktop (1920px)
            </button>
            <button
              onClick={() => setDeviceView("tablet")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                deviceView === "tablet"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tablet (768px)
            </button>
            <button
              onClick={() => setDeviceView("mobile")}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                deviceView === "mobile"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Mobile (375px)
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        <div className="flex justify-center">
          <div
            className={`bg-gray-200 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
              deviceView === "desktop" ? "w-full max-w-[1920px]" : ""
            } ${deviceView === "tablet" ? "w-[768px]" : ""} ${
              deviceView === "mobile" ? "w-[375px]" : ""
            }`}
            style={{
              minHeight: deviceView === "mobile" ? "667px" : "800px",
            }}
          >
            {deviceView === "desktop" && <DesktopView />}
            {deviceView === "tablet" && <TabletView />}
            {deviceView === "mobile" && <MobileView />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop: Side-by-side split
function DesktopView() {
  const [selectedPhase, setSelectedPhase] = useState("phase-1");
  const phase = projectData.phases.find(p => p.id === selectedPhase) || projectData.phases[0];

  return (
    <div className="h-full bg-white grid grid-cols-2 divide-x divide-gray-200">
      {/* LEFT: Timeline */}
      <div className="p-6 overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Project Timeline</h3>
        <div className="space-y-3">
          {projectData.phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p.id)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedPhase === p.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-sm font-semibold text-gray-900">{p.name}</div>
              <div className="text-xs text-gray-500 mt-1">{p.weeks}</div>
              <div className="text-xs text-gray-700 mt-2">{p.businessContext}</div>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Capacity Grid */}
      <div className="p-6 overflow-y-auto bg-gray-50">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Resource Allocation</h3>
        <div className="space-y-4">
          {phase.resources.map((resource, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                <div className="text-xs text-gray-500">{resource.role}</div>
              </div>
              <div className="space-y-2">
                <div className="text-xs text-gray-600 mb-1">Weekly Allocation</div>
                <div className="flex gap-2">
                  {resource.allocation.map((pct, weekIdx) => (
                    <div
                      key={weekIdx}
                      className={`flex-1 h-12 rounded flex items-center justify-center text-xs font-semibold ${
                        pct <= 50
                          ? "bg-green-200 text-green-900"
                          : pct <= 80
                          ? "bg-yellow-200 text-yellow-900"
                          : "bg-red-200 text-red-900"
                      }`}
                    >
                      {pct}%
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Tablet: Collapsible sidebar
function TabletView() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState("phase-1");
  const phase = projectData.phases.find(p => p.id === selectedPhase) || projectData.phases[0];

  return (
    <div className="h-full bg-white flex">
      {/* Sidebar (collapsible) */}
      <div
        className={`border-r border-gray-200 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "w-80" : "w-0"
        }`}
      >
        <div className="w-80 p-4 overflow-y-auto h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Context</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Business Context</div>
              <div className="text-xs text-gray-900">{phase.businessContext}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Requirements</div>
              <ul className="text-xs text-gray-900 space-y-1">
                {phase.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-blue-600 mr-2">{idx + 1}.</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">Skills Required</div>
              <div className="flex flex-wrap gap-1">
                {phase.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <h3 className="text-sm font-semibold text-gray-900">{phase.name}</h3>
          <div className="text-xs text-gray-500">{phase.weeks}</div>
        </div>

        {/* Capacity Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-3">
            {phase.resources.map((resource, idx) => (
              <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="mb-2">
                  <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                  <div className="text-xs text-gray-500">{resource.role}</div>
                </div>
                <div className="flex gap-1">
                  {resource.allocation.map((pct, weekIdx) => (
                    <div
                      key={weekIdx}
                      className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-semibold ${
                        pct <= 50
                          ? "bg-green-200 text-green-900"
                          : pct <= 80
                          ? "bg-yellow-200 text-yellow-900"
                          : "bg-red-200 text-red-900"
                      }`}
                    >
                      {pct}%
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile: Slide-out drawer
function MobileView() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState("phase-1");
  const phase = projectData.phases.find(p => p.id === selectedPhase) || projectData.phases[0];

  return (
    <div className="h-full bg-white flex flex-col relative">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold text-gray-900 truncate mx-3">{phase.name}</div>
        <div className="text-xs text-gray-500 whitespace-nowrap">{phase.weeks}</div>
      </div>

      {/* Capacity Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {phase.resources.map((resource, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="mb-3">
                <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                <div className="text-xs text-gray-500">{resource.role}</div>
              </div>
              <div className="space-y-2">
                {resource.allocation.map((pct, weekIdx) => (
                  <div key={weekIdx} className="flex items-center gap-2">
                    <div className="text-xs text-gray-600 w-10">W{weekIdx + 1}</div>
                    <div className="flex-1 h-10 bg-gray-200 rounded-lg overflow-hidden">
                      <div
                        className={`h-full flex items-center justify-center text-xs font-semibold transition-all ${
                          pct <= 50
                            ? "bg-green-500 text-white"
                            : pct <= 80
                            ? "bg-yellow-500 text-gray-900"
                            : "bg-red-500 text-white"
                        }`}
                        style={{ width: `${pct}%` }}
                      >
                        {pct}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-out Drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="absolute top-0 left-0 bottom-0 w-80 bg-white z-20 shadow-2xl">
            <div className="p-4 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Phase Context</h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Phase Selector */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-700 mb-2">Select Phase</div>
                <div className="space-y-2">
                  {projectData.phases.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPhase(p.id);
                        setDrawerOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPhase === p.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.weeks}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Context Details */}
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Business Context</div>
                  <div className="text-sm text-gray-900">{phase.businessContext}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Requirements</div>
                  <ul className="text-sm text-gray-900 space-y-1">
                    {phase.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-600 font-medium mr-2">{idx + 1}.</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Skills Required</div>
                  <div className="flex flex-wrap gap-2">
                    {phase.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
