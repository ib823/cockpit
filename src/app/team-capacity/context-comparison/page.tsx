"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";

/**
 * Context Visibility Comparison
 *
 * Shows 3 approaches to solving the critical UX gap:
 * "How do I allocate resources when I can't see WHAT I'm staffing for?"
 *
 * Compliance: ULTIMATE GLOBAL QUALITY POLICY
 * - No emojis (Constraint B)
 * - Typography and hierarchy only
 * - Apple-grade UX
 * - Realistic project data
 */

// Realistic project data
const projectData = {
  name: "YTL Cement SAP Implementation",
  duration: "26 weeks",
  phases: [
    {
      id: "phase-1",
      name: "Planning & Requirements",
      weeks: "W1-W4",
      duration: "4 weeks",
      businessContext: {
        asIs: "Legacy on-premise SAP ECC 6.0 system with manual processes and limited integration",
        toBe: "Cloud-based SAP S/4HANA with automated workflows and real-time analytics",
        goals: [
          "Support 50 concurrent users across 3 facilities",
          "Reduce month-end closing from 5 days to 1 day",
          "Enable mobile access for field operations"
        ]
      },
      requirements: [
        "Document current business processes (procurement, production, sales)",
        "Identify pain points and bottlenecks in existing system",
        "Define functional requirements for S/4HANA migration",
        "Stakeholder interviews with department heads"
      ],
      tasks: [
        { id: "t1", name: "Requirements Gathering", weeks: "W1-W2", owner: "PM" },
        { id: "t2", name: "Architecture Design", weeks: "W2-W3", owner: "Solution Architect" },
        { id: "t3", name: "Approval & Sign-off", weeks: "W4", owner: "PM" }
      ],
      skillsNeeded: ["Project Management", "SAP Functional", "Business Analysis"],
      resources: [
        { name: "Sarah Chen", role: "Project Manager", allocation: [90, 80, 70, 60] },
        { name: "Mike Wong", role: "Solution Architect", allocation: [50, 50, 50, 50] }
      ]
    },
    {
      id: "phase-2",
      name: "Development & Configuration",
      weeks: "W5-W18",
      duration: "14 weeks",
      businessContext: {
        asIs: "Manual configuration and limited customization in legacy system",
        toBe: "Automated configuration management with version control and testing",
        goals: [
          "Configure all core SAP modules (FI, CO, MM, PP)",
          "Develop custom integrations with existing systems",
          "Build mobile apps for warehouse and quality control"
        ]
      },
      requirements: [
        "Configure SAP FI/CO modules for financial management",
        "Set up MM module for procurement and inventory",
        "Develop custom APIs for integration with MES system",
        "Build mobile apps for iOS and Android"
      ],
      tasks: [
        { id: "t4", name: "SAP Configuration", weeks: "W5-W12", owner: "SAP Consultant" },
        { id: "t5", name: "Custom Development", weeks: "W8-W16", owner: "ABAP Developer" },
        { id: "t6", name: "Mobile App Development", weeks: "W10-W18", owner: "Mobile Dev" }
      ],
      skillsNeeded: ["SAP ABAP", "SAP Functional", "Mobile Development", "Integration"],
      resources: [
        { name: "David Lee", role: "SAP Consultant", allocation: [100, 100, 100, 100, 100, 100, 100, 100, 80, 80, 60, 60, 40, 40] },
        { name: "Emma Tan", role: "ABAP Developer", allocation: [0, 0, 0, 80, 80, 80, 80, 80, 80, 80, 80, 60, 60, 40] },
        { name: "Ryan Kumar", role: "Mobile Developer", allocation: [0, 0, 0, 0, 0, 60, 60, 80, 80, 80, 80, 80, 80, 60] }
      ]
    }
  ]
};

