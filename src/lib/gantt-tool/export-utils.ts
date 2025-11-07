/**
 * Gantt Tool - Export Utilities
 *
 * Functions for exporting Gantt charts to PNG, PDF, and Excel formats.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ExcelJS from 'exceljs';
import type { GanttProject } from '@/types/gantt-tool';
import { format, differenceInDays } from 'date-fns';
import { formatGanttDateLong, formatWorkingDays, formatCalendarDuration } from './date-utils';
import { calculateWorkingDaysInclusive } from './working-days';
import {
  chooseTimelineGranularity,
  timelineLabels,
  weekSpanToExcelColumns,
  calculateTotalWeeks,
} from '@/lib/export/timeline-granularity';

/**
 * Export Gantt chart to PNG image
 * @param project - The Gantt project to export
 * @param backgroundColor - Background color ('transparent', 'white', or 'black'). Defaults to 'white'.
 */
export async function exportToPNG(
  project: GanttProject,
  backgroundColor: 'transparent' | 'white' | 'black' = 'white'
): Promise<void> {
  // Show loading indicator
  const loadingDiv = showLoadingIndicator('Exporting PNG...');

  try {
    const canvasElement = document.getElementById('gantt-canvas');
    if (!canvasElement) {
      throw new Error('Gantt canvas not found');
    }

    // Store original scroll position
    const originalScrollLeft = canvasElement.scrollLeft;
    const originalScrollTop = canvasElement.scrollTop;

    // Scroll to top-left to capture everything
    canvasElement.scrollLeft = 0;
    canvasElement.scrollTop = 0;

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Map background color option to html2canvas backgroundColor
    const bgColorMap = {
      transparent: null,
      white: '#ffffff',
      black: '#000000',
    };

    // Generate canvas from HTML
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: bgColorMap[backgroundColor],
      scale: 3, // High resolution (3x for professional quality)
      logging: true, // Enable logging for debugging
      useCORS: true,
      allowTaint: true,
      width: canvasElement.scrollWidth,
      height: canvasElement.scrollHeight,
      x: 0,
      y: 0,
    });

    // Restore scroll position
    canvasElement.scrollLeft = originalScrollLeft;
    canvasElement.scrollTop = originalScrollTop;

    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(project.name)}-gantt.png`;
      link.href = url;
      link.click();

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
      hideLoadingIndicator(loadingDiv);
    }, 'image/png');
  } catch (error) {
    hideLoadingIndicator(loadingDiv);
    console.error('Failed to export PNG:', error);
    alert(`Failed to export PNG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export Gantt chart to PDF document
 */
