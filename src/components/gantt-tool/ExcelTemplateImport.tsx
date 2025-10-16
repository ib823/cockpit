/**
 * Excel Template Import Component
 *
 * Allows users to paste Excel data and import into gantt tool
 */

'use client';

import { useState } from 'react';
import { parseExcelTemplate, transformToGanttProject, ParsedExcelData } from '@/lib/gantt-tool/excel-template-parser';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { FileSpreadsheet, Copy, Download, AlertCircle, CheckCircle, Upload } from 'lucide-react';

export function ExcelTemplateImport({ onClose }: { onClose: () => void }) {
  const [pastedData, setPastedData] = useState('');
  const [parsed, setParsed] = useState<ParsedExcelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { createProject } = useGanttToolStoreV2();

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const tsvData = e.clipboardData.getData('text');
    setPastedData(tsvData);

    // Auto-parse on paste
    try {
      const result = parseExcelTemplate(tsvData);
      setParsed(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
      setParsed(null);
    }
  };

  // Handle manual parse
  const handleParse = () => {
    try {
      const result = parseExcelTemplate(pastedData);
      setParsed(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
      setParsed(null);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!parsed) return;

    setIsImporting(true);
    try {
      console.log('[ExcelImport] Starting import...', { tasksCount: parsed.tasks.length, resourcesCount: parsed.resources.length });

      const projectName = `Imported Project - ${new Date().toLocaleDateString()}`;
      const ganttData = transformToGanttProject(parsed, projectName);

      console.log('[ExcelImport] Transformed data:', {
        name: ganttData.name,
        phasesCount: ganttData.phases.length,
        resourcesCount: ganttData.resources.length,
        tasksCount: ganttData.phases.reduce((sum, p) => sum + p.tasks.length, 0),
      });

      // Create project with full structure via API
      console.log('[ExcelImport] Creating project...');
      const response = await fetch('/api/gantt-tool/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ganttData.name,
          description: 'Imported from Excel template',
          startDate: ganttData.startDate,
          viewSettings: ganttData.viewSettings,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ExcelImport] Failed to create project:', errorText);
        throw new Error(`Failed to create project: ${errorText}`);
      }

      const { project } = await response.json();
      console.log('[ExcelImport] Project created:', project.id);

      // Update project with phases, tasks, and resources
      console.log('[ExcelImport] Updating with phases and resources...');
      const updateResponse = await fetch(`/api/gantt-tool/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phases: ganttData.phases,
          resources: ganttData.resources,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('[ExcelImport] Failed to update project:', errorText);
        throw new Error(`Failed to import project data: ${errorText}`);
      }

      console.log('[ExcelImport] Project updated successfully');

      // Refresh projects list and load the new project
      console.log('[ExcelImport] Loading project...');
      const store = useGanttToolStoreV2.getState();
      await store.fetchProjects();
      await store.fetchProject(project.id); // Fetch from API and load

      console.log('[ExcelImport] Import complete!');
      onClose();
    } catch (err) {
      console.error('[ExcelImport] Import failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to import project');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Import from Excel Template</h2>
            <p className="text-sm text-gray-600 mt-1">
              Copy your Excel data (Ctrl+C) and paste it below (Ctrl+V)
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 border-b border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">📋 How to Import:</h3>
        <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
          <li>Open your Excel file with tasks and resources</li>
          <li>Select all data (including headers)</li>
          <li>Copy (Ctrl+C or Cmd+C)</li>
          <li>Click in the box below and paste (Ctrl+V or Cmd+V)</li>
          <li>Review the preview and click "Import Project"</li>
        </ol>

        <button
          onClick={() => {
            // Download template
            const link = document.createElement('a');
            link.href = '/templates/gantt-import-template.xlsx';
            link.download = 'gantt-import-template.xlsx';
            link.click();
          }}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
        >
          <Download className="w-4 h-4" />
          Download Excel Template
        </button>
      </div>

      {/* Paste Area */}
      <div className="flex-1 p-6 overflow-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Excel Data Here:
        </label>
        <textarea
          value={pastedData}
          onChange={(e) => setPastedData(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste your Excel data here... (Ctrl+V)"
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />

        {!parsed && pastedData && (
          <button
            onClick={handleParse}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Parse Data
          </button>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Import Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <p className="text-xs text-red-600 mt-2">
                Make sure you copied the entire table including headers and weekly columns.
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        {parsed && !error && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">Data Parsed Successfully!</h4>
                <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-700">Tasks:</span>
                    <span className="ml-2 font-semibold text-green-900">{parsed.tasks.length}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Resources:</span>
                    <span className="ml-2 font-semibold text-green-900">{parsed.resources.length}</span>
                  </div>
                  <div>
                    <span className="text-green-700">Weeks:</span>
                    <span className="ml-2 font-semibold text-green-900">{parsed.weeklyColumns.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Tasks Preview</h4>
              </div>
              <div className="p-4 max-h-48 overflow-auto">
                <ul className="space-y-2 text-sm">
                  {parsed.tasks.slice(0, 10).map((task, i) => (
                    <li key={i} className={`flex items-center gap-2 ${task.level === 1 ? 'ml-6' : ''}`}>
                      <span className={`font-medium ${task.level === 0 ? 'text-blue-600' : 'text-gray-700'}`}>
                        {task.level === 0 ? '📁' : '📄'} {task.name}
                      </span>
                      <span className="text-gray-500">
                        ({task.startDate} → {task.endDate})
                      </span>
                    </li>
                  ))}
                  {parsed.tasks.length > 10 && (
                    <li className="text-gray-500 italic">
                      ... and {parsed.tasks.length - 10} more tasks
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Resource Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Resources Preview</h4>
              </div>
              <div className="p-4 max-h-48 overflow-auto">
                <ul className="space-y-2 text-sm">
                  {parsed.resources.slice(0, 10).map((res, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">{res.name}</span>
                      <span className="text-gray-500">({res.role})</span>
                      <span className="text-blue-600">
                        {res.weeklyEffort.reduce((sum, we) => sum + we.days, 0)} days total
                      </span>
                    </li>
                  ))}
                  {parsed.resources.length > 10 && (
                    <li className="text-gray-500 italic">
                      ... and {parsed.resources.length - 10} more resources
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={!parsed || isImporting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isImporting ? 'Importing...' : 'Import Project'}
        </button>
      </div>
    </div>
  );
}
