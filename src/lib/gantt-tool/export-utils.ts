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

/**
 * Export Gantt chart to PNG image
 */
export async function exportToPNG(project: GanttProject): Promise<void> {
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

    // Generate canvas from HTML
    const canvas = await html2canvas(canvasElement, {
      backgroundColor: '#ffffff',
      scale: 2, // High resolution
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
      scale: 2,
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

    // Calculate dimensions
    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Add image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add metadata
    pdf.setProperties({
      title: `${project.name} - Gantt Chart`,
      author: 'Gantt Chart Tool',
      subject: 'Project Timeline',
      creator: 'Gantt Chart Tool',
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
