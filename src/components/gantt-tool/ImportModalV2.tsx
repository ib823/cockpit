/**
 * Import Modal V2 - Two-Stage Import with Mobile-Responsive Design
 *
 * Stage 1: Schedule Data (Phase | Task | Start Date | End Date)
 * Stage 2: Resource Data (Role | Designation | W1 | W2 | W3 | ...) - OPTIONAL
 *
 * Features:
 * - Mobile-responsive (320px to 4K)
 * - Real-time validation
 * - Error highlighting
 * - Touch-friendly
 * - Progress indicators
 */

'use client';

import { useState } from 'react';
import {
  X,
  Download,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';
import { parseScheduleData, type ParsedSchedule, type ScheduleParseResult } from '@/lib/gantt-tool/schedule-parser';
import { parseResourceData, type ParsedResources, type ResourceParseResult } from '@/lib/gantt-tool/resource-parser';
import { generateScheduleTemplate, generateResourceTemplate } from '@/lib/gantt-tool/template-generator-v2';
import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';

interface ImportModalV2Props {
  onClose: () => void;
}

type Stage = 'schedule' | 'resources' | 'review';

export function ImportModalV2({ onClose }: ImportModalV2Props) {
  const { createProject, addPhase, addTask, addResource } = useGanttToolStoreV2();

  // Stage management
  const [currentStage, setCurrentStage] = useState<Stage>('schedule');

  // Stage 1: Schedule
  const [scheduleData, setScheduleData] = useState('');
  const [scheduleResult, setScheduleResult] = useState<ScheduleParseResult | null>(null);
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);

  // Stage 2: Resources (optional)
  const [resourceData, setResourceData] = useState('');
  const [resourceResult, setResourceResult] = useState<ResourceParseResult | null>(null);
  const [parsedResources, setParsedResources] = useState<ParsedResources | null>(null);
  const [skipResources, setSkipResources] = useState(false);

  // Review stage
  const [projectName, setProjectName] = useState(`Imported Project - ${new Date().toLocaleDateString()}`);
  const [isImporting, setIsImporting] = useState(false);

  // Handle schedule parse
  const handleParseSchedule = () => {
    const result = parseScheduleData(scheduleData);
    setScheduleResult(result);

    if (result.success && result.data) {
      setParsedSchedule(result.data);
    }
  };

  // Handle resource parse
  const handleParseResources = () => {
    if (!parsedSchedule) return;

    const result = parseResourceData(resourceData, parsedSchedule);
    setResourceResult(result);

    if (result.success && result.data) {
      setParsedResources(result.data);
    }
  };

  // Handle final import
  const handleImport = async () => {
    if (!parsedSchedule) return;

    setIsImporting(true);
    try {
      // Step 1: Create new project
      createProject(projectName, parsedSchedule.projectStartDate);

      // Step 2: Add all phases
      const phaseIdMap = new Map<string, string>();
      for (const phase of parsedSchedule.phases) {
        const phaseId = `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        phaseIdMap.set(phase.name, phaseId);

        addPhase({
          name: phase.name,
          startDate: phase.startDate,
          endDate: phase.endDate,
          description: '',
          color: '#3B82F6', // Default blue
        });
      }

      // Step 3: Add all tasks to their phases
      // Wait a tiny bit for phases to be created
      await new Promise(resolve => setTimeout(resolve, 100));

      for (const phase of parsedSchedule.phases) {
        const phaseId = phaseIdMap.get(phase.name);
        if (!phaseId) continue;

        for (const task of phase.tasks) {
          addTask({
            phaseId,
            name: task.name,
            startDate: task.startDate,
            endDate: task.endDate,
            description: '',
          });
        }
      }

      // Step 4: Add resources if available
      if (parsedResources && !skipResources) {
        for (const resource of parsedResources.resources) {
          addResource({
            name: resource.name,
            category: resource.category,
            designation: resource.designation,
            description: `Imported resource with ${resource.totalDays} total mandays`,
          });
        }
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  // Navigation helpers
  const canProceedToResources = scheduleResult?.success && parsedSchedule;
  const canProceedToReview = canProceedToResources && (skipResources || (resourceResult?.success && parsedResources));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Import Project</h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentStage === 'schedule' && 'Step 1: Import Schedule'}
              {currentStage === 'resources' && 'Step 2: Import Resources (Optional)'}
              {currentStage === 'review' && 'Step 3: Review & Import'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <StageIndicator
              icon={Calendar}
              label="Schedule"
              active={currentStage === 'schedule'}
              completed={!!parsedSchedule}
            />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all duration-300 ${
                  parsedSchedule ? 'bg-blue-600 w-full' : 'bg-gray-300 w-0'
                }`}
              />
            </div>
            <StageIndicator
              icon={Users}
              label="Resources"
              active={currentStage === 'resources'}
              completed={!!parsedResources || skipResources}
            />
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div
                className={`h-full transition-all duration-300 ${
                  (parsedResources || skipResources) ? 'bg-blue-600 w-full' : 'bg-gray-300 w-0'
                }`}
              />
            </div>
            <StageIndicator
              icon={CheckCircle}
              label="Review"
              active={currentStage === 'review'}
              completed={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {currentStage === 'schedule' && (
            <ScheduleStage
              data={scheduleData}
              onDataChange={setScheduleData}
              result={scheduleResult}
              onParse={handleParseSchedule}
              onDownloadTemplate={generateScheduleTemplate}
            />
          )}

          {currentStage === 'resources' && (
            <ResourceStage
              data={resourceData}
              onDataChange={setResourceData}
              result={resourceResult}
              onParse={handleParseResources}
              onDownloadTemplate={generateResourceTemplate}
              onSkip={() => setSkipResources(true)}
              skipped={skipResources}
            />
          )}

          {currentStage === 'review' && parsedSchedule && (
            <ReviewStage
              projectName={projectName}
              onProjectNameChange={setProjectName}
              schedule={parsedSchedule}
              resources={parsedResources}
              skippedResources={skipResources}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (currentStage === 'resources') setCurrentStage('schedule');
                if (currentStage === 'review') setCurrentStage('resources');
              }}
              disabled={currentStage === 'schedule'}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              {currentStage === 'schedule' && (
                <button
                  onClick={() => setCurrentStage('resources')}
                  disabled={!canProceedToResources}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <span>Next: Resources</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStage === 'resources' && (
                <button
                  onClick={() => setCurrentStage('review')}
                  disabled={!canProceedToReview}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <span>Next: Review</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {currentStage === 'review' && (
                <button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Import Project</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stage Indicator Component
function StageIndicator({
  icon: Icon,
  label,
  active,
  completed,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
          completed
            ? 'bg-green-100 text-green-600'
            : active
            ? 'bg-blue-100 text-blue-600 ring-4 ring-blue-100'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <span
        className={`text-xs sm:text-sm font-medium ${
          active ? 'text-blue-600' : completed ? 'text-green-600' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Schedule Stage Component
function ScheduleStage({
  data,
  onDataChange,
  result,
  onParse,
  onDownloadTemplate,
}: {
  data: string;
  onDataChange: (data: string) => void;
  result: ScheduleParseResult | null;
  onParse: () => void;
  onDownloadTemplate: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">How to Import Schedule</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the Excel template</li>
              <li>Fill in your phases, tasks, and dates</li>
              <li>Select all cells (Ctrl+A) and copy (Ctrl+C)</li>
              <li>Paste below (Ctrl+V) and click "Parse Data"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Download Template Button */}
      <button
        onClick={onDownloadTemplate}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
      >
        <Download className="w-5 h-5" />
        <span>Download Schedule Template</span>
      </button>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Schedule Data (TSV format)
        </label>
        <textarea
          value={data}
          onChange={(e) => onDataChange(e.target.value)}
          placeholder="Phase Name&#9;Task Name&#9;Start Date&#9;End Date&#10;Discovery&#9;Requirements Gathering&#9;2026-01-01&#9;2026-01-15"
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
        />
        <p className="mt-2 text-xs text-gray-500">
          {data.split('\n').filter(l => l.trim()).length} lines
        </p>
      </div>

      {/* Parse Button */}
      <button
        onClick={onParse}
        disabled={!data.trim()}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Parse Schedule Data
      </button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.success && result.data ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Successfully Parsed!</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <StatCard label="Phases" value={result.data.phases.length} />
                    <StatCard label="Tasks" value={result.data.totalTasks} />
                    <StatCard label="Start Date" value={result.data.projectStartDate} />
                    <StatCard label="Duration" value={`${result.data.durationDays} days`} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Parsing Errors</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-red-600">... and {result.errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900 mb-2">Warnings</h4>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    {result.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Resource Stage Component (similar structure to ScheduleStage)
function ResourceStage({
  data,
  onDataChange,
  result,
  onParse,
  onDownloadTemplate,
  onSkip,
  skipped,
}: {
  data: string;
  onDataChange: (data: string) => void;
  result: ResourceParseResult | null;
  onParse: () => void;
  onDownloadTemplate: () => void;
  onSkip: () => void;
  skipped: boolean;
}) {
  if (skipped) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Resources Skipped</h3>
        <p className="text-gray-600 text-center mb-6">
          You can add resources later from the project view.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Go back to add resources
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">How to Import Resources (Optional)</h3>
            <p className="text-sm text-blue-800 mb-2">
              Resources are optional. Skip this step if you want to add them manually later.
            </p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Download the Excel template</li>
              <li>Fill in roles, designations, and weekly effort</li>
              <li>Select all cells and copy</li>
              <li>Paste below and click "Parse Resources"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Download className="w-5 h-5" />
          <span>Download Resource Template</span>
        </button>
        <button
          onClick={onSkip}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <span>Skip Resources</span>
        </button>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Resource Data (TSV format)
        </label>
        <textarea
          value={data}
          onChange={(e) => onDataChange(e.target.value)}
          placeholder="Role&#9;Designation&#9;W1&#9;W2&#9;W3&#10;Project Manager&#9;Manager&#9;5&#9;5&#9;5"
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
        />
      </div>

      {/* Parse Button */}
      <button
        onClick={onParse}
        disabled={!data.trim()}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Parse Resource Data
      </button>

      {/* Results (similar to schedule) */}
      {result && (
        <div className="space-y-4">
          {result.success && result.data ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">Successfully Parsed!</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <StatCard label="Resources" value={result.data.resources.length} />
                    <StatCard label="Total Mandays" value={result.data.totalMandays} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">Parsing Errors</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Review Stage Component
function ReviewStage({
  projectName,
  onProjectNameChange,
  schedule,
  resources,
  skippedResources,
}: {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  schedule: ParsedSchedule;
  resources: ParsedResources | null;
  skippedResources: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Review Your Import</h3>
        <p className="text-sm text-blue-800">
          Please review the details below before importing.
        </p>
      </div>

      {/* Project Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Schedule Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Schedule Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Phases" value={schedule.phases.length} />
          <StatCard label="Tasks" value={schedule.totalTasks} />
          <StatCard label="Start Date" value={schedule.projectStartDate} />
          <StatCard label="Duration" value={`${schedule.durationDays} days`} />
        </div>
      </div>

      {/* Resource Summary */}
      {resources && !skippedResources && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Resource Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Resources" value={resources.resources.length} />
            <StatCard label="Total Mandays" value={resources.totalMandays} />
          </div>
        </div>
      )}

      {skippedResources && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-gray-600">Resources skipped - you can add them later</p>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}
