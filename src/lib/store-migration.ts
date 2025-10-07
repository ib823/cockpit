/**
 * STORE MIGRATION UTILITY
 *
 * Migrates data from legacy stores to unified project store.
 * Ensures zero data loss during transition.
 *
 * Legacy stores:
 * - presales-store (no localStorage persistence)
 * - project-store (localStorage: 'project-storage')
 * - timeline-store (no localStorage persistence)
 *
 * New store:
 * - unified-project-store (localStorage: 'unified-project-storage')
 *
 * Per spec: Roadmap_and_DoD.md (P2-1)
 */

import type { UnifiedProject } from '@/stores/unified-project-store';
import { STORE_VERSION } from '@/stores/unified-project-store';

// --- Legacy Store Types ---

interface LegacyProjectStore {
  state: {
    mode: 'capture' | 'decide' | 'plan' | 'present';
    projectId: string;
    timelineIsStale: boolean;
    lastGeneratedAt: string | null;
    manualOverrides: any[];
    leftPanelWidth: number;
    rightPanelWidth: number;
  };
  version: number;
}

interface LegacyPresalesStore {
  state: {
    projectId: string | null;
    chips: any[];
    decisions: Record<string, any>;
    mode: string;
    completeness: {
      score: number;
      gaps: string[];
      blockers: string[];
      canProceed: boolean;
    };
    suggestions: string[];
  };
}

interface LegacyTimelineStore {
  state: {
    projectId: string | null;
    profile: any | null;
    phases: any[];
    resources: any[];
    holidays: any[];
    selectedPackages: string[];
    selectedPhaseId: string | null;
    zoomLevel: 'week' | 'month' | 'quarter';
    clientPresentationMode: boolean;
    phaseColors: Record<string, string>;
    resourcePlan: any | null;
    region: string;
  };
}

// --- Migration Functions ---

/**
 * Check if legacy data exists in localStorage
 */
export function hasLegacyData(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const projectStore = localStorage.getItem('project-storage');
    return !!projectStore;
  } catch {
    return false;
  }
}

/**
 * Read legacy stores from localStorage
 */
function readLegacyStores(): {
  project: LegacyProjectStore | null;
  presales: LegacyPresalesStore | null;
  timeline: LegacyTimelineStore | null;
} {
  if (typeof window === 'undefined') {
    return { project: null, presales: null, timeline: null };
  }

  try {
    const projectRaw = localStorage.getItem('project-storage');
    const presalesRaw = localStorage.getItem('presales-storage'); // May not exist
    const timelineRaw = localStorage.getItem('timeline-storage'); // May not exist

    return {
      project: projectRaw ? JSON.parse(projectRaw) : null,
      presales: presalesRaw ? JSON.parse(presalesRaw) : null,
      timeline: timelineRaw ? JSON.parse(timelineRaw) : null,
    };
  } catch (error) {
    console.error('[Migration] Failed to read legacy stores:', error);
    return { project: null, presales: null, timeline: null };
  }
}

/**
 * Migrate legacy data to unified project format
 */
