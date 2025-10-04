"use client";

import { useState } from "react";
import { useResourcePlanningStore } from "@/stores/resource-planning-store";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Sparkles, Users } from "lucide-react";
import { DeliverableMapMode } from "./modes/DeliverableMapMode";
import { OptimizationMode } from "./modes/OptimizationMode";
import { AllocationMode } from "./modes/AllocationMode";

type RPMode = 'deliverable' | 'optimize' | 'allocate';

export function ResourcePlanningShell() {
  const [mode, setMode] = useState<RPMode>('deliverable');
  const selectedModules = useResourcePlanningStore(state => state.selectedModules);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            
            {/* Mode Pills */}
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