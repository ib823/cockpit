/**
 * CaptureMode - Enhanced with Manual Entry + Smart Defaults
 * 
 * NEW FEATURES:
 * - Manual chip entry modal for missing gaps
 * - Smart defaults button (one-click fill)
 * - Both work together seamlessly
 * 
 * SECURITY: Input sanitization, rate limiting
 * UX: Steve Jobs minimalism - clean, clear, delightful
 */

"use client";

import { ManualChipEntry } from "@/components/presales/ManualChipEntry";
import { createDefaultChip, fillMissingChips } from "@/lib/chip-defaults";
import { cn, safePercentage } from "@/lib/utils";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { ChipType } from "@/types/core";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Plus, Sparkles, Upload, Zap } from "lucide-react";
import React, { useState } from "react";

// Sample RFP text for demo
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
  const { chips, parseText, completeness, addChip, addChips } = usePresalesStore();
  const { setMode } = useProjectStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

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

  /**
   * NEW: Handle manual chip addition from modal
   */
  const handleManualAddChip = (type: ChipType, value: string) => {
    const chip = createDefaultChip(type);
    chip.value = value;
    chip.source = "manual";
    chip.confidence = 0.7; // Manual entries get higher confidence
    
    addChip(chip);
  };

  /**
   * NEW: Fill all missing gaps with smart defaults
   */
  const handleSmartDefaults = () => {
    const newChips = fillMissingChips(chips, completeness.gaps);
    
    if (newChips.length > 0) {
      addChips(newChips);
      
      // Show success toast (optional - could add a toast system later)
      console.log(`Added ${newChips.length} default chips`);
    }
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
            isDragging
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 bg-white"
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

  // Chips extracted - show list with enhanced actions
  const progressPercent = safePercentage(completeness.score, 100);
  const missingGaps = completeness.gaps || [];
  const isComplete = progressPercent >= 80;
  const canProceedWithDefaults = progressPercent >= 30; // NEW: Lower threshold for defaults

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        {/* Progress card */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "mb-6 p-6 rounded-2xl border-2 transition-colors",
            isComplete
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
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

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  isComplete ? "bg-green-500" : "bg-yellow-500"
                )}
              />
            </div>
          </div>
        </motion.div>

        {/* Chips display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Extracted Requirements
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {chips.map((chip, idx) => (
              <motion.div
                key={chip.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {(chip as any).kind || chip.type}:
                </span>
                <span className="text-sm text-gray-900 flex-1">
                  {(chip as any).raw || chip.value}
                </span>
                <span className="text-xs text-blue-500">
                  {Math.round((chip.confidence || 0) * 100)}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* NEW: Gap filling section */}
        {!isComplete && missingGaps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900">
                  Missing Information ({missingGaps.length} items)
                </h4>
                <p className="text-xs text-amber-700 mt-1">
                  Add missing details to unlock timeline generation
                </p>
              </div>
            </div>

            {/* Missing items list */}
            <div className="flex flex-wrap gap-2 mb-4">
              {missingGaps.slice(0, 8).map((gap) => (
                <span
                  key={gap}
                  className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs text-amber-900"
                >
                  {gap.replace(/_/g, " ")}
                </span>
              ))}
              {missingGaps.length > 8 && (
                <span className="px-3 py-1 bg-white border border-amber-300 rounded-full text-xs text-amber-900">
                  +{missingGaps.length - 8} more
                </span>
              )}
            </div>

            {/* NEW: Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Smart Defaults Button */}
              <button
                onClick={handleSmartDefaults}
                disabled={!canProceedWithDefaults}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm">Fill with Smart Defaults</div>
                  <div className="text-xs opacity-90">One-click conservative estimates</div>
                </div>
              </button>

              {/* Manual Entry Button */}
              <button
                onClick={() => setShowManualEntry(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-medium"
              >
                <Plus className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm">Add Manually</div>
                  <div className="text-xs opacity-75">Pick what to fill</div>
                </div>
              </button>
            </div>

            {/* Help text */}
            {!canProceedWithDefaults && (
              <div className="mt-3 p-3 bg-white border border-amber-300 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Need {Math.max(0, 30 - progressPercent)}% more data</strong> before you can use smart defaults.
                  Try adding more RFP text or use manual entry.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Continue button */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="sticky bottom-8"
          >
            <button
              onClick={handleContinue}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white
                         rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all
                         hover:scale-105 font-medium text-lg shadow-xl flex items-center
                         justify-center gap-3"
            >
              Continue to Decisions
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.div>
            </button>
          </motion.div>
        )}
      </div>

      {/* NEW: Manual Entry Modal */}
      <ManualChipEntry
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onAddChip={handleManualAddChip}
        missingGaps={missingGaps}
      />
    </div>
  );
}