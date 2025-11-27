"use client";

import { useState } from "react";

/**
 * Team Capacity Integration Mockups
 *
 * PURPOSE: Demonstrate TRUE integration with existing Gantt tool
 * NOT standalone UI concepts - shows actual data flow and sync
 *
 * Apple-Grade UX Principles:
 * 1. Team Capacity is a VIEW, not a separate tool
 * 2. Seamless transition: Timeline ↔ Capacity ↔ Costing
 * 3. Same project data, different perspectives
 * 4. Zero learning curve, intuitive integration
 * 5. Bidirectional sync visualization
 */

export default function TeamCapacityIntegrationMockups() {
  const [activeTab, setActiveTab] = useState<
    "integration-flow" | "data-mapping" | "capacity-grid" | "conflicts" | "responsive"
  >("integration-flow");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Team Capacity Integration Design
          </h1>
          <p className="text-sm text-gray-600">
            Demonstrating TRUE integration with existing Gantt tool - not standalone UI concepts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-[1600px] mx-auto px-8">
          <div className="flex space-x-8 border-b border-gray-200">
            {[
              { id: "integration-flow", label: "1. Integration Flow" },
              { id: "data-mapping", label: "2. Data Model Mapping" },
              { id: "capacity-grid", label: "3. Integrated Capacity View" },
              { id: "conflicts", label: "4. Conflict Detection" },
              { id: "responsive", label: "5. Responsive Design" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {activeTab === "integration-flow" && <IntegrationFlowMockup />}
        {activeTab === "data-mapping" && <DataMappingMockup />}
        {activeTab === "capacity-grid" && <CapacityGridMockup />}
        {activeTab === "conflicts" && <ConflictDetectionMockup />}
        {activeTab === "responsive" && <ResponsiveDesignMockup />}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: INTEGRATION FLOW - How Timeline ↔ Capacity transition works
// ============================================================================

function IntegrationFlowMockup() {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Critical Design Principle
        </h2>
        <p className="text-sm text-gray-700">
          Team Capacity is NOT a separate page at <code>/team-capacity</code>. It's an integrated
          <strong> capacity planning mode</strong> within <code>/gantt-tool</code> using the same project data.
        </p>
      </div>

      {/* Step 1: Timeline View */}
      <MockupSection
        title="Step 1: User at Timeline View"
        subtitle="Standard Gantt chart view at /gantt-tool"
      >
        <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-semibold text-gray-900">
                YTL Cement SAP Implementation
              </div>
              <div className="text-xs text-gray-500">26 weeks • 4 phases • 8 resources</div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Switch to Capacity View →
              </button>
            </div>
          </div>

          {/* Gantt Timeline (Simplified) */}
          <div className="p-6">
            <div className="space-y-3">
              {/* Phase 1 */}
              <div className="flex items-center">
                <div className="w-48 text-sm font-medium text-gray-900">
                  Phase 1: Planning
                </div>
                <div className="flex-1 ml-4">
                  <div className="h-8 bg-blue-500 rounded" style={{ width: "20%" }}>
                    <div className="flex items-center justify-between px-3 h-full text-xs font-medium text-white">
                      <span>W1-W4</span>
                      <span className="bg-blue-600 px-2 py-0.5 rounded">2 resources</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="flex items-center">
                <div className="w-48 text-sm font-medium text-gray-900">
                  Phase 2: Development
                </div>
                <div className="flex-1 ml-4">
                  <div className="relative">
                    <div
                      className="h-8 bg-purple-500 rounded"
                      style={{ width: "54%", marginLeft: "20%" }}
                    >
                      <div className="flex items-center justify-between px-3 h-full text-xs font-medium text-white">
                        <span>W5-W18</span>
                        <span className="bg-purple-600 px-2 py-0.5 rounded">4 resources</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="flex items-center">
                <div className="w-48 text-sm font-medium text-gray-900">
                  Phase 3: Testing
                </div>
                <div className="flex-1 ml-4">
                  <div className="relative">
                    <div
                      className="h-8 bg-amber-500 rounded"
                      style={{ width: "18%", marginLeft: "74%" }}
                    >
                      <div className="flex items-center justify-between px-3 h-full text-xs font-medium text-white">
                        <span>W19-W22</span>
                        <span className="bg-amber-600 px-2 py-0.5 rounded">3 resources</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 4 */}
              <div className="flex items-center">
                <div className="w-48 text-sm font-medium text-gray-900">
                  Phase 4: Deployment
                </div>
                <div className="flex-1 ml-4">
                  <div className="relative">
                    <div
                      className="h-8 bg-green-500 rounded"
                      style={{ width: "8%", marginLeft: "92%" }}
                    >
                      <div className="flex items-center justify-between px-3 h-full text-xs font-medium text-white">
                        <span>W23-W26</span>
                        <span className="bg-green-600 px-2 py-0.5 rounded">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Labels */}
            <div className="flex items-center mt-4 ml-48 pl-4">
              <div className="flex-1 flex justify-between text-xs text-gray-500 font-mono">
                <span>W1</span>
                <span>W5</span>
                <span>W10</span>
                <span>W15</span>
                <span>W20</span>
                <span>W26</span>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Need to check resource capacity?
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Switch to Capacity view to see week-by-week allocation grid
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Open Capacity View
              </button>
            </div>
          </div>
        </div>
      </MockupSection>

      {/* Step 2: Transition Animation */}
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-4xl text-gray-400 mb-2">↓</div>
          <div className="text-sm font-medium text-gray-600">
            User clicks "Switch to Capacity View"
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Same URL: /gantt-tool?view=capacity
          </div>
        </div>
      </div>

      {/* Step 3: Capacity View */}
      <MockupSection
        title="Step 2: Capacity Planning View"
        subtitle="Same project data, now showing week-by-week resource allocations"
      >
        <div className="border-2 border-blue-500 rounded-lg bg-white overflow-hidden">
          {/* Toolbar - Updated */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-white transition-colors">
                ← Back to Timeline
              </button>
              <div className="text-sm font-semibold text-gray-900">
                YTL Cement SAP Implementation
              </div>
              <div className="text-xs text-gray-500">Capacity Planning View</div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded hover:bg-white">
                Detect Conflicts
              </button>
              <button className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700">
                View Costing →
              </button>
            </div>
          </div>

          {/* Capacity Grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-64 sticky left-0 bg-gray-100">
                    Resource / Phase
                  </th>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <th
                      key={i}
                      className="px-2 py-3 text-center text-xs font-medium text-gray-600 min-w-[60px]"
                    >
                      <div>W{i + 1}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {new Date(2025, 0, 6 + i * 7).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Phase 1: Planning */}
                <tr className="border-b border-gray-100 bg-blue-25">
                  <td
                    colSpan={13}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-blue-50 sticky left-0"
                  >
                    Phase 1: Planning (W1-W4)
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white">
                    <div>Sarah Chen</div>
                    <div className="text-xs text-gray-500">Project Manager</div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-blue-400 rounded flex items-center justify-center text-xs font-semibold text-white">
                      90%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-blue-400 rounded flex items-center justify-center text-xs font-semibold text-white">
                      90%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-blue-400 rounded flex items-center justify-center text-xs font-semibold text-white">
                      80%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-blue-400 rounded flex items-center justify-center text-xs font-semibold text-white">
                      80%
                    </div>
                  </td>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      <div className="h-8 bg-gray-100 rounded"></div>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white">
                    <div>Mike Wong</div>
                    <div className="text-xs text-gray-500">Solution Architect</div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900">
                      50%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900">
                      50%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900">
                      50%
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900">
                      50%
                    </div>
                  </td>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      <div className="h-8 bg-gray-100 rounded"></div>
                    </td>
                  ))}
                </tr>

                {/* Phase 2: Development */}
                <tr className="border-b border-gray-100 bg-purple-25">
                  <td
                    colSpan={13}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-purple-50 sticky left-0"
                  >
                    Phase 2: Development (W5-W18)
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-white">
                    <div>Alex Kumar</div>
                    <div className="text-xs text-gray-500">Technical Lead</div>
                  </td>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      <div className="h-8 bg-gray-100 rounded"></div>
                    </td>
                  ))}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      <div className="h-8 bg-purple-500 rounded flex items-center justify-center text-xs font-semibold text-white">
                        100%
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="text-gray-600">
                  <span className="font-semibold text-gray-900">8 resources</span> · Total capacity:{" "}
                  <span className="font-semibold text-gray-900">420 mandays</span>
                </div>
                <div className="text-gray-500">
                  Data synced from phase and task assignments • Last updated: 2 minutes ago
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-green-600 font-medium">No conflicts detected</div>
                <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium">
                  Export to Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>

      {/* Key Insight */}
      <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Integration Points</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>
              <strong>Same project data:</strong> Phase names, dates, and resources pulled from{" "}
              <code>currentProject</code>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>
              <strong>Automatic sync:</strong> Allocations calculated from{" "}
              <code>phaseResourceAssignments</code> and <code>taskResourceAssignments</code>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>
              <strong>Bidirectional updates:</strong> Edit cells → Updates assignments → Timeline reflects changes
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>
              <strong>Conflict detection:</strong> Real-time analysis across all phases and projects
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 2: DATA MODEL MAPPING - How existing data flows into capacity grid
// ============================================================================

