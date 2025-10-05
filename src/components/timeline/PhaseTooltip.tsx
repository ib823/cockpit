import { Phase } from '@/types/core';
import { calculatePhaseCost, formatCurrency, Region } from '@/lib/cost-calculator';
import { Users, Clock, TrendingUp, DollarSign } from 'lucide-react';

interface PhaseTooltipProps {
  phase: Phase;
  region: Region;
}

export function PhaseTooltip({ phase, region }: PhaseTooltipProps) {
  const cost = calculatePhaseCost(phase, region);
  const resources = phase.resources || [];
  const effort = phase.effort || phase.workingDays || 0;
  const workingDays = phase.workingDays || 0;
  
  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm text-sm">
      <div className="border-b pb-3 mb-3">
        <h3 className="font-semibold text-gray-900">{phase.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{phase.category || 'Implementation Phase'}</p>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} />
            <span>Duration</span>
          </div>
          <span className="font-medium text-gray-900">{workingDays} days</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp size={14} />
            <span>Effort</span>
          </div>
          <span className="font-medium text-gray-900">{effort.toFixed(1)} PD</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={14} />
            <span>Resources</span>
          </div>
          <span className="font-medium text-gray-900">{resources.length} people</span>
        </div>
      </div>
      
      {resources.length > 0 && (
        <div className="border-t pt-3 mb-3">
          <div className="text-xs font-medium text-gray-700 mb-2">Team Allocation</div>
          <div className="space-y-1">
            {resources.map((r, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-600">{r.role}</span>
                <span className="text-gray-900 font-medium">{r.allocation}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="border-t pt-3 bg-blue-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-blue-900 font-medium">
            <DollarSign size={14} />
            <span>Phase Cost</span>
          </div>
          <span className="text-blue-900 font-semibold">{formatCurrency(cost, region)}</span>
        </div>
        
        <div className="text-xs text-blue-700 mt-2 p-2 bg-blue-100 rounded">
          <div className="font-medium mb-1">Calculation:</div>
          <div className="font-mono">
            {resources.length} resources × rates × {effort.toFixed(1)} PD
          </div>
        </div>
      </div>
    </div>
  );
}