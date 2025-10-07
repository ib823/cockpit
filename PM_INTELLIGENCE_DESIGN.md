# Project Manager Intelligence System - Design Specification

## Vision
Transform the SAP Implementation Cockpit into a precision project management instrument that handles:
1. **Accurate resource planning** with skillset intelligence
2. **Holiday-aware scheduling** with flexible start dates
3. **FTE optimization** for resource booking
4. **Deliverable tracking** with clear client commitments
5. **Methodology transparency** showing how effort is spent
6. **Client proposal generation** with cost justification

---

## Architecture Components

### 1. Project Configuration Store (`project-config-store.ts`)

**Purpose:** Central configuration for project-level settings

```typescript
interface ProjectConfig {
  // Project Basics
  projectId: string;
  projectName: string;
  projectStartDate: Date; // USER SELECTABLE - NOT HARDCODED
  region: 'ABMY' | 'ABSG' | 'ABVN';

  // Client Details
  clientProfile: ClientProfile;

  // Planning Parameters
  workingHoursPerDay: number; // Default: 8
  standardUtilization: number; // Default: 85% (realistic, not 100%)
  bufferPercentage: number; // Default: 15% (contingency)

  // Costing
  currency: 'USD' | 'SGD' | 'MYR' | 'VND';
  marginTarget: number; // Default: 25%
}
```

**Actions:**
- `setProjectStartDate(date: Date)` - Recalculates all phase dates
- `setRegion(region)` - Updates holiday calendar
- `setUtilizationTarget(percent)` - Affects FTE calculations

---

### 2. Skillset Catalog (`skillset-catalog.ts`)

**Purpose:** Map SAP modules to required skillsets and roles

```typescript
interface SkillsetRequirement {
  sapModuleId: string;
  sapModuleName: string;

  // Required skillsets per phase type
  requirements: {
    blueprint: RoleRequirement[];
    configuration: RoleRequirement[];
    testing: RoleRequirement[];
    cutover: RoleRequirement[];
  };

  // Complexity multipliers
  complexityFactors: {
    simple: number;    // 0.7x
    standard: number;  // 1.0x
    complex: number;   // 1.5x
    very_complex: number; // 2.0x
  };
}

interface RoleRequirement {
  role: 'Solution Architect' | 'Module Lead' | 'Senior Consultant' |
        'Consultant' | 'Developer' | 'Technical Architect' |
        'QA Lead' | 'Data Migration Specialist' | 'Change Manager';

  skillset: string[]; // e.g., ["SAP FICO", "US GAAP", "Multi-currency"]
  effortPercent: number; // % of phase effort
  allocationPercent: number; // % FTE (25% = part-time advisor)
  criticality: 'must-have' | 'recommended' | 'optional';
}
```

**Example: SAP FICO Module**

