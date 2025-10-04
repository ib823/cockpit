"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { EmptyState } from "../shared/EmptyState";
import { SlideOver } from "../shared/SlideOver";
import { StatBadge } from "../shared/StatBadge";
import { cn, formatCurrency, formatDuration } from "@/lib/utils";

interface DecisionOption {
  id: string;
  label: string;
  description: string;
  impact?: {
    duration?: number; // weeks
    cost?: number; // MYR
    risk?: number; // percentage
  };
}

interface Decision {
  id: string;
  label: string;
  description: string;
  options: DecisionOption[];
}

const DECISIONS: Decision[] = [
  {
    id: "moduleCombo",
    label: "Module Selection",
    description: "Which SAP modules do you need?",
    options: [
      {
        id: "finance",
        label: "Finance Only",
        description: "Core financial accounting (FI)",
        impact: { duration: 16, cost: 450000, risk: 5 },
      },
      {
        id: "finance_p2p",
        label: "Finance + Procurement",
        description: "FI + Procure-to-Pay (MM)",
        impact: { duration: 24, cost: 750000, risk: 12 },
      },
      {
        id: "finance_otc",
        label: "Finance + Sales",
        description: "FI + Order-to-Cash (SD)",
        impact: { duration: 24, cost: 780000, risk: 12 },
      },
      {
        id: "core_hcm",
        label: "Core + HR",
        description: "FI + MM + SD + HCM",
        impact: { duration: 36, cost: 1200000, risk: 22 },
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
        impact: { duration: 0, cost: 0, risk: 2 },
      },
      {
        id: "host_to_host",
        label: "Host-to-Host",
        description: "Direct bank integration (SFTP)",
        impact: { duration: 4, cost: 120000, risk: 8 },
      },
      {
        id: "mbc",
        label: "SAP Multi-Bank Connectivity",
        description: "Real-time bank integration",
        impact: { duration: 6, cost: 180000, risk: 10 },
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
        impact: { duration: 2, cost: 80000, risk: 5 },
      },
      {
        id: "staged",
        label: "Staged Rollout",
        description: "Add SSO after go-live",
        impact: { duration: 0, cost: 0, risk: 1 },
      },
    ],
  },
  {
    id: "rateRegion",
    label: "Rate Card Region",
    description: "Which team location?",
    options: [
      {
        id: "MY",
        label: "Malaysia",
        description: "Local team (MYR rates)",
        impact: { duration: 0, cost: 0, risk: 0 },
      },
      {
        id: "SG",
        label: "Singapore",
        description: "Regional team (SGD rates)",
        impact: { duration: 0, cost: 150000, risk: 0 },
      },
      {
        id: "VN",
        label: "Vietnam",
        description: "Offshore team (VND rates)",
        impact: { duration: 2, cost: -200000, risk: 3 },
      },
    ],
  },
  {
    id: "deploymentModel",
    label: "Deployment Model",
    description: "Cloud or on-premise?",
    options: [
      {
        id: "cloud",
        label: "S/4HANA Cloud",
        description: "Fully managed SAP cloud",
        impact: { duration: -2, cost: 50000, risk: -5 },
      },
      {
        id: "onprem",
        label: "On-Premise",
        description: "Self-hosted infrastructure",
        impact: { duration: 4, cost: 200000, risk: 8 },
      },
    ],
  },
];

export function DecideMode() {
  const { decisions: storeDecisions, setDecision } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [previewDecision, setPreviewDecision] = useState<string | null>(null);
  const [previewOption, setPreviewOption] = useState<DecisionOption | null>(null);

  const handleSelect = (decisionId: string, optionId: string) => {
    setDecision(decisionId as any, optionId);
    setPreviewDecision(null);
    setPreviewOption(null);
  };

  const handlePreview = (decisionId: string, option: DecisionOption) => {
    setPreviewDecision(decisionId);
    setPreviewOption(option);
  };

  const selectedCount = Object.values(storeDecisions).filter(Boolean).length;
  const totalCount = DECISIONS.length;
  const isComplete = selectedCount === totalCount;

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
                        onMouseLeave={() => {
                          if (previewDecision === decision.id) {
                            setPreviewDecision(null);
                            setPreviewOption(null);
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
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
                                    "px-2 py-1 rounded",
                                    (option.impact.duration ?? 0) > 0
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  )}
                                >
                                  {(option.impact.duration ?? 0) > 0 ? "+" : ""}
                                  {option.impact.duration}w
                                </span>
                              )}
                            {option.impact.cost !== undefined && option.impact.cost !== 0 && (
                              <span
                                className={cn(
                                  "px-2 py-1 rounded",
                                  (option.impact.cost ?? 0) > 0
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                )}
                              >
                                {(option.impact.cost ?? 0) > 0 ? "+" : ""}
                                {formatCurrency(option.impact.cost ?? 0, "MYR")}
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

        {/* Floating CTA */}
        <AnimatePresence>
          {isComplete && (
            <motion.button
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              onClick={() => setMode("plan")}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600
                         text-white px-8 py-5 rounded-2xl shadow-2xl
                         hover:scale-105 transition-transform"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-semibold">All Decisions Made!</p>
                  <p className="text-sm text-purple-100 mt-0.5">Generate project plan</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Impact preview slide-over */}
        <SlideOver
          open={previewOption !== null}
          onClose={() => {
            setPreviewDecision(null);
            setPreviewOption(null);
          }}
          title="Impact Preview"
          width={400}
        >
          {previewOption?.impact && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{previewOption.label}</h4>
                <p className="text-sm text-gray-600">{previewOption.description}</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Duration Impact</span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-light">
                    {(previewOption.impact.duration ?? 0) > 0 ? "+" : ""}
                    {previewOption.impact.duration ?? 0} weeks
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Cost Impact</span>
                    <DollarSign className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-light">
                    {(previewOption.impact.cost ?? 0) > 0 ? "+" : ""}
                    {formatCurrency(previewOption.impact.cost ?? 0, "MYR")}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Risk Impact</span>
                    <AlertTriangle className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-light">
                    {(previewOption.impact.risk ?? 0) > 0 ? "+" : ""}
                    {previewOption.impact.risk ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </SlideOver>
      </div>
    </div>
  );
}
