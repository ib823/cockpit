// Enhanced ChipCapture Component with Completeness Validation
'use client';

import { CompletenessBar, CompletenessRing } from '@/components/presales/CompletenessRing';
import GapCards from '@/components/presales/GapCards';
import { parseRFPText } from '@/lib/chip-parser';
import { usePresalesStore } from '@/stores/presales-store';
import { Chip } from '@/types/core';
import React, { useEffect, useState } from 'react';

interface ChipCaptureProps {
  className?: string;
}

export function ChipCapture({ className = '' }: ChipCaptureProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    recordMetric
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

  setIsProcessing(true);
  recordMetric('click');

  try {
    // Parse the input text to extract chips
    const extractedChips = parseRFPText(inputText);
    console.log('Extracted chips:', extractedChips); // Debug log
    
    if (extractedChips.length > 0) {
      addChips(extractedChips);
      setInputText(''); // Clear input after successful processing
    } else {
      console.log('No chips extracted from:', inputText);
    }
  } catch (error) {
    console.error('Failed to process RFP text:', error);
  } finally {
    setIsProcessing(false);
  }
};

  const handleClearAll = () => {
    clearChips();
    setInputText('');
    recordMetric('click');
  };

  const handleRemoveChip = (chipId: string) => {
    removeChip(chipId);
    recordMetric('click');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleProcessText();
    }
    recordMetric('keystroke');
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
          <p className="text-sm text-gray-600">Extract information from RFP or requirements document</p>
        </div>
        <CompletenessRing score={completeness.score} size="md" />
      </div>

      {/* Completeness Progress Bar */}
      <CompletenessBar score={completeness.score} />

      {/* Input Section */}
      <div className="space-y-3">
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
          <p className="text-xs text-gray-500">
            Press Ctrl+Enter to process text
          </p>
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
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Extract Requirements'}
            </button>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

      {/* Extracted Chips */}
      {chips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Extracted Information</h4>
            <span className="text-sm text-gray-500">{chips.length} item{chips.length !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="grid gap-2">
            {chips.map((chip) => (
              <ChipDisplay
                key={chip.id}
                chip={chip}
                onRemove={() => handleRemoveChip(chip.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gap Cards */}
      <GapCards
        gaps={completeness.gaps}
        onFixAction={handleGapFix}
      />

      {/* Completeness Summary */}
      {completeness.score > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Completeness Summary</h4>
            <span className={`text-sm font-medium ${
              completeness.canProceed ? 'text-green-600' : 'text-gray-600'
            }`}>
              {completeness.canProceed ? 'Ready to proceed' : 'Needs attention'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Score</div>
              <div className="font-medium">{completeness.score}%</div>
            </div>
            <div>
              <div className="text-gray-500">Missing</div>
              <div className="font-medium">{completeness.gaps.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Blockers</div>
              <div className="font-medium text-red-600">{completeness.blockers.length}</div>
            </div>
          </div>
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

const ChipDisplay = ({ chip, onRemove }: { chip: any; onRemove: () => void }) => {
  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {(chip as any).kind || chip.type}:
        </span>
        <span className="text-sm text-gray-600">
          {(chip as any).raw || chip.value}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="text-gray-400 hover:text-red-600"
      >
        ×
      </button>
    </div>
  );
};

export default ChipCapture;