```typescript
SKILLSET_CATALOG['sap-fico'] = {
  sapModuleId: 'sap-fico',
  sapModuleName: 'Financial Accounting & Controlling',

  requirements: {
    blueprint: [
      {
        role: 'Solution Architect',
        skillset: ['SAP FICO', 'Financial Process Design', 'Integration Architecture'],
        effortPercent: 15,
        allocationPercent: 50, // Part-time, reviews key decisions
        criticality: 'must-have'
      },
      {
        role: 'Module Lead',
        skillset: ['SAP FICO', 'Chart of Accounts Design', 'Controlling Area Setup'],
        effortPercent: 30,
        allocationPercent: 100, // Full-time
        criticality: 'must-have'
      },
      {
        role: 'Senior Consultant',
        skillset: ['SAP FICO', 'GL Accounting', 'Asset Accounting'],
        effortPercent: 25,
        allocationPercent: 100,
        criticality: 'must-have'
      }
    ],

    configuration: [
      {
        role: 'Module Lead',
        skillset: ['SAP FICO Configuration', 'IMG Expertise'],
        effortPercent: 20,
        allocationPercent: 75,
        criticality: 'must-have'
      },
      {
        role: 'Senior Consultant',
        skillset: ['SAP FICO Configuration', 'GL/AP/AR Setup'],
        effortPercent: 40,
        allocationPercent: 100,
        criticality: 'must-have'
      },
      {
        role: 'Developer',
        skillset: ['ABAP', 'Financial Reports', 'Custom Forms'],
        effortPercent: 25,
        allocationPercent: 75,
        criticality: 'recommended'
      }
    ],

    testing: [
      {
        role: 'Module Lead',
        skillset: ['Test Strategy', 'SAP FICO'],
        effortPercent: 15,
        allocationPercent: 50,
        criticality: 'must-have'
      },
      {
        role: 'Senior Consultant',
        skillset: ['SAP FICO', 'Integration Testing'],
        effortPercent: 30,
        allocationPercent: 100,
        criticality: 'must-have'
      },
      {
        role: 'QA Lead',
        skillset: ['Test Automation', 'Financial Processes'],
        effortPercent: 25,
        allocationPercent: 75,
        criticality: 'recommended'
      }
    ],

    cutover: [
      {
        role: 'Module Lead',
        skillset: ['Cutover Planning', 'Data Reconciliation'],
        effortPercent: 25,
        allocationPercent: 100,
        criticality: 'must-have'
      },
      {
        role: 'Data Migration Specialist',
        skillset: ['Financial Data Migration', 'SAP FICO'],
        effortPercent: 35,
        allocationPercent: 100,
        criticality: 'must-have'
      }
    ]
  },

  complexityFactors: {
    simple: 0.7,      // Single company code, standard chart of accounts
    standard: 1.0,    // Multi-company code, standard processes
    complex: 1.5,     // Multi-country, multiple currencies, complex intercompany
    very_complex: 2.0 // Global rollout, shared services, complex consolidation
  }
};
```

**Similar catalogs for:**
- SAP MM (Procurement)
- SAP SD (Sales & Distribution)
- SAP PP (Production Planning)
- SAP HCM (Human Capital)
- SAP BW (Business Warehouse)
- SAP Basis (Technical Foundation)
- SAP Integration (middleware, APIs)

---

### 3. FTE Calculator (`fte-calculator.ts`)

**Purpose:** Convert effort (mandays) → people → booking requirements

```typescript
interface FTECalculation {
  phaseId: string;
  phaseName: string;

  // Input
  totalEffort: number; // mandays
  phaseDuration: number; // working days

  // Calculation
  requiredFTE: number; // totalEffort / phaseDuration
  adjustedFTE: number; // After utilization adjustment (85%)

  // Resource Breakdown
  resourceBookings: ResourceBooking[];

  // Alerts
  warnings: string[]; // e.g., "Over-allocation detected"
  recommendations: string[]; // e.g., "Consider splitting phase"
}

interface ResourceBooking {
  role: string;
  skillsets: string[];

  // Effort
  effortDays: number; // mandays required
  allocationPercent: number; // % FTE

  // Duration
  startDate: Date;
  endDate: Date;
  workingDays: number;

  // Booking Details
  fte: number; // Calculated: effortDays / workingDays
  headcount: number; // Rounded up: Math.ceil(fte)
  utilizationPercent: number; // Actual utilization

  // Cost
  hourlyRate: number;
  totalCost: number;

  // Booking Status
  status: 'planned' | 'booking_required' | 'booked' | 'confirmed';
  bookingNotes?: string;
}
```

**Algorithm:**

