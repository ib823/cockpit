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
import { useTimelineStore } from "@/stores/timeline-store";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CaptureMode } from "./modes/CaptureMode";
import { DecideMode } from "./modes/DecideMode";
import { EnterpriseArchitectureModal } from "@/components/timeline/EnterpriseArchitectureModal";
import { ResetButton } from "@/components/common/ResetButton";
import { LogoutButton } from "@/components/common/LogoutButton";
import { Heading1, BodyMD } from "@/components/common/Typography";
import { Logo } from "@/components/common/Logo";
import { animation } from "@/lib/design-system";
import { Sparkles, X, HelpCircle } from "lucide-react";
import { ThemeToggleCompact } from "@/components/theme/ThemeToggle";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";

// Lazy load heavy components for better performance
const PlanMode = lazy(() => import("./modes/PlanMode").then(m => ({ default: m.PlanMode })));
const PresentMode = lazy(() => import("./modes/PresentMode").then(m => ({ default: m.PresentMode })));


/**
 * Mode Indicator - Hero banner for each mode
 */
function ModeIndicator({ mode, progress, onHelpClick }: { mode: string; progress?: number; onHelpClick?: () => void }) {
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
      subtitle: "Timeline, Resources & RICEFW",
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
      transition={{ duration: animation.duration.normal, ease: animation.easing.enter }}
      className={`bg-gradient-to-r ${current.gradient} px-6 py-3 text-white shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Logo size="sm" theme="dark" showText={false} />
          <div>
            <Heading1 className="text-white text-base sm:text-lg md:text-xl">{current.title}</Heading1>
            <BodyMD className={`${current.color} mt-0.5 text-xs hidden sm:block`}>{current.subtitle}</BodyMD>
          </div>
        </div>

        <div className="flex items-start gap-2 sm:gap-4">
          {typeof progress === "number" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: animation.duration.normal }}
              className="hidden lg:flex items-center gap-4 mt-2"
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
          {typeof progress === "number" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: animation.duration.normal }}
              className="lg:hidden text-sm font-semibold mt-2"
            >
              {progress}%
            </motion.div>
          )}
          {onHelpClick && (
            <button
              onClick={onHelpClick}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
              aria-label="Start tour"
              title="Start interactive tour"
            >
              <HelpCircle className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            </button>
          )}
          <ThemeToggleCompact />
          <LogoutButton theme="dark" />
          <ResetButton />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * EstimatorBanner - Shows when user comes from Quick Estimate
 */
function EstimatorBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-white shadow-md relative"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-medium">Timeline from Quick Estimate</p>
            <p className="text-xs text-blue-100">
              Review and refine your estimate • Add details • Export when ready
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * ProjectShell - Main Component
 */
export function ProjectShell() {
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const { completeness } = usePresalesStore();
  const searchParams = useSearchParams();
  const { startOnboarding } = useOnboarding();

  // Check if coming from estimator
  const [showEstimatorBanner, setShowEstimatorBanner] = useState(false);

  useEffect(() => {
    const source = searchParams?.get('source');
    if (source === 'estimator') {
      setShowEstimatorBanner(true);

      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => setShowEstimatorBanner(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Calculate progress for Capture mode
  const captureProgress = mode === "capture" ? safePercentage(completeness?.score || 0, 100) : undefined;

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Mode indicator (contextual hero banner) */}
      <ModeIndicator mode={mode} progress={captureProgress} onHelpClick={startOnboarding} />

      {/* Estimator Banner (shows when source=estimator) */}
      <AnimatePresence>
        {showEstimatorBanner && (
          <EstimatorBanner onDismiss={() => setShowEstimatorBanner(false)} />
        )}
      </AnimatePresence>

      {/* Mode-specific view (animated transitions) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: animation.duration.normal, ease: animation.easing.standard }}
          className="flex-1 overflow-y-auto pb-20 md:pb-0"
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

      {/* Mobile Bottom Navigation (visible on small screens only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="grid grid-cols-5 gap-1 p-2">
          <button
            onClick={() => setMode("capture")}
            className={`flex flex-col items-center justify-center min-h-[56px] rounded-lg transition-all ${
              mode === "capture"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 active:scale-95"
            }`}
          >
            <svg className="w-5 h-5 mb-1 align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium">Capture</span>
          </button>

          <button
            onClick={() => setMode("decide")}
            className={`flex flex-col items-center justify-center min-h-[56px] rounded-lg transition-all ${
              mode === "decide"
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100 active:scale-95"
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs font-medium">Decide</span>
          </button>

          <button
            onClick={() => setMode("plan")}
            className={`flex flex-col items-center justify-center min-h-[56px] rounded-lg transition-all ${
              mode === "plan"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100 active:scale-95"
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium">Plan</span>
          </button>

          <button
            onClick={() => setMode("present")}
            className={`flex flex-col items-center justify-center min-h-[56px] rounded-lg transition-all ${
              mode === "present"
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-100 active:scale-95"
            }`}
          >
            <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Present</span>
          </button>
        </div>
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
}