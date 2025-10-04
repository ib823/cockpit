"use client";

import { useState } from "react";
import { useResourcePlanningStore } from "@/stores/resource-planning-store";
import { useProjectStore } from "@/stores/project-store";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, Users, ArrowLeft, LayoutDashboard } from "lucide-react";
import { DeliverableMapMode } from "./modes/DeliverableMapMode";
import { OptimizationMode } from "./modes/OptimizationMode";
import { AllocationMode } from "./modes/AllocationMode";

type RPMode = 'deliverable' | 'optimize' | 'allocate';

export function ResourcePlanningShell() {
  const [mode, setMode] = useState<RPMode>('deliverable');
  const selectedModules = useResourcePlanningStore(state => state.selectedModules);
  const setProjectMode = useProjectStore(state => state.setMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Workflow Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setProjectMode('capture')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Capture
            </button>
            <span className="text-gray-300">→</span>
            <button
              onClick={() => setProjectMode('decide')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Decide
            </button>
            <span className="text-gray-300">→</span>
            <button
              onClick={() => setProjectMode('plan')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Plan
            </button>
            <span className="text-gray-300">→</span>
            <span className="text-purple-600 font-semibold">
              Optimize
            </span>
            <span className="text-gray-300">→</span>
            <button
              onClick={() => setProjectMode('present')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Present
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <button
                onClick={() => setProjectMode('plan')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Timeline"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Plan</span>
              </button>

              <div className="h-8 w-px bg-gray-300" />

              <div>
                <h1 className="text-2xl font-semibold text-purple-900">
                  Resource Planning
                </h1>
                <p className="text-sm text-purple-600 mt-0.5">
                  {selectedModules.length > 0
                    ? `Optimizing ${selectedModules.length} module${selectedModules.length > 1 ? 's' : ''}`
                    : 'Configuration-level resource optimization'}
                </p>
              </div>
            </div>

            {/* Mode Pills */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <ModePill
                  active={mode === 'deliverable'}
                  onClick={() => setMode('deliverable')}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Deliverables"
                />
                <ModePill
                  active={mode === 'optimize'}
                  onClick={() => setMode('optimize')}
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Optimize"
                />
                <ModePill
                  active={mode === 'allocate'}
                  onClick={() => setMode('allocate')}
                  icon={<Users className="w-4 h-4" />}
                  label="Allocate"
                />
              </div>

              <div className="h-8 w-px bg-gray-300" />

              {/* Quick Navigation */}
              <button
                onClick={() => setProjectMode('present')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
              >
                <LayoutDashboard className="w-4 h-4" />
                Present
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {mode === 'deliverable' && <DeliverableMapMode />}
          {mode === 'optimize' && <OptimizationMode />}
          {mode === 'allocate' && <AllocationMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ModePill({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm
        transition-all duration-200
        ${active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-300/50 scale-105'
          : 'bg-white text-purple-600 hover:bg-purple-50 hover:shadow-md'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}