```typescript
function calculateFTE(
  phase: Phase,
  skillsetReqs: SkillsetRequirement,
  config: ProjectConfig
): FTECalculation {
  const totalEffort = phase.effort || 0;
  const duration = phase.workingDays || 0;

  // 1. Calculate raw FTE required
  const rawFTE = totalEffort / duration;

  // 2. Adjust for realistic utilization (not 100%)
  const adjustedFTE = rawFTE / (config.standardUtilization / 100);

  // 3. Break down by role based on skillset catalog
  const resourceBookings: ResourceBooking[] = [];

  const phaseType = getPhaseType(phase.category); // blueprint | configuration | testing | cutover
  const requirements = skillsetReqs.requirements[phaseType];

  requirements.forEach(req => {
    const effortDays = (totalEffort * req.effortPercent) / 100;
    const fte = effortDays / duration;
    const headcount = Math.ceil(fte); // Round up for booking

    resourceBookings.push({
      role: req.role,
      skillsets: req.skillset,
      effortDays,
      allocationPercent: req.allocationPercent,
      startDate: phase.startDate,
      endDate: phase.endDate,
      workingDays: duration,
      fte,
      headcount,
      utilizationPercent: (fte / headcount) * 100,
      hourlyRate: getRateForRole(req.role, config.region),
      totalCost: calculateCost(effortDays, req.role, config.region),
      status: 'planned',
    });
  });

  // 4. Detect warnings
  const warnings: string[] = [];
  const totalHeadcount = resourceBookings.reduce((sum, rb) => sum + rb.headcount, 0);

  if (adjustedFTE > duration * 3) {
    warnings.push(`High FTE requirement (${adjustedFTE.toFixed(1)}) - consider parallel workstreams`);
  }

  if (totalHeadcount < 2) {
    warnings.push(`Single-person dependency risk - recommend minimum 2 resources`);
  }

  resourceBookings.forEach(rb => {
    if (rb.utilizationPercent < 50) {
      warnings.push(`${rb.role} under-utilized (${rb.utilizationPercent}%) - consider part-time`);
    }
    if (rb.utilizationPercent > 90) {
      warnings.push(`${rb.role} over-allocated (${rb.utilizationPercent}%) - add resource or extend duration`);
    }
  });

  return {
    phaseId: phase.id,
    phaseName: phase.name,
    totalEffort,
    phaseDuration: duration,
    requiredFTE: rawFTE,
    adjustedFTE,
    resourceBookings,
    warnings,
    recommendations: generateRecommendations(resourceBookings, warnings),
  };
}
```

---

### 4. Deliverable Tracker (`deliverable-catalog.ts`)

**Purpose:** Define clear deliverables per phase for client accountability

```typescript
interface PhaseDeliverable {
  id: string;
  phaseId: string;
  category: string; // Phase category (e.g., "FICO - Blueprint")

  // Deliverable Details
  name: string;
  description: string;
  type: 'Document' | 'Configuration' | 'Code' | 'Test Results' | 'Training' | 'Data';

  // Timing
  dueDate: Date; // Relative to phase end
  isMilestone: boolean; // Client-facing milestone?

  // Quality Gates
  acceptanceCriteria: string[];
  reviewers: string[]; // Roles required for sign-off

  // Status
  status: 'not-started' | 'in-progress' | 'review' | 'approved' | 'delivered';
  completionPercent: number;

  // Traceability
  linkedRequirements: string[]; // Chip IDs or requirement IDs
  linkedRisks: string[];
}
```

**Example Deliverables for FICO Blueprint Phase:**

