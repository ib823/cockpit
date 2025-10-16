/**
 * Gantt Tool - localStorage to Database Migration
 *
 * One-time migration utility to move existing localStorage projects to database.
 */

import type { GanttProject } from '@/types/gantt-tool';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

/**
 * Helper to ensure date is in YYYY-MM-DD format
 */
function formatDateForAPI(date: string | Date): string {
  if (!date) return new Date().toISOString().split('T')[0];

  if (typeof date === 'string') {
    // If it's already a string, extract just the date part
    return date.split('T')[0];
  }

  // If it's a Date object, format it
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Migrate all localStorage projects to database via API
 */
export async function migrateLocalStorageToDatabase(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
  };

  try {
    // Check authentication first
    const authCheck = await fetch('/api/gantt-tool/projects');
    if (authCheck.status === 401) {
      console.error('[Migration] User not authenticated');
      result.success = false;
      result.errors.push('Authentication required. Please log in and try again.');
      return result;
    }

    // Read from localStorage
    const storageKey = 'gantt-tool-storage';
    const rawData = localStorage.getItem(storageKey);

    if (!rawData) {
      return result; // No data to migrate
    }

    const parsed = JSON.parse(rawData);
    const localProjects: GanttProject[] = parsed.state?.projects || [];

    if (localProjects.length === 0) {
      return result; // No projects to migrate
    }

    console.log(`[Migration] Starting migration of ${localProjects.length} projects`);
    console.log('[Migration] Sample project:', localProjects[0]);

    // Migrate each project
    for (const project of localProjects) {
      try {
        // Step 1: Create the project with basic info
        console.log(`[Migration] Creating project "${project.name}"...`);

        const projectPayload = {
          name: project.name,
          description: project.description || '',
          startDate: formatDateForAPI(project.startDate),
          viewSettings: project.viewSettings,
          budget: project.budget,
        };

        console.log(`[Migration] Project payload:`, projectPayload);

        const response = await fetch('/api/gantt-tool/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectPayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`[Migration] Failed to create project "${project.name}":`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }

        const { project: createdProject } = await response.json();

        // Step 2: Add phases, tasks, milestones, etc. via PATCH
        console.log(`[Migration] Adding full data to project "${project.name}"...`);

        const fullProjectData = {
          phases: (project.phases || []).map(phase => ({
            ...phase,
            startDate: formatDateForAPI(phase.startDate),
            endDate: formatDateForAPI(phase.endDate),
            tasks: (phase.tasks || []).map(task => ({
              ...task,
              startDate: formatDateForAPI(task.startDate),
              endDate: formatDateForAPI(task.endDate),
            })),
          })),
          milestones: (project.milestones || []).map(m => ({
            ...m,
            date: formatDateForAPI(m.date),
          })),
          holidays: (project.holidays || []).map(h => ({
            ...h,
            date: formatDateForAPI(h.date),
          })),
          resources: (project.resources || []).map((r: any) => ({
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
            // Provide defaults for new cost tracking fields
            rateType: r.rateType || null,
            hourlyRate: r.hourlyRate || null,
            dailyRate: r.dailyRate || null,
            currency: r.currency || null,
            utilizationTarget: r.utilizationTarget || null,
          })),
        };

        const updateResponse = await fetch(`/api/gantt-tool/projects/${createdProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fullProjectData),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`[Migration] Failed to update project "${project.name}":`, {
            status: updateResponse.status,
            statusText: updateResponse.statusText,
            error: errorData,
          });
          throw new Error(`HTTP ${updateResponse.status}: ${errorData.error || updateResponse.statusText}`);
        }

        result.migratedCount++;
        console.log(`[Migration] ✓ Successfully migrated project "${project.name}"`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Migration] ✗ Failed to migrate project "${project.name}":`, error);
        result.errors.push(`"${project.name}": ${errorMsg}`);
        result.success = false;
      }
    }

    console.log(`[Migration] Completed: ${result.migratedCount}/${localProjects.length} projects migrated`);
    if (result.errors.length > 0) {
      console.error('[Migration] Errors:', result.errors);
    }

    // If all successful, backup and clear localStorage
    if (result.success && result.migratedCount > 0) {
      const backup = localStorage.getItem(storageKey);
      localStorage.setItem(`${storageKey}-backup-${Date.now()}`, backup!);
      localStorage.removeItem(storageKey);
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Check if localStorage has projects that need migration
 */
export function hasLocalStorageProjects(): boolean {
  try {
    const rawData = localStorage.getItem('gantt-tool-storage');
    if (!rawData) return false;

    const parsed = JSON.parse(rawData);
    const projects = parsed.state?.projects || [];
    return projects.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get count of projects in localStorage
 */
export function getLocalStorageProjectCount(): number {
  try {
    const rawData = localStorage.getItem('gantt-tool-storage');
    if (!rawData) return 0;

    const parsed = JSON.parse(rawData);
    const projects = parsed.state?.projects || [];
    return projects.length;
  } catch {
    return 0;
  }
}
