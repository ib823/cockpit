'use client';

import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { FileImage, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useReactFlow } from 'reactflow';

export function ExportMenu() {
  const [isExporting, setIsExporting] = useState(false);
  const { getNodes } = useReactFlow();

  const exportToPNG = async () => {
    setIsExporting(true);
    try {
      const element = document.querySelector('.react-flow') as HTMLElement;
      if (!element) return;

      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        style: {
          width: `${element.offsetWidth}px`,
          height: `${element.offsetHeight}px`,
        },
      });

      const link = document.createElement('a');
      link.download = `ea-diagram-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export diagram');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.querySelector('.react-flow') as HTMLElement;
      if (!element) return;

      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        width: element.offsetWidth * 2, // Higher resolution
        height: element.offsetHeight * 2,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [element.offsetWidth, element.offsetHeight],
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
      
      // Add metadata page
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Enterprise Architecture Diagram', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 50);
      pdf.text(`Total Modules: ${getNodes().length}`, 20, 70);

      pdf.save(`ea-diagram-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportToPNG}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileImage className="w-4 h-4" />
        )}
        Export PNG
      </button>

      <button
        onClick={exportToPDF}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        Export PDF
      </button>
    </div>
  );
}