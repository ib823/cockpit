'use client';

import React, { useState, useRef } from 'react';
import { usePresalesStore } from '@/stores/presales-store';
import { identifyGaps } from '@/lib/chip-parser';

export function ChipCapture() {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    chips, 
    addChips, 
    removeChip, 
    validateChip,
    isAutoTransit,
    toggleAutoTransit,
    recordMetric 
  } = usePresalesStore();
  
  const gaps = identifyGaps(chips);
  
  const handleAddChips = () => {
    if (inputText.trim()) {
      addChips(inputText);
      setInputText('');
      recordMetric('click', 'Add chips');
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    recordMetric('click', 'Paste content');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    recordMetric('key', 'Type in capture');
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAddChips();
    }
  };
  
  // Group chips by kind
  const chipsByKind = chips.reduce((acc, chip) => {
    if (!acc[chip.kind]) acc[chip.kind] = [];
    acc[chip.kind].push(chip);
    return acc;
  }, {} as Record<string, typeof chips>);
  
  const chipKindLabels: Record<string, string> = {
    country: '🌍 Location',
    users: '👥 Users',
    employees: '👷 Employees',
    revenue: '💰 Revenue',
    modules: '📦 Modules',
    timeline: '📅 Timeline',
    banking: '🏦 Banking',
    integration: '🔌 Integration',
    compliance: '📋 Compliance',
    industry: '🏭 Industry',
    existing_system: '💻 Systems',
    constraint: '⚠️ Constraints',
    priority: '🎯 Priority',
  };
  
  const chipKindColors: Record<string, string> = {
    country: 'bg-blue-100 text-blue-800 border-blue-200',
    users: 'bg-purple-100 text-purple-800 border-purple-200',
    employees: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    revenue: 'bg-green-100 text-green-800 border-green-200',
    modules: 'bg-orange-100 text-orange-800 border-orange-200',
    timeline: 'bg-pink-100 text-pink-800 border-pink-200',
    banking: 'bg-teal-100 text-teal-800 border-teal-200',
    integration: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    compliance: 'bg-red-100 text-red-800 border-red-200',
    industry: 'bg-amber-100 text-amber-800 border-amber-200',
    existing_system: 'bg-gray-100 text-gray-800 border-gray-200',
    constraint: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    priority: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Capture Information</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAutoTransit}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isAutoTransit
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Auto-transit {isAutoTransit ? 'ON' : 'OFF'}
            </button>
            <span className="text-sm text-gray-500">
              {chips.length} chips captured
            </span>
          </div>
        </div>
        
        {/* Gaps */}
        {gaps.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {gaps.map((gap, index) => (
              <div
                key={index}
                className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700"
              >
                ⚠️ {gap}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-b bg-gray-50">
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste RFP content, meeting notes, or type requirements here...&#10;&#10;Examples:&#10;• Malaysia, 500 users, Finance and HR modules&#10;• Go-live Q2 2024, integrate with Salesforce&#10;• Manufacturing company, $200M revenue"
          className="w-full h-32 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            Ctrl/Cmd + Enter to add chips
          </span>
          <button
            onClick={handleAddChips}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Extract Chips
          </button>
        </div>
      </div>
      
      {/* Chips Display */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(chipsByKind).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <div className="text-sm">
              No chips captured yet. Paste or type information above to get started.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(chipsByKind).map(([kind, kindChips]) => (
              <div key={kind}>
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {chipKindLabels[kind] || kind}
                </div>
                <div className="flex flex-wrap gap-2">
                  {kindChips.map((chip) => (
                    <div
                      key={chip.id}
                      className={`
                        group relative px-3 py-1.5 rounded-full border text-sm
                        ${chipKindColors[kind] || 'bg-gray-100 text-gray-800 border-gray-200'}
                        ${chip.validated ? 'ring-2 ring-green-400' : ''}
                        transition-all hover:shadow-md
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {typeof chip.parsed.value === 'number'
                            ? chip.parsed.value.toLocaleString()
                            : chip.parsed.value}
                        </span>
                        {chip.parsed.unit && (
                          <span className="text-xs opacity-75">
                            {chip.parsed.unit}
                          </span>
                        )}
                        {chip.evidence && (
                          <span
                            className="text-xs opacity-50"
                            title={`Confidence: ${Math.round(chip.evidence.confidence * 100)}%`}
                          >
                            ({Math.round(chip.evidence.confidence * 100)}%)
                          </span>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                        {!chip.validated && (
                          <button
                            onClick={() => {
                              validateChip(chip.id);
                              recordMetric('click', 'Validate chip');
                            }}
                            className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-green-600"
                            title="Validate"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={() => {
                            removeChip(chip.id);
                            recordMetric('click', 'Remove chip');
                          }}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      {chips.length > 0 && gaps.length === 0 && (
        <div className="p-4 border-t bg-green-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">
              ✅ All required information captured
            </div>
            <button
              onClick={() => recordMetric('click', 'Proceed to decisions')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Proceed to Decisions →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
