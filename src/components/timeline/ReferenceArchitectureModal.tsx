"use client";

import { useWrappersStore } from '@/stores/wrappers-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { ComprehensiveReferenceArchitecture } from './ComprehensiveReferenceArchitecture';

export function ReferenceArchitectureModal() {
  const { showModal, toggleModal } = useWrappersStore();

  const handleExport = () => {
    // Export functionality - print to PDF
    window.print();
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Implementation Reference
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive SAP project architecture and planning
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={toggleModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <ComprehensiveReferenceArchitecture />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
