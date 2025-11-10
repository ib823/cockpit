/**
 * PowerPoint Export Engine
 *
 * Generates professional PowerPoint presentations using pptxgenjs.
 * Includes summary slides, phase breakdown, and charts.
 */

import pptxgen from "pptxgenjs";
import type { EstimatorResults } from "@/lib/estimator/types";

/**
 * Generate PowerPoint presentation
 */
export async function generatePowerPointReport(
  results: EstimatorResults,
  profileName: string
): Promise<Blob> {
  const pptx = new pptxgen();

  // Set presentation properties
  pptx.author = "Keystone";
  pptx.company = "SAP Partner";
  pptx.subject = "Project Estimate";
  pptx.title = "SAP S/4HANA Implementation Estimate";

  // Define color scheme
  const colors = {
    primary: "1890FF",
    secondary: "52C41A",
    accent: "FA8C16",
    text: "333333",
    lightGray: "F0F0F0",
  };

  // Slide 1: Title
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: colors.primary };
  titleSlide.addText("SAP S/4HANA Implementation Estimate", {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: "FFFFFF",
    align: "center",
  });
  titleSlide.addText(`Profile: ${profileName}`, {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 20,
    color: "FFFFFF",
    align: "center",
  });
  titleSlide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 0.5,
    y: 4.0,
    w: 9,
    h: 0.4,
    fontSize: 16,
    color: "FFFFFF",
    align: "center",
  });

  // Slide 2: Executive Summary
  const summarySlide = pptx.addSlide();
  summarySlide.addText("Executive Summary", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const summaryData = [
    [{ text: "Metric" }, { text: "Value" }],
    [{ text: "Total Effort" }, { text: `${results.totalMD.toFixed(0)} MD` }],
    [{ text: "Project Duration" }, { text: `${results.durationMonths.toFixed(1)} months` }],
    [{ text: "PMO Effort" }, { text: `${results.pmoMD.toFixed(0)} MD` }],
    [{ text: "Monthly Capacity" }, { text: `${results.capacityPerMonth.toFixed(1)} MD/month` }],
    [{ text: "Scope Breadth (Sb)" }, { text: results.coefficients.Sb.toFixed(3) }],
    [{ text: "Process Complexity (Pc)" }, { text: results.coefficients.Pc.toFixed(3) }],
    [{ text: "Organizational Scale (Os)" }, { text: results.coefficients.Os.toFixed(3) }],
  ];

  summarySlide.addTable(summaryData, {
    x: 1.0,
    y: 1.5,
    w: 8.0,
    h: 3.5,
    colW: [4.0, 4.0],
    fontSize: 18,
    color: colors.text,
    fill: { color: colors.lightGray },
    border: { pt: 1, color: "CCCCCC" },
    align: "left",
    valign: "middle",
  });

  // Slide 3: Phase Breakdown
  const phaseSlide = pptx.addSlide();
  phaseSlide.addText("SAP Activate Phase Breakdown", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const phaseData = [
    [{ text: "Phase" }, { text: "Effort (MD)" }, { text: "Duration (mo)" }, { text: "% of Total" }],
    ...results.phases.map((phase) => [
      { text: phase.phaseName },
      { text: phase.effortMD.toFixed(1) },
      { text: phase.durationMonths.toFixed(1) },
      { text: `${((phase.effortMD / results.totalMD) * 100).toFixed(0)}%` },
    ]),
    [
      { text: "Total" },
      { text: results.totalMD.toFixed(1) },
      { text: results.durationMonths.toFixed(1) },
      { text: "100%" },
    ],
  ];

  phaseSlide.addTable(phaseData, {
    x: 0.5,
    y: 1.5,
    w: 9.0,
    h: 3.5,
    colW: [2.5, 2.0, 2.0, 2.5],
    fontSize: 16,
    color: colors.text,
    fill: { color: colors.lightGray },
    border: { pt: 1, color: "CCCCCC" },
    align: "center",
    valign: "middle",
  });

  // Slide 4: Phase Distribution Chart
  const chartSlide = pptx.addSlide();
  chartSlide.addText("Phase Distribution", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const chartData = results.phases.map((phase) => ({
    name: phase.phaseName,
    labels: [phase.phaseName],
    values: [phase.effortMD],
  }));

  chartSlide.addChart(pptx.ChartType.bar, chartData, {
    x: 1.0,
    y: 1.5,
    w: 8.0,
    h: 4.0,
    chartColors: ["1890FF", "52C41A", "FA8C16", "EB2F96", "722ED1"],
    showValue: true,
    dataLabelFontSize: 14,
    dataLabelColor: "333333",
  });

  // Generate blob
  const blob = await pptx.write({ outputType: "blob" });
  return blob as Blob;
}

/**
 * Trigger PowerPoint download in browser
 */
export async function downloadPowerPointReport(
  results: EstimatorResults,
  profileName: string,
  filename: string = "sap-estimate.pptx"
): Promise<void> {
  const blob = await generatePowerPointReport(results, profileName);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
