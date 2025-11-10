"use client";

/**
 * Phase 4 Test Page - Resource Control Center
 *
 * Ultra kiasu testing page for validating all Phase 4 UI changes:
 * 1. Header metrics (5 not 7)
 * 2. View toggles (SF segmented control)
 * 3. Category pills (SF Symbols, no emoji)
 * 4. Search bar (gray background, no border)
 * 5. Resource rows (64px height, avatars, no emoji)
 */

import { useState } from "react";
import { ResourceManagementModal } from "@/components/gantt-tool/ResourceManagementModal";
import { useGanttToolStoreV2 } from "@/stores/gantt-tool-store-v2";
import type { GanttProject } from "@/types/gantt-tool";

export default function TestResourceControlPage() {
  const [showModal, setShowModal] = useState(false);
  const { setCurrentProject } = useGanttToolStoreV2();

  const loadTestProject = () => {
    // Create comprehensive test project with diverse resources
    const testProject: GanttProject = {
      id: "test-resource-control-project",
      name: "Resource Control Test Project",
      description: "Test project for Phase 4 validation",
      startDate: "2025-01-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // 24 diverse resources across all categories
      resources: [
        // Leadership (2 resources) - star.fill icon
        {
          id: "res-1",
          name: "Sarah Chen",
          description: "VP of Engineering",
          category: "leadership",
          designation: "principal",
          costPerHour: 250,
          chargeRatePerHour: 400,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-2",
          name: "Michael Torres",
          description: "Chief Technology Officer",
          category: "leadership",
          designation: "director",
          costPerHour: 220,
          chargeRatePerHour: 350,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Project Management (3 resources) - person.2.fill icon
        {
          id: "res-3",
          name: "Jennifer Wu",
          description: "Senior Project Manager",
          category: "pm",
          designation: "senior_manager",
          costPerHour: 180,
          chargeRatePerHour: 280,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-4",
          name: "David Kim",
          description: "Project Manager",
          category: "pm",
          designation: "manager",
          costPerHour: 140,
          chargeRatePerHour: 220,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-5",
          name: "Lisa Anderson",
          description: "Associate PM",
          category: "pm",
          designation: "senior_consultant",
          costPerHour: 90,
          chargeRatePerHour: 150,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Functional (4 resources) - slider.horizontal.3 icon
        {
          id: "res-6",
          name: "Robert Martinez",
          description: "Senior Functional Consultant",
          category: "functional",
          designation: "senior_consultant",
          costPerHour: 95,
          chargeRatePerHour: 160,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-7",
          name: "Emily Johnson",
          description: "Functional Consultant",
          category: "functional",
          designation: "consultant",
          costPerHour: 75,
          chargeRatePerHour: 130,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-8",
          name: "James Lee",
          description: "Business Analyst",
          category: "functional",
          designation: "analyst",
          costPerHour: 65,
          chargeRatePerHour: 110,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-9",
          name: "Maria Garcia",
          description: "Finance Specialist",
          category: "functional",
          designation: "consultant",
          costPerHour: 75,
          chargeRatePerHour: 130,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Technical (5 resources) - hammer.fill icon
        {
          id: "res-10",
          name: "Alex Thompson",
          description: "Lead Technical Architect",
          category: "technical",
          designation: "senior_manager",
          costPerHour: 185,
          chargeRatePerHour: 290,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-11",
          name: "Priya Patel",
          description: "Senior Developer",
          category: "technical",
          designation: "senior_consultant",
          costPerHour: 100,
          chargeRatePerHour: 170,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-12",
          name: "Marcus Brown",
          description: "Full Stack Developer",
          category: "technical",
          designation: "consultant",
          costPerHour: 80,
          chargeRatePerHour: 140,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-13",
          name: "Nina Kowalski",
          description: "Frontend Developer",
          category: "technical",
          designation: "consultant",
          costPerHour: 78,
          chargeRatePerHour: 135,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-14",
          name: "Tom Wilson",
          description: "DevOps Engineer",
          category: "technical",
          designation: "senior_consultant",
          costPerHour: 95,
          chargeRatePerHour: 165,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Security & Authorization (2 resources) - lock.shield.fill icon
        {
          id: "res-15",
          name: "Rachel Green",
          description: "Security Architect",
          category: "security",
          designation: "senior_manager",
          costPerHour: 190,
          chargeRatePerHour: 300,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-16",
          name: "Chris Evans",
          description: "Security Consultant",
          category: "security",
          designation: "consultant",
          costPerHour: 85,
          chargeRatePerHour: 145,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Quality Assurance (3 resources) - checkmark.shield.fill icon
        {
          id: "res-17",
          name: "Amanda Rodriguez",
          description: "QA Lead",
          category: "qa",
          designation: "senior_consultant",
          costPerHour: 92,
          chargeRatePerHour: 155,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-18",
          name: "Kevin Nguyen",
          description: "QA Engineer",
          category: "qa",
          designation: "consultant",
          costPerHour: 72,
          chargeRatePerHour: 125,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-19",
          name: "Sophie Turner",
          description: "Test Automation Specialist",
          category: "qa",
          designation: "consultant",
          costPerHour: 75,
          chargeRatePerHour: 130,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Basis/Infrastructure (2 resources) - server.rack icon
        {
          id: "res-20",
          name: "Daniel Park",
          description: "Infrastructure Lead",
          category: "basis",
          designation: "senior_manager",
          costPerHour: 175,
          chargeRatePerHour: 275,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-21",
          name: "Laura Mitchell",
          description: "Systems Administrator",
          category: "basis",
          designation: "consultant",
          costPerHour: 70,
          chargeRatePerHour: 120,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Change Management (2 resources) - arrow.triangle.2.circlepath icon
        {
          id: "res-22",
          name: "Brian Foster",
          description: "Change Management Lead",
          category: "change",
          designation: "manager",
          costPerHour: 145,
          chargeRatePerHour: 230,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
        {
          id: "res-23",
          name: "Catherine Wong",
          description: "Training Specialist",
          category: "change",
          designation: "consultant",
          costPerHour: 68,
          chargeRatePerHour: 115,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Other/General (1 resource) - person.fill icon
        {
          id: "res-24",
          name: "Sam Taylor",
          description: "Administrative Coordinator",
          category: "other",
          designation: "analyst",
          costPerHour: 55,
          chargeRatePerHour: 95,
          isBillable: false,
          availability: 40,
          assignmentLevel: "both",
        },

        // Edge Cases for Testing
        // Single-word name (tests avatar initials)
        {
          id: "res-25",
          name: "Madonna",
          description: "Consultant",
          category: "functional",
          designation: "consultant",
          costPerHour: 75,
          chargeRatePerHour: 130,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Hyphenated name (tests avatar initials)
        {
          id: "res-26",
          name: "Jean-Claude Van Damme",
          description: "Security Specialist",
          category: "security",
          designation: "consultant",
          costPerHour: 80,
          chargeRatePerHour: 140,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },

        // Very long name (tests truncation)
        {
          id: "res-27",
          name: "Dr. Alexander Maximilian Winchester III",
          description: "Technical Architect with very long title that should truncate",
          category: "technical",
          designation: "principal",
          costPerHour: 250,
          chargeRatePerHour: 400,
          isBillable: true,
          availability: 40,
          assignmentLevel: "both",
        },
      ],

      // 5 phases with diverse assignments
      phases: [
        {
          id: "phase-1",
          name: "Discovery & Planning",
          description: "Initial discovery phase",
          color: "#3B82F6",
          startDate: "2025-01-01",
          endDate: "2025-02-15",
          collapsed: false,
          dependencies: [],
          order: 0,
          tasks: [
            {
              id: "task-1-1",
              phaseId: "phase-1",
              name: "Requirements Gathering",
              description: "Gather requirements",
              startDate: "2025-01-01",
              endDate: "2025-01-20",
              dependencies: [],
              progress: 100,
              order: 0,
              level: 0,
              collapsed: false,
              isParent: false,
              // Multiple resources assigned to same task (creates conflicts)
              resourceAssignments: [
                { resourceId: "res-3", allocationPercentage: 100 }, // Jennifer Wu
                { resourceId: "res-6", allocationPercentage: 100 }, // Robert Martinez
                { resourceId: "res-7", allocationPercentage: 80 },  // Emily Johnson
              ],
            },
            {
              id: "task-1-2",
              phaseId: "phase-1",
              name: "Stakeholder Interviews",
              description: "Interview stakeholders",
              startDate: "2025-01-05",
              endDate: "2025-01-25",
              dependencies: [],
              progress: 100,
              order: 1,
              level: 0,
              collapsed: false,
              isParent: false,
              // Overlapping with task-1-1 (creates conflicts)
              resourceAssignments: [
                { resourceId: "res-3", allocationPercentage: 80 }, // Jennifer Wu (CONFLICT)
                { resourceId: "res-8", allocationPercentage: 100 }, // James Lee
              ],
            },
            {
              id: "task-1-3",
              phaseId: "phase-1",
              name: "Project Charter",
              description: "Create project charter",
              startDate: "2025-01-25",
              endDate: "2025-02-15",
              dependencies: ["task-1-1", "task-1-2"],
              progress: 80,
              order: 2,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-1", allocationPercentage: 50 }, // Sarah Chen
                { resourceId: "res-4", allocationPercentage: 100 }, // David Kim
              ],
            },
          ],
          phaseResourceAssignments: [
            { resourceId: "res-1", hours: 80 },  // Sarah Chen (phase oversight)
            { resourceId: "res-2", hours: 40 },  // Michael Torres (phase oversight)
          ],
          order: 0,
        },

        {
          id: "phase-2",
          name: "Architecture Design",
          description: "System architecture design",
          color: "#8B5CF6",
          startDate: "2025-02-15",
          endDate: "2025-04-01",
          collapsed: false,
          dependencies: ["phase-1"],
          order: 1,
          tasks: [
            {
              id: "task-2-1",
              phaseId: "phase-2",
              name: "Technical Architecture",
              description: "Design technical architecture",
              startDate: "2025-02-15",
              endDate: "2025-03-15",
              dependencies: [],
              progress: 60,
              order: 0,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-10", allocationPercentage: 100 }, // Alex Thompson
                { resourceId: "res-11", allocationPercentage: 80 },  // Priya Patel
                { resourceId: "res-14", allocationPercentage: 60 },  // Tom Wilson
              ],
            },
            {
              id: "task-2-2",
              phaseId: "phase-2",
              name: "Security Design",
              description: "Design security architecture",
              startDate: "2025-02-20",
              endDate: "2025-03-20",
              dependencies: [],
              progress: 50,
              order: 1,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-15", allocationPercentage: 100 }, // Rachel Green
                { resourceId: "res-16", allocationPercentage: 80 },  // Chris Evans
              ],
            },
            {
              id: "task-2-3",
              phaseId: "phase-2",
              name: "Infrastructure Planning",
              description: "Plan infrastructure",
              startDate: "2025-03-01",
              endDate: "2025-04-01",
              dependencies: ["task-2-1"],
              progress: 30,
              order: 2,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-20", allocationPercentage: 100 }, // Daniel Park
                { resourceId: "res-21", allocationPercentage: 100 }, // Laura Mitchell
              ],
            },
          ],
          phaseResourceAssignments: [
            { resourceId: "res-10", hours: 120 }, // Alex Thompson (phase oversight)
          ],
          order: 1,
        },

        {
          id: "phase-3",
          name: "Development",
          description: "Core development phase",
          color: "#10B981",
          startDate: "2025-04-01",
          endDate: "2025-07-01",
          collapsed: false,
          dependencies: ["phase-2"],
          order: 2,
          tasks: [
            {
              id: "task-3-1",
              phaseId: "phase-3",
              name: "Backend Development",
              description: "Develop backend services",
              startDate: "2025-04-01",
              endDate: "2025-06-01",
              dependencies: [],
              progress: 0,
              order: 0,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-11", allocationPercentage: 100 }, // Priya Patel
                { resourceId: "res-12", allocationPercentage: 100 }, // Marcus Brown
              ],
            },
            {
              id: "task-3-2",
              phaseId: "phase-3",
              name: "Frontend Development",
              description: "Develop frontend",
              startDate: "2025-04-15",
              endDate: "2025-06-15",
              dependencies: [],
              progress: 0,
              order: 1,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-13", allocationPercentage: 100 }, // Nina Kowalski
              ],
            },
          ],
          phaseResourceAssignments: [
            { resourceId: "res-4", hours: 200 }, // David Kim (phase management)
          ],
          order: 2,
        },

        {
          id: "phase-4",
          name: "Testing & QA",
          description: "Quality assurance phase",
          color: "#F59E0B",
          startDate: "2025-06-01",
          endDate: "2025-07-15",
          collapsed: false,
          dependencies: ["phase-3"],
          order: 3,
          tasks: [
            {
              id: "task-4-1",
              phaseId: "phase-4",
              name: "Integration Testing",
              description: "Test integrations",
              startDate: "2025-06-01",
              endDate: "2025-06-30",
              dependencies: [],
              progress: 0,
              order: 0,
              level: 0,
              collapsed: false,
              isParent: false,
              resourceAssignments: [
                { resourceId: "res-17", allocationPercentage: 100 }, // Amanda Rodriguez
                { resourceId: "res-18", allocationPercentage: 100 }, // Kevin Nguyen
                { resourceId: "res-19", allocationPercentage: 80 },  // Sophie Turner
              ],
            },
          ],
          phaseResourceAssignments: [
            { resourceId: "res-17", hours: 160 }, // Amanda Rodriguez (phase oversight)
          ],
          order: 3,
        },

        {
          id: "phase-5",
          name: "Deployment",
          description: "Go-live and deployment",
          color: "#EF4444",
          startDate: "2025-07-15",
          endDate: "2025-08-01",
          collapsed: false,
          dependencies: ["phase-4"],
          order: 4,
          tasks: [],
          phaseResourceAssignments: [
            { resourceId: "res-1", hours: 40 },  // Sarah Chen
            { resourceId: "res-10", hours: 80 }, // Alex Thompson
            { resourceId: "res-20", hours: 120 }, // Daniel Park
          ],
          order: 4,
        },
      ],

      milestones: [],
      holidays: [],

      viewSettings: {
        zoomLevel: "day",
        showWeekends: true,
        showHolidays: true,
        showMilestones: true,
        showTaskDependencies: true,
        showCriticalPath: false,
      },

      budget: {
        totalBudget: 500000,
        contingencyPercentage: 15,
      },
    };

    setCurrentProject(testProject);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Phase 4 Test Page
            </h1>
            <p className="text-lg text-gray-600">
              Resource Control Center - Ultra Kiasu Testing
            </p>
          </div>

          <div className="space-y-6">
            {/* Test Project Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">
                Test Project Specifications
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Resources:</span>
                  <span className="ml-2 text-blue-700">27 total (including edge cases)</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Categories:</span>
                  <span className="ml-2 text-blue-700">All 9 categories represented</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Phases:</span>
                  <span className="ml-2 text-blue-700">5 phases with tasks</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Conflicts:</span>
                  <span className="ml-2 text-blue-700">Multiple intentional conflicts</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Edge Cases:</span>
                  <span className="ml-2 text-blue-700">Single-word names, hyphens, long names</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Budget:</span>
                  <span className="ml-2 text-blue-700">$500,000 with 15% contingency</span>
                </div>
              </div>
            </div>

            {/* What to Test */}
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                🎯 What to Test (All 5 Components)
              </h2>
              <div className="space-y-4 text-sm text-green-800">
                <div>
                  <span className="font-bold">1. Header Metrics:</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>Only 5 metrics show (not 7): Resources, Active Assignments, Conflicts, Unassigned, Utilization</li>
                    <li>Dividers visible between metrics (1px gray lines)</li>
                    <li>Conflicts/Unassigned show orange when >0</li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold">2. View Toggles:</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>Selected button is WHITE with shadow (not colored blue/purple/green)</li>
                    <li>SF Symbol icons display (grid, calendar, layers)</li>
                    <li>Unselected buttons have 60% opacity</li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold">3. Category Pills:</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>NO emoji icons (all replaced with SF Symbols)</li>
                    <li>Pills have rounded pill shape (32px height)</li>
                    <li>Selected pill is blue, unselected is white with border</li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold">4. Search Bar:</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>Gray background (not white)</li>
                    <li>NO border in default state</li>
                    <li>Blue ring on focus</li>
                  </ul>
                </div>
                <div>
                  <span className="font-bold">5. Resource Rows:</span>
                  <ul className="ml-6 mt-1 list-disc">
                    <li>Rows feel taller (~64px not ~56px)</li>
                    <li>Avatar circles with initials (NO emoji)</li>
                    <li>CONFLICT badge is clean text (no emoji/icon)</li>
                    <li>Edit/delete icons are subtle SF Symbols</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Edge Cases to Verify */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                🔍 Edge Cases Included
              </h2>
              <ul className="space-y-2 text-sm text-purple-800 list-disc ml-6">
                <li><span className="font-bold">"Madonna"</span> - Single-word name (tests avatar initials: should show "M")</li>
                <li><span className="font-bold">"Jean-Claude Van Damme"</span> - Hyphenated name (tests initials: should show "JV")</li>
                <li><span className="font-bold">"Dr. Alexander Maximilian Winchester III"</span> - Very long name (tests truncation)</li>
                <li><span className="font-bold">Overlapping assignments</span> - Jennifer Wu has conflicts (2 tasks same time)</li>
                <li><span className="font-bold">All 9 categories</span> - Each should show different SF Symbol</li>
              </ul>
            </div>

            {/* Launch Button */}
            <button
              onClick={loadTestProject}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all text-xl"
            >
              🚀 Load Test Project & Open Resource Control Center
            </button>

            {/* Instructions */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">
                📋 Testing Instructions
              </h2>
              <ol className="space-y-2 text-sm text-yellow-800 list-decimal ml-6">
                <li>Click the button above to load test project and open modal</li>
                <li>Verify all 5 component changes listed in "What to Test"</li>
                <li>Test interactions: view switching, filtering, search, expand/collapse</li>
                <li>Verify edge cases work correctly</li>
                <li>Check for any visual bugs or misalignments</li>
                <li>Report findings in PHASE4_TEST_RESULTS.md</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Management Modal */}
      {showModal && (
        <ResourceManagementModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
