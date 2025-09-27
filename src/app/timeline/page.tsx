'use client';

import { PrimaryButton } from '@/components/shared/buttons/PrimaryButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ChipInputSchema, sanitizeInput } from '@/core/security/validation';
import { usePresalesStore } from '@/stores/presales-store';
import { useState } from 'react';

export default function PresalesPage() {
  const [rfpText, setRfpText] = useState('');
  const { chips, addChip, clearChips } = usePresalesStore();
  
  const handleExtract = () => {
    const cleanText = sanitizeInput(rfpText);
    
    if (cleanText.includes('Malaysia')) {
      const chipData = {
        value: 'Malaysia',
        type: 'country' as const,
        confidence: 0.9
      };
      
      const validatedChip = ChipInputSchema.parse(chipData);
      
      addChip({
        id: Date.now().toString(),
        type: validatedChip.type,
        value: validatedChip.value,
        confidence: validatedChip.confidence,
        metadata: { evidence: { snippet: cleanText.slice(0, 50) } },
        source: 'manual',
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-light text-gray-900">Presales Engine</h1>
          <p className="text-gray-600 mt-1">Extract insights from RFP documents</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Input Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                RFP Content
              </label>
              <textarea
                className="w-full h-80 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Paste your RFP content here..."
                value={rfpText}
                onChange={(e) => setRfpText(e.target.value)}
                maxLength={10000}
              />
            </div>
            <PrimaryButton
              onClick={handleExtract}
              disabled={!rfpText.trim()}
              className="w-full"
            >
              Extract Insights
            </PrimaryButton>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">
                Insights ({chips.length})
              </h2>
              {chips.length > 0 && (
                <PrimaryButton
                  onClick={clearChips}
                  variant="secondary"
                  className="text-sm px-4 py-2"
                >
                  Clear
                </PrimaryButton>
              )}
            </div>
            
            {chips.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Ready to analyze"
                description="Paste RFP content to extract key insights and requirements."
              />
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {chips.map((chip) => (
                  <div
                    key={chip.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {chip.type}
                        </span>
                        <span className="text-sm font-medium">{chip.value}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round((chip.confidence || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}