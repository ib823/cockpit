/**
 * SAP Activate Deliverable Templates
 * Defines standard deliverables per phase following SAP Activate methodology
 * Aligned with existing phase generation
 */

export interface PhaseDeliverable {
  id: string;
  name: string;
  description: string;
  type: "Document" | "Configuration" | "Code" | "Test Results" | "Training" | "Data" | "Approval";

  // Timing
  dueRelativeToPhaseEnd: number; // Days before phase end (0 = end of phase, -5 = 5 days before end)
  isMilestone: boolean; // Client-facing milestone?

  // Quality Gates
  acceptanceCriteria: string[];
  reviewers: string[]; // Roles required for sign-off

  // Criticality
  criticality: "must-have" | "recommended" | "optional";
}

/**
 * Prepare Phase Deliverables (per module)
 */
export const PREPARE_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: "prepare-01",
    name: "Project Charter",
    description: "Project scope, objectives, stakeholders, and success criteria",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "Business objectives clearly defined",
      "Project scope boundaries documented",
      "Key stakeholders identified with RACI",
      "Success criteria and KPIs defined",
      "Executive sponsor sign-off obtained",
    ],
    reviewers: ["Project Manager", "Solution Architect", "Executive Sponsor"],
    criticality: "must-have",
  },
  {
    id: "prepare-02",
    name: "Business Process Discovery",
    description: "Current state (As-Is) business process documentation",
    type: "Document",
    dueRelativeToPhaseEnd: -5,
    isMilestone: false,
    acceptanceCriteria: [
      "Key business processes documented",
      "Process flows created",
      "Pain points identified",
      "Process owners interviewed",
      "Integration points mapped",
    ],
    reviewers: ["Business Analyst", "Module Lead"],
    criticality: "must-have",
  },
  {
    id: "prepare-03",
    name: "Solution Overview",
    description: "High-level solution architecture and approach",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "System landscape defined",
      "Integration architecture outlined",
      "Security concept proposed",
      "Technical constraints identified",
      "Architecture risks documented",
    ],
    reviewers: ["Solution Architect", "Technical Architect"],
    criticality: "must-have",
  },
  {
    id: "prepare-04",
    name: "Project Plan",
    description: "Detailed project schedule with resources and milestones",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "Phase timeline with milestones",
      "Resource allocation plan",
      "Risk register initialized",
      "Change management approach",
      "Communication plan",
    ],
    reviewers: ["Project Manager", "Solution Architect"],
    criticality: "must-have",
  },
];

/**
 * Explore Phase Deliverables (Blueprint)
 */
export const EXPLORE_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: "explore-01",
    name: "Business Blueprint Document",
    description: "Complete to-be business process design",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "All in-scope processes documented",
      "To-be process flows validated",
      "Business rules defined",
      "Reports and interfaces identified",
      "Client sign-off obtained",
    ],
    reviewers: ["Module Lead", "Business Analyst", "Business Process Owner"],
    criticality: "must-have",
  },
  {
    id: "explore-02",
    name: "Fit-Gap Analysis",
    description: "Gap identification and remediation approach",
    type: "Document",
    dueRelativeToPhaseEnd: -10,
    isMilestone: true,
    acceptanceCriteria: [
      "All gaps identified and categorized",
      "Remediation approach for each gap (config/custom/process change)",
      "Effort estimates for custom development",
      "Change management impacts assessed",
      "Client approval on approach",
    ],
    reviewers: ["Module Lead", "Solution Architect"],
    criticality: "must-have",
  },
  {
    id: "explore-03",
    name: "Solution Design Document",
    description: "Technical architecture and design specifications",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "System architecture diagram",
      "Integration specifications",
      "Custom object design",
      "Security and authorization concept",
      "Data migration strategy",
      "Performance and scalability plan",
    ],
    reviewers: ["Solution Architect", "Technical Architect", "Security Consultant"],
    criticality: "must-have",
  },
  {
    id: "explore-04",
    name: "Prototype Demonstration",
    description: "Working proof-of-concept for key scenarios",
    type: "Configuration",
    dueRelativeToPhaseEnd: -3,
    isMilestone: true,
    acceptanceCriteria: [
      "Key business scenarios configured",
      "End-to-end demo prepared",
      "Client validation session conducted",
      "Feedback incorporated",
      "Validation sign-off",
    ],
    reviewers: ["Module Lead", "Business Process Owner"],
    criticality: "must-have",
  },
  {
    id: "explore-05",
    name: "Test Strategy",
    description: "Testing approach and test case design",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: false,
    acceptanceCriteria: [
      "Test phases defined (unit/integration/UAT)",
      "Test scenarios identified",
      "Test data requirements",
      "Entry/exit criteria",
      "Defect management process",
    ],
    reviewers: ["QA Lead", "Module Lead"],
    criticality: "recommended",
  },
];