export async function exportToPDF(project: GanttProject): Promise<void> {
  // Show loading indicator
  const loadingDiv = showLoadingIndicator('Exporting PDF...');

  try {
    const canvasElement = document.getElementById('gantt-canvas');
    if (!canvasElement) {
      throw new Error('Gantt canvas not found');
    }

    // Store original scroll position
    const originalScrollLeft = canvasElement.scrollLeft;
    const originalScrollTop = canvasElement.scrollTop;

    // Scroll to top-left to capture everything
    canvasElement.scrollLeft = 0;
    canvasElement.scrollTop = 0;

    // Wait for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate canvas from HTML
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 3,
      logging: true,
      useCORS: true,
      allowTaint: true,
      width: canvasElement.scrollWidth,
      height: canvasElement.scrollHeight,
      x: 0,
      y: 0,
    });

    // Restore scroll position
    canvasElement.scrollLeft = originalScrollLeft;
    canvasElement.scrollTop = originalScrollTop;

    // Create PDF in landscape mode
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Add professional cover page
    addProfessionalCoverPage(pdf, project);
    pdf.addPage();

    // Calculate dimensions for gantt chart
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add gantt chart image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add footer with page numbers
    addPDFFooter(pdf, project);

    // Add enhanced metadata
    pdf.setProperties({
      title: `${project.name} - Project Gantt Chart`,
      author: 'Keystone - RFP to Proposal in 10 Minutes',
      subject: `Project Timeline - ${project.name}`,
      creator: 'Keystone Gantt Chart Tool',
      keywords: 'gantt, project, timeline, schedule, planning',
    });

    // Download
    pdf.save(`${sanitizeFilename(project.name)}-gantt.pdf`);

    hideLoadingIndicator(loadingDiv);
  } catch (error) {
    hideLoadingIndicator(loadingDiv);
    console.error('Failed to export PDF:', error);
    alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export Gantt chart data to Excel spreadsheet
 */
export async function exportToExcel(project: GanttProject): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gantt Chart Tool';
    workbook.created = new Date();

    // --- Sheet 1: Project Overview ---
    const overviewSheet = workbook.addWorksheet('Project Overview');

    overviewSheet.columns = [
      { header: 'Property', key: 'property', width: 20 },
      { header: 'Value', key: 'value', width: 50 },
    ];

    overviewSheet.addRows([
      { property: 'Project Name', value: project.name },
      { property: 'Description', value: project.description || 'N/A' },
      { property: 'Start Date', value: formatGanttDateLong(project.startDate) },
      { property: 'Total Phases', value: project.phases.length },
      { property: 'Total Milestones', value: project.milestones.length },
      { property: 'Total Holidays', value: project.holidays.length },
      { property: 'Created', value: formatGanttDateLong(project.createdAt) },
      { property: 'Last Updated', value: formatGanttDateLong(project.updatedAt) },
    ]);

    // Style header
    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    overviewSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // --- Sheet 2: Phases ---
    const phasesSheet = workbook.addWorksheet('Phases');

    phasesSheet.columns = [
      { header: 'Phase Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Calendar Duration', key: 'calendarDuration', width: 20 },
      { header: 'Tasks Count', key: 'tasksCount', width: 15 },
      { header: 'Color', key: 'color', width: 10 },
    ];

    project.phases.forEach((phase) => {
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      const calendarDays = differenceInDays(endDate, startDate);
      const workingDays = calculateWorkingDaysInclusive(phase.startDate, phase.endDate, project.holidays);

      phasesSheet.addRow({
        name: phase.name,
        description: phase.description || 'N/A',
        startDate: formatGanttDateLong(startDate),
        endDate: formatGanttDateLong(endDate),
        workingDays: formatWorkingDays(workingDays),
        calendarDuration: formatCalendarDuration(calendarDays),
        tasksCount: phase.tasks.length,
        color: phase.color,
      });
    });

    // Style header
    phasesSheet.getRow(1).font = { bold: true };
    phasesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    phasesSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // --- Sheet 3: Tasks ---
    const tasksSheet = workbook.addWorksheet('Tasks');

    tasksSheet.columns = [
      { header: 'Phase', key: 'phase', width: 25 },
      { header: 'Task Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Start Date', key: 'startDate', width: 15 },
      { header: 'End Date', key: 'endDate', width: 15 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
      { header: 'Calendar Duration', key: 'calendarDuration', width: 20 },
      { header: 'Assignee', key: 'assignee', width: 20 },
      { header: 'Progress (%)', key: 'progress', width: 12 },
    ];

    project.phases.forEach((phase) => {
      phase.tasks.forEach((task) => {
        const startDate = new Date(task.startDate);
        const endDate = new Date(task.endDate);
        const calendarDays = differenceInDays(endDate, startDate);
        const workingDays = calculateWorkingDaysInclusive(task.startDate, task.endDate, project.holidays);

        tasksSheet.addRow({
          phase: phase.name,
          name: task.name,
          description: task.description || 'N/A',
          startDate: formatGanttDateLong(startDate),
          endDate: formatGanttDateLong(endDate),
          workingDays: formatWorkingDays(workingDays),
          calendarDuration: formatCalendarDuration(calendarDays),
          assignee: task.assignee || 'Unassigned',
          progress: task.progress,
        });
      });
    });

    // Style header
    tasksSheet.getRow(1).font = { bold: true };
    tasksSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    tasksSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // --- Sheet 4: Milestones ---
    const milestonesSheet = workbook.addWorksheet('Milestones');

    milestonesSheet.columns = [
      { header: 'Milestone Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Color', key: 'color', width: 10 },
    ];

    project.milestones.forEach((milestone) => {
      milestonesSheet.addRow({
        name: milestone.name,
        description: milestone.description || 'N/A',
        date: formatGanttDateLong(milestone.date),
        color: milestone.color,
      });
    });

    // Style header
    milestonesSheet.getRow(1).font = { bold: true };
    milestonesSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    milestonesSheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // --- Sheet 5: Visual Timeline (NEW) ---
    createVisualTimelineSheet(workbook, project);

    // --- Generate file and download ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${sanitizeFilename(project.name)}-gantt.xlsx`;
    link.href = url;
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export Excel:', error);
    alert('Failed to export Excel. Please try again.');
  }
}

/**
 * Create Visual Timeline sheet with colored task bars
 * Uses smart granularity based on project duration
 */
