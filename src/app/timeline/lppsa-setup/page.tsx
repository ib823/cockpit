'use client';

import { useState } from 'react';
import { Card, Button, Timeline, Alert, Space, Statistic, Row, Col, Collapse, Divider } from 'antd';
import { CheckCircleOutlined, PlusOutlined, RocketOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTimelineStore } from '@/stores/timeline-store';
import { useRouter } from 'next/navigation';

const LPPSA_PHASES = [
  {
    id: "lppsa-track-1",
    name: "Track A - Technical Conversion",
    category: "technical",
    description: "Technical Conversion, Remediation, Mandatory Fiori App to replace obsolete transactions",
    color: "#3B82F6",
    startBusinessDay: 0,
    workingDays: 130,
    startDate: new Date("2026-02-02"),
    endDate: new Date("2026-07-31"),
    status: "idle" as const,
    resources: [],
    tasks: [
      {
        id: "task-1",
        name: "Project Initiation",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-03-27T00:00:00.000Z"),
        workingDays: 40,
        description: "Complete contractual formalities (sign/return LOA, execution bonds, agreement docs), hold the project kick-off, and issue documented minutes.",
        status: "not_started" as const
      },
      {
        id: "task-2",
        name: "Establish project governance for migration of SAP ECC to SAP S/4HANA",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-02-27T00:00:00.000Z"),
        workingDays: 20,
        description: "Define scope, objectives, and project plan/charter; form the project team and governance (e.g., Steering Committee).",
        status: "not_started" as const
      },
      {
        id: "task-3",
        name: "System Planning and Assessment",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-03-06T00:00:00.000Z"),
        workingDays: 25,
        description: "Assess the current ECC landscape, check custom code via SAP Readiness Check, plan the RISE with SAP landscape, and draft the system conversion roadmap.",
        status: "not_started" as const
      },
      {
        id: "task-4",
        name: "Pre-Conversion Activities",
        startDate: new Date("2026-03-02T00:00:00.000Z"),
        endDate: new Date("2026-03-27T00:00:00.000Z"),
        workingDays: 20,
        description: "Validate add-ons/components with Maintenance Planner; generate and prepare SIC for DEV, QAS, and PRD.",
        status: "not_started" as const
      },
      {
        id: "task-5",
        name: "Infrastructure Setup",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-03-27T00:00:00.000Z"),
        workingDays: 40,
        description: "Provision the SAP RISE environment, configure DEV/QAS/PRD systems, and integrate network, security, and third-party systems.",
        status: "not_started" as const
      },
      {
        id: "task-6",
        name: "Activities During Conversion",
        startDate: new Date("2026-04-06T00:00:00.000Z"),
        endDate: new Date("2026-05-22T00:00:00.000Z"),
        workingDays: 35,
        description: "Execute SUM+DMO conversions for DEV, QAS, and PRD, with consistency checks after each system conversion.",
        status: "not_started" as const
      },
      {
        id: "task-7",
        name: "Post-Conversion Activities",
        startDate: new Date("2026-05-04T00:00:00.000Z"),
        endDate: new Date("2026-07-10T00:00:00.000Z"),
        workingDays: 50,
        description: "On DEV: activate Fiori apps and embedded analytics, optimise performance, apply SAP Notes, remediate custom code/SIC, and run smoke tests; then transport changes to QAS and PRD.",
        status: "not_started" as const
      },
      {
        id: "task-8",
        name: "Testing & Validation",
        startDate: new Date("2026-07-06T00:00:00.000Z"),
        endDate: new Date("2026-08-07T00:00:00.000Z"),
        workingDays: 25,
        description: "Conduct SIT and UAT in QAS and complete regression testing.",
        status: "not_started" as const
      },
      {
        id: "task-9",
        name: "Cutover & Go-Live Preparation",
        startDate: new Date("2026-04-06T00:00:00.000Z"),
        endDate: new Date("2026-08-07T00:00:00.000Z"),
        workingDays: 90,
        description: "Develop the detailed cutover plan, archive/cleanse legacy data in PRD, and finalise the go/no-go checklist.",
        status: "not_started" as const
      },
      {
        id: "task-10",
        name: "Technical Go-Live",
        startDate: new Date("2026-08-03T00:00:00.000Z"),
        endDate: new Date("2026-08-14T00:00:00.000Z"),
        workingDays: 10,
        description: "Execute production cutover and confirm technical go-live/system readiness.",
        status: "not_started" as const
      }
    ]
  },
  {
    id: "lppsa-track-2",
    name: "Track B - New Modules + Enhancement",
    category: "enhancement",
    description: "New modules implementation, enhancement and business transformation",
    color: "#10B981",
    startBusinessDay: 130,
    workingDays: 260,
    startDate: new Date("2026-08-03"),
    endDate: new Date("2027-07-30"),
    status: "idle" as const,
    resources: [],
    tasks: [
      {
        id: "task-11",
        name: "Establish project governance for implementation of SAP Project System and Document Management System",
        startDate: new Date("2026-08-31T00:00:00.000Z"),
        endDate: new Date("2026-09-25T00:00:00.000Z"),
        workingDays: 20,
        description: "Define scope and key objectives; define the project plan and charter; form the project team and governance (e.g., Steering Committee).",
        status: "not_started" as const
      },
      {
        id: "task-12",
        name: "Business Blueprint / Requirements Gathering",
        startDate: new Date("2026-09-28T00:00:00.000Z"),
        endDate: new Date("2026-11-20T00:00:00.000Z"),
        workingDays: 40,
        description: "Prepare and run workshops; conduct requirements gathering; map business processes to SAP; identify gaps between processes and SAP modules; finalise custom developments and integration points.",
        status: "not_started" as const
      },
      {
        id: "task-13",
        name: "System Configuration & Customization",
        startDate: new Date("2026-11-23T00:00:00.000Z"),
        endDate: new Date("2027-04-02T00:00:00.000Z"),
        workingDays: 95,
        description: "Configure core SAP settings; develop RICEF objects (reports, interfaces, conversions, enhancements, forms); develop interfaces and security.",
        status: "not_started" as const
      },
      {
        id: "task-14",
        name: "Testing",
        startDate: new Date("2027-04-05T00:00:00.000Z"),
        endDate: new Date("2027-06-25T00:00:00.000Z"),
        workingDays: 60,
        description: "Perform system integration testing (SIT); prepare and train key users; perform user acceptance testing (UAT).",
        status: "not_started" as const
      },
      {
        id: "task-15",
        name: "Data Migration & Cutover Planning",
        startDate: new Date("2027-06-28T00:00:00.000Z"),
        endDate: new Date("2027-07-16T00:00:00.000Z"),
        workingDays: 15,
        description: "Finalise and execute the cutover plan, including required data migration activities.",
        status: "not_started" as const
      },
      {
        id: "task-16",
        name: "Technical Go-Live",
        startDate: new Date("2027-07-19T00:00:00.000Z"),
        endDate: new Date("2027-08-27T00:00:00.000Z"),
        workingDays: 30,
        description: "Execute final cutover; identify areas for continuous improvement; document lessons learned.",
        status: "not_started" as const
      },
      {
        id: "task-17",
        name: "Establish project goals and governance for SAP Analytics Cloud, EPS Replacement, BMS & S/4HANA enhancements",
        startDate: new Date("2027-02-15T00:00:00.000Z"),
        endDate: new Date("2027-03-12T00:00:00.000Z"),
        workingDays: 20,
        description: "Define scope and key objectives; define the project plan and charter; form the project team and governance (e.g., Steering Committee).",
        status: "not_started" as const
      },
      {
        id: "task-18",
        name: "Business Blueprint / Requirements (SAC/EPS/BMS & enhancements)",
        startDate: new Date("2027-03-15T00:00:00.000Z"),
        endDate: new Date("2027-05-28T00:00:00.000Z"),
        workingDays: 55,
        description: "Conduct requirements workshops; map business processes to SAP; identify gaps; finalise custom developments and integration points.",
        status: "not_started" as const
      },
      {
        id: "task-19",
        name: "System Configuration & Customization (SAC/EPS/BMS & enhancements)",
        startDate: new Date("2027-05-31T00:00:00.000Z"),
        endDate: new Date("2027-10-22T00:00:00.000Z"),
        workingDays: 105,
        description: "Configure core settings; develop RICEF objects at scale; build interfaces and security.",
        status: "not_started" as const
      },
      {
        id: "task-20",
        name: "Testing (SAC/EPS/BMS & enhancements)",
        startDate: new Date("2027-07-26T00:00:00.000Z"),
        endDate: new Date("2027-11-19T00:00:00.000Z"),
        workingDays: 85,
        description: "Perform SIT; conduct key-user testing/training (KUT); perform UAT.",
        status: "not_started" as const
      },
      {
        id: "task-21",
        name: "Data Migration & Cutover Planning (SAC/EPS/BMS & enhancements)",
        startDate: new Date("2027-11-22T00:00:00.000Z"),
        endDate: new Date("2027-12-03T00:00:00.000Z"),
        workingDays: 10,
        description: "Finalise and execute the cutover plan for go-live readiness.",
        status: "not_started" as const
      },
      {
        id: "task-22",
        name: "Technical & Production Go-Live",
        startDate: new Date("2027-12-06T00:00:00.000Z"),
        endDate: new Date("2028-01-07T00:00:00.000Z"),
        workingDays: 25,
        description: "Execute final cutover; monitor go-live performance; resolve go-live issues with hypercare; drive improvements; document lessons learned and close.",
        status: "not_started" as const
      },
      {
        id: "task-23",
        name: "Post Go-Live Optimisation & Hypercare Support",
        startDate: new Date("2027-11-29T00:00:00.000Z"),
        endDate: new Date("2028-04-21T00:00:00.000Z"),
        workingDays: 105,
        description: "Provide ongoing optimisation and hypercare; monitor and stabilise operations; resolve issues; embed improvements.",
        status: "not_started" as const
      }
    ]
  }
];

