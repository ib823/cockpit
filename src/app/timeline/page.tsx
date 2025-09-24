'use client';

import React, { useState, useCallback } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { SAP_CATALOG } from '@/data/sap-catalog';
import { formatCurrency } from '@/data/resource-catalog';
import { businessDayToDate, formatDateElegant } from '@/lib/timeline/date-calculations';
import GanttChart from '@/components/timeline/GanttChart';
import TimelineControls from '@/components/timeline/TimelineControls';

export default function TimelinePage() {
  const {
    profile,
    setProfile,
    selectedPackages,
    addPackage,
    removePackage,
    phases,
    generateTimeline,
    holidays,
    addHoliday,
    removeHoliday,
    selectPhase,
    selectedPhaseId,
    updatePhaseResources,
    getProjectCost,
    clientPresentationMode,
    phaseColors,
    setPhaseColor,
  } = useTimelineStore();

  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [activePhase, setActivePhase] = useState<any>(null);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });

  const colorOptions = ['#3b82f6', '#10b981', '#8b5cf6'];

  const handlePhaseClick = useCallback((phaseId: string) => {
    const phase = phases.find(p => p.id === phaseId);
    if (phase) {
      setActivePhase(phase);
      setShowResourceModal(true);
      selectPhase(phaseId);
    }
  }, [phases, selectPhase]);

  const handleAddResource = () => {
    if (!activePhase) return;
    const role = prompt('Enter role:');
    if (role) {
      const resources = activePhase.resources || [];
      const newResource = {
        id: `res_${Date.now()}`,
        role,
        allocation: 100,
        region: profile.region || 'MY',
        hourlyRate: 800
      };
      const updated = [...resources, newResource];
      updatePhaseResources(activePhase.id, updated);
      setActivePhase({ ...activePhase, resources: updated });
    }
  };

  const handleRemoveResource = (resourceId: string) => {
    if (!activePhase) return;
    const updated = (activePhase.resources || []).filter((r: any) => r.id !== resourceId);
    updatePhaseResources(activePhase.id, updated);
    setActivePhase({ ...activePhase, resources: updated });
  };

  const handleAllocationChange = (resourceId: string, allocation: number) => {
    if (!activePhase) return;
    const updated = (activePhase.resources || []).map((r: any) =>
      r.id === resourceId ? { ...r, allocation } : r
    );
    updatePhaseResources(activePhase.id, updated);
    setActivePhase({ ...activePhase, resources: updated });
  };

  // Calculate resource metrics
  const getResourceMetrics = () => {
    if (!activePhase?.resources?.length) return null;
    
    const totalAllocation = activePhase.resources.reduce((sum: number, r: any) => sum + r.allocation, 0);
    const avgAllocation = Math.round(totalAllocation / activePhase.resources.length);
    const overAllocated = activePhase.resources.filter((r: any) => r.allocation > 100).length;
    const underUtilized = activePhase.resources.filter((r: any) => r.allocation < 80).length;
    
    return {
      totalResources: activePhase.resources.length,
      avgAllocation,
      overAllocated,
      underUtilized,
    };
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-full mx-auto px-6 py-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-light text-gray-900 tracking-tight">Implementation Timeline</h1>
          {!clientPresentationMode && phases.length > 0 && (
            <div className="text-sm text-gray-500">
              {formatCurrency(getProjectCost(), profile.region || 'MY')}
            </div>
          )}
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Profile */}
          <div className="bg-gray-50 rounded p-4">
            <h2 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Profile</h2>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile({ company: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              placeholder="Company"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                value={profile.complexity}
                onChange={(e) => setProfile({ complexity: e.target.value as any })}
                className="px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              >
                <option value="simple">Simple</option>
                <option value="standard">Standard</option>
                <option value="complex">Complex</option>
                <option value="very_complex">Very Complex</option>
              </select>
              <select
                value={profile.region}
                onChange={(e) => setProfile({ region: e.target.value as any })}
                className="px-2.5 py-1.5 text-sm bg-white border border-gray-200 rounded focus:outline-none focus:border-gray-400"
              >
                <option value="MY">Malaysia</option>
                <option value="SG">Singapore</option>
                <option value="VN">Vietnam</option>
              </select>
            </div>
          </div>

          {/* Package Selection */}
          <div className="lg:col-span-2 bg-gray-50 rounded p-4">
            <h2 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Packages</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SAP_CATALOG).map(([key, pkg]) => (
                <label key={key} className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPackages.includes(key)}
                    onChange={(e) => e.target.checked ? addPackage(key) : removePackage(key)}
                    className="mr-2.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">{pkg.name}</div>
                    <div className="text-xs text-gray-400">{pkg.baseEffort} days</div>
                  </div>
                </label>
              ))}
            </div>
            {selectedPackages.length > 0 && (
              <button
                onClick={generateTimeline}
                className="w-full mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition-colors"
              >
                Generate Timeline
              </button>
            )}
          </div>
        </div>

        {/* Timeline Controls */}
        {phases.length > 0 && <TimelineControls />}
        
        {/* Timeline Section */}
        {phases.length > 0 && (
          <div className="bg-white rounded border">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Project Timeline</span>
                <span className="text-xs text-gray-400">{phases.length} phases</span>
              </div>
              <button
                onClick={() => setShowHolidayModal(true)}
                className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded hover:border-gray-300"
              >
                Holidays
                {holidays.length > 0 && (
                  <span className="ml-1 text-gray-400">({holidays.length})</span>
                )}
              </button>
            </div>
            <div className="p-0">
              <GanttChart
                phases={phases}
                zoomLevel="weekly"
                onPhaseClick={handlePhaseClick}
                selectedPhaseId={selectedPhaseId}
                holidays={holidays}
                showCalendarAxis={true}
              />
            </div>
          </div>
        )}

        {/* Holiday Modal */}
        {showHolidayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-80">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-normal">Holiday Calendar</h2>
              </div>
              
              <div className="p-5">
                <div className="space-y-2.5 mb-5">
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                  />
                  <input
                    type="text"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    placeholder="Holiday name"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-gray-400"
                  />
                  <button
                    onClick={() => {
                      if (newHoliday.date && newHoliday.name) {
                        addHoliday({ ...newHoliday, country: profile.region || 'MY' });
                        setNewHoliday({ date: '', name: '' });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    Add Holiday
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {holidays.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">No holidays configured</p>
                  ) : (
                    <div className="space-y-1">
                      {holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((holiday, idx) => (
                        <div key={idx} className="flex justify-between items-center px-2 py-1.5 hover:bg-gray-50 rounded">
                          <div>
                            <div className="text-xs font-medium">{holiday.name}</div>
                            <div className="text-xs text-gray-400">{holiday.date}</div>
                          </div>
                          <button
                            onClick={() => removeHoliday(holiday.date)}
                            className="text-xs text-red-600 hover:text-red-700 px-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => setShowHolidayModal(false)}
                  className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resource Modal with Dashboard */}
        {showResourceModal && activePhase && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-96">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-normal">{activePhase.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activePhase.workingDays} days • {formatDateElegant(businessDayToDate(activePhase.startBusinessDay))}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        onClick={() => setPhaseColor(activePhase.id, color)}
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded ${phaseColors[activePhase.id] === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Resource Dashboard */}
              {getResourceMetrics() && (
                <div className="px-5 py-3 bg-gray-50 border-b">
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-lg font-medium">{getResourceMetrics()!.totalResources}</div>
                      <div className="text-xs text-gray-500">Members</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium">{getResourceMetrics()!.avgAllocation}%</div>
                      <div className="text-xs text-gray-500">Avg Load</div>
                    </div>
                    <div>
                      <div className={`text-lg font-medium ${getResourceMetrics()!.overAllocated > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {getResourceMetrics()!.overAllocated}
                      </div>
                      <div className="text-xs text-gray-500">Over 100%</div>
                    </div>
                    <div>
                      <div className={`text-lg font-medium ${getResourceMetrics()!.underUtilized > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                        {getResourceMetrics()!.underUtilized}
                      </div>
                      <div className="text-xs text-gray-500">Under 80%</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-5">
                <button
                  onClick={handleAddResource}
                  className="w-full mb-4 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:border-gray-300"
                >
                  Add Team Member
                </button>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(!activePhase.resources || activePhase.resources.length === 0) ? (
                    <p className="text-xs text-gray-400 text-center py-4">No resources assigned</p>
                  ) : (
                    activePhase.resources.map((resource: any) => (
                      <div key={resource.id} className="px-3 py-2 border border-gray-100 rounded">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-medium">{resource.role}</span>
                          <button
                            onClick={() => handleRemoveResource(resource.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="150"
                            step="10"
                            value={resource.allocation}
                            onChange={(e) => handleAllocationChange(resource.id, parseInt(e.target.value))}
                            className="flex-1 h-1 accent-gray-600"
                          />
                          <span className={`text-xs w-10 text-right ${resource.allocation > 100 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                            {resource.allocation}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-100">
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
