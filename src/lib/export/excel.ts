import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Phase } from '@/types/core';

export function exportToExcel(phases: Phase[], profile: any, totals: any) {
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['SAP Implementation Plan'],
    [],
    ['Client', profile.companyName],
    ['Region', profile.region],
    ['Complexity', profile.complexity],
    ['Total Person Days', totals.personDays],
    ['Total Cost', totals.formattedCost],
    ['Duration', `${totals.duration} days`],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Phases sheet
  const phaseData = [
    ['Phase', 'Stream', 'Start Day', 'Duration', 'Effort (PD)', 'Resources'],
    ...phases.map(p => [
      p.name,
      (p as any).stream || '',
      p.startBusinessDay,
      p.workingDays,
      p.effort,
      p.resources?.length || 0
    ])
  ];
  
  const phaseSheet = XLSX.utils.aoa_to_sheet(phaseData);
  XLSX.utils.book_append_sheet(wb, phaseSheet, 'Phases');
  
  // Resources sheet if needed
  const resourceData = [
    ['Phase', 'Resource', 'Role', 'Allocation %'],
    ...phases.flatMap(p => 
      (p.resources || []).map(r => [
        p.name,
        (r as any).name || '',
        r.role,
        r.allocation
      ])
    )
  ];
  
  const resourceSheet = XLSX.utils.aoa_to_sheet(resourceData);
  XLSX.utils.book_append_sheet(wb, resourceSheet, 'Resources');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
  
  function s2ab(s: string) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }
  
  saveAs(new Blob([s2ab(wbout)], { type: 'application/octet-stream' }), 'sap-timeline.xlsx');
}