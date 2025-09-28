'use client';

import { ChipCapture } from '@/components/presales/ChipCapture';
import { DecisionBar } from '@/components/presales/DecisionBar';
import { usePresalesStore } from '@/stores/presales-store';
import Link from 'next/link';

const modes = [
  { label: 'Capture', value: 'capture' },
  { label: 'Decide', value: 'decide' },
  { label: 'Plan', value: 'plan' },
  { label: 'Review', value: 'review' },
  { label: 'Present', value: 'present' },
] as const;

export default function PresalesPage() {
  const {
    chips,
    decisions,
    completeness,
    suggestions,
    mode,
    isAutoTransit,
    metrics,
    setMode,
    toggleAutoTransit,
    reset,
    generateBaseline,
    calculateCompleteness,
    generateTimelineFromPresales,
  } = usePresalesStore();

  const scoreColor = completeness.score >= 80 ? 'bg-green-600' : 
                    completeness.score >= 60 ? 'bg-yellow-500' : 'bg-red-600';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">SAP Presales Engine</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Mode</span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="border rounded-md px-3 py-1.5 text-sm"
              >
                {modes.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleAutoTransit}
              className={`text-sm rounded-md border px-3 py-1.5 ${
                isAutoTransit ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50'
              }`}
            >
              Auto-transit: <span className="font-medium">{isAutoTransit ? 'On' : 'Off'}</span>
            </button>

            <Link
              href="/timeline"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              View Timeline
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Mode-specific content */}
            {mode === 'capture' && (
              <div className="bg-white rounded-lg border p-6">
                <ChipCapture />
              </div>
            )}
            
            {mode === 'decide' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border p-6">
                  <DecisionBar />
                </div>
                
                {/* Actions */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => generateTimelineFromPresales()}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Generate Timeline
                    </button>
                    <button
                      onClick={() => generateBaseline()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      disabled={!completeness.canProceed}
                    >
                      Generate Baseline
                    </button>
                    <button
                      onClick={() => calculateCompleteness()}
                      className="border px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Recalculate
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {mode === 'plan' && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Timeline Generated</h3>
                <p className="text-gray-600 mb-4">
                  Your project timeline has been generated based on the requirements and decisions.
                </p>
                <Link
                  href="/timeline"
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  View Timeline
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Completeness Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Completeness</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Score</span>
                  <span className="font-medium">{completeness.score}%</span>
                </div>
                
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 ${scoreColor} transition-all duration-300`}
                    style={{ width: `${Math.max(0, Math.min(100, completeness.score))}%` }}
                  />
                </div>

                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">Status</div>
                  <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      completeness.canProceed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {completeness.canProceed ? 'Ready to proceed' : 'Needs attention'}
                  </div>
                </div>

                {completeness.gaps.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">Missing</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {completeness.gaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-900 mb-2">Suggestions</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
                      {suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-1 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{chips.length}</div>
                  <div className="text-sm text-gray-600">Requirements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{completeness.score}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(decisions).filter(k => decisions[k as keyof typeof decisions]).length}
                  </div>
                  <div className="text-sm text-gray-600">Decisions</div>
                </div>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Metrics</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex justify-between">
                  <span>Clicks:</span>
                  <span className="font-medium">{metrics.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Keystrokes:</span>
                  <span className="font-medium">{metrics.keystrokes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time (s):</span>
                  <span className="font-medium">{metrics.timeSpent}</span>
                </div>
              </div>
            </div>

            {/* Reset */}
            <button
              onClick={() => reset()}
              className="w-full border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}