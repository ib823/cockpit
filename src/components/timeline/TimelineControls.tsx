import React from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { formatCurrency } from '@/data/resource-catalog';
import { formatDateConsistent } from '@/lib/timeline/date-calculations';

const TimelineControls: React.FC = () => {
  const {
    phases,
    clientPresentationMode,
    togglePresentationMode,
    getProjectStartDate,
    getProjectEndDate,
    getProjectCost,
    profile
  } = useTimelineStore();

  const startDate = getProjectStartDate();
  const endDate = getProjectEndDate();
  const projectCost = getProjectCost();

  const calculateDuration = () => {
    if (!startDate || !endDate) return '-';
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return weeks > 0 ? `${weeks}w ${days}d` : `${diffDays}d`;
  };

  const formatProjectCost = () => {
    if (!projectCost || isNaN(projectCost)) return formatCurrency(0, profile.region);
    return formatCurrency(projectCost, profile.region);
  };

  return (
    <div className="bg-white rounded-lg border p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-8 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Start</div>
            <div className="font-medium text-gray-900 mt-0.5">{formatDateConsistent(startDate)}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">End</div>
            <div className="font-medium text-gray-900 mt-0.5">{formatDateConsistent(endDate)}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Duration</div>
            <div className="font-medium text-gray-900 mt-0.5">{calculateDuration()}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Phases</div>
            <div className="font-medium text-gray-900 mt-0.5">{phases.length}</div>
          </div>
          
          {!clientPresentationMode && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
              <div className="font-medium text-gray-900 mt-0.5">
                {formatProjectCost()}
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={togglePresentationMode}
          className={`px-3 py-1.5 text-xs rounded transition-colors ${
            clientPresentationMode
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {clientPresentationMode ? 'Presentation' : 'Work Mode'}
        </button>
      </div>
    </div>
  );
};

export default TimelineControls;
