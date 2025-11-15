/**
 * REGENERATE MODAL - P1-1
 *
 * Preview changes before regenerating timeline
 * Shows diff (phases added/removed, duration/cost changes)
 * Warns about manual edits at risk
 *
 * Per spec: Roadmap_and_DoD.md lines 93-115
 */

"use client";

import {
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Layers,
} from "lucide-react";
import BaseModal from "@/components/ui/BaseModal";
import { formatCurrency } from "@/lib/utils";
import type { Phase } from "@/types/core";

export interface TimelineDiff {
  phasesAdded: number;
  phasesRemoved: number;
  durationChangeDays: number;
  costChangeMYR: number;
  manualEditsCount: number;
}

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diff: TimelineDiff;
  currentPhases: Phase[];
  newPhases?: Phase[];
}

export function RegenerateModal({
  isOpen,
  onClose,
  onConfirm,
  diff,
  currentPhases,
  newPhases = [],
}: RegenerateModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Regenerate Timeline?"
      icon={<RefreshCw />}
      size="medium"
      footerActions={[
        {
          label: "Cancel",
          onClick: onClose,
          variant: "secondary",
        },
        {
          label: "Regenerate Timeline",
          onClick: handleConfirm,
          variant: "primary",
          icon: RefreshCw,
        },
      ]}
    >
      {/* Warning about manual edits */}
      {diff.manualEditsCount > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                You have {diff.manualEditsCount} manual edit
                {diff.manualEditsCount > 1 ? "s" : ""}
              </h3>
              <p className="text-sm text-orange-800">
                Regenerating will preserve your edits, but may cause inconsistencies if
                the underlying timeline structure changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Diff Summary */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          What will change?
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Duration Change */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Duration</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                {Math.abs(diff.durationChangeDays)}
              </span>
              <span className="text-sm text-gray-600">days</span>
              {diff.durationChangeDays > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500 ml-auto" />
              ) : diff.durationChangeDays < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <span className="text-xs text-gray-500 ml-auto">No change</span>
              )}
            </div>
          </div>

          {/* Cost Change */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Cost</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-gray-900">
                {formatCurrency(Math.abs(diff.costChangeMYR))}
              </span>
              {diff.costChangeMYR > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500 ml-auto" />
              ) : diff.costChangeMYR < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-500 ml-auto" />
              ) : (
                <span className="text-xs text-gray-500 ml-auto">No change</span>
              )}
            </div>
          </div>

          {/* Phases Added */}
          {diff.phasesAdded > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-medium text-green-900 mb-1">
                +{diff.phasesAdded} phase{diff.phasesAdded > 1 ? "s" : ""} added
              </div>
              <div className="text-xs text-green-700">New phases will be inserted</div>
            </div>
          )}

          {/* Phases Removed */}
          {diff.phasesRemoved > 0 && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-medium text-red-900 mb-1">
                -{diff.phasesRemoved} phase{diff.phasesRemoved > 1 ? "s" : ""} removed
              </div>
              <div className="text-xs text-red-700">Existing phases will be deleted</div>
            </div>
          )}
        </div>
      </div>

      {/* Phase-by-phase comparison (if newPhases provided) */}
      {newPhases.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Phase Comparison</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {newPhases.slice(0, 10).map((phase, idx) => {
              const oldPhase = currentPhases[idx];
              const durationChanged =
                oldPhase && oldPhase.workingDays !== phase.workingDays;

              return (
                <div
                  key={phase.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <span className="font-medium text-gray-900">{phase.name}</span>
                  <div className="flex items-center gap-3">
                    {oldPhase ? (
                      <>
                        {durationChanged ? (
                          <>
                            <span className="text-gray-500 line-through">
                              {oldPhase.workingDays}d
                            </span>
                            <span className="text-blue-600 font-medium">
                              {phase.workingDays}d
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-600">{phase.workingDays}d</span>
                        )}
                      </>
                    ) : (
                      <span className="text-green-600 font-medium">
                        New: {phase.workingDays}d
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {newPhases.length > 10 && (
              <div className="text-center text-sm text-gray-500 py-2">
                ... and {newPhases.length - 10} more phases
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This regeneration is based on your current requirements
          and decisions. Manual edits to phase durations, resources, or dates will be
          preserved where possible.
        </p>
      </div>
    </BaseModal>
  );
}
