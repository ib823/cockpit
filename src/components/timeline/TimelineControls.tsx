import React from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { formatCurrency } from '@/data/resource-catalog';

const TimelineControls: React.FC = () => {
  const {
    phases,
    clientPresentationMode,
    togglePresentationMode,
    getProjectStartDate,
    getProjectEndDate,
    getProjectCost,
  } = useTimelineStore();

  const startDate = getProjectStartDate();
  const endDate = getProjectEndDate();
  const projectCost = getProjectCost();

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(date.getDate()).padStart(2, '0');
    const mmm = months[date.getMonth()];
    const yy = String(date.getFullYear()).slice(-2);
    const ddd = days[date.getDay()];
    return `${dd}-${mmm}-${yy} (${ddd})`;
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return '-';
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    if (weeks > 0) {
      return `${weeks}w ${days}d`;
    }
    return `${diffDays}d`;
  };

  return (
    <div className="bg-white rounded border p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-8 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Start</div>
            <div className="font-medium text-gray-900 mt-0.5">{formatDate(startDate)}</div>
          </div>
          
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">End</div>
            <div className="font-medium text-gray-900 mt-0.5">{formatDate(endDate)}</div>
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
                {formatCurrency(projectCost, 'MY')}
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