/**
 * Realize Phase Deliverables (Build & Test)
 */
export const REALIZE_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: "realize-01",
    name: "Configured System",
    description: "Fully configured SAP system per blueprint",
    type: "Configuration",
    dueRelativeToPhaseEnd: -20,
    isMilestone: true,
    acceptanceCriteria: [
      "All configuration completed",
      "Unit testing passed",
      "Configuration documentation updated",
      "Transport requests organized",
      "Configuration validation sign-off",
    ],
    reviewers: ["Module Lead", "Senior Consultant"],
    criticality: "must-have",
  },
  {
    id: "realize-02",
    name: "Custom Development",
    description: "All custom code, reports, and enhancements",
    type: "Code",
    dueRelativeToPhaseEnd: -15,
    isMilestone: true,
    acceptanceCriteria: [
      "All custom objects developed",
      "Code reviews completed",
      "Unit tests passed",
      "Technical documentation",
      "Transport requests ready",
    ],
    reviewers: ["ABAP Developer", "Technical Architect"],
    criticality: "must-have",
  },
  {
    id: "realize-03",
    name: "Integration Build",
    description: "All system integrations developed and tested",
    type: "Code",
    dueRelativeToPhaseEnd: -10,
    isMilestone: true,
    acceptanceCriteria: [
      "Integration points implemented",
      "Interface testing completed",
      "Error handling validated",
      "Integration documentation",
      "Performance benchmarks met",
    ],
    reviewers: ["Integration Lead", "Technical Architect"],
    criticality: "must-have",
  },
  {
    id: "realize-04",
    name: "Integration Test Results",
    description: "End-to-end integration testing outcomes",
    type: "Test Results",
    dueRelativeToPhaseEnd: -5,
    isMilestone: true,
    acceptanceCriteria: [
      "All test cases executed",
      "Defects logged and prioritized",
      "Critical defects resolved",
      "Regression testing passed",
      "Test summary report",
    ],
    reviewers: ["QA Lead", "Module Lead"],
    criticality: "must-have",
  },
  {
    id: "realize-05",
    name: "User Acceptance Test (UAT) Plan",
    description: "UAT scenarios and client readiness",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: false,
    acceptanceCriteria: [
      "UAT scenarios prepared",
      "Test data created",
      "UAT environment ready",
      "Business users trained",
      "UAT kickoff scheduled",
    ],
    reviewers: ["QA Lead", "Business Analyst"],
    criticality: "must-have",
  },
];

/**
 * Deploy Phase Deliverables (Go-Live)
 */
export const DEPLOY_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: "deploy-01",
    name: "UAT Sign-Off",
    description: "Client approval after user acceptance testing",
    type: "Approval",
    dueRelativeToPhaseEnd: -15,
    isMilestone: true,
    acceptanceCriteria: [
      "All UAT test cases executed",
      "Critical defects resolved",
      "Business users satisfied",
      "Formal sign-off document",
      "Go-live approval obtained",
    ],
    reviewers: ["Business Process Owner", "Project Sponsor"],
    criticality: "must-have",
  },
  {
    id: "deploy-02",
    name: "Cutover Plan",
    description: "Detailed go-live execution plan",
    type: "Document",
    dueRelativeToPhaseEnd: -10,
    isMilestone: true,
    acceptanceCriteria: [
      "Cutover timeline (hour-by-hour)",
      "Cutover team and responsibilities",
      "Data migration sequence",
      "Rollback procedures",
      "Go/no-go decision criteria",
      "Business downtime window agreed",
    ],
    reviewers: ["Project Manager", "Module Lead", "Technical Lead"],
    criticality: "must-have",
  },
  {
    id: "deploy-03",
    name: "Migrated Data",
    description: "All master and transactional data migrated",
    type: "Data",
    dueRelativeToPhaseEnd: -3,
    isMilestone: true,
    acceptanceCriteria: [
      "Data extraction completed",
      "Data transformation validated",
      "Data loaded to production",
      "Data reconciliation passed",
      "Business validation sign-off",
    ],
    reviewers: ["Data Migration Specialist", "Module Lead", "Business Owner"],
    criticality: "must-have",
  },
  {
    id: "deploy-04",
    name: "Production System Go-Live",
    description: "System operational in production",
    type: "Approval",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "Production system stable",
      "Business processes operational",
      "Users logged in successfully",
      "Critical transactions verified",
      "Hypercare team activated",
      "Go-live announcement sent",
    ],
    reviewers: ["Project Manager", "Executive Sponsor"],
    criticality: "must-have",
  },
  {
    id: "deploy-05",
    name: "End-User Training Completion",
    description: "All users trained on new system",
    type: "Training",
    dueRelativeToPhaseEnd: -7,
    isMilestone: false,
    acceptanceCriteria: [
      "Training sessions completed",
      "Training materials distributed",
      "User feedback collected",
      "Super users identified",
      "Training attendance >90%",
    ],
    reviewers: ["Training Specialist", "Change Manager"],
    criticality: "recommended",
  },
];

