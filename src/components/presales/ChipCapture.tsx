// Enhanced ChipCapture Component with Completeness Validation
"use client";

import { CompletenessBar, CompletenessRing } from "@/components/presales/CompletenessRing";
import GapCards from "@/components/presales/GapCards";
import CriticalGapsAlert from "@/components/presales/CriticalGapsAlert";
import {
  parseRFPTextEnhanced,
  identifyCriticalGaps,
  calculateComplexityMultiplier,
} from "@/lib/enhanced-chip-parser";
import { usePresalesStore } from "@/stores/presales-store";
import { useProjectStore } from "@/stores/project-store";
import { Chip, ChipType, ChipSource } from "@/types/core";
import React, { useEffect, useState, useMemo } from "react";

interface ChipCaptureProps {
  className?: string;
}

export function ChipCapture({ className = "" }: ChipCaptureProps) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [complexityMultiplier, setComplexityMultiplier] = useState<number>(1.0);

  // Store state
  const {
    chips,
    completeness,
    suggestions,
    addChips,
    clearChips,
    removeChip,
    calculateCompleteness,
    handleGapFix,
    recordMetric,
  } = usePresalesStore();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    // Trigger initial completeness calculation
    calculateCompleteness();
  }, [calculateCompleteness]);

  // Process RFP text input
  const handleProcessText = async () => {
    if (!inputText.trim()) return;

    // SECURITY: Validate input length to prevent DoS
    const MAX_INPUT_LENGTH = 50000; // ~50KB text
    if (inputText.length > MAX_INPUT_LENGTH) {
      alert(`Input too large. Maximum ${MAX_INPUT_LENGTH.toLocaleString()} characters allowed.`);
      return;
    }

    setIsProcessing(true);
    recordMetric("click");

    // SECURITY: Timeout for processing to prevent ReDoS
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      alert("Processing timeout. Please try with smaller input or contact support.");
    }, 5000); // 5 second timeout

    try {
      // Use enhanced parser to extract chips including critical patterns
      const extractedChips = parseRFPTextEnhanced(inputText);
      clearTimeout(timeoutId);
      console.log("Enhanced chips extracted:", extractedChips);

      // Calculate complexity multiplier from critical factors
      const multiplier = calculateComplexityMultiplier(extractedChips);
      setComplexityMultiplier(multiplier);
      console.log("Complexity multiplier:", multiplier);

      // Convert enhanced chips to store format
      const storeChips: Chip[] = extractedChips.map((chip) => ({
        id: chip.id,
        type: chip.type as ChipType,
        value: String(chip.value),
        confidence: chip.confidence,
        source: "paste" as ChipSource,
        metadata: {
          evidence: { snippet: chip.evidence || "" },
          ...chip.metadata,
        },
        timestamp: chip.timestamp || new Date(),
      }));

      if (storeChips.length > 0) {
        addChips(storeChips);
        setInputText(""); // Clear input after successful processing
      } else {
        console.log("No chips extracted from:", inputText);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Failed to process RFP text:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    clearChips();
    setInputText("");
    recordMetric("click");
  };

  const handleProceedWithDefaults = () => {
    const defaultChips: Chip[] = [];

    if (!chips.some((c) => c.type === "LEGAL_ENTITIES")) {
      defaultChips.push({
        id: `default_${Date.now()}_1`,
        type: "LEGAL_ENTITIES",
        value: "1",
        confidence: 0.5,
        source: "default" as ChipSource,
        metadata: {
          note: "Default assumption - single entity",
          estimated: true,
        },
        timestamp: new Date(),
      });
    }

    if (!chips.some((c) => c.type === "LOCATIONS")) {
      defaultChips.push({
        id: `default_${Date.now()}_2`,
        type: "LOCATIONS",
        value: "1",
        confidence: 0.5,
        source: "default" as ChipSource,
        metadata: {
          note: "Default assumption - single location",
          estimated: true,
        },
        timestamp: new Date(),
      });
    }

    if (defaultChips.length > 0) {
      addChips(defaultChips);
    }

    setTimeout(() => {
      window.location.href = "/presales?mode=decide";
    }, 100);
  };

  const handleRemoveChip = (chipId: string) => {
    removeChip(chipId);
    recordMetric("click");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleProcessText();
    }
    recordMetric("keystroke");
  };

  if (!mounted) {
    return <div className="animate-pulse bg-gray-100 h-64 rounded-lg" />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Completeness Ring */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Requirements Capture</h3>
          <p className="text-sm text-gray-600">
            Extract information from RFP or requirements document
          </p>
        </div>
        <CompletenessRing score={completeness?.score || 0} size="md" />
      </div>

      {/* Completeness Progress Bar */}
      <CompletenessBar score={completeness?.score || 0} />

      {/* Input Section */}
      <div className="space-y-4">
        <label htmlFor="rfp-text" className="block text-sm font-medium text-gray-700">
          Paste RFP Text or Requirements
        </label>

        <textarea
          id="rfp-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your RFP text here. For example:&#10;&#10;Malaysia manufacturing company with 500 employees and MYR 200M annual revenue.&#10;Need Finance, HR and Supply Chain modules.&#10;Go-live targeted for Q2 2024.&#10;Must integrate with Salesforce CRM.&#10;Require e-invoice compliance for LHDN."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          disabled={isProcessing}
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Press Ctrl+Enter to process text</p>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              disabled={chips.length === 0}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Clear All
            </button>
            <button
              onClick={handleProcessText}
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2 gradient-blue text-white text-sm font-medium rounded-lg hover-lift disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? "Processing..." : "Extract Requirements"}
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 card-shadow animate-fade-in">
          <h4 className="font-medium text-blue-900 mb-2">Suggestions</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-700">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Critical Gaps Alert - THIS ACTUALLY MATTERS */}
      <CriticalGapsAlert />

      {/* Complexity Analysis - Based on Real Factors */}
      {complexityMultiplier > 1.0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 mb-4">Complexity Impact Analysis</h4>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-amber-600 text-sm">Total Complexity Multiplier:</span>
              <span
                className={`ml-2 text-2xl font-bold ${
                  complexityMultiplier >= 3.0
                    ? "text-red-600"
                    : complexityMultiplier >= 2.0
                      ? "text-orange-600"
                      : complexityMultiplier >= 1.5
                        ? "text-yellow-600"
                        : "text-green-600"
                }`}
              >
                {complexityMultiplier.toFixed(2)}x
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Base effort will be multiplied by this factor</p>
              <p className="text-xs text-gray-500">
                Based on legal entities, locations, data volumes, etc.
              </p>
            </div>
          </div>

          {/* Show what's driving the complexity */}
          <div className="mt-4 pt-3 border-t border-amber-200">
            <p className="text-xs font-medium text-amber-800 mb-2">Key Complexity Drivers:</p>
            <div className="flex flex-wrap gap-2">
              {chips
                .filter((c) => c.metadata?.multiplier && c.metadata.multiplier > 1.0)
                .map((chip) => (
                  <span
                    key={chip.id}
                    className="text-xs bg-white px-2 py-1 rounded border border-amber-300"
                  >
                    {chip.type}: {chip.value} ({(chip.metadata?.multiplier || 1).toFixed(1)}x)
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Extracted Chips */}
      {chips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Extracted Information</h4>
            <span className="text-sm text-gray-500">
              {chips.length} item{chips.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-2 animate-slide-up">
            {chips.map((chip) => (
              <ChipDisplay
                key={chip.id || `chip-${chip.type}-${chip.value}`}
                chip={chip}
                onRemove={() => handleRemoveChip(chip.id!)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gap Cards */}
      <GapCards gaps={completeness?.gaps || []} onFixAction={handleGapFix} />

      {/* Completeness Summary */}
      {(completeness?.score || 0) > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Completeness Summary</h4>
            <span
              className={`text-sm font-medium ${
                completeness?.canProceed ? "text-green-600" : "text-gray-600"
              }`}
            >
              {completeness?.canProceed ? "Ready to proceed" : "Needs attention"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Score</div>
              <div className="font-medium">{completeness?.score || 0}%</div>
            </div>
            <div>
              <div className="text-gray-500">Missing</div>
              <div className="font-medium">{(completeness?.gaps || []).length}</div>
            </div>
            <div>
              <div className="text-gray-500">Blockers</div>
              <div className="font-medium text-red-600">
                {(completeness?.blockers || []).length}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Action Buttons - Proceed to Timeline */}
      {(completeness?.score || 0) > 0 && (
        <div className="pt-4 border-t border-gray-200 space-y-4">
          {/* Primary Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {/* Option A: Proceed with Defaults */}
            <button
              onClick={() => {
                const setMode = useProjectStore.getState().setMode;
                // Apply smart defaults for missing critical factors
                const defaultChips: Chip[] = [];

                if (!chips.some((c) => c.type === "LEGAL_ENTITIES")) {
                  defaultChips.push({
                    id: `default_${Date.now()}_1`,
                    type: "LEGAL_ENTITIES" as ChipType,
                    value: "1",
                    confidence: 0.5,
                    source: "default" as ChipSource,
                    metadata: {
                      note: "Default assumption - single entity",
                      estimated: true,
                    },
                    timestamp: new Date(),
                  });
                }

                if (!chips.some((c) => c.type === "LOCATIONS")) {
                  defaultChips.push({
                    id: `default_${Date.now()}_2`,
                    type: "LOCATIONS" as ChipType,
                    value: "1",
                    confidence: 0.5,
                    source: "default" as ChipSource,
                    metadata: {
                      note: "Default assumption - single location",
                      estimated: true,
                    },
                    timestamp: new Date(),
                  });
                }

                if (!chips.some((c) => c.type === "DATA_VOLUME")) {
                  defaultChips.push({
                    id: `default_${Date.now()}_3`,
                    type: "DATA_VOLUME" as ChipType,
                    value: "1000",
                    confidence: 0.4,
                    source: "default" as ChipSource,
                    metadata: {
                      note: "Default assumption - 1000 transactions/day",
                      estimated: true,
                      unit: "transactions/day",
                    },
                    timestamp: new Date(),
                  });
                }

                if (defaultChips.length > 0) {
                  addChips(defaultChips);
                }
                setMode("decide");
              }}
              disabled={(completeness?.score || 0) < 50}
              className="py-3 px-4 rounded-lg font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="text-sm">Proceed with Defaults</div>
              <div className="text-xs text-gray-500 mt-1">Assumes single entity/location</div>
            </button>

            {/* Option B: Go to Decisions (Full Data) */}
            <button
              onClick={() => {
                const setMode = useProjectStore.getState().setMode;
                setMode("decide");
              }}
              disabled={!completeness?.canProceed}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                completeness?.canProceed
                  ? "gradient-blue text-white hover-lift"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <div className="text-sm">Continue to Decisions →</div>
              <div className="text-xs mt-1">
                {completeness?.canProceed
                  ? "Ready with complete data"
                  : `Need ${Math.max(0, 65 - (completeness?.score || 0))}% more`}
              </div>
            </button>
          </div>

          {/* Blockers Display */}
          {!completeness?.canProceed && (completeness?.blockers || []).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-900 mb-1">
                Why &quot;Generate Timeline&quot; is disabled:
              </div>
              <ul className="text-sm text-amber-700 space-y-1">
                {(completeness?.blockers || []).map((blocker, idx) => (
                  <li key={idx}>• {blocker}</li>
                ))}
              </ul>
              <div className="text-xs text-amber-600 mt-2">
                Use &quot;Proceed with Defaults&quot; to continue with assumptions, or add missing
                info above.
              </div>
            </div>
          )}

          {/* Success Message */}
          {completeness?.canProceed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                All critical requirements captured. Ready to generate accurate timeline.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual chip display component
interface ChipDisplayProps {
  chip: Chip;
  onRemove: () => void;
}

const ChipDisplay = ({ chip, onRemove }: ChipDisplayProps) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg card-shadow hover-lift">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {(chip as any).kind || chip.type}:
        </span>
        <span className="text-sm text-gray-600">{(chip as any).raw || chip.value}</span>
      </div>
      <button onClick={onRemove} className="text-gray-400 hover:text-red-600 transition-colors">
        ×
      </button>
    </div>
  );
};

export default ChipCapture;
