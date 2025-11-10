/**
 * Export Engine - PDF, Excel, PowerPoint Export
 *
 * Handles exporting dashboard data to various formats
 */

import { GanttProject } from "@/types/gantt-tool";
import { CostBreakdown, MarginAnalysis } from "./calculation-engine";
import { formatMYR } from "@/lib/rate-card";

export interface ExportData {
  project: GanttProject;
  costBreakdown: CostBreakdown;
  margins: MarginAnalysis;
  revenue: number;
  timestamp: Date;
}

/**
 * Export dashboard to Excel (CSV format)
 * Returns a data URL that can be downloaded
 */
export function exportToCSV(data: ExportData): string {
  const { project, costBreakdown, margins, revenue } = data;

  const rows: string[][] = [];

  // Header section
  rows.push(["SAP Implementation Proposal Dashboard"]);
  rows.push(["Project:", project.name]);
  rows.push(["Generated:", new Date().toLocaleString()]);
  rows.push([]);

  // Financial Summary
  rows.push(["FINANCIAL SUMMARY"]);
  rows.push(["Metric", "Value"]);
  rows.push(["Total Revenue", formatMYR(revenue)]);
  rows.push(["Total Cost", formatMYR(costBreakdown.totalCost)]);
  rows.push(["Gross Margin", formatMYR(margins.grossMargin)]);
  rows.push(["Gross Margin %", `${margins.grossMarginPercent.toFixed(2)}%`]);
  rows.push(["Break-even Revenue", formatMYR(margins.breakEvenRevenue)]);
  rows.push([]);

  // Cost by Phase
  rows.push(["COST BY PHASE"]);
  rows.push(["Phase", "Cost"]);
  project.phases.forEach((phase) => {
    const phaseCost = costBreakdown.costByPhase.get(phase.id) || 0;
    rows.push([phase.name, formatMYR(phaseCost)]);
  });
  rows.push([]);

  // Cost by Resource Category
  rows.push(["COST BY RESOURCE CATEGORY"]);
  rows.push(["Category", "Cost"]);
  Array.from(costBreakdown.costByCategory.entries()).forEach(([category, cost]) => {
    rows.push([category.replace(/_/g, " ").toUpperCase(), formatMYR(cost)]);
  });
  rows.push([]);

  // Cost by Resource
  rows.push(["COST BY RESOURCE"]);
  rows.push(["Resource ID", "Cost"]);
  Array.from(costBreakdown.costByResource.entries()).forEach(([resourceId, cost]) => {
    const resource = project.resources?.find((r) => r.id === resourceId);
    const resourceName = resource ? resource.name : resourceId;
    rows.push([resourceName, formatMYR(cost)]);
  });
  rows.push([]);

  // Project Metrics
  rows.push(["PROJECT METRICS"]);
  rows.push(["Metric", "Value"]);
  rows.push(["Total Phases", project.phases.length.toString()]);
  rows.push(["Total Resources", (project.resources?.length || 0).toString()]);
  rows.push(["Total Effort (person-days)", costBreakdown.totalEffort.toFixed(2)]);
  rows.push(["Variable Cost", formatMYR(costBreakdown.variableCost)]);
  rows.push(["Fixed Costs", formatMYR(costBreakdown.fixedCosts)]);

  // Convert to CSV string
  const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  // Create data URL
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  return url;
}

/**
 * Export dashboard to Excel (XLSX format using HTML table)
 * Returns HTML that can be saved as .xls
 */
