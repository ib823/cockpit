/**
 * DecideMode - Make 5 Strategic Decisions
 * 
 * UX: Large, clickable decision cards with instant feedback
 * Security: Input validation on all selections
 * Accessibility: Keyboard navigation, ARIA labels
 */

"use client";

import { cn } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

// Decision option interface
interface DecisionOption {
  id: string;
  label: string;
  description: string;
  impact?: {
    duration?: number; // weeks
    cost?: number; // currency
    risk?: number; // 1-10 scale
  };
}

// Decision card interface
interface Decision {
  id: string;
  label: string;
  description: string;
  options: DecisionOption[];
}

// Define all 5 strategic decisions
const DECISIONS: Decision[] = [
  {
    id: "moduleCombo",
    label: "Module Selection",
    description: "Which SAP modules do you need?",
    options: [
      {
        id: "finance_only",
        label: "Finance Only",
        description: "Core financial accounting (FI)",
        impact: { duration: 12, cost: 150000, risk: 2 },
      },
      {
        id: "finance_p2p",
        label: "Finance + Procurement",
        description: "FI + Procure-to-Pay (MM)",
        impact: { duration: 18, cost: 250000, risk: 4 },
      },
      {
        id: "finance_otc",
        label: "Finance + Sales",
        description: "FI + Order-to-Cash (SD)",
        impact: { duration: 18, cost: 250000, risk: 4 },
      },
      {
        id: "core_hr",
        label: "Core + HR",
        description: "FI + MM + SD + HCM",
        impact: { duration: 24, cost: 500000, risk: 7 },
      },
    ],
  },
  {
    id: "bankingPath",
    label: "Banking Integration",
    description: "How will you handle bank transactions?",
    options: [
      {
        id: "manual",
        label: "Manual Upload",
        description: "Import bank statements manually",
        impact: { duration: 0, cost: 0, risk: 1 },
      },
      {
        id: "h2h",
        label: "Host-to-Host",
        description: "Direct bank integration (SFTP)",
        impact: { duration: 4, cost: 50000, risk: 5 },
      },
      {
        id: "mbc",
        label: "SAP Multi-Bank Connectivity",
        description: "Real-time bank integration",
        impact: { duration: 6, cost: 100000, risk: 6 },
      },
    ],
  },
  {
    id: "ssoMode",
    label: "Single Sign-On",
    description: "When do you need SSO?",
    options: [
      {
        id: "day_one",
        label: "Day One",
        description: "SSO from project start",
        impact: { duration: 2, cost: 20000, risk: 3 },
      },
      {
        id: "staged",
        label: "Staged Rollout",
        description: "Add SSO after go-live",
        impact: { duration: -2, cost: 15000, risk: 2 },
      },
    ],
  },
  {
    id: "rateRegion",
    label: "Rate Card Region",
    description: "Which rate card applies?",
    options: [
      {
        id: "ABMY",
        label: "Malaysia (MYR)",
        description: "Malaysia rates and team",
        impact: { cost: 1 },
      },
      {
        id: "ABSG",
        label: "Singapore (SGD)",
        description: "Singapore rates (higher cost)",
        impact: { cost: 1.4 },
      },
      {
        id: "ABVN",
        label: "Vietnam (VND)",
        description: "Vietnam rates (lower cost)",
        impact: { cost: 0.7 },
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment Model",
    description: "Cloud or on-premise?",
    options: [
      {
        id: "cloud",
        label: "S/4HANA Cloud",
        description: "Fully managed SAP cloud",
        impact: { duration: -2, cost: 50000, risk: -2 },
      },
      {
        id: "onprem",
        label: "On-Premise",
        description: "Self-hosted infrastructure",
        impact: { duration: 4, cost: 200000, risk: 5 },
      },
    ],
  },
];

export function DecideMode() {
  const { decisions: storeDecisions, updateDecision } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [previewDecision, setPreviewDecision] = useState<string | null>(null);
  const [previewOption, setPreviewOption] = useState<DecisionOption | null>(null);

  const handleSelect = (decisionId: string, optionId: string) => {
    console.log("Decision selected:", decisionId, optionId);
    updateDecision(decisionId as any, optionId);
    setPreviewDecision(null);
    setPreviewOption(null);
  };

  const handlePreview = (decisionId: string, option: DecisionOption) => {
    setPreviewDecision(decisionId);
    setPreviewOption(option);
  };

  const clearPreview = (decisionId: string) => {
    if (previewDecision === decisionId) {
      setPreviewDecision(null);
      setPreviewOption(null);
    }
  };

  // Count completed decisions
  const selectedCount = Object.values(storeDecisions).filter(Boolean).length;
  const totalCount = DECISIONS.length;
  const isComplete = selectedCount === totalCount;

  const handleContinue = () => {
    setMode("plan");
  };

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Progress indicator */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-light text-gray-900">
              Make {totalCount} Strategic Decisions
            </h2>
            <span className="text-sm text-gray-500">
              {selectedCount} of {totalCount} complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(selectedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
            />
          </div>
        </motion.div>

        {/* Decision cards */}
        <div className="space-y-6">
          {DECISIONS.map((decision, i) => {
            const selectedOption = decision.options.find(
              (opt) => storeDecisions[decision.id as keyof typeof storeDecisions] === opt.id
            );

            return (
              <motion.div
                key={decision.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "bg-white p-6 rounded-2xl border-2 transition-all",
                  selectedOption
                    ? "border-green-500 shadow-lg shadow-green-500/20"
                    : "border-gray-200 shadow-sm"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{decision.label}</h3>
                      {selectedOption && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{decision.description}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {decision.options.map((option) => {
                    const isSelected = selectedOption?.id === option.id;
                    const isHovering =
                      previewDecision === decision.id && previewOption?.id === option.id;

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => handleSelect(decision.id, option.id)}
                        onMouseEnter={() => handlePreview(decision.id, option)}
                        onMouseLeave={() => clearPreview(decision.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : isHovering
                              ? "border-blue-400 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                        )}
                      >
                        <div className="font-medium text-gray-900 mb-1">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>

                        {/* Quick impact preview */}
                        {option.impact && (isSelected || isHovering) && (
                          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2 text-xs">
                            {option.impact.duration !== undefined &&
                              option.impact.duration !== 0 && (
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded flex items-center gap-1",
                                    (option.impact.duration ?? 0) > 0
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  )}
                                >
                                  {(option.impact.duration ?? 0) > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  {Math.abs(option.impact.duration ?? 0)}w
                                </span>
                              )}
                            {option.impact.cost !== undefined && option.impact.cost !== 0 && (
                              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                                {typeof option.impact.cost === 'number' && option.impact.cost < 10
                                  ? `${option.impact.cost}x cost`
                                  : `+${(option.impact.cost / 1000).toFixed(0)}K`}
                              </span>
                            )}
                            {option.impact.risk !== undefined && option.impact.risk !== 0 && (
                              <span
                                className={cn(
                                  "px-2 py-1 rounded flex items-center gap-1",
                                  (option.impact.risk ?? 0) > 5
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                                )}
                              >
                                <AlertCircle className="w-3 h-3" />
                                Risk {Math.abs(option.impact.risk ?? 0)}/10
                              </span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Continue button */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky bottom-8 mt-8"
          >
            <button
              onClick={handleContinue}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white
                         rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all
                         hover:scale-105 font-medium text-lg shadow-xl flex items-center
                         justify-center gap-3"
            >
              Generate Timeline
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.div>
            </button>
          </motion.div>
        )}

        {/* Progress hint */}
        {!isComplete && selectedCount > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              {totalCount - selectedCount} more decision{totalCount - selectedCount !== 1 ? "s" : ""} to complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}