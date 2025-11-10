"use client";

/**
 * Test Page for AeroTimeline Component
 * Comprehensive testing of Phase 2 Gantt Chart refinements
 */

import React from "react";
import { AeroTimeline } from "@/app/_components/timeline/AeroTimeline";
import { TimelinePhase } from "@/app/_components/timeline/types";

export default function TestTimelinePage() {
  // Sample phases with diverse data for comprehensive testing
  const samplePhases: TimelinePhase[] = [
    // Not Started - Gray
    {
      id: "phase-1",
      name: "User Requirements Study",
      startBD: 0,
      durationBD: 18, // 18 business days (~4 weeks)
      status: "not_started",
      progress: 0,
      assignees: ["JD", "SM", "RK"],
      notes: "Initial requirements gathering",
    },

    // In Progress - Blue
    {
      id: "phase-2",
      name: "Requirements Validation",
      startBD: 18,
      durationBD: 26, // 26 business days (~5 weeks)
      status: "in_progress",
      progress: 45,
      assignees: ["AM", "TP", "LW", "MH"],
      notes: "Currently validating with stakeholders",
    },

    // At Risk - Orange
    {
      id: "phase-3",
      name: "Integration and Data Design",
      startBD: 44,
      durationBD: 16, // 16 business days (~3 weeks)
      status: "at_risk",
      progress: 20,
      assignees: ["BC", "DF", "GH", "IJ", "KL", "MN"], // 6 assignees to test overflow
      notes: "Behind schedule, needs attention",
      critical: true,
    },

    // Complete - Green
    {
      id: "phase-4",
      name: "Localization and Documentation",
      startBD: 60,
      durationBD: 92, // 92 business days (~4.5 months)
      status: "complete",
      progress: 100,
      assignees: ["XY", "ZA"],
      notes: "Successfully completed ahead of schedule",
    },

    // Short task (5 days) - should show "5 days"
    {
      id: "phase-5",
      name: "Security Audit",
      startBD: 152,
      durationBD: 5,
      status: "in_progress",
      progress: 60,
      assignees: ["SA"],
    },

    // Single day task - should show "1 day"
    {
      id: "phase-6",
      name: "Deploy to Staging",
      startBD: 157,
      durationBD: 1,
      status: "not_started",
      progress: 0,
      assignees: ["DO"],
    },

    // Long task (200 days) - should show months
    {
      id: "phase-7",
      name: "Enterprise Implementation Rollout",
      startBD: 158,
      durationBD: 200, // ~10 months
      status: "in_progress",
      progress: 15,
      assignees: ["PM", "TL", "AR", "BS", "CT", "DU", "EV", "FW", "GX", "HY", "IZ"], // 11 assignees - test overflow +8
    },

    // Task with no assignees - test empty state
    {
      id: "phase-8",
      name: "Automated Testing Setup",
      startBD: 358,
      durationBD: 10,
      status: "not_started",
      progress: 0,
      assignees: [],
    },

    // Task with baseline (for future testing)
    {
      id: "phase-9",
      name: "Performance Optimization",
      startBD: 368,
      durationBD: 15,
      status: "in_progress",
      progress: 30,
      assignees: ["PO"],
      baseline: {
        startBD: 368,
        durationBD: 20, // Was planned for 20 days, now 15 (ahead of schedule)
      },
    },

    // Task derived from progress (no explicit status)
    {
      id: "phase-10",
      name: "Code Review Process",
      startBD: 383,
      durationBD: 8,
      progress: 100, // Should auto-derive status: "complete"
      assignees: ["CR", "QA"],
    },

    // Long name to test truncation
    {
      id: "phase-11",
      name: "Comprehensive End-to-End Integration Testing with External Third-Party API Systems",
      startBD: 391,
      durationBD: 25,
      status: "at_risk",
      progress: 10,
      assignees: ["QA", "DE", "IT"],
    },
  ];

  const startDateISO = "2026-01-05"; // Monday, Jan 5, 2026
  const holidays = ["2026-01-01", "2026-07-04", "2026-12-25"]; // Some sample holidays

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)] p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <h1 className="text-[var(--text-display-large)] font-semibold text-[var(--ink)] mb-2">
          Phase 2 Testing: Gantt Chart Refinement
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-gray-1)]">
          Comprehensive test page for AeroTimeline component with diverse sample data.
          Testing all status colors, icons, durations, assignees, and interaction states.
        </p>
      </div>

      {/* Test Instructions */}
      <div className="max-w-[1600px] mx-auto mb-6 p-6 bg-white rounded-[var(--radius-md)] border border-[var(--color-gray-4)]">
        <h2 className="text-[var(--text-display-small)] font-semibold text-[var(--ink)] mb-4">
          Testing Checklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-[var(--text-body)] font-medium text-[var(--ink)] mb-2">
              Visual Elements
            </h3>
            <ul className="text-[var(--text-body)] text-[var(--color-gray-1)] space-y-1">
              <li>✓ Timeline header shows quarter labels (Q1 '26, Q2 '26, etc.)</li>
              <li>✓ Task bars are 32px height (not 14px)</li>
              <li>✓ Gray bars for "not_started" status</li>
              <li>✓ Blue bars for "in_progress" status</li>
              <li>✓ Orange bars for "at_risk" status</li>
              <li>✓ Green bars for "complete" status</li>
              <li>✓ Status icons visible (Circle/Clock/Alert/Check)</li>
              <li>✓ Resource avatars show up to 3 + overflow</li>
              <li>✓ Duration text formats correctly</li>
            </ul>
          </div>
          <div>
            <h3 className="text-[var(--text-body)] font-medium text-[var(--ink)] mb-2">
              Interactions
            </h3>
            <ul className="text-[var(--text-body)] text-[var(--color-gray-1)] space-y-1">
              <li>✓ Hover over task bars - brightness increases</li>
              <li>✓ Click task bar - focus ring appears</li>
              <li>✓ Tab navigation works</li>
              <li>✓ Enter key activates selection</li>
              <li>✓ Switch view modes (Week/Month/Quarter)</li>
              <li>✓ Header updates with view mode</li>
              <li>✓ Narrow bars hide content gracefully</li>
              <li>✓ Wide bars show all content</li>
              <li>✓ No console errors</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sample Data Info */}
      <div className="max-w-[1600px] mx-auto mb-6 p-4 bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-gray-4)]">
        <h3 className="text-[var(--text-body)] font-medium text-[var(--ink)] mb-2">
          Sample Data ({samplePhases.length} phases)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[var(--text-detail)]">
          <div>
            <span className="text-[var(--color-gray-1)]">Not Started:</span>{" "}
            <span className="text-[var(--ink)]">
              {samplePhases.filter(p => p.status === "not_started" || (!p.status && !p.progress)).length}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-blue)]">In Progress:</span>{" "}
            <span className="text-[var(--ink)]">
              {samplePhases.filter(p => p.status === "in_progress" || (!p.status && p.progress && p.progress > 0 && p.progress < 100)).length}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-orange)]">At Risk:</span>{" "}
            <span className="text-[var(--ink)]">
              {samplePhases.filter(p => p.status === "at_risk").length}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-green)]">Complete:</span>{" "}
            <span className="text-[var(--ink)]">
              {samplePhases.filter(p => p.status === "complete" || (!p.status && p.progress === 100)).length}
            </span>
          </div>
        </div>
      </div>

      {/* AeroTimeline Component */}
      <div className="max-w-[1600px] mx-auto">
        <AeroTimeline
          startDateISO={startDateISO}
          phases={samplePhases}
          holidays={holidays}
          onPhaseClick={(phase) => {
            console.log("Phase clicked:", phase);
            alert(`Phase clicked: ${phase.name}\nStatus: ${phase.status}\nProgress: ${phase.progress}%`);
          }}
        />
      </div>

      {/* Console Log Helper */}
      <div className="max-w-[1600px] mx-auto mt-6 p-4 bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-gray-4)]">
        <h3 className="text-[var(--text-body)] font-medium text-[var(--ink)] mb-2">
          Browser Console Check
        </h3>
        <p className="text-[var(--text-detail)] text-[var(--color-gray-1)]">
          Open browser DevTools (F12) and check Console tab for any errors or warnings.
          Should see: "Phase clicked: [name]" when clicking task bars.
        </p>
      </div>
    </div>
  );
}
