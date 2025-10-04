"use client";

import { useWrappersStore } from '@/stores/wrappers-store';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { ComprehensiveReferenceArchitecture } from './ComprehensiveReferenceArchitecture';
import { Button } from '@/components/common/Button';
import { Heading2, BodySM } from '@/components/common/Typography';
import { animation } from '@/lib/design-system';

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
          transition={{ duration: animation.duration.normal }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div>
              <Heading2>Complete Implementation Reference</Heading2>
              <BodySM className="text-gray-600 mt-2">
                Comprehensive SAP project architecture and planning
              </BodySM>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                size="sm"
                onClick={handleExport}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleModal}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <ComprehensiveReferenceArchitecture />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
