/**
 * Copy-Paste Template Generator for Gantt Tool
 *
 * Generates an Excel template optimized for copy/paste workflow.
 * Creates a single sheet with the exact format expected by the parser.
 */

import ExcelJS from 'exceljs';
import { format, addWeeks, startOfWeek } from 'date-fns';

export async function generateCopyPasteTemplate() {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Gantt Tool - Copy/Paste Template';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Project Plan');

  // Calculate weekly columns (12 weeks starting from today)
  const projectStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekHeaders = ['Task Name', 'Start Date', 'End Date'];

  for (let i = 0; i < 12; i++) {
    weekHeaders.push(`W ${String(i + 1).padStart(2, '0')}`);
  }

  // Add header row
  sheet.addRow(weekHeaders);

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  sheet.getColumn(1).width = 40; // Task Name
  sheet.getColumn(2).width = 12; // Start Date
  sheet.getColumn(3).width = 12; // End Date
  for (let i = 4; i <= weekHeaders.length; i++) {
    sheet.getColumn(i).width = 6; // Weekly columns
  }

  // Add example phases and tasks
  const exampleData = [
    ['Prepare', '2025-01-15', '2025-02-28', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Project charter', '2025-01-15', '2025-01-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Setup environments', '2025-02-01', '2025-02-15', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Team onboarding', '2025-02-15', '2025-02-28', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Explore', '2025-03-01', '2025-04-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Gather requirements', '2025-03-01', '2025-03-20', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Design solution', '2025-03-21', '2025-04-15', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Review design', '2025-04-16', '2025-04-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Realize', '2025-05-01', '2025-09-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Configuration', '2025-05-01', '2025-06-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Development', '2025-07-01', '2025-08-15', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Unit testing', '2025-08-16', '2025-09-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Deploy', '2025-10-01', '2025-11-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Integration testing', '2025-10-01', '2025-10-20', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  UAT', '2025-10-21', '2025-11-10', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['  Go-live', '2025-11-26', '2025-11-30', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''], // Empty row separator
  ];

  exampleData.forEach(row => sheet.addRow(row));

  // Add resource section header
  const resourceHeaderRow = sheet.addRow(['Role', 'Resource Name', '', ...Array(12).fill('')]);
  resourceHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  resourceHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  };
  resourceHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add example resources with weekly effort
  const exampleResources = [
    ['Project Manager', 'PM Smith', '', '5', '5', '5', '5', '5', '5', '5', '5', '3', '3', '3', '3'],
    ['Technical Lead', 'Tech Jones', '', '0', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5', '5'],
    ['Finance Consultant', 'Finance Brown', '', '0', '0', '3', '5', '5', '5', '5', '3', '0', '0', '0', '0'],
    ['Developer', 'Dev Wilson', '', '0', '0', '0', '0', '5', '5', '5', '5', '5', '5', '5', '3'],
    ['QA Analyst', 'QA Taylor', '', '0', '0', '0', '0', '0', '0', '0', '5', '5', '5', '5', '5'],
  ];

  exampleResources.forEach(row => sheet.addRow(row));

  // Add instructions below data
  sheet.addRow(['']);
  sheet.addRow(['']);
  const instructionsRow = sheet.addRow(['📋 INSTRUCTIONS:']);
  instructionsRow.font = { bold: true, size: 12, color: { argb: 'FFEF4444' } };

  const instructions = [
    '1. PHASES: Task names without indentation become phases (e.g., "Prepare", "Explore")',
    '2. TASKS: Task names with 2 spaces at the start become tasks (e.g., "  Project charter")',
    '3. DATES: Format must be YYYY-MM-DD (e.g., 2025-01-15)',
    '4. RESOURCES: Add resources below the empty row, with Role and Resource Name',
    '5. WEEKLY EFFORT: Numbers in weekly columns represent mandays (0-5)',
    '6. COPY ALL: Select ALL data (header + tasks + resources) then copy (Ctrl+C)',
    '7. PASTE: Go to the import dialog and paste (Ctrl+V) into the text area',
    '',
    '⚠️ IMPORTANT: Keep the weekly column headers (W 01, W 02, etc.) - they are required!',
  ];

  instructions.forEach(instruction => {
    const row = sheet.addRow([instruction]);
    row.font = { size: 10 };
  });

  // Freeze header row
  sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gantt-copypaste-template-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