function DataMappingMockup() {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Data Model Integration
        </h2>
        <p className="text-sm text-gray-700">
          How existing <code>GanttProject</code> data structures map to the capacity planning grid.
          No new data model - just a different view of the same data.
        </p>
      </div>

      {/* Mapping Diagram */}
      <MockupSection
        title="Data Flow: Gantt Project → Capacity Grid"
        subtitle="Existing data structures used without modification"
      >
        <div className="grid grid-cols-2 gap-8">
          {/* Left: Existing Data */}
          <div className="border-2 border-gray-300 rounded-lg bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Existing Data (gantt-tool-store-v2)
            </h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-gray-50 border border-gray-200 rounded p-3">
                <div className="text-blue-600 font-semibold mb-2">GanttProject</div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>├─ id: &quot;proj-123&quot;</div>
                  <div>├─ name: &quot;YTL Cement SAP&quot;</div>
                  <div>├─ startDate: &quot;2025-01-06&quot;</div>
                  <div>├─ phases: Phase[]</div>
                  <div>└─ resources: Resource[]</div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-blue-600 font-semibold mb-2">Phase</div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>├─ id: &quot;phase-1&quot;</div>
                  <div>├─ name: &quot;Planning&quot;</div>
                  <div>├─ startDate: &quot;2025-01-06&quot;</div>
                  <div>├─ endDate: &quot;2025-01-31&quot;</div>
                  <div>├─ tasks: Task[]</div>
                  <div className="text-purple-600 font-semibold">
                    └─ phaseResourceAssignments:
                  </div>
                  <div className="pl-5 space-y-1">
                    <div>├─ resourceId: &quot;res-sarah&quot;</div>
                    <div>├─ allocationPercent: 90</div>
                    <div>└─ assignmentNotes: &quot;PM oversight&quot;</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <div className="text-purple-600 font-semibold mb-2">Resource</div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>├─ id: &quot;res-sarah&quot;</div>
                  <div>├─ name: &quot;Sarah Chen&quot;</div>
                  <div>├─ designation: &quot;manager&quot;</div>
                  <div>├─ category: &quot;pm&quot;</div>
                  <div>└─ assignmentLevel: &quot;both&quot;</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Capacity Grid Mapping */}
          <div className="border-2 border-blue-500 rounded-lg bg-white p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Capacity Grid View (Calculated)
            </h3>
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-blue-600 font-semibold mb-2">
                  Calculation Logic
                </div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>1. Get all phases from currentProject</div>
                  <div>2. For each phase:</div>
                  <div className="pl-5">
                    <div>├─ Get start/end dates</div>
                    <div>├─ Calculate week span</div>
                    <div>└─ Extract phaseResourceAssignments</div>
                  </div>
                  <div>3. Spread assignments across weeks</div>
                  <div>4. Generate grid cells</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3">
                <div className="text-green-600 font-semibold mb-2">
                  Grid Cell Structure
                </div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>WeeklyAllocation &#123;</div>
                  <div className="pl-3">
                    <div>resourceId: &quot;res-sarah&quot;</div>
                    <div>phaseId: &quot;phase-1&quot;</div>
                    <div>weekIdentifier: &quot;2025-W01&quot;</div>
                    <div>weekStartDate: &quot;2025-01-06&quot;</div>
                    <div>allocationPercent: 90</div>
                    <div>mandays: 4.5</div>
                    <div>source: &quot;phaseAssignment&quot;</div>
                  </div>
                  <div>&#125;</div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded p-3">
                <div className="text-purple-600 font-semibold mb-2">
                  UI Cell Rendering
                </div>
                <div className="pl-3 space-y-1 text-gray-700">
                  <div>&lt;td&gt;</div>
                  <div className="pl-3">
                    <div>&lt;div</div>
                    <div className="pl-3">
                      <div>className=&quot;cell&quot;</div>
                      <div>backgroundColor=&#123;colorScale[4.5]&#125;</div>
                      <div>onClick=&#123;editAllocation&#125;</div>
                    </div>
                    <div>&gt;</div>
                    <div className="pl-3">90%</div>
                    <div>&lt;/div&gt;</div>
                  </div>
                  <div>&lt;/td&gt;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>

      {/* Code Example */}
      <MockupSection
        title="Implementation Example"
        subtitle="TypeScript code showing actual integration"
      >
        <div className="bg-gray-900 text-gray-100 rounded-lg p-6 font-mono text-xs overflow-x-auto">
          <pre className="whitespace-pre-wrap">{`// In CapacityPlanningView.tsx

interface CapacityGridProps {
  project: GanttProject;
}

function calculateWeeklyAllocations(project: GanttProject): WeeklyAllocation[] {
  const allocations: WeeklyAllocation[] = [];

  // Process each phase
  project.phases.forEach(phase => {
    const weeks = getWeeksInRange(phase.startDate, phase.endDate);

    // Spread phase-level assignments across weeks
    phase.phaseResourceAssignments?.forEach(assignment => {
      weeks.forEach(weekId => {
        allocations.push({
          resourceId: assignment.resourceId,
          phaseId: phase.id,
          weekIdentifier: weekId,
          allocationPercent: assignment.allocationPercent,
          mandays: (assignment.allocationPercent / 100) * 5,
          source: 'phase',
          isManualOverride: false
        });
      });
    });

    // Process task-level assignments
    phase.tasks.forEach(task => {
      const taskWeeks = getWeeksInRange(task.startDate, task.endDate);

      task.resourceAssignments?.forEach(assignment => {
        taskWeeks.forEach(weekId => {
          // Aggregate with existing phase assignments
          const existing = allocations.find(
            a => a.resourceId === assignment.resourceId && a.weekIdentifier === weekId
          );

          if (existing) {
            existing.allocationPercent += assignment.allocationPercent;
            existing.mandays += (assignment.allocationPercent / 100) * 5;
          } else {
            allocations.push({
              resourceId: assignment.resourceId,
              phaseId: phase.id,
              taskId: task.id,
              weekIdentifier: weekId,
              allocationPercent: assignment.allocationPercent,
              mandays: (assignment.allocationPercent / 100) * 5,
              source: 'task',
              isManualOverride: false
            });
          }
        });
      });
    });
  });

  return allocations;
}

// When user edits a cell
function handleCellEdit(
  resourceId: string,
  weekId: string,
  newMandays: number
) {
  const allocation = findAllocation(resourceId, weekId);
  const newPercent = (newMandays / 5) * 100;

  if (allocation.source === 'phase') {
    // Update phase assignment
    updatePhaseResourceAssignment({
      phaseId: allocation.phaseId,
      resourceId,
      allocationPercent: newPercent
    });
  } else {
    // Update task assignment
    updateTaskResourceAssignment({
      taskId: allocation.taskId,
      resourceId,
      allocationPercent: newPercent
    });
  }

  // Mark as manual override
  allocation.isManualOverride = true;

  // Sync to database
  syncAllocations();

  // Detect conflicts
  runConflictDetection();
}

export function CapacityPlanningView({ project }: CapacityGridProps) {
  const allocations = calculateWeeklyAllocations(project);
  const conflicts = detectConflicts(allocations);

  return (
    <div>
      <AllocationGrid
        phases={project.phases}
        resources={project.resources}
        allocations={allocations}
        onCellEdit={handleCellEdit}
      />
      <ConflictPanel conflicts={conflicts} />
    </div>
  );
}`}</pre>
        </div>
      </MockupSection>

      {/* Key Takeaways */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-6 rounded-r">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Critical Implementation Notes</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>No new database tables required:</strong> Use existing <code>phaseResourceAssignments</code> and{" "}
              <code>taskResourceAssignments</code>
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Calculation happens client-side:</strong> Fast, responsive, no API calls for initial render
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Optional: ResourceWeeklyAllocation table</strong> for manual overrides and faster queries
            </span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>
              <strong>Sync strategy:</strong> Edit in capacity → Updates assignment → Timeline reflects immediately
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: INTEGRATED CAPACITY GRID - The actual working view
// ============================================================================

function CapacityGridMockup() {
  return (
    <div className="space-y-8">
      <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Integrated Capacity Grid
        </h2>
        <p className="text-sm text-gray-700">
          Full-screen capacity planning view showing real project data with interactive editing
        </p>
      </div>

      <MockupSection
        title="Full Capacity Planning Interface"
        subtitle="Accessed via /gantt-tool?view=capacity"
      >
        <div className="border-2 border-blue-500 rounded-lg bg-white overflow-hidden">
          {/* Top Toolbar */}
          <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button className="text-sm font-medium hover:text-blue-400 transition-colors">
                ← Timeline View
              </button>
              <div className="h-4 w-px bg-gray-700"></div>
              <div>
                <div className="text-sm font-semibold">YTL Cement SAP Implementation</div>
                <div className="text-xs text-gray-400">Capacity Planning • 26 weeks • 8 resources</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 rounded border border-gray-700">
                Auto-Allocate
              </button>
              <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 rounded">
                View Costing
              </button>
            </div>
          </div>

          {/* Grid Content - Scrollable */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 w-64 sticky left-0 bg-gray-100 z-20">
                    Resource
                  </th>
                  {Array.from({ length: 26 }).map((_, i) => (
                    <th
                      key={i}
                      className="px-2 py-3 text-center text-xs font-medium text-gray-600 min-w-[50px] border-l border-gray-200"
                    >
                      <div className="font-semibold">W{i + 1}</div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {new Date(2025, 0, 6 + i * 7).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 w-24 sticky right-0 bg-gray-100 z-20 border-l-2 border-gray-300">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Phase 1 Header */}
                <tr className="bg-blue-50 border-b border-blue-100">
                  <td
                    colSpan={28}
                    className="px-4 py-2 text-xs font-semibold text-blue-900 sticky left-0"
                  >
                    Phase 1: Planning (W1-W4) • 2 resources
                  </td>
                </tr>

                {/* Sarah Chen - Phase 1 */}
                <tr className="border-b border-gray-100 hover:bg-blue-25 group">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-25 z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        SC
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
                        <div className="text-xs text-gray-500">PM • ABMY</div>
                      </div>
                    </div>
                  </td>
                  {[90, 90, 80, 80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(
                    (percent, i) => (
                      <td key={i} className="px-2 py-3 text-center border-l border-gray-100">
                        {percent > 0 ? (
                          <div
                            className={`h-8 rounded flex items-center justify-center text-xs font-semibold cursor-pointer transition-all hover:ring-2 hover:ring-blue-400 ${
                              percent >= 100
                                ? "bg-red-500 text-white"
                                : percent >= 80
                                ? "bg-blue-500 text-white"
                                : percent >= 60
                                ? "bg-blue-400 text-white"
                                : percent >= 40
                                ? "bg-blue-300 text-gray-900"
                                : "bg-blue-200 text-gray-900"
                            }`}
                          >
                            {percent}%
                          </div>
                        ) : (
                          <div className="h-8 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"></div>
                        )}
                      </td>
                    )
                  )}
                  <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-25 z-10 border-l-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">17d</div>
                  </td>
                </tr>

                {/* Mike Wong - Phase 1 */}
                <tr className="border-b border-gray-200 hover:bg-blue-25 group">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-blue-25 z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        MW
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Mike Wong</div>
                        <div className="text-xs text-gray-500">Architect • ABSG</div>
                      </div>
                    </div>
                  </td>
                  {[50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map(
                    (percent, i) => (
                      <td key={i} className="px-2 py-3 text-center border-l border-gray-100">
                        {percent > 0 ? (
                          <div className="h-8 bg-green-300 rounded flex items-center justify-center text-xs font-semibold text-gray-900 cursor-pointer hover:ring-2 hover:ring-green-400 transition-all">
                            {percent}%
                          </div>
                        ) : (
                          <div className="h-8 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"></div>
                        )}
                      </td>
                    )
                  )}
                  <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-blue-25 z-10 border-l-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">10d</div>
                  </td>
                </tr>

                {/* Phase 2 Header */}
                <tr className="bg-purple-50 border-b border-purple-100">
                  <td
                    colSpan={28}
                    className="px-4 py-2 text-xs font-semibold text-purple-900 sticky left-0"
                  >
                    Phase 2: Development (W5-W18) • 4 resources
                  </td>
                </tr>

                {/* Alex Kumar - Phase 2 */}
                <tr className="border-b border-gray-100 hover:bg-purple-25 group">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-purple-25 z-10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        AK
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Alex Kumar</div>
                        <div className="text-xs text-gray-500">Tech Lead • ABMY</div>
                      </div>
                    </div>
                  </td>
                  {[0, 0, 0, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 0, 0, 0, 0, 0, 0, 0, 0].map(
                    (percent, i) => (
                      <td key={i} className="px-2 py-3 text-center border-l border-gray-100">
                        {percent > 0 ? (
                          <div className="h-8 bg-purple-500 rounded flex items-center justify-center text-xs font-semibold text-white cursor-pointer hover:ring-2 hover:ring-purple-400 transition-all">
                            {percent}%
                          </div>
                        ) : (
                          <div className="h-8 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"></div>
                        )}
                      </td>
                    )
                  )}
                  <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-purple-25 z-10 border-l-2 border-gray-200">
                    <div className="text-sm font-semibold text-gray-900">70d</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-gray-50 border-t-2 border-gray-300 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8 text-xs">
                <div>
                  <span className="text-gray-600">Total Capacity:</span>{" "}
                  <span className="font-semibold text-gray-900">420 mandays</span>
                </div>
                <div>
                  <span className="text-gray-600">Allocated:</span>{" "}
                  <span className="font-semibold text-gray-900">287 mandays (68%)</span>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>{" "}
                  <span className="font-semibold text-green-600">133 mandays (32%)</span>
                </div>
                <div>
                  <span className="text-gray-600">Conflicts:</span>{" "}
                  <span className="font-semibold text-green-600">0</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-xs text-gray-500">Auto-saved 1 min ago</div>
                <button className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50">
                  Export to Excel
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
                  Calculate Costs →
                </button>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>

      {/* Interaction Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cell Interactions</h3>
          <ul className="space-y-3 text-xs text-gray-700">
            <li className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3 text-[10px]">Click</span>
              <span>Open inline editor, type mandays (0-5), press Enter to save</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3 text-[10px]">Hover</span>
              <span>Show tooltip with resource rate, cost, phase/task source</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3 text-[10px]">Drag</span>
              <span>Drag across multiple cells to fill with same allocation</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3 text-[10px]">Cmd+C</span>
              <span>Copy cell value</span>
            </li>
            <li className="flex items-start">
              <span className="font-mono bg-gray-100 px-2 py-1 rounded mr-3 text-[10px]">Cmd+V</span>
              <span>Paste to selected cell(s)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Color Legend</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center">
              <div className="w-8 h-6 bg-gray-50 rounded border border-gray-200 mr-3"></div>
              <span className="text-gray-700">0% - Not allocated</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-6 bg-blue-200 rounded mr-3"></div>
              <span className="text-gray-700">1-40% - Low utilization</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-6 bg-blue-300 rounded mr-3"></div>
              <span className="text-gray-700">41-60% - Medium utilization</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-6 bg-blue-400 rounded mr-3"></div>
              <span className="text-gray-700">61-80% - Good utilization</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-6 bg-blue-500 rounded mr-3"></div>
              <span className="text-gray-700">81-99% - High utilization</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-6 bg-red-500 rounded mr-3"></div>
              <span className="text-gray-700">100%+ - Over-allocated (conflict)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: CONFLICT DETECTION - Real-time conflict identification
// ============================================================================

function ConflictDetectionMockup() {
  return (
    <div className="space-y-8">
      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Intelligent Conflict Detection
        </h2>
        <p className="text-sm text-gray-700">
          Real-time analysis of resource over-allocation across all phases and projects
        </p>
      </div>

      <MockupSection
        title="Conflict Visualization in Grid"
        subtitle="Over-allocated cells highlighted automatically"
      >
        <div className="border-2 border-red-500 rounded-lg bg-white p-6">
          <div className="space-y-4">
            {/* Example: Alex Kumar over-allocated */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Alex Kumar - Week 12 (Over-allocated: 150%)
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 text-xs text-gray-600">Phase 2:</div>
                <div className="h-10 w-20 bg-purple-500 rounded flex items-center justify-center text-xs font-semibold text-white">
                  100%
                </div>
                <div className="text-xs text-gray-500">+</div>
                <div className="w-16 text-xs text-gray-600">Task 2.3:</div>
                <div className="h-10 w-20 bg-purple-400 rounded flex items-center justify-center text-xs font-semibold text-white">
                  50%
                </div>
                <div className="text-xs text-gray-500">=</div>
                <div className="h-10 w-20 bg-red-600 rounded flex items-center justify-center text-xs font-semibold text-white ring-4 ring-red-300 animate-pulse">
                  150%
                </div>
                <div className="ml-4 bg-red-100 border border-red-300 rounded px-3 py-2 text-xs text-red-900">
                  <div className="font-semibold">CRITICAL</div>
                  <div>Over by 2.5 mandays</div>
                </div>
              </div>
            </div>

            {/* Example: Sarah Chen warning */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Sarah Chen - Week 1 (High utilization: 90%)
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-16 text-xs text-gray-600">Phase 1:</div>
                <div className="h-10 w-20 bg-blue-500 rounded flex items-center justify-center text-xs font-semibold text-white">
                  90%
                </div>
                <div className="text-xs text-gray-500">=</div>
                <div className="h-10 w-20 bg-amber-500 rounded flex items-center justify-center text-xs font-semibold text-white ring-2 ring-amber-300">
                  90%
                </div>
                <div className="ml-4 bg-amber-100 border border-amber-300 rounded px-3 py-2 text-xs text-amber-900">
                  <div className="font-semibold">WARNING</div>
                  <div>Approaching capacity</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>

      <MockupSection
        title="Conflict Panel (VS Code Style)"
        subtitle="Dedicated panel showing all conflicts with resolution actions"
      >
        <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
          {/* Panel Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-xs font-semibold text-gray-900">
                Problems (3)
              </h3>
              <div className="flex space-x-3 text-xs">
                <button className="text-red-600 font-medium">Errors (2)</button>
                <button className="text-amber-600 font-medium">Warnings (1)</button>
              </div>
            </div>
            <button className="text-xs text-gray-500 hover:text-gray-700">Clear All</button>
          </div>

          {/* Conflict List */}
          <div className="divide-y divide-gray-100">
            {/* Error 1 */}
            <div className="px-4 py-3 hover:bg-red-25 cursor-pointer transition-colors">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mt-0.5 flex-shrink-0">
                  E
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    Over-allocation: Alex Kumar
                  </div>
                  <div className="text-xs text-gray-600">
                    Allocated 150% in W12 (Phase 2: 100% + Task 2.3: 50%). Exceeds maximum capacity by 2.5 mandays.
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700">
                      Resolve
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50">
                      Reassign Task
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50">
                      Reduce Phase %
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Source: Phase 2 assignment • W12 • Line 42
                  </div>
                </div>
              </div>
            </div>

            {/* Error 2 */}
            <div className="px-4 py-3 hover:bg-red-25 cursor-pointer transition-colors">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold mt-0.5 flex-shrink-0">
                  E
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    Cross-project conflict: Jane Lee
                  </div>
                  <div className="text-xs text-gray-600">
                    Allocated to 2 projects in W15 (YTL Cement: 80% + Petronas S/4: 70%). Total: 150%.
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700">
                      View Projects
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50">
                      Reduce Allocation
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Detected across projects • W15
                  </div>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="px-4 py-3 hover:bg-amber-25 cursor-pointer transition-colors">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mt-0.5 flex-shrink-0">
                  W
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    High utilization: Sarah Chen
                  </div>
                  <div className="text-xs text-gray-600">
                    Allocated 90% in W1-W4 (approaching 100% capacity). Consider buffer for unexpected work.
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50">
                      Adjust Allocation
                    </button>
                    <button className="px-2 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-gray-50">
                      Ignore
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Phase 1 assignment • W1-W4 • Line 15
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>
    </div>
  );
}

// ============================================================================
// TAB 5: RESPONSIVE DESIGN - Multi-device adaptation
// ============================================================================

function ResponsiveDesignMockup() {
  return (
    <div className="space-y-8">
      <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-r">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Responsive Adaptation Strategy
        </h2>
        <p className="text-sm text-gray-700">
          Different layouts optimized for each device class - not just scaling down
        </p>
      </div>

      {/* Desktop */}
      <MockupSection
        title="Desktop (1920px+)"
        subtitle="Full grid with all weeks visible, side-by-side views"
      >
        <div className="border-2 border-gray-300 rounded-lg bg-gray-100 p-4">
          <div className="text-xs text-gray-600 mb-2">Full capacity grid - 26 weeks visible</div>
          <div className="h-64 bg-white rounded border border-gray-200 flex items-center justify-center text-sm text-gray-500">
            [Same as Tab 3 - Full grid with horizontal scroll]
          </div>
        </div>
      </MockupSection>

      {/* Tablet */}
      <MockupSection
        title="Tablet (768px - 1279px)"
        subtitle="Condensed grid, 8 weeks visible, horizontal scroll"
      >
        <div className="border-2 border-gray-300 rounded-lg bg-gray-100 p-4 max-w-3xl mx-auto">
          <div className="text-xs text-gray-600 mb-2">Condensed view - swipe to see more weeks</div>
          <div className="h-96 bg-white rounded border border-gray-200 p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left w-32">Resource</th>
                  <th className="px-1 py-2 text-center">W1</th>
                  <th className="px-1 py-2 text-center">W2</th>
                  <th className="px-1 py-2 text-center">W3</th>
                  <th className="px-1 py-2 text-center">W4</th>
                  <th className="px-1 py-2 text-center">W5</th>
                  <th className="px-1 py-2 text-center">W6</th>
                  <th className="px-1 py-2 text-center">W7</th>
                  <th className="px-1 py-2 text-center">W8</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-200">
                  <td className="px-2 py-2">
                    <div className="font-medium text-gray-900">Sarah Chen</div>
                    <div className="text-[10px] text-gray-500">PM</div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-blue-400 rounded text-white flex items-center justify-center font-semibold text-[10px]">
                      90
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-blue-400 rounded text-white flex items-center justify-center font-semibold text-[10px]">
                      90
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-blue-400 rounded text-white flex items-center justify-center font-semibold text-[10px]">
                      80
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-blue-400 rounded text-white flex items-center justify-center font-semibold text-[10px]">
                      80
                    </div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </td>
                  <td className="px-1 py-2">
                    <div className="h-6 bg-gray-100 rounded"></div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
              Swipe left/right to see more weeks →
            </div>
          </div>
        </div>
      </MockupSection>

      {/* Mobile */}
      <MockupSection
        title="Mobile (320px - 767px)"
        subtitle="Card-based weekly view, vertical scroll, simplified editing"
      >
        <div className="border-2 border-gray-300 rounded-lg bg-gray-100 p-4 max-w-sm mx-auto">
          <div className="text-xs text-gray-600 mb-2">Card-based view - tap to edit</div>
          <div className="bg-white rounded border border-gray-200 p-3 space-y-3">
            {/* Week selector */}
            <div className="flex items-center justify-between bg-gray-50 rounded p-2">
              <button className="text-xs text-gray-600">← W1</button>
              <div className="text-sm font-semibold text-gray-900">Week 2 (Jan 13-19)</div>
              <button className="text-xs text-gray-600">W3 →</button>
            </div>

            {/* Resource cards */}
            <div className="space-y-2">
              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Sarah Chen</div>
                    <div className="text-xs text-gray-500">Project Manager • Phase 1</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    90%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Mandays:</span>
                  <span className="font-semibold text-gray-900">4.5 / 5.0</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: "90%" }}></div>
                </div>
                <button className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">
                  Edit Allocation
                </button>
              </div>

              <div className="border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Mike Wong</div>
                    <div className="text-xs text-gray-500">Architect • Phase 1</div>
                  </div>
                  <div className="w-12 h-12 bg-green-300 rounded-full flex items-center justify-center text-gray-900 text-xs font-semibold">
                    50%
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Mandays:</span>
                  <span className="font-semibold text-gray-900">2.5 / 5.0</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "50%" }}></div>
                </div>
                <button className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-gray-50">
                  Edit Allocation
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600">Week Total:</span>
                <span className="font-semibold text-gray-900">7.0 / 10.0 mandays</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Utilization:</span>
                <span className="font-semibold text-gray-900">70%</span>
              </div>
            </div>
          </div>
        </div>
      </MockupSection>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function MockupSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
