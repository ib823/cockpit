'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGanttToolStore } from '@/stores/gantt-tool-store';

export default function ImportKPJPage() {
  const [status, setStatus] = useState<'loading' | 'importing' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Loading project data...');
  const router = useRouter();
  const importProject = useGanttToolStore((state) => state.importProject);

  useEffect(() => {
    async function importKPJ() {
      try {
        setStatus('loading');
        setMessage('Fetching KPJ project data...');

        // Fetch the project JSON from public folder
        const response = await fetch('/kpj-project.json');
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }

        const projectData = await response.json();

        setStatus('importing');
        setMessage('Importing project into gantt-tool...');

        // Small delay for UI feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        // Import the project
        importProject(projectData);

        setStatus('success');
        setMessage('Project imported successfully! Redirecting...');

        // Redirect to gantt-tool after 2 seconds
        setTimeout(() => {
          router.push('/gantt-tool');
        }, 2000);

      } catch (error) {
        setStatus('error');
        setMessage(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Import error:', error);
      }
    }

    importKPJ();
  }, [importProject, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              KPJ S/4HANA Implementation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Project Import
            </p>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            )}
            {status === 'importing' && (
              <div className="animate-pulse">
                <svg className="w-16 h-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            )}
            {status === 'success' && (
              <div className="animate-bounce">
                <svg className="w-16 h-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {status === 'error' && (
              <svg className="w-16 h-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          {/* Status Message */}
          <div className="text-center mb-6">
            <p className={`text-lg font-medium ${
              status === 'success' ? 'text-green-600' :
              status === 'error' ? 'text-red-600' :
              'text-gray-700 dark:text-gray-300'
            }`}>
              {message}
            </p>
          </div>

          {/* Project Stats */}
          {status === 'success' && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Phases:</span>
                <span className="font-semibold text-gray-900 dark:text-white">2</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tasks:</span>
                <span className="font-semibold text-gray-900 dark:text-white">10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Resources:</span>
                <span className="font-semibold text-gray-900 dark:text-white">58</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Assignments:</span>
                <span className="font-semibold text-gray-900 dark:text-white">193</span>
              </div>
            </div>
          )}

          {/* Error Actions */}
          {status === 'error' && (
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push('/gantt-tool')}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Go Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