function createVisualTimelineSheet(workbook: ExcelJS.Workbook, project: GanttProject): void {
  const sheet = workbook.addWorksheet('Visual Timeline', {
    views: [{ state: 'frozen', xSplit: 7, ySplit: 1 }], // Freeze at column H, row 2
  });

  // Calculate project duration and choose granularity
  const projectStart = new Date(project.startDate);
  let projectEnd = projectStart;
  project.phases.forEach((phase) => {
    const phaseEnd = new Date(phase.endDate);
    if (phaseEnd > projectEnd) {
      projectEnd = phaseEnd;
    }
  });

  const totalWeeks = calculateTotalWeeks(projectStart, projectEnd);
  const granularity = chooseTimelineGranularity(totalWeeks);
  const labels = timelineLabels(granularity, totalWeeks);

  // --- Columns A-G: Metadata ---
  sheet.columns = [
    { header: 'Phase', key: 'phase', width: 20 },
    { header: 'Task', key: 'task', width: 30 },
    { header: 'Start Date', key: 'startDate', width: 12 },
    { header: 'End Date', key: 'endDate', width: 12 },
    { header: 'Days', key: 'days', width: 8 },
    { header: 'Assignee', key: 'assignee', width: 15 },
    { header: 'Progress', key: 'progress', width: 10 },
  ];

  // --- Columns H onwards: Timeline buckets ---
  labels.forEach((label, i) => {
    const col = sheet.getColumn(8 + i);
    col.header = label;
    col.width = 4; // Narrow columns for timeline bars
  });

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }, // Blue
  };
  headerRow.height = 18;
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // --- Add task rows with timeline bars ---
  let rowIndex = 2;
  project.phases.forEach((phase) => {
    phase.tasks.forEach((task) => {
      const row = sheet.getRow(rowIndex);

      // Calculate task timing
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      const startWeek = Math.ceil(calculateTotalWeeks(projectStart, taskStart)) + 1;
      const durationWeeks = Math.max(1, calculateTotalWeeks(taskStart, taskEnd));
      const workingDays = calculateWorkingDaysInclusive(task.startDate, task.endDate, project.holidays);

      // Metadata columns
      row.getCell(1).value = phase.name; // Phase
      row.getCell(2).value = task.name; // Task
      row.getCell(3).value = format(taskStart, 'MMM dd, yyyy'); // Start Date
      row.getCell(4).value = format(taskEnd, 'MMM dd, yyyy'); // End Date
      row.getCell(5).value = workingDays; // Days
      row.getCell(6).value = task.assignee || 'Unassigned'; // Assignee
      row.getCell(7).value = `${task.progress}%`; // Progress

      // Timeline bar fill
      const [colStart, colEnd] = weekSpanToExcelColumns(startWeek, durationWeeks, granularity);

      // Convert phase color to ARGB (remove # and add FF for opacity)
      const phaseColor = phase.color.replace('#', '');
      const argbColor = `FF${phaseColor}`;

      for (let col = colStart; col <= colEnd; col++) {
        const cell = row.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: argbColor },
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF999999' } },
          bottom: { style: 'thin', color: { argb: 'FF999999' } },
          left: col === colStart ? { style: 'thin', color: { argb: 'FF666666' } } : undefined,
          right: col === colEnd ? { style: 'thin', color: { argb: 'FF666666' } } : undefined,
        };
      }

      // Row styling
      row.height = 18;
      row.font = { name: 'Calibri', size: 10 };
      row.alignment = { vertical: 'middle' };

      rowIndex++;
    });
  });

  // Add legend at the bottom
  rowIndex += 2;
  const legendRow = sheet.getRow(rowIndex);
  legendRow.getCell(1).value = 'LEGEND:';
  legendRow.getCell(1).font = { bold: true };

  rowIndex++;
  project.phases.forEach((phase) => {
    const row = sheet.getRow(rowIndex);
    row.getCell(1).value = phase.name;

    // Color swatch in column B
    const phaseColor = phase.color.replace('#', '');
    const argbColor = `FF${phaseColor}`;
    row.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: argbColor },
    };
    row.getCell(2).border = {
      top: { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      left: { style: 'thin', color: { argb: 'FF999999' } },
      right: { style: 'thin', color: { argb: 'FF999999' } },
    };

    rowIndex++;
  });

  // Add granularity info
  rowIndex += 2;
  const infoRow = sheet.getRow(rowIndex);
  infoRow.getCell(1).value = `Timeline Granularity: ${granularity} (${totalWeeks} weeks total)`;
  infoRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF666666' } };
}

/**
 * Add professional cover page to PDF with branding
 */