export default function LPPSASetupPage() {
  const [added, setAdded] = useState(false);
  const { phases, addPhase, reset } = useTimelineStore();
  const router = useRouter();

  const handleAddPhases = () => {
    // Clear existing phases if needed (optional)
    // reset();

    // Add each LPPSA phase
    LPPSA_PHASES.forEach(phase => {
      addPhase(phase);
    });

    setAdded(true);
  };

  const handleViewTimeline = () => {
    router.push('/project/plan');
  };

  const totalDuration = LPPSA_PHASES.reduce((sum, p) => sum + p.workingDays, 0);
  const totalTasks = LPPSA_PHASES.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Space direction="vertical" size="large" className="w-full">
          <div className="text-center mb-8">
            <RocketOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <h1 className="text-3xl font-bold mt-4">LPPSA 2-Track Project Timeline</h1>
            <p className="text-gray-600 mt-2">
              Set up your dual-track SAP implementation timeline with detailed tasks
            </p>
          </div>

          {added && (
            <Alert
              message="Success!"
              description={`LPPSA phases (${LPPSA_PHASES.length} phases, ${totalTasks} tasks) have been added to your timeline. You can now view and manage them.`}
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Phases"
                  value={LPPSA_PHASES.length}
                  prefix={<PlusOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Tasks"
                  value={totalTasks}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Duration"
                  value={Math.round(totalDuration / 22)}
                  suffix="months"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Working Days"
                  value={totalDuration}
                  suffix="days"
                />
              </Card>
            </Col>
          </Row>

          <Card title="Project Tracks Overview">
            <Timeline
              items={LPPSA_PHASES.map((phase, idx) => ({
                color: phase.color,
                dot: idx === 0 ? <RocketOutlined /> : undefined,
                children: (
                  <div>
                    <div className="font-semibold text-lg" style={{ color: phase.color }}>
                      {phase.name}
                    </div>
                    <div className="text-gray-600 mt-2">{phase.description}</div>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>
                        📅 Start: {phase.startDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span>
                        📅 End: {phase.endDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span>⏱ {phase.workingDays} working days (~{Math.round(phase.workingDays / 22)} months)</span>
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>

          <Card>
            <Space direction="vertical" className="w-full">
              <h3 className="text-lg font-semibold">Phase Details</h3>

              <div className="p-4 bg-blue-50 rounded border-l-4" style={{ borderColor: '#3B82F6' }}>
                <h4 className="font-semibold text-blue-900">Track A - Technical Conversion</h4>
                <p className="text-sm mt-2">
                  Duration: February 2, 2026 → July 31, 2026 (130 working days, ~6 months)
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Focus: Technical conversion, system remediation, and implementing mandatory Fiori applications
                  to replace obsolete transactions.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded border-l-4" style={{ borderColor: '#10B981' }}>
                <h4 className="font-semibold text-green-900">Track B - New Modules + Enhancement</h4>
                <p className="text-sm mt-2">
                  Duration: August 3, 2026 → July 30, 2027 (260 working days, ~12 months)
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  Focus: New module implementations, system enhancements, and business transformation initiatives.
                </p>
              </div>
            </Space>
          </Card>

          <Card title="Detailed Task Breakdown">
            <Collapse
              items={LPPSA_PHASES.map((phase) => ({
                key: phase.id,
                label: (
                  <div className="font-semibold" style={{ color: phase.color }}>
                    {phase.name} ({phase.tasks?.length || 0} tasks)
                  </div>
                ),
                children: (
                  <Space direction="vertical" className="w-full">
                    {phase.tasks?.map((task, idx) => (
                      <div key={task.id} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-base">{idx + 1}. {task.name}</div>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                <CalendarOutlined /> {task.startDate?.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })} → {task.endDate?.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>⏱ {task.workingDays} days</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Space>
                ),
              }))}
            />
          </Card>

          <Card>
            <div className="flex justify-center gap-4">
              {!added ? (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleAddPhases}
                >
                  Add LPPSA Phases to Timeline
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={handleViewTimeline}
                  >
                    View Timeline
                  </Button>
                  <Button
                    size="large"
                    onClick={() => setAdded(false)}
                  >
                    Add Again
                  </Button>
                </>
              )}
            </div>
          </Card>

          {phases.length > 0 && (
            <Alert
              message="Existing Timeline Data"
              description={`You currently have ${phases.length} phase(s) in your timeline. Adding LPPSA phases will append to the existing timeline.`}
              type="info"
              showIcon
            />
          )}
        </Space>
      </div>
    </div>
  );
}
