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
import { lazy, Suspense } from "react";
import { CaptureMode } from "./modes/CaptureMode";
import { DecideMode } from "./modes/DecideMode";
import { MiniReferenceBar } from "@/components/timeline/MiniReferenceBar";
import { ReferenceArchitectureModal } from "@/components/timeline/ReferenceArchitectureModal";
import { useReferenceKeyboard } from "@/hooks/useReferenceKeyboard";
import { ResetButton } from "@/components/common/ResetButton";
import { LogoutButton } from "@/components/common/LogoutButton";
import { Heading1, BodyMD } from "@/components/common/Typography";
import { Logo } from "@/components/common/Logo";
import { animation } from "@/lib/design-system";

// Lazy load heavy components for better performance
const PlanMode = lazy(() => import("./modes/PlanMode").then(m => ({ default: m.PlanMode })));
const PresentMode = lazy(() => import("./modes/PresentMode").then(m => ({ default: m.PresentMode })));
const OptimizeMode = lazy(() => import("./modes/OptimizeMode").then(m => ({ default: m.OptimizeMode })));


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
    optimize: {
      title: "Optimize Resources",
      subtitle: "Fine-tune team allocation and deliverables",
      gradient: "from-indigo-600 to-indigo-700",
      color: "text-indigo-100",
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
      transition={{ duration: animation.duration.normal, ease: animation.easing.enter }}
      className={`bg-gradient-to-r ${current.gradient} px-8 py-6 text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo size="sm" theme="dark" showText={false} />
          <div>
            <Heading1 className="text-white">{current.title}</Heading1>
            <BodyMD className={`${current.color} mt-2`}>{current.subtitle}</BodyMD>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {typeof progress === "number" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: animation.duration.normal }}
              className="flex items-center gap-4"
            >
              <span className="text-sm font-semibold">{progress}% Complete</span>
              <div className="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: animation.duration.slow, ease: animation.easing.enter }}
                  className="h-2 bg-white rounded-full"
                />
              </div>
            </motion.div>
          )}
          <LogoutButton />
          <ResetButton />
        </div>
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

  // Enable keyboard shortcuts for SAP Activate Reference
  useReferenceKeyboard();

  // Calculate progress for Capture mode
  const captureProgress = mode === "capture" ? safePercentage(completeness?.score || 0, 100) : undefined;

  // Show MiniReferenceBar in plan and optimize modes
  const showReferenceBar = mode === "plan" || mode === "optimize";

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Mode indicator (contextual hero banner) */}
      <ModeIndicator mode={mode} progress={captureProgress} />

      {/* SAP Activate Reference Bar (sticky header for plan/optimize modes) */}
      {showReferenceBar && <MiniReferenceBar />}

      {/* Mode-specific view (animated transitions) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: animation.duration.normal, ease: animation.easing.standard }}
          className="flex-1 overflow-hidden"
        >
          {mode === "capture" && <CaptureMode />}
          {mode === "decide" && <DecideMode />}
          {mode === "plan" && (
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-sm">Loading timeline...</p>
                </div>
              </div>
            }>
              <PlanMode />
            </Suspense>
          )}
          {mode === "optimize" && (
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-sm">Loading resource optimization...</p>
                </div>
              </div>
            }>
              <OptimizeMode />
            </Suspense>
          )}
          {mode === "present" && (
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-300">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-sm">Loading presentation...</p>
                </div>
              </div>
            }>
              <PresentMode />
            </Suspense>
          )}
        </motion.div>
      </AnimatePresence>

      {/* SAP Activate Reference Modal (global - triggered by keyboard or button) */}
      <ReferenceArchitectureModal />
    </div>
  );
}