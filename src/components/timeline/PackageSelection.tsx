import React from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { SAP_CATALOG } from '@/data/sap-catalog';

const PackageSelection: React.FC = () => {
  const { 
    selectedPackages, 
    addPackage, 
    removePackage, 
    generateTimeline,
    phases
  } = useTimelineStore();

  const handleGenerateTimeline = () => {
    generateTimeline();
    // Force a small delay to ensure state updates properly
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  return (
    <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">SAP Package Selection</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SAP_CATALOG).map(([key, pkg]) => (
          <label 
            key={key} 
            className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedPackages.includes(key) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={selectedPackages.includes(key)}
              onChange={(e) => e.target.checked ? addPackage(key) : removePackage(key)}
              className="sr-only"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900">{pkg.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{pkg.baseEffort} days</p>
            </div>
            {selectedPackages.includes(key) && (
              <div className="text-blue-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
      
      {selectedPackages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleGenerateTimeline}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            {phases.length > 0 ? 'Regenerate' : 'Generate'} Timeline ({selectedPackages.length} package{selectedPackages.length !== 1 ? 's' : ''})
          </button>
        </div>
      )}
    </div>
  );
};

export default PackageSelection;
