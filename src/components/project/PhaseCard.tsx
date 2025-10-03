// src/components/project/PhaseCard.tsx
'use client';

import { useState } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { usePresalesStore } from '@/stores/presales-store';

interface PhaseCardProps {
  phase: any;
}

export function PhaseCard({ phase }: PhaseCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [manualDuration, setManualDuration] = useState(phase.workingDays || 0);

  const chips = usePresalesStore(state => state.chips);
  const addManualOverride = useProjectStore(state => state.addManualOverride);

  // Calculate reasoning
  const reasoning = calculateReasoning(phase, chips);

  const handleSaveManualEdit = () => {
    addManualOverride({
      phaseId: phase.id,
      field: 'duration',
      originalValue: phase.workingDays,
      manualValue: manualDuration,
      reason: 'Manual adjustment by user',
      timestamp: new Date()
    });
    setIsEditing(false);
  };

  return (
    <div className="chip-card bg-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{phase.name}</h3>
          <p className="text-sm text-gray-500 mt-1">{phase.stream || 'Core Phase'}</p>
        </div>

        {phase._hasManualOverride && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
            Manual Edit
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs text-gray-500">Duration</div>
          {isEditing ? (
            <input
              type="number"
              value={manualDuration}
              onChange={(e) => setManualDuration(Number(e.target.value))}
              className="text-xl font-semibold text-gray-900 w-20 border-b-2 border-blue-500"
              autoFocus
            />
          ) : (
            <div className="text-xl font-semibold text-gray-900">
              {phase.workingDays || 0} days
            </div>
          )}
        </div>
        <div>
          <div className="text-xs text-gray-500">Effort</div>
          <div className="text-xl font-semibold text-gray-900">
            {phase.effort || 0} PD
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Team</div>
          <div className="text-xl font-semibold text-gray-900">
            {phase.resources?.length || 0} FTE
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <button
        onClick={() => setShowReasoning(!showReasoning)}
        className="text-sm text-blue-600 hover:text-blue-700 mb-2"
      >
        {showReasoning ? '▼ Hide' : '▶ Why these numbers?'}
      </button>

      {showReasoning && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
          <div>
            <div className="font-medium text-gray-700 mb-2">Duration: {phase.workingDays} days</div>
            {reasoning.duration.map((reason, idx) => (
              <div key={idx} className="text-gray-600 ml-4">
                ↳ {reason}
              </div>
            ))}
          </div>

          <div>
            <div className="font-medium text-gray-700 mb-2">Effort: {phase.effort} PD</div>
            {reasoning.effort.map((reason, idx) => (
              <div key={idx} className="text-gray-600 ml-4">
                ↳ {reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400"
          >
            ✏️ Edit
          </button>
        ) : (
          <>
            <button
              onClick={handleSaveManualEdit}
              className="px-3 py-1 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setManualDuration(phase.workingDays);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Calculate reasoning from chips
function calculateReasoning(phase: any, chips: any[]) {
  const employeeChip = chips.find(c => c.type === 'employees');
  const moduleChips = chips.filter(c => c.type === 'module');
  const complianceChips = chips.filter(c => c.type === 'compliance');

  const duration = [];
  const effort = [];

  // Duration reasoning
  if (employeeChip) {
    const count = parseInt(String(employeeChip.value));
    if (count > 500) {
      duration.push(`${count} employees = Large org (+20% duration)`);
    } else if (count > 200) {
      duration.push(`${count} employees = Medium org (+10% duration)`);
    }
  }

  if (moduleChips.length > 1) {
    duration.push(`${moduleChips.length} modules (+${moduleChips.length * 5}% duration)`);
  }

  if (complianceChips.length > 0) {
    duration.push(`${complianceChips.length} compliance req (+${complianceChips.length * 2} weeks)`);
  }

  // Effort reasoning
  moduleChips.forEach(mod => {
    effort.push(`${mod.value} module: base 80 PD`);
  });

  const integrationChips = chips.filter(c => c.type === 'integration');
  integrationChips.forEach(int => {
    effort.push(`${int.value} integration: +20 PD`);
  });

  // Default if no specific reasoning
  if (duration.length === 0) {
    duration.push('Standard SAP Activate methodology');
  }
  if (effort.length === 0) {
    effort.push('Base effort from package configuration');
  }

  return { duration, effort };
}
