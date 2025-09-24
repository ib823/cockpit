"use client";

import React from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { SAP_CATALOG } from '@/data/sap-catalog';
import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';

export default function TimelinePage() {
  const {
    profile,
    selectedPackages,
    phases,
    generateTimeline,
    addPackage,
    removePackage,
    setProfile,
    getProjectCost,
    getProjectStartDate,
    getProjectEndDate,
    clientPresentationMode,
    togglePresentationMode,
    zoomLevel,
    setZoomLevel,
    selectedPhaseId,
    selectPhase
  } = useTimelineStore();

  const handleProfileUpdate = (field: string, value: any) => {
    setProfile({ [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SAP Implementation Timeline</h1>
            <p className="text-gray-600 mt-1">Plan and visualize your SAP implementation journey</p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            >
              ← Back to Home
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Client Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => handleProfileUpdate('company', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Company Name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={profile.region}
                    onChange={(e) => handleProfileUpdate('region', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ABMY">Malaysia</option>
                    <option value="ABSG">Singapore</option>
                    <option value="ABVN">Vietnam</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                  <select
                    value={profile.complexity}
                    onChange={(e) => handleProfileUpdate('complexity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="complex">Complex</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">SAP Package Selection</h2>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {Object.entries(SAP_CATALOG).map(([id, pkg]) => (
                <button
                  key={id}
                  onClick={() => 
                    selectedPackages.includes(id) 
                      ? removePackage(id) 
                      : addPackage(id)
                  }
                  className={`p-3 rounded-lg text-left transition ${
                    selectedPackages.includes(id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-semibold">{pkg.name}</div>
                  <div className="text-sm opacity-80">{pkg.effort} days</div>
                </button>
              ))}
            </div>
            
            <button
              onClick={generateTimeline}
              className="w-full mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 font-semibold transition"
              disabled={selectedPackages.length === 0}
            >
              Generate Timeline ({selectedPackages.length} packages selected)
            </button>
          </div>
        </div>
        
        {phases.length > 0 && (
          <div className="space-y-6">
            <TimelineControls
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              projectStartDate={getProjectStartDate()}
              projectEndDate={getProjectEndDate()}
              totalPhases={phases.length}
              totalCost={getProjectCost()}
              region={profile.region || 'ABMY'}
              presentationMode={clientPresentationMode}
              onTogglePresentationMode={togglePresentationMode}
            />
            
            <GanttChart
              phases={phases}
              zoomLevel={zoomLevel}
              onPhaseClick={selectPhase}
              selectedPhaseId={selectedPhaseId}
            />
          </div>
        )}
        
        {phases.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timeline Generated</h3>
              <p className="text-gray-600 mb-6">
                Select SAP packages and click Generate Timeline to see the visual Gantt chart.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
