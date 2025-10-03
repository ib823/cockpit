'use client';

import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';
import { downloadPDF, generateTimelinePDF } from '@/lib/export/pdf-generator';
import { useTimelineStore } from '@/stores/timeline-store';
import { useStorageSync } from '@/hooks/useStorageSync';

export default function TimelinePage() {
  // Enable cross-tab synchronization
  useStorageSync();

  // Destructure all needed values from store
  const {
    phases,
    profile,
    generateTimeline,
    getProjectStartDate,
    getProjectEndDate,
    getProjectCost
  } = useTimelineStore();

  // Add PDF export handler here (inside component, after hooks)
  const handleExportPDF = async () => {
    try {
      // Gather data
      const exportData = {
        projectName: profile.company || 'SAP Implementation',
        startDate: getProjectStartDate()?.toLocaleDateString() || 'TBD',
        endDate: getProjectEndDate()?.toLocaleDateString() || 'TBD',
        totalCost: getProjectCost(),
        currency: profile.region === 'ABSG' ? 'SGD' : 
                  profile.region === 'ABVN' ? 'VND' : 'MYR',
        phases: phases,
        teamMembers: phases.flatMap(p => 
          (p.resources || []).map(r => ({
            name: r.name || 'Unnamed',
            role: r.role,
            allocation: r.allocation
          }))
        )
      };
      
      // Generate PDF
      const pdfBytes = await generateTimelinePDF(exportData);
      
      // Download
      const filename = `timeline-${Date.now()}.pdf`;
      downloadPDF(pdfBytes, filename);
      
      console.log('✅ PDF exported successfully');
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">SAP Implementation Intelligence Platform</h1>
          <p className="text-gray-600 mt-1">142 SAP modules with AI-powered estimation</p>
        </div>
      </div>

      {/* Module Selection */}
      <div className="max-w-7xl mx-auto px-6 py-6">
      </div>

      {/* Controls - Add Export button here */}
      <div className="max-w-7xl mx-auto px-6 pb-6">
        <div className="flex items-center justify-between">
          <TimelineControls />
          
          {/* Export PDF button - only show if timeline exists */}
          {phases.length > 0 && (
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        {phases.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Generated</h3>
            <p className="text-gray-600 mb-4">Select SAP modules above and generate your timeline</p>
            <button
              onClick={generateTimeline}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
            >
              Generate Intelligent Timeline
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Project Timeline</h2>
            <GanttChart />
          </div>
        )}
      </div>
    </div>
  );
}