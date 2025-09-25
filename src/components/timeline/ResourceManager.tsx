import React, { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '@/stores/timeline-store';
import { getRateCard, formatCurrency } from '@/data/resource-catalog';
import { businessDayToDate, calculateEndDate, dateToBusinessDay } from '@/lib/timeline/date-calculations';

interface ResourceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  activePhase: any;
}

const ResourceManager: React.FC<ResourceManagerProps> = ({ isOpen, onClose, activePhase }) => {
  const { 
    profile, 
    updatePhaseResources, 
    setPhaseColor, 
    phaseColors, 
    updatePhase,
    phases 
  } = useTimelineStore();
  
  const [localResources, setLocalResources] = useState<any[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const colorOptions = ['#3b82f6', '#10b981', '#8b5cf6'];

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // FIXED: Only sync when activePhase changes, no automatic store updates
  useEffect(() => {
    if (activePhase) {
      setLocalResources([...(activePhase.resources || [])]);
    }
  }, [activePhase?.id]); // Only depend on ID to prevent infinite loops

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string): Date => {
    return new Date(dateString + 'T00:00:00');
  };

  const formatDisplayDate = (date: Date): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(date.getDate()).padStart(2, '0');
    const mmm = months[date.getMonth()];
    const yy = String(date.getFullYear()).slice(-2);
    const ddd = days[date.getDay()];
    return `${dd}-${mmm}-${yy} (${ddd})`;
  };

  // Real-time updates
  const handleDurationChange = (newDuration: number) => {
    const clampedDuration = Math.max(1, Math.min(365, newDuration));
    updatePhase(activePhase.id, { workingDays: clampedDuration });
  };

  const handleStartDateChange = (newStartDate: string) => {
    try {
      const startDate = parseInputDate(newStartDate);
      const newStartBusinessDay = dateToBusinessDay(startDate);
      updatePhase(activePhase.id, { startBusinessDay: newStartBusinessDay });
    } catch (error) {
      console.warn('Invalid start date:', newStartDate);
    }
  };

  const handleEndDateChange = (newEndDate: string) => {
    try {
      const endDate = parseInputDate(newEndDate);
      const startDate = businessDayToDate(activePhase.startBusinessDay);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const workingDays = Math.max(1, Math.round(diffDays * 0.7));
      updatePhase(activePhase.id, { workingDays });
    } catch (error) {
      console.warn('Invalid end date:', newEndDate);
    }
  };

  const getCurrentDates = () => {
    if (!activePhase) return { startDate: new Date(), endDate: new Date() };
    
    const currentPhase = phases.find(p => p.id === activePhase.id) || activePhase;
    const startDate = businessDayToDate(currentPhase.startBusinessDay);
    const endDate = calculateEndDate(startDate, currentPhase.workingDays);
    
    return { startDate, endDate, currentPhase };
  };

  const { startDate, endDate, currentPhase } = getCurrentDates();

  const formatDurationDisplay = (workingDays: number): string => {
    if (workingDays >= 30) {
      const months = Math.floor(workingDays / 22);
      const remainingDays = workingDays % 22;
      const weeks = Math.floor(remainingDays / 5);
      const days = remainingDays % 5;
      
      const parts = [];
      if (months > 0) parts.push(`${months}m`);
      if (weeks > 0) parts.push(`${weeks}w`);
      if (days > 0) parts.push(`${days}d`);
      return parts.join(' ') || `${workingDays}d`;
    } else if (workingDays >= 5) {
      const weeks = Math.floor(workingDays / 5);
      const days = workingDays % 5;
      const parts = [];
      if (weeks > 0) parts.push(`${weeks}w`);
      if (days > 0) parts.push(`${days}d`);
      return parts.join(' ') || `${workingDays}d`;
    }
    return `${workingDays}d`;
  };

  // FIXED: Update store immediately on user actions
  const handleAddResource = () => {
    if (!activePhase) return;
    const role = 'Senior Consultant';
    const region = profile.region || 'ABMY';
    const rateCard = getRateCard(role, region);
    
    const newResource = {
      id: `res_${Date.now()}`,
      name: `${role} ${localResources.length + 1}`,
      role,
      allocation: 80,
      region,
      hourlyRate: rateCard?.hourlyRate || 400,
      includeOPE: false
    };
    
    const updatedResources = [...localResources, newResource];
    setLocalResources(updatedResources);
    updatePhaseResources(activePhase.id, updatedResources); // Update store immediately
  };

  const handleRemoveResource = (resourceId: string) => {
    const updatedResources = localResources.filter(r => r.id !== resourceId);
    setLocalResources(updatedResources);
    updatePhaseResources(activePhase.id, updatedResources); // Update store immediately
  };

  const handleAllocationChange = (resourceId: string, allocation: number) => {
    const clampedAllocation = Math.max(0, Math.min(100, allocation));
    const updatedResources = localResources.map(r =>
      r.id === resourceId ? { ...r, allocation: clampedAllocation } : r
    );
    setLocalResources(updatedResources);
    updatePhaseResources(activePhase.id, updatedResources); // Update store immediately
  };

  const handleColorChange = (color: string) => {
    if (activePhase) {
      setPhaseColor(activePhase.id, color);
    }
  };

  const getResourceMetrics = () => {
    if (!localResources.length) return null;
    
    const totalAllocation = localResources.reduce((sum, r) => sum + r.allocation, 0);
    const avgAllocation = Math.round(totalAllocation / localResources.length);
    const overAllocated = localResources.filter(r => r.allocation > 100).length;
    const underUtilized = localResources.filter(r => r.allocation < 80).length;
    
    return { totalResources: localResources.length, avgAllocation, overAllocated, underUtilized };
  };

  if (!isOpen || !activePhase || !currentPhase) return null;

  const currentColor = phaseColors[activePhase.id] || activePhase.color || '#3b82f6';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <div 
        ref={panelRef}
        className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{activePhase.name}</h2>
              <div className="text-sm text-gray-500 mt-2">
                <div>{formatDurationDisplay(currentPhase.workingDays)}</div>
                <div>S: {formatDisplayDate(startDate)}</div>
                <div>E: {formatDisplayDate(endDate)}</div>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formatDateForInput(startDate)}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formatDateForInput(endDate)}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration: {currentPhase.workingDays} working days
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={currentPhase.workingDays}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg"
                />
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={currentPhase.workingDays}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">Phase Color</div>
            <div className="flex gap-3">
              {colorOptions.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-10 h-10 rounded-full border-3 transition-all ${
                    currentColor === color ? 'border-gray-800 scale-110' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Team Members</h3>
            <button
              onClick={handleAddResource}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 hover:bg-blue-50 rounded-lg"
            >
              + Add Resource
            </button>
          </div>

          {(() => {
            const metrics = getResourceMetrics();
            return metrics ? (
              <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">{metrics.totalResources}</div>
                  <div className="text-xs text-gray-500">Members</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">{metrics.avgAllocation}%</div>
                  <div className="text-xs text-gray-500">Avg Load</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{metrics.overAllocated}</div>
                  <div className="text-xs text-gray-500">Over 100%</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{metrics.underUtilized}</div>
                  <div className="text-xs text-gray-500">Under 80%</div>
                </div>
              </div>
            ) : null;
          })()}

          <div className="space-y-4">
            {localResources.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-sm">No resources assigned</div>
            ) : (
              localResources.map((resource) => {
                const workingDays = Math.round((currentPhase.workingDays * resource.allocation) / 100);
                const dailyCost = (resource.hourlyRate || 0) * 8 * (resource.allocation / 100);
                const totalCost = dailyCost * currentPhase.workingDays;

                return (
                  <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{resource.role}</div>
                        <div className="text-sm text-gray-500">{workingDays} working days</div>
                        <div className="text-sm text-blue-600 font-medium mt-1">
                          {formatCurrency(totalCost, resource.region)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveResource(resource.id)}
                        className="text-red-500 hover:text-red-700 text-sm px-3 py-1 hover:bg-red-50 rounded transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Allocation</span>
                        <span className={`font-bold ${
                          resource.allocation > 100 ? 'text-red-600' : 
                          resource.allocation < 80 ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {resource.allocation}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={resource.allocation}
                        onChange={(e) => handleAllocationChange(resource.id, parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            All changes apply immediately. Click outside to close.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceManager;
