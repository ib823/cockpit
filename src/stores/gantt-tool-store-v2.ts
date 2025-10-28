/**
 * Gantt Tool Store V2 - Database-backed
 *
 * Uses API routes for persistence instead of localStorage.
 * Maintains backward compatibility for migration.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  GanttProject,
  GanttPhase,
  GanttTask,
  GanttMilestone,
  GanttHoliday,
  GanttViewSettings,
  SidePanelState,
  SelectionState,
  PhaseFormData,
  TaskFormData,
  MilestoneFormData,
  HolidayFormData,
  Resource,
  ResourceFormData,
  TaskResourceAssignment,
  PhaseResourceAssignment,
  ProjectBudget,
} from '@/types/gantt-tool';
import { PHASE_COLOR_PRESETS } from '@/types/gantt-tool';
import { differenceInDays, addDays, format } from 'date-fns';
import { adjustDatesToWorkingDays, calculateWorkingDaysInclusive, addWorkingDays } from '@/lib/gantt-tool/working-days';
// import { createDefaultResources } from '@/lib/gantt-tool/default-resources'; // No longer used - users add resources manually or via import

interface GanttToolStateV2 {
  // Core Data (loaded from API)
  currentProject: GanttProject | null;
  projects: GanttProject[];

  // Sync state
  isSyncing: boolean;
  lastSyncAt: Date | null;
  syncError: string | null;

  // History (Undo/Redo) - Client-side only
  history: {
    past: GanttProject[];
    future: GanttProject[];
  };

  // UI State
  sidePanel: SidePanelState;
  selection: SelectionState;
  isLoading: boolean;
  error: string | null;
  manuallyUnloaded: boolean;
  focusedPhaseId: string | null;

  // API Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (projectId: string) => Promise<void>;
  createProject: (name: string, startDate: string, description?: string) => Promise<void>;
  importProject: (data: GanttProject) => Promise<void>;
  createProjectFromTemplate: (template: GanttProject) => Promise<void>;
  saveProject: () => Promise<void>; // Auto-save current project to API
  deleteProject: (projectId: string) => Promise<void>;
  loadProject: (projectId: string) => void;
  unloadCurrentProject: () => void;

  // History Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Phase Management (with auto-save)
  addPhase: (data: PhaseFormData) => Promise<void>;
  updatePhase: (phaseId: string, updates: Partial<GanttPhase>) => Promise<void>;
  deletePhase: (phaseId: string) => Promise<void>;
  togglePhaseCollapse: (phaseId: string) => void;
  movePhase: (phaseId: string, newStartDate: string, newEndDate: string) => void;
  reorderPhase: (phaseId: string, direction: 'up' | 'down') => void;
  autoAlignPhase: (phaseId: string) => void;

  // Task Management (with auto-save)
  addTask: (data: TaskFormData) => Promise<void>;
  updateTask: (taskId: string, phaseId: string, updates: Partial<GanttTask>) => Promise<void>;
  deleteTask: (taskId: string, phaseId: string) => Promise<void>;
  moveTask: (taskId: string, phaseId: string, newStartDate: string, newEndDate: string) => void;
  updateTaskProgress: (taskId: string, phaseId: string, progress: number) => void;
  reorderTask: (taskId: string, phaseId: string, direction: 'up' | 'down') => void;
  autoAlignTask: (taskId: string, phaseId: string) => void;

  // Milestone Management (with auto-save)
  addMilestone: (data: MilestoneFormData) => Promise<void>;
  updateMilestone: (milestoneId: string, updates: Partial<GanttMilestone>) => Promise<void>;
  deleteMilestone: (milestoneId: string) => Promise<void>;

  // Holiday Management (with auto-save)
  addHoliday: (data: HolidayFormData) => Promise<void>;
  deleteHoliday: (holidayId: string) => Promise<void>;

  // Resource Management (with auto-save)
  addResource: (data: ResourceFormData) => Promise<void>;
  updateResource: (resourceId: string, updates: Partial<Resource>) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  getResourceById: (resourceId: string) => Resource | undefined;

  // Resource Assignment (with auto-save)
  assignResourceToTask: (taskId: string, phaseId: string, resourceId: string, assignmentNotes: string, allocationPercentage: number) => void;
  unassignResourceFromTask: (taskId: string, phaseId: string, assignmentId: string) => void;
  updateTaskResourceAssignment: (taskId: string, phaseId: string, assignmentId: string, assignmentNotes: string, allocationPercentage: number) => void;
  assignResourceToPhase: (phaseId: string, resourceId: string, assignmentNotes: string, allocationPercentage: number) => void;
  unassignResourceFromPhase: (phaseId: string, assignmentId: string) => void;
  updatePhaseResourceAssignment: (phaseId: string, assignmentId: string, assignmentNotes: string, allocationPercentage: number) => void;

  // Budget Management (with auto-save)
  updateProjectBudget: (budget: ProjectBudget) => void;

  // View Settings (with auto-save)
  updateViewSettings: (updates: Partial<GanttViewSettings>) => void;
  setZoomLevel: (level: GanttViewSettings['zoomLevel']) => void;
  toggleWeekends: () => void;
  toggleHolidays: () => void;
  toggleMilestones: () => void;
  toggleTitles: () => void;
  setBarDurationDisplay: (display: 'wd' | 'cd' | 'resource' | 'dates' | 'all' | 'clean') => void;

  // UI State
  openSidePanel: (mode: SidePanelState['mode'], itemType: SidePanelState['itemType'], itemId?: string) => void;
  closeSidePanel: () => void;
  selectItem: (itemId: string, itemType: SelectionState['selectedItemType']) => void;
  clearSelection: () => void;

  // Focus Mode
  focusPhase: (phaseId: string) => void;
  exitFocusMode: () => void;

  // Getters
  getPhaseById: (phaseId: string) => GanttPhase | undefined;
  getTaskById: (taskId: string) => { task: GanttTask; phase: GanttPhase } | undefined;
  getMilestoneById: (milestoneId: string) => GanttMilestone | undefined;
  getProjectDuration: () => { startDate: Date; endDate: Date; durationDays: number } | null;
  getWorkingDays: (startDate: Date, endDate: Date) => number;
}

const DEFAULT_VIEW_SETTINGS: GanttViewSettings = {
  zoomLevel: 'week',
  showWeekends: true,
  showHolidays: true,
  showMilestones: true,
  showTaskDependencies: false,
  showCriticalPath: false,
  showTitles: true,
  barDurationDisplay: 'all',
};

// Helper to deep clone project for history
function cloneProject(project: GanttProject | null): GanttProject | null {
  if (!project) return null;
  return JSON.parse(JSON.stringify(project));
}

// Helper to ensure date is formatted as YYYY-MM-DD string
function formatDateField(date: string | Date): string {
  try {
    if (typeof date === 'string') {
      // Already a string, just ensure it's in the right format
      const cleaned = date.includes('T') ? date.split('T')[0] : date;
      // Validate format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
        console.error('Invalid date format:', date, 'cleaned:', cleaned);
        throw new Error(`Invalid date format: ${cleaned}`);
      }
      return cleaned;
    }
    // It's a Date object, format it
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error('Invalid date object:', date);
      throw new Error(`Invalid date object: ${date}`);
    }
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date:', date, error);
    throw error;
  }
}

export const useGanttToolStoreV2 = create<GanttToolStateV2>()(
  immer((set, get) => ({
    // Initial State
    currentProject: null,
    projects: [],
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
    history: {
      past: [],
      future: [],
    },
    sidePanel: {
      isOpen: false,
      mode: 'view',
      itemType: null,
    },
    selection: {
      selectedItemId: null,
      selectedItemType: null,
    },
    isLoading: false,
    error: null,
    manuallyUnloaded: false,
    focusedPhaseId: null,

    // --- API Actions ---

    fetchProjects: async () => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/gantt-tool/projects');

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();

        set((state) => {
          state.projects = data.projects;
          state.isLoading = false;
          state.lastSyncAt = new Date();
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Unknown error';
          state.isLoading = false;
        });
      }
    },

    fetchProject: async (projectId: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch(`/api/gantt-tool/projects/${projectId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();

        set((state) => {
          state.currentProject = data.project;
          state.isLoading = false;
          state.manuallyUnloaded = false;
          state.lastSyncAt = new Date();
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Unknown error';
          state.isLoading = false;
        });
      }
    },

    createProject: async (name: string, startDate: string, description?: string) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        const response = await fetch('/api/gantt-tool/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            startDate,
            description,
            viewSettings: { ...DEFAULT_VIEW_SETTINGS },
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.error || 'Project name already exists');
          }
          throw new Error('Failed to create project');
        }

        const data = await response.json();

        // FIX: Do NOT initialize resources with defaults
        // Users should manually add resources or import them from Excel
        // Previously this added 90+ default SAP resources which cluttered the project
        //
        // const resourceData = createDefaultResources();
        // const updateResponse = await fetch(`/api/gantt-tool/projects/${data.project.id}`, {
        //   method: 'PATCH',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     resources: resourceData,
        //   }),
        // });
        // if (!updateResponse.ok) {
        //   throw new Error('Failed to add default resources');
        // }
        // const updatedData = await updateResponse.json();

        set((state) => {
          state.currentProject = data.project; // Use original project data, not updatedData
          state.projects.push(data.project);
          state.isSyncing = false;
          state.lastSyncAt = new Date();
          state.manuallyUnloaded = false;
        });
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : 'Unknown error';
          state.isSyncing = false;
        });
        // Re-throw so calling code knows creation failed
        throw error;
      }
    },

    importProject: async (data: GanttProject) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        // Create project via API with imported data
        const response = await fetch('/api/gantt-tool/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            // Generate new ID and timestamps
            id: undefined, // Let server generate
            createdAt: undefined,
            updatedAt: undefined,
          }),
        });

        if (!response.ok) {
          if (response.status === 409) {
            const error = await response.json();
            throw new Error(error.error || 'Project name already exists');
          }
          throw new Error('Failed to import project');
        }

        const responseData = await response.json();

        set((state) => {
          state.currentProject = responseData.project;
          state.projects.push(responseData.project);
          state.isSyncing = false;
          state.lastSyncAt = new Date();
          state.manuallyUnloaded = false;
        });

        // Fetch all projects to refresh the list
        await get().fetchProjects();
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : 'Unknown error';
          state.isSyncing = false;
        });
        // Re-throw so calling code knows import failed
        throw error;
      }
    },

    createProjectFromTemplate: async (template: GanttProject) => {
      // Templates are just imported projects with a different name
      await get().importProject({
        ...template,
        name: `${template.name} (Copy)`,
      });
    },

    saveProject: async () => {
      const { currentProject } = get();

      if (!currentProject) return;

      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        // Clean up data - only send fields expected by the API, not database-managed fields
        const projectData = {
          name: currentProject.name,
          description: currentProject.description || undefined,
          startDate: formatDateField(currentProject.startDate),
          viewSettings: currentProject.viewSettings || undefined,
          budget: currentProject.budget || undefined,
          phases: currentProject.phases.map(phase => ({
            id: phase.id,
            name: phase.name,
            description: phase.description || '',
            color: phase.color,
            startDate: formatDateField(phase.startDate),
            endDate: formatDateField(phase.endDate),
            collapsed: phase.collapsed,
            order: (phase as any).order || 0,
            dependencies: phase.dependencies || [],
            tasks: phase.tasks.map(task => ({
              id: task.id,
              name: task.name,
              description: task.description || '',
              startDate: formatDateField(task.startDate),
              endDate: formatDateField(task.endDate),
              progress: task.progress || 0,
              assignee: task.assignee || '',
              order: (task as any).order || 0,
              dependencies: task.dependencies || [],
              resourceAssignments: (task.resourceAssignments || []).map(ra => ({
                id: ra.id,
                resourceId: ra.resourceId,
                assignmentNotes: ra.assignmentNotes || '',
                allocationPercentage: ra.allocationPercentage || 0,
                assignedAt: ra.assignedAt || new Date().toISOString(),
              })),
            })),
            phaseResourceAssignments: (phase.phaseResourceAssignments || []).map(pra => ({
              id: pra.id,
              resourceId: pra.resourceId,
              assignmentNotes: pra.assignmentNotes || '',
              allocationPercentage: pra.allocationPercentage || 0,
              assignedAt: pra.assignedAt || new Date().toISOString(),
            })),
          })),
          milestones: currentProject.milestones.map(m => ({
            id: m.id,
            name: m.name,
            description: m.description || '',
            date: formatDateField(m.date),
            icon: m.icon,
            color: m.color,
          })),
          holidays: currentProject.holidays.map(h => ({
            id: h.id,
            name: h.name,
            date: formatDateField(h.date),
            region: h.region,
            type: h.type,
          })),
          resources: currentProject.resources.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            description: r.description || '',
            designation: r.designation,
            managerResourceId: r.managerResourceId || null,
            email: r.email || null,
            department: r.department || null,
            location: r.location || null,
            projectRole: r.projectRole || null,
            createdAt: r.createdAt || new Date().toISOString(),
          })),
        };

        // Pre-flight validation logging
        console.log('[Store] Saving project data:', {
          projectId: currentProject.id,
          name: projectData.name,
          startDate: projectData.startDate,
          phasesCount: projectData.phases.length,
          milestonesCount: projectData.milestones.length,
          holidaysCount: projectData.holidays.length,
          resourcesCount: projectData.resources.length,
        });

        const response = await fetch(`/api/gantt-tool/projects/${currentProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `Failed to save project (${response.status})`;

          // Enhanced error logging to debug validation issues
          console.error('Save project failed:', {
            status: response.status,
            errorMessage,
            errorData,
            validationDetails: errorData.details,
          });

          // If validation failed, show detailed error
          if (errorData.details && Array.isArray(errorData.details)) {
            const detailedErrors = errorData.details.map((issue: any) =>
              `${issue.path.join('.')}: ${issue.message}`
            ).join(', ');
            throw new Error(`Validation failed: ${detailedErrors}`);
          }

          throw new Error(errorMessage);
        }

        set((state) => {
          state.isSyncing = false;
          state.lastSyncAt = new Date();

          // Update in projects array
          const index = state.projects.findIndex(p => p.id === currentProject.id);
          if (index !== -1) {
            state.projects[index] = currentProject;
          }
        });
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : 'Unknown error';
          state.isSyncing = false;
        });
        // Re-throw the error so calling code can handle it
        throw error;
      }
    },

    deleteProject: async (projectId: string) => {
      set((state) => {
        state.isSyncing = true;
        state.syncError = null;
      });

      try {
        const response = await fetch(`/api/gantt-tool/projects/${projectId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete project');
        }

        set((state) => {
          state.projects = state.projects.filter(p => p.id !== projectId);
          if (state.currentProject?.id === projectId) {
            state.currentProject = null;
          }
          state.isSyncing = false;
          state.lastSyncAt = new Date();
        });

        // Refetch projects to ensure we have the latest list from the database
        await get().fetchProjects();
      } catch (error) {
        set((state) => {
          state.syncError = error instanceof Error ? error.message : 'Unknown error';
          state.isSyncing = false;
        });
        throw error; // Re-throw to let caller handle
      }
    },

    loadProject: (projectId: string) => {
      const { projects } = get();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        set((state) => {
          state.currentProject = project;
          state.manuallyUnloaded = false;
        });
      }
    },

    unloadCurrentProject: () => {
      set((state) => {
        state.currentProject = null;
        state.manuallyUnloaded = true;
        state.sidePanel = {
          isOpen: false,
          mode: 'view',
          itemType: null,
        };
        state.selection = {
          selectedItemId: null,
          selectedItemType: null,
        };
      });
    },

    // --- History Actions ---

    canUndo: () => {
      const { history } = get();
      return history.past.length > 0;
    },

    canRedo: () => {
      const { history } = get();
      return history.future.length > 0;
    },

    undo: () => {
      const { currentProject, history } = get();
      if (!currentProject || history.past.length === 0) return;

      set((state) => {
        const previousState = state.history.past[state.history.past.length - 1];

        // Push current to future
        const currentClone = cloneProject(state.currentProject);
        if (currentClone) {
          state.history.future.push(currentClone);
        }

        // Pop from past and set as current
        state.history.past = state.history.past.slice(0, -1);
        state.currentProject = previousState;
      });

      // Save to API
      get().saveProject();
    },

    redo: () => {
      const { currentProject, history } = get();
      if (!currentProject || history.future.length === 0) return;

      set((state) => {
        const nextState = state.history.future[state.history.future.length - 1];

        // Push current to past
        const currentClone = cloneProject(state.currentProject);
        if (currentClone) {
          state.history.past.push(currentClone);
        }

        // Pop from future and set as current
        state.history.future = state.history.future.slice(0, -1);
        state.currentProject = nextState;
      });

      // Save to API
      get().saveProject();
    },

    // --- Phase Management ---

    addPhase: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        // Save to history
        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) {
            state.history.past = state.history.past.slice(-50);
          }
        }

        const adjustedDates = adjustDatesToWorkingDays(
          data.startDate,
          data.endDate,
          state.currentProject.holidays
        );

        const phaseId = `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const colorIndex = state.currentProject.phases.length % PHASE_COLOR_PRESETS.length;

        const newPhase: GanttPhase = {
          id: phaseId,
          name: data.name,
          description: data.description,
          color: data.color || PHASE_COLOR_PRESETS[colorIndex],
          startDate: adjustedDates.startDate,
          endDate: adjustedDates.endDate,
          tasks: [],
          collapsed: false,
          dependencies: [],
          phaseResourceAssignments: [],
        };

        state.currentProject.phases.push(newPhase);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      // Save to API and wait for completion
      await get().saveProject();
    },

    updatePhase: async (phaseId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        // Save to history
        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (phase) {
          if (updates.startDate || updates.endDate) {
            const adjustedDates = adjustDatesToWorkingDays(
              updates.startDate || phase.startDate,
              updates.endDate || phase.endDate,
              state.currentProject.holidays
            );
            updates.startDate = adjustedDates.startDate;
            updates.endDate = adjustedDates.endDate;
          }

          Object.assign(phase, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deletePhase: async (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        state.currentProject.phases = state.currentProject.phases.filter((p) => p.id !== phaseId);
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === phaseId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    togglePhaseCollapse: (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (phase) {
          phase.collapsed = !phase.collapsed;
        }
      });
      // No auto-save for UI state changes
    },

    movePhase: (phaseId, newStartDate, newEndDate) => {
      get().updatePhase(phaseId, { startDate: newStartDate, endDate: newEndDate });
    },

    reorderPhase: (phaseId, direction) => {
      set((state) => {
        if (!state.currentProject) return;

        const phases = state.currentProject.phases;
        const currentIndex = phases.findIndex((p) => p.id === phaseId);

        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= phases.length) return;

        [phases[currentIndex], phases[newIndex]] = [phases[newIndex], phases[currentIndex]];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    autoAlignPhase: (phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phases = state.currentProject.phases;
        const currentIndex = phases.findIndex((p) => p.id === phaseId);

        if (currentIndex === -1 || currentIndex === 0) {
          if (currentIndex === 0) {
            alert('Cannot auto-align the first phase in the project.');
          }
          return;
        }

        const currentPhase = phases[currentIndex];
        const previousPhase = phases[currentIndex - 1];

        const phaseWorkingDays = calculateWorkingDaysInclusive(
          currentPhase.startDate,
          currentPhase.endDate,
          state.currentProject.holidays
        );

        const previousEndDate = new Date(previousPhase.endDate);
        const newStartDate = addWorkingDays(
          previousEndDate.toISOString().split('T')[0],
          1,
          state.currentProject.holidays
        );

        const newEndDate = addWorkingDays(
          newStartDate.toISOString().split('T')[0],
          phaseWorkingDays,
          state.currentProject.holidays
        );

        currentPhase.startDate = newStartDate.toISOString().split('T')[0];
        currentPhase.endDate = newEndDate.toISOString().split('T')[0];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // NOTE: The following actions follow the same pattern:
    // 1. Update state using immer
    // 2. Call get().saveProject() after mutation
    // I'm implementing the core actions here. Task, Milestone, Holiday, Resource management
    // follows the same pattern as Phase management above.

    // --- Task Management (stub - implement following phase pattern) ---
    addTask: async (data) => {
      set((state) => {
        if (!state.currentProject) return;
        const phase = state.currentProject.phases.find((p) => p.id === data.phaseId);

        // FIX ISSUE #13: Add phase existence check to prevent race conditions
        if (!phase) {
          throw new Error(
            'Cannot add task: The selected phase no longer exists. ' +
            'It may have been deleted by another user. Please refresh the page to see the latest project state.'
          );
        }

        const snapshot = cloneProject(state.currentProject);
        if (snapshot) {
          state.history.past.push(snapshot);
          state.history.future = [];
          if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
        }

        const adjustedDates = adjustDatesToWorkingDays(
          data.startDate,
          data.endDate,
          state.currentProject.holidays
        );

        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newTask: GanttTask = {
          id: taskId,
          phaseId: data.phaseId,
          name: data.name,
          description: data.description,
          startDate: adjustedDates.startDate,
          endDate: adjustedDates.endDate,
          dependencies: data.dependencies || [],
          assignee: data.assignee,
          progress: 0,
          resourceAssignments: [],
        };

        phase.tasks.push(newTask);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateTask: async (taskId, phaseId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);

        // FIX ISSUE #13: Add phase existence check to prevent race conditions
        if (!phase) {
          throw new Error(
            'Cannot update task: The parent phase no longer exists. ' +
            'It may have been deleted by another user. Please refresh the page to see the latest project state.'
          );
        }

        const task = phase.tasks.find((t) => t.id === taskId);
        if (task) {
          if (updates.startDate || updates.endDate) {
            const adjustedDates = adjustDatesToWorkingDays(
              updates.startDate || task.startDate,
              updates.endDate || task.endDate,
              state.currentProject.holidays
            );
            updates.startDate = adjustedDates.startDate;
            updates.endDate = adjustedDates.endDate;
          }

          Object.assign(task, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteTask: async (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        phase.tasks = phase.tasks.filter((t) => t.id !== taskId);
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === taskId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    moveTask: (taskId, phaseId, newStartDate, newEndDate) => {
      get().updateTask(taskId, phaseId, { startDate: newStartDate, endDate: newEndDate });
    },

    updateTaskProgress: (taskId, phaseId, progress) => {
      get().updateTask(taskId, phaseId, { progress });
    },

    reorderTask: (taskId, phaseId, direction) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const tasks = phase.tasks;
        const currentIndex = tasks.findIndex((t) => t.id === taskId);

        if (currentIndex === -1) return;

        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= tasks.length) return;

        [tasks[currentIndex], tasks[newIndex]] = [tasks[newIndex], tasks[currentIndex]];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    autoAlignTask: (taskId, phaseId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const tasks = phase.tasks;
        const currentIndex = tasks.findIndex((t) => t.id === taskId);

        if (currentIndex === -1 || currentIndex === 0) {
          if (currentIndex === 0) {
            alert('Cannot auto-align the first task in the phase.');
          }
          return;
        }

        const currentTask = tasks[currentIndex];
        const previousTask = tasks[currentIndex - 1];

        const taskWorkingDays = calculateWorkingDaysInclusive(
          currentTask.startDate,
          currentTask.endDate,
          state.currentProject.holidays
        );

        const previousEndDate = new Date(previousTask.endDate);
        const newStartDate = addWorkingDays(
          previousEndDate.toISOString().split('T')[0],
          1,
          state.currentProject.holidays
        );

        const newEndDate = addWorkingDays(
          newStartDate.toISOString().split('T')[0],
          taskWorkingDays,
          state.currentProject.holidays
        );

        // Validate bounds
        const phaseStart = new Date(phase.startDate);
        const phaseEnd = new Date(phase.endDate);

        if (newStartDate < phaseStart || newEndDate > phaseEnd) {
          alert(
            `Cannot auto-align: The task would fall outside phase boundaries.\n\n` +
            `Phase: ${format(phaseStart, 'dd MMM yyyy')} - ${format(phaseEnd, 'dd MMM yyyy')}\n` +
            `Proposed task dates: ${format(newStartDate, 'dd MMM yyyy')} - ${format(newEndDate, 'dd MMM yyyy')}`
          );
          return;
        }

        currentTask.startDate = newStartDate.toISOString().split('T')[0];
        currentTask.endDate = newEndDate.toISOString().split('T')[0];

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // --- Milestone Management (implement following phase pattern) ---
    addMilestone: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const milestoneId = `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newMilestone: GanttMilestone = {
          id: milestoneId,
          name: data.name,
          description: data.description,
          date: data.date,
          icon: data.icon,
          color: data.color,
        };

        state.currentProject.milestones.push(newMilestone);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateMilestone: async (milestoneId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const milestone = state.currentProject.milestones.find((m) => m.id === milestoneId);
        if (milestone) {
          Object.assign(milestone, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteMilestone: async (milestoneId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.milestones = state.currentProject.milestones.filter((m) => m.id !== milestoneId);
        state.currentProject.updatedAt = new Date().toISOString();

        if (state.selection.selectedItemId === milestoneId) {
          state.selection.selectedItemId = null;
          state.selection.selectedItemType = null;
        }
      });

      await get().saveProject();
    },

    // --- Holiday Management ---
    addHoliday: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const holidayId = `holiday-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newHoliday: GanttHoliday = {
          id: holidayId,
          name: data.name,
          date: data.date,
          region: data.region,
          type: data.type,
        };

        state.currentProject.holidays.push(newHoliday);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    deleteHoliday: async (holidayId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.holidays = state.currentProject.holidays.filter((h) => h.id !== holidayId);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    // --- Resource Management ---
    addResource: async (data) => {
      set((state) => {
        if (!state.currentProject) return;

        const resourceId = `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newResource: Resource = {
          id: resourceId,
          name: data.name,
          category: data.category,
          description: data.description,
          designation: data.designation,
          createdAt: new Date().toISOString(),
          managerResourceId: data.managerResourceId || null,
          email: data.email,
          department: data.department,
          location: data.location,
          projectRole: data.projectRole,
        };

        state.currentProject.resources.push(newResource);
        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    updateResource: async (resourceId, updates) => {
      set((state) => {
        if (!state.currentProject) return;

        const resource = state.currentProject.resources.find((r) => r.id === resourceId);
        if (resource) {
          Object.assign(resource, updates);
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      await get().saveProject();
    },

    deleteResource: async (resourceId) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.resources = state.currentProject.resources.filter((r) => r.id !== resourceId);

        // Remove assignments
        state.currentProject.phases.forEach((phase) => {
          phase.tasks.forEach((task) => {
            if (task.resourceAssignments) {
              task.resourceAssignments = task.resourceAssignments.filter(
                (assignment) => assignment.resourceId !== resourceId
              );
            }
          });
        });

        state.currentProject.updatedAt = new Date().toISOString();
      });

      await get().saveProject();
    },

    getResourceById: (resourceId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.resources.find((r) => r.id === resourceId);
    },

    // --- Resource Assignment ---
    assignResourceToTask: (taskId, phaseId, resourceId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task) return;

        if (task.resourceAssignments?.some((a) => a.resourceId === resourceId)) {
          console.warn('Resource already assigned to this task');
          return;
        }

        const assignmentId = `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newAssignment: TaskResourceAssignment = {
          id: assignmentId,
          resourceId,
          assignmentNotes,
          allocationPercentage,
          assignedAt: new Date().toISOString(),
        };

        if (!task.resourceAssignments) {
          task.resourceAssignments = [];
        }
        task.resourceAssignments.push(newAssignment);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    unassignResourceFromTask: (taskId, phaseId, assignmentId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.resourceAssignments) return;

        task.resourceAssignments = task.resourceAssignments.filter((a) => a.id !== assignmentId);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    updateTaskResourceAssignment: (taskId, phaseId, assignmentId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const task = phase.tasks.find((t) => t.id === taskId);
        if (!task || !task.resourceAssignments) return;

        const assignment = task.resourceAssignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.assignmentNotes = assignmentNotes;
          assignment.allocationPercentage = allocationPercentage;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      get().saveProject();
    },

    assignResourceToPhase: (phaseId, resourceId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase) return;

        const resource = state.currentProject.resources.find((r) => r.id === resourceId);
        if (!resource || resource.category !== 'pm') {
          console.warn('Only PM resources can be assigned to phases');
          return;
        }

        if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resourceId)) {
          console.warn('Resource already assigned to this phase');
          return;
        }

        const assignmentId = `phase-assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newAssignment: PhaseResourceAssignment = {
          id: assignmentId,
          resourceId,
          assignmentNotes,
          allocationPercentage,
          assignedAt: new Date().toISOString(),
        };

        if (!phase.phaseResourceAssignments) {
          phase.phaseResourceAssignments = [];
        }
        phase.phaseResourceAssignments.push(newAssignment);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    unassignResourceFromPhase: (phaseId, assignmentId) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase || !phase.phaseResourceAssignments) return;

        phase.phaseResourceAssignments = phase.phaseResourceAssignments.filter((a) => a.id !== assignmentId);

        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    updatePhaseResourceAssignment: (phaseId, assignmentId, assignmentNotes, allocationPercentage) => {
      set((state) => {
        if (!state.currentProject) return;

        const phase = state.currentProject.phases.find((p) => p.id === phaseId);
        if (!phase || !phase.phaseResourceAssignments) return;

        const assignment = phase.phaseResourceAssignments.find((a) => a.id === assignmentId);
        if (assignment) {
          assignment.assignmentNotes = assignmentNotes;
          assignment.allocationPercentage = allocationPercentage;
          state.currentProject.updatedAt = new Date().toISOString();
        }
      });

      get().saveProject();
    },

    // --- Budget Management ---
    updateProjectBudget: (budget) => {
      set((state) => {
        if (!state.currentProject) return;

        state.currentProject.budget = budget;
        state.currentProject.updatedAt = new Date().toISOString();
      });

      get().saveProject();
    },

    // --- View Settings ---
    updateViewSettings: (updates) => {
      set((state) => {
        if (!state.currentProject) return;
        Object.assign(state.currentProject.viewSettings, updates);
      });
      get().saveProject();
    },

    setZoomLevel: (level) => {
      get().updateViewSettings({ zoomLevel: level });
    },

    toggleWeekends: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showWeekends = !state.currentProject.viewSettings.showWeekends;
      });
      get().saveProject();
    },

    toggleHolidays: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showHolidays = !state.currentProject.viewSettings.showHolidays;
      });
      get().saveProject();
    },

    toggleMilestones: () => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.showMilestones = !state.currentProject.viewSettings.showMilestones;
      });
      get().saveProject();
    },

    toggleTitles: () => {
      set((state) => {
        if (!state.currentProject) return;
        const currentValue = state.currentProject.viewSettings.showTitles ?? true;
        state.currentProject.viewSettings.showTitles = !currentValue;
      });
      get().saveProject();
    },

    setBarDurationDisplay: (display) => {
      set((state) => {
        if (!state.currentProject) return;
        state.currentProject.viewSettings.barDurationDisplay = display;
      });
      get().saveProject();
    },

    // --- UI State ---
    openSidePanel: (mode, itemType, itemId) => {
      set((state) => {
        state.sidePanel = {
          isOpen: true,
          mode,
          itemType,
          itemId,
        };
      });
    },

    closeSidePanel: () => {
      set((state) => {
        state.sidePanel = {
          isOpen: false,
          mode: 'view',
          itemType: null,
        };
      });
    },

    selectItem: (itemId, itemType) => {
      set((state) => {
        state.selection = {
          selectedItemId: itemId,
          selectedItemType: itemType,
        };
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selection = {
          selectedItemId: null,
          selectedItemType: null,
        };
      });
    },

    // --- Focus Mode ---
    focusPhase: (phaseId) => {
      set((state) => {
        state.focusedPhaseId = phaseId;
      });
    },

    exitFocusMode: () => {
      set((state) => {
        state.focusedPhaseId = null;
      });
    },

    // --- Getters ---
    getPhaseById: (phaseId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.phases.find((p) => p.id === phaseId);
    },

    getTaskById: (taskId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;

      for (const phase of currentProject.phases) {
        const task = phase.tasks.find((t) => t.id === taskId);
        if (task) {
          return { task, phase };
        }
      }
      return undefined;
    },

    getMilestoneById: (milestoneId) => {
      const { currentProject } = get();
      if (!currentProject) return undefined;
      return currentProject.milestones.find((m) => m.id === milestoneId);
    },

    getProjectDuration: () => {
      const { currentProject } = get();
      if (!currentProject || currentProject.phases.length === 0) return null;

      const allDates = [
        ...currentProject.phases.map((p) => new Date(p.startDate)),
        ...currentProject.phases.map((p) => new Date(p.endDate)),
      ];

      const startDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
      const endDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
      const durationDays = differenceInDays(endDate, startDate);

      return { startDate, endDate, durationDays };
    },

    getWorkingDays: (startDate, endDate) => {
      const { currentProject } = get();
      if (!currentProject) return 0;

      return calculateWorkingDaysInclusive(
        startDate,
        endDate,
        currentProject.holidays
      );
    },
  }))
);
export { useGanttToolStoreV2 as useGanttToolStore };