export default function ContextComparisonPage() {
  const [selectedApproach, setSelectedApproach] = useState<"A" | "B" | "C">("A");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Context Visibility Comparison
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Review 3 approaches to show project context while allocating resources
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setSelectedApproach("A")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedApproach === "A"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Approach A: Inline Expandable
            </button>
            <button
              onClick={() => setSelectedApproach("B")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedApproach === "B"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Approach B: Split-Screen
            </button>
            <button
              onClick={() => setSelectedApproach("C")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedApproach === "C"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Approach C: Contextual Sidebar
            </button>
          </div>
        </div>
      </div>

      {/* Approach Info */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-[1920px] mx-auto px-8 py-4">
          {selectedApproach === "A" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Approach A: Inline Expandable Phase Details
              </h3>
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> Click phase header to expand and show requirements, tasks, business context. Progressive disclosure - see details when needed.
                <strong className="ml-2">Best for:</strong> All devices, clean default view, contextual learning.
              </p>
            </div>
          )}
          {selectedApproach === "B" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Approach B: Split-Screen (Timeline + Capacity)
              </h3>
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> Timeline on left, capacity allocation on right. See both simultaneously without switching views.
                <strong className="ml-2">Best for:</strong> Desktop power users, large monitors, complex projects.
              </p>
            </div>
          )}
          {selectedApproach === "C" && (
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Approach C: Contextual Sidebar
              </h3>
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> Persistent sidebar shows selected phase details. Click any phase to update sidebar content.
                <strong className="ml-2">Best for:</strong> Focused context, single-phase editing, medium-large screens.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {selectedApproach === "A" && <ApproachAInlineExpandable />}
        {selectedApproach === "B" && <ApproachBSplitScreen />}
        {selectedApproach === "C" && <ApproachCContextualSidebar />}
      </div>
    </div>
  );
}

// ============================================================================
// APPROACH A: Inline Expandable
// ============================================================================

function ApproachAInlineExpandable() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>("phase-1");

  return (
    <div className="space-y-4">
      {projectData.phases.map((phase) => (
        <div key={phase.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Phase Header - Clickable */}
          <button
            onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {expandedPhase === phase.id ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <div className="text-left">
                <div className="text-base font-semibold text-gray-900">{phase.name}</div>
                <div className="text-sm text-gray-500">{phase.weeks} • {phase.duration}</div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {phase.resources.length} resources allocated
            </div>
          </button>

          {/* Expanded Context */}
          {expandedPhase === phase.id && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-6 space-y-6">
              {/* Business Context */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Business Context
                </h4>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Current State (As-Is)</div>
                    <div className="text-sm text-gray-900">{phase.businessContext.asIs}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Target State (To-Be)</div>
                    <div className="text-sm text-gray-900">{phase.businessContext.toBe}</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <div className="text-xs font-medium text-gray-500 mb-2">Project Goals</div>
                    <ul className="text-sm text-gray-900 space-y-1">
                      {phase.businessContext.goals.map((goal, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Key Requirements
                </h4>
                <div className="bg-white border border-gray-200 rounded p-3">
                  <ul className="text-sm text-gray-900 space-y-2">
                    {phase.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-600 font-medium mr-2">{idx + 1}.</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tasks */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Tasks ({phase.tasks.length})
                </h4>
                <div className="bg-white border border-gray-200 rounded divide-y divide-gray-200">
                  {phase.tasks.map((task) => (
                    <div key={task.id} className="px-3 py-2 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.name}</div>
                        <div className="text-xs text-gray-500">Owner: {task.owner}</div>
                      </div>
                      <div className="text-xs font-mono text-gray-600">{task.weeks}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Needed */}
              <div>
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  Skills Required
                </h4>
                <div className="flex flex-wrap gap-2">
                  {phase.skillsNeeded.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resource Allocation Grid */}
          <div className="border-t border-gray-200 p-6">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Resource Allocation
            </h4>
            <div className="space-y-3">
              {phase.resources.map((resource, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                      <div className="text-xs text-gray-500">{resource.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500 w-12">Weeks:</div>
                    {resource.allocation.map((pct, weekIdx) => (
                      <div
                        key={weekIdx}
                        className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-semibold ${
                          pct === 0
                            ? "bg-gray-100 text-gray-400"
                            : pct <= 50
                            ? "bg-green-200 text-green-900"
                            : pct <= 80
                            ? "bg-yellow-200 text-yellow-900"
                            : "bg-red-200 text-red-900"
                        }`}
                      >
                        {pct > 0 ? `${pct}%` : "—"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Add Resource to {phase.name}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// APPROACH B: Split-Screen
// ============================================================================

function ApproachBSplitScreen() {
  const [selectedPhase, setSelectedPhase] = useState<string>("phase-1");
  const phase = projectData.phases.find((p) => p.id === selectedPhase) || projectData.phases[0];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* LEFT: Timeline View */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Project Timeline</h3>
        <div className="space-y-4">
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
              <div className="text-xs text-gray-500 mt-1">{p.weeks} • {p.duration}</div>
              <div className="mt-3 space-y-2">
                {p.tasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="text-xs text-gray-600 pl-3 border-l-2 border-gray-300">
                    {task.name}
                  </div>
                ))}
                {p.tasks.length > 2 && (
                  <div className="text-xs text-gray-500 pl-3">
                    +{p.tasks.length - 2} more tasks
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: Capacity View with Context */}
      <div className="space-y-6">
        {/* Phase Context Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">{phase.name}</h3>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">Business Context</div>
              <div className="text-sm text-gray-900 space-y-1">
                <div><span className="font-medium">As-Is:</span> {phase.businessContext.asIs}</div>
                <div><span className="font-medium">To-Be:</span> {phase.businessContext.toBe}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-700 mb-1">Skills Required</div>
              <div className="flex flex-wrap gap-1">
                {phase.skillsNeeded.map((skill, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resource Allocation */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Resource Allocation</h4>
          <div className="space-y-3">
            {phase.resources.map((resource, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                    <div className="text-xs text-gray-500">{resource.role}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {resource.allocation.map((pct, weekIdx) => (
                    <div
                      key={weekIdx}
                      className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-semibold ${
                        pct === 0
                          ? "bg-gray-100 text-gray-400"
                          : pct <= 50
                          ? "bg-green-200 text-green-900"
                          : pct <= 80
                          ? "bg-yellow-200 text-yellow-900"
                          : "bg-red-200 text-red-900"
                      }`}
                    >
                      {pct > 0 ? `${pct}%` : "—"}
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

// ============================================================================
// APPROACH C: Contextual Sidebar
// ============================================================================

function ApproachCContextualSidebar() {
  const [selectedPhase, setSelectedPhase] = useState<string>("phase-1");
  const phase = projectData.phases.find((p) => p.id === selectedPhase) || projectData.phases[0];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* MAIN: Capacity Grid (8 columns) */}
      <div className="col-span-8 space-y-4">
        {projectData.phases.map((p) => (
          <div
            key={p.id}
            className={`bg-white border-2 rounded-lg overflow-hidden transition-all ${
              selectedPhase === p.id ? "border-blue-600" : "border-gray-200"
            }`}
          >
            <button
              onClick={() => setSelectedPhase(p.id)}
              className="w-full px-6 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-500">{p.weeks} • {p.duration}</div>
              </div>
              <div className="text-xs text-gray-600">{p.resources.length} resources</div>
            </button>

            <div className="p-6 space-y-3">
              {p.resources.map((resource, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                      <div className="text-xs text-gray-500">{resource.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {resource.allocation.map((pct, weekIdx) => (
                      <div
                        key={weekIdx}
                        className={`flex-1 h-10 rounded flex items-center justify-center text-xs font-semibold ${
                          pct === 0
                            ? "bg-gray-100 text-gray-400"
                            : pct <= 50
                            ? "bg-green-200 text-green-900"
                            : pct <= 80
                            ? "bg-yellow-200 text-yellow-900"
                            : "bg-red-200 text-red-900"
                        }`}
                      >
                        {pct > 0 ? `${pct}%` : "—"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* SIDEBAR: Phase Context (4 columns) */}
      <div className="col-span-4">
        <div className="sticky top-24 bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{phase.name}</h3>
            <div className="text-xs text-gray-500">{phase.weeks} • {phase.duration}</div>
          </div>

          {/* Business Context */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Business Context
            </h4>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">As-Is</div>
                <div className="text-sm text-gray-900">{phase.businessContext.asIs}</div>
              </div>
              <div className="bg-gray-50 rounded p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">To-Be</div>
                <div className="text-sm text-gray-900">{phase.businessContext.toBe}</div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Requirements
            </h4>
            <ul className="text-sm text-gray-900 space-y-2">
              {phase.requirements.slice(0, 3).map((req, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-blue-600 font-medium mr-2">{idx + 1}.</span>
                  <span className="text-xs">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tasks */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Tasks ({phase.tasks.length})
            </h4>
            <div className="space-y-2">
              {phase.tasks.map((task) => (
                <div key={task.id} className="bg-gray-50 rounded p-2">
                  <div className="text-sm font-medium text-gray-900">{task.name}</div>
                  <div className="text-xs text-gray-500">{task.weeks}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Skills Required
            </h4>
            <div className="flex flex-wrap gap-2">
              {phase.skillsNeeded.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
