"use client";

import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * ResetButton - Allows users to reset all application data
 *
 * Shows confirmation dialog before clearing:
 * - All presales chips and decisions
 * - Timeline phases and configuration
 * - Project state and manual overrides
 * - All localStorage data
 */
export function ResetButton({ variant = "button" }: { variant?: "button" | "menu-item" }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const presalesReset = usePresalesStore((state) => state.reset);
  const timelineReset = useTimelineStore((state) => state.reset);
  const projectReset = useProjectStore((state) => state.reset);

  const handleReset = () => {
    // Reset all stores
    presalesReset();
    timelineReset();
    projectReset();

    // Clear localStorage to ensure fresh start
    localStorage.clear();

    // Close confirmation and show success
    setShowConfirmation(false);

    // Reload page to reset all state
    window.location.href = "/timeline-magic";
  };

  if (variant === "menu-item") {
    return (
      <>
        <button
          onClick={() => setShowConfirmation(true)}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Reset All Data
        </button>

        <ConfirmationDialog
          isOpen={showConfirmation}
          onClose={() => setShowConfirmation(false)}
          onConfirm={handleReset}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className="px-3 py-2 sm:px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center gap-2 border border-red-200 text-sm"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Reset All Data</span>
        <span className="sm:hidden">Reset</span>
      </button>

      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleReset}
      />
    </>
  );
}

function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Dialog - RESPONSIVE SIZING */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mx-auto mb-4 sm:mb-6">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>

              {/* Content */}
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-2 sm:mb-3">
                Reset All Data?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 text-center mb-4 sm:mb-6">
                This will permanently delete all your data including:
              </p>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 space-y-2 text-xs sm:text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  <span>All captured requirements and chips</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  <span>All decisions and configurations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  <span>Generated timelines and manual overrides</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                  <span>All project data</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-red-600 text-center font-medium mb-4 sm:mb-6">
                This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all text-sm sm:text-base"
                >
                  Reset Everything
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}