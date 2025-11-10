/**
 * Copy-Paste Template Generator for Gantt Tool
 *
 * Generates an Excel template optimized for copy/paste workflow.
 * Creates a single sheet with the exact format expected by the parser.
 */

import ExcelJS from "exceljs";
import { format, addWeeks, startOfWeek } from "date-fns";

export async function generateCopyPasteTemplate() {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Gantt Tool - Copy/Paste Template";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Project Plan");

  // Calculate weekly columns (12 weeks starting from today)
  const projectStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekHeaders = ["Phase", "Task Name", "Start Date", "End Date"];

  // Generate weekly headers with actual Monday dates (e.g., "2-Feb-26")
  for (let i = 0; i < 12; i++) {
    const weekDate = addWeeks(projectStart, i);
    weekHeaders.push(format(weekDate, "d-MMM-yy"));
  }

  // Add header row
  sheet.addRow(weekHeaders);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1976D2" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // Set column widths
  sheet.getColumn(1).width = 20; // Phase
  sheet.getColumn(2).width = 30; // Task Name
  sheet.getColumn(3).width = 30; // Start Date (full format)
  sheet.getColumn(4).width = 30; // End Date (full format)
  for (let i = 5; i <= weekHeaders.length; i++) {
    sheet.getColumn(i).width = 12; // Weekly columns (date format)
  }

  // Add example phases and tasks (using full date format)
  const exampleData = [
    [
      "Prepare",
      "Project charter",
      "Monday, 15 January, 2025",
      "Thursday, 30 January, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Prepare",
      "Setup environments",
      "Saturday, 1 February, 2025",
      "Saturday, 15 February, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Prepare",
      "Team onboarding",
      "Saturday, 15 February, 2025",
      "Friday, 28 February, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Explore",
      "Gather requirements",
      "Saturday, 1 March, 2025",
      "Thursday, 20 March, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Explore",
      "Design solution",
      "Friday, 21 March, 2025",
      "Tuesday, 15 April, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Explore",
      "Review design",
      "Wednesday, 16 April, 2025",
      "Wednesday, 30 April, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Realize",
      "Configuration",
      "Thursday, 1 May, 2025",
      "Monday, 30 June, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Realize",
      "Development",
      "Tuesday, 1 July, 2025",
      "Friday, 15 August, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Realize",
      "Unit testing",
      "Saturday, 16 August, 2025",
      "Tuesday, 30 September, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Deploy",
      "Integration testing",
      "Wednesday, 1 October, 2025",
      "Monday, 20 October, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Deploy",
      "UAT",
      "Tuesday, 21 October, 2025",
      "Monday, 10 November, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    [
      "Deploy",
      "Go-live",
      "Wednesday, 26 November, 2025",
      "Sunday, 30 November, 2025",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ],
    ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""], // Empty row separator
  ];

  exampleData.forEach((row) => sheet.addRow(row));

  // Add resource section header (with Start Date and End Date columns for consistency)
  const resourceWeekHeaders = [];
  for (let i = 0; i < 12; i++) {
    const weekDate = addWeeks(projectStart, i);
    resourceWeekHeaders.push(format(weekDate, "d-MMM-yy"));
  }

  const resourceHeaderRow = sheet.addRow([
    "Role",
    "Designation",
    "Start Date",
    "End Date",
    ...resourceWeekHeaders,
  ]);
  resourceHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  resourceHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF10B981" },
  };
  resourceHeaderRow.alignment = { horizontal: "center", vertical: "middle" };

  // Add example resources with weekly effort
  const exampleResources = [
    [
      "Project Manager",
      "Senior Manager",
      "",
      "",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "3",
      "3",
      "3",
      "3",
    ],
    [
      "Technical Lead",
      "Manager",
      "",
      "",
      "0",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
      "5",
    ],
    [
      "Finance Consultant",
      "Senior Consultant",
      "",
      "",
      "0",
      "0",
      "3",
      "5",
      "5",
      "5",
      "5",
      "3",
      "0",
      "0",
      "0",
      "0",
    ],
    ["Developer", "Consultant", "", "", "0", "0", "0", "0", "5", "5", "5", "5", "5", "5", "5", "3"],
    ["QA Analyst", "Analyst", "", "", "0", "0", "0", "0", "0", "0", "0", "5", "5", "5", "5", "5"],
  ];

  exampleResources.forEach((row) => sheet.addRow(row));

  // Add instructions below data
  sheet.addRow([""]);
  sheet.addRow([""]);
  const instructionsRow = sheet.addRow(["📋 INSTRUCTIONS:"]);
  instructionsRow.font = { bold: true, size: 12, color: { argb: "FFEF4444" } };

  const instructions = [
    '1. PHASES: Enter phase name in the "Phase" column (e.g., "Prepare", "Explore")',
    '2. TASKS: Enter task name in the "Task Name" column (e.g., "Project charter")',
    "3. GROUPING: Tasks with the same phase name will be grouped together in one phase",
    '4. DATES: Format must be "Day, DD Month, YYYY" (e.g., "Monday, 2 February, 2026")',
    "5. RESOURCES: Add resources below the empty row, with Role, Designation, and optional dates",
    "6. DESIGNATIONS: Use standard levels (Senior Manager, Manager, Senior Consultant, Consultant, Analyst)",
    "7. WEEKLY EFFORT: Numbers in weekly columns represent mandays (0-5)",
    "8. WEEKLY HEADERS: Column headers show Monday dates (e.g., 2-Feb-26) for each week",
    "9. COPY ALL: Select ALL data (header + tasks + resources) then copy (Ctrl+C)",
    "10. PASTE: Go to the import dialog and paste (Ctrl+V) into the text area",
    "",
    "⚠️ IMPORTANT: Keep the weekly column headers (dates) - they are required for parsing!",
  ];

  instructions.forEach((instruction) => {
    const row = sheet.addRow([instruction]);
    row.font = { size: 10 };
  });

  // Freeze header row
  sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gantt-copypaste-template-${new Date().toISOString().split("T")[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
