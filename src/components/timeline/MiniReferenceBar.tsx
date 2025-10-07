"use client";

import { SAP_ACTIVATE_PHASES } from '@/types/wrappers';
import { useWrappersStore } from '@/stores/wrappers-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useEffect } from 'react';

export function MiniReferenceBar() {
  const {
    wrappers,
    calculations,
    showReference,
    toggleReference,
    toggleModal,
    calculateWrappers,
    getTotalWrapperEffort,
    getTotalWrapperCost,
  } = useWrappersStore();

  const { phases, getProjectCost } = useTimelineStore();

  // Calculate core values
  const coreEffort = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);
  const coreEffortCost = getProjectCost();

  // Recalculate wrappers when core values change
  useEffect(() => {
    calculateWrappers(coreEffort, coreEffortCost);
  }, [coreEffort, coreEffortCost, calculateWrappers]);

  const totalWrapperEffort = getTotalWrapperEffort();
  const totalWrapperCost = getTotalWrapperCost();
  const grandTotalEffort = coreEffort + totalWrapperEffort;
  const grandTotalCost = coreEffortCost + totalWrapperCost;

  // Don't render if no phases (no real project data)
  if (phases.length === 0 || coreEffort === 0) {
    return null;
  }

  return (
    <motion.div
      initial={false}
      className="sticky top-0 z-40 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 shadow-sm"
    >
      {/* Collapsed bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Left: SAP Activate flow */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Reference Diagram</span>
          </button>

          <div className="flex items-center gap-1.5">
            {SAP_ACTIVATE_PHASES.map((phase) => (
              <div
                key={phase.id}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: `${phase.color}20`,
                  color: phase.color,
                }}
                title={phase.description}
              >
                {phase.name}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Wrapper totals */}
        <div className="flex items-center gap-6">
          {wrappers.map((wrapper) => {
            const calc = calculations.find((c) => c.wrapperId === wrapper.id);
            if (!calc) return null;

            return (
              <div key={wrapper.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: wrapper.color }}
                />
                <span className="text-xs text-gray-600">{wrapper.name}:</span>
                <span className="text-xs font-semibold text-gray-900">
                  {calc.wrapperEffort.toFixed(0)} PD
                </span>
              </div>
            );
          })}
        </div>

        {/* Right: Grand totals + toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 px-4 py-2 bg-white rounded-lg border border-blue-200">
            <div>
              <div className="text-xs text-gray-500">Total Effort</div>
              <div className="text-sm font-bold text-gray-900">
                {grandTotalEffort.toFixed(0)} PD
              </div>
            </div>
            <div className="w-px h-8 bg-gray-300" />
            <div>
              <div className="text-xs text-gray-500">Total Cost</div>
              <div className="text-sm font-bold text-green-600">
                {formatCurrency(grandTotalCost, 'MYR')}
              </div>
            </div>
          </div>

          <button
            onClick={toggleReference}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title={showReference ? "Hide reference" : "Show reference"}
          >
            {showReference ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded reference panel */}
      <AnimatePresence>
        {showReference && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 pt-2 border-t border-blue-200">
              <div className="grid grid-cols-5 gap-4">
                {wrappers.map((wrapper) => {
                  const calc = calculations.find((c) => c.wrapperId === wrapper.id);
                  if (!calc) return null;

                  return (
                    <div
                      key={wrapper.id}
                      className="p-3 bg-white rounded-lg border"
                      style={{ borderColor: `${wrapper.color}40` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: wrapper.color }}
                        />
                        <span className="text-xs font-medium text-gray-900">
                          {wrapper.name}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">
                          {wrapper.currentPercentage.toFixed(0)}% of core
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {calc.wrapperEffort.toFixed(0)} PD
                        </div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(calc.wrapperCost, 'MYR')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
