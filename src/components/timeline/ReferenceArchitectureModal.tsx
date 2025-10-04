"use client";

import { SAP_ACTIVATE_PHASES } from '@/types/wrappers';
import { useWrappersStore } from '@/stores/wrappers-store';
import { useTimelineStore } from '@/stores/timeline-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WrapperSlider } from './WrapperSlider';
import { useEffect } from 'react';
import { exportReferenceToPDF } from '@/lib/export-reference';

export function ReferenceArchitectureModal() {
  const {
    wrappers,
    calculations,
    showModal,
    toggleModal,
    resetAllWrappers,
    calculateWrappers,
    getTotalWrapperPercentage,
  } = useWrappersStore();

  const { phases, getProjectCost } = useTimelineStore();

  // Calculate core values
  const coreEffort = phases.reduce((sum, p) => sum + (p.workingDays || 0), 0);
  const coreEffortCost = getProjectCost();

  // Recalculate wrappers when core values change
  useEffect(() => {
    calculateWrappers(coreEffort, coreEffortCost);
  }, [coreEffort, coreEffortCost, calculateWrappers]);

  const totalWrapperPercentage = getTotalWrapperPercentage();
  const totalWrapperEffort = calculations.reduce((sum, c) => sum + c.wrapperEffort, 0);
  const totalWrapperCost = calculations.reduce((sum, c) => sum + c.wrapperCost, 0);

  const handleExport = () => {
    exportReferenceToPDF({
      wrappers,
      calculations,
      coreEffort,
      coreEffortCost,
      projectName: 'SAP Implementation Project',
    });
  };

  if (!showModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  SAP Activate Reference Architecture
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Industry-standard wrapper-based effort estimation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={resetAllWrappers}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset all wrappers to defaults"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={toggleModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SAP Activate Methodology Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                SAP Activate Methodology
              </h3>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {SAP_ACTIVATE_PHASES.map((phase, idx) => (
                  <div key={phase.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className="px-4 py-2 rounded-lg font-medium text-sm"
                        style={{
                          backgroundColor: `${phase.color}20`,
                          color: phase.color,
                          border: `2px solid ${phase.color}`,
                        }}
                      >
                        <div className="font-bold mb-1">{phase.name}</div>
                        <div className="text-xs opacity-90">{phase.description}</div>
                      </div>
                    </div>
                    {idx < SAP_ACTIVATE_PHASES.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Wrapper Adjustments */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Wrapper Configuration
                <span className="text-sm font-normal text-gray-500">
                  (Total: {totalWrapperPercentage.toFixed(0)}% of core effort)
                </span>
              </h3>
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
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-2">Core Effort</div>
                <div className="text-2xl font-bold text-gray-900">
                  {coreEffort.toFixed(0)} PD
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatCurrency(coreEffortCost, 'MYR')}
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700 mb-2">Wrapper Effort</div>
                <div className="text-2xl font-bold text-blue-600">
                  +{totalWrapperEffort.toFixed(0)} PD
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  {formatCurrency(totalWrapperCost, 'MYR')}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-700 mb-2">Grand Total</div>
                <div className="text-2xl font-bold text-green-600">
                  {(coreEffort + totalWrapperEffort).toFixed(0)} PD
                </div>
                <div className="text-sm text-green-700 mt-1">
                  {formatCurrency(coreEffortCost + totalWrapperCost, 'MYR')}
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                💡 Best Practices
              </h4>
              <ul className="text-xs text-yellow-800 space-y-1">
                <li>• Project Management: 10-20% typical for SAP implementations</li>
                <li>• Change Management: 8-15% depending on organizational change impact</li>
                <li>• Data Migration: 20-30% for complex legacy system integrations</li>
                <li>• Testing: 25-35% to ensure quality and minimize post-go-live issues</li>
                <li>• Cutover & Hypercare: 10-15% for smooth go-live and stabilization</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Keyboard shortcuts: <kbd className="px-2 py-1 bg-white border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-white border rounded">?</kbd> for help
            </div>
            <button
              onClick={toggleModal}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
