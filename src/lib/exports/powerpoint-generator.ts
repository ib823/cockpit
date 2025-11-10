/**
 * PowerPoint Export Generator
 *
 * Generates professional PowerPoint presentations from project estimates
 * using pptxgenjs library.
 */

import PptxGenJS from "pptxgenjs";
import type { EstimatorResults, PhaseBreakdown } from "@/lib/estimator/types";

export interface ProjectData {
  name: string;
  totalMD: number;
  durationMonths: number;
  pmoMD: number;
  phases: PhaseBreakdown[];
  coefficients?: {
    Sb: number;
    Pc: number;
    Os: number;
  };
  resources?: Array<{
    role: string;
    fte: number;
    ratePerDay: number;
    totalCost: number;
  }>;
  startDate?: Date;
}

export async function generatePowerPoint(data: ProjectData): Promise<Buffer> {
  const pptx = new PptxGenJS();

  // Configure presentation
  pptx.author = "Keystone";
  pptx.company = "SAP Implementation Estimate";
  pptx.subject = data.name;
  pptx.title = `SAP S/4HANA Implementation Estimate: ${data.name}`;

  // Define theme colors
  const colors = {
    primary: "0070f3",
    secondary: "1890ff",
    success: "52c41a",
    warning: "faad14",
    danger: "ff4d4f",
    text: "262626",
    textLight: "8c8c8c",
  };

  // Slide 1: Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: colors.primary };

  slide1.addText("SAP S/4HANA", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.8,
    fontSize: 48,
    bold: true,
    color: "FFFFFF",
    align: "center",
  });

  slide1.addText("Implementation Estimate", {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    color: "FFFFFF",
    align: "center",
  });

  slide1.addText(data.name, {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: "E6F7FF",
    align: "center",
  });

  slide1.addText(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.4,
      fontSize: 14,
      color: "FFFFFF",
      align: "center",
    }
  );

  // Slide 2: Executive Summary
  const slide2 = pptx.addSlide();
  slide2.addText("Executive Summary", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const summaryData = [
    [
      { text: "Metric", options: { bold: true, fill: { color: "F0F0F0" } } },
      { text: "Value", options: { bold: true, fill: { color: "F0F0F0" } } },
    ],
    [{ text: "Total Effort" }, { text: `${data.totalMD.toFixed(0)} MD` }],
    [{ text: "Project Duration" }, { text: `${data.durationMonths.toFixed(1)} months` }],
    [{ text: "PMO Effort" }, { text: `${data.pmoMD.toFixed(0)} MD` }],
    [{ text: "Estimated Cost" }, { text: `$${(data.totalMD * 150 * 22).toLocaleString()}` }],
  ];

  if (data.startDate) {
    const endDate = new Date(data.startDate);
    endDate.setMonth(endDate.getMonth() + Math.ceil(data.durationMonths));
    summaryData.push([{ text: "Target Go-Live" }, { text: endDate.toLocaleDateString() }]);
  }

  slide2.addTable(summaryData, {
    x: 1.5,
    y: 1.5,
    w: 7,
    h: 3,
    fontSize: 16,
    border: { pt: 1, color: "CFCFCF" },
    align: "left",
    valign: "middle",
  });

  slide2.addText("🤖 Generated with Keystone", {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: colors.textLight,
    align: "right",
    italic: true,
  });

  // Slide 3: Phase Breakdown
  const slide3 = pptx.addSlide();
  slide3.addText("Phase Breakdown", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const phaseColors = {
    Prepare: "91d5ff",
    Explore: "b7eb8f",
    Realize: "ffd591",
    Deploy: "ffadd2",
    Run: "d3adf7",
  };

  const phaseData = [
    [
      { text: "Phase", options: { bold: true, fill: { color: "F0F0F0" } } },
      { text: "Effort (MD)", options: { bold: true, fill: { color: "F0F0F0" } } },
      { text: "Duration (mo)", options: { bold: true, fill: { color: "F0F0F0" } } },
      { text: "% of Total", options: { bold: true, fill: { color: "F0F0F0" } } },
    ],
    ...data.phases.map((p) => [
      {
        text: p.phaseName,
        options: {
          fill: { color: phaseColors[p.phaseName as keyof typeof phaseColors] || "E6F7FF" },
        },
      },
      { text: p.effortMD.toFixed(1) },
      { text: p.durationMonths.toFixed(2) },
      { text: `${((p.effortMD / data.totalMD) * 100).toFixed(0)}%` },
    ]),
  ];

  slide3.addTable(phaseData, {
    x: 1,
    y: 1.5,
    w: 8,
    h: 3,
    fontSize: 14,
    border: { pt: 1, color: "CFCFCF" },
    align: "center",
    valign: "middle",
  });

  // Add phase chart
  const chartData = [
    {
      name: "Effort Distribution",
      labels: data.phases.map((p) => p.phaseName),
      values: data.phases.map((p) => p.effortMD),
    },
  ];

  slide3.addChart(pptx.ChartType.pie, chartData, {
    x: 2,
    y: 4.8,
    w: 6,
    h: 2.5,
    showLegend: true,
    showTitle: false,
    showValue: true,
  });

  // Slide 4: Resource Plan (if available)
  if (data.resources && data.resources.length > 0) {
    const slide4 = pptx.addSlide();
    slide4.addText("Resource Plan", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 32,
      bold: true,
      color: colors.text,
    });

    const resourceData = [
      [
        { text: "Role", options: { bold: true, fill: { color: "F0F0F0" } } },
        { text: "FTE", options: { bold: true, fill: { color: "F0F0F0" } } },
        { text: "Rate/Day", options: { bold: true, fill: { color: "F0F0F0" } } },
        { text: "Total Cost", options: { bold: true, fill: { color: "F0F0F0" } } },
      ],
      ...data.resources.map((r) => [
        { text: r.role },
        { text: r.fte.toFixed(1) },
        { text: `$${r.ratePerDay}` },
        { text: `$${r.totalCost.toLocaleString()}` },
      ]),
      [
        { text: "TOTAL", options: { bold: true } },
        {
          text: data.resources.reduce((sum, r) => sum + r.fte, 0).toFixed(1),
          options: { bold: true },
        },
        { text: "" },
        {
          text: `$${data.resources.reduce((sum, r) => sum + r.totalCost, 0).toLocaleString()}`,
          options: { bold: true },
        },
      ],
    ];

    slide4.addTable(resourceData, {
      x: 1,
      y: 1.5,
      w: 8,
      h: 4,
      fontSize: 14,
      border: { pt: 1, color: "CFCFCF" },
      align: "center",
      valign: "middle",
    });
  }

  // Slide 5: Formula Transparency (if coefficients available)
  if (data.coefficients) {
    const slide5 = pptx.addSlide();
    slide5.addText("Estimation Methodology", {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 32,
      bold: true,
      color: colors.text,
    });

    slide5.addText("SAP Activate Methodology", {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.4,
      fontSize: 18,
      color: colors.textLight,
    });

    const formulaText = [
      "E_total = E_FT + E_fixed + E_PMO",
      "",
      "Where:",
      `• E_FT = Baseline × (1 + Sb) × (1 + Pc) × (1 + Os)`,
      `• Sb (Scope Breadth) = ${data.coefficients.Sb.toFixed(3)}`,
      `• Pc (Process Complexity) = ${data.coefficients.Pc.toFixed(3)}`,
      `• Os (Org Scale) = ${data.coefficients.Os.toFixed(3)}`,
      "",
      "Duration = (E_total / Capacity) × Overlap Factor",
      "E_PMO = Duration × 16.25 MD/month",
    ];

    slide5.addText(formulaText.join("\n"), {
      x: 1,
      y: 2,
      w: 8,
      h: 3,
      fontSize: 14,
      fontFace: "Courier New",
      color: colors.text,
      fill: { color: "F5F5F5" },
      align: "left",
      valign: "top",
    });

    slide5.addText("✓ Based on 293 L3 scope items from SAP Process Navigator", {
      x: 1,
      y: 5.2,
      w: 8,
      h: 0.4,
      fontSize: 12,
      color: colors.success,
    });
  }

  // Slide 6: Assumptions & Risks
  const slide6 = pptx.addSlide();
  slide6.addText("Key Assumptions", {
    x: 0.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: colors.text,
  });

  const assumptions = [
    "Team availability at planned FTE levels",
    "Minimal scope changes during execution",
    "Adequate infrastructure provisioning",
    "Timely stakeholder decisions",
    "Standard SAP S/4HANA configuration",
  ];

  let yPos = 1.2;
  assumptions.forEach((assumption, idx) => {
    slide6.addText(`${idx + 1}. ${assumption}`, {
      x: 0.5,
      y: yPos,
      w: 4.5,
      h: 0.4,
      fontSize: 12,
      color: colors.text,
    });
    yPos += 0.5;
  });

  slide6.addText("Key Risks", {
    x: 5.5,
    y: 0.5,
    w: 4.5,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: colors.text,
  });

  const risks = [
    "Resource availability constraints",
    "Integration complexity",
    "Change management challenges",
    "Data migration issues",
    "Third-party system dependencies",
  ];

  yPos = 1.2;
  risks.forEach((risk, idx) => {
    slide6.addText(`${idx + 1}. ${risk}`, {
      x: 5.5,
      y: yPos,
      w: 4.5,
      h: 0.4,
      fontSize: 12,
      color: colors.danger,
    });
    yPos += 0.5;
  });

  // Slide 7: Next Steps
  const slide7 = pptx.addSlide();
  slide7.addText("Next Steps", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  const nextSteps = [
    "1. Review and validate assumptions with stakeholders",
    "2. Confirm resource availability and commitment",
    "3. Finalize L3 scope items with business teams",
    "4. Establish project governance structure",
    "5. Secure budget approval",
    "6. Initiate detailed project planning",
  ];

  yPos = 1.5;
  nextSteps.forEach((step) => {
    slide7.addText(step, {
      x: 1,
      y: yPos,
      w: 8,
      h: 0.5,
      fontSize: 16,
      color: colors.text,
      bullet: true,
    });
    yPos += 0.6;
  });

  slide7.addShape(pptx.ShapeType.rect, {
    x: 1,
    y: 4.8,
    w: 8,
    h: 1,
    fill: { color: colors.primary },
  });

  slide7.addText("Questions? Contact your SAP implementation team", {
    x: 1,
    y: 5,
    w: 8,
    h: 0.6,
    fontSize: 18,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
  });

  // Generate buffer
  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return buffer;
}
