import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Phase, ClientProfile } from '@/types/core';

export async function exportTimelineToPDF(
  phases: Phase[],
  profile: ClientProfile,
  totals: any
): Promise<void> {
  const pdf = new jsPDF('l', 'mm', 'a4');
  
  // Add header
  pdf.setFontSize(20);
  pdf.text('SAP Implementation Timeline', 20, 20);
  
  pdf.setFontSize(12);
  pdf.text(`Client: ${(profile as any).companyName || 'Client'}`, 20, 30);
  pdf.text(`Region: ${profile.region}`, 20, 37);
  pdf.text(`Total Cost: ${totals.formattedCost}`, 20, 44);
  
  // Add phase table
  let y = 60;
  pdf.setFontSize(10);
  
  phases.forEach((phase) => {
    if (y > 180) {
      pdf.addPage();
      y = 20;
    }
    
    pdf.text(phase.name, 20, y);
    pdf.text(`${phase.workingDays} days`, 120, y);
    pdf.text(`${phase.effort} PD`, 160, y);
    y += 7;
  });
  
  pdf.save('sap-timeline.pdf');
}

export async function exportGanttChartToPDF(elementId: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF('l', 'mm', 'a3');
  pdf.addImage(imgData, 'PNG', 10, 10, 400, 250);
  pdf.save('gantt-chart.pdf');
}