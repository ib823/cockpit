/**
 * Export resource analytics to Excel
 *
 * Generates a comprehensive Excel workbook with multiple sheets:
 * - Summary: KPIs and overview
 * - Resources: Detailed resource list
 * - Categories: Category breakdown
 * - Designations: Designation breakdown
 * - Timeline: Week-by-week allocation
 */

import ExcelJS from 'exceljs';
import type { GanttProject } from '@/types/gantt-tool';
import type {
  ResourceMetrics,
  CategoryMetrics,
  DesignationMetrics,
  ResourceAnalyticsSummary,
} from '@/stores/resource-analytics-selectors';
import { RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';

export async function exportResourcesToExcel(
  project: GanttProject,
  resources: ResourceMetrics[],
  categories: CategoryMetrics[],
  designations: DesignationMetrics[],
  summary: ResourceAnalyticsSummary
) {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'Gantt Tool';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: true }],
  });

  summarySheet.columns = [
    { key: 'metric', width: 30 },
    { key: 'value', width: 20 },
  ];

  // Add header
  summarySheet.addRow(['Resource Analytics Summary']);
  summarySheet.getRow(1).font = { size: 16, bold: true };
  summarySheet.addRow([`Project: ${project.name}`]);
  summarySheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
  summarySheet.addRow([]);

  // Add KPIs
  summarySheet.addRow(['Key Performance Indicators']);
  summarySheet.getRow(5).font = { bold: true };
  summarySheet.addRow(['Total Effort (person-days)', summary.totalEffortDays.toFixed(1)]);
  summarySheet.addRow(['Active Resources', summary.activeResources]);
  summarySheet.addRow(['Total Resources', summary.totalResources]);
  summarySheet.addRow(['Average Utilization (%)', summary.averageUtilization.toFixed(1)]);
  summarySheet.addRow(['Total Tasks', summary.totalTasks]);
  summarySheet.addRow(['Overallocated Resources', summary.overallocatedResources]);

  // Style the KPI section
  summarySheet.getCell('A6').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' },
  };
  summarySheet.getCell('B6').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' },
  };

  // Sheet 2: Resources
  const resourcesSheet = workbook.addWorksheet('Resources');

  resourcesSheet.columns = [
    { key: 'name', header: 'Resource Name', width: 30 },
    { key: 'category', header: 'Category', width: 20 },
    { key: 'designation', header: 'Designation', width: 20 },
    { key: 'totalEffort', header: 'Total Effort (days)', width: 20 },
    { key: 'taskCount', header: 'Task Count', width: 15 },
    { key: 'utilization', header: 'Utilization (%)', width: 18 },
    { key: 'peak', header: 'Peak Allocation (%)', width: 20 },
  ];

  // Style header
  resourcesSheet.getRow(1).font = { bold: true };
  resourcesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1976D2' },
  };
  resourcesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  resources.forEach(resource => {
    const categoryInfo = RESOURCE_CATEGORIES[resource.category];
    resourcesSheet.addRow({
      name: resource.resourceName,
      category: categoryInfo.label,
      designation: RESOURCE_DESIGNATIONS[resource.designation],
      totalEffort: parseFloat(resource.totalEffortDays.toFixed(1)),
      taskCount: resource.taskCount,
      utilization: parseFloat(resource.utilizationScore.toFixed(1)),
      peak: parseFloat(resource.peakAllocation.toFixed(1)),
    });

    // Highlight overallocated resources
    const lastRow = resourcesSheet.lastRow;
    if (lastRow && resource.peakAllocation > 100) {
      lastRow.getCell('peak').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEBEE' },
      };
      lastRow.getCell('peak').font = { color: { argb: 'FFD32F2F' }, bold: true };
    }
  });

  // Sheet 3: Categories
  const categoriesSheet = workbook.addWorksheet('By Category');

  categoriesSheet.columns = [
    { key: 'category', header: 'Category', width: 30 },
    { key: 'resources', header: 'Resource Count', width: 18 },
    { key: 'effort', header: 'Total Effort (days)', width: 20 },
    { key: 'avgUtil', header: 'Avg Utilization (%)', width: 20 },
    { key: 'tasks', header: 'Total Tasks', width: 15 },
  ];

  // Style header
  categoriesSheet.getRow(1).font = { bold: true };
  categoriesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' },
  };
  categoriesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  categories.forEach(cat => {
    const categoryInfo = RESOURCE_CATEGORIES[cat.category];
    categoriesSheet.addRow({
      category: `${categoryInfo.icon} ${categoryInfo.label}`,
      resources: cat.resourceCount,
      effort: parseFloat(cat.totalEffortDays.toFixed(1)),
      avgUtil: parseFloat(cat.averageUtilization.toFixed(1)),
      tasks: cat.taskCount,
    });
  });

  // Sheet 4: Designations
  const designationsSheet = workbook.addWorksheet('By Designation');

  designationsSheet.columns = [
    { key: 'designation', header: 'Designation', width: 30 },
    { key: 'resources', header: 'Resource Count', width: 18 },
    { key: 'effort', header: 'Total Effort (days)', width: 20 },
    { key: 'avgUtil', header: 'Avg Utilization (%)', width: 20 },
  ];

  // Style header
  designationsSheet.getRow(1).font = { bold: true };
  designationsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9C27B0' },
  };
  designationsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  designations.forEach(des => {
    designationsSheet.addRow({
      designation: RESOURCE_DESIGNATIONS[des.designation],
      resources: des.resourceCount,
      effort: parseFloat(des.totalEffortDays.toFixed(1)),
      avgUtil: parseFloat(des.averageUtilization.toFixed(1)),
    });
  });

  // Sheet 5: Detailed Assignments
  const assignmentsSheet = workbook.addWorksheet('Assignments');

  assignmentsSheet.columns = [
    { key: 'resource', header: 'Resource', width: 30 },
    { key: 'task', header: 'Task', width: 30 },
    { key: 'phase', header: 'Phase', width: 25 },
    { key: 'startDate', header: 'Start Date', width: 15 },
    { key: 'endDate', header: 'End Date', width: 15 },
    { key: 'allocation', header: 'Allocation (%)', width: 15 },
    { key: 'effort', header: 'Effort (days)', width: 15 },
    { key: 'notes', header: 'Notes', width: 40 },
  ];

  // Style header
  assignmentsSheet.getRow(1).font = { bold: true };
  assignmentsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFF9800' },
  };
  assignmentsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add all assignments
  resources.forEach(resource => {
    resource.assignments.forEach(assignment => {
      assignmentsSheet.addRow({
        resource: resource.resourceName,
        task: assignment.taskName,
        phase: assignment.phaseName,
        startDate: assignment.startDate.toLocaleDateString(),
        endDate: assignment.endDate.toLocaleDateString(),
        allocation: assignment.allocationPercentage,
        effort: parseFloat(assignment.effortDays.toFixed(1)),
        notes: assignment.assignmentNotes || '',
      });
    });
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.name.replace(/\s+/g, '-')}-resources-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
