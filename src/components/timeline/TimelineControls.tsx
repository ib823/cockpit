"use client";

import React from 'react';

interface TimelineControlsProps {
  zoomLevel: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  onZoomChange: (level: 'daily' | 'weekly' | 'biweekly' | 'monthly') => void;
  projectStartDate: Date | null;
  projectEndDate: Date | null;
  totalPhases: number;
  totalCost: number;
  region: string;
  presentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoomLevel,
  onZoomChange,
  projectStartDate,
  projectEndDate,
  totalPhases,
  totalCost,
  region,
  presentationMode,
  onTogglePresentationMode
}) => {
  const formatCurrency = (amount: number, region: string) => {
    const formatters = {
      'ABMY': (amt: number) => `MYR ${amt.toLocaleString()}`,
      'ABSG': (amt: number) => `SGD ${amt.toLocaleString()}`,
      'ABVN': (amt: number) => `VND ${amt.toLocaleString()}`
    };
    
    return formatters[region as keyof typeof formatters]?.(amount) || `${amount.toLocaleString()}`;
  };

  const formatDateElegant = (date: Date | null) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6">
      <div className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Start Date:</span>
              <div className="font-semibold text-gray-900">
                {formatDateElegant(projectStartDate)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 font-medium">End Date:</span>
              <div className="font-semibold text-gray-900">
                {formatDateElegant(projectEndDate)}
              </div>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Phases:</span>
              <div className="font-semibold text-gray-900">{totalPhases}</div>
            </div>
            {!presentationMode && (
              <div>
                <span className="text-gray-500 font-medium">Total Cost:</span>
                <div className="font-semibold text-green-600">
                  {formatCurrency(totalCost, region)}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onTogglePresentationMode}
            className={`px-3 py-2 rounded-md text-sm font-medium transition ${
              presentationMode
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {presentationMode ? 'Client View' : 'Internal View'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => onZoomChange(level)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition capitalize ${
                    zoomLevel === level
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineControls;
