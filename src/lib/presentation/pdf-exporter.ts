/**
 * PDF EXPORTER - P1-2
 *
 * Export PresentMode slides to PDF
 * Uses jspdf + html2canvas for high-quality rendering
 *
 * Per spec: Roadmap_and_DoD.md lines 117-142
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportOptions {
  fileName?: string;
  quality?: number; // 0-1, default 0.95
  format?: "a4" | "letter" | "16:9";
  includeMetadata?: boolean;
}

export interface ExportProgress {
  currentSlide: number;
  totalSlides: number;
  status: "preparing" | "rendering" | "generating" | "complete" | "error";
  message: string;
}

/**
 * Export PresentMode slides to PDF
 */
export async function exportToPDF(
  slideElements: HTMLElement[],
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const {
    fileName = `presentation-${new Date().toISOString().split("T")[0]}.pdf`,
    quality = 0.95,
    format = "16:9",
    includeMetadata = true,
  } = options;

  const totalSlides = slideElements.length;

  if (totalSlides === 0) {
    throw new Error("No slides to export");
  }

  try {
    onProgress?.({
      currentSlide: 0,
      totalSlides,
      status: "preparing",
      message: "Preparing PDF document...",
    });

    // Determine PDF dimensions
    let pdfWidth: number, pdfHeight: number;
    let orientation: "landscape" | "portrait" = "landscape";

    if (format === "16:9") {
      pdfWidth = 297;
      pdfHeight = 167;
    } else if (format === "letter") {
      pdfWidth = 279.4;
      pdfHeight = 215.9;
    } else {
      pdfWidth = 297;
      pdfHeight = 210;
    }

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    if (includeMetadata) {
      pdf.setProperties({
        title: "SAP Implementation Timeline",
        subject: "Project Timeline Presentation",
        author: "Keystone",
        keywords: "SAP, Timeline, Implementation",
        creator: "Keystone",
      });
    }

    // Render each slide
    for (let i = 0; i < totalSlides; i++) {
      onProgress?.({
        currentSlide: i + 1,
        totalSlides,
        status: "rendering",
        message: `Rendering slide ${i + 1} of ${totalSlides}...`,
      });

      const slideElement = slideElements[i];

      const canvas = await html2canvas(slideElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: slideElement.scrollWidth,
        windowHeight: slideElement.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", quality);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    }

    onProgress?.({
      currentSlide: totalSlides,
      totalSlides,
      status: "generating",
      message: "Generating PDF file...",
    });

    pdf.save(fileName);

    onProgress?.({
      currentSlide: totalSlides,
      totalSlides,
      status: "complete",
      message: "PDF exported successfully!",
    });
  } catch (error) {
    console.error("[PDFExporter] Export failed:", error);

    onProgress?.({
      currentSlide: 0,
      totalSlides,
      status: "error",
      message: error instanceof Error ? error.message : "Failed to export PDF",
    });

    throw error;
  }
}

export function generatePDFFileName(projectName?: string, date = new Date()): string {
  const dateStr = date.toISOString().split("T")[0];
  const baseName = projectName
    ? `${projectName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`
    : "sap-timeline";

  return `${baseName}-${dateStr}.pdf`;
}
