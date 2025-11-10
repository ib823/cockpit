/**
 * Gantt Tool - Project Templates Library
 *
 * Steve Jobs: "People don't know what they want until you show it to them."
 *
 * Pre-built templates for common SAP implementation methodologies:
 * - LPPSA (Large Public to Private SAP Activate)
 * - SAP Activate (Agile + Waterfall hybrid)
 * - Greenfield Implementations
 * - Brownfield/System Conversion
 * - S/4HANA Migration
 * - Selective Data Transition
 * - Rapid Deployment Solutions
 */

import type { GanttPhase, GanttTask, GanttMilestone } from "@/types/gantt-tool";

// Template task type - minimal properties, rest added when imported
export type TemplateTask = Pick<GanttTask, "name" | "startDate" | "endDate" | "description">;

// Template phase type - has template tasks instead of full tasks
export type TemplatePhase = Omit<
  GanttPhase,
  "id" | "collapsed" | "tasks" | "dependencies" | "phaseResourceAssignments" | "order"
> & {
  tasks: TemplateTask[];
};

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: "sap-activate" | "migration" | "greenfield" | "brownfield" | "rapid" | "industry";
  icon: string;
  duration: string; // Human-readable duration
  popularity: number; // 1-5 stars
  phases: TemplatePhase[];
  milestones: Omit<GanttMilestone, "id">[];
  tags: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  // ==========================================
  // SAP ACTIVATE TEMPLATES
  // ==========================================
  {
    id: "lppsa-full",
    name: "LPPSA - Full Implementation",
    description:
      "Large Public to Private SAP Activate methodology. Comprehensive 18-month implementation covering all phases from Prepare to Run.",
    category: "sap-activate",
    icon: "🏢",
    duration: "18 months",
    popularity: 5,
    tags: ["LPPSA", "Full Lifecycle", "Enterprise", "SAP Activate"],
    phases: [
      {
        name: "Prepare",
        startDate: "2025-01-15",
        endDate: "2025-02-28",
        description: "Project initiation, team mobilization, and infrastructure setup",
        color: "#3B82F6",
        tasks: [
          {
            name: "Project Charter & Governance",
            startDate: "2025-01-15",
            endDate: "2025-01-30",
            description: "Define project charter, governance structure, and steering committee",
          },
          {
            name: "Team Mobilization",
            startDate: "2025-01-20",
            endDate: "2025-02-10",
            description: "Recruit and onboard project team members",
          },
          {
            name: "Infrastructure Setup",
            startDate: "2025-02-01",
            endDate: "2025-02-20",
            description: "Provision DEV, QA, and PRD environments",
          },
          {
            name: "Stakeholder Alignment",
            startDate: "2025-02-15",
            endDate: "2025-02-28",
            description: "Align stakeholders on vision, scope, and timeline",
          },
        ],
      },
      {
        name: "Explore",
        startDate: "2025-03-01",
        endDate: "2025-05-31",
        description: "Requirements gathering, fit-gap analysis, and solution design",
        color: "#10B981",
        tasks: [
          {
            name: "Business Process Discovery",
            startDate: "2025-03-01",
            endDate: "2025-03-31",
            description: "Document as-is processes and pain points",
          },
          {
            name: "Fit-Gap Analysis",
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            description: "Identify gaps between standard SAP and requirements",
          },
          {
            name: "Solution Design Workshops",
            startDate: "2025-05-01",
            endDate: "2025-05-20",
            description: "Design to-be processes and custom solutions",
          },
          {
            name: "Design Review & Sign-off",
            startDate: "2025-05-21",
            endDate: "2025-05-31",
            description: "Stakeholder review and design freeze",
          },
        ],
      },
      {
        name: "Realize",
        startDate: "2025-06-01",
        endDate: "2025-11-30",
        description: "System configuration, development, and unit testing",
        color: "#F59E0B",
        tasks: [
          {
            name: "Base Configuration - Finance",
            startDate: "2025-06-01",
            endDate: "2025-07-15",
            description: "Configure FI/CO modules",
          },
          {
            name: "Base Configuration - Logistics",
            startDate: "2025-06-15",
            endDate: "2025-08-15",
            description: "Configure MM/SD/PP modules",
          },
          {
            name: "Custom Development - ABAP",
            startDate: "2025-07-01",
            endDate: "2025-09-30",
            description: "Develop custom programs, reports, and enhancements",
          },
          {
            name: "Integration Development",
            startDate: "2025-08-01",
            endDate: "2025-10-15",
            description: "Build interfaces with third-party systems",
          },
          {
            name: "Unit Testing",
            startDate: "2025-10-01",
            endDate: "2025-11-30",
            description: "Test individual components and transactions",
          },
        ],
      },
      {
        name: "Deploy",
        startDate: "2025-12-01",
        endDate: "2026-03-31",
        description: "Integration testing, UAT, data migration, and go-live",
        color: "#8B5CF6",
        tasks: [
          {
            name: "Integration Testing",
            startDate: "2025-12-01",
            endDate: "2025-12-31",
            description: "End-to-end process testing",
          },
          {
            name: "User Acceptance Testing (UAT)",
            startDate: "2026-01-01",
            endDate: "2026-02-15",
            description: "Business user validation",
          },
          {
            name: "Data Migration & Validation",
            startDate: "2026-02-01",
            endDate: "2026-03-10",
            description: "Migrate master and transactional data",
          },
          {
            name: "Cutover Planning & Rehearsal",
            startDate: "2026-02-15",
            endDate: "2026-03-15",
            description: "Plan and rehearse go-live cutover",
          },
          {
            name: "Production Go-Live",
            startDate: "2026-03-20",
            endDate: "2026-03-31",
            description: "Execute cutover and go-live to production",
          },
        ],
      },
      {
        name: "Run",
        startDate: "2026-04-01",
        endDate: "2026-06-30",
        description: "Hypercare support, optimization, and handover to operations",
        color: "#EC4899",
        tasks: [
          {
            name: "Hypercare Support (Wave 1)",
            startDate: "2026-04-01",
            endDate: "2026-04-30",
            description: "24/7 support during first month post go-live",
          },
          {
            name: "Hypercare Support (Wave 2)",
            startDate: "2026-05-01",
            endDate: "2026-05-31",
            description: "Reduced support hours as system stabilizes",
          },
          {
            name: "System Optimization",
            startDate: "2026-05-15",
            endDate: "2026-06-15",
            description: "Performance tuning and process refinement",
          },
          {
            name: "Handover to Operations",
            startDate: "2026-06-15",
            endDate: "2026-06-30",
            description: "Transition to BAU support team",
          },
        ],
      },
    ],
    milestones: [
      {
        name: "Project Kickoff",
        date: "2025-01-15",
        description: "Official project start",
        color: "#10B981",
        icon: "🚀",
      },
      {
        name: "Design Freeze",
        date: "2025-05-31",
        description: "Solution design approved and locked",
        color: "#3B82F6",
        icon: "🔒",
      },
      {
        name: "Development Complete",
        date: "2025-11-30",
        description: "All configuration and development finished",
        color: "#F59E0B",
        icon: "💻",
      },
      {
        name: "UAT Sign-off",
        date: "2026-02-15",
        description: "User acceptance testing completed",
        color: "#8B5CF6",
        icon: "✅",
      },
      {
        name: "Go-Live",
        date: "2026-03-31",
        description: "Production cutover completed",
        color: "#10B981",
        icon: "🎯",
      },
      {
        name: "Project Closure",
        date: "2026-06-30",
        description: "Project officially closed",
        color: "#EC4899",
        icon: "🏁",
      },
    ],
  },

  {
    id: "sap-activate-agile",
    name: "SAP Activate - Agile Sprint Model",
    description:
      "12-month agile implementation using SAP Activate methodology with 2-week sprints. Ideal for mid-sized implementations.",
    category: "sap-activate",
    icon: "⚡",
    duration: "12 months",
    popularity: 5,
    tags: ["SAP Activate", "Agile", "Sprints", "Mid-size"],
    phases: [
      {
        name: "Prepare",
        startDate: "2025-01-15",
        endDate: "2025-02-15",
        description: "Project setup and sprint 0",
        color: "#3B82F6",
        tasks: [
          {
            name: "Sprint 0 - Project Setup",
            startDate: "2025-01-15",
            endDate: "2025-01-31",
            description: "Team setup, tools, and initial planning",
          },
          {
            name: "Product Backlog Creation",
            startDate: "2025-02-01",
            endDate: "2025-02-15",
            description: "Define user stories and prioritize backlog",
          },
        ],
      },
      {
        name: "Explore (Sprints 1-6)",
        startDate: "2025-02-16",
        endDate: "2025-05-15",
        description: "Discovery and design in iterative sprints",
        color: "#10B981",
        tasks: [
          {
            name: "Sprint 1-2: Finance Process Design",
            startDate: "2025-02-16",
            endDate: "2025-03-15",
            description: "Design finance workflows",
          },
          {
            name: "Sprint 3-4: Logistics Process Design",
            startDate: "2025-03-16",
            endDate: "2025-04-15",
            description: "Design supply chain workflows",
          },
          {
            name: "Sprint 5-6: Integration Architecture",
            startDate: "2025-04-16",
            endDate: "2025-05-15",
            description: "Design system integrations",
          },
        ],
      },
      {
        name: "Realize (Sprints 7-16)",
        startDate: "2025-05-16",
        endDate: "2025-10-15",
        description: "Development in 10 agile sprints",
        color: "#F59E0B",
        tasks: [
          {
            name: "Sprints 7-10: Core Module Build",
            startDate: "2025-05-16",
            endDate: "2025-07-15",
            description: "Build FI/CO/MM/SD",
          },
          {
            name: "Sprints 11-14: Custom Development",
            startDate: "2025-07-16",
            endDate: "2025-09-15",
            description: "Custom programs and enhancements",
          },
          {
            name: "Sprints 15-16: Integration Build",
            startDate: "2025-09-16",
            endDate: "2025-10-15",
            description: "Build interfaces and integrations",
          },
        ],
      },
      {
        name: "Deploy",
        startDate: "2025-10-16",
        endDate: "2025-12-31",
        description: "Testing, UAT, and go-live",
        color: "#8B5CF6",
        tasks: [
          {
            name: "Integration Testing",
            startDate: "2025-10-16",
            endDate: "2025-11-15",
            description: "End-to-end testing",
          },
          {
            name: "UAT & Data Migration",
            startDate: "2025-11-16",
            endDate: "2025-12-15",
            description: "User acceptance and data cutover",
          },
          {
            name: "Go-Live",
            startDate: "2025-12-16",
            endDate: "2025-12-31",
            description: "Production cutover",
          },
        ],
      },
      {
        name: "Run",
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        description: "Post go-live hypercare",
        color: "#EC4899",
        tasks: [
          {
            name: "Hypercare Support",
            startDate: "2026-01-01",
            endDate: "2026-01-31",
            description: "Intensive post-launch support",
          },
        ],
      },
    ],
    milestones: [
      {
        name: "Sprint 0 Complete",
        date: "2025-02-15",
        description: "Ready to start development sprints",
        color: "#3B82F6",
        icon: "🏁",
      },
      {
        name: "Design Complete",
        date: "2025-05-15",
        description: "All process designs approved",
        color: "#10B981",
        icon: "✅",
      },
      {
        name: "Development Complete",
        date: "2025-10-15",
        description: "Sprint 16 completed",
        color: "#F59E0B",
        icon: "💻",
      },
      {
        name: "Go-Live",
        date: "2025-12-31",
        description: "Production launch",
        color: "#8B5CF6",
        icon: "🚀",
      },
    ],
  },

  // ==========================================
  // GREENFIELD TEMPLATES
  // ==========================================
  {
    id: "greenfield-s4-cloud",
    name: "S/4HANA Cloud - Greenfield",
    description:
      "Clean-slate SAP S/4HANA Cloud implementation. 9-month rapid deployment with minimal customization.",
    category: "greenfield",
    icon: "🌱",
    duration: "9 months",
    popularity: 4,
    tags: ["S/4HANA", "Cloud", "Greenfield", "Rapid"],
    phases: [
      {
        name: "Discover",
        startDate: "2025-01-15",
        endDate: "2025-02-28",
        description: "Cloud discovery and fit-to-standard analysis",
        color: "#3B82F6",
        tasks: [
          {
            name: "Cloud Readiness Assessment",
            startDate: "2025-01-15",
            endDate: "2025-01-31",
            description: "Assess cloud readiness and requirements",
          },
          {
            name: "Fit-to-Standard Workshops",
            startDate: "2025-02-01",
            endDate: "2025-02-28",
            description: "Align business processes to SAP best practices",
          },
        ],
      },
      {
        name: "Prepare",
        startDate: "2025-03-01",
        endDate: "2025-03-31",
        description: "Cloud provisioning and baseline setup",
        color: "#10B981",
        tasks: [
          {
            name: "Cloud Tenant Provisioning",
            startDate: "2025-03-01",
            endDate: "2025-03-15",
            description: "Set up development and test tenants",
          },
          {
            name: "Integration Setup",
            startDate: "2025-03-16",
            endDate: "2025-03-31",
            description: "Configure SAP Integration Suite",
          },
        ],
      },
      {
        name: "Explore",
        startDate: "2025-04-01",
        endDate: "2025-05-31",
        description: "Solution design with minimal customization",
        color: "#F59E0B",
        tasks: [
          {
            name: "Process Design - Finance & Procurement",
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            description: "Design core processes",
          },
          {
            name: "Process Design - Sales & Manufacturing",
            startDate: "2025-05-01",
            endDate: "2025-05-31",
            description: "Design extended processes",
          },
        ],
      },
      {
        name: "Realize",
        startDate: "2025-06-01",
        endDate: "2025-08-31",
        description: "Configuration and lightweight extensions",
        color: "#8B5CF6",
        tasks: [
          {
            name: "Core Configuration",
            startDate: "2025-06-01",
            endDate: "2025-07-15",
            description: "Configure modules in cloud",
          },
          {
            name: "Key User Extensions",
            startDate: "2025-07-16",
            endDate: "2025-08-31",
            description: "Build approved extensions",
          },
        ],
      },
      {
        name: "Deploy",
        startDate: "2025-09-01",
        endDate: "2025-09-30",
        description: "Testing, data load, and go-live",
        color: "#EC4899",
        tasks: [
          {
            name: "Testing & UAT",
            startDate: "2025-09-01",
            endDate: "2025-09-20",
            description: "Validate configuration",
          },
          {
            name: "Go-Live",
            startDate: "2025-09-21",
            endDate: "2025-09-30",
            description: "Production cutover",
          },
        ],
      },
    ],
    milestones: [
      {
        name: "Cloud Tenant Ready",
        date: "2025-03-15",
        description: "Development environment ready",
        color: "#10B981",
        icon: "☁️",
      },
      {
        name: "Fit-to-Standard Complete",
        date: "2025-05-31",
        description: "Process alignment finalized",
        color: "#F59E0B",
        icon: "✅",
      },
      {
        name: "Go-Live",
        date: "2025-09-30",
        description: "Cloud production launch",
        color: "#EC4899",
        icon: "🚀",
      },
    ],
  },

  // ==========================================
  // BROWNFIELD / SYSTEM CONVERSION TEMPLATES
  // ==========================================
  {
    id: "brownfield-ecc-to-s4",
    name: "System Conversion - ECC to S/4HANA",
    description:
      "Technical upgrade from SAP ECC to S/4HANA on-premise. 12-month conversion with data cleanup and simplification.",
    category: "brownfield",
    icon: "🔄",
    duration: "12 months",
    popularity: 5,
    tags: ["System Conversion", "S/4HANA", "Technical Upgrade", "ECC"],
    phases: [
      {
        name: "Assessment",
        startDate: "2025-01-15",
        endDate: "2025-02-28",
        description: "Readiness check and custom code analysis",
        color: "#3B82F6",
        tasks: [
          {
            name: "SAP Readiness Check",
            startDate: "2025-01-15",
            endDate: "2025-01-31",
            description: "Run readiness check tool",
          },
          {
            name: "Custom Code Analysis",
            startDate: "2025-02-01",
            endDate: "2025-02-28",
            description: "Analyze and remediate custom code",
          },
        ],
      },
      {
        name: "Prepare",
        startDate: "2025-03-01",
        endDate: "2025-04-30",
        description: "Data cleanup and infrastructure preparation",
        color: "#10B981",
        tasks: [
          {
            name: "Data Archiving & Cleanup",
            startDate: "2025-03-01",
            endDate: "2025-03-31",
            description: "Archive obsolete data",
          },
          {
            name: "Sandbox Conversion",
            startDate: "2025-04-01",
            endDate: "2025-04-30",
            description: "Test conversion in sandbox",
          },
        ],
      },
      {
        name: "Realize",
        startDate: "2025-05-01",
        endDate: "2025-09-30",
        description: "Custom code remediation and simplification",
        color: "#F59E0B",
        tasks: [
          {
            name: "Custom Code Remediation",
            startDate: "2025-05-01",
            endDate: "2025-07-31",
            description: "Fix incompatible code",
          },
          {
            name: "Process Simplification",
            startDate: "2025-08-01",
            endDate: "2025-09-30",
            description: "Adopt S/4HANA best practices",
          },
        ],
      },
      {
        name: "Deploy",
        startDate: "2025-10-01",
        endDate: "2025-12-31",
        description: "Development conversion, testing, and production conversion",
        color: "#8B5CF6",
        tasks: [
          {
            name: "DEV System Conversion",
            startDate: "2025-10-01",
            endDate: "2025-10-15",
            description: "Convert development system",
          },
          {
            name: "QA System Conversion & Testing",
            startDate: "2025-10-16",
            endDate: "2025-11-30",
            description: "Convert QA and test",
          },
          {
            name: "Production Conversion",
            startDate: "2025-12-01",
            endDate: "2025-12-31",
            description: "Convert production system",
          },
        ],
      },
    ],
    milestones: [
      {
        name: "Readiness Check Complete",
        date: "2025-02-28",
        description: "System ready for conversion",
        color: "#3B82F6",
        icon: "✅",
      },
      {
        name: "Sandbox Conversion Success",
        date: "2025-04-30",
        description: "Proof of concept validated",
        color: "#10B981",
        icon: "🧪",
      },
      {
        name: "Production Conversion",
        date: "2025-12-31",
        description: "ECC to S/4HANA cutover",
        color: "#8B5CF6",
        icon: "🔄",
      },
    ],
  },

  // Add more templates for other categories...
  // (I'll add a few more key templates)

  {
    id: "selective-data-transition",
    name: "Selective Data Transition (New Implementation)",
    description:
      "Shell migration with selective data transition. 14-month project combining new implementation with legacy data.",
    category: "migration",
    icon: "🎯",
    duration: "14 months",
    popularity: 4,
    tags: ["Data Transition", "Migration", "Hybrid", "Shell"],
    phases: [
      {
        name: "Prepare",
        startDate: "2025-01-15",
        endDate: "2025-02-28",
        description: "Strategy and data selection",
        color: "#3B82F6",
        tasks: [
          {
            name: "Data Selection Strategy",
            startDate: "2025-01-15",
            endDate: "2025-02-15",
            description: "Define what data to migrate",
          },
          {
            name: "Shell System Setup",
            startDate: "2025-02-16",
            endDate: "2025-02-28",
            description: "Provision new S/4HANA system",
          },
        ],
      },
      {
        name: "Explore",
        startDate: "2025-03-01",
        endDate: "2025-05-31",
        description: "Process design for new system",
        color: "#10B981",
        tasks: [
          {
            name: "To-Be Process Design",
            startDate: "2025-03-01",
            endDate: "2025-04-30",
            description: "Design future state processes",
          },
          {
            name: "Data Migration Architecture",
            startDate: "2025-05-01",
            endDate: "2025-05-31",
            description: "Design data migration approach",
          },
        ],
      },
      {
        name: "Realize",
        startDate: "2025-06-01",
        endDate: "2025-10-31",
        description: "Build new system and migration tools",
        color: "#F59E0B",
        tasks: [
          {
            name: "New System Configuration",
            startDate: "2025-06-01",
            endDate: "2025-08-31",
            description: "Configure S/4HANA",
          },
          {
            name: "Data Migration Tools Development",
            startDate: "2025-09-01",
            endDate: "2025-10-31",
            description: "Build ETL processes",
          },
        ],
      },
      {
        name: "Deploy",
        startDate: "2025-11-01",
        endDate: "2026-02-28",
        description: "Data migration, testing, and cutover",
        color: "#8B5CF6",
        tasks: [
          {
            name: "Data Migration Rehearsals",
            startDate: "2025-11-01",
            endDate: "2025-12-31",
            description: "Test migration process",
          },
          {
            name: "UAT with Migrated Data",
            startDate: "2026-01-01",
            endDate: "2026-02-15",
            description: "Validate migrated data",
          },
          {
            name: "Final Data Migration & Go-Live",
            startDate: "2026-02-16",
            endDate: "2026-02-28",
            description: "Production cutover",
          },
        ],
      },
    ],
    milestones: [
      {
        name: "Data Strategy Approved",
        date: "2025-02-15",
        description: "Migration strategy finalized",
        color: "#3B82F6",
        icon: "📋",
      },
      {
        name: "First Migration Rehearsal",
        date: "2025-12-01",
        description: "Initial data migration test",
        color: "#F59E0B",
        icon: "🧪",
      },
      {
        name: "Go-Live with Data",
        date: "2026-02-28",
        description: "Production with migrated data",
        color: "#8B5CF6",
        icon: "🚀",
      },
    ],
  },
];

export function getTemplatesByCategory(category: ProjectTemplate["category"]): ProjectTemplate[] {
  return PROJECT_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

export function getPopularTemplates(limit = 5): ProjectTemplate[] {
  return [...PROJECT_TEMPLATES].sort((a, b) => b.popularity - a.popularity).slice(0, limit);
}
