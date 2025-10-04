"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { usePresalesStore } from "@/stores/presales-store";
import { useTimelineStore } from "@/stores/timeline-store";
import { useProjectStore } from "@/stores/project-store";
import { motion, AnimatePresence } from "framer-motion";

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
        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all flex items-center gap-2 border border-red-200"
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

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Content */}
              <h2 className="text-2xl font-semibold text-gray-900 text-center mb-3">
                Reset All Data?
              </h2>
              <p className="text-gray-600 text-center mb-6">
                This will permanently delete all your data including:
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  All captured requirements and chips
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  All decisions and configurations
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  Generated timelines and manual overrides
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  All project data
                </div>
              </div>

              <p className="text-sm text-red-600 text-center font-medium mb-6">
                This action cannot be undone.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
