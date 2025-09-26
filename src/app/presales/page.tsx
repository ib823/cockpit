'use client';

import { useState } from 'react';
import { usePresalesStore } from '@/stores/presales-store';

export default function PresalesPage() {
  const [rfpText, setRfpText] = useState('');
  const { chips, addChip, clearChips } = usePresalesStore();
  
  const handleExtract = () => {
    // Your chip extraction logic here
    // For now, just a dummy example
    if (rfpText.includes('Malaysia')) {
      addChip({
        id: Date.now().toString(),
        type: 'country',
        value: 'Malaysia',
        confidence: 0.9,
        evidence: { snippet: rfpText.slice(0, 50) },
        source: 'manual'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">SAP Presales Engine</h1>
          
          {/* Workflow Steps */}
          <div className="flex gap-2 mt-4">
            {['Capture', 'Decide', 'Plan', 'Review', 'Present'].map((step, i) => (
              <button
                key={step}
                className={`px-4 py-2 rounded ${
                  i === 0 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Paste or type RFP content</h2>
            <textarea
              className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste RFP text here..."
              value={rfpText}
              onChange={(e) => setRfpText(e.target.value)}
            />
            <button
              onClick={handleExtract}
              className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Extract Chips
            </button>
          </div>

          {/* Extracted Chips Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Extracted Chips ({chips.length})
              </h2>
              {chips.length > 0 && (
                <button
                  onClick={clearChips}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {chips.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No chips extracted yet. Paste RFP content and click Extract.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {chips.map((chip) => (
                  <div
                    key={chip.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {chip.type}
                      </span>
                      <span className="text-sm">{chip.value}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.round((chip.confidence || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Auto-transit when ready</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