export function migrateLegacyToUnified(): UnifiedProject | null {
  const { project, presales, timeline } = readLegacyStores();

  if (!project) {
    console.log('[Migration] No legacy project store found');
    return null;
  }

  console.log('[Migration] 🔄 Migrating legacy data to unified store...');

  try {
    const projectId = project.state.projectId || `migrated-${Date.now()}`;

    const unifiedProject: UnifiedProject = {
      // Meta
      id: projectId,
      name: 'Migrated Project',
      version: STORE_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
      tier: 'presales',

      // Estimator (not available from legacy)
      estimator: null,

      // Presales (from presales-store or defaults)
      presales: {
        chips: presales?.state.chips || [],
        decisions: presales?.state.decisions || {},
        completeness: presales?.state.completeness || {
          score: 0,
          gaps: [],
          blockers: [],
          canProceed: false,
        },
        suggestions: presales?.state.suggestions || [],
      },

      // Timeline (from timeline-store or defaults)
      timeline: {
        profile: timeline?.state.profile || null,
        phases: timeline?.state.phases || [],
        resources: timeline?.state.resources || [],
        holidays: timeline?.state.holidays || [],
        selectedPackages: timeline?.state.selectedPackages || [],
        selectedPhaseId: timeline?.state.selectedPhaseId || null,
        resourcePlan: timeline?.state.resourcePlan || null,
        region: timeline?.state.region || 'US-East',
        phaseColors: timeline?.state.phaseColors || {},
      },

      // Workflow
      mode: project.state.mode,
      timelineIsStale: project.state.timelineIsStale,
      lastGeneratedAt: project.state.lastGeneratedAt
        ? new Date(project.state.lastGeneratedAt)
        : null,
      manualOverrides: project.state.manualOverrides.map((override) => ({
        ...override,
        timestamp: new Date(override.timestamp),
      })),

      // UI
      ui: {
        zoomLevel: timeline?.state.zoomLevel || 'month',
        clientPresentationMode: timeline?.state.clientPresentationMode || false,
        leftPanelWidth: project.state.leftPanelWidth,
        rightPanelWidth: project.state.rightPanelWidth,
      },
    };

    console.log('[Migration] ✅ Migration successful:', {
      projectId: unifiedProject.id,
      chips: unifiedProject.presales.chips.length,
      phases: unifiedProject.timeline.phases.length,
      mode: unifiedProject.mode,
    });

    return unifiedProject;
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    return null;
  }
}

/**
 * Backup legacy stores before migration
 */
export function backupLegacyStores(): void {
  if (typeof window === 'undefined') return;

  try {
    const { project, presales, timeline } = readLegacyStores();
    const backup = {
      timestamp: new Date().toISOString(),
      project,
      presales,
      timeline,
    };

    localStorage.setItem('legacy-stores-backup', JSON.stringify(backup));
    console.log('[Migration] ✅ Legacy stores backed up');
  } catch (error) {
    console.error('[Migration] ⚠️ Backup failed:', error);
  }
}

/**
 * Restore from backup
 */
export function restoreFromBackup(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const backupRaw = localStorage.getItem('legacy-stores-backup');
    if (!backupRaw) {
      console.warn('[Migration] No backup found');
      return false;
    }

    const backup = JSON.parse(backupRaw);

    if (backup.project) {
      localStorage.setItem('project-storage', JSON.stringify(backup.project));
    }
    if (backup.presales) {
      localStorage.setItem('presales-storage', JSON.stringify(backup.presales));
    }
    if (backup.timeline) {
      localStorage.setItem('timeline-storage', JSON.stringify(backup.timeline));
    }

    console.log('[Migration] ✅ Restored from backup');
    return true;
  } catch (error) {
    console.error('[Migration] ❌ Restore failed:', error);
    return false;
  }
}

/**
 * Clear legacy stores after successful migration
 */
export function clearLegacyStores(): void {
  if (typeof window === 'undefined') return;

  try {
    // Don't actually delete yet - keep for safety
    // localStorage.removeItem('project-storage');
    // localStorage.removeItem('presales-storage');
    // localStorage.removeItem('timeline-storage');

    // Instead, mark as migrated
    localStorage.setItem('legacy-stores-migrated', 'true');
    console.log('[Migration] ✅ Legacy stores marked as migrated');
  } catch (error) {
    console.error('[Migration] Failed to clear legacy stores:', error);
  }
}

/**
 * Check if migration has already been performed
 */
export function isMigrationComplete(): boolean {
  if (typeof window === 'undefined') return false;

  return localStorage.getItem('legacy-stores-migrated') === 'true';
}

/**
 * Auto-migration on app load
 * Call this from app initialization
 */
export function autoMigrateIfNeeded(): UnifiedProject | null {
  // Skip if already migrated
  if (isMigrationComplete()) {
    console.log('[Migration] ℹ️ Migration already complete, skipping');
    return null;
  }

  // Skip if no legacy data
  if (!hasLegacyData()) {
    console.log('[Migration] ℹ️ No legacy data found, skipping');
    return null;
  }

  console.log('[Migration] 🚀 Starting auto-migration...');

  // Backup first
  backupLegacyStores();

  // Migrate
  const migratedProject = migrateLegacyToUnified();

  if (migratedProject) {
    // Mark as migrated
    clearLegacyStores();
    return migratedProject;
  }

  return null;
}