```typescript
const FICO_BLUEPRINT_DELIVERABLES: PhaseDeliverable[] = [
  {
    id: 'fico-bp-001',
    name: 'Chart of Accounts Design',
    description: 'Complete GL account structure with cost center hierarchy',
    type: 'Document',
    isMilestone: true,
    acceptanceCriteria: [
      'All GL accounts mapped to financial statement items',
      'Cost center hierarchy approved by Finance',
      'Profit center structure defined',
      'Segment reporting structure confirmed'
    ],
    reviewers: ['Module Lead', 'Solution Architect', 'Client CFO'],
  },

  {
    id: 'fico-bp-002',
    name: 'Financial Close Process Design',
    description: 'Month-end and year-end close procedures with timelines',
    type: 'Document',
    isMilestone: true,
    acceptanceCriteria: [
      'Day-by-day close calendar defined',
      'Automated vs manual tasks identified',
      'Approver workflows mapped',
      'Close timeline targets set (e.g., 3 business days)'
    ],
    reviewers: ['Module Lead', 'Client Finance Manager'],
  },

  {
    id: 'fico-bp-003',
    name: 'Integration Touch Points',
    description: 'All integration points with MM, SD, AA, CO modules',
    type: 'Document',
    isMilestone: false,
    acceptanceCriteria: [
      'Posting logic for MM (GR/IR)',
      'Revenue recognition from SD',
      'Asset capitalization from AA',
      'Cost allocation from CO'
    ],
    reviewers: ['Solution Architect', 'Integration Lead'],
  },

  {
    id: 'fico-bp-004',
    name: 'Reporting Requirements',
    description: 'All financial reports (standard + custom)',
    type: 'Document',
    isMilestone: true,
    acceptanceCriteria: [
      'P&L format agreed',
      'Balance sheet format agreed',
      'Cash flow statement design',
      'Management reporting package defined',
      'Regulatory reports identified (tax, audit)'
    ],
    reviewers: ['Module Lead', 'Client CFO', 'Client Controller'],
  }
];
```

---

### 5. Methodology Breakdown (`methodology-split.ts`)

**Purpose:** Show clients exactly how effort is spent using SAP Activate methodology

```typescript
interface MethodologyBreakdown {
  phaseId: string;
  totalEffort: number; // mandays

  // SAP Activate Work Packages
  workPackages: {
    workshops: WorkPackage;
    design: WorkPackage;
    configuration: WorkPackage;
    development: WorkPackage;
    testing: WorkPackage;
    dataPreparation: WorkPackage;
    training: WorkPackage;
    cutover: WorkPackage;
    projectManagement: WorkPackage;
  };

  // Visualization data
  chartData: {
    labels: string[];
    values: number[];
    colors: string[];
  };
}

interface WorkPackage {
  name: string;
  effortPercent: number; // % of phase effort
  effortDays: number; // Calculated mandays
  activities: string[]; // List of activities
  roles: string[]; // Who does this work
  deliverables: string[]; // What's produced
}
```

**Methodology Templates by Phase Type:**

