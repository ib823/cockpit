/**
 * Template Generator V2 - Separate Templates for Schedule and Resources
 *
 * Generates two Excel templates:
 * 1. Schedule Template: Phase | Task | Start Date | End Date
 * 2. Resource Template: Role | Designation | W1 | W2 | W3 | ...
 *
 * Uses XLSX library (already installed)
 */

import * as XLSX from "xlsx";
import { format, addDays, startOfWeek } from "date-fns";

/**
 * Generate Schedule Template (Excel)
 * Downloads as: Schedule_Template.xlsx
 */
export async function generateScheduleTemplate() {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sample data with instructions
  const data = [
    // Header row
    ["Phase Name", "Task Name", "Start Date", "End Date"],

    // Example data
    ["Discovery", "Requirements Gathering", "2026-01-01", "2026-01-15"],
    ["Discovery", "Stakeholder Interviews", "2026-01-08", "2026-01-22"],
    ["Discovery", "Gap Analysis", "2026-01-16", "2026-01-31"],

    ["Design", "Solution Architecture", "2026-02-01", "2026-02-15"],
    ["Design", "Data Model Design", "2026-02-01", "2026-02-28"],
    ["Design", "Integration Design", "2026-02-16", "2026-02-28"],

    ["Build", "Configuration", "2026-03-01", "2026-03-31"],
    ["Build", "Custom Development", "2026-03-01", "2026-04-15"],
    ["Build", "Unit Testing", "2026-03-15", "2026-04-15"],

    ["Test", "Integration Testing", "2026-04-16", "2026-04-30"],
    ["Test", "User Acceptance Testing", "2026-05-01", "2026-05-15"],

    ["Deploy", "Production Deployment", "2026-05-16", "2026-05-31"],
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 20 }, // Phase Name
    { wch: 40 }, // Task Name
    { wch: 15 }, // Start Date
    { wch: 15 }, // End Date
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");

  // Add instructions sheet
  const instructions = [
    ["📅 SCHEDULE IMPORT INSTRUCTIONS"],
    [""],
    ["FORMAT:"],
    ['Column A: Phase Name (e.g., "Discovery", "Design", "Build")'],
    ['Column B: Task Name (e.g., "Requirements Gathering")'],
    ['Column C: Start Date (format: YYYY-MM-DD, e.g., "2026-01-15")'],
    ['Column D: End Date (format: YYYY-MM-DD, e.g., "2026-01-31")'],
    [""],
    ["TIPS:"],
    ["• All dates must be in YYYY-MM-DD format"],
    ["• Start date must be before or equal to end date"],
    ["• Tasks with the same phase name will be grouped together"],
    ["• Delete the example rows and add your own data"],
    ["• Keep the header row (Row 1)"],
    [""],
    ["COPY/PASTE WORKFLOW:"],
    ["1. Fill in your data in the Schedule sheet"],
    ["2. Select all cells (Ctrl+A)"],
    ["3. Copy (Ctrl+C)"],
    ["4. Go to Gantt Tool import wizard"],
    ["5. Paste into Stage 1 textarea (Ctrl+V)"],
    ['6. Click "Parse Data"'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  // Download
  XLSX.writeFile(wb, "Schedule_Template.xlsx");
}

/**
 * Generate Resource Template (Excel)
 * Downloads as: Resource_Template.xlsx
 */
export async function generateResourceTemplate() {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Generate 12 weeks of headers (Monday dates)
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekHeaders = Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(startDate, i * 7);
    return format(weekStart, "d-MMM-yy");
  });

  // Sample data
  const data = [
    // Header row
    ["Role", "Designation", ...weekHeaders],

    // Example data
    ["Project Manager", "Manager", 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    ["Solution Architect", "Principal", 3, 5, 5, 5, 5, 3, 0, 0, 0, 0, 0, 0],
    ["SAP Consultant", "Senior Consultant", 0, 0, 5, 5, 5, 5, 5, 5, 5, 3, 0, 0],
    ["Developer", "Consultant", 0, 0, 0, 3, 5, 5, 5, 5, 5, 5, 5, 3],
    ["QA Lead", "Senior Consultant", 0, 0, 0, 0, 0, 3, 5, 5, 5, 5, 3, 0],
    ["Change Manager", "Manager", 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 25 }, // Role
    { wch: 20 }, // Designation
    ...Array(12).fill({ wch: 10 }), // Week columns
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Resources");

  // Add instructions sheet
  const instructions = [
    ["👥 RESOURCE IMPORT INSTRUCTIONS"],
    [""],
    ["FORMAT:"],
    ['Column A: Role (e.g., "Project Manager", "SAP Consultant")'],
    ["Column B: Designation (see valid values below)"],
    ["Columns C+: Weekly Effort (mandays per week, 0-5)"],
    [""],
    ["VALID DESIGNATIONS:"],
    ["• Principal"],
    ["• Director"],
    ["• Senior Manager"],
    ["• Manager"],
    ["• Senior Consultant"],
    ["• Consultant"],
    ["• Analyst"],
    ["• SubContractor"],
    [""],
    ["TIPS:"],
    ["• Use 0 for weeks when resource is not working"],
    ["• Use 0-5 for normal workweeks (5 = full-time)"],
    ["• Values > 5 will generate a warning"],
    ["• This stage is OPTIONAL - you can skip it"],
    [""],
    ["COPY/PASTE WORKFLOW:"],
    ["1. Fill in your data in the Resources sheet"],
    ["2. Select all cells (Ctrl+A)"],
    ["3. Copy (Ctrl+C)"],
    ["4. Go to Gantt Tool import wizard (Stage 2)"],
    ["5. Paste into Stage 2 textarea (Ctrl+V)"],
    ['6. Click "Parse Resources"'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  // Download
  XLSX.writeFile(wb, "Resource_Template.xlsx");
}
