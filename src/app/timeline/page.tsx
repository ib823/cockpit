'use client';

import { TimelineContainer } from '@/components/timeline/core/TimelineContainer';
import { useTimelineStore } from '@/stores/timeline-store';

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

  const packages = [
    { id: 'finance_core', name: 'Finance Core (FI)' },
    { id: 'finance_advanced', name: 'Finance Advanced' },
    { id: 'hr_core', name: 'HR Core (HCM)' },
    { id: 'supply_chain', name: 'Supply Chain Management' },
    { id: 'advanced_scm', name: 'Advanced SCM' },
    { id: 'technical', name: 'Advanced Technical' },
    { id: 'compliance', name: 'Malaysia Compliance' },
    { id: 'btp', name: 'BTP Integration Suite' },
    { id: 'analytics', name: 'SAP Analytics Cloud' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          SAP Implementation Timeline
        </h1>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Profile */}
            <div>
              <h3 className="font-semibold mb-3">Company Profile</h3>
              <input
                type="text"
                placeholder="Company Name"
                className="w-full px-3 py-2 border rounded mb-2"
                value={profile?.company || ''}
                onChange={(e) => setProfile?.({ company: e.target.value })}
              />
              <select
                className="w-full px-3 py-2 border rounded mb-2"
                value={profile?.complexity || 'standard'}
                onChange={(e) => setProfile?.({ complexity: e.target.value as any })}
              >
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
              </select>
              <select
                className="w-full px-3 py-2 border rounded"
                value={profile?.region || 'ABMY'}
                onChange={(e) => setProfile?.({ region: e.target.value })}
              >
                <option value="ABMY">Malaysia</option>
                <option value="ABSG">Singapore</option>
                <option value="ABVN">Vietnam</option>
              </select>
            </div>

            {/* SAP Packages */}
            <div className="lg:col-span-2">
              <h3 className="font-semibold mb-3">SAP Packages</h3>
              <div className="grid grid-cols-3 gap-2">
                {packages.map((pkg) => (
                  <label key={pkg.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPackages?.includes(pkg.id) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          addPackage?.(pkg.id);
                        } else {
                          removePackage?.(pkg.id);
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{pkg.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => generateTimeline?.()}
            disabled={!selectedPackages || selectedPackages.length === 0}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Timeline
          </button>
        </div>

        {/* Timeline Visualization */}
        {phases && phases.length > 0 && <TimelineContainer />}
      </div>
    </div>
  );
}