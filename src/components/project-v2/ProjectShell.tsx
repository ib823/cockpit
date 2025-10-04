/**
 * ProjectShell - Main Orchestrator for Project Workflow
 * 
 * Handles mode switching with smooth animations
 * Modes: capture → decide → plan → present
 */

"use client";

import { safePercentage } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { AnimatePresence, motion } from "framer-motion";
import { CaptureMode } from "./modes/CaptureMode";
import { DecideMode } from "./modes/DecideMode";

/**
 * Mode Indicator - Hero banner for each mode
 */
function ModeIndicator({ mode, progress }: { mode: string; progress?: number }) {
  const config: Record<string, { title: string; subtitle: string; gradient: string; color: string }> = {
    capture: {
      title: "Capture Requirements",
      subtitle: "Extract project details from your RFP",
      gradient: "from-blue-600 to-blue-700",
      color: "text-blue-100",
    },
    decide: {
      title: "Make Key Decisions",
      subtitle: "Shape your project with 5 strategic decisions",
      gradient: "from-purple-600 to-purple-700",
      color: "text-purple-100",
    },
    plan: {
      title: "Plan Timeline",
      subtitle: "Review and adjust your project plan",
      gradient: "from-green-600 to-green-700",
      color: "text-green-100",
    },
    present: {
      title: "Present",
      subtitle: "Client-ready presentation",
      gradient: "from-gray-800 to-gray-900",
      color: "text-gray-100",
    },
  };

  const current = config[mode] || config.capture;

  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${current.gradient} px-8 py-6 text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight">{current.title}</h1>
          <p className={`${current.color} mt-1 text-sm font-light`}>{current.subtitle}</p>
        </div>

        {typeof progress === "number" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <span className="text-sm font-medium">{progress}% Complete</span>
            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * ProjectShell - Main Component
 */
export function ProjectShell() {
  const mode = useProjectStore((state) => state.mode);
  const { completeness } = usePresalesStore();

  // Calculate progress for Capture mode
  const captureProgress = mode === "capture" ? safePercentage(completeness.score, 100) : undefined;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Mode indicator (contextual hero banner) */}
      <ModeIndicator mode={mode} progress={captureProgress} />

      {/* Mode-specific view (animated transitions) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 overflow-hidden"
        >
          {mode === "capture" && <CaptureMode />}
          {mode === "decide" && <DecideMode />}
          {mode === "plan" && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-light mb-2">Plan Mode</h2>
                <p className="text-sm">Timeline view coming soon...</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}