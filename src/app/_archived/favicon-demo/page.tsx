'use client';

import { useState } from 'react';
import { useFaviconStatus } from '@/hooks/useFaviconStatus';
import type { FaviconStatus } from '@/lib/dynamic-favicon';

export default function FaviconDemoPage() {
  const [status, setStatus] = useState<FaviconStatus>('ready');

  useFaviconStatus(status);

  const statusOptions: Array<{ value: FaviconStatus; label: string; description: string }> = [
    { value: 'ready', label: 'Ready (Logged On)', description: 'Blue - System ready, user logged in' },
    { value: 'success', label: 'Success', description: 'Green - Generic good status' },
    { value: 'error', label: 'Error', description: 'Red - Error state' },
    { value: 'warning', label: 'Warning', description: 'Amber - Warning or needs attention' },
    { value: 'not-logged-in', label: 'Not Logged In', description: 'Amber - User not authenticated' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Dynamic Favicon Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Look at your browser tab to see the favicon change color based on the status
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select a status:
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    status === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        option.value === 'ready'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : option.value === 'success'
                          ? 'bg-gradient-to-br from-green-500 to-green-600'
                          : option.value === 'error'
                          ? 'bg-gradient-to-br from-red-500 to-red-600'
                          : option.value === 'warning'
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600'
                          : 'bg-gradient-to-br from-amber-500 to-amber-600'
                      }`}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {option.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Usage Examples:
            </h3>
            <div className="space-y-3 text-sm font-mono">
              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Auth monitoring:</div>
                <code className="text-gray-900 dark:text-white block">
                  const &#123; isAuthenticated &#125; = useAuth();
                  <br />
                  useFaviconStatus(isAuthenticated ? &apos;ready&apos; : &apos;not-logged-in&apos;);
                </code>
              </div>

              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Error handling:</div>
                <code className="text-gray-900 dark:text-white block">
                  const status = error ? &apos;error&apos; : hasWarning ? &apos;warning&apos; : &apos;success&apos;;
                  <br />
                  useFaviconStatus(status);
                </code>
              </div>

              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Direct API usage:</div>
                <code className="text-gray-900 dark:text-white">
                  setFaviconStatus(&apos;error&apos;);
                </code>
              </div>

              <div>
                <div className="text-gray-600 dark:text-gray-400 mb-1">Animated (optional):</div>
                <code className="text-gray-900 dark:text-white">
                  useFaviconStatus(&apos;warning&apos;, true);
                </code>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Color Guide:</strong> Blue = Ready/Logged In, Green = Success, Red = Error, Amber = Warning/Not Logged In
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
