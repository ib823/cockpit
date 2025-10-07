/**
 * PDF EXPORTER FOR PRESENTMODE
 *
 * Exports presentation slides to PDF using jsPDF + html2canvas.
 * Per spec: PresentMode_Upgrade_Spec.md
 *
 * Usage:
 *   import { exportToPDF } from '@/lib/presentation/pdf-exporter';
 *   await exportToPDF(slides, projectName);
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { track } from '@/lib/analytics';

export interface Slide {
  id: string;
  title: string;
  component: React.ReactNode;
  notes?: string;
}

/**
 * Export slides to PDF
 *
 * @param slides - Array of slide components to export
 * @param projectName - Name for the PDF file
 * @returns Promise that resolves when PDF is downloaded
 */
export async function exportToPDF(
  slides: Slide[],
  projectName: string = 'proposal'
): Promise<void> {
  const startTime = Date.now();

  try {
    // Create PDF in landscape mode (A4: 297x210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let isFirstPage = true;

    for (let i = 0; i < slides.length; i++) {
      const slideElement = document.getElementById(`slide-${i}`);

      if (!slideElement) {
        console.warn(`[PDF Export] Slide ${i} element not found, skipping`);
        continue;
      }

      // Render slide to canvas
      const canvas = await html2canvas(slideElement, {
        scale: 2, // High resolution (2x for retina displays)
        useCORS: true, // Allow cross-origin images
        logging: false, // Disable console logs
        backgroundColor: '#ffffff',
        imageTimeout: 15000,
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Add new page (except for first slide)
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      // Calculate dimensions to fit A4 landscape while maintaining aspect ratio
      const pdfWidth = 297; // mm
      const pdfHeight = 210; // mm
      const canvasAspectRatio = canvas.width / canvas.height;
      const pdfAspectRatio = pdfWidth / pdfHeight;

      let finalWidth = pdfWidth;
      let finalHeight = pdfHeight;

      if (canvasAspectRatio > pdfAspectRatio) {
        // Canvas is wider - fit to width
        finalHeight = pdfWidth / canvasAspectRatio;
      } else {
        // Canvas is taller - fit to height
        finalWidth = pdfHeight * canvasAspectRatio;
      }

      // Center the image on the page
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    }

    // Generate filename
    const sanitizedName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `${sanitizedName || 'proposal'}-${timestamp}.pdf`;

    // Save PDF
    pdf.save(filename);

    // Track successful export
    const duration = Date.now() - startTime;
    track('export_complete', {
      format: 'pdf',
      slideCount: slides.length,
      duration,
    });
  } catch (error) {
    console.error('[PDF Export] Failed:', error);

    // Track failed export
    track('export_failed', {
      format: 'pdf',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw new Error('PDF export failed. Please try again.');
  }
}

/**
 * Check if PDF export is supported
 */
export function isPDFExportSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for required browser APIs
  return !!(
    window.HTMLCanvasElement &&
    HTMLCanvasElement.prototype.toDataURL &&
    window.Blob
  );
}

/**
 * Export slide notes to text file
 *
 * Useful for downloading speaker notes separately.
 */
export function exportNotesToText(
  slides: Slide[],
  projectName: string = 'proposal'
): void {
  const notesContent = slides
    .map((slide, index) => {
      if (!slide.notes) return '';
      return `
═══════════════════════════════════════
Slide ${index + 1}: ${slide.title}
═══════════════════════════════════════

${slide.notes}
`;
    })
    .filter(Boolean)
    .join('\n\n');

  if (!notesContent.trim()) {
    throw new Error('No presenter notes found');
  }

  // Create blob and download
  const blob = new Blob([notesContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName}-notes.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
