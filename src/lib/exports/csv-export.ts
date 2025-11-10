/**
 * CSV Export Utility
 *
 * Exports estimator results and phase data to CSV format.
 * Useful for importing into spreadsheets and other tools.
 */

import type { EstimatorResults, PhaseBreakdown } from "@/lib/estimator/types";

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");

  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\n");
}

/**
 * Generate CSV for phase breakdown
 */
export function generatePhaseCSV(phases: PhaseBreakdown[], totalMD: number): string {
  const data = phases.map((phase) => ({
    Phase: phase.phaseName,
    "Effort (MD)": phase.effortMD.toFixed(1),
    "Duration (months)": phase.durationMonths.toFixed(1),
    "% of Total": ((phase.effortMD / totalMD) * 100).toFixed(0) + "%",
  }));

  // Add total row
  data.push({
    Phase: "TOTAL" as any,
    "Effort (MD)": phases.reduce((sum, p) => sum + p.effortMD, 0).toFixed(1),
    "Duration (months)": phases.reduce((sum, p) => sum + p.durationMonths, 0).toFixed(1),
    "% of Total": "100%",
  });

  return arrayToCSV(data);
}

/**
 * Generate comprehensive CSV report
 */
export function generateFullCSVReport(results: EstimatorResults, profileName: string): string {
  const sections: string[] = [];

  // Summary section
  sections.push("SAP S/4HANA Project Estimate");
  sections.push(`Generated,${new Date().toISOString()}`);
  sections.push(`Profile,${profileName}`);
  sections.push("");
  sections.push("Summary");
  sections.push("Metric,Value");
  sections.push(`Total Effort,${results.totalMD.toFixed(0)} MD`);
  sections.push(`Duration,${results.durationMonths.toFixed(1)} months`);
  sections.push(`PMO Effort,${results.pmoMD.toFixed(0)} MD`);
  sections.push(`Monthly Capacity,${results.capacityPerMonth.toFixed(1)} MD/month`);
  sections.push("");

  // Coefficients section
  sections.push("Complexity Coefficients");
  sections.push("Coefficient,Value");
  sections.push(`Scope Breadth (Sb),${results.coefficients.Sb.toFixed(3)}`);
  sections.push(`Process Complexity (Pc),${results.coefficients.Pc.toFixed(3)}`);
  sections.push(`Organizational Scale (Os),${results.coefficients.Os.toFixed(3)}`);
  sections.push("");

  // Phase breakdown section
  sections.push("Phase Breakdown");
  sections.push(generatePhaseCSV(results.phases, results.totalMD));

  return sections.join("\n");
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSVReport(
  results: EstimatorResults,
  profileName: string,
  filename: string = "sap-estimate.csv"
): void {
  const csvContent = generateFullCSVReport(results, profileName);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate timeline CSV export
 */
export function generateTimelineCSV(phases: PhaseBreakdown[], startDate: Date): string {
  let currentDate = new Date(startDate);

  const data = phases.map((phase) => {
    const start = new Date(currentDate);
    const durationDays = Math.round(phase.durationMonths * 22); // Working days
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    currentDate = new Date(end);

    return {
      Phase: phase.phaseName,
      "Start Date": start.toISOString().split("T")[0],
      "End Date": end.toISOString().split("T")[0],
      "Effort (MD)": phase.effortMD.toFixed(1),
      "Duration (months)": phase.durationMonths.toFixed(1),
      "Duration (days)": durationDays,
    };
  });

  return arrayToCSV(data);
}

/**
 * Download timeline CSV
 */
export function downloadTimelineCSV(
  phases: PhaseBreakdown[],
  startDate: Date,
  filename: string = "sap-timeline.csv"
): void {
  const csvContent = generateTimelineCSV(phases, startDate);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
