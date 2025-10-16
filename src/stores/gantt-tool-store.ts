/**
 * Gantt Tool - Zustand Store
 *
 * State management for the standalone Gantt chart tool.
 * Features: Project CRUD, Phase/Task/Milestone management, localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  ResourceConflict,
  ProjectBudget,
} from '@/types/gantt-tool';
import { PHASE_COLOR_PRESETS } from '@/types/gantt-tool';
import { differenceInDays, addDays, format } from 'date-fns';
import { adjustDatesToWorkingDays, calculateWorkingDaysInclusive, addWorkingDays } from '@/lib/gantt-tool/working-days';
import { createDefaultResources } from '@/lib/gantt-tool/default-resources';
import { applyOrgChartTemplate, type OrgChartTemplate } from '@/lib/gantt-tool/org-chart-templates';

interface GanttToolState {
  // Core Data
  currentProject: GanttProject | null;
  projects: GanttProject[];

  // History (Undo/Redo)
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
  focusedPhaseId: string | null; // RTS-style focus mode: zoom to single phase

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Actions - Project Management
  createProject: (name: string, startDate: string, description?: string) => void;
  createProjectFromTemplate: (template: any, name: string, startDate: string) => void;
  loadProject: (projectId: string) => void;
  unloadCurrentProject: () => void;
  updateProjectName: (name: string) => void;
  updateProjectDescription: (description: string) => void;
  deleteProject: (projectId: string) => void;
  exportProject: (format: 'json') => void;
  importProject: (data: GanttProject) => void;

  // Actions - Phase Management
  addPhase: (data: PhaseFormData) => void;
  updatePhase: (phaseId: string, updates: Partial<GanttPhase>) => void;
  deletePhase: (phaseId: string) => void;
  togglePhaseCollapse: (phaseId: string) => void;
  movePhase: (phaseId: string, newStartDate: string, newEndDate: string) => void;
  resizePhase: (phaseId: string, startDate: string, endDate: string) => void;
  reorderPhase: (phaseId: string, direction: 'up' | 'down') => void;
  autoAlignPhase: (phaseId: string) => void;

  // Actions - Task Management
  addTask: (data: TaskFormData) => void;
  updateTask: (taskId: string, phaseId: string, updates: Partial<GanttTask>) => void;
  deleteTask: (taskId: string, phaseId: string) => void;
  moveTask: (taskId: string, phaseId: string, newStartDate: string, newEndDate: string) => void;
  updateTaskProgress: (taskId: string, phaseId: string, progress: number) => void;
  reorderTask: (taskId: string, phaseId: string, direction: 'up' | 'down') => void;
  autoAlignTask: (taskId: string, phaseId: string) => void;

  // Actions - Milestone Management
  addMilestone: (data: MilestoneFormData) => void;
  updateMilestone: (milestoneId: string, updates: Partial<GanttMilestone>) => void;
  deleteMilestone: (milestoneId: string) => void;
  moveMilestone: (milestoneId: string, newDate: string) => void;

  // Actions - Holiday Management
  addHoliday: (data: HolidayFormData) => void;
  deleteHoliday: (holidayId: string) => void;

  // Actions - Resource Management
  addResource: (data: ResourceFormData) => void;
  updateResource: (resourceId: string, updates: Partial<Resource>) => void;
  deleteResource: (resourceId: string) => void;
  getResourceById: (resourceId: string) => Resource | undefined;

  // Actions - Organization Hierarchy
  assignManager: (resourceId: string, managerId: string | null) => boolean;
  unassignManager: (resourceId: string) => void;
  getDirectReports: (managerId: string) => Resource[];
  validateNoCircularReporting: (resourceId: string, newManagerId: string) => boolean;
  applyOrgChartTemplate: (template: OrgChartTemplate, replaceExisting: boolean) => void;

  // Actions - Task Resource Assignment
  assignResourceToTask: (taskId: string, phaseId: string, resourceId: string, assignmentNotes: string, allocationPercentage: number) => void;
  unassignResourceFromTask: (taskId: string, phaseId: string, assignmentId: string) => void;
  updateTaskResourceAssignment: (taskId: string, phaseId: string, assignmentId: string, assignmentNotes: string, allocationPercentage: number) => void;
  getResourceConflicts: (resourceId: string, taskId: string, taskStartDate: string, taskEndDate: string) => ResourceConflict[];

  // Actions - Phase Resource Assignment (PM only)
  assignResourceToPhase: (phaseId: string, resourceId: string, assignmentNotes: string, allocationPercentage: number) => void;
  unassignResourceFromPhase: (phaseId: string, assignmentId: string) => void;
  updatePhaseResourceAssignment: (phaseId: string, assignmentId: string, assignmentNotes: string, allocationPercentage: number) => void;

  // Actions - Budget Management
  updateProjectBudget: (budget: ProjectBudget) => void;

  // Actions - View Settings
  updateViewSettings: (updates: Partial<GanttViewSettings>) => void;
  setZoomLevel: (level: GanttViewSettings['zoomLevel']) => void;
  toggleWeekends: () => void;
  toggleHolidays: () => void;
  toggleMilestones: () => void;
  toggleTitles: () => void;
  setBarDurationDisplay: (display: 'wd' | 'cd' | 'resource' | 'dates' | 'all' | 'clean') => void;

  // Actions - UI State
  openSidePanel: (mode: SidePanelState['mode'], itemType: SidePanelState['itemType'], itemId?: string) => void;
  closeSidePanel: () => void;
  selectItem: (itemId: string, itemType: SelectionState['selectedItemType']) => void;
  clearSelection: () => void;

  // Actions - Focus Mode (RTS Minimap)
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
  showTitles: true, // Show phase/task titles by default
  barDurationDisplay: 'all', // Show all information (WD, CD, resources, dates) by default
};

// Helper function to deep clone a project for history
function cloneProject(project: GanttProject | null): GanttProject | null {
  if (!project) return null;
  return JSON.parse(JSON.stringify(project));
}

// Helper function to generate default resources for a new project
// Now uses comprehensive default resources from our centralized configuration
function generateDefaultResources(): Resource[] {
  return createDefaultResources();
}

export const useGanttToolStore = create<GanttToolState>()(
  persist(
    immer((set, get) => ({
      // Initial State
      currentProject: null,
      projects: [],
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
        const { currentProject, history, projects } = get();
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

          // Update in projects array
          const projectIndex = state.projects.findIndex((p) => p.id === previousState.id);
          if (projectIndex !== -1) {
            state.projects[projectIndex] = previousState;
          }
        });
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

          // Update in projects array
          const projectIndex = state.projects.findIndex((p) => p.id === nextState.id);
          if (projectIndex !== -1) {
            state.projects[projectIndex] = nextState;
          }
        });
      },

      // --- Project Management ---

      createProject: (name, startDate, description) => {
        const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const newProject: GanttProject = {
          id: projectId,
          name,
          description,
          startDate,
          phases: [],
          milestones: [],
          holidays: [],
          resources: generateDefaultResources(),
          viewSettings: { ...DEFAULT_VIEW_SETTINGS },
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.projects.push(newProject);
          state.currentProject = newProject;
          state.manuallyUnloaded = false; // Reset flag when creating a project
        });
      },

      createProjectFromTemplate: (template, name, startDate) => {
        const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        // Calculate date offset: how many days to shift all dates
        const templateFirstDate = new Date(template.phases[0]?.startDate || startDate);
        const newStartDate = new Date(startDate);
        const dayOffset = differenceInDays(newStartDate, templateFirstDate);

        // Helper to adjust dates
        const adjustDate = (dateStr: string) => {
          const date = new Date(dateStr);
          return format(addDays(date, dayOffset), 'yyyy-MM-dd');
        };

        // Generate unique IDs and adjust dates for phases
        const phases: GanttPhase[] = template.phases.map((phaseTemplate: any) => {
          const phaseId = `phase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Generate unique IDs and adjust dates for tasks
          const tasks: GanttTask[] = phaseTemplate.tasks.map((taskTemplate: any) => {
            const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            return {
              id: taskId,
              phaseId: phaseId,
              name: taskTemplate.name,
              description: taskTemplate.description || '',
              startDate: adjustDate(taskTemplate.startDate),
              endDate: adjustDate(taskTemplate.endDate),
              dependencies: [],
              assignee: '',
              progress: 0,
              resourceAssignments: [],
            };
          });

          return {
            id: phaseId,
            name: phaseTemplate.name,
            description: phaseTemplate.description || '',
            color: phaseTemplate.color,
            startDate: adjustDate(phaseTemplate.startDate),
            endDate: adjustDate(phaseTemplate.endDate),
            tasks,
            collapsed: false,
            dependencies: [],
            phaseResourceAssignments: [],
          };
        });

        // Generate unique IDs and adjust dates for milestones
        const milestones: GanttMilestone[] = template.milestones.map((milestoneTemplate: any) => ({
          id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: milestoneTemplate.name,
          description: milestoneTemplate.description || '',
          date: adjustDate(milestoneTemplate.date),
          icon: milestoneTemplate.icon || '🎯',
          color: milestoneTemplate.color || '#10B981',
        }));

        const newProject: GanttProject = {
          id: projectId,
          name,
          description: template.description || '',
          startDate,
          phases,
          milestones,
          holidays: [],
          resources: generateDefaultResources(),
          viewSettings: { ...DEFAULT_VIEW_SETTINGS },
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          state.projects.push(newProject);
          state.currentProject = newProject;
          state.manuallyUnloaded = false;
        });
      },

      loadProject: (projectId) => {
        set((state) => {
          const project = state.projects.find((p) => p.id === projectId);
          if (project) {
            // Ensure project has default resources (for backwards compatibility)
            if (!project.resources || project.resources.length === 0) {
              project.resources = generateDefaultResources();
              project.updatedAt = new Date().toISOString();
            }

            state.currentProject = project;
            state.error = null;
            state.manuallyUnloaded = false; // Reset flag when loading a project
          } else {
            state.error = `Project ${projectId} not found`;
          }
        });
      },

      unloadCurrentProject: () => {
        set((state) => {
          state.currentProject = null;
          state.manuallyUnloaded = true; // Mark as manually unloaded
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

      updateProjectName: (name) => {
        set((state) => {
          if (state.currentProject) {
            state.currentProject.name = name;
            state.currentProject.updatedAt = new Date().toISOString();
            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              project.name = name;
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      updateProjectDescription: (description) => {
        set((state) => {
          if (state.currentProject) {
            state.currentProject.description = description;
            state.currentProject.updatedAt = new Date().toISOString();
            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              project.description = description;
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      deleteProject: (projectId) => {
        set((state) => {
          state.projects = state.projects.filter((p) => p.id !== projectId);
          if (state.currentProject?.id === projectId) {
            state.currentProject = state.projects[0] || null;
          }
        });
      },

      exportProject: () => {
        const { currentProject } = get();
        if (!currentProject) return;

        const dataStr = JSON.stringify(currentProject, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        const exportFileDefaultName = `${currentProject.name.replace(/\s+/g, '-')}-gantt.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },

      importProject: (data) => {
        set((state) => {
          // Generate new ID to avoid conflicts
          const importedProject = {
            ...data,
            id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date().toISOString(),
          };
          state.projects.push(importedProject);
          state.currentProject = importedProject;
          state.manuallyUnloaded = false; // Reset flag when importing a project
        });
      },

      // --- Phase Management ---

      addPhase: (data) => {
        set((state) => {
          if (!state.currentProject) return;

          // Save to history before mutation
          const snapshot = cloneProject(state.currentProject);
          if (snapshot) {
            state.history.past.push(snapshot);
            state.history.future = []; // Clear redo stack
            // Keep history limited to last 50 actions
            if (state.history.past.length > 50) {
              state.history.past = state.history.past.slice(-50);
            }
          }

          // Auto-adjust dates to working days
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
          };

          state.currentProject.phases.push(newPhase);
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.phases = [...state.currentProject.phases];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      updatePhase: (phaseId, updates) => {
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
            // Auto-adjust dates to working days if startDate or endDate are being updated
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

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectPhase = project.phases.find((p) => p.id === phaseId);
              if (projectPhase) {
                Object.assign(projectPhase, updates);
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      deletePhase: (phaseId) => {
        set((state) => {
          if (!state.currentProject) return;

          // Save to history
          const snapshot = cloneProject(state.currentProject);
          if (snapshot) {
            state.history.past.push(snapshot);
            state.history.future = [];
            if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
          }

          state.currentProject.phases = state.currentProject.phases.filter((p) => p.id !== phaseId);
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.phases = state.currentProject.phases;
            project.updatedAt = state.currentProject.updatedAt;
          }

          // Clear selection if deleted
          if (state.selection.selectedItemId === phaseId) {
            state.selection.selectedItemId = null;
            state.selection.selectedItemType = null;
          }
        });
      },

      togglePhaseCollapse: (phaseId) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (phase) {
            phase.collapsed = !phase.collapsed;
          }
        });
      },

      movePhase: (phaseId, newStartDate, newEndDate) => {
        get().updatePhase(phaseId, { startDate: newStartDate, endDate: newEndDate });
      },

      resizePhase: (phaseId, startDate, endDate) => {
        get().updatePhase(phaseId, { startDate, endDate });
      },

      reorderPhase: (phaseId, direction) => {
        set((state) => {
          if (!state.currentProject) return;

          const phases = state.currentProject.phases;
          const currentIndex = phases.findIndex((p) => p.id === phaseId);

          if (currentIndex === -1) return;

          // Calculate new index
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

          // Check bounds
          if (newIndex < 0 || newIndex >= phases.length) return;

          // Swap phases
          [phases[currentIndex], phases[newIndex]] = [phases[newIndex], phases[currentIndex]];

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.phases = [...phases];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      autoAlignPhase: (phaseId) => {
        set((state) => {
          if (!state.currentProject) return;

          const phases = state.currentProject.phases;
          const currentIndex = phases.findIndex((p) => p.id === phaseId);

          if (currentIndex === -1) return;

          // Cannot auto-align the first phase (no previous phase)
          if (currentIndex === 0) {
            alert('Cannot auto-align the first phase in the project. It has no previous phase to align to.');
            return;
          }

          const currentPhase = phases[currentIndex];
          const previousPhase = phases[currentIndex - 1];

          // Calculate working days duration of the current phase
          const phaseWorkingDays = calculateWorkingDaysInclusive(
            currentPhase.startDate,
            currentPhase.endDate,
            state.currentProject.holidays
          );

          // Calculate new start date: 1 working day after previous phase ends
          const previousEndDate = new Date(previousPhase.endDate);
          const newStartDate = addWorkingDays(
            previousEndDate.toISOString().split('T')[0],
            1,
            state.currentProject.holidays
          );

          // Calculate new end date: maintain working days duration
          const newEndDate = addWorkingDays(
            newStartDate.toISOString().split('T')[0],
            phaseWorkingDays,
            state.currentProject.holidays
          );

          // Update phase dates
          currentPhase.startDate = newStartDate.toISOString().split('T')[0];
          currentPhase.endDate = newEndDate.toISOString().split('T')[0];

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              projectPhase.startDate = currentPhase.startDate;
              projectPhase.endDate = currentPhase.endDate;
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      // --- Task Management ---

      addTask: (data) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === data.phaseId);
          if (!phase) return;

          // Save to history
          const snapshot = cloneProject(state.currentProject);
          if (snapshot) {
            state.history.past.push(snapshot);
            state.history.future = [];
            if (state.history.past.length > 50) state.history.past = state.history.past.slice(-50);
          }

          // Auto-adjust dates to working days
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === data.phaseId);
            if (projectPhase) {
              projectPhase.tasks = [...phase.tasks];
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      updateTask: (taskId, phaseId, updates) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase) return;

          const task = phase.tasks.find((t) => t.id === taskId);
          if (task) {
            // Auto-adjust dates to working days if startDate or endDate are being updated
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

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectPhase = project.phases.find((p) => p.id === phaseId);
              if (projectPhase) {
                const projectTask = projectPhase.tasks.find((t) => t.id === taskId);
                if (projectTask) {
                  Object.assign(projectTask, updates);
                }
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      deleteTask: (taskId, phaseId) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase) return;

          phase.tasks = phase.tasks.filter((t) => t.id !== taskId);
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              projectPhase.tasks = phase.tasks;
            }
            project.updatedAt = state.currentProject.updatedAt;
          }

          // Clear selection if deleted
          if (state.selection.selectedItemId === taskId) {
            state.selection.selectedItemId = null;
            state.selection.selectedItemType = null;
          }
        });
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

          // Calculate new index
          const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

          // Check bounds
          if (newIndex < 0 || newIndex >= tasks.length) return;

          // Swap tasks
          [tasks[currentIndex], tasks[newIndex]] = [tasks[newIndex], tasks[currentIndex]];

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              projectPhase.tasks = [...tasks];
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      autoAlignTask: (taskId, phaseId) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase) return;

          const tasks = phase.tasks;
          const currentIndex = tasks.findIndex((t) => t.id === taskId);

          if (currentIndex === -1) return;

          // Cannot auto-align the first task (no previous task)
          if (currentIndex === 0) {
            alert('Cannot auto-align the first task in the phase. It has no previous task to align to.');
            return;
          }

          const currentTask = tasks[currentIndex];
          const previousTask = tasks[currentIndex - 1];

          // Calculate working days duration of the current task
          const taskWorkingDays = calculateWorkingDaysInclusive(
            currentTask.startDate,
            currentTask.endDate,
            state.currentProject.holidays
          );

          // Calculate new start date: 1 working day after previous task ends
          const previousEndDate = new Date(previousTask.endDate);
          const newStartDate = addWorkingDays(
            previousEndDate.toISOString().split('T')[0],
            1,
            state.currentProject.holidays
          );

          // Calculate new end date: maintain working days duration
          const newEndDate = addWorkingDays(
            newStartDate.toISOString().split('T')[0],
            taskWorkingDays,
            state.currentProject.holidays
          );

          // Validate that new dates are within phase boundaries
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

          // Update task dates
          currentTask.startDate = newStartDate.toISOString().split('T')[0];
          currentTask.endDate = newEndDate.toISOString().split('T')[0];

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              const projectTask = projectPhase.tasks.find((t) => t.id === taskId);
              if (projectTask) {
                projectTask.startDate = currentTask.startDate;
                projectTask.endDate = currentTask.endDate;
              }
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      // --- Milestone Management ---

      addMilestone: (data) => {
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.milestones = [...state.currentProject.milestones];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      updateMilestone: (milestoneId, updates) => {
        set((state) => {
          if (!state.currentProject) return;

          const milestone = state.currentProject.milestones.find((m) => m.id === milestoneId);
          if (milestone) {
            Object.assign(milestone, updates);
            state.currentProject.updatedAt = new Date().toISOString();

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectMilestone = project.milestones.find((m) => m.id === milestoneId);
              if (projectMilestone) {
                Object.assign(projectMilestone, updates);
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      deleteMilestone: (milestoneId) => {
        set((state) => {
          if (!state.currentProject) return;

          state.currentProject.milestones = state.currentProject.milestones.filter((m) => m.id !== milestoneId);
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.milestones = state.currentProject.milestones;
            project.updatedAt = state.currentProject.updatedAt;
          }

          // Clear selection if deleted
          if (state.selection.selectedItemId === milestoneId) {
            state.selection.selectedItemId = null;
            state.selection.selectedItemType = null;
          }
        });
      },

      moveMilestone: (milestoneId, newDate) => {
        get().updateMilestone(milestoneId, { date: newDate });
      },

      // --- Holiday Management ---

      addHoliday: (data) => {
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.holidays = [...state.currentProject.holidays];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      deleteHoliday: (holidayId) => {
        set((state) => {
          if (!state.currentProject) return;

          state.currentProject.holidays = state.currentProject.holidays.filter((h) => h.id !== holidayId);
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.holidays = state.currentProject.holidays;
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      // --- View Settings ---

      updateViewSettings: (updates) => {
        set((state) => {
          if (!state.currentProject) return;

          Object.assign(state.currentProject.viewSettings, updates);

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings = { ...state.currentProject.viewSettings };
          }
        });
      },

      setZoomLevel: (level) => {
        get().updateViewSettings({ zoomLevel: level });
      },

      toggleWeekends: () => {
        set((state) => {
          if (!state.currentProject) return;
          state.currentProject.viewSettings.showWeekends = !state.currentProject.viewSettings.showWeekends;

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings.showWeekends = state.currentProject.viewSettings.showWeekends;
          }
        });
      },

      toggleHolidays: () => {
        set((state) => {
          if (!state.currentProject) return;
          state.currentProject.viewSettings.showHolidays = !state.currentProject.viewSettings.showHolidays;

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings.showHolidays = state.currentProject.viewSettings.showHolidays;
          }
        });
      },

      toggleMilestones: () => {
        set((state) => {
          if (!state.currentProject) return;
          state.currentProject.viewSettings.showMilestones = !state.currentProject.viewSettings.showMilestones;

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings.showMilestones = state.currentProject.viewSettings.showMilestones;
          }
        });
      },

      toggleTitles: () => {
        set((state) => {
          if (!state.currentProject) return;
          const currentValue = state.currentProject.viewSettings.showTitles ?? true;
          state.currentProject.viewSettings.showTitles = !currentValue;

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings.showTitles = state.currentProject.viewSettings.showTitles;
          }
        });
      },

      setBarDurationDisplay: (display) => {
        set((state) => {
          if (!state.currentProject) return;
          state.currentProject.viewSettings.barDurationDisplay = display;

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.viewSettings.barDurationDisplay = display;
          }
        });
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

      // --- Focus Mode (RTS Minimap) ---

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

        // Use the working days utility that excludes both weekends and holidays
        return calculateWorkingDaysInclusive(
          startDate,
          endDate,
          currentProject.holidays
        );
      },

      // --- Resource Management ---

      addResource: (data) => {
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.resources = [...state.currentProject.resources];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      updateResource: (resourceId, updates) => {
        set((state) => {
          if (!state.currentProject) return;

          const resource = state.currentProject.resources.find((r) => r.id === resourceId);
          if (resource) {
            Object.assign(resource, updates);
            state.currentProject.updatedAt = new Date().toISOString();

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectResource = project.resources.find((r) => r.id === resourceId);
              if (projectResource) {
                Object.assign(projectResource, updates);
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      deleteResource: (resourceId) => {
        set((state) => {
          if (!state.currentProject) return;

          // Remove resource from library
          state.currentProject.resources = state.currentProject.resources.filter((r) => r.id !== resourceId);

          // Remove all assignments of this resource from tasks
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.resources = state.currentProject.resources;
            project.phases = [...state.currentProject.phases];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      getResourceById: (resourceId) => {
        const { currentProject } = get();
        if (!currentProject) return undefined;
        return currentProject.resources.find((r) => r.id === resourceId);
      },

      // --- Organization Hierarchy ---

      validateNoCircularReporting: (resourceId, newManagerId) => {
        const { currentProject } = get();
        if (!currentProject) return true;

        // Can't report to yourself
        if (resourceId === newManagerId) return false;

        // Walk up the management chain to check for circular reporting
        let currentManagerId: string | null | undefined = newManagerId;
        const visited = new Set<string>();

        while (currentManagerId) {
          // Circular reference detected
          if (currentManagerId === resourceId) return false;

          // Prevent infinite loops in case of data corruption
          if (visited.has(currentManagerId)) return false;
          visited.add(currentManagerId);

          // Move up the chain
          const manager = currentProject.resources.find((r) => r.id === currentManagerId);
          currentManagerId = manager?.managerResourceId;
        }

        return true;
      },

      assignManager: (resourceId, managerId) => {
        const { currentProject, validateNoCircularReporting } = get();
        if (!currentProject) return false;

        // Validate manager exists if not null
        if (managerId !== null) {
          const managerExists = currentProject.resources.some((r) => r.id === managerId);
          if (!managerExists) {
            console.error(`Manager with ID ${managerId} not found`);
            return false;
          }

          // Validate no circular reporting
          if (!validateNoCircularReporting(resourceId, managerId)) {
            console.error('Circular reporting relationship detected');
            return false;
          }
        }

        set((state) => {
          if (!state.currentProject) return;

          const resource = state.currentProject.resources.find((r) => r.id === resourceId);
          if (resource) {
            resource.managerResourceId = managerId;
            state.currentProject.updatedAt = new Date().toISOString();

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectResource = project.resources.find((r) => r.id === resourceId);
              if (projectResource) {
                projectResource.managerResourceId = managerId;
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });

        return true;
      },

      unassignManager: (resourceId) => {
        set((state) => {
          if (!state.currentProject) return;

          const resource = state.currentProject.resources.find((r) => r.id === resourceId);
          if (resource) {
            resource.managerResourceId = null;
            state.currentProject.updatedAt = new Date().toISOString();

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectResource = project.resources.find((r) => r.id === resourceId);
              if (projectResource) {
                projectResource.managerResourceId = null;
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      getDirectReports: (managerId) => {
        const { currentProject } = get();
        if (!currentProject) return [];

        return currentProject.resources.filter((r) => r.managerResourceId === managerId);
      },

      applyOrgChartTemplate: (template, replaceExisting) => {
        set((state) => {
          if (!state.currentProject) return;

          // Convert template resources to actual resources
          const templateResources = applyOrgChartTemplate(template);

          if (replaceExisting) {
            // Replace all resources with template resources
            state.currentProject.resources = templateResources;
          } else {
            // Add template resources to existing ones (avoiding duplicates by name)
            const existingNames = new Set(state.currentProject.resources.map((r) => r.name));
            const newResources = templateResources.filter((r) => !existingNames.has(r.name));
            state.currentProject.resources.push(...newResources);
          }

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.resources = [...state.currentProject.resources];
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      // --- Task Resource Assignment ---

      assignResourceToTask: (taskId, phaseId, resourceId, assignmentNotes, allocationPercentage) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase) return;

          const task = phase.tasks.find((t) => t.id === taskId);
          if (!task) return;

          // Check if resource already assigned
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              const projectTask = projectPhase.tasks.find((t) => t.id === taskId);
              if (projectTask) {
                projectTask.resourceAssignments = [...(task.resourceAssignments || [])];
              }
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              const projectTask = projectPhase.tasks.find((t) => t.id === taskId);
              if (projectTask) {
                projectTask.resourceAssignments = [...task.resourceAssignments];
              }
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
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

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectPhase = project.phases.find((p) => p.id === phaseId);
              if (projectPhase) {
                const projectTask = projectPhase.tasks.find((t) => t.id === taskId);
                if (projectTask && projectTask.resourceAssignments) {
                  const projectAssignment = projectTask.resourceAssignments.find((a) => a.id === assignmentId);
                  if (projectAssignment) {
                    projectAssignment.assignmentNotes = assignmentNotes;
                    projectAssignment.allocationPercentage = allocationPercentage;
                  }
                }
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      getResourceConflicts: (resourceId, taskId, taskStartDate, taskEndDate) => {
        const { currentProject } = get();
        if (!currentProject) return [];

        const conflicts: ResourceConflict[] = [];
        const resource = currentProject.resources.find((r) => r.id === resourceId);
        if (!resource) return [];

        const newTaskStart = new Date(taskStartDate);
        const newTaskEnd = new Date(taskEndDate);

        // Check all tasks for conflicts
        currentProject.phases.forEach((phase) => {
          phase.tasks.forEach((task) => {
            // Skip the task being edited
            if (task.id === taskId) return;

            // Check if this task has the resource assigned
            const hasResource = task.resourceAssignments?.some((a) => a.resourceId === resourceId);
            if (!hasResource) return;

            // Check for date overlap
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);

            const hasOverlap =
              (newTaskStart >= taskStart && newTaskStart <= taskEnd) ||
              (newTaskEnd >= taskStart && newTaskEnd <= taskEnd) ||
              (newTaskStart <= taskStart && newTaskEnd >= taskEnd);

            if (hasOverlap) {
              conflicts.push({
                resourceId,
                resourceName: resource.name,
                conflictingTaskId: task.id,
                conflictingTaskName: task.name,
                conflictStartDate: task.startDate,
                conflictEndDate: task.endDate,
              });
            }
          });
        });

        return conflicts;
      },

      // --- Phase Resource Assignment (PM only) ---

      assignResourceToPhase: (phaseId, resourceId, assignmentNotes, allocationPercentage) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase) return;

          // Validate resource is PM category
          const resource = state.currentProject.resources.find((r) => r.id === resourceId);
          if (!resource || resource.category !== 'pm') {
            console.warn('Only PM resources can be assigned to phases');
            return;
          }

          // Check if resource already assigned
          if (phase.phaseResourceAssignments?.some((a) => a.resourceId === resourceId)) {
            console.warn('Resource already assigned to this phase');
            return;
          }

          const assignmentId = `phase-assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          const newAssignment = {
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

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              projectPhase.phaseResourceAssignments = [...(phase.phaseResourceAssignments || [])];
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },

      unassignResourceFromPhase: (phaseId, assignmentId) => {
        set((state) => {
          if (!state.currentProject) return;

          const phase = state.currentProject.phases.find((p) => p.id === phaseId);
          if (!phase || !phase.phaseResourceAssignments) return;

          phase.phaseResourceAssignments = phase.phaseResourceAssignments.filter((a) => a.id !== assignmentId);

          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            const projectPhase = project.phases.find((p) => p.id === phaseId);
            if (projectPhase) {
              projectPhase.phaseResourceAssignments = [...phase.phaseResourceAssignments];
            }
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
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

            // Update in projects array
            const project = state.projects.find((p) => p.id === state.currentProject?.id);
            if (project) {
              const projectPhase = project.phases.find((p) => p.id === phaseId);
              if (projectPhase && projectPhase.phaseResourceAssignments) {
                const projectAssignment = projectPhase.phaseResourceAssignments.find((a) => a.id === assignmentId);
                if (projectAssignment) {
                  projectAssignment.assignmentNotes = assignmentNotes;
                  projectAssignment.allocationPercentage = allocationPercentage;
                }
              }
              project.updatedAt = state.currentProject.updatedAt;
            }
          }
        });
      },

      // --- Budget Management ---

      updateProjectBudget: (budget) => {
        set((state) => {
          if (!state.currentProject) return;

          state.currentProject.budget = budget;
          state.currentProject.updatedAt = new Date().toISOString();

          // Update in projects array
          const project = state.projects.find((p) => p.id === state.currentProject?.id);
          if (project) {
            project.budget = budget;
            project.updatedAt = state.currentProject.updatedAt;
          }
        });
      },
    })),
    {
      name: 'gantt-tool-storage',
      partialize: (state) => ({
        currentProject: state.currentProject,
        projects: state.projects,
      }),
      version: 4,
      migrate: (persistedState: any, version: number) => {
        // Migration from version 1 to 2: Add resources array to projects
        if (version < 2) {
          if (persistedState.currentProject && !persistedState.currentProject.resources) {
            persistedState.currentProject.resources = [];
          }
          if (persistedState.projects) {
            persistedState.projects = persistedState.projects.map((project: any) => ({
              ...project,
              resources: project.resources || [],
            }));
          }
        }

        // Migration from version 2 to 3: Populate empty resources with defaults
        if (version < 3) {
          const defaultResources = createDefaultResources();

          // Populate currentProject resources if empty
          if (persistedState.currentProject) {
            if (!persistedState.currentProject.resources || persistedState.currentProject.resources.length === 0) {
              persistedState.currentProject.resources = defaultResources;
              persistedState.currentProject.updatedAt = new Date().toISOString();
            }
          }

          // Populate all projects resources if empty
          if (persistedState.projects) {
            persistedState.projects = persistedState.projects.map((project: any) => {
              if (!project.resources || project.resources.length === 0) {
                return {
                  ...project,
                  resources: createDefaultResources(), // Create fresh defaults for each project
                  updatedAt: new Date().toISOString(),
                };
              }
              return project;
            });
          }
        }

        // Migration from version 3 to 4: Add phaseResourceAssignments to all phases
        if (version < 4) {
          // Add to currentProject phases
          if (persistedState.currentProject?.phases) {
            persistedState.currentProject.phases.forEach((phase: any) => {
              if (!phase.phaseResourceAssignments) {
                phase.phaseResourceAssignments = [];
              }
            });
          }

          // Add to all projects phases
          if (persistedState.projects) {
            persistedState.projects.forEach((project: any) => {
              if (project.phases) {
                project.phases.forEach((phase: any) => {
                  if (!phase.phaseResourceAssignments) {
                    phase.phaseResourceAssignments = [];
                  }
                });
              }
            });
          }
        }

        return persistedState;
      },
    }
  )
);
