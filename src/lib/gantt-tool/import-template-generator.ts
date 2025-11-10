/**
 * Gantt Tool - Import Template Generator
 *
 * Generates an Excel template for importing project data.
 * Creates a pre-formatted workbook with examples and instructions.
 */

import ExcelJS from "exceljs";

export async function generateImportTemplate() {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Gantt Tool";
  workbook.created = new Date();

  // Sheet 1: Project Info
  const projectSheet = workbook.addWorksheet("Project Info");
  projectSheet.columns = [
    { key: "name", header: "Project Name", width: 40 },
    { key: "startDate", header: "Start Date", width: 15 },
    { key: "description", header: "Description", width: 60 },
  ];

  // Style header
  projectSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  projectSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1976D2" },
  };

  // Add example data
  projectSheet.addRow({
    name: "SAP S/4HANA Transformation Project",
    startDate: "2025-01-15",
    description:
      "Global SAP transformation across 5 regions with finance, supply chain, and HR modules",
  });

  // Add instructions
  projectSheet.addRow({});
  projectSheet.addRow({
    name: "⚠️ INSTRUCTIONS:",
  });
  projectSheet.getCell("A3").font = { bold: true, color: { argb: "FFEF4444" } };
  projectSheet.addRow({
    name: "1. Replace the example data above with your project information",
  });
  projectSheet.addRow({
    name: "2. Date format MUST be YYYY-MM-DD (e.g., 2025-01-15)",
  });
  projectSheet.addRow({
    name: "3. Project Name and Start Date are REQUIRED",
  });

  // Sheet 2: Phases
  const phasesSheet = workbook.addWorksheet("Phases");
  phasesSheet.columns = [
    { key: "name", header: "Phase Name", width: 25 },
    { key: "startDate", header: "Start Date", width: 15 },
    { key: "endDate", header: "End Date", width: 15 },
    { key: "description", header: "Description", width: 50 },
    { key: "color", header: "Color", width: 12 },
  ];

  // Style header
  phasesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  phasesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF10B981" },
  };

  // Add example phases
  phasesSheet.addRow({
    name: "Prepare",
    startDate: "2025-01-15",
    endDate: "2025-02-28",
    description: "Project setup, team mobilization, and planning",
    color: "#3B82F6",
  });
  phasesSheet.addRow({
    name: "Explore",
    startDate: "2025-03-01",
    endDate: "2025-04-30",
    description: "Requirements gathering and solution design",
    color: "#10B981",
  });
  phasesSheet.addRow({
    name: "Realize",
    startDate: "2025-05-01",
    endDate: "2025-09-30",
    description: "Development, configuration, and unit testing",
    color: "#F59E0B",
  });
  phasesSheet.addRow({
    name: "Deploy",
    startDate: "2025-10-01",
    endDate: "2025-11-30",
    description: "Integration testing, UAT, cutover, and go-live",
    color: "#8B5CF6",
  });

  // Sheet 3: Tasks
  const tasksSheet = workbook.addWorksheet("Tasks");
  tasksSheet.columns = [
    { key: "name", header: "Task Name", width: 40 },
    { key: "phaseName", header: "Phase Name", width: 20 },
    { key: "startDate", header: "Start Date", width: 15 },
    { key: "endDate", header: "End Date", width: 15 },
    { key: "description", header: "Description", width: 50 },
    { key: "progress", header: "Progress", width: 10 },
    { key: "assignee", header: "Assignee", width: 25 },
  ];

  // Style header
  tasksSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  tasksSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF59E0B" },
  };

  // Add example tasks
  const exampleTasks = [
    {
      name: "Define project charter",
      phaseName: "Prepare",
      startDate: "2025-01-15",
      endDate: "2025-01-30",
      description: "Create and get approval for project charter",
      progress: 0,
      assignee: "",
    },
    {
      name: "Setup project environments",
      phaseName: "Prepare",
      startDate: "2025-02-01",
      endDate: "2025-02-15",
      description: "Configure DEV, QA, and PRD systems",
      progress: 0,
      assignee: "",
    },
    {
      name: "Team onboarding",
      phaseName: "Prepare",
      startDate: "2025-02-15",
      endDate: "2025-02-28",
      description: "Onboard project team members",
      progress: 0,
      assignee: "",
    },
    {
      name: "Gather finance requirements",
      phaseName: "Explore",
      startDate: "2025-03-01",
      endDate: "2025-03-20",
      description: "Document finance module requirements",
      progress: 0,
      assignee: "",
    },
    {
      name: "Design finance solution",
      phaseName: "Explore",
      startDate: "2025-03-21",
      endDate: "2025-04-15",
      description: "Create technical design for finance module",
      progress: 0,
      assignee: "",
    },
    {
      name: "Review and approve design",
      phaseName: "Explore",
      startDate: "2025-04-16",
      endDate: "2025-04-30",
      description: "Design review and stakeholder approval",
      progress: 0,
      assignee: "",
    },
    {
      name: "Configure finance module",
      phaseName: "Realize",
      startDate: "2025-05-01",
      endDate: "2025-06-30",
      description: "System configuration for finance",
      progress: 0,
      assignee: "",
    },
    {
      name: "Develop custom reports",
      phaseName: "Realize",
      startDate: "2025-07-01",
      endDate: "2025-08-15",
      description: "Build custom financial reports",
      progress: 0,
      assignee: "",
    },
    {
      name: "Unit testing",
      phaseName: "Realize",
      startDate: "2025-08-16",
      endDate: "2025-09-30",
      description: "Conduct unit testing for all components",
      progress: 0,
      assignee: "",
    },
    {
      name: "Integration testing",
      phaseName: "Deploy",
      startDate: "2025-10-01",
      endDate: "2025-10-20",
      description: "End-to-end integration testing",
      progress: 0,
      assignee: "",
    },
    {
      name: "User acceptance testing",
      phaseName: "Deploy",
      startDate: "2025-10-21",
      endDate: "2025-11-10",
      description: "UAT with business users",
      progress: 0,
      assignee: "",
    },
    {
      name: "Go-live preparation",
      phaseName: "Deploy",
      startDate: "2025-11-11",
      endDate: "2025-11-25",
      description: "Final preparation and cutover plan",
      progress: 0,
      assignee: "",
    },
    {
      name: "Production cutover",
      phaseName: "Deploy",
      startDate: "2025-11-26",
      endDate: "2025-11-30",
      description: "Go-live to production",
      progress: 0,
      assignee: "",
    },
  ];

  exampleTasks.forEach((task) => tasksSheet.addRow(task));

  // Sheet 4: Resources
  const resourcesSheet = workbook.addWorksheet("Resources");
  resourcesSheet.columns = [
    { key: "name", header: "Resource Name", width: 30 },
    { key: "category", header: "Category", width: 15 },
    { key: "designation", header: "Designation", width: 20 },
    { key: "description", header: "Description", width: 50 },
    { key: "managerName", header: "Manager Resource Name", width: 30 },
    { key: "email", header: "Email", width: 30 },
    { key: "department", header: "Department", width: 25 },
    { key: "location", header: "Location", width: 20 },
    { key: "projectRole", header: "Project Role", width: 30 },
  ];

  // Style header
  resourcesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  resourcesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8B5CF6" },
  };

  // Add example resources with org hierarchy
  const exampleResources = [
    {
      name: "Project Director",
      category: "pm",
      designation: "senior_manager",
      description: "Overall project director",
      managerName: "",
      email: "director@example.com",
      department: "PMO",
      location: "New York",
      projectRole: "Program Director",
    },
    {
      name: "Project Manager",
      category: "pm",
      designation: "manager",
      description: "Project manager for delivery",
      managerName: "Project Director",
      email: "pm@example.com",
      department: "PMO",
      location: "New York",
      projectRole: "Delivery Manager",
    },
    {
      name: "Finance Lead",
      category: "functional",
      designation: "manager",
      description: "Finance workstream lead",
      managerName: "Project Manager",
      email: "finance-lead@example.com",
      department: "Finance",
      location: "London",
      projectRole: "Finance Workstream Lead",
    },
    {
      name: "Finance Senior Consultant",
      category: "functional",
      designation: "senior_consultant",
      description: "Senior finance consultant",
      managerName: "Finance Lead",
      email: "finance-sc@example.com",
      department: "Finance",
      location: "London",
      projectRole: "Finance Expert",
    },
    {
      name: "Finance Consultant",
      category: "functional",
      designation: "consultant",
      description: "Finance consultant",
      managerName: "Finance Lead",
      email: "finance-c@example.com",
      department: "Finance",
      location: "Remote",
      projectRole: "Finance Consultant",
    },
    {
      name: "Technical Lead",
      category: "technical",
      designation: "senior_consultant",
      description: "Technical architecture lead",
      managerName: "Project Manager",
      email: "tech-lead@example.com",
      department: "Technical",
      location: "Singapore",
      projectRole: "Solution Architect",
    },
    {
      name: "ABAP Developer",
      category: "technical",
      designation: "consultant",
      description: "ABAP development consultant",
      managerName: "Technical Lead",
      email: "abap@example.com",
      department: "Technical",
      location: "Singapore",
      projectRole: "Developer",
    },
    {
      name: "Basis Administrator",
      category: "basis",
      designation: "consultant",
      description: "Basis and infrastructure",
      managerName: "Technical Lead",
      email: "basis@example.com",
      department: "Infrastructure",
      location: "Singapore",
      projectRole: "Basis Admin",
    },
    {
      name: "Security Consultant",
      category: "security",
      designation: "consultant",
      description: "Security and authorization",
      managerName: "Technical Lead",
      email: "security@example.com",
      department: "Security",
      location: "Remote",
      projectRole: "Security Expert",
    },
    {
      name: "Change Manager",
      category: "change",
      designation: "consultant",
      description: "Organizational change management",
      managerName: "Project Manager",
      email: "change@example.com",
      department: "Change",
      location: "New York",
      projectRole: "OCM Lead",
    },
  ];

  exampleResources.forEach((resource) => resourcesSheet.addRow(resource));

  // Add instructions for categories and designations
  resourcesSheet.addRow({});
  resourcesSheet.addRow({ name: "⚠️ VALID CATEGORIES:" });
  if (resourcesSheet.lastRow) {
    resourcesSheet.getCell("A" + resourcesSheet.lastRow.number).font = {
      bold: true,
      color: { argb: "FFEF4444" },
    };
  }
  resourcesSheet.addRow({ name: "functional, technical, basis, security, pm, change" });
  resourcesSheet.addRow({});
  resourcesSheet.addRow({ name: "⚠️ VALID DESIGNATIONS:" });
  if (resourcesSheet.lastRow) {
    resourcesSheet.getCell("A" + resourcesSheet.lastRow.number).font = {
      bold: true,
      color: { argb: "FFEF4444" },
    };
  }
  resourcesSheet.addRow({
    name: "principal, senior_manager, manager, senior_consultant, consultant, analyst, subcontractor",
  });

  // Sheet 5: Milestones
  const milestonesSheet = workbook.addWorksheet("Milestones");
  milestonesSheet.columns = [
    { key: "name", header: "Milestone Name", width: 30 },
    { key: "date", header: "Date", width: 15 },
    { key: "description", header: "Description", width: 50 },
    { key: "icon", header: "Icon", width: 8 },
    { key: "color", header: "Color", width: 12 },
  ];

  // Style header
  milestonesSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  milestonesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEC4899" },
  };

  // Add example milestones
  milestonesSheet.addRow({
    name: "Project Kickoff",
    date: "2025-01-15",
    description: "Official project start and kickoff meeting",
    icon: "🚀",
    color: "#10B981",
  });
  milestonesSheet.addRow({
    name: "Design Freeze",
    date: "2025-04-30",
    description: "Solution design completed and frozen",
    icon: "📋",
    color: "#3B82F6",
  });
  milestonesSheet.addRow({
    name: "Development Complete",
    date: "2025-09-30",
    description: "All development and configuration finished",
    icon: "💻",
    color: "#F59E0B",
  });
  milestonesSheet.addRow({
    name: "Go-Live",
    date: "2025-11-30",
    description: "Production cutover and go-live",
    icon: "✅",
    color: "#10B981",
  });

  // Sheet 6: Holidays
  const holidaysSheet = workbook.addWorksheet("Holidays");
  holidaysSheet.columns = [
    { key: "name", header: "Holiday Name", width: 25 },
    { key: "date", header: "Date", width: 15 },
    { key: "region", header: "Region", width: 15 },
    { key: "type", header: "Type", width: 12 },
  ];

  // Style header
  holidaysSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  holidaysSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEF4444" },
  };

  // Add example holidays
  holidaysSheet.addRow({
    name: "New Year's Day",
    date: "2025-01-01",
    region: "US",
    type: "public",
  });
  holidaysSheet.addRow({
    name: "Independence Day",
    date: "2025-07-04",
    region: "US",
    type: "public",
  });
  holidaysSheet.addRow({ name: "Thanksgiving", date: "2025-11-27", region: "US", type: "public" });
  holidaysSheet.addRow({ name: "Christmas Day", date: "2025-12-25", region: "US", type: "public" });
  holidaysSheet.addRow({
    name: "Company Founding Day",
    date: "2025-06-15",
    region: "Global",
    type: "company",
  });

  holidaysSheet.addRow({});
  holidaysSheet.addRow({ name: "⚠️ VALID TYPES: public, company, custom" });
  if (holidaysSheet.lastRow) {
    holidaysSheet.getCell("A" + holidaysSheet.lastRow.number).font = {
      bold: true,
      color: { argb: "FFEF4444" },
    };
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gantt-import-template-${new Date().toISOString().split("T")[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
