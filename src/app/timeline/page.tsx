'use client';

import { useTimelineStore } from '@/stores/timeline-store';
import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';
import { SAP_PACKAGES } from '@/data/sap-catalog';

export default function TimelinePage() {
  const { 
    profile, 
    setProfile, 
    selectedPackages, 
    addPackage, 
    removePackage,
    generateTimeline,
    phases 
  } = useTimelineStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SAP Implementation Timeline</h1>
          <p className="text-gray-600 mt-2">Configure your project and generate an intelligent timeline</p>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Company Profile */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">Company Profile</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Company Name"
                className="input"
                value={profile.company}
                onChange={(e) => setProfile({ company: e.target.value })}
              />
              <select 
                className="input"
                value={profile.complexity}
                onChange={(e) => setProfile({ complexity: e.target.value as any })}
              >
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
              </select>
              <select
                className="input" 
                value={profile.region}
                onChange={(e) => setProfile({ region: e.target.value })}
              >
                <option value="ABMY">Malaysia</option>
                <option value="ABSG">Singapore</option>
                <option value="ABVN">Vietnam</option>
              </select>
            </div>
          </div>

          {/* SAP Packages */}
          <div className="card lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">SAP Packages</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SAP_PACKAGES.map((pkg) => (
                <label 
                  key={pkg.id} 
                  className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={(e) => {
                      if (e.target.checked) addPackage(pkg.id);
                      else removePackage(pkg.id);
                    }}
                  />
                  <span className="text-sm">{pkg.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={generateTimeline}
            disabled={selectedPackages.length === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Timeline
          </button>
        </div>

        {/* Timeline Section */}
        {phases.length > 0 && (
          <>
            <TimelineControls />
            <div className="card mt-6">
              <GanttChart />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
