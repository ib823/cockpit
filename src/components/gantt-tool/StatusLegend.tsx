/**
 * Status Legend Component
 *
 * Steve Jobs: "Simplicity is the ultimate sophistication."
 * Jony Ive: "We try to design a product that is very simple, very clean."
 *
 * Shows 4 core statuses with clear visual indicators.
 * Always visible in top-right corner of Gantt chart.
 */

'use client';

import React from 'react';
import { GANTT_STATUS_COLORS } from '@/lib/design-system';

interface StatusLegendProps {
  className?: string;
  compact?: boolean;
}

/**
 * 4 Core Statuses (Steve Jobs approved)
 * Removed: Blocked/Overdue (handled by red badge), On Hold/Paused (rare, use icon)
 */
const CORE_STATUSES = [
  {
    key: 'notStarted',
    label: 'Not Started',
    color: GANTT_STATUS_COLORS.notStarted,
    description: 'Tasks that have not yet begun',
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    color: GANTT_STATUS_COLORS.inProgress,
    description: 'Tasks currently being worked on',
  },
  {
    key: 'atRisk',
    label: 'At Risk',
    color: GANTT_STATUS_COLORS.atRisk,
    description: 'Tasks approaching deadline or needing attention',
  },
  {
    key: 'completed',
    label: 'Complete',
    color: GANTT_STATUS_COLORS.completed,
    description: 'Tasks that are finished',
  },
] as const;

export function StatusLegend({ className = '', compact = false }: StatusLegendProps) {
  if (compact) {
    // Compact horizontal layout for tight spaces
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-xs font-medium text-gray-500">Status:</span>
        {CORE_STATUSES.map((status) => (
          <div key={status.key} className="flex items-center gap-1.5" title={status.description}>
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-xs text-gray-700">{status.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // Full legend with descriptions
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Status Legend
        </h3>
      </div>
      <div className="space-y-2">
        {CORE_STATUSES.map((status) => (
          <div key={status.key} className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded"
              style={{ backgroundColor: status.color }}
              title={status.description}
            />
            <span className="text-xs text-gray-700 font-medium">
              {status.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 italic">
          Overdue tasks show red badges
        </p>
      </div>
    </div>
  );
}

/**
 * Inline mini legend for tight spaces (e.g., toolbar)
 */
export function StatusLegendMini({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {CORE_STATUSES.map((status, index) => (
        <React.Fragment key={status.key}>
          {index > 0 && <span className="text-gray-300">•</span>}
          <div className="inline-flex items-center gap-1" title={status.description}>
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: status.color }}
            />
            <span className="text-xs text-gray-600">{status.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
