"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useOnboarding } from "./OnboardingProvider";
import { useProjectStore } from "@/stores/project-store";
import { Button } from "@/components/common/Button";

export function OnboardingTour() {
  const { isActive, currentStep, totalSteps, currentStepData, nextStep, prevStep, skipOnboarding } = useOnboarding();
  const { mode, setMode } = useProjectStore();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Switch mode when step requires a different mode
  useEffect(() => {
    if (currentStepData?.mode && mode !== currentStepData.mode) {
      setMode(currentStepData.mode);
    }
  }, [currentStepData?.mode, mode, setMode]);

  // Calculate target element position and tooltip placement
  useEffect(() => {
    if (!currentStepData?.target) {
      setTargetRect(null);
      setTooltipStyle({});
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(currentStepData.target!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position based on desired position
        const position = currentStepData.position || "bottom";
        const offset = 20; // Distance from target element
        const tooltipWidth = 400;
        const tooltipHeight = 200;

        let style: React.CSSProperties = {
          position: "fixed",
          zIndex: 10000,
        };

        switch (position) {
          case "top":
            style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
            style.bottom = window.innerHeight - rect.top + offset;
            break;
          case "bottom":
            style.left = rect.left + rect.width / 2 - tooltipWidth / 2;
            style.top = rect.bottom + offset;
            break;
          case "left":
            style.right = window.innerWidth - rect.left + offset;
            style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "right":
            style.left = rect.right + offset;
            style.top = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "center":
          default:
            style.left = window.innerWidth / 2 - tooltipWidth / 2;
            style.top = window.innerHeight / 2 - tooltipHeight / 2;
            break;
        }

        setTooltipStyle(style);
      }
    };

    updatePosition();

    // Update on resize or scroll
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStepData]);

  if (!isActive || !currentStepData) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      {/* Backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        onClick={skipOnboarding}
      />

      {/* Target element highlight */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[9999] "
          style={{
            left: targetRect.left - 8,
            top: targetRect.top - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: "12px",
            boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)",
            border: "2px solid rgb(59, 130, 246)",
          }}
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            ...tooltipStyle,
            maxWidth: "450px",
            width: currentStepData.position === "center" ? "90vw" : "400px",
            maxHeight: currentStepData.position === "center" ? "auto" : "200px",
          }}
          className="z-[10000] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {currentStepData.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Step {currentStep + 1} of {totalSteps}
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-blue-600 dark:bg-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={skipOnboarding}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Skip tour"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center justify-between gap-4">
            <button
              onClick={skipOnboarding}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Skip tour
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={nextStep}
                rightIcon={currentStep < totalSteps - 1 ? <ChevronRight className="w-4 h-4" /> : undefined}
                className="min-w-[100px]"
              >
                {currentStep < totalSteps - 1 ? "Next" : "Finish"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
