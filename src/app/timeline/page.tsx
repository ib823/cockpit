"use client";

import { useTimelineStore } from '@/stores/timeline-store';
import { formatDateElegant } from '@/lib/timeline/date-calculations';
import { formatCurrency } from '@/data/resource-catalog';
import { SAP_CATALOG } from '@/data/sap-catalog';

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
    togglePresentationMode
  } = useTimelineStore();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SAP Implementation Timeline</h1>
          <button
            onClick={togglePresentationMode}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {clientPresentationMode ? '👁 Client Mode' : '💼 Internal Mode'}
          </button>
        </div>
        
        {/* Profile Setup */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Project Profile</h2>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Company Name"
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={profile.company || ''}
              onChange={(e) => setProfile({ company: e.target.value })}
            />
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={profile.complexity || 'standard'}
              onChange={(e) => setProfile({ complexity: e.target.value as any })}
            >
              <option value="standard">Standard Complexity</option>
              <option value="complex">Complex</option>
              <option value="extreme">Extreme Complexity</option>
            </select>
            <select
              className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={profile.region || 'ABMY'}
              onChange={(e) => setProfile({ region: e.target.value })}
            >
              <option value="ABMY">Malaysia (MYR)</option>
              <option value="ABSG">Singapore (SGD)</option>
              <option value="ABVN">Vietnam (VND)</option>
            </select>
          </div>
        </div>
        
        {/* Package Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">SAP Packages</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {Object.entries(SAP_CATALOG).map(([id, pkg]) => (
              <button
                key={id}
                onClick={() => 
                  selectedPackages.includes(id) 
                    ? removePackage(id) 
                    : addPackage(id)
                }
                className={`p-3 rounded text-left transition ${
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
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            disabled={selectedPackages.length === 0}
          >
            Generate Timeline
          </button>
        </div>
        
        {/* Timeline Display */}
        {phases.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Project Timeline</h2>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Start:</span>{' '}
                  <span className="font-semibold">{formatDateElegant(getProjectStartDate())}</span>
                </div>
                <div>
                  <span className="text-gray-500">End:</span>{' '}
                  <span className="font-semibold">{formatDateElegant(getProjectEndDate())}</span>
                </div>
                {!clientPresentationMode && (
                  <div>
                    <span className="text-gray-500">Cost:</span>{' '}
                    <span className="font-semibold">{formatCurrency(getProjectCost(), profile.region || 'ABMY')}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Gantt Chart Visualization */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {phases.map(phase => (
                  <div
                    key={phase.id}
                    className="flex items-center py-2 hover:bg-gray-50"
                  >
                    <div className="w-48 pr-4">
                      <div className="font-medium text-sm">{phase.name}</div>
                      <div className="text-xs text-gray-500">{phase.workingDays} days</div>
                    </div>
                    <div className="flex-1 relative h-10">
                      <div
                        className="absolute h-full rounded"
                        style={{
                          left: `${(phase.startBusinessDay / 120) * 100}%`,
                          width: `${(phase.workingDays / 120) * 100}%`,
                          backgroundColor: phase.color,
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