export function exportToExcel(data: ExportData): string {
  const { project, costBreakdown, margins, revenue } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #667eea; color: white; font-weight: bold; }
    .header { font-size: 24px; font-weight: bold; margin: 20px 0; }
    .section { font-size: 18px; font-weight: bold; margin: 15px 0; background-color: #f0f0f0; padding: 10px; }
    .metric { font-weight: bold; }
    .positive { color: green; }
    .negative { color: red; }
  </style>
</head>
<body>
  <div class="header">📊 SAP Implementation Proposal Dashboard</div>
  <p><strong>Project:</strong> ${project.name}</p>
  <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>

  <div class="section">💰 Financial Summary</div>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td class="metric">Total Revenue</td>
      <td>${formatMYR(revenue)}</td>
    </tr>
    <tr>
      <td class="metric">Total Cost</td>
      <td>${formatMYR(costBreakdown.totalCost)}</td>
    </tr>
    <tr>
      <td class="metric">Gross Margin</td>
      <td class="${margins.grossMargin >= 0 ? "positive" : "negative"}">${formatMYR(margins.grossMargin)}</td>
    </tr>
    <tr>
      <td class="metric">Gross Margin %</td>
      <td class="${margins.grossMarginPercent >= 20 ? "positive" : "negative"}">${margins.grossMarginPercent.toFixed(2)}%</td>
    </tr>
    <tr>
      <td class="metric">Break-even Revenue</td>
      <td>${formatMYR(margins.breakEvenRevenue)}</td>
    </tr>
    <tr>
      <td class="metric">Contribution Margin</td>
      <td>${formatMYR(margins.contributionMargin)}</td>
    </tr>
  </table>

  <div class="section">📊 Cost by Phase</div>
  <table>
    <tr>
      <th>Phase</th>
      <th>Cost</th>
    </tr>
    ${project.phases
      .map((phase) => {
        const phaseCost = costBreakdown.costByPhase.get(phase.id) || 0;
        return `<tr><td>${phase.name}</td><td>${formatMYR(phaseCost)}</td></tr>`;
      })
      .join("")}
  </table>

  <div class="section">👥 Cost by Resource Category</div>
  <table>
    <tr>
      <th>Category</th>
      <th>Cost</th>
    </tr>
    ${Array.from(costBreakdown.costByCategory.entries())
      .map(([category, cost]) => {
        return `<tr><td>${category.replace(/_/g, " ").toUpperCase()}</td><td>${formatMYR(cost)}</td></tr>`;
      })
      .join("")}
  </table>

  <div class="section">🔧 Cost by Resource</div>
  <table>
    <tr>
      <th>Resource</th>
      <th>Cost</th>
    </tr>
    ${Array.from(costBreakdown.costByResource.entries())
      .map(([resourceId, cost]) => {
        const resource = project.resources?.find((r) => r.id === resourceId);
        const resourceName = resource ? resource.name : resourceId;
        return `<tr><td>${resourceName}</td><td>${formatMYR(cost)}</td></tr>`;
      })
      .join("")}
  </table>

  <div class="section">📈 Project Metrics</div>
  <table>
    <tr>
      <th>Metric</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Total Phases</td>
      <td>${project.phases.length}</td>
    </tr>
    <tr>
      <td>Total Resources</td>
      <td>${project.resources?.length || 0}</td>
    </tr>
    <tr>
      <td>Total Effort (person-days)</td>
      <td>${costBreakdown.totalEffort.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Variable Cost</td>
      <td>${formatMYR(costBreakdown.variableCost)}</td>
    </tr>
    <tr>
      <td>Fixed Costs</td>
      <td>${formatMYR(costBreakdown.fixedCosts)}</td>
    </tr>
  </table>

  <hr>
  <p style="color: #666; font-size: 12px;">
    Generated by Keystone - Claude Code
  </p>
</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);

  return url;
}

/**
 * Export dashboard to PDF (using print-friendly HTML)
 * Returns HTML that can be printed to PDF
 */
export function exportToPDF(data: ExportData): string {
  const { project, costBreakdown, margins, revenue } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Dashboard Report</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      color: #667eea;
      font-size: 28pt;
      margin: 0;
    }

    .metadata {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 30px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }

    .section h2 {
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }

    th {
      background-color: #667eea;
      color: white;
      font-weight: bold;
    }

    tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }

    .kpi-card {
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }

    .kpi-card.positive {
      border-color: #10B981;
      background-color: #ECFDF5;
    }

    .kpi-card.negative {
      border-color: #EF4444;
      background-color: #FEE2E2;
    }

    .kpi-label {
      font-size: 10pt;
      color: #666;
      margin-bottom: 5px;
    }

    .kpi-value {
      font-size: 20pt;
      font-weight: bold;
      color: #333;
    }

    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 10pt;
    }

    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Proposal Dashboard Report</h1>
    <p style="font-size: 16pt; margin: 10px 0;">${project.name}</p>
  </div>

  <div class="metadata">
    <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
    <div><strong>Total Phases:</strong> ${project.phases.length}</div>
    <div><strong>Total Resources:</strong> ${project.resources?.length || 0}</div>
    <div><strong>Total Effort:</strong> ${costBreakdown.totalEffort.toFixed(2)} person-days</div>
  </div>

  <div class="section">
    <h2>💰 Financial Summary</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total Revenue</div>
        <div class="kpi-value">${formatMYR(revenue)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Total Cost</div>
        <div class="kpi-value">${formatMYR(costBreakdown.totalCost)}</div>
      </div>
      <div class="kpi-card ${margins.grossMarginPercent >= 20 ? "positive" : "negative"}">
        <div class="kpi-label">Gross Margin</div>
        <div class="kpi-value">${margins.grossMarginPercent.toFixed(1)}%</div>
        <div class="kpi-label">${formatMYR(margins.grossMargin)}</div>
      </div>
    </div>

    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Break-even Revenue</td>
        <td>${formatMYR(margins.breakEvenRevenue)}</td>
      </tr>
      <tr>
        <td>Contribution Margin</td>
        <td>${formatMYR(margins.contributionMargin)}</td>
      </tr>
      <tr>
        <td>Variable Cost</td>
        <td>${formatMYR(costBreakdown.variableCost)}</td>
      </tr>
      <tr>
        <td>Fixed Costs</td>
        <td>${formatMYR(costBreakdown.fixedCosts)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>📊 Cost Breakdown by Phase</h2>
    <table>
      <tr>
        <th>Phase</th>
        <th>Cost</th>
        <th>% of Total</th>
      </tr>
      ${project.phases
        .map((phase) => {
          const phaseCost = costBreakdown.costByPhase.get(phase.id) || 0;
          const percentage = ((phaseCost / costBreakdown.totalCost) * 100).toFixed(1);
          return `
          <tr>
            <td>${phase.name}</td>
            <td>${formatMYR(phaseCost)}</td>
            <td>${percentage}%</td>
          </tr>
        `;
        })
        .join("")}
    </table>
  </div>

  <div class="section">
    <h2>👥 Cost by Resource Category</h2>
    <table>
      <tr>
        <th>Category</th>
        <th>Cost</th>
        <th>% of Total</th>
      </tr>
      ${Array.from(costBreakdown.costByCategory.entries())
        .map(([category, cost]) => {
          const percentage = ((cost / costBreakdown.totalCost) * 100).toFixed(1);
          return `
          <tr>
            <td>${category.replace(/_/g, " ").toUpperCase()}</td>
            <td>${formatMYR(cost)}</td>
            <td>${percentage}%</td>
          </tr>
        `;
        })
        .join("")}
    </table>
  </div>

  <div class="footer">
    <p>Generated by Keystone - Claude Code</p>
    <p>Confidential - For Internal Use Only</p>
  </div>

  <script>
    // Auto-print when opened (can be disabled)
    // window.onload = () => window.print();
  </script>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Trigger download of exported file
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object after a delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export dashboard with format selection
 */
export function exportDashboard(data: ExportData, format: "csv" | "excel" | "pdf"): void {
  const timestamp = new Date().toISOString().split("T")[0];
  const projectName = data.project.name.replace(/[^a-zA-Z0-9]/g, "_");

  switch (format) {
    case "csv": {
      const url = exportToCSV(data);
      downloadFile(url, `${projectName}_dashboard_${timestamp}.csv`);
      break;
    }
    case "excel": {
      const url = exportToExcel(data);
      downloadFile(url, `${projectName}_dashboard_${timestamp}.xls`);
      break;
    }
    case "pdf": {
      const html = exportToPDF(data);
      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      break;
    }
  }
}
