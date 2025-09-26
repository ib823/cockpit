export const exportToCSV = (data: any) => {
  const { phases, options } = data;
  
  const headers = ['Phase', 'Start Day', 'Duration', 'Resources', 'Cost'];
  const rows = phases.map((phase: any) => [
    phase.name,
    phase.startBusinessDay,
    phase.workingDays,
    phase.resources?.length || 0,
    options.includeCosts ? phase.cost : 'Hidden'
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `timeline-${Date.now()}.csv`;
  a.click();
};

export const exportToPDF = async (data: any) => {
  // Implementation would use a library like jsPDF
  console.log('PDF export not yet implemented');
};

export const generateShareableLink = (data: any) => {
  const compressed = btoa(JSON.stringify(data));
  return `${window.location.origin}/timeline?data=${compressed}`;
};
