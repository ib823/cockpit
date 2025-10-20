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
import { generateCopyPasteTemplate } from '@/lib/gantt-tool/copy-paste-template-generator';

// FIX ISSUE #16: Add file size limits
const MAX_ROWS = 500; // Maximum total rows (tasks + resources)
const MAX_PASTE_SIZE = 1024 * 1024; // 1MB maximum paste size

export function ExcelTemplateImport({ onClose }: { onClose: () => void }) {
  const [pastedData, setPastedData] = useState('');
  const [parsed, setParsed] = useState<ParsedExcelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'new' | 'append'>('new');

  const { currentProject, addPhase, addResource, saveProject } = useGanttToolStoreV2();

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const tsvData = e.clipboardData.getData('text');

    // FIX ISSUE #16: Check paste size before processing
    if (tsvData.length > MAX_PASTE_SIZE) {
      setError(
        `⚠️ Data size too large (${(tsvData.length / 1024).toFixed(0)}KB)\n\n` +
        `Maximum allowed: ${(MAX_PASTE_SIZE / 1024).toFixed(0)}KB\n\n` +
        `Your data is too large to import. Please:\n` +
        `• Reduce the number of rows\n` +
        `• Split into multiple smaller imports\n` +
        `• Remove unnecessary columns\n\n` +
        `If you need to import large datasets, please contact support.`
      );
      setParsed(null);
      return;
    }

    setPastedData(tsvData);

    // Auto-parse on paste
    try {
      const result = parseExcelTemplate(tsvData);

      // FIX ISSUE #16: Check row count after parsing
      const totalRows = result.tasks.length + result.resources.length;
      if (totalRows > MAX_ROWS) {
        setError(
          `⚠️ Too many rows to import (${totalRows} rows)\n\n` +
          `Maximum allowed: ${MAX_ROWS} total rows (tasks + resources)\n\n` +
          `Your import contains:\n` +
          `• ${result.tasks.length} tasks\n` +
          `• ${result.resources.length} resources\n` +
          `• Total: ${totalRows} rows\n\n` +
          `Please split your data into multiple smaller imports or contact support for bulk import assistance.`
        );
        setParsed(null);
        return;
      }

      setParsed(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse data');
      setParsed(null);
    }
  };

  // Handle manual parse
  const handleParse = () => {
    // FIX ISSUE #16: Check paste size before processing
    if (pastedData.length > MAX_PASTE_SIZE) {
      setError(
        `⚠️ Data size too large (${(pastedData.length / 1024).toFixed(0)}KB)\n\n` +
        `Maximum allowed: ${(MAX_PASTE_SIZE / 1024).toFixed(0)}KB\n\n` +
        `Please reduce the amount of data and try again.`
      );
      setParsed(null);
      return;
    }

    try {
      const result = parseExcelTemplate(pastedData);

      // FIX ISSUE #16: Check row count after parsing
      const totalRows = result.tasks.length + result.resources.length;
      if (totalRows > MAX_ROWS) {
        setError(
          `⚠️ Too many rows to import (${totalRows} rows)\n\n` +
          `Maximum allowed: ${MAX_ROWS} total rows\n\n` +
          `Please reduce the number of rows and try again.`
        );
        setParsed(null);
        return;
      }

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
    setError(null);

    try {
      console.log('[ExcelImport] Starting import...', {
        mode: importMode,
        tasksCount: parsed.tasks.length,
        resourcesCount: parsed.resources.length
      });

      const projectName = `Imported Project - ${new Date().toLocaleDateString()}`;
      const ganttData = transformToGanttProject(parsed, projectName);

      console.log('[ExcelImport] Transformed data:', {
        name: ganttData.name,
        phasesCount: ganttData.phases.length,
        resourcesCount: ganttData.resources.length,
        tasksCount: ganttData.phases.reduce((sum, p) => sum + p.tasks.length, 0),
      });

      if (importMode === 'append' && currentProject) {
        // Append to existing project
        console.log('[ExcelImport] Appending to current project:', currentProject.id);

        // Add all resources first (if they don't already exist)
        const existingResourceNames = new Set(currentProject.resources.map(r => r.name));
        for (const resource of ganttData.resources) {
          if (!existingResourceNames.has(resource.name)) {
            addResource({
              name: resource.name as string,
              category: resource.category as any,
              designation: resource.designation as any,
              description: '',
            });
          }
        }

        // Deduplicate phases by name - only add phases that don't already exist
        const existingPhaseNames = new Set(currentProject.phases.map(p => p.name.toLowerCase().trim()));
        const newPhases = ganttData.phases.filter(
          (phase: any) => !existingPhaseNames.has(phase.name.toLowerCase().trim())
        );

        if (newPhases.length === 0) {
          console.warn('[ExcelImport] All phases already exist in the project. Nothing to append.');
          setError('All phases from the import already exist in the current project. No new data was added.');
          setIsImporting(false);
          return;
        }

        console.log('[ExcelImport] Appending', newPhases.length, 'new phases (', ganttData.phases.length - newPhases.length, 'duplicates skipped)');

        // Update the project with new phases and tasks via API
        // This is more reliable than trying to add them one by one through the store
        const payload = {
          phases: [
            ...currentProject.phases,
            ...newPhases,
          ],
        };

        console.log('[ExcelImport] Payload size:', JSON.stringify(payload).length, 'bytes');
        console.log('[ExcelImport] Total phases:', payload.phases.length);

        let response;
        try {
          response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
        } catch (fetchError) {
          console.error('[ExcelImport] Fetch failed:', fetchError);
          throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`);
        }

        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Unable to read error response';
          }
          console.error('[ExcelImport] Failed to append phases:', errorText);
          console.error('[ExcelImport] Response status:', response.status);
          console.error('[ExcelImport] Response headers:', Object.fromEntries(response.headers.entries()));
          throw new Error(`Failed to append data (${response.status}): ${errorText}`);
        }

        console.log('[ExcelImport] Phases appended successfully');

        // Refresh the project from the API
        const store = useGanttToolStoreV2.getState();
        await store.fetchProject(currentProject.id);

        console.log('[ExcelImport] Append complete!');
        onClose();
      } else {
        // Create new project
        console.log('[ExcelImport] Creating new project...');
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
        await store.fetchProject(project.id);

        console.log('[ExcelImport] Import complete!');
        onClose();
      }
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
          <li><strong>Download the template</strong> using the button below</li>
          <li><strong>Open the template</strong> in Excel and fill in your tasks and resources</li>
          <li><strong>Select ALL data</strong> (header + tasks + empty row + resources) and copy (Ctrl+C)</li>
          <li><strong>Paste below</strong> (Ctrl+V) into the text area</li>
          <li><strong>Review the preview</strong> and choose to create new or add to current project</li>
        </ol>
        <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-900">
          <strong>💡 Tip:</strong> The template shows the exact format needed. Keep the weekly date headers (e.g., 2-Feb-26, 9-Feb-26), enter phase names and task names in separate columns (tasks with the same phase name will be grouped together), and use standard designations (Senior Manager, Manager, Senior Consultant, Consultant, Analyst) for resources.
        </div>

        <button
          onClick={async () => {
            try {
              await generateCopyPasteTemplate();
            } catch (err) {
              console.error('Failed to generate template:', err);
              setError('Failed to generate template. Please try again.');
            }
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
        {/* FIX ISSUE #16: Show limits to users */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{pastedData.split('\n').filter(l => l.trim()).length} lines pasted</span>
          <span>Limits: {MAX_ROWS} rows max • {(MAX_PASTE_SIZE / 1024).toFixed(0)}KB max size</span>
        </div>

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

            {/* Import Mode Selection */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-3">Import Mode:</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="new"
                    checked={importMode === 'new'}
                    onChange={(e) => setImportMode('new')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium text-blue-900">Create New Project</span>
                    <p className="text-xs text-blue-700">Import as a brand new project</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 ${currentProject ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode('append')}
                    disabled={!currentProject}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium text-blue-900">Add to Current Project</span>
                    <p className="text-xs text-blue-700">
                      {currentProject
                        ? `Append to "${currentProject.name}"`
                        : 'No project loaded - create or load a project first'}
                    </p>
                  </div>
                </label>
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
                    <li key={i} className="flex items-center gap-2">
                      <span className="font-medium text-blue-600">
                        📁 {task.phaseName}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-700">
                        📄 {task.name}
                      </span>
                      <span className="text-gray-500 text-xs">
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
          disabled={!parsed || isImporting || (importMode === 'append' && !currentProject)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isImporting
            ? importMode === 'append' ? 'Adding...' : 'Importing...'
            : importMode === 'append' ? 'Add to Project' : 'Import Project'}
        </button>
      </div>
    </div>
  );
}