function addProfessionalCoverPage(pdf: jsPDF, project: GanttProject): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background gradient effect (using rectangles with different opacities)
  pdf.setFillColor(37, 99, 235); // Blue-600
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  pdf.setFillColor(59, 130, 246); // Blue-500
  pdf.setGState(pdf.GState({ opacity: 0.7 }));
  pdf.circle(pageWidth * 0.8, pageHeight * 0.2, 80, 'F');

  pdf.setFillColor(96, 165, 250); // Blue-400
  pdf.setGState(pdf.GState({ opacity: 0.5 }));
  pdf.circle(pageWidth * 0.2, pageHeight * 0.8, 60, 'F');

  // Reset opacity
  pdf.setGState(pdf.GState({ opacity: 1.0 }));

  // Logo/Brand text (top)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('KEYSTONE', pageWidth / 2, 30, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('From RFP to Proposal in 10 Minutes', pageWidth / 2, 40, { align: 'center' });

  // Main title (center)
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  const titleY = pageHeight / 2 - 20;
  pdf.text('Project Gantt Chart', pageWidth / 2, titleY, { align: 'center' });

  // Project name
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'normal');
  pdf.text(project.name, pageWidth / 2, titleY + 20, { align: 'center' });

  // Project description (if available)
  if (project.description) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    // Word wrap description
    const maxWidth = pageWidth - 80;
    const descLines = pdf.splitTextToSize(project.description, maxWidth);
    pdf.text(descLines, pageWidth / 2, titleY + 35, { align: 'center', maxWidth });
  }

  // Project stats box
  const statsY = pageHeight - 60;
  pdf.setFillColor(255, 255, 255);
  pdf.setGState(pdf.GState({ opacity: 0.1 }));
  pdf.roundedRect(40, statsY - 5, pageWidth - 80, 40, 3, 3, 'F');
  pdf.setGState(pdf.GState({ opacity: 1.0 }));

  // Project metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const startDate = format(new Date(project.startDate), 'MMM dd, yyyy');

  // Calculate end date from phases
  let endDate = new Date(project.startDate);
  project.phases.forEach((phase) => {
    const phaseEnd = new Date(phase.endDate);
    if (phaseEnd > endDate) {
      endDate = phaseEnd;
    }
  });
  const endDateStr = format(endDate, 'MMM dd, yyyy');

  const stats = [
    `Start Date: ${startDate}`,
    `End Date: ${endDateStr}`,
    `Phases: ${project.phases.length}`,
    `Milestones: ${project.milestones.length}`,
  ];

  const statsStartX = 60;
  const statSpacing = (pageWidth - 120) / stats.length;
  stats.forEach((stat, index) => {
    pdf.text(stat, statsStartX + (statSpacing * index), statsY + 10);
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  const exportDate = format(new Date(), 'MMM dd, yyyy HH:mm');
  pdf.text(`Generated on ${exportDate}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
}

/**
 * Add footer with page numbers to all pages
 */
function addPDFFooter(pdf: jsPDF, project: GanttProject): void {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Add footer to each page (except cover page)
  for (let i = 2; i <= pageCount; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(229, 231, 235); // Gray-200
    pdf.setLineWidth(0.5);
    pdf.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

    // Project name (left)
    pdf.setTextColor(107, 114, 128); // Gray-500
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(project.name, 20, pageHeight - 8);

    // Page number (right)
    pdf.text(`Page ${i - 1} of ${pageCount - 1}`, pageWidth - 20, pageHeight - 8, { align: 'right' });

    // Export date (center)
    const exportDate = format(new Date(), 'MMM dd, yyyy');
    pdf.text(exportDate, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
}

/**
 * Sanitize filename by removing invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Show loading indicator overlay
 */
function showLoadingIndicator(message: string): HTMLDivElement {
  const loadingDiv = document.createElement('div');
  loadingDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = `
    background: white;
    padding: 32px 48px;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 400px;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    border: 4px solid #f3f4f6;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  `;

  const text = document.createElement('p');
  text.style.cssText = `
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  `;
  text.textContent = message;

  // Add CSS animation
  if (!document.getElementById('export-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'export-spinner-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  contentDiv.appendChild(spinner);
  contentDiv.appendChild(text);
  loadingDiv.appendChild(contentDiv);
  document.body.appendChild(loadingDiv);

  return loadingDiv;
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator(loadingDiv: HTMLDivElement): void {
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
  }
}

// ============================================================================
// ENHANCED EXPORT FUNCTIONS - Optimized Snapshots
// ============================================================================

import type {
  EnhancedExportConfig,
  EXPORT_SIZE_PRESETS,
  EXPORT_QUALITY_SETTINGS,
} from '@/types/gantt-tool';

/**
 * Export Gantt chart with enhanced configuration for professional, consistent output
 */
export async function exportGanttEnhanced(
  project: GanttProject,
  config: EnhancedExportConfig
): Promise<void> {
  const loadingDiv = showLoadingIndicator(`Exporting ${config.format.toUpperCase()}...`);

  try {
    // Get the gantt canvas element
    const originalCanvas = document.getElementById('gantt-canvas');
    if (!originalCanvas) {
      throw new Error('Gantt canvas not found');
    }

    // Create a clean clone for export
    const exportCanvas = await prepareExportCanvas(originalCanvas, project, config);

    // Capture the canvas as image
    const imageBlob = await captureCanvasAsImage(exportCanvas, config);

    // Export based on format
    if (config.format === 'png') {
      await downloadImage(imageBlob, project.name, 'png');
    } else if (config.format === 'pdf') {
      await exportImageAsPDF(imageBlob, project, config);
    } else if (config.format === 'svg') {
      // SVG export would require different implementation
      throw new Error('SVG export not yet implemented');
    }

    // Cleanup
    document.body.removeChild(exportCanvas);
    hideLoadingIndicator(loadingDiv);
  } catch (error) {
    hideLoadingIndicator(loadingDiv);
    console.error('Failed to export:', error);
    alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Prepare a clean clone of the canvas for export
 */
async function prepareExportCanvas(
  originalCanvas: HTMLElement,
  project: GanttProject,
  config: EnhancedExportConfig
): Promise<HTMLElement> {
  // Clone the canvas
  const clone = originalCanvas.cloneNode(true) as HTMLElement;
  clone.id = 'gantt-export-canvas';

  // Apply styling to make it suitable for export
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.overflow = 'visible';
  clone.style.width = 'auto';
  clone.style.height = 'auto';

  // Get size preset dimensions
  const { EXPORT_SIZE_PRESETS } = await import('@/types/gantt-tool');
  const sizePreset = EXPORT_SIZE_PRESETS[config.sizePreset];
  const targetWidth = config.sizePreset === 'custom' && config.customWidth
    ? config.customWidth
    : sizePreset.width;
  const targetHeight = config.sizePreset === 'custom' && config.customHeight
    ? config.customHeight
    : sizePreset.height;

  clone.style.width = `${targetWidth}px`;
  clone.style.height = `${targetHeight}px`;

  // Apply background
  if (config.transparentBackground) {
    clone.style.backgroundColor = 'transparent';
  } else {
    clone.style.backgroundColor = config.backgroundColor;
  }

  // Apply padding
  clone.style.padding = `${config.padding.top}px ${config.padding.right}px ${config.padding.bottom}px ${config.padding.left}px`;

  // Append to body temporarily for rendering
  document.body.appendChild(clone);

  // Hide UI controls if requested
  if (config.contentOptions.hideUIControls) {
    hideUIControls(clone);
  }

  // Hide phase names if requested
  if (config.contentOptions.hidePhaseNames) {
    const phaseTitles = clone.querySelectorAll('[data-element="phase-title"]');
    phaseTitles.forEach((el) => ((el as HTMLElement).style.display = 'none'));
  }

  // Hide task names if requested
  if (config.contentOptions.hideTaskNames) {
    const taskNames = clone.querySelectorAll('[data-element="task-name"]');
    taskNames.forEach((el) => ((el as HTMLElement).style.display = 'none'));
  }

  // Filter phases if specific phases are selected
  if (config.exportScope === 'selected-phases' && config.selectedPhaseIds) {
    filterPhases(clone, config.selectedPhaseIds);
  }

  // Add header if requested
  if (config.contentOptions.includeHeader) {
    addExportHeader(clone, project, config);
  }

  // Add footer if requested
  if (config.contentOptions.includeFooter) {
    addExportFooter(clone, project, config);
  }

  // Add legend if requested
  if (config.contentOptions.includeLegend) {
    addExportLegend(clone, project, config);
  }

  // Wait for rendering
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Calculate actual content bounds to remove empty space
  const contentBounds = calculateContentBounds(clone);

  // Adjust canvas dimensions to fit actual content (removing empty space)
  if (contentBounds.height > 0 && contentBounds.width > 0) {
    const totalHeight = contentBounds.height + config.padding.top + config.padding.bottom;
    const totalWidth = Math.min(
      contentBounds.width + config.padding.left + config.padding.right,
      targetWidth // Don't exceed preset width
    );

    clone.style.height = `${totalHeight}px`;
    clone.style.width = `${totalWidth}px`;

    // Clip grid lines and vertical elements to content bounds
    clipVerticalElementsToContentHeight(clone, contentBounds.height);

    // If there's a header or footer, make sure they're positioned correctly
    if (config.contentOptions.includeHeader) {
      const header = clone.querySelector('[data-export-element="header"]') as HTMLElement;
      if (header) {
        header.style.top = `${config.padding.top / 2}px`;
      }
    }

    if (config.contentOptions.includeFooter) {
      const footer = clone.querySelector('[data-export-element="footer"]') as HTMLElement;
      if (footer) {
        footer.style.bottom = `${config.padding.bottom / 2}px`;
      }
    }
  }

  return clone;
}

/**
 * Calculate the actual bounding box of visible content with smart trimming
 */
function calculateContentBounds(canvas: HTMLElement): { height: number; width: number } {
  // Strategy: Find all visible child elements and calculate their bounds
  const canvasRect = canvas.getBoundingClientRect();
  const visibleElements: HTMLElement[] = [];

  // Recursively find all visible elements with meaningful content
  function findVisibleElements(element: HTMLElement) {
    // Skip if element is hidden
    if (element.style.display === 'none' || element.offsetHeight === 0 || element.offsetWidth === 0) {
      return;
    }

    // Check if element has visual content (background, border, text, SVG, etc.)
    const computedStyle = window.getComputedStyle(element);
    const hasVisualContent =
      computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      computedStyle.borderWidth !== '0px' ||
      (element.textContent?.trim() !== '' && element.offsetHeight > 5) ||
      element.tagName === 'svg' ||
      element.tagName === 'SVG' ||
      element.tagName === 'IMG' ||
      element.tagName === 'CANVAS' ||
      // SVG elements with strokes or fills
      (element instanceof SVGElement && (
        computedStyle.stroke !== 'none' ||
        computedStyle.fill !== 'none' ||
        element.hasAttribute('fill') ||
        element.hasAttribute('stroke')
      )) ||
      // Elements with box shadows
      computedStyle.boxShadow !== 'none' ||
      // Elements with backgrounds or gradients
      computedStyle.backgroundImage !== 'none';

    if (hasVisualContent && (element.offsetHeight > 2 || element.offsetWidth > 2)) {
      visibleElements.push(element);
    }

    // Recurse through children
    Array.from(element.children).forEach((child) => {
      findVisibleElements(child as HTMLElement);
    });
  }

  // Start from the canvas
  Array.from(canvas.children).forEach((child) => {
    findVisibleElements(child as HTMLElement);
  });

  // If no visible elements found, return a reasonable default
  if (visibleElements.length === 0) {
    return { height: 600, width: canvas.offsetWidth };
  }

  // Calculate the bounding box (both vertical and horizontal)
  let minTop = Infinity;
  let maxBottom = 0;
  let minLeft = Infinity;
  let maxRight = 0;

  visibleElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const relativeTop = rect.top - canvasRect.top;
    const relativeBottom = relativeTop + rect.height;
    const relativeLeft = rect.left - canvasRect.left;
    const relativeRight = relativeLeft + rect.width;

    if (relativeTop < minTop) minTop = relativeTop;
    if (relativeBottom > maxBottom) maxBottom = relativeBottom;
    if (relativeLeft < minLeft) minLeft = relativeLeft;
    if (relativeRight > maxRight) maxRight = relativeRight;
  });

  // Calculate dynamic breathing room based on content size (2-4% of content, min 20px, max 60px)
  const contentHeightRaw = maxBottom - Math.max(minTop, 0);
  const contentWidthRaw = maxRight - Math.max(minLeft, 0);
  const verticalBreathingRoom = Math.min(Math.max(contentHeightRaw * 0.03, 20), 60);
  const horizontalBreathingRoom = Math.min(Math.max(contentWidthRaw * 0.02, 16), 40);

  // Add breathing room and ensure minimum dimensions
  const contentHeight = Math.max(contentHeightRaw + verticalBreathingRoom, 200);
  const contentWidth = Math.max(contentWidthRaw + (horizontalBreathingRoom * 2), 400);

  return {
    height: contentHeight,
    width: contentWidth,
  };
}

/**
 * Clip vertical grid lines and other vertical elements to actual content height
 */
function clipVerticalElementsToContentHeight(canvas: HTMLElement, contentHeight: number): void {
  // Find all elements that might extend beyond content (grid lines, milestone lines, etc.)
  const verticalElements = canvas.querySelectorAll('div[class*="h-[calc(100vh"]');

  verticalElements.forEach((el) => {
    const element = el as HTMLElement;
    // Remove viewport-based height classes and set explicit height
    element.style.height = `${contentHeight}px`;
    element.style.maxHeight = `${contentHeight}px`;
  });

  // Also find divs with very large heights that might be grid lines
  const allDivs = canvas.querySelectorAll('div');
  allDivs.forEach((div) => {
    const element = div as HTMLElement;
    const height = element.offsetHeight;

    // If element is taller than content + 100px buffer, it's likely a grid line
    if (height > contentHeight + 100) {
      element.style.height = `${contentHeight}px`;
      element.style.maxHeight = `${contentHeight}px`;
    }
  });
}

/**
 * Hide UI controls like buttons, drag handles, hover effects
 */
function hideUIControls(canvas: HTMLElement): void {
  // Hide common UI control selectors
  const selectors = [
    'button',
    '[data-element="drag-handle"]',
    '[data-element="resize-handle"]',
    '[data-element="action-button"]',
    '.gantt-controls',
    '.hover-indicator',
    '.selection-indicator',
    '[data-interactive="true"]',
  ];

  selectors.forEach((selector) => {
    const elements = canvas.querySelectorAll(selector);
    elements.forEach((el) => ((el as HTMLElement).style.display = 'none'));
  });
}

/**
 * Filter to show only selected phases
 */
function filterPhases(canvas: HTMLElement, selectedPhaseIds: string[]): void {
  const phaseElements = canvas.querySelectorAll('[data-phase-id]');

  phaseElements.forEach((el) => {
    const phaseId = (el as HTMLElement).getAttribute('data-phase-id');
    if (phaseId && !selectedPhaseIds.includes(phaseId)) {
      (el as HTMLElement).style.display = 'none';
    }
  });
}

/**
 * Add header with project name and date range
 */
function addExportHeader(
  canvas: HTMLElement,
  project: GanttProject,
  config: EnhancedExportConfig
): void {
  const header = document.createElement('div');
  header.setAttribute('data-export-element', 'header');
  header.style.cssText = `
    position: absolute;
    top: ${config.padding.top / 2}px;
    left: ${config.padding.left}px;
    right: ${config.padding.right}px;
    text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  const title = document.createElement('h1');
  title.style.cssText = `
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #111827;
  `;
  title.textContent = project.name;

  const dateRange = document.createElement('p');
  dateRange.style.cssText = `
    margin: 8px 0 0 0;
    font-size: 14px;
    color: #6B7280;
  `;

  // Calculate date range
  const startDate = new Date(project.startDate);
  let endDate = startDate;
  project.phases.forEach((phase) => {
    const phaseEnd = new Date(phase.endDate);
    if (phaseEnd > endDate) {
      endDate = phaseEnd;
    }
  });

  dateRange.textContent = `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`;

  header.appendChild(title);
  header.appendChild(dateRange);
  canvas.insertBefore(header, canvas.firstChild);
}

/**
 * Add footer with export metadata and branding
 */
function addExportFooter(
  canvas: HTMLElement,
  project: GanttProject,
  config: EnhancedExportConfig
): void {
  const footer = document.createElement('div');
  footer.setAttribute('data-export-element', 'footer');
  footer.style.cssText = `
    position: absolute;
    bottom: ${config.padding.bottom / 2}px;
    left: ${config.padding.left}px;
    right: ${config.padding.right}px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 11px;
    color: #9CA3AF;
    border-top: 1px solid #E5E7EB;
    padding-top: 8px;
  `;

  // Left: Project name
  const projectName = document.createElement('span');
  projectName.style.cssText = 'font-weight: 500; color: #6B7280;';
  projectName.textContent = project.name;

  // Center: Export date
  const exportDate = document.createElement('span');
  const dateStr = format(new Date(), 'MMM dd, yyyy HH:mm');
  exportDate.textContent = `Exported: ${dateStr}`;

  // Right: Branding
  const branding = document.createElement('span');
  branding.style.cssText = 'font-weight: 500; color: #3B82F6;';
  branding.textContent = 'Keystone';

  footer.appendChild(projectName);
  footer.appendChild(exportDate);
  footer.appendChild(branding);

  canvas.appendChild(footer);
}

/**
 * Add legend for phases and tasks
 */
function addExportLegend(
  canvas: HTMLElement,
  project: GanttProject,
  config: EnhancedExportConfig
): void {
  const legend = document.createElement('div');
  legend.style.cssText = `
    position: absolute;
    bottom: ${config.padding.bottom + 40}px;
    left: ${config.padding.left}px;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
  `;

  // Add phase colors to legend
  project.phases.forEach((phase) => {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: ${phase.color};
      border-radius: 2px;
    `;

    const label = document.createElement('span');
    label.style.color = '#374151';
    label.textContent = phase.name;

    item.appendChild(colorBox);
    item.appendChild(label);
    legend.appendChild(item);
  });

  canvas.appendChild(legend);
}

/**
 * Capture canvas element as high-quality image blob
 */
async function captureCanvasAsImage(
  canvas: HTMLElement,
  config: EnhancedExportConfig
): Promise<Blob> {
  // Get quality settings
  const { EXPORT_QUALITY_SETTINGS } = await import('@/types/gantt-tool');
  const qualitySetting = EXPORT_QUALITY_SETTINGS[config.quality];
  const scale = qualitySetting.scale;

  // Use html2canvas to capture
  const canvasElement = await html2canvas(canvas, {
    backgroundColor: config.transparentBackground ? null : config.backgroundColor,
    scale: scale,
    logging: false,
    useCORS: true,
    allowTaint: true,
    width: canvas.offsetWidth,
    height: canvas.offsetHeight,
    windowWidth: canvas.offsetWidth,
    windowHeight: canvas.offsetHeight,
  });

  return new Promise((resolve, reject) => {
    canvasElement.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Download image blob as file
 */
async function downloadImage(blob: Blob, projectName: string, format: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${sanitizeFilename(projectName)}-gantt-export.${format}`;
  link.href = url;
  link.click();

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export image blob as PDF with proper sizing
 */
async function exportImageAsPDF(
  imageBlob: Blob,
  project: GanttProject,
  config: EnhancedExportConfig
): Promise<void> {
  // Get size preset
  const { EXPORT_SIZE_PRESETS } = await import('@/types/gantt-tool');
  const sizePreset = EXPORT_SIZE_PRESETS[config.sizePreset];
  const targetWidth = config.sizePreset === 'custom' && config.customWidth
    ? config.customWidth
    : sizePreset.width;
  const targetHeight = config.sizePreset === 'custom' && config.customHeight
    ? config.customHeight
    : sizePreset.height;

  // Convert blob to data URL
  const imageDataUrl = await blobToDataURL(imageBlob);

  // Create PDF with custom dimensions
  const pdf = new jsPDF({
    orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [targetWidth, targetHeight],
  });

  // Add professional cover page (convert mm to px for consistency)
  const mmToPx = (mm: number) => mm * 3.7795275591; // 1mm = 3.78px
  const a4Width = mmToPx(targetWidth > targetHeight ? 297 : 210);
  const a4Height = mmToPx(targetWidth > targetHeight ? 210 : 297);

  // Create cover page in mm units first
  const coverPdf = new jsPDF({
    orientation: targetWidth > targetHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  addProfessionalCoverPage(coverPdf, project);

  // Convert cover page to image and add to main PDF
  const coverPageBlob = await new Promise<Blob>((resolve) => {
    const coverCanvas = document.createElement('canvas');
    coverCanvas.width = a4Width;
    coverCanvas.height = a4Height;
    const ctx = coverCanvas.getContext('2d');
    if (ctx) {
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4Width, a4Height);
    }
    coverCanvas.toBlob((blob) => resolve(blob!), 'image/png');
  });

  pdf.addPage();

  // Add gantt chart image to fit the page exactly
  pdf.addImage(imageDataUrl, 'PNG', 0, 0, targetWidth, targetHeight);

  // Add footer with page numbers
  addPDFFooter(pdf, project);

  // Add enhanced metadata
  pdf.setProperties({
    title: `${project.name} - Project Gantt Chart`,
    author: 'Keystone - RFP to Proposal in 10 Minutes',
    subject: `Project Timeline - ${project.name}`,
    creator: 'Keystone Gantt Chart Tool',
    keywords: 'gantt, project, timeline, schedule, planning',
  });

  // Download
  pdf.save(`${sanitizeFilename(project.name)}-gantt-export.pdf`);
}

/**
 * Convert blob to data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============================================================================
// ORG CHART EXPORT FUNCTIONS
// ============================================================================

/**
 * Export organization chart to PNG with optimized content bounds
 */
export async function exportOrgChartToPNG(
  projectName: string,
  elementId: string = 'org-chart-container'
): Promise<void> {
  const loadingDiv = showLoadingIndicator('Exporting Organization Chart...');

  try {
    const orgChartElement = document.getElementById(elementId);
    if (!orgChartElement) {
      throw new Error('Organization chart not found');
    }

    // Clone the element for export
    const clone = orgChartElement.cloneNode(true) as HTMLElement;
    clone.id = 'org-chart-export-clone';

    // Position off-screen and prepare for export
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.backgroundColor = '#ffffff';
    clone.style.padding = '40px';

    // Remove any interactive elements (buttons, links, etc.)
    document.body.appendChild(clone);

    // Hide buttons and interactive elements
    const buttons = clone.querySelectorAll('button');
    buttons.forEach((btn) => (btn.style.display = 'none'));

    // Wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Capture with html2canvas
    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 3, // High quality for org chart
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Cleanup clone
    document.body.removeChild(clone);

    // Download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${sanitizeFilename(projectName)}-org-chart.png`;
      link.href = url;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 100);
      hideLoadingIndicator(loadingDiv);
    }, 'image/png');
  } catch (error) {
    hideLoadingIndicator(loadingDiv);
    console.error('Failed to export org chart:', error);
    alert(`Failed to export org chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export organization chart to PDF
 */
export async function exportOrgChartToPDF(
  projectName: string,
  elementId: string = 'org-chart-container'
): Promise<void> {
  const loadingDiv = showLoadingIndicator('Exporting Organization Chart to PDF...');

  try {
    const orgChartElement = document.getElementById(elementId);
    if (!orgChartElement) {
      throw new Error('Organization chart not found');
    }

    // Clone the element for export
    const clone = orgChartElement.cloneNode(true) as HTMLElement;
    clone.id = 'org-chart-export-clone';

    // Position off-screen and prepare for export
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.backgroundColor = '#ffffff';
    clone.style.padding = '40px';

    // Remove any interactive elements
    document.body.appendChild(clone);

    // Hide buttons and interactive elements
    const buttons = clone.querySelectorAll('button');
    buttons.forEach((btn) => (btn.style.display = 'none'));

    // Wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Capture with html2canvas
    const canvas = await html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 3,
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Cleanup clone
    document.body.removeChild(clone);

    // Create PDF
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width / 3, canvas.height / 3], // Adjust for scale
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 3, canvas.height / 3);

    pdf.setProperties({
      title: `${projectName} - Organization Chart`,
      author: 'Gantt Chart Tool',
      subject: 'Organization Structure',
      creator: 'Gantt Chart Tool',
    });

    pdf.save(`${sanitizeFilename(projectName)}-org-chart.pdf`);
    hideLoadingIndicator(loadingDiv);
  } catch (error) {
    hideLoadingIndicator(loadingDiv);
    console.error('Failed to export org chart to PDF:', error);
    alert(`Failed to export org chart to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
