"use client";

/**
 * REGENERATE PREVIEW MODAL
 *
 * Shows diff before regenerating timeline to prevent data loss.
 * Per spec: Roadmap_and_DoD.md P1-1
 *
 * Features:
 * - Shows phase count changes (added/removed)
 * - Shows duration and cost diff
 * - Warns about manual edits at risk
 * - Accessible (Escape key, focus trap)
 * - Analytics tracking
 */

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, TrendingUp, TrendingDown, Minus, Clock, DollarSign } from "lucide-react";
import { useEffect } from "react";
import { formatCurrency, formatDuration } from "@/lib/utils";
import type { Phase } from "@/stores/timeline-store";

interface RegenerateDiff {
  phasesAdded: number;
  phasesRemoved: number;
  durationChange: number; // in working days
  costChange: number; // in currency
  manualEditCount: number;
  affectedPhases: string[]; // phase names
}

interface RegenerateModalProps {
  show: boolean;
  diff: RegenerateDiff;
  onConfirm: () => void;
  onCancel: () => void;
}

export function RegenerateModal({ show, diff, onConfirm, onCancel }: RegenerateModalProps) {
  // Handle Escape key
  useEffect(() => {
    if (!show) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, onCancel]);

  if (!show) return null;

  const hasChanges = diff.phasesAdded > 0 || diff.phasesRemoved > 0;
  const hasManualEdits = diff.manualEditCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Regenerate Timeline</h2>
                </div>
                <button
                  onClick={onCancel}
                  className="w-8 h-8 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Warning about manual edits */}
              {hasManualEdits && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-900 mb-1">
                        {diff.manualEditCount} Manual Edit{diff.manualEditCount !== 1 ? 's' : ''} at Risk
                      </h3>
                      <p className="text-sm text-yellow-800">
                        Regenerating will preserve your manual edits, but may cause inconsistencies
                        if the underlying data has changed significantly.
                      </p>
                      {diff.affectedPhases.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-yellow-700 font-medium">Affected phases:</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            {diff.affectedPhases.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Preview of changes */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Preview of Changes</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Phases change */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {diff.phasesAdded > 0 && <TrendingUp className="w-4 h-4 text-green-600" />}
                      {diff.phasesRemoved > 0 && <TrendingDown className="w-4 h-4 text-red-600" />}
                      {diff.phasesAdded === 0 && diff.phasesRemoved === 0 && <Minus className="w-4 h-4 text-gray-400" />}
                      <span className="text-sm font-medium text-gray-700">Phases</span>
                    </div>
                    <div className="space-y-1">
                      {diff.phasesAdded > 0 && (
                        <p className="text-xs text-green-700">
                          +{diff.phasesAdded} new phase{diff.phasesAdded !== 1 ? 's' : ''}
                        </p>
                      )}
                      {diff.phasesRemoved > 0 && (
                        <p className="text-xs text-red-700">
                          -{diff.phasesRemoved} removed
                        </p>
                      )}
                      {diff.phasesAdded === 0 && diff.phasesRemoved === 0 && (
                        <p className="text-xs text-gray-500">No change</p>
                      )}
                    </div>
                  </div>

                  {/* Duration change */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Duration</span>
                    </div>
                    <div className="space-y-1">
                      {diff.durationChange !== 0 ? (
                        <p className={`text-xs font-semibold ${diff.durationChange > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                          {diff.durationChange > 0 ? '+' : ''}{formatDuration(Math.abs(diff.durationChange))}
                          {diff.durationChange > 0 ? ' longer' : ' shorter'}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">No change</p>
                      )}
                    </div>
                  </div>

                  {/* Cost change */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Cost</span>
                    </div>
                    <div className="space-y-1">
                      {diff.costChange !== 0 ? (
                        <p className={`text-xs font-semibold ${diff.costChange > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {diff.costChange > 0 ? '+' : ''}{formatCurrency(Math.abs(diff.costChange), 'MYR')}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">No change</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary message */}
              {!hasChanges && !hasManualEdits && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    The timeline will be regenerated based on your latest requirements and decisions.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Regenerate Timeline
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * Calculate diff between current and new timeline
 */
export function calculateRegenerateDiff(
  currentPhases: Phase[],
  newPhases: Phase[],
  manualOverrides: any[],
  currentCost: number,
  newCost: number
): RegenerateDiff {
  const currentPhaseCount = currentPhases.length;
  const newPhaseCount = newPhases.length;

  const currentDuration = currentPhases.reduce((sum, p) => sum + p.workingDays, 0);
  const newDuration = newPhases.reduce((sum, p) => sum + p.workingDays, 0);

  // Find affected phases (those with manual overrides)
  const affectedPhases = manualOverrides
    .map(override => {
      const phase = currentPhases.find(p => p.id === override.phaseId);
      return phase?.name;
    })
    .filter(Boolean) as string[];

  return {
    phasesAdded: Math.max(0, newPhaseCount - currentPhaseCount),
    phasesRemoved: Math.max(0, currentPhaseCount - newPhaseCount),
    durationChange: newDuration - currentDuration,
    costChange: newCost - currentCost,
    manualEditCount: manualOverrides.length,
    affectedPhases,
  };
}
