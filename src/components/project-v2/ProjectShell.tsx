"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useProjectStore } from "@/stores/project-store";
import { ModeIndicator } from "./shared/ModeIndicator";
import { CaptureMode } from "./modes/CaptureMode";
import { DecideMode } from "./modes/DecideMode";
import { PlanMode } from "./modes/PlanMode";
import { PresentMode } from "./modes/PresentMode";
import { usePresalesStore } from "@/stores/presales-store";
import { safePercentage } from "@/lib/utils";

/**
 * ProjectShell - Main orchestrator for the project workflow
 *
 * Handles:
 * - Mode switching with smooth animations
 * - Progress tracking across modes
 * - Present mode full-screen takeover
 *
 * Modes:
 * - capture: Extract requirements from RFPs
 * - decide: Make key project decisions
 * - plan: Create and adjust timeline
 * - present: Client-ready presentation view
 */
export function ProjectShell() {
  const mode = useProjectStore((state) => state.mode);
  const { completeness } = usePresalesStore();

  // Calculate progress for Capture mode
  const captureProgress = mode === "capture" ? safePercentage(completeness.score, 100) : undefined;

  // Present mode = full takeover (no chrome)
  if (mode === "present") {
    return <PresentMode />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Mode indicator (contextual hero banner) */}
      <ModeIndicator mode={mode} progress={captureProgress} showProgress={mode === "capture"} />

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
          {mode === "plan" && <PlanMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
