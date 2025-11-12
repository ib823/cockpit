"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Alert, Space, Statistic, Row, Col } from "antd";
import { RocketOutlined, CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import { useGanttToolStore } from "@/stores/gantt-tool-store-v2";

// LPPSA Project Data - Using EXACT dates from user
const lppsaProjectData = {
  id: `project-lppsa-${Date.now()}`,
  name: "LPPSA SAP S/4HANA Implementation",
  description:
    "Dual-track SAP S/4HANA implementation project covering technical conversion and new module implementations",
  startDate: "2026-02-02",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  viewSettings: {
    zoomLevel: "week" as const,
    showWeekends: true,
    showHolidays: true,
    showMilestones: true,
    showTaskDependencies: false,
    showCriticalPath: false,
  },
  holidays: [],
  resources: [],
  phases: [
    {
      id: "phase-track-a",
      name: "Track A - Technical Conversion",
      description:
        "Technical Conversion, Remediation, Mandatory Fiori App to replace obsolete transactions",
      color: "#3B82F6",
      startDate: "2026-02-02",
      endDate: "2026-07-31",
      collapsed: false,
      dependencies: [],
      tasks: [
        {
          id: "task-a-1",
          phaseId: "phase-track-a",
          name: "Project Initiation",
          description:
            "Complete contractual formalities (sign/return LOA, execution bonds, agreement docs), hold the project kick-off, and issue documented minutes.",
          startDate: "2026-02-02",
          endDate: "2026-03-27",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-2",
          phaseId: "phase-track-a",
          name: "Establish project governance for migration of SAP ECC to SAP S/4HANA",
          description:
            "Define scope, objectives, and project plan/charter; form the project team and governance (e.g., Steering Committee).",
          startDate: "2026-02-02",
          endDate: "2026-02-27",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-3",
          phaseId: "phase-track-a",
          name: "System Planning and Assessment",
          description:
            "Assess the current ECC landscape, check custom code via SAP Readiness Check, plan the RISE with SAP landscape, and draft the system conversion roadmap.",
          startDate: "2026-02-02",
          endDate: "2026-03-06",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-4",
          phaseId: "phase-track-a",
          name: "Pre-Conversion Activities",
          description:
            "Validate add-ons/components with Maintenance Planner; generate and prepare SIC for DEV, QAS, and PRD.",
          startDate: "2026-03-02",
          endDate: "2026-03-27",
          dependencies: ["task-a-3"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-5",
          phaseId: "phase-track-a",
          name: "Infrastructure Setup",
          description:
            "Provision the SAP RISE environment, configure DEV/QAS/PRD systems, and integrate network, security, and third-party systems.",
          startDate: "2026-02-02",
          endDate: "2026-03-27",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-6",
          phaseId: "phase-track-a",
          name: "Activities During Conversion",
          description:
            "Execute SUM+DMO conversions for DEV, QAS, and PRD, with consistency checks after each system conversion.",
          startDate: "2026-04-06",
          endDate: "2026-05-22",
          dependencies: ["task-a-4", "task-a-5"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-7",
          phaseId: "phase-track-a",
          name: "Post-Conversion Activities",
          description:
            "On DEV: activate Fiori apps and embedded analytics, optimise performance, apply SAP Notes, remediate custom code/SIC, and run smoke tests; then transport changes to QAS and PRD.",
          startDate: "2026-05-04",
          endDate: "2026-07-10",
          dependencies: ["task-a-6"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-8",
          phaseId: "phase-track-a",
          name: "Testing & Validation",
          description: "Conduct SIT and UAT in QAS and complete regression testing.",
          startDate: "2026-07-06",
          endDate: "2026-08-07",
          dependencies: ["task-a-7"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-9",
          phaseId: "phase-track-a",
          name: "Cutover & Go-Live Preparation",
          description:
            "Develop the detailed cutover plan, archive/cleanse legacy data in PRD, and finalise the go/no-go checklist.",
          startDate: "2026-04-06",
          endDate: "2026-08-07",
          dependencies: ["task-a-6"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-a-10",
          phaseId: "phase-track-a",
          name: "Technical Go-Live",
          description: "Execute production cutover and confirm technical go-live/system readiness.",
          startDate: "2026-08-03",
          endDate: "2026-08-14",
          dependencies: ["task-a-8", "task-a-9"],
          progress: 0,
          resourceAssignments: [],
        },
      ],
    },
    {
      id: "phase-track-b",
      name: "Track B - New Modules + Enhancement",
      description: "New modules implementation, enhancement and business transformation",
      color: "#10B981",
      startDate: "2026-08-31",
      endDate: "2028-04-21",
      collapsed: false,
      dependencies: ["phase-track-a"],
      tasks: [
        {
          id: "task-b-1",
          phaseId: "phase-track-b",
          name: "Establish project governance for implementation of SAP Project System and Document Management System",
          description:
            "Define scope and key objectives; define the project plan and charter; form the project team and governance (e.g., Steering Committee).",
          startDate: "2026-08-31",
          endDate: "2026-09-25",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-2",
          phaseId: "phase-track-b",
          name: "Business Blueprint / Requirements Gathering",
          description:
            "Prepare and run workshops; conduct requirements gathering; map business processes to SAP; identify gaps between processes and SAP modules; finalise custom developments and integration points.",
          startDate: "2026-09-28",
          endDate: "2026-11-20",
          dependencies: ["task-b-1"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-3",
          phaseId: "phase-track-b",
          name: "System Configuration & Customization",
          description:
            "Configure core SAP settings; develop RICEF objects (reports, interfaces, conversions, enhancements, forms); develop interfaces and security.",
          startDate: "2026-11-23",
          endDate: "2027-04-02",
          dependencies: ["task-b-2"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-4",
          phaseId: "phase-track-b",
          name: "Testing",
          description:
            "Perform system integration testing (SIT); prepare and train key users; perform user acceptance testing (UAT).",
          startDate: "2027-04-05",
          endDate: "2027-06-25",
          dependencies: ["task-b-3"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-5",
          phaseId: "phase-track-b",
          name: "Data Migration & Cutover Planning",
          description:
            "Finalise and execute the cutover plan, including required data migration activities.",
          startDate: "2027-06-28",
          endDate: "2027-07-16",
          dependencies: ["task-b-4"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-6",
          phaseId: "phase-track-b",
          name: "Technical Go-Live",
          description:
            "Execute final cutover; identify areas for continuous improvement; document lessons learned.",
          startDate: "2027-07-19",
          endDate: "2027-08-27",
          dependencies: ["task-b-5"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-7",
          phaseId: "phase-track-b",
          name: "Establish project goals and governance for SAP Analytics Cloud, EPS Replacement, BMS & S/4HANA enhancements",
          description:
            "Define scope and key objectives; define the project plan and charter; form the project team and governance (e.g., Steering Committee).",
          startDate: "2027-02-15",
          endDate: "2027-03-12",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-8",
          phaseId: "phase-track-b",
          name: "Business Blueprint / Requirements (SAC/EPS/BMS & enhancements)",
          description:
            "Conduct requirements workshops; map business processes to SAP; identify gaps; finalise custom developments and integration points.",
          startDate: "2027-03-15",
          endDate: "2027-05-28",
          dependencies: ["task-b-7"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-9",
          phaseId: "phase-track-b",
          name: "System Configuration & Customization (SAC/EPS/BMS & enhancements)",
          description:
            "Configure core settings; develop RICEF objects at scale; build interfaces and security.",
          startDate: "2027-05-31",
          endDate: "2027-10-22",
          dependencies: ["task-b-8"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-10",
          phaseId: "phase-track-b",
          name: "Testing (SAC/EPS/BMS & enhancements)",
          description: "Perform SIT; conduct key-user testing/training (KUT); perform UAT.",
          startDate: "2027-07-26",
          endDate: "2027-11-19",
          dependencies: ["task-b-9"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-11",
          phaseId: "phase-track-b",
          name: "Data Migration & Cutover Planning (SAC/EPS/BMS & enhancements)",
          description: "Finalise and execute the cutover plan for go-live readiness.",
          startDate: "2027-11-22",
          endDate: "2027-12-03",
          dependencies: ["task-b-10"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-12",
          phaseId: "phase-track-b",
          name: "Technical & Production Go-Live",
          description:
            "Execute final cutover; monitor go-live performance; resolve go-live issues with hypercare; drive improvements; document lessons learned and close.",
          startDate: "2027-12-06",
          endDate: "2028-01-07",
          dependencies: ["task-b-11"],
          progress: 0,
          resourceAssignments: [],
        },
        {
          id: "task-b-13",
          phaseId: "phase-track-b",
          name: "Post Go-Live Optimisation & Hypercare Support",
          description:
            "Provide ongoing optimisation and hypercare; monitor and stabilise operations; resolve issues; embed improvements.",
          startDate: "2027-11-29",
          endDate: "2028-04-21",
          dependencies: [],
          progress: 0,
          resourceAssignments: [],
        },
      ],
    },
  ],
  milestones: [
    {
      id: "milestone-1",
      name: "Project Kickoff",
      description: "Official project start",
      date: "2026-02-02",
      icon: "🚀",
      color: "#3B82F6",
    },
    {
      id: "milestone-2",
      name: "Track A Go-Live",
      description: "Technical conversion complete",
      date: "2026-08-14",
      icon: "✅",
      color: "#10B981",
    },
    {
      id: "milestone-3",
      name: "Track B Starts",
      description: "Begin new modules implementation",
      date: "2026-08-31",
      icon: "🎯",
      color: "#3B82F6",
    },
    {
      id: "milestone-4",
      name: "PS/DMS Go-Live",
      description: "Project System and DMS live",
      date: "2027-08-27",
      icon: "📊",
      color: "#10B981",
    },
    {
      id: "milestone-5",
      name: "Final Go-Live",
      description: "SAC/EPS/BMS production launch",
      date: "2028-01-07",
      icon: "🎉",
      color: "#F59E0B",
    },
    {
      id: "milestone-6",
      name: "Project Closure",
      description: "Hypercare complete, project closed",
      date: "2028-04-21",
      icon: "🏁",
      color: "#10B981",
    },
  ],
};

export default function LPPSAGanttSetupPage() {
  const [status, setStatus] = useState<"idle" | "importing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const importProject = useGanttToolStore((state) => state.importProject);

  const totalTasks = lppsaProjectData.phases.reduce((sum, p) => sum + p.tasks.length, 0);

  const handleImport = () => {
    try {
      setStatus("importing");

      // Import the project into the gantt-tool store
      importProject(lppsaProjectData as any);

      setStatus("success");

      // Redirect to gantt-tool after 2 seconds
      setTimeout(() => {
        router.push("/gantt-tool");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to import project");
    }
  };

  const handleViewGantt = () => {
    router.push("/gantt-tool");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center mb-8">
            <RocketOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
            <h1 className="text-3xl font-bold mt-4">LPPSA Project - Direct Import</h1>
            <p className="text-gray-600 mt-2">
              One-click import of your LPPSA SAP S/4HANA implementation project
            </p>
          </div>

          {status === "success" && (
            <Alert
              message="Success!"
              description="LPPSA project has been imported successfully. Redirecting to Gantt Tool..."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          {status === "error" && (
            <Alert message="Import Failed" description={errorMessage} type="error" showIcon />
          )}

          {status === "importing" && (
            <Alert
              message="Importing..."
              description="Please wait while we import the LPPSA project"
              type="info"
              showIcon
              icon={<LoadingOutlined />}
            />
          )}

          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="Phases" value={lppsaProjectData.phases.length} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Tasks" value={totalTasks} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Milestones" value={lppsaProjectData.milestones.length} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Duration" value="27" suffix="months" />
              </Card>
            </Col>
          </Row>

          <Card title="Project Overview">
            <Space direction="vertical" className="w-full">
              <div>
                <h3 className="font-semibold text-lg">{lppsaProjectData.name}</h3>
                <p className="text-gray-600 mt-2">{lppsaProjectData.description}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded border-l-4" style={{ borderColor: "#3B82F6" }}>
                <h4 className="font-semibold text-blue-900">Track A - Technical Conversion</h4>
                <p className="text-sm mt-1">10 tasks • Feb 2, 2026 → Jul 31, 2026</p>
                <p className="text-xs text-gray-600 mt-1">
                  Technical Conversion, Remediation, Mandatory Fiori App to replace obsolete
                  transactions
                </p>
              </div>

              <div
                className="p-4 bg-green-50 rounded border-l-4"
                style={{ borderColor: "#10B981" }}
              >
                <h4 className="font-semibold text-green-900">
                  Track B - New Modules + Enhancement
                </h4>
                <p className="text-sm mt-1">13 tasks • Aug 31, 2026 → Apr 21, 2028</p>
                <p className="text-xs text-gray-600 mt-1">
                  New modules implementation, enhancement and business transformation
                </p>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Key Milestones:</h4>
                <Space direction="vertical" className="w-full">
                  {lppsaProjectData.milestones.map((ms) => (
                    <div key={ms.id} className="text-sm">
                      {ms.icon} <strong>{ms.name}</strong> - {ms.date}
                    </div>
                  ))}
                </Space>
              </div>
            </Space>
          </Card>

          <Card>
            <div className="flex justify-center gap-4">
              {status === "idle" && (
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={handleImport}
                >
                  Import LPPSA Project Now
                </Button>
              )}

              {status === "importing" && (
                <Button type="primary" size="large" loading disabled>
                  Importing...
                </Button>
              )}

              {status === "success" && (
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleViewGantt}
                >
                  View in Gantt Tool
                </Button>
              )}

              {status === "error" && (
                <>
                  <Button size="large" onClick={() => setStatus("idle")}>
                    Try Again
                  </Button>
                  <Button type="default" size="large" onClick={handleViewGantt}>
                    Go to Gantt Tool
                  </Button>
                </>
              )}
            </div>
          </Card>

          <Alert
            message="Features Available in Gantt Tool"
            description={
              <ul className="list-disc list-inside mt-2">
                <li>Interactive timeline with drag-and-drop</li>
                <li>Task dependencies and progress tracking</li>
                <li>Resource assignment from built-in library</li>
                <li>Export to PNG, PDF, Excel, JSON</li>
                <li>Milestone and holiday tracking</li>
                <li>Multiple zoom levels (Day/Week/Month/Quarter)</li>
              </ul>
            }
            type="info"
          />
        </Space>
      </div>
    </div>
  );
}
