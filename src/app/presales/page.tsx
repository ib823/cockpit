'use client';

import { useState, useEffect } from 'react';
import { ChipCapture } from '@/components/presales/ChipCapture';
import { usePresalesStore } from '@/stores/presales-store';

export default function PresalesPage() {
  const { 
    mode, 
    setMode,
    chips, 
    decisions, 
    scenarios,
    metrics,
    showMetrics,
    toggleMetrics,
    reset,
    exportData,
    importData
  } = usePresalesStore();
  
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presales_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImportSubmit = () => {
    try {
      // Validate JSON
      JSON.parse(importText);
      importData(importText);
      setShowImportModal(false);
      setImportText('');
      alert('Data imported successfully!');
    } catch (error) {
      alert('Invalid JSON format. Please check your data and try again.');
    }
  };
  
  const handleShare = () => {
    const data = exportData();
    const encoded = btoa(data);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Load from hash on mount
  useEffect(() => {
    if (window.location.hash) {
      try {
        const encoded = window.location.hash.slice(1);
        const decoded = atob(encoded);
        usePresalesStore.getState().importData(decoded);
      } catch (error) {
        console.error('Failed to load from URL:', error);
      }
    }
  }, []);
  
  const modes = ['capture', 'decide', 'plan', 'review', 'present'] as const;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Import Data</h2>
              <p className="text-sm text-gray-600 mt-1">
                Paste your exported JSON data below
              </p>
            </div>
            
            <div className="p-4 flex-1 overflow-auto">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste your JSON here... Example:
{
  "version": "1.0",
  "timestamp": "2025-09-22T22:53:23.262Z",
  "chips": [...],
  "decisions": [...],
  "scenarios": [...]
}'
                className="w-full h-96 p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header Bar */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">
                SAP Presales Engine
              </h1>
              
              {/* Mode Indicator - CLICKABLE */}
              <div className="flex items-center gap-1 text-sm">
                {modes.map((m, index) => (
                  <div key={m} className="flex items-center">
                    <button
                      onClick={() => setMode(m)}
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        mode === m 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                    {index < modes.length - 1 && (
                      <span className="text-gray-400 mx-1">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Metrics Toggle */}
              <button
                onClick={toggleMetrics}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  showMetrics ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                📊 Metrics
              </button>
              
              {/* Import - Opens Modal */}
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 transition-colors"
              >
                📥 Import
              </button>
              
              {/* Export */}
              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                💾 Export
              </button>
              
              {/* Share */}
              <button
                onClick={handleShare}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                {copied ? '✓ Copied!' : '🔗 Share'}
              </button>
              
              {/* Reset */}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data?')) {
                    reset();
                  }
                }}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Metrics HUD */}
      {showMetrics && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">Clicks:</span>
              <span className="font-mono">{metrics.clicks}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">Keystrokes:</span>
              <span className="font-mono">{metrics.keystrokes}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">Chips:</span>
              <span className="font-mono">{chips.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600 font-medium">Decisions:</span>
              <span className="font-mono">{decisions.length}</span>
            </div>
            {scenarios.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-purple-600 font-medium">Scenarios:</span>
                <span className="font-mono">{scenarios.length}</span>
              </div>
            )}
            <div className="flex-1 text-right text-purple-600">
              Last: {metrics.lastAction || 'No action yet'}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-sm border h-full min-h-[600px]">
          {mode === 'capture' && <ChipCapture />}
          
          {mode === 'decide' && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h2 className="text-xl font-semibold mb-2">Decision Mode</h2>
              <p className="text-gray-600 mb-4">Decision components coming soon...</p>
              
              {/* Show chip summary */}
              {chips.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left max-w-2xl mx-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    ✅ Successfully captured {chips.length} chips
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click "Capture" above to review your chips, or wait for Decision components to be built.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {mode === 'plan' && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-xl font-semibold mb-2">Planning Mode</h2>
              <p className="text-gray-600">Planning canvas coming soon...</p>
            </div>
          )}
          
          {mode === 'review' && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold mb-2">Review Mode</h2>
              <p className="text-gray-600">Review components coming soon...</p>
            </div>
          )}
          
          {mode === 'present' && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="text-xl font-semibold mb-2">Presentation Mode</h2>
              <p className="text-gray-600">Clean presentation view coming soon...</p>
            </div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <div>
            SAP Implementation Cockpit v0.1.0
          </div>
          <div>
            {mounted ? new Date().toLocaleString() : ''}
          </div>
        </div>
      </footer>
    </div>
  );
}