```typescript
const BLUEPRINT_METHODOLOGY: MethodologyBreakdown = {
  workshops: {
    name: 'Workshops & Requirements Gathering',
    effortPercent: 30,
    activities: [
      'Business process workshops',
      'As-is process documentation',
      'To-be process design',
      'Fit-gap analysis',
      'Solution validation sessions'
    ],
    roles: ['Module Lead', 'Senior Consultant', 'Business Analyst'],
    deliverables: ['Workshop protocols', 'Process flows', 'Fit-gap analysis']
  },

  design: {
    name: 'Solution Design',
    effortPercent: 35,
    activities: [
      'Technical design documents',
      'Integration design',
      'Data model design',
      'Security role design',
      'Custom object design'
    ],
    roles: ['Solution Architect', 'Module Lead', 'Technical Architect'],
    deliverables: ['Solution design document', 'Technical specifications', 'Interface specs']
  },

  configuration: {
    name: 'Prototype Configuration',
    effortPercent: 20,
    activities: [
      'Build proof-of-concept',
      'Configure key scenarios',
      'Demo preparation',
      'Client validation'
    ],
    roles: ['Senior Consultant', 'Consultant'],
    deliverables: ['Working prototype', 'Demo scenarios', 'Validation report']
  },

  projectManagement: {
    name: 'Project Management',
    effortPercent: 15,
    activities: [
      'Status reporting',
      'Risk management',
      'Change management',
      'Stakeholder coordination',
      'Quality assurance'
    ],
    roles: ['Project Manager', 'PMO'],
    deliverables: ['Status reports', 'Risk register', 'Change logs']
  }
};

const REALIZE_METHODOLOGY: MethodologyBreakdown = {
  configuration: {
    name: 'System Configuration',
    effortPercent: 35,
    activities: [
      'Full configuration per blueprint',
      'Master data setup',
      'Workflow configuration',
      'Authorization setup',
      'Integration configuration'
    ],
    roles: ['Module Lead', 'Senior Consultant', 'Consultant'],
    deliverables: ['Configured system', 'Configuration documentation', 'Unit test results']
  },

  development: {
    name: 'Custom Development',
    effortPercent: 25,
    activities: [
      'Custom reports development',
      'Form customization',
      'Enhancement development',
      'Interface development',
      'Code reviews'
    ],
    roles: ['Developer', 'Technical Architect'],
    deliverables: ['Custom code', 'Technical documentation', 'Code review reports']
  },

  testing: {
    name: 'Integration Testing',
    effortPercent: 20,
    activities: [
      'End-to-end scenario testing',
      'Integration testing',
      'Performance testing',
      'Defect fixing',
      'Regression testing'
    ],
    roles: ['QA Lead', 'Senior Consultant', 'Developer'],
    deliverables: ['Test cases', 'Test results', 'Defect log', 'Sign-off']
  },

  dataPreparation: {
    name: 'Data Migration Prep',
    effortPercent: 10,
    activities: [
      'Data mapping',
      'Data cleansing rules',
      'Migration scripts',
      'Mock data loads',
      'Data validation'
    ],
    roles: ['Data Migration Specialist', 'Consultant'],
    deliverables: ['Data migration plan', 'Migration scripts', 'Data quality report']
  },

  projectManagement: {
    name: 'Project Management',
    effortPercent: 10,
    activities: [
      'Sprint planning',
      'Daily standups',
      'Status reporting',
      'Issue resolution',
      'Stakeholder management'
    ],
    roles: ['Project Manager', 'Scrum Master'],
    deliverables: ['Sprint reports', 'Burndown charts', 'Status updates']
  }
};
```

---

### 6. Client Proposal View (`proposal-generator.ts`)

**Purpose:** Generate clean, client-facing proposal with cost justification

```typescript
interface ClientProposal {
  // Project Summary
  projectName: string;
  clientName: string;
  proposalDate: Date;
  validUntil: Date;

  // Timeline
  startDate: Date;
  endDate: Date;
  totalDuration: number; // calendar days
  totalWorkingDays: number;

  // Scope Summary
  sapModules: string[]; // e.g., ["SAP FICO", "SAP MM", "SAP SD"]
  keyCapabilities: string[];
  integrations: string[];

  // Investment Summary
  totalInvestment: number;
  currency: string;
  breakdown: CostBreakdown[];

  // Team Composition
  teamComposition: TeamSummary[];

  // Deliverables & Milestones
  keyDeliverables: DeliverableSummary[];
  milestones: MilestoneSummary[];

  // Methodology
  methodology: string; // "SAP Activate"
  methodologyPhases: string[];

  // Assumptions & Exclusions
  assumptions: string[];
  exclusions: string[];

  // Risk Mitigation
  risks: RiskSummary[];
}

interface CostBreakdown {
  category: string; // "Blueprint Phase", "Realization Phase", etc.
  description: string;
  effort: number; // mandays
  duration: number; // working days
  teamSize: number; // average FTE
  cost: number;
  percentOfTotal: number;

  // What client gets
  deliverables: string[];
  value: string; // Business value description
}

interface TeamSummary {
  role: string;
  skillsets: string[];
  count: number; // headcount
  allocation: string; // "Full-time" | "Part-time (50%)"
  phases: string[]; // Which phases they work on

  // Optional: Senior profiles
  seniorityLevel: 'Principal' | 'Senior' | 'Mid-level' | 'Junior';
  yearsOfExperience: string; // "8-10 years"
}

interface DeliverableSummary {
  name: string;
  description: string;
  dueDate: Date;
  phase: string;
  acceptanceCriteria: string[];
}

interface MilestoneSummary {
  name: string;
  date: Date;
  significance: string; // Why this matters to client
  approvals: string[]; // Who needs to sign off
}

interface RiskSummary {
  risk: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}
```