/**
 * Run Phase Deliverables (Hypercare & Support)
 */
export const RUN_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: "run-01",
    name: "Hypercare Support Summary",
    description: "Post go-live support metrics and issues",
    type: "Document",
    dueRelativeToPhaseEnd: -10,
    isMilestone: false,
    acceptanceCriteria: [
      "Incident log maintained",
      "Issue resolution times tracked",
      "Knowledge base updated",
      "Common issues documented",
      "Support handover prepared",
    ],
    reviewers: ["Support Analyst", "Module Lead"],
    criticality: "must-have",
  },
  {
    id: "run-02",
    name: "Performance Monitoring Report",
    description: "System performance and optimization recommendations",
    type: "Document",
    dueRelativeToPhaseEnd: -5,
    isMilestone: false,
    acceptanceCriteria: [
      "Performance metrics collected",
      "Bottlenecks identified",
      "Optimization recommendations",
      "Capacity planning insights",
      "SLA compliance report",
    ],
    reviewers: ["Basis Consultant", "Technical Architect"],
    criticality: "recommended",
  },
  {
    id: "run-03",
    name: "Project Closure Document",
    description: "Final project summary and lessons learned",
    type: "Document",
    dueRelativeToPhaseEnd: 0,
    isMilestone: true,
    acceptanceCriteria: [
      "Project objectives achieved (verified)",
      "Lessons learned documented",
      "Final project metrics",
      "Handover to support team",
      "Client satisfaction survey",
      "Final sign-off and closure",
    ],
    reviewers: ["Project Manager", "Executive Sponsor"],
    criticality: "must-have",
  },
];

/**
 * Get deliverables for a specific SAP Activate phase
 */
export function getPhaseDeliverables(
  phase: "Prepare" | "Explore" | "Realize" | "Deploy" | "Run"
): PhaseDeliverable[] {
  const deliverableMap = {
    Prepare: PREPARE_DELIVERABLES,
    Explore: EXPLORE_DELIVERABLES,
    Realize: REALIZE_DELIVERABLES,
    Deploy: DEPLOY_DELIVERABLES,
    Run: RUN_DELIVERABLES,
  };

  return deliverableMap[phase] || [];
}

/**
 * Get all milestone deliverables across phases
 */
export function getAllMilestones(): PhaseDeliverable[] {
  const allDeliverables = [
    ...PREPARE_DELIVERABLES,
    ...EXPLORE_DELIVERABLES,
    ...REALIZE_DELIVERABLES,
    ...DEPLOY_DELIVERABLES,
    ...RUN_DELIVERABLES,
  ];

  return allDeliverables.filter((d) => d.isMilestone);
}

/**
 * Get must-have deliverables (for quick checklist)
 */
export function getMustHaveDeliverables(): PhaseDeliverable[] {
  const allDeliverables = [
    ...PREPARE_DELIVERABLES,
    ...EXPLORE_DELIVERABLES,
    ...REALIZE_DELIVERABLES,
    ...DEPLOY_DELIVERABLES,
    ...RUN_DELIVERABLES,
  ];

  return allDeliverables.filter((d) => d.criticality === "must-have");
}
