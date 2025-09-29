'use client';

import { useState, useEffect } from 'react';
import { MISSING_INFO_ALERTS, getSmartAssumptions } from '@/lib/critical-patterns';
import { usePresalesStore } from '@/stores/presales-store';

interface CriticalGap {
  field: string;
  severity: 'critical' | 'high' | 'medium';
  currentValue: any;
  assumedValue: any;
  impactRange: string;
  question: string;
}

export default function CriticalGapsAlert() {
  const { chips } = usePresalesStore();
  const [gaps, setGaps] = useState<CriticalGap[]>([]);
  const [showAssumptions, setShowAssumptions] = useState(false);
  
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    analyzeCriticalGaps();
  }, [chips]);
  
  const analyzeCriticalGaps = () => {
    const foundGaps: CriticalGap[] = [];
    
    // Check what critical info is missing
    const hasLegalEntities = chips.some(c => c.type === 'legal_entities');
    const hasLocations = chips.some(c => c.type === 'locations');
    const hasDataVolume = chips.some(c => c.type === 'data_volume');
    const hasUsers = chips.some(c => c.type === 'users');
    
    // Get context from what we know
    const industry = chips.find(c => c.type === 'industry')?.value || 'general';
    const employees = parseInt(chips.find(c => c.type === 'employees')?.value || '100');
    const revenue = parseInt(chips.find(c => c.type === 'revenue')?.value || '10000000');
    
    const assumptions = getSmartAssumptions(industry, employees, revenue);
    
    if (!hasLegalEntities) {
      foundGaps.push({
        field: 'Legal Entities / Company Codes',
        severity: 'critical',
        currentValue: null,
        assumedValue: assumptions.legal_entities || 1,
        impactRange: '1 entity = baseline | 5 entities = +50% effort | 10+ entities = +100% effort',
        question: 'How many legal entities or company codes will be implemented?'
      });
    }
    
    if (!hasLocations) {
      foundGaps.push({
        field: 'Plants / Locations / Branches',
        severity: 'critical',
        currentValue: null,
        assumedValue: assumptions.locations || 1,
        impactRange: '1 location = baseline | 5 locations = +30% | 10+ locations = +60%',
        question: 'How many physical locations (plants, warehouses, offices)?'
      });
    }
    
    if (!hasDataVolume) {
      foundGaps.push({
        field: 'Transaction Volume',
        severity: 'high',
        currentValue: null,
        assumedValue: assumptions.data_volume_daily || '1000/day',
        impactRange: '<1K/day = simple | 10K/day = complex | 100K+/day = architectural review needed',
        question: 'Daily transaction volume (invoices, orders, etc.)?'
      });
    }
    
    if (!hasUsers) {
      foundGaps.push({
        field: 'User Count',
        severity: 'high',
        currentValue: null,
        assumedValue: Math.min(employees, assumptions.users || 50),
        impactRange: '<50 = baseline | 200 = +20% training | 1000+ = +40% change management',
        question: 'How many SAP users (named + concurrent)?'
      });
    }
    
    setGaps(foundGaps);
  };
  
  const calculateTotalRisk = () => {
    const criticalCount = gaps.filter(g => g.severity === 'critical').length;
    const highCount = gaps.filter(g => g.severity === 'high').length;
    
    if (criticalCount >= 2) return 'extreme';
    if (criticalCount >= 1 || highCount >= 2) return 'high';
    if (highCount >= 1) return 'medium';
    return 'low';
  };
  
  // CONDITIONAL RETURNS MUST BE AFTER ALL HOOKS
  // Don't show anything if user hasn't processed any text yet (Option 1)
  if (chips.length === 0) {
    return null;
  }
  
  // Don't show if no gaps detected
  if (gaps.length === 0) {
    return null;
  }
  
  const riskLevel = calculateTotalRisk();
  
  return (
    <div className={`rounded-lg border-2 p-4 mb-6 ${
      riskLevel === 'extreme' ? 'bg-red-50 border-red-400' :
      riskLevel === 'high' ? 'bg-orange-50 border-orange-400' :
      riskLevel === 'medium' ? 'bg-yellow-50 border-yellow-400' :
      'bg-blue-50 border-blue-400'
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className={`text-lg font-bold ${
            riskLevel === 'extreme' ? 'text-red-900' :
            riskLevel === 'high' ? 'text-orange-900' :
            riskLevel === 'medium' ? 'text-yellow-900' :
            'text-blue-900'
          }`}>
            ⚠️ Critical Information Gaps Detected
          </h3>
          <p className="text-sm mt-1 text-gray-700">
            Missing {gaps.filter(g => g.severity === 'critical').length} critical,
            {' '}{gaps.filter(g => g.severity === 'high').length} high,
            {' '}{gaps.filter(g => g.severity === 'medium').length} medium severity items
          </p>
        </div>
        
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="text-sm px-3 py-1 bg-white rounded border hover:bg-gray-50"
        >
          {showAssumptions ? 'Hide' : 'Show'} Assumptions
        </button>
      </div>
      
      <div className="space-y-3">
        {gaps.map((gap, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    gap.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    gap.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {gap.severity}
                  </span>
                  <span className="font-medium">{gap.field}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Impact:</strong> {gap.impactRange}
                </p>
                
                <p className="text-sm font-medium text-blue-700">
                  ❓ {gap.question}
                </p>
                
                {showAssumptions && (
                  <div className="mt-2 text-xs bg-gray-50 rounded p-2">
                    <strong>Assumption:</strong> {gap.assumedValue}
                    {gap.severity === 'critical' && (
                      <span className="text-red-600 ml-2">
                        ⚠️ High risk assumption
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {riskLevel === 'extreme' && (
        <div className="mt-4 p-3 bg-red-100 rounded-lg">
          <p className="text-sm font-bold text-red-900">
            🚨 EXTREME RISK: Multiple critical unknowns could cause 2-3x effort variance
          </p>
          <p className="text-xs text-red-700 mt-1">
            Recommend: Conduct detailed scoping workshop before providing estimates
          </p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        <strong>Why this matters:</strong> The difference between 1 and 10 legal entities can mean
        6 months vs 18 months implementation. We're making assumptions that could be wildly wrong.
      </div>
    </div>
  );
}