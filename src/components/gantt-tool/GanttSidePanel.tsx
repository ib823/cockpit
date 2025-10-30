/**
 * Gantt Tool - Side Panel Component
 *
 * Slide-in panel for adding/editing phases, tasks, milestones, and holidays.
 */

'use client';

import { useGanttToolStoreV2 } from '@/stores/gantt-tool-store-v2';
import { X, AlertTriangle, Calendar as CalendarIcon, Flag as FlagIcon, Users, Plus, Trash2, AlertCircle, Sliders } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { PHASE_COLOR_PRESETS, MILESTONE_COLOR_PRESETS, RESOURCE_CATEGORIES, RESOURCE_DESIGNATIONS } from '@/types/gantt-tool';
import type { PhaseFormData, TaskFormData, MilestoneFormData, HolidayFormData, Resource, TaskResourceAssignment } from '@/types/gantt-tool';
import { differenceInDays, addDays } from 'date-fns';
import { calculateWorkingDaysInclusive, addWorkingDays as addWorkingDaysUtil } from '@/lib/gantt-tool/working-days';
import { formatGanttDate } from '@/lib/gantt-tool/date-utils';
import { PhaseTaskResourceAllocationModal } from './PhaseTaskResourceAllocationModal';

export function GanttSidePanel() {
  const {
    sidePanel,
    currentProject,
    closeSidePanel,
    addPhase,
    updatePhase,
    deletePhase,
    getPhaseById,
    addTask,
    updateTask,
    deleteTask,
    getTaskById,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getMilestoneById,
    addHoliday,
    deleteHoliday,
  } = useGanttToolStoreV2();

  // Track if we should enable real-time updates
  const [enableRealTimeUpdate] = useState(true);

  if (!sidePanel.isOpen || !currentProject) return null;

  const { mode, itemType, itemId } = sidePanel;

  // Form components based on item type
  const renderForm = () => {
    switch (itemType) {
      case 'phase':
        return (
          <PhaseForm
            mode={mode}
            itemId={itemId}
            enableRealTimeUpdate={enableRealTimeUpdate && mode === 'edit'}
            onSubmit={async (data) => {
              try {
                if (mode === 'add') {
                  await addPhase(data);
                } else if (mode === 'edit' && itemId) {
                  await updatePhase(itemId, data);
                }
                closeSidePanel();
              } catch (error) {
                alert((error as Error).message || 'Failed to save phase. Please refresh the page.');
              }
            }}
            updatePhase={updatePhase}
            onDelete={
              mode === 'edit' && itemId
                ? async () => {
                    if (confirm('Delete this phase?')) {
                      try {
                        await deletePhase(itemId);
                        closeSidePanel();
                      } catch (error) {
                        alert((error as Error).message || 'Failed to delete phase. Please refresh the page.');
                      }
                    }
                  }
                : undefined
            }
            getPhaseById={getPhaseById}
          />
        );

      case 'task':
        return (
          <TaskForm
            mode={mode}
            itemId={itemId}
            phases={currentProject.phases}
            enableRealTimeUpdate={enableRealTimeUpdate && mode === 'edit'}
            onSubmit={async (data) => {
              try {
                if (mode === 'add') {
                  await addTask(data);
                } else if (mode === 'edit' && itemId) {
                  const result = getTaskById(itemId);
                  if (result) {
                    await updateTask(itemId, result.phase.id, data);
                  }
                }
                closeSidePanel();
              } catch (error) {
                // Handle race condition where phase may have been deleted
                alert((error as Error).message || 'Failed to save task. Please refresh the page.');
              }
            }}
            updateTask={updateTask}
            getTaskById={getTaskById}
            onDelete={
              mode === 'edit' && itemId
                ? async () => {
                    if (confirm('Delete this task?')) {
                      try {
                        const result = getTaskById(itemId);
                        if (result) {
                          await deleteTask(itemId, result.phase.id);
                        }
                        closeSidePanel();
                      } catch (error) {
                        alert((error as Error).message || 'Failed to delete task. Please refresh the page.');
                      }
                    }
                  }
                : undefined
            }
          />
        );

      case 'milestone':
        return (
          <MilestoneForm
            mode={mode}
            itemId={itemId}
            onSubmit={async (data) => {
              try {
                if (mode === 'add') {
                  await addMilestone(data);
                } else if (mode === 'edit' && itemId) {
                  await updateMilestone(itemId, data);
                }
                closeSidePanel();
              } catch (error) {
                alert((error as Error).message || 'Failed to save milestone. Please refresh the page.');
              }
            }}
            onDelete={
              mode === 'edit' && itemId
                ? async () => {
                    if (confirm('Delete this milestone?')) {
                      try {
                        await deleteMilestone(itemId);
                        closeSidePanel();
                      } catch (error) {
                        alert((error as Error).message || 'Failed to delete milestone. Please refresh the page.');
                      }
                    }
                  }
                : undefined
            }
            getMilestoneById={getMilestoneById}
          />
        );

      case 'holiday':
        return (
          <HolidayForm
            mode={mode}
            onSubmit={async (data) => {
              try {
                await addHoliday(data);
                closeSidePanel();
              } catch (error) {
                alert((error as Error).message || 'Failed to add holiday. Please refresh the page.');
              }
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={closeSidePanel}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'add' ? 'Add' : 'Edit'} {itemType?.charAt(0).toUpperCase()}{itemType?.slice(1)}
          </h3>
          <button
            onClick={closeSidePanel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderForm()}</div>
      </div>
    </>
  );
}

// --- Phase Form ---
function PhaseForm({
  mode,
  itemId,
  onSubmit,
  onDelete,
  getPhaseById,
  enableRealTimeUpdate,
  updatePhase,
}: {
  mode: 'add' | 'edit' | 'view';
  itemId?: string;
  onSubmit: (data: PhaseFormData) => void;
  onDelete?: () => void;
  getPhaseById: (id: string) => any;
  enableRealTimeUpdate?: boolean;
  updatePhase?: (id: string, data: Partial<PhaseFormData>) => void;
}) {
  const { currentProject } = useGanttToolStoreV2();
  const existingPhase = itemId ? getPhaseById(itemId) : null;

  const [formData, setFormData] = useState<PhaseFormData>({
    name: existingPhase?.name || '',
    description: existingPhase?.description || '',
    color: existingPhase?.color || PHASE_COLOR_PRESETS[0],
    startDate: existingPhase?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: existingPhase?.endDate?.split('T')[0] || new Date().toISOString().split('T')[0],
  });

  const [workingDaysInput, setWorkingDaysInput] = useState<string>('');
  const [calendarDaysInput, setCalendarDaysInput] = useState<string>('');
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Calculate working days (excludes weekends and holidays)
  const workingDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !currentProject) return 0;
    return calculateWorkingDaysInclusive(
      formData.startDate,
      formData.endDate,
      currentProject.holidays
    );
  }, [formData.startDate, formData.endDate, currentProject]);

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    return differenceInDays(new Date(formData.endDate), new Date(formData.startDate));
  }, [formData.startDate, formData.endDate]);

  // Initialize duration inputs when values change
  useEffect(() => {
    setWorkingDaysInput(workingDays.toString());
    setCalendarDaysInput(calendarDays.toString());
  }, [workingDays, calendarDays]);

  // Real-time update in edit mode
  useEffect(() => {
    if (enableRealTimeUpdate && updatePhase && itemId && formData.startDate && formData.endDate) {
      const timer = setTimeout(() => {
        updatePhase(itemId, {
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timer);
    }
  }, [formData.startDate, formData.endDate, enableRealTimeUpdate, updatePhase, itemId]);

  // Handle working days change - update end date
  const handleWorkingDaysChange = (value: string) => {
    setWorkingDaysInput(value);
    const days = parseInt(value);
    if (!isNaN(days) && days > 0 && formData.startDate && currentProject) {
      const newEnd = addWorkingDaysUtil(
        formData.startDate,
        days,
        currentProject.holidays
      );
      setFormData({ ...formData, endDate: newEnd.toISOString().split('T')[0] });
    }
  };

  // Handle calendar days change - update end date
  const handleCalendarDaysChange = (value: string) => {
    setCalendarDaysInput(value);
    const days = parseInt(value);
    if (!isNaN(days) && days > 0 && formData.startDate) {
      const newEnd = addDays(new Date(formData.startDate), days);
      setFormData({ ...formData, endDate: newEnd.toISOString().split('T')[0] });
    }
  };

  // Handle start date change - maintain working days duration
  const handleStartDateChange = (newStartDate: string) => {
    setFormData({ ...formData, startDate: newStartDate });
    // If we have a working days duration, update end date to maintain it
    if (workingDaysInput && !isNaN(parseInt(workingDaysInput)) && parseInt(workingDaysInput) > 0 && currentProject) {
      // Validate the date before processing
      const testDate = new Date(newStartDate);
      if (!newStartDate || isNaN(testDate.getTime())) {
        return; // Skip calculation if date is invalid
      }

      try {
        const days = parseInt(workingDaysInput);
        const newEnd = addWorkingDaysUtil(
          newStartDate,
          days,
          currentProject.holidays
        );
        setFormData({ ...formData, startDate: newStartDate, endDate: newEnd.toISOString().split('T')[0] });
      } catch (error) {
        // Ignore errors from invalid dates during input
        console.warn('Date calculation skipped:', error);
      }
    }
  };

  // Check for milestone and holiday conflicts
  const warnings = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !currentProject) return [];

    const warnings: Array<{ type: 'milestone' | 'holiday'; message: string }> = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const oneWeekBefore = addDays(start, -7);
    const oneWeekAfter = addDays(end, 7);

    // Check milestones
    currentProject.milestones.forEach(milestone => {
      const milestoneDate = new Date(milestone.date);
      if (milestoneDate >= start && milestoneDate <= end) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" falls within this phase (${formatGanttDate(milestone.date)})`
        });
      } else if (milestoneDate >= oneWeekBefore && milestoneDate < start) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" is within 1 week before phase start (${formatGanttDate(milestone.date)})`
        });
      } else if (milestoneDate > end && milestoneDate <= oneWeekAfter) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" is within 1 week after phase end (${formatGanttDate(milestone.date)})`
        });
      }
    });

    // Check holidays
    currentProject.holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const dayOfWeek = holidayDate.getDay();
      // Only weekday holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (holidayDate >= start && holidayDate <= end) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" falls within this phase (${formatGanttDate(holidayDate)})`
          });
        } else if (holidayDate >= oneWeekBefore && holidayDate < start) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" is within 1 week before phase start (${formatGanttDate(holidayDate)})`
          });
        } else if (holidayDate > end && holidayDate <= oneWeekAfter) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" is within 1 week after phase end (${formatGanttDate(holidayDate)})`
          });
        }
      }
    });

    return warnings;
  }, [formData.startDate, formData.endDate, currentProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phase Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Requirements Gathering"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {PHASE_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Manage Resources Button - Only in edit mode */}
      {mode === 'edit' && itemId && (
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowResourceModal(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Sliders className="w-5 h-5" />
            <span>Manage Phase Resources</span>
            <Users className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">
            Assign PM resources with visual allocation sliders
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Dual Duration Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Working Days <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={workingDaysInput}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold text-blue-700"
                placeholder="WD"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">WD</span>
            </div>
            <p className="text-[10px] text-blue-600 mt-1">Business days only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Calendar Days
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={calendarDaysInput}
                onChange={(e) => handleCalendarDaysChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-700"
                placeholder="CD"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">CD</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">All days (incl. weekends)</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const { openSidePanel, addMilestone } = useGanttToolStoreV2.getState();
                // Quick add milestone at end date
                const milestoneName = `${formData.name || 'Phase'} Complete`;
                addMilestone({
                  name: milestoneName,
                  description: `Completion of ${formData.name || 'phase'}`,
                  date: formData.endDate,
                  icon: '🎯',
                  color: formData.color || '#10B981',
                });
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              title="Create milestone at end date"
            >
              <FlagIcon className="w-3 h-3" />
              + Milestone
            </button>
          </div>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-[10px] text-gray-500 mt-1">💡 Click "+ Milestone" to mark phase completion</p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                warning.type === 'milestone'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              {warning.type === 'milestone' ? (
                <FlagIcon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    {warning.type === 'milestone' ? 'Milestone Alert' : 'Holiday Alert'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {mode === 'add' ? 'Add Phase' : 'Save Changes'}
        </button>
      </div>

      {/* Resource Allocation Modal */}
      {showResourceModal && mode === 'edit' && itemId && (
        <PhaseTaskResourceAllocationModal
          itemId={itemId}
          itemType="phase"
          onClose={() => setShowResourceModal(false)}
        />
      )}
    </form>
  );
}

// --- Task Form ---
function TaskForm({
  mode,
  itemId,
  phases,
  onSubmit,
  onDelete,
  getTaskById,
  enableRealTimeUpdate,
  updateTask,
}: {
  mode: 'add' | 'edit' | 'view';
  itemId?: string;
  phases: any[];
  onSubmit: (data: TaskFormData) => void;
  onDelete?: () => void;
  getTaskById: (id: string) => any;
  enableRealTimeUpdate?: boolean;
  updateTask?: (taskId: string, phaseId: string, updates: Partial<TaskFormData>) => void;
}) {
  const existingTask = itemId ? getTaskById(itemId) : null;

  const [formData, setFormData] = useState<TaskFormData>({
    name: existingTask?.task.name || '',
    description: existingTask?.task.description || '',
    phaseId: existingTask?.phase.id || phases[0]?.id || '',
    startDate: existingTask?.task.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: existingTask?.task.endDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    assignee: existingTask?.task.assignee || '',
  });

  const [workingDaysInput, setWorkingDaysInput] = useState<string>('');
  const [calendarDaysInput, setCalendarDaysInput] = useState<string>('');
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  const {
    currentProject,
  } = useGanttToolStoreV2();

  // Get selected phase for validation
  const selectedPhase = phases.find(p => p.id === formData.phaseId);

  // Calculate working days (excludes weekends and holidays)
  const workingDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !currentProject) return 0;
    return calculateWorkingDaysInclusive(
      formData.startDate,
      formData.endDate,
      currentProject.holidays
    );
  }, [formData.startDate, formData.endDate, currentProject]);

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    return differenceInDays(new Date(formData.endDate), new Date(formData.startDate));
  }, [formData.startDate, formData.endDate]);

  // Initialize duration inputs when values change
  useEffect(() => {
    setWorkingDaysInput(workingDays.toString());
    setCalendarDaysInput(calendarDays.toString());
  }, [workingDays, calendarDays]);

  // Real-time update in edit mode
  useEffect(() => {
    if (enableRealTimeUpdate && updateTask && itemId && formData.startDate && formData.endDate && existingTask) {
      const timer = setTimeout(() => {
        updateTask(itemId, existingTask.phase.id, {
          startDate: formData.startDate,
          endDate: formData.endDate,
        });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timer);
    }
  }, [formData.startDate, formData.endDate, enableRealTimeUpdate, updateTask, itemId, existingTask]);

  // Handle working days change - update end date
  const handleWorkingDaysChange = (value: string) => {
    setWorkingDaysInput(value);
    const days = parseInt(value);
    if (!isNaN(days) && days > 0 && formData.startDate && currentProject) {
      const newEnd = addWorkingDaysUtil(
        formData.startDate,
        days,
        currentProject.holidays
      );
      setFormData({ ...formData, endDate: newEnd.toISOString().split('T')[0] });
    }
  };

  // Handle calendar days change - update end date
  const handleCalendarDaysChange = (value: string) => {
    setCalendarDaysInput(value);
    const days = parseInt(value);
    if (!isNaN(days) && days > 0 && formData.startDate) {
      const newEnd = addDays(new Date(formData.startDate), days);
      setFormData({ ...formData, endDate: newEnd.toISOString().split('T')[0] });
    }
  };

  // Handle start date change - maintain working days duration
  const handleStartDateChange = (newStartDate: string) => {
    setFormData({ ...formData, startDate: newStartDate });
    // If we have a working days duration, update end date to maintain it
    if (workingDaysInput && !isNaN(parseInt(workingDaysInput)) && parseInt(workingDaysInput) > 0 && currentProject) {
      // Validate the date before processing
      const testDate = new Date(newStartDate);
      if (!newStartDate || isNaN(testDate.getTime())) {
        return; // Skip calculation if date is invalid
      }

      try {
        const days = parseInt(workingDaysInput);
        const newEnd = addWorkingDaysUtil(
          newStartDate,
          days,
          currentProject.holidays
        );
        setFormData({ ...formData, startDate: newStartDate, endDate: newEnd.toISOString().split('T')[0] });
      } catch (error) {
        // Ignore errors from invalid dates during input
        console.warn('Date calculation skipped:', error);
      }
    }
  };

  // Check for milestone and holiday conflicts
  const warnings = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !currentProject) return [];

    const warnings: Array<{ type: 'milestone' | 'holiday'; message: string }> = [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const oneWeekBefore = addDays(start, -7);
    const oneWeekAfter = addDays(end, 7);

    // Check milestones
    currentProject.milestones.forEach(milestone => {
      const milestoneDate = new Date(milestone.date);
      if (milestoneDate >= start && milestoneDate <= end) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" falls within this task (${formatGanttDate(milestone.date)})`
        });
      } else if (milestoneDate >= oneWeekBefore && milestoneDate < start) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" is within 1 week before task start (${formatGanttDate(milestone.date)})`
        });
      } else if (milestoneDate > end && milestoneDate <= oneWeekAfter) {
        warnings.push({
          type: 'milestone',
          message: `Milestone "${milestone.name}" is within 1 week after task end (${formatGanttDate(milestone.date)})`
        });
      }
    });

    // Check holidays
    currentProject.holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      const dayOfWeek = holidayDate.getDay();
      // Only weekday holidays
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        if (holidayDate >= start && holidayDate <= end) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" falls within this task (${formatGanttDate(holidayDate)})`
          });
        } else if (holidayDate >= oneWeekBefore && holidayDate < start) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" is within 1 week before task start (${formatGanttDate(holidayDate)})`
          });
        } else if (holidayDate > end && holidayDate <= oneWeekAfter) {
          warnings.push({
            type: 'holiday',
            message: `Public holiday "${holiday.name}" is within 1 week after task end (${formatGanttDate(holidayDate)})`
          });
        }
      }
    });

    return warnings;
  }, [formData.startDate, formData.endDate, currentProject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phaseId || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate task dates are within phase boundaries
    if (selectedPhase) {
      const taskStart = new Date(formData.startDate);
      const taskEnd = new Date(formData.endDate);
      const phaseStart = new Date(selectedPhase.startDate);
      const phaseEnd = new Date(selectedPhase.endDate);

      if (taskStart < phaseStart || taskEnd > phaseEnd) {
        alert(
          `Task dates must be within phase boundaries:\n` +
          `Phase: ${formatGanttDate(phaseStart)} - ${formatGanttDate(phaseEnd)}`
        );
        return;
      }
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="e.g., Design mockups"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          rows={2}
          placeholder="Optional task description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phase <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.phaseId}
          onChange={(e) => setFormData({ ...formData, phaseId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          required
        >
          {phases.map((phase) => (
            <option key={phase.id} value={phase.id}>
              {phase.name}
            </option>
          ))}
        </select>
        {selectedPhase && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            <strong>Phase dates:</strong> {formatGanttDate(selectedPhase.startDate)} - {formatGanttDate(selectedPhase.endDate)}
            <div className="text-[10px] mt-0.5 text-blue-600">Task must be within these dates</div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Dual Duration Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-1">
              Working Days <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={workingDaysInput}
                onChange={(e) => handleWorkingDaysChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-semibold text-purple-700"
                placeholder="WD"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-purple-600">WD</span>
            </div>
            <p className="text-[10px] text-purple-600 mt-1">Business days only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Calendar Days
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={calendarDaysInput}
                onChange={(e) => handleCalendarDaysChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-700"
                placeholder="CD"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">CD</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">All days (incl. weekends)</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              End Date <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const { addMilestone } = useGanttToolStoreV2.getState();
                // Quick add milestone at task end date
                const milestoneName = `${formData.name || 'Task'} Complete`;
                addMilestone({
                  name: milestoneName,
                  description: `Completion of ${formData.name || 'task'}`,
                  date: formData.endDate,
                  icon: '🎯',
                  color: selectedPhase?.color || '#A855F7', // Use phase color or purple
                });
              }}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              title="Create milestone at end date"
            >
              <FlagIcon className="w-3 h-3" />
              + Milestone
            </button>
          </div>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
          <p className="text-[10px] text-gray-500 mt-1">💡 Click "+ Milestone" to mark task completion</p>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((warning, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-start gap-2 ${
                warning.type === 'milestone'
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-orange-50 border-orange-200'
              }`}
            >
              {warning.type === 'milestone' ? (
                <FlagIcon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    {warning.type === 'milestone' ? 'Milestone Alert' : 'Holiday Alert'}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
        <input
          type="text"
          value={formData.assignee}
          onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          placeholder="Optional assignee name"
        />
      </div>

      {/* Manage Resources Button - Only in edit mode */}
      {mode === 'edit' && itemId && existingTask && (
        <div className="pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowAllocationModal(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Sliders className="w-5 h-5" />
            <span>Manage Task Resources</span>
            <Users className="w-5 h-5" />
          </button>
          <div className="mt-2 text-center">
            {existingTask.task.resourceAssignments && existingTask.task.resourceAssignments.length > 0 ? (
              <p className="text-xs text-gray-600">
                {existingTask.task.resourceAssignments.length} resource{existingTask.task.resourceAssignments.length !== 1 ? 's' : ''} assigned · Click to manage with sliders
              </p>
            ) : (
              <p className="text-xs text-gray-600">
                No resources assigned · Click to assign with visual allocation sliders
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Task
          </button>
        )}
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          {mode === 'add' ? 'Add Task' : 'Save Changes'}
        </button>
      </div>

      {/* Resource Allocation Modal */}
      {showAllocationModal && mode === 'edit' && itemId && existingTask && (
        <PhaseTaskResourceAllocationModal
          itemId={itemId}
          itemType="task"
          onClose={() => setShowAllocationModal(false)}
        />
      )}
    </form>
  );
}

// --- Milestone Form ---
function MilestoneForm({
  mode,
  itemId,
  onSubmit,
  onDelete,
  getMilestoneById,
}: {
  mode: 'add' | 'edit' | 'view';
  itemId?: string;
  onSubmit: (data: MilestoneFormData) => void;
  onDelete?: () => void;
  getMilestoneById: (id: string) => any;
}) {
  const existingMilestone = itemId ? getMilestoneById(itemId) : null;

  const [formData, setFormData] = useState<MilestoneFormData>({
    name: existingMilestone?.name || '',
    description: existingMilestone?.description || '',
    date: existingMilestone?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    icon: existingMilestone?.icon || 'flag',
    color: existingMilestone?.color || MILESTONE_COLOR_PRESETS[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex gap-2">
          {MILESTONE_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-10 h-10 rounded-lg border-2 ${
                formData.color === color ? 'border-gray-900' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {onDelete && (
          <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">
            Delete
          </button>
        )}
        <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">
          {mode === 'add' ? 'Add Milestone' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// --- Holiday Form ---
function HolidayForm({ mode, onSubmit }: { mode: 'add' | 'edit' | 'view'; onSubmit: (data: HolidayFormData) => void }) {
  const [formData, setFormData] = useState<HolidayFormData>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    region: 'Global',
    type: 'public',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button type="submit" className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg">
        Add Holiday
      </button>
    </form>
  );
}
