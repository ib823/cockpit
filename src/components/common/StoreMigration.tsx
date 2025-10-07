'use client';

import { useEffect, useRef } from 'react';
import { autoMigrateIfNeeded } from '@/lib/store-migration';
import { useUnifiedProjectStore } from '@/stores/unified-project-store';

/**
 * StoreMigration Component
 *
 * Handles automatic migration from legacy stores to unified store on app load.
 *
 * Migration process:
 * 1. Check if migration needed (legacy data exists + not already migrated)
 * 2. Backup legacy stores to localStorage
 * 3. Migrate data to unified format
 * 4. Add project to unified store
 * 5. Mark migration as complete
 *
 * Per spec: Roadmap_and_DoD.md (P2-1)
 */
export function StoreMigration() {
  const hasMigrated = useRef(false);
  const addMigratedProject = useUnifiedProjectStore((state) => state.addMigratedProject);

  useEffect(() => {
    // Only run once per app load
    if (hasMigrated.current) return;
    hasMigrated.current = true;

    // Attempt auto-migration
    autoMigrateIfNeeded((project) => {
      // Add migrated project to unified store
      addMigratedProject(project);
    });
  }, [addMigratedProject]);

  // This component doesn't render anything
  return null;
}
