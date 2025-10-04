"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { EmptyState } from "../shared/EmptyState";
import { LoadingState } from "../shared/LoadingState";
import { cn, safePercentage } from "@/lib/utils";

const SAMPLE_RFP = `Malaysia manufacturing company with 500 employees and MYR 200M annual revenue.
Need Finance, HR and Supply Chain modules.
Go-live targeted for Q2 2025.
Must integrate with Salesforce CRM.
Require e-invoice compliance for LHDN.
Project start date: 1 January 2025.
Budget allocation: MYR 2.5M for implementation.
Preferred deployment: Cloud-based S/4HANA.
Regional offices in KL, Penang, and JB.
Current ERP: SAP ECC 6.0 with customizations.`;

export function CaptureMode() {
  const { chips, parseText, completeness } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const text = e.dataTransfer.getData("text");
    if (text) {
      setIsExtracting(true);
      // Simulate extraction delay for UX
      await new Promise((resolve) => setTimeout(resolve, 800));
      parseText(text);
      setIsExtracting(false);
    }
  };

  const handlePaste = async () => {
    if (!pasteText.trim()) return;

    setIsExtracting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    parseText(pasteText);
    setPasteText("");
    setIsExtracting(false);
  };

  const loadExample = async () => {
    setIsExtracting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    parseText(SAMPLE_RFP);
    setIsExtracting(false);
  };

  const handleContinue = () => {
    setMode("decide");
  };

  // Loading state
  if (isExtracting) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-16 h-16 text-blue-600" />
            </motion.div>
          </div>
          <h3 className="text-xl font-light text-gray-900">Extracting requirements...</h3>
          <p className="text-sm text-gray-500 mt-2">Analyzing your RFP with AI</p>
        </motion.div>
      </div>
    );
  }

  // Empty state - no chips yet
  if (chips.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center p-8"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "max-w-3xl w-full p-12 rounded-3xl border-2 border-dashed transition-all duration-300",
            isDragging ? "border-blue-500 bg-blue-50 scale-105" : "border-gray-300 bg-white"
          )}
        >
          <div className="text-center">
            <motion.div
              animate={{
                y: isDragging ? -10 : 0,
                scale: isDragging ? 1.1 : 1,
              }}
              transition={{ duration: 0.3 }}
            >
              <Upload
                className={cn(
                  "w-24 h-24 mx-auto transition-colors duration-300",
                  isDragging ? "text-blue-500" : "text-gray-300"
                )}
                strokeWidth={1}
              />
            </motion.div>

            <h2 className="text-3xl font-light text-gray-900 mt-8">Drop your RFP here</h2>
            <p className="text-gray-500 mt-3 text-lg">
              or paste text below to extract requirements automatically
            </p>

            {/* Paste area */}
            <div className="mt-8 space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your RFP text here..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl resize-none
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder:text-gray-400"
              />
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700
                           transition-all disabled:opacity-50 disabled:cursor-not-allowed
                           font-medium"
              >
                Extract Requirements
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Sample button */}
            <button
              onClick={loadExample}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white
                         rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all
                         hover:scale-105 flex items-center gap-2 mx-auto font-medium shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Load Sample RFP
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Chips extracted - show list
  const progressPercent = safePercentage(completeness.score, 100);
  const missingGaps = completeness.gaps || [];
  const isComplete = progressPercent >= 80;

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Progress card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "mb-6 p-6 rounded-2xl border-2 transition-colors",
            isComplete ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isComplete ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              )}
              <div>
                <h3 className="text-lg font-medium">
                  {isComplete ? "Requirements Complete!" : "Almost there..."}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {isComplete
                    ? "All key requirements identified"
                    : `${missingGaps.length} item${missingGaps.length !== 1 ? "s" : ""} missing`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-light">{progressPercent}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {chips.length} requirement{chips.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Missing gaps */}
          {missingGaps.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 pt-4 border-t border-yellow-300"
            >
              <p className="text-sm font-medium text-gray-700 mb-2">Still needed:</p>
              <div className="flex flex-wrap gap-2">
                {missingGaps.map((gap) => (
                  <span
                    key={gap}
                    className="px-3 py-1 bg-white border border-yellow-300 rounded-full text-xs"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Chips list */}
        <div className="space-y-3">
          <AnimatePresence>
            {chips.map((chip, i) => (
              <motion.div
                key={chip.id || i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-all
                           border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                        {chip.type}
                      </span>
                      <div
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          chip.confidence >= 0.8
                            ? "bg-green-500"
                            : chip.confidence >= 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        )}
                      />
                    </div>
                    <p className="text-lg text-gray-900">{chip.value}</p>
                    {chip.source && (
                      <p className="text-xs text-gray-500 mt-2">
                        Source: {chip.source.slice(0, 60)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(chip.confidence * 100)}%
                    </span>
                    <p className="text-xs text-gray-500 mt-1">confident</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Floating CTA */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed bottom-8 right-8 bg-gradient-to-r from-green-600 to-emerald-600
                         text-white px-8 py-5 rounded-2xl shadow-2xl cursor-pointer
                         hover:scale-105 transition-transform"
              onClick={handleContinue}
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="font-semibold">Requirements Complete!</p>
                  <p className="text-sm text-green-100 mt-0.5">Continue to decisions</p>
                </div>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