**Example Proposal Section:**

```markdown
## Investment Breakdown

### Phase 1: Prepare - Discovery & Blueprint (8 weeks)
**Investment:** $240,000 | **Effort:** 120 mandays | **Team:** 3 FTE

**What You Get:**
- Complete business process designs for Finance, Procurement, and Sales
- Chart of Accounts with cost center hierarchy
- Solution architecture with integration design
- Fit-gap analysis with configuration approach
- Prototype demonstration of key scenarios
- Project plan with resource allocation

**Deliverables:**
- Solution Design Document
- Business Blueprint
- Fit-Gap Analysis
- Technical Architecture Document
- Integration Specification
- Project Plan

**Team:**
- Solution Architect (Part-time, 50%)
- FICO Module Lead (Full-time)
- MM Module Lead (Full-time)
- SD Module Lead (Full-time)
- Technical Architect (Part-time, 25%)
- Project Manager (Part-time, 50%)

---

### Phase 2: Explore - Realize Configuration (16 weeks)
**Investment:** $640,000 | **Effort:** 320 mandays | **Team:** 5 FTE

**What You Get:**
- Fully configured SAP S/4HANA system
- Custom reports and forms as per requirements
- Master data templates and migration scripts
- Integration with existing systems (HR, CRM)
- End-to-end tested business scenarios
- User training materials

**Deliverables:**
- Configured SAP system (Development environment)
- Custom development code
- Integration middleware
- Test cases and test results
- Training materials
- Migration plan

**Team:**
- Module Leads (3 full-time)
- Senior Consultants (4 full-time)
- ABAP Developers (2 full-time)
- Technical Architect (Part-time, 50%)
- Data Migration Specialist (Full-time)
- QA Lead (Full-time)
- Project Manager (Full-time)
```

---

## UI Components to Build

### 1. **Project Start Date Picker** (Timeline Header)
```typescript
<ProjectStartDatePicker
  currentStartDate={projectConfig.projectStartDate}
  region={projectConfig.region}
  holidays={getHolidaysInRange(...)}
  onChange={(newDate) => {
    // Recalculate all phases
    updateProjectStartDate(newDate);
  }}
  warningIfWeekend={true}
  warningIfHoliday={true}
  suggestNextWorkingDay={true}
/>
```

### 2. **Skillset Intelligence Panel** (Per Phase)
```typescript
<SkillsetPanel
  phase={selectedPhase}
  sapModules={selectedPackages}
  skillsetReqs={getSkillsetRequirements(phase, sapModules)}
  onResourceAdd={(role, skillsets) => addResourceWithSkillset(role, skillsets)}
/>
```

Shows:
- Required skillsets for this phase
- Criticality (must-have vs recommended)
- Current allocation vs requirement
- Warnings if missing critical skillsets

### 3. **FTE Calculator** (Resource Panel)
```typescript
<FTECalculator
  phase={selectedPhase}
  fteCalculation={calculateFTE(phase, ...)}
  onOptimize={(optimization) => applyOptimization(optimization)}
/>
```

Shows:
- Total FTE required
- Booking recommendations (X people for Y days)
- Utilization heatmap
- Over/under allocation warnings
- Cost per resource

### 4. **Methodology Breakdown** (Phase Details)
```typescript
<MethodologyChart
  phase={selectedPhase}
  breakdown={getMethodologyBreakdown(phase)}
  type="donut" // or "bar"
/>
```

Shows:
- Pie chart of effort distribution
- Workshops, Design, Config, Testing, PM, etc.
- Hover shows activities and deliverables

