"use client";

import { SAP_ACTIVATE_PHASES } from '@/types/wrappers';
import { useWrappersStore } from '@/stores/wrappers-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { motion } from 'framer-motion';
import { ChevronRight, Info } from 'lucide-react';
import { WrapperSlider } from './WrapperSlider';
import { useEffect } from 'react';

export function SAPActivateReference() {
  const { wrappers, calculations, getTotalWrapperPercentage, toggleModal, calculateWrappers } = useWrappersStore();
  const { phases, getProjectCost } = useTimelineStore();

  // Calculate core effort and cost
  const coreEffort = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);
  const coreEffortCost = getProjectCost();

  // Recalculate wrappers when core values change
  useEffect(() => {
    calculateWrappers(coreEffort, coreEffortCost);
  }, [coreEffort, coreEffortCost, calculateWrappers]);

  const totalWrapperPercentage = getTotalWrapperPercentage();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            SAP Activate Reference
            <button
              onClick={toggleModal}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Learn more about SAP Activate methodology"
            >
              <Info className="w-4 h-4 text-gray-400" />
            </button>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Wrapper-based effort estimation (Total: {totalWrapperPercentage.toFixed(0)}% of core)
          </p>
        </div>
      </div>

      {/* SAP Activate Flow */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {SAP_ACTIVATE_PHASES.map((phase, idx) => (
          <div key={phase.id} className="flex items-center gap-2">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              style={{
                backgroundColor: `${phase.color}20`,
                color: phase.color,
                border: `1px solid ${phase.color}40`,
              }}
            >
              {phase.name}
            </div>
            {idx < SAP_ACTIVATE_PHASES.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Wrapper Sliders */}
      <div className="space-y-4">
        {wrappers.map((wrapper) => {
          const calculation = calculations.find((c) => c.wrapperId === wrapper.id);

          return (
            <WrapperSlider
              key={wrapper.id}
              wrapper={wrapper}
              calculation={calculation}
            />
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-500 mb-1">Core Effort</div>
            <div className="text-lg font-semibold text-gray-900">
              {coreEffort.toFixed(0)} PD
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Wrapper Effort</div>
            <div className="text-lg font-semibold text-blue-600">
              +{calculations.reduce((sum, c) => sum + c.wrapperEffort, 0).toFixed(0)} PD
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Grand Total</div>
            <div className="text-lg font-semibold text-green-600">
              {(coreEffort + calculations.reduce((sum, c) => sum + c.wrapperEffort, 0)).toFixed(0)} PD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