### 5. **Deliverable Checklist** (Phase Tracking)
```typescript
<DeliverableTracker
  phase={selectedPhase}
  deliverables={getPhaseDeliverables(phase)}
  onStatusChange={(deliverableId, newStatus) => updateDeliverableStatus(...)}
/>
```

Shows:
- Checklist of phase deliverables
- Due dates relative to phase end
- Acceptance criteria
- Approval status
- Milestone indicators

### 6. **Client Proposal Generator** (Export)
```typescript
<ProposalExporter
  project={project}
  timeline={timeline}
  format="PDF" // or "DOCX" or "Presentation"
  template="executive-summary" // or "detailed-proposal"
  onGenerate={(proposal) => downloadProposal(proposal)}
/>
```

Generates:
- Executive summary (1-page)
- Detailed proposal (15-30 pages)
- Client presentation (PowerPoint)
- Cost justification with deliverables

---

## Data Flow

```
User selects SAP modules (FICO, MM, SD)
        ↓
ScenarioGenerator creates phases
        ↓
SkillsetCatalog determines required roles per phase
        ↓
FTECalculator optimizes resource allocation
        ↓
MethodologyBreakdown splits effort into work packages
        ↓
DeliverableCatalog assigns deliverables per phase
        ↓
ProposalGenerator creates client-facing document
        ↓
PM exports and presents to client
```

---

## Implementation Priority

### 🔥 **Phase 1: Core Intelligence (Week 1-2)**
1. ✅ Project config store with start date picker
2. ✅ Skillset catalog (basic - 5 modules: FICO, MM, SD, HCM, Basis)
3. ✅ FTE calculator with booking recommendations

### 🎯 **Phase 2: PM Tools (Week 3-4)**
4. ✅ Deliverable catalog with tracking UI
5. ✅ Methodology breakdown with visualization
6. ✅ Resource panel with skillset intelligence

### 🚀 **Phase 3: Client Experience (Week 5-6)**
7. ✅ Proposal generator (MVP: PDF export)
8. ✅ Client view mode (simplified timeline + deliverables)
9. ✅ Cost justification views

---

## Success Metrics

A **real project manager** can:
1. ✅ Set project start date and see accurate timeline
2. ✅ Know exactly which skillsets are needed for each SAP module
3. ✅ Calculate how many people to book and for how long
4. ✅ Track deliverables with clear acceptance criteria
5. ✅ Explain to clients what they're paying for
6. ✅ Export a professional proposal in 5 minutes
7. ✅ See utilization warnings and optimize allocation
8. ✅ Understand work breakdown (30% workshops, 40% config, etc.)

---

## Technical Notes

### Holiday-Aware Scheduling
- Already implemented: `addWorkingDays()`, `calculateWorkingDays()`, `isHoliday()`
- Extend: Allow custom project start date (not hardcoded to Jan 1, 2024)
- Enhance: Show holiday markers on timeline with tooltips

### Resource Optimization
- Current: Simple allocation % per resource
- Enhance: FTE-based booking with utilization targets
- Add: Over-allocation detection and warnings

### Cost Calculation
- Current: `hourlyRate × allocation × days × 8 hours`
- Enhance: Add margin calculation, currency conversion, cost breakdown by deliverable

### Data Model Changes
- Add `projectConfig` to project-store
- Add `skillsets: string[]` to Resource type
- Add `deliverables: PhaseDeliverable[]` to Phase type
- Add `methodologyBreakdown: MethodologyBreakdown` to Phase type

---

## End Goal

**From this:** "Here's a Gantt chart with colored bars"

**To this:** "Here's your complete project plan with:
- Start date: March 15, 2025 (avoiding CNY holidays)
- 247 working days across 6 modules
- 8.5 FTE required (12 people with optimized allocation)
- $1.2M investment with 25% margin
- 87 deliverables tracked across 12 milestones
- Clear methodology: 30% design, 35% config, 20% testing
- Resource booking list for procurement
- Client proposal ready to present"

**That's** what Steve Jobs would ship. That's what real PMs need